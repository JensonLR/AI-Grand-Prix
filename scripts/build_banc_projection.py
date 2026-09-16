#!/usr/bin/env python3
"""Build a compact, browser-safe sensorimotor projection from public BANC v888 data.

This is deliberately an offline preprocessing step. It never claims to preserve the full
158k-neuron biological system; it creates a provenance-rich population projection whose
edge weights are aggregated from the published v888 neuron-to-neuron v2 edgelist.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import urllib.request
from collections import Counter
from pathlib import Path

import pandas as pd
import pyarrow.compute as pc
import pyarrow.feather as feather

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / ".cache" / "banc-v888"
OUT = ROOT / "data" / "connectome" / "banc-v888-sensorimotor.json"
WEB_OUT = ROOT / "apps" / "web" / "public" / "connectome" / "banc-v888-sensorimotor.json"

BASE = "https://storage.googleapis.com/lee-lab_brain-and-nerve-cord-fly-connectome/compiled_data/banc_888"
FILES = {
    "meta": {
        "name": "banc_888_meta.feather",
        "url": f"{BASE}/banc_888_meta.feather",
        "size": 51_450_978,
        "md5": "8c8babff28b21c57ecc999e664560ef5",
    },
    "edges": {
        "name": "banc_888_edgelist_simple_v2.feather",
        "url": f"{BASE}/banc_888_edgelist_simple_v2.feather",
        "size": 298_465_650,
        "rows": 11_510_975,
    },
}

CORE_CLASSES = {
    "sensory",
    "sensory_ascending",
    "sensory_descending",
    "ascending",
    "descending",
    "motor",
    "visual_projection",
}


def digest(path: Path, algorithm: str) -> str:
    h = hashlib.new(algorithm)
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def download(spec: dict) -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / spec["name"]
    if not path.exists() or path.stat().st_size != spec["size"]:
        print(f"Downloading {spec['name']} ({spec['size'] / 1024 / 1024:.1f} MiB)…", flush=True)
        tmp = path.with_suffix(path.suffix + ".part")
        urllib.request.urlretrieve(spec["url"], tmp)
        tmp.replace(path)
    actual = path.stat().st_size
    if actual != spec["size"]:
        raise RuntimeError(f"{spec['name']} size mismatch: {actual} != {spec['size']}")
    if spec.get("md5"):
        actual_md5 = digest(path, "md5")
        if actual_md5 != spec["md5"]:
            raise RuntimeError(f"{spec['name']} md5 mismatch: {actual_md5} != {spec['md5']}")
    return path


def clean(value: object) -> str:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return ""
    return re.sub(r"\s+", " ", str(value).strip())


def truthy(value: object) -> bool:
    return clean(value).upper() in {"TRUE", "1", "T", "YES"}


def population_key(row: pd.Series) -> tuple[str, str, str]:
    sc = clean(row.super_class)
    if "sensory" in sc:
        role = "sensory"
        detail = clean(row.body_part_sensory) or clean(row.cell_class) or clean(row.cell_type) or sc
    elif sc == "visual_projection":
        role = "sensory"
        detail = clean(row.cell_class) or clean(row.cell_type) or "visual"
    elif sc == "ascending":
        role = "ascending"
        detail = clean(row.super_cluster) or clean(row.cell_class) or clean(row.cell_type) or sc
    elif sc == "descending":
        role = "descending"
        detail = clean(row.super_cluster) or clean(row.cell_class) or clean(row.cell_type) or sc
    else:
        role = "motor"
        detail = clean(row.body_part_effector) or clean(row.cell_function) or clean(row.cell_class) or clean(row.cell_type) or sc
    detail = detail[:96]
    key = f"{role}|{sc}|{detail}"
    pop_id = "BANC-" + hashlib.sha1(key.encode("utf-8")).hexdigest()[:12].upper()
    return pop_id, role, detail


def main() -> None:
    meta_path = download(FILES["meta"])
    edge_path = download(FILES["edges"])
    print("Reading BANC v888 metadata…", flush=True)
    meta_cols = [
        "banc_888_id", "proofread", "roughly_proofread", "super_class", "cell_class",
        "cell_type", "super_cluster", "body_part_sensory", "body_part_effector",
        "cell_function", "region", "flow",
    ]
    meta = feather.read_table(meta_path, columns=meta_cols).to_pandas()
    meta["banc_888_id"] = meta["banc_888_id"].astype(str)
    usable = meta["proofread"].map(truthy) | meta["roughly_proofread"].map(truthy)
    core = meta[usable & meta["super_class"].fillna("").isin(CORE_CLASSES)].copy()
    if core.empty:
        raise RuntimeError("BANC core population filter produced zero neurons")

    pop_rows = core.apply(population_key, axis=1, result_type="expand")
    pop_rows.columns = ["population_id", "role", "detail"]
    core = pd.concat([core.reset_index(drop=True), pop_rows.reset_index(drop=True)], axis=1)
    id_to_pop = dict(zip(core["banc_888_id"], core["population_id"]))

    pop_meta = {}
    for pop_id, group in core.groupby("population_id", sort=True):
        first = group.iloc[0]
        pop_meta[pop_id] = {
            "id": pop_id,
            "role": first["role"],
            "superClass": clean(first.super_class),
            "label": clean(first["detail"]),
            "neuronCount": int(len(group)),
            "regions": sorted(x for x in {clean(v) for v in group.region} if x),
            "flows": sorted(x for x in {clean(v) for v in group.flow} if x),
        }

    print(f"Selected {len(core):,} proofread/RPR sensorimotor neurons into {len(pop_meta):,} populations.", flush=True)
    print("Reading and thresholding v2 neuron-to-neuron edges…", flush=True)
    edge_table = feather.read_table(edge_path, columns=["pre", "post", "count"])
    if edge_table.num_rows != FILES["edges"]["rows"]:
        raise RuntimeError(f"edge row mismatch: {edge_table.num_rows} != {FILES['edges']['rows']}")
    edge_table = edge_table.filter(pc.greater_equal(edge_table["count"], 5))
    edges = edge_table.to_pandas()
    edges["pre"] = edges["pre"].astype(str)
    edges["post"] = edges["post"].astype(str)
    edges["source"] = edges["pre"].map(id_to_pop)
    edges["target"] = edges["post"].map(id_to_pop)
    edges = edges.dropna(subset=["source", "target"])
    edges = edges[edges.source != edges.target]
    if edges.empty:
        raise RuntimeError("No thresholded BANC edges survived the sensorimotor projection")

    agg = edges.groupby(["source", "target"], sort=True, as_index=False)["count"].sum()
    incoming = agg.groupby("target")["count"].transform("sum")
    agg["weight"] = agg["count"] / incoming
    # Keep meaningful population-level links; this only compresses the projection, never invents edges.
    agg = agg[(agg["count"] >= 10) & (agg["weight"] >= 0.0005)].copy()
    agg.sort_values(["target", "weight", "source"], ascending=[True, False, True], inplace=True)

    used = set(agg.source) | set(agg.target)
    nodes = [pop_meta[k] for k in sorted(used)]
    edge_json = [
        {
            "source": row.source,
            "target": row.target,
            "synapses": int(row["count"]),
            "weight": round(float(row.weight), 8),
        }
        for _, row in agg.iterrows()
    ]
    role_counts = Counter(node["role"] for node in nodes)

    payload = {
        "schema": "BANC-V888-SENSORIMOTOR-PROJECTION/1",
        "biologicalSource": "BANC v888",
        "runtimeClaim": "population projection derived from real BANC connectivity; not the full biological connectome",
        "materialization": 888,
        "synapseModel": "v2",
        "edgeThreshold": {"sourceSynapseSizeVoxels": 5, "pairCountMinimum": 5, "projectionPopulationSynapsesMinimum": 10, "projectionWeightMinimum": 0.0005},
        "selection": {
            "proofreading": "proofread OR roughly_proofread",
            "superClasses": sorted(CORE_CLASSES),
            "populationRule": "sensory by body part/class; ascending+descending by super-cluster/class; motor by effector/function/class",
            "note": "Only connections whose pre and post neurons both belong to the selected sensorimotor classes are retained before population aggregation.",
        },
        "sources": {
            "metadata": {**FILES["meta"], "sha256": digest(meta_path, "sha256")},
            "edgelist": {**FILES["edges"], "sha256": digest(edge_path, "sha256")},
            "paper": "https://doi.org/10.1038/s41586-026-10735-w",
        },
        "stats": {
            "selectedNeurons": int(len(core)),
            "populations": len(nodes),
            "populationEdges": len(edge_json),
            "roles": dict(sorted(role_counts.items())),
            "thresholdedNeuronEdgesRead": int(edge_table.num_rows),
        },
        "nodes": nodes,
        "edges": edge_json,
    }

    encoded = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    for out in [OUT, WEB_OUT]:
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(encoded)
        print(f"Wrote {out.relative_to(ROOT)} · {len(encoded)/1024:.1f} KiB", flush=True)
    print(json.dumps(payload["stats"], indent=2), flush=True)


if __name__ == "__main__":
    main()

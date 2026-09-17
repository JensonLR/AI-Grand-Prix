#!/usr/bin/env python3
"""Materialise the full BANC v888 neuron-pair graph for the AGP browser runtime.

This preserves every metadata row and every directed pair in the published v2 simple
edgelist. It does NOT claim that BANC supplies membrane/channel kinetics: AGP applies its
own explicitly documented sparse LIF-like dynamics on top of the real v888 topology.
"""
from __future__ import annotations

import hashlib
import json
import urllib.request
from pathlib import Path

import numpy as np
import pandas as pd
import pyarrow.feather as feather
import pyarrow.parquet as parquet

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.cache' / 'banc-v888-full'
OUT = ROOT / 'apps' / 'web' / 'public' / 'connectome' / 'banc-v888-full'
DATA_OUT = ROOT / 'data' / 'connectome' / 'banc-v888-full'
PAPER_COMMIT = 'e31a2e26b9937dca72e5ca1c1960df6454d76114'
META_URL = f'https://raw.githubusercontent.com/htem/BANC-project/{PAPER_COMMIT}/data/meta/banc_888_meta_20260521.parquet'
EDGE_URL = 'https://storage.googleapis.com/lee-lab_brain-and-nerve-cord-fly-connectome/compiled_data/banc_888/banc_888_edgelist_simple_v2.feather'
META_ROWS = 188_162
EDGE_ROWS = 11_510_975


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(4 * 1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def fetch(url: str, name: str) -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / name
    if not path.exists() or path.stat().st_size < 1024:
        tmp = path.with_suffix(path.suffix + '.part')
        print(f'Downloading {name}…', flush=True)
        urllib.request.urlretrieve(url, tmp)
        tmp.replace(path)
    return path


def stable_bucket(value: str, n: int) -> int:
    return int(hashlib.blake2s(value.encode('utf-8'), digest_size=4).hexdigest(), 16) % n


def write_bytes(name: str, data: bytes, files: dict) -> None:
    for base in (OUT, DATA_OUT):
        base.mkdir(parents=True, exist_ok=True)
        (base / name).write_bytes(data)
    p = OUT / name
    files[name] = {'bytes': p.stat().st_size, 'sha256': sha256(p)}
    print(f'Wrote {name}: {p.stat().st_size / 1024 / 1024:.2f} MiB', flush=True)


def main() -> None:
    meta_path = fetch(META_URL, 'banc_888_meta_20260521.parquet')
    edge_path = fetch(EDGE_URL, 'banc_888_edgelist_simple_v2.feather')

    schema = parquet.read_schema(meta_path)
    names = set(schema.names)
    id_col = next((x for x in ['banc_888_id', 'root_id', 'root_888'] if x in names), None)
    if not id_col:
        raise RuntimeError('BANC v888 metadata has no recognised root identifier')
    optional = [x for x in ['super_class', 'body_part_sensory', 'body_part_effector', 'cell_class', 'cell_type'] if x in names]
    meta = parquet.read_table(meta_path, columns=[id_col, *optional]).to_pandas()
    if len(meta) != META_ROWS:
        raise RuntimeError(f'metadata row mismatch {len(meta)} != {META_ROWS}')
    meta[id_col] = meta[id_col].astype(str)
    ids = meta[id_col].tolist()
    if len(set(ids)) != len(ids):
        raise RuntimeError('BANC metadata IDs are not unique')
    index = {root_id: i for i, root_id in enumerate(ids)}

    super_class = meta['super_class'].fillna('').astype(str).str.lower() if 'super_class' in meta else pd.Series([''] * len(meta))
    roles = np.zeros(len(meta), dtype=np.uint8)
    # 0 other, 1 sensory, 2 visual projection, 3 ascending, 4 descending, 5 motor.
    roles[super_class.str.contains('sensory').to_numpy()] = 1
    roles[(super_class == 'visual_projection').to_numpy()] = 2
    roles[(super_class == 'ascending').to_numpy()] = 3
    roles[(super_class == 'descending').to_numpy()] = 4
    roles[(super_class == 'motor').to_numpy()] = 5

    sensory_bucket = np.full(len(meta), 255, dtype=np.uint8)
    motor_bucket = np.full(len(meta), 255, dtype=np.uint8)
    for i, root_id in enumerate(ids):
        if roles[i] in (1, 2):
            sensory_bucket[i] = stable_bucket(root_id, 12)
        if roles[i] in (4, 5):
            motor_bucket[i] = stable_bucket(root_id, 5)

    print('Reading complete BANC v888/v2 neuron-pair edgelist…', flush=True)
    table = feather.read_table(edge_path, columns=['pre', 'post', 'count'])
    if table.num_rows != EDGE_ROWS:
        raise RuntimeError(f'edgelist row mismatch {table.num_rows} != {EDGE_ROWS}')
    edges = table.to_pandas()
    edges['pre'] = edges['pre'].astype(str)
    edges['post'] = edges['post'].astype(str)
    pre_idx = edges['pre'].map(index)
    post_idx = edges['post'].map(index)
    missing = int(pre_idx.isna().sum() + post_idx.isna().sum())
    if missing:
        raise RuntimeError(f'{missing} BANC edge endpoints are absent from v888 metadata; refusing an incomplete graph')
    edges['_pre'] = pre_idx.astype(np.uint32)
    edges['_post'] = post_idx.astype(np.uint32)
    edges.sort_values(['_pre', '_post'], kind='stable', inplace=True)

    pre = edges['_pre'].to_numpy(dtype=np.uint32, copy=False)
    targets = edges['_post'].to_numpy(dtype=np.uint32, copy=False)
    counts32 = edges['count'].to_numpy(dtype=np.uint32, copy=False)
    if len(targets) != EDGE_ROWS:
        raise RuntimeError('edge count changed during remapping')

    degree = np.bincount(pre, minlength=len(meta)).astype(np.uint32)
    offsets = np.zeros(len(meta) + 1, dtype=np.uint32)
    np.cumsum(degree, out=offsets[1:])
    if int(offsets[-1]) != EDGE_ROWS:
        raise RuntimeError('CSR offsets do not cover every edge')

    counts16 = np.minimum(counts32, 65535).astype(np.uint16)
    overflow_idx = np.flatnonzero(counts32 > 65535)
    overflow = [[int(i), int(counts32[i])] for i in overflow_idx]

    files: dict[str, dict] = {}
    write_bytes('offsets.u32', offsets.astype('<u4', copy=False).tobytes(), files)
    write_bytes('targets.u32', targets.astype('<u4', copy=False).tobytes(), files)
    write_bytes('counts.u16', counts16.astype('<u2', copy=False).tobytes(), files)
    write_bytes('roles.u8', roles.tobytes(), files)
    write_bytes('sensory-buckets.u8', sensory_bucket.tobytes(), files)
    write_bytes('motor-buckets.u8', motor_bucket.tobytes(), files)
    node_ids = ('\n'.join(ids) + '\n').encode('utf-8')
    write_bytes('node-ids.txt', node_ids, files)
    overflow_bytes = json.dumps(overflow, separators=(',', ':')).encode('utf-8')
    write_bytes('count-overflow.json', overflow_bytes, files)

    manifest = {
        'schema': 'BANC-V888-FULL-GRAPH/1',
        'biologicalSource': 'BANC v888',
        'materialization': 888,
        'synapseModel': 'v2',
        'neurons': len(meta),
        'directedNeuronPairs': EDGE_ROWS,
        'allMetadataRowsPreserved': True,
        'allV2NeuronPairsPreserved': True,
        'edgeCountStorage': 'uint16 with exact overflow table for counts > 65535',
        'roles': {'0': 'other', '1': 'sensory', '2': 'visual_projection', '3': 'ascending', '4': 'descending', '5': 'motor'},
        'interface': {
            'sensoryBuckets': 12,
            'motorBuckets': 5,
            'assignment': 'deterministic hash of official v888 root ID within annotated sensory/visual and descending/motor classes',
            'note': 'Racing observations are transduced into annotated sensory populations. Motor outputs are decoded only from descending/motor graph activity; the decoder does not read track geometry.'
        },
        'runtimeModel': {
            'name': 'AGP sparse LIF-like connectome dynamics',
            'claim': 'full official BANC v888 topology with AGP-modelled neural dynamics; not a biophysically complete living-fly simulation',
            'edgeSign': 'BANC v2 pair counts are treated as unsigned connection strength in this runtime; global inhibition/homeostasis is a model assumption.'
        },
        'sources': {
            'metadata': {'url': META_URL, 'rows': META_ROWS, 'sha256': sha256(meta_path), 'pinnedCommit': PAPER_COMMIT},
            'edgelist': {'url': EDGE_URL, 'rows': EDGE_ROWS, 'sha256': sha256(edge_path)},
            'paper': 'https://doi.org/10.1038/s41586-026-10735-w',
            'dataverse': 'https://doi.org/10.7910/DVN/7WTH1N'
        },
        'files': files
    }
    raw = json.dumps(manifest, separators=(',', ':'), ensure_ascii=False).encode('utf-8')
    for base in (OUT, DATA_OUT):
        base.mkdir(parents=True, exist_ok=True)
        (base / 'manifest.json').write_bytes(raw)
    print(json.dumps({k: manifest[k] for k in ['schema', 'neurons', 'directedNeuronPairs']}, indent=2), flush=True)
    print(f'Total browser graph bytes: {sum(v["bytes"] for v in files.values()) / 1024 / 1024:.2f} MiB', flush=True)


if __name__ == '__main__':
    main()

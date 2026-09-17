#!/usr/bin/env python3
"""Build AGP's compact sensorimotor projection from BANC v888 data.

Metadata is pinned to the version-of-record BANC-project commit. Connectivity uses the
current public v888/v2 object from the project bucket because the mutable GCS mirror has
been repacked since the paper deposit; we therefore verify its exact observed byte size,
exact paper row count and schema, then record a SHA-256 in the derived artifact. The output
never claims to be the full connectome runtime: it is a provenance-rich population projection
derived only from observed BANC edges.
"""
from __future__ import annotations
import hashlib,json,re,urllib.request
from collections import Counter
from pathlib import Path
import pandas as pd
import pyarrow.compute as pc
import pyarrow.feather as feather
import pyarrow.parquet as parquet

ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'.cache'/'banc-v888'
OUT=ROOT/'data'/'connectome'/'banc-v888-sensorimotor.json'
WEB=ROOT/'apps'/'web'/'public'/'connectome'/'banc-v888-sensorimotor.json'
PAPER_COMMIT='e31a2e26b9937dca72e5ca1c1960df6454d76114'
META={
 'name':'banc_888_meta_20260521.parquet',
 'url':f'https://raw.githubusercontent.com/htem/BANC-project/{PAPER_COMMIT}/data/meta/banc_888_meta_20260521.parquet',
 'size':66586415,'rows':188162,
 'provenance':f'htem/BANC-project@{PAPER_COMMIT}:data/meta/banc_888_meta_20260521.parquet'
}
EDGES={
 'name':'banc_888_edgelist_simple_v2.feather',
 'url':'https://storage.googleapis.com/lee-lab_brain-and-nerve-cord-fly-connectome/compiled_data/banc_888/banc_888_edgelist_simple_v2.feather',
 'size':305250378,'rows':11510975,
 'provenance':'BANC public GCS materialization v888 / synapse model v2 object observed 2026-09-17; mutable mirror, SHA-256 recorded in output'
}
CORE={'sensory','sensory_ascending','sensory_descending','ascending','descending','motor','visual_projection'}

def sha(path,algo='sha256'):
 h=hashlib.new(algo)
 with path.open('rb') as f:
  for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()

def fetch(spec):
 CACHE.mkdir(parents=True,exist_ok=True);p=CACHE/spec['name']
 if not p.exists() or p.stat().st_size!=spec['size']:
  tmp=p.with_suffix(p.suffix+'.part');print(f"Downloading {spec['name']}…",flush=True);urllib.request.urlretrieve(spec['url'],tmp);tmp.replace(p)
 if p.stat().st_size!=spec['size']:raise RuntimeError(f"{spec['name']} byte-size mismatch {p.stat().st_size} != {spec['size']}")
 return p

def clean(v):
 if v is None or (isinstance(v,float) and pd.isna(v)):return ''
 return re.sub(r'\s+',' ',str(v).strip())

def truth(v):return clean(v).upper() in {'TRUE','1','T','YES'}

def popkey(r):
 sc=clean(r.super_class)
 if 'sensory' in sc: role='sensory';detail=clean(r.body_part_sensory) or clean(r.cell_class) or clean(r.cell_type) or sc
 elif sc=='visual_projection': role='sensory';detail=clean(r.cell_class) or clean(r.cell_type) or 'visual'
 elif sc=='ascending': role='ascending';detail=clean(r.super_cluster) or clean(r.cell_class) or clean(r.cell_type) or sc
 elif sc=='descending': role='descending';detail=clean(r.super_cluster) or clean(r.cell_class) or clean(r.cell_type) or sc
 else: role='motor';detail=clean(r.body_part_effector) or clean(r.cell_function) or clean(r.cell_class) or clean(r.cell_type) or sc
 detail=detail[:96];key=f'{role}|{sc}|{detail}';return 'BANC-'+hashlib.sha1(key.encode()).hexdigest()[:12].upper(),role,detail

def main():
 mp,ep=fetch(META),fetch(EDGES)
 schema=parquet.read_schema(mp);names=set(schema.names);idcol=next((x for x in ['banc_888_id','root_id','root_888'] if x in names),None)
 if not idcol:raise RuntimeError('Pinned metadata snapshot has no v888/root identifier')
 wanted=[idcol,'proofread','roughly_proofread','super_class','cell_class','cell_type','super_cluster','body_part_sensory','body_part_effector','cell_function','region','flow']
 missing=[x for x in wanted if x not in names]
 if missing:raise RuntimeError(f'Pinned metadata missing required columns: {missing}')
 meta=parquet.read_table(mp,columns=wanted).to_pandas()
 if len(meta)!=META['rows']:raise RuntimeError(f"metadata row mismatch {len(meta)} != {META['rows']}")
 meta.rename(columns={idcol:'root_id'},inplace=True);meta['root_id']=meta['root_id'].astype(str)
 usable=meta['proofread'].map(truth)|meta['roughly_proofread'].map(truth);core=meta[usable & meta['super_class'].fillna('').isin(CORE)].copy()
 if core.empty:raise RuntimeError('sensorimotor selection returned zero neurons')
 keys=core.apply(popkey,axis=1,result_type='expand');keys.columns=['population_id','role','detail'];core=pd.concat([core.reset_index(drop=True),keys.reset_index(drop=True)],axis=1)
 idpop=dict(zip(core.root_id,core.population_id));popmeta={}
 for pid,g in core.groupby('population_id',sort=True):
  r=g.iloc[0];popmeta[pid]={'id':pid,'role':r.role,'superClass':clean(r.super_class),'label':clean(r.detail),'neuronCount':int(len(g)),'regions':sorted(x for x in {clean(v) for v in g.region} if x),'flows':sorted(x for x in {clean(v) for v in g.flow} if x)}
 print(f'Selected {len(core):,} neurons into {len(popmeta):,} populations',flush=True)
 edge_schema=feather.read_table(ep,columns=['pre','post','count']).schema
 if set(edge_schema.names)!={'pre','post','count'}:raise RuntimeError(f'unexpected edge schema {edge_schema.names}')
 tab=feather.read_table(ep,columns=['pre','post','count'])
 if tab.num_rows!=EDGES['rows']:raise RuntimeError(f"edgelist row mismatch {tab.num_rows} != {EDGES['rows']}")
 tab=tab.filter(pc.greater_equal(tab['count'],5));thresholded=tab.num_rows;edges=tab.to_pandas();edges['pre']=edges.pre.astype(str);edges['post']=edges.post.astype(str);edges['source']=edges.pre.map(idpop);edges['target']=edges.post.map(idpop);edges.dropna(subset=['source','target'],inplace=True);edges=edges[edges.source!=edges.target]
 if edges.empty:raise RuntimeError('no biological edges survived sensorimotor selection')
 agg=edges.groupby(['source','target'],as_index=False,sort=True)['count'].sum();incoming=agg.groupby('target')['count'].transform('sum');agg['weight']=agg['count']/incoming;agg=agg[(agg['count']>=10)&(agg['weight']>=.0005)].copy();agg.sort_values(['target','weight','source'],ascending=[True,False,True],inplace=True)
 used=set(agg.source)|set(agg.target);nodes=[popmeta[k] for k in sorted(used)];outedges=[{'source':r.source,'target':r.target,'synapses':int(r['count']),'weight':round(float(r.weight),8)} for _,r in agg.iterrows()];roles=Counter(n['role'] for n in nodes)
 payload={'schema':'BANC-V888-SENSORIMOTOR-PROJECTION/2','biologicalSource':'BANC v888','runtimeClaim':'population projection derived exclusively from observed BANC connectivity; not full-neuron execution','materialization':888,'synapseModel':'v2','selection':{'proofreading':'proofread OR roughly_proofread','superClasses':sorted(CORE),'pairSynapseThreshold':5,'populationSynapsesMinimum':10,'populationWeightMinimum':.0005},'sources':{'metadata':{**META,'sha256':sha(mp)},'edgelist':{**EDGES,'sha256':sha(ep)},'paper':'https://doi.org/10.1038/s41586-026-10735-w','dataverse':'https://doi.org/10.7910/DVN/7WTH1N'},'stats':{'selectedNeurons':int(len(core)),'populations':len(nodes),'populationEdges':len(outedges),'roles':dict(sorted(roles.items())),'thresholdedNeuronEdgesRead':int(thresholded)},'nodes':nodes,'edges':outedges}
 raw=json.dumps(payload,separators=(',',':'),ensure_ascii=False).encode()
 for p in [OUT,WEB]:p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(raw);print(f'Wrote {p.relative_to(ROOT)} · {len(raw)/1024:.1f} KiB',flush=True)
 print(json.dumps(payload['stats'],indent=2),flush=True)
if __name__=='__main__':main()

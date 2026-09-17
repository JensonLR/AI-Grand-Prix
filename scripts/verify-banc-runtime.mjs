import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT='apps/web/public/connectome/banc-v888-full';
const manifestPath=path.join(ROOT,'manifest.json');
const fail=message=>{throw new Error(`Full BANC release gate failed: ${message}`)};
if(!fs.existsSync(manifestPath))fail('manifest.json is missing; refusing to publish a non-BANC build');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const N=188508, E=11510975;
if(manifest.schema!=='BANC-V888-FULL-GRAPH/1')fail(`schema ${manifest.schema}`);
if(manifest.materialization!==888)fail(`materialization ${manifest.materialization}`);
if(manifest.neurons!==N)fail(`mapped rows ${manifest.neurons} != ${N}`);
if(manifest.directedNeuronPairs!==E)fail(`directed pairs ${manifest.directedNeuronPairs} != ${E}`);
if(manifest.allPinnedMetadataRowsPreserved!==true)fail('metadata completeness flag is not true');
if(manifest.allV2NeuronPairsPreserved!==true)fail('v2 pair completeness flag is not true');

const exactSizes={
  'offsets.u32':(N+1)*4,
  'targets.u32':E*4,
  'counts.u16':E*2,
  'roles.u8':N,
  'sensory-buckets.u8':N,
  'motor-buckets.u8':N,
};
let runtimeBytes=0;
for(const [name,meta] of Object.entries(manifest.files??{})){
  const file=path.join(ROOT,name);
  if(!fs.existsSync(file))fail(`${name} is missing`);
  const stat=fs.statSync(file);
  runtimeBytes+=stat.size;
  if(stat.size!==meta.bytes)fail(`${name} size ${stat.size} != manifest ${meta.bytes}`);
  if(name in exactSizes&&stat.size!==exactSizes[name])fail(`${name} size ${stat.size} != expected ${exactSizes[name]}`);
  const digest=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  if(digest!==meta.sha256)fail(`${name} SHA-256 mismatch`);
}
for(const name of [...Object.keys(exactSizes),'node-ids.txt','count-overflow.json'])if(!manifest.files?.[name])fail(`${name} absent from manifest`);
if(runtimeBytes!==manifest.runtimeBytes)fail(`runtime bytes ${runtimeBytes} != manifest ${manifest.runtimeBytes}`);

const offsets=fs.readFileSync(path.join(ROOT,'offsets.u32'));
if(offsets.readUInt32LE(N*4)!==E)fail('final CSR offset does not equal complete directed-pair count');
let previous=0;
for(let i=0;i<=N;i++){
  const value=offsets.readUInt32LE(i*4);
  if(value<previous||value>E)fail(`invalid CSR offset at neuron ${i}`);
  previous=value;
}
const targets=fs.readFileSync(path.join(ROOT,'targets.u32'));
for(let i=0;i<E;i++)if(targets.readUInt32LE(i*4)>=N)fail(`target ${i} is outside the mapped v888 row range`);
const sensory=fs.readFileSync(path.join(ROOT,'sensory-buckets.u8'));
const motor=fs.readFileSync(path.join(ROOT,'motor-buckets.u8'));
let sensoryMapped=0,motorMapped=0;
for(let i=0;i<N;i++){
  if(sensory[i]!==255){if(sensory[i]>=12)fail(`sensory bucket ${sensory[i]} at ${i}`);sensoryMapped++;}
  if(motor[i]!==255){if(motor[i]>=5)fail(`motor bucket ${motor[i]} at ${i}`);motorMapped++;}
}
if(!sensoryMapped)fail('no annotated sensory/visual neurons are available to receive racing observations');
if(!motorMapped)fail('no annotated descending/motor neurons are available for the motor readout');
console.log(`Full BANC release gate passed: v888, ${N.toLocaleString()} mapped rows, ${E.toLocaleString()} directed pairs, ${runtimeBytes.toLocaleString()} runtime bytes, ${sensoryMapped.toLocaleString()} sensory/visual interface neurons, ${motorMapped.toLocaleString()} descending/motor interface neurons.`);

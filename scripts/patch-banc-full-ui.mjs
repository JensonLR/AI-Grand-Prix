/* eslint-env node */
import fs from 'node:fs';
const file='apps/web/src/ChampionshipApp.tsx';
let src=fs.readFileSync(file,'utf8');
const swap=(a,b,label)=>{if(src.includes(b))return;if(!src.includes(a))throw new Error(`BANC UI patch missing ${label}`);src=src.replace(a,b)};

swap("import { readDriverDevelopment } from './PersistentDriver';","import { readFullBancDevelopment } from './FullBancDriver';",'development import');
src=src.replaceAll('readDriverDevelopment(', 'readFullBancDevelopment(');
src=src.replace('Shared 48-state LIF-inspired control topology; persistent bounded variation in firing threshold, leak, synaptic gain, sensory noise, conduction delay, adaptation, plasticity and decoder calibration. Identity is seeded from the driver ID and remains stable across sessions.','Every driver uses the complete BANC v888/v2 neuron-pair topology. The official wiring is shared; each driver maintains independent neural state plus a stable seeded interface phenotype and bounded championship calibration.');
src=src.replace('Frozen: phenotype seed, topology and physiology. Persistent: bounded sensory/readout calibration and race exposure. Reset each event: membrane potentials, spikes and homeostatic activity.','Frozen: official BANC v888 graph topology and driver seed. Persistent only in championship sessions: bounded interface calibration and exposure. Reset every event: membrane potentials and transient graph activity.');

if(!src.includes('kicker="FULL BANC V888 RUNTIME"')){
  const lab=/function ConnectomeLab\([\s\S]*?\nfunction Metric/;
  if(!lab.test(src))throw new Error('BANC UI patch missing ConnectomeLab');
  const replacement='function ConnectomeLab({state,focus,onFocus,onBack}:{state:RaceState;focus:string;onFocus:(id:string)=>void;onBack:()=>void}){const car=state.cars.find(c=>c.id===focus)??state.cars[0],d=driverById(car?.id??focus)??ENTRANTS[0],n=car?.neural,total=n?.totalNeurons??188508,edges=n?.graphEdges??11510975;return <Shell title="CONNECTOME LAB" kicker="FULL BANC V888 RUNTIME" onBack={onBack}><div className="cwc-lab"><aside>{ENTRANTS.map(x=><button className={x.id===d.id?"active":""} key={x.id} onClick={()=>onFocus(x.id)}><i style={{background:x.colour}}/><span>{x.short}<small>{x.phenotypeId}</small></span></button>)}</aside><article><small>FOCUSED BANC STATE</small><h3>{d.name}</h3><p>{d.phenotypeId} · MATERIALISATION V{n?.materialization??888}</p><div className="cwc-neural-viz">{Array.from({length:96},(_,i)=><i key={i} style={{"--pulse":String(Math.max(.05,Math.min(1,(n?.descendingActivity??.08)+(i%11)*.026+(n?.visualActivity??0)*.06)))} as CSSProperties}/>)}</div><div className="cwc-metrics"><Metric n={n?.activeNeurons??0} label={"ACTIVE / "+total.toLocaleString()}/><Metric n={n?.spikeRate??0} label="MODEL SPIKES"/><Metric n={n?.visualActivity??0} label="SENSORY"/><Metric n={n?.descendingActivity??0} label="DESCENDING"/><Metric n={n?.interfaceLatencyMs??0} label="INTERFACE MS"/><Metric n={edges} label="DIRECTED PAIRS"/></div><PhenotypeInspector driver={d}/><div className="cwc-integrity"><div><strong>OFFICIAL CONNECTOME</strong><span>BANC v888 · pinned paper metadata + complete v2 neuron-pair edgelist</span></div><div><strong>LIVE BROWSER CONTROL</strong><span>BANC_V888_FULL_GRAPH · {total.toLocaleString()} mapped rows · {edges.toLocaleString()} directed pairs</span></div><p>The wiring and annotations come from BANC v888. BANC does not provide a complete electrophysiological model for every cell, so membrane dynamics, global inhibition, racing sensory transduction and motor readout are explicit AGP modelling assumptions. The motor decoder reads descending/motor graph activity only; it has no access to absolute circuit coordinates or an ideal racing line.</p></div></article></div></Shell>}\nfunction Metric';
  src=src.replace(lab,replacement);
}

if(!src.includes('camera-${camera}')){
  src=src.replace('return <section className="broadcast cwc-broadcast">','return <section className={`broadcast cwc-broadcast camera-${camera}`}>');
}
src=src.replace("replay?'RACE REPLAY':human?'HUMAN TEST':'CONNECTOME LIVE'","replay?'RACE REPLAY':human?'HUMAN TEST':'BANC V888 LIVE'");
src=src.replace("replay?'RECORDED CONNECTOME RACE':'22 LOCAL NEURAL PHENOTYPES'","replay?'RECORDED BANC RACE':'22 FULL BANC V888 STATES'");
src=src.replace('<strong>{focused.neural.activeNeurons}/48</strong>','<strong>{focused.neural.activeNeurons}/{focused.neural.totalNeurons??188508}</strong>');
src=src.replace('<span>NEURAL LINK</span>','<span>BANC V888 · FULL GRAPH</span>');

fs.writeFileSync(file,src);
console.log('Applied full BANC v888 UI contract.');

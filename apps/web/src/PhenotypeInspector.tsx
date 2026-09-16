import { phenotypeFromSeed } from '@agp/driver-sdk';
import { hashSeed,type Entrant } from './championship';

export function PhenotypeInspector({driver}:{driver:Entrant}){
  const p=phenotypeFromSeed(hashSeed(driver.id),driver.phenotypeId);
  const rows=[
    ['FIRING THRESHOLD',p.firingThreshold,.955,1.045],
    ['MEMBRANE LEAK',p.membraneLeak,.965,1.035],
    ['SYNAPTIC GAIN',p.synapticGain,.96,1.04],
    ['SENSORY NOISE',p.sensoryNoise,.006,.018],
    ['CONDUCTION DELAY',p.conductionDelay,.92,1.08],
    ['ADAPTATION',p.adaptation,.94,1.06],
    ['PLASTICITY RATE',p.plasticityRate,.004,.010],
    ['DECODER CAL.',p.decoderCalibration,.985,1.015]
  ] as const;
  return <section className="cwc-phenotype"><header><span>PHENOTYPE GENOME</span><b>SEED {p.seed.toString(16).toUpperCase().padStart(8,'0')}</b></header><div>{rows.map(([label,value,min,max])=>{const position=Math.max(0,Math.min(1,(value-min)/(max-min)));return <article key={label}><small>{label}</small><strong>{value.toFixed(value<.1?4:3)}</strong><i><b style={{left:`${position*100}%`}}/></i></article>})}</div><footer>Persistent seeded physiology · same topology · no hidden pace rating</footer></section>;
}

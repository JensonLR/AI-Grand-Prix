import { DeterministicDriver,type DriverDecision,type DriverDevelopmentState,type DriverObservation } from '@agp/driver-sdk';

const KEY='agp:cwc:driver-development:v1:';

/**
 * Browser-only persistence wrapper. It persists only bounded calibration learned by the
 * neural interface. Phenotype physiology/topology stays frozen; membrane/spike state,
 * homeostatic gain and current-session dynamics reset when a new event starts.
 */
export class PersistentDriver extends DeterministicDriver {
  private decisions=0;
  constructor(id:string,name:string,private persistAcrossEvents=true){
    super(id,name);
    if(persistAcrossEvents&&typeof localStorage!=='undefined'){
      try{const raw=localStorage.getItem(KEY+id);if(raw)this.importDevelopmentState(JSON.parse(raw) as DriverDevelopmentState);}catch(error){void error;}
    }
    this.resetTransientNeuralState();
  }
  override async decide(observation:DriverObservation):Promise<DriverDecision>{
    const out=await super.decide(observation);this.decisions++;
    if(this.persistAcrossEvents&&this.decisions%40===0)this.persist();
    return out;
  }
  persist(){
    if(!this.persistAcrossEvents||typeof localStorage==='undefined')return;
    try{localStorage.setItem(KEY+this.id,JSON.stringify(this.exportDevelopmentState()));}catch(error){void error;}
  }
}

export function readDriverDevelopment(id:string):DriverDevelopmentState|null{
  if(typeof localStorage==='undefined')return null;
  try{const raw=localStorage.getItem(KEY+id);return raw?JSON.parse(raw) as DriverDevelopmentState:null;}catch(error){void error;return null;}
}

import { DeterministicDriver,hashSeed,type DriverDecision,type DriverObservation } from '@agp/driver-sdk';
import type { DriverDevelopmentState,NeuralTelemetry,TyreCompound } from '@agp/shared';
import { bancRuntime } from './BancFullRuntime';

const STORAGE='agp:cwc:banc-v888-development:v1:';
let instanceSequence=0;
const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));

/**
 * Browser championship driver backed by the complete BANC v888/v2 sparse topology.
 * BANC supplies real neuron identities/connectivity/annotations. AGP supplies the explicit
 * racing transduction, sparse LIF-like dynamics and motor readout because a connectome does
 * not itself contain a complete electrophysiological model.
 */
export class FullBancDriver extends DeterministicDriver{
  private readonly runtimeKey:string;private readonly seed:number;private decisions=0;private calibration=[0,0,0,0,0];
  constructor(id:string,name:string,private persistAcrossEvents=true){
    super(id,name);this.seed=hashSeed(id);this.runtimeKey=`${id}:${++instanceSequence}:${this.seed}`;
    if(persistAcrossEvents&&typeof localStorage!=='undefined'){
      try{const raw=localStorage.getItem(STORAGE+id);if(raw){const parsed=JSON.parse(raw) as DriverDevelopmentState;if(parsed.version===1&&Array.isArray(parsed.readoutCalibration))this.calibration=parsed.readoutCalibration.slice(0,5).map(v=>Number(v)||0);}}catch(error){void error;}
    }
  }
  private sensors(o:DriverObservation){
    const near=o.track[2]?.headingDelta??0,mid=o.track[5]?.headingDelta??0,far=o.track[7]?.headingDelta??0;
    const leftBoundary=o.track[0]?.leftBoundary??6,rightBoundary=o.track[0]?.rightBoundary??6;
    const leftEdge=clamp((2.4-leftBoundary)/2.4),rightEdge=clamp((2.4-rightBoundary)/2.4);
    const nearest=o.nearby.reduce((best,n)=>n.distance<best.distance?n:best,{distance:999,bearing:0,relativeSpeed:0,id:''});
    const looming=nearest.distance<28?clamp((28-nearest.distance)/28):0;
    const trafficLeft=nearest.distance<16&&nearest.bearing<0?looming:0,trafficRight=nearest.distance<16&&nearest.bearing>0?looming:0;
    const slip=o.car.tyres.reduce((n,t)=>n+Math.abs(t.slipAngle)+Math.abs(t.slipRatio),0)/Math.max(1,o.car.tyres.length);
    const curvature=clamp((Math.abs(mid)+Math.abs(far))*.52,0,1.5);
    return[
      clamp(Math.max(0,-near)*1.75+rightEdge*.7+trafficRight*.15,0,1.5),
      clamp(Math.max(0, near)*1.75+leftEdge*.7+trafficLeft*.15,0,1.5),
      clamp(Math.max(0,-mid)*1.4,0,1.5),clamp(Math.max(0,mid)*1.4,0,1.5),
      clamp(Math.max(0,-far)*1.05,0,1.5),clamp(Math.max(0,far)*1.05,0,1.5),
      clamp(rightEdge+trafficRight*.45,0,1.5),clamp(leftEdge+trafficLeft*.45,0,1.5),
      clamp(o.car.speed/95,0,1.5),curvature,
      clamp(slip*.45+o.race.wetness*.4,0,1.5),clamp(looming,0,1.5)
    ];
  }
  private adapt(o:DriverObservation,controls:{steering:number;throttle:number;brake:number}){
    const clean=o.car.surface==='asphalt'&&o.car.damage<.16&&!o.car.tyres.some(t=>t.punctured),pace=clamp(o.car.speed/92),reward=clean?pace-Math.abs(controls.steering)*.025:-.5;
    this.calibration[1]=clamp(this.calibration[1]+reward*.000025,-.055,.055);
    this.calibration[2]=clamp(this.calibration[2]+(clean?-.000004:.00002),-.04,.06);
    this.calibration[3]=clamp(this.calibration[3]+reward*.000006,-.025,.025);
    this.calibration[4]=clamp(this.calibration[4]+reward*.000003,-.02,.02);
    return reward;
  }
  private tyreRequest(o:DriverObservation):TyreCompound|null{
    if(o.race.wetness>.72)return 'WET';if(o.race.wetness>.24)return 'INTERMEDIATE';if(o.car.tyres.some(t=>t.wear>.80||t.punctured))return 'MEDIUM';return null;
  }
  override async decide(o:DriverObservation):Promise<DriverDecision>{
    const started=performance.now(),result=await bancRuntime.decide(this.runtimeKey,this.seed,this.sensors(o),this.calibration),elapsed=Math.max(.02,performance.now()-started);
    this.decisions++;this.calibration=result.calibration.slice(0,5);const reinforcement=this.adapt(o,result);
    const telemetry:NeuralTelemetry={phenotypeId:`BANC-V888-${this.seed.toString(16).toUpperCase().padStart(8,'0')}`,source:'BANC_V888_FULL_GRAPH',activeNeurons:result.activeNeurons,totalNeurons:188508,graphEdges:11510975,materialization:888,spikeRate:+result.spikeRate.toFixed(1),visualActivity:+result.visualActivity.toFixed(3),descendingActivity:+result.descendingActivity.toFixed(3),steeringOutput:+result.steering.toFixed(3),throttleOutput:+result.throttle.toFixed(3),brakeOutput:+result.brake.toFixed(3),reinforcementSignal:+reinforcement.toFixed(3),interfaceLatencyMs:+elapsed.toFixed(2),connectomeSimRate:4};
    o.car.neural=telemetry;if(this.persistAcrossEvents&&this.decisions%40===0)this.persist();
    return{horizonSeconds:.25,controls:[{t:0,steering:result.steering,throttle:result.throttle,brake:result.brake}],energyDeploy:result.energyDeploy,pitRequest:o.car.tyres.some(t=>t.wear>.80||t.punctured),tyreRequest:this.tyreRequest(o),strategyIntent:o.nearby.some(n=>n.distance<13)?'BANC TRAFFIC RESPONSE':'BANC V888 FULL-GRAPH CONTROL',radio:'',memoryUpdate:''};
  }
  persist(){if(!this.persistAcrossEvents||typeof localStorage==='undefined')return;const state:DriverDevelopmentState={version:1,exposureDecisions:this.decisions,readoutCalibration:this.calibration.map(v=>+v.toFixed(8))};try{localStorage.setItem(STORAGE+this.id,JSON.stringify(state));}catch(error){void error;}}
  override async shutdown(){this.persist();bancRuntime.disposeDriver(this.runtimeKey);await super.shutdown();}
}

export function readFullBancDevelopment(id:string):DriverDevelopmentState|null{
  if(typeof localStorage==='undefined')return null;try{const raw=localStorage.getItem(STORAGE+id);return raw?JSON.parse(raw) as DriverDevelopmentState:null}catch(error){void error;return null}
}

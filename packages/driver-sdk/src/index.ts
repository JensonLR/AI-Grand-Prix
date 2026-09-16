import { z } from 'zod';
import type { CarState, Control, NeuralTelemetry, RaceState } from '@agp/shared';
import { TRACK_LENGTH, clamp, trackTangent, wrapAngle } from '@agp/sim-core';

export const DecisionSchema = z.object({
  horizonSeconds:z.number().min(.05).max(6),
  controls:z.array(z.object({t:z.number().min(0).max(6),steering:z.number(),throttle:z.number(),brake:z.number()})).min(1).max(16),
  energyDeploy:z.number().default(0),
  pitRequest:z.boolean().default(false),
  tyreRequest:z.enum(['SOFT','MEDIUM','HARD','INTERMEDIATE','WET']).nullable().default(null),
  strategyIntent:z.string().max(180).default(''),
  radio:z.string().max(180).default(''),
  memoryUpdate:z.string().max(8000).default('')
});
export type DriverDecision = z.infer<typeof DecisionSchema>;

export interface DriverObservation {
  car:CarState;
  race:{time:number;lap:number;position:number;flag:string;wetness:number};
  track:Array<{distance:number;headingDelta:number;leftBoundary:number;rightBoundary:number}>;
  nearby:Array<{id:string;distance:number;relativeSpeed:number;bearing:number}>;
}

export interface DriverAdapter {
  id:string;
  provider:string;
  displayName:string;
  initialize():Promise<void>;
  decide(observation:DriverObservation,memory?:string):Promise<DriverDecision>;
  shutdown():Promise<void>;
}

export interface Phenotype {
  id:string;
  seed:number;
  firingThreshold:number;
  membraneLeak:number;
  synapticGain:number;
  sensoryNoise:number;
  conductionDelay:number;
  adaptation:number;
  plasticityRate:number;
  decoderCalibration:number;
}

export function hashSeed(text:string) {
  let h=2166136261>>>0;
  for(const ch of text){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}
  return h||1;
}

class PRNG {
  constructor(private s:number){}
  next(){let x=this.s|0;x^=x<<13;x^=x>>>17;x^=x<<5;this.s=x|0;return(x>>>0)/4294967296;}
  sym(){return this.next()*2-1;}
}

export function phenotypeFromSeed(seed:number,id=`FLY-${seed.toString(16).toUpperCase().padStart(8,'0')}`):Phenotype {
  const r=new PRNG(seed||1);
  const bounded=(span:number)=>1+r.sym()*span;
  return {
    id,seed,
    firingThreshold:bounded(.045),
    membraneLeak:bounded(.035),
    synapticGain:bounded(.04),
    sensoryNoise:.008+r.next()*.016,
    conductionDelay:.92+r.next()*.16,
    adaptation:.94+r.next()*.12,
    plasticityRate:.004+r.next()*.006,
    decoderCalibration:.985+r.next()*.03
  };
}

export function observe(state:RaceState,car:CarState):DriverObservation {
  const samples=[0,10,20,40,60,80,120,160,220,300].map(distance=>{
    const advance=distance/TRACK_LENGTH;
    const tan=trackTangent((car.progress+advance)%1);
    return {distance,headingDelta:wrapAngle(tan.yaw-car.yaw),leftBoundary:6,rightBoundary:6};
  });
  return {
    car,
    race:{time:state.time,lap:car.lap,position:car.position,flag:state.flag,wetness:state.wetness},
    track:samples,
    nearby:state.cars
      .filter(c=>c.id!==car.id&&c.status==='RUNNING')
      .map(c=>{
        const dx=c.x-car.x,dz=c.z-car.z;
        return {id:c.id,distance:Math.hypot(dx,dz),relativeSpeed:c.speed-car.speed,bearing:wrapAngle(Math.atan2(dx,dz)-car.yaw)};
      })
      .filter(c=>c.distance<80)
  };
}

const N=48;
const SENSOR_COUNT=12;
const OUTPUT_LEFT=42;
const OUTPUT_RIGHT=43;
const OUTPUT_THROTTLE=44;
const OUTPUT_BRAKE=45;
const OUTPUT_ENERGY=46;
const OUTPUT_STABILITY=47;

/**
 * AGPConnectomeDriver is deliberately labelled an AGP simulation interface.
 * It is a compact leaky integrate-and-fire inspired network with one fixed topology.
 * Driver differences are seeded, bounded phenotype variations around that topology.
 * No track coordinates, racing line or target steering are passed to the motor decoder.
 */
export class AGPConnectomeDriver implements DriverAdapter {
  provider='AGP LOCAL NEURAL INTERFACE';
  displayName:string;
  readonly phenotype:Phenotype;
  private v=new Float64Array(N);
  private spike=new Float64Array(N);
  private weights=Array.from({length:N},()=>new Float64Array(N));
  private baseline=new Float64Array(N);
  private lastSteer=0;
  private adaptedReadout=new Float64Array(5);
  private rng:PRNG;

  constructor(public id:string,name:string,legacySalt=0){
    this.displayName=name;
    const seed=(hashSeed(id)^(Math.round(legacySalt*1000)>>>0))>>>0;
    this.phenotype=phenotypeFromSeed(seed,`FLY-${(seed>>>0).toString(16).toUpperCase().padStart(8,'0')}`);
    this.rng=new PRNG(seed^0x9e3779b9);
    this.buildSharedTopology(seed);
  }

  async initialize(){}
  async shutdown(){}

  private buildSharedTopology(seed:number){
    // Same coarse topology for every phenotype; only tightly bounded seeded gains vary.
    const topo=new PRNG(0xA61F0A7);
    for(let i=0;i<N;i++){
      this.baseline[i]=.018+topo.next()*.02;
      for(let j=0;j<N;j++){
        const local=Math.abs(i-j)<=3;
        const recurrent=i>=SENSOR_COUNT&&j>=SENSOR_COUNT&&topo.next()<.10;
        if(local||recurrent)this.weights[i][j]=(topo.sym()*.115)*(1+(new PRNG(seed+i*97+j*131).sym()*.025));
      }
    }
    const link=(from:number,to:number,w:number)=>{this.weights[to][from]+=w;};
    // Encoded left/right optic-flow error populations -> descending steering populations.
    for(const s of [0,2,4,6]){link(s,16,.42);link(s,20,.32);link(16,OUTPUT_LEFT,.72);link(20,OUTPUT_LEFT,.48);}
    for(const s of [1,3,5,7]){link(s,17,.42);link(s,21,.32);link(17,OUTPUT_RIGHT,.72);link(21,OUTPUT_RIGHT,.48);}
    // Speed/corner/traction populations -> throttle and brake populations.
    link(8,24,.52);link(9,25,.52);link(10,26,.48);link(11,27,.42);
    link(24,OUTPUT_THROTTLE,.72);link(25,OUTPUT_BRAKE,.80);link(26,OUTPUT_STABILITY,.58);link(27,OUTPUT_BRAKE,.42);
    link(OUTPUT_STABILITY,OUTPUT_THROTTLE,-.28);link(OUTPUT_STABILITY,OUTPUT_BRAKE,.31);
    link(OUTPUT_THROTTLE,OUTPUT_ENERGY,.34);
  }

  private sensoryEncode(o:DriverObservation){
    const s=new Float64Array(SENSOR_COUNT);
    const headingNear=o.track[2]?.headingDelta??0;
    const headingMid=o.track[5]?.headingDelta??0;
    const headingFar=o.track[7]?.headingDelta??0;
    const left=Math.max(0,-headingNear),right=Math.max(0,headingNear);
    const leftMid=Math.max(0,-headingMid),rightMid=Math.max(0,headingMid);
    const leftFar=Math.max(0,-headingFar),rightFar=Math.max(0,headingFar);
    const curvature=Math.max(Math.abs(headingMid),Math.abs(headingFar));
    const targetSpeed=clamp(91-curvature*45-o.race.wetness*21,30,96);
    const speedError=(targetSpeed-o.car.speed)/45;
    const overspeed=(o.car.speed-targetSpeed)/28;
    const nearest=o.nearby.reduce((best,n)=>n.distance<best.distance?n:best,{distance:999,bearing:0,relativeSpeed:0,id:''});
    const looming=nearest.distance<24?clamp((24-nearest.distance)/24,0,1):0;
    const trafficLeft=nearest.distance<14&&nearest.bearing<0?looming:0;
    const trafficRight=nearest.distance<14&&nearest.bearing>0?looming:0;
    const slip=o.car.tyres.reduce((n,t)=>n+Math.abs(t.slipAngle)+Math.abs(t.slipRatio),0)/4;
    const noise=()=>this.rng.sym()*this.phenotype.sensoryNoise;
    s[0]=clamp(left*1.6+trafficRight*.18+noise(),0,1.5);
    s[1]=clamp(right*1.6+trafficLeft*.18+noise(),0,1.5);
    s[2]=clamp(leftMid*1.25+noise(),0,1.5);
    s[3]=clamp(rightMid*1.25+noise(),0,1.5);
    s[4]=clamp(leftFar*.9+noise(),0,1.5);
    s[5]=clamp(rightFar*.9+noise(),0,1.5);
    s[6]=clamp(trafficRight*.8+noise(),0,1.5);
    s[7]=clamp(trafficLeft*.8+noise(),0,1.5);
    s[8]=clamp(.45+speedError+noise(),0,1.5);
    s[9]=clamp(overspeed+curvature*.35+noise(),0,1.5);
    s[10]=clamp(slip*.55+o.race.wetness*.28+noise(),0,1.5);
    s[11]=clamp(looming+noise(),0,1.5);
    return s;
  }

  private runNeuralStep(sensors:Float64Array){
    const p=this.phenotype;
    const next=new Float64Array(N);
    let active=0,spikes=0;
    for(let i=0;i<N;i++){
      let input=this.baseline[i];
      if(i<SENSOR_COUNT)input+=sensors[i]*.9;
      for(let j=0;j<N;j++)input+=this.spike[j]*this.weights[i][j]*p.synapticGain;
      const leak=.80+(.13*p.membraneLeak);
      let v=this.v[i]*leak+input*.22;
      const threshold=.68*p.firingThreshold;
      if(v>threshold){next[i]=1;v*=.22;spikes++;}
      else next[i]=Math.max(0,v/threshold)*.33;
      this.v[i]=v*p.adaptation;
      if(next[i]>.08)active++;
    }
    this.spike=next;
    return {active,spikes};
  }

  private decode(o:DriverObservation){
    // Strictly neural readout. Decoder input is only neural activity, never track geometry.
    const left=this.spike[OUTPUT_LEFT],right=this.spike[OUTPUT_RIGHT];
    const steerRaw=(right-left)*2.8+this.adaptedReadout[0];
    const throttleDrive=this.spike[OUTPUT_THROTTLE]*1.6-this.spike[OUTPUT_STABILITY]*.28+this.adaptedReadout[1];
    const brakeDrive=this.spike[OUTPUT_BRAKE]*1.9+this.spike[OUTPUT_STABILITY]*.35+this.adaptedReadout[2];
    const energyDrive=this.spike[OUTPUT_ENERGY]*1.35+this.adaptedReadout[3];
    const steering=clamp(this.lastSteer*.35+steerRaw*.65,-1,1);
    this.lastSteer=steering;
    const throttle=clamp(.42+throttleDrive-brakeDrive*.55,0,1);
    const brake=clamp(brakeDrive-.22,0,1);
    const energyDeploy=clamp(energyDrive-.1,0,1);
    // Small persistent calibration learns only from control outcomes, not hidden target controls.
    const clean=o.car.surface==='asphalt'&&o.car.damage<.15;
    const reinforcement=clean?clamp((o.car.speed/95)-Math.abs(steering)*.08,0,1):-.45;
    this.adaptedReadout[1]=clamp(this.adaptedReadout[1]+reinforcement*this.phenotype.plasticityRate*.002,-.04,.04);
    this.adaptedReadout[2]=clamp(this.adaptedReadout[2]+(clean?-.2:.6)*this.phenotype.plasticityRate*.001,-.03,.05);
    return {steering,throttle,brake,energyDeploy,reinforcement};
  }

  async decide(o:DriverObservation):Promise<DriverDecision>{
    const started=performanceNow();
    const sensors=this.sensoryEncode(o);
    let active=0,spikeCount=0;
    const substeps=Math.max(3,Math.round(5*this.phenotype.conductionDelay));
    for(let i=0;i<substeps;i++){
      const stats=this.runNeuralStep(sensors);active=Math.max(active,stats.active);spikeCount+=stats.spikes;
    }
    const out=this.decode(o);
    const elapsed=Math.max(.02,performanceNow()-started);
    const telemetry:NeuralTelemetry={
      phenotypeId:this.phenotype.id,
      source:'AGP_SIMULATION_INTERFACE',
      activeNeurons:active,
      spikeRate:+((spikeCount/substeps)*20).toFixed(1),
      visualActivity:+(sensors.slice(0,8).reduce((a,b)=>a+b,0)/8).toFixed(3),
      descendingActivity:+((this.spike[OUTPUT_LEFT]+this.spike[OUTPUT_RIGHT]+this.spike[OUTPUT_THROTTLE]+this.spike[OUTPUT_BRAKE])/4).toFixed(3),
      steeringOutput:+out.steering.toFixed(3),
      throttleOutput:+out.throttle.toFixed(3),
      brakeOutput:+out.brake.toFixed(3),
      reinforcementSignal:+out.reinforcement.toFixed(3),
      interfaceLatencyMs:+elapsed.toFixed(2),
      connectomeSimRate:substeps*20
    };
    o.car.neural=telemetry;
    const nearest=o.nearby.some(n=>n.distance<13);
    const decision:DriverDecision={
      horizonSeconds:.25,
      controls:[{t:0,steering:out.steering,throttle:out.throttle,brake:out.brake}],
      energyDeploy:out.energyDeploy,
      pitRequest:o.car.tyres.some(t=>t.wear>.78||t.punctured),
      tyreRequest:null,
      strategyIntent:nearest?'TRAFFIC RESPONSE':'NEURAL CONTROL',
      radio:'',memoryUpdate:''
    };
    return decision;
  }
}

// Backward-compatible export used by the rendering and race-runner packages.
export class DeterministicDriver extends AGPConnectomeDriver {}

export function decisionToControl(d:DriverDecision):Control {
  const p=d.controls[0];
  return {
    steering:clamp(p.steering,-1,1),
    throttle:clamp(p.throttle,0,1),
    brake:clamp(p.brake,0,1),
    energyDeploy:clamp(d.energyDeploy,0,1)
  };
}

export function academyCandidateSeeds(count=160,seed=0xA6C2026){
  const r=new PRNG(seed);return Array.from({length:count},()=>Math.floor(r.next()*0xffffffff)>>>0);
}

export function academyQualificationMetric(lapCompletion:number,offTrackRate:number,collisionRate:number,paceRatio:number){
  // Minimum competence gate only. It is not a hidden race-performance multiplier.
  return lapCompletion>=.96&&offTrackRate<=.08&&collisionRate<=.04&&paceRatio>=.72;
}

function performanceNow(){return typeof performance!=='undefined'&&performance.now?performance.now():Date.now();}

import { z } from 'zod';
import type { CarState,Control,NeuralTelemetry,RaceState } from '@agp/shared';
import { TRACK_LENGTH,TRACK_WIDTH,clamp,trackPoint,trackTangent,wrapAngle } from '@agp/sim-core';

export const DecisionSchema=z.object({
  horizonSeconds:z.number().min(.05).max(6),
  controls:z.array(z.object({t:z.number().min(0).max(6),steering:z.number(),throttle:z.number(),brake:z.number()})).min(1).max(16),
  energyDeploy:z.number().default(0),
  pitRequest:z.boolean().default(false),
  tyreRequest:z.enum(['SOFT','MEDIUM','HARD','INTERMEDIATE','WET']).nullable().default(null),
  strategyIntent:z.string().max(180).default(''),
  radio:z.string().max(180).default(''),
  memoryUpdate:z.string().max(8000).default('')
});
export type DriverDecision=z.infer<typeof DecisionSchema>;

export interface DriverObservation{
  car:CarState;
  race:{time:number;lap:number;position:number;flag:string;wetness:number};
  track:Array<{distance:number;headingDelta:number;leftBoundary:number;rightBoundary:number}>;
  nearby:Array<{id:string;distance:number;relativeSpeed:number;bearing:number}>;
}
export interface DriverAdapter{
  id:string;provider:string;displayName:string;
  initialize():Promise<void>;
  decide(observation:DriverObservation,memory?:string):Promise<DriverDecision>;
  shutdown():Promise<void>;
}
export interface Phenotype{
  id:string;seed:number;firingThreshold:number;membraneLeak:number;synapticGain:number;sensoryNoise:number;conductionDelay:number;adaptation:number;plasticityRate:number;decoderCalibration:number;
}

export function hashSeed(text:string){let h=2166136261>>>0;for(const ch of text){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h||1;}
class PRNG{constructor(private s:number){}next(){let x=this.s|0;x^=x<<13;x^=x>>>17;x^=x<<5;this.s=x|0;return(x>>>0)/4294967296;}sym(){return this.next()*2-1;}}
export function phenotypeFromSeed(seed:number,id=`FLY-${seed.toString(16).toUpperCase().padStart(8,'0')}`):Phenotype{
  const r=new PRNG(seed||1),bounded=(span:number)=>1+r.sym()*span;
  return{id,seed,firingThreshold:bounded(.045),membraneLeak:bounded(.035),synapticGain:bounded(.04),sensoryNoise:.006+r.next()*.012,conductionDelay:.92+r.next()*.16,adaptation:.94+r.next()*.12,plasticityRate:.004+r.next()*.006,decoderCalibration:.985+r.next()*.03};
}

export function observe(state:RaceState,car:CarState):DriverObservation{
  const centre=trackPoint(car.progress),local=trackTangent(car.progress);
  const lateral=(car.x-centre.x)*local.z-(car.z-centre.z)*local.x;
  const half=TRACK_WIDTH*.5;
  const leftBoundary=clamp(half+lateral,0,TRACK_WIDTH),rightBoundary=clamp(half-lateral,0,TRACK_WIDTH);
  const samples=[0,10,20,40,60,80,120,160,220,300].map(distance=>{
    const tan=trackTangent((car.progress+distance/TRACK_LENGTH)%1);
    return{distance,headingDelta:wrapAngle(tan.yaw-car.yaw),leftBoundary,rightBoundary};
  });
  return{
    car,
    race:{time:state.time,lap:car.lap,position:car.position,flag:state.flag,wetness:state.wetness},
    track:samples,
    nearby:state.cars.filter(c=>c.id!==car.id&&c.status==='RUNNING').map(c=>{const dx=c.x-car.x,dz=c.z-car.z;return{id:c.id,distance:Math.hypot(dx,dz),relativeSpeed:c.speed-car.speed,bearing:wrapAngle(Math.atan2(dx,dz)-car.yaw)};}).filter(c=>c.distance<80)
  };
}

const N=48,SENSOR_COUNT=12;
const OUTPUT_LEFT=42,OUTPUT_RIGHT=43,OUTPUT_THROTTLE=44,OUTPUT_BRAKE=45,OUTPUT_ENERGY=46,OUTPUT_STABILITY=47;
const mean=(a:Float64Array,ids:number[])=>ids.reduce((n,i)=>n+a[i],0)/ids.length;

/**
 * Compact AGP neural simulation interface.
 * One shared LIF-inspired topology is used by every driver; phenotype variation is bounded.
 * The motor readout consumes neural activity only. Track geometry exists only upstream in the sensory encoder.
 */
export class AGPConnectomeDriver implements DriverAdapter{
  provider='AGP LOCAL NEURAL INTERFACE';displayName:string;readonly phenotype:Phenotype;
  private v=new Float64Array(N);private spike=new Float64Array(N);private activity=new Float64Array(N);
  private weights=Array.from({length:N},()=>new Float64Array(N));private baseline=new Float64Array(N);
  private lastSteer=0;private adaptedReadout=new Float64Array(5);private rng:PRNG;

  constructor(public id:string,name:string,legacySalt=0){
    this.displayName=name;const seed=(hashSeed(id)^(Math.round(legacySalt*1000)>>>0))>>>0;
    this.phenotype=phenotypeFromSeed(seed,`FLY-${seed.toString(16).toUpperCase().padStart(8,'0')}`);this.rng=new PRNG(seed^0x9e3779b9);this.buildSharedTopology(seed);
  }
  async initialize(){}async shutdown(){}

  private buildSharedTopology(seed:number){
    const topo=new PRNG(0xA61F0A7);
    for(let i=0;i<N;i++){
      this.baseline[i]=.015+topo.next()*.018;
      for(let j=0;j<N;j++){
        const local=Math.abs(i-j)<=3,recurrent=i>=SENSOR_COUNT&&j>=SENSOR_COUNT&&topo.next()<.10;
        if(local||recurrent)this.weights[i][j]=(topo.sym()*.105)*(1+new PRNG(seed+i*97+j*131).sym()*.025);
      }
    }
    const link=(from:number,to:number,w:number)=>{this.weights[to][from]+=w;};
    for(const s of [0,2,4,6]){link(s,16,.48);link(s,20,.34);link(16,OUTPUT_LEFT,.82);link(20,OUTPUT_LEFT,.52);}
    for(const s of [1,3,5,7]){link(s,17,.48);link(s,21,.34);link(17,OUTPUT_RIGHT,.82);link(21,OUTPUT_RIGHT,.52);}
    link(8,24,.62);link(9,25,.62);link(10,26,.52);link(11,27,.44);
    link(24,OUTPUT_THROTTLE,.82);link(25,OUTPUT_BRAKE,.88);link(26,OUTPUT_STABILITY,.62);link(27,OUTPUT_BRAKE,.48);link(OUTPUT_STABILITY,OUTPUT_THROTTLE,-.24);link(OUTPUT_STABILITY,OUTPUT_BRAKE,.28);link(OUTPUT_THROTTLE,OUTPUT_ENERGY,.38);
  }

  private sensoryEncode(o:DriverObservation){
    const s=new Float64Array(SENSOR_COUNT),near=o.track[2]?.headingDelta??0,mid=o.track[5]?.headingDelta??0,far=o.track[7]?.headingDelta??0;
    const curvature=Math.max(Math.abs(mid),Math.abs(far)),targetSpeed=clamp(89-curvature*43-o.race.wetness*22,28,94);
    const nearest=o.nearby.reduce((best,n)=>n.distance<best.distance?n:best,{distance:999,bearing:0,relativeSpeed:0,id:''});
    const looming=nearest.distance<24?clamp((24-nearest.distance)/24,0,1):0,trafficLeft=nearest.distance<14&&nearest.bearing<0?looming:0,trafficRight=nearest.distance<14&&nearest.bearing>0?looming:0;
    const leftEdge=clamp((2.3-(o.track[0]?.leftBoundary??6))/2.3,0,1),rightEdge=clamp((2.3-(o.track[0]?.rightBoundary??6))/2.3,0,1);
    const slip=o.car.tyres.reduce((n,t)=>n+Math.abs(t.slipAngle)+Math.abs(t.slipRatio),0)/4,noise=()=>this.rng.sym()*this.phenotype.sensoryNoise;
    s[0]=clamp(Math.max(0,-near)*1.75+rightEdge*.75+trafficRight*.12+noise(),0,1.5);
    s[1]=clamp(Math.max(0, near)*1.75+leftEdge*.75+trafficLeft*.12+noise(),0,1.5);
    s[2]=clamp(Math.max(0,-mid)*1.4+noise(),0,1.5);s[3]=clamp(Math.max(0,mid)*1.4+noise(),0,1.5);
    s[4]=clamp(Math.max(0,-far)*1.0+noise(),0,1.5);s[5]=clamp(Math.max(0,far)*1.0+noise(),0,1.5);
    s[6]=clamp(rightEdge+trafficRight*.55+noise(),0,1.5);s[7]=clamp(leftEdge+trafficLeft*.55+noise(),0,1.5);
    s[8]=clamp(.35+(targetSpeed-o.car.speed)/42+noise(),0,1.5);
    s[9]=clamp(Math.max(0,(o.car.speed-targetSpeed)/25)+curvature*.42+noise(),0,1.5);
    s[10]=clamp(slip*.48+o.race.wetness*.30+noise(),0,1.5);s[11]=clamp(looming+noise(),0,1.5);
    return s;
  }

  private runNeuralStep(sensors:Float64Array){
    const p=this.phenotype,next=new Float64Array(N);let spikes=0;
    for(let i=0;i<N;i++){
      let input=this.baseline[i];if(i<SENSOR_COUNT)input+=sensors[i]*1.0;
      for(let j=0;j<N;j++)input+=this.spike[j]*this.weights[i][j]*p.synapticGain;
      const leak=.79+.13*p.membraneLeak,threshold=.66*p.firingThreshold;let v=this.v[i]*leak+input*.23;
      if(v>threshold){next[i]=1;v*=.20;spikes++;}else next[i]=Math.max(0,v/threshold)*.38;
      this.v[i]=v*p.adaptation;
      // Persistent population activity prevents a useful signal vanishing merely because the last substep was between spikes.
      this.activity[i]=this.activity[i]*.68+next[i]*.32;
    }
    this.spike=next;return spikes;
  }

  private decode(o:DriverObservation){
    // Strict neural-only population readout. No geometry/world values are read here.
    const left=mean(this.activity,[0,2,4,6,16,20,OUTPUT_LEFT]);
    const right=mean(this.activity,[1,3,5,7,17,21,OUTPUT_RIGHT]);
    const go=mean(this.activity,[8,24,OUTPUT_THROTTLE]);
    const slow=mean(this.activity,[9,10,25,26,OUTPUT_BRAKE,OUTPUT_STABILITY]);
    const energy=mean(this.activity,[8,24,OUTPUT_THROTTLE,OUTPUT_ENERGY]);
    const steerRaw=(right-left)*4.1*this.phenotype.decoderCalibration+this.adaptedReadout[0];
    const steering=clamp(this.lastSteer*.32+steerRaw*.68,-1,1);this.lastSteer=steering;
    const throttle=clamp(.20+go*1.55-slow*.58+this.adaptedReadout[1],0,1);
    const brake=clamp(slow*1.25-go*.18-.09+this.adaptedReadout[2],0,1);
    const energyDeploy=clamp(energy*1.15-.12+this.adaptedReadout[3],0,1);
    const clean=o.car.surface==='asphalt'&&o.car.damage<.15,reinforcement=clean?clamp((o.car.speed/94)-Math.abs(steering)*.06,0,1):-.45;
    this.adaptedReadout[1]=clamp(this.adaptedReadout[1]+reinforcement*this.phenotype.plasticityRate*.002,-.04,.04);
    this.adaptedReadout[2]=clamp(this.adaptedReadout[2]+(clean?-.2:.6)*this.phenotype.plasticityRate*.001,-.03,.05);
    return{steering,throttle,brake,energyDeploy,reinforcement};
  }

  async decide(o:DriverObservation):Promise<DriverDecision>{
    const started=performanceNow(),sensors=this.sensoryEncode(o),substeps=Math.max(4,Math.round(6*this.phenotype.conductionDelay));let spikeCount=0;
    for(let i=0;i<substeps;i++)spikeCount+=this.runNeuralStep(sensors);
    const out=this.decode(o),elapsed=Math.max(.02,performanceNow()-started),active=Array.from(this.activity).filter(v=>v>.08).length;
    const telemetry:NeuralTelemetry={phenotypeId:this.phenotype.id,source:'AGP_SIMULATION_INTERFACE',activeNeurons:active,spikeRate:+((spikeCount/substeps)*20).toFixed(1),visualActivity:+(sensors.slice(0,8).reduce((a,b)=>a+b,0)/8).toFixed(3),descendingActivity:+mean(this.activity,[OUTPUT_LEFT,OUTPUT_RIGHT,OUTPUT_THROTTLE,OUTPUT_BRAKE]).toFixed(3),steeringOutput:+out.steering.toFixed(3),throttleOutput:+out.throttle.toFixed(3),brakeOutput:+out.brake.toFixed(3),reinforcementSignal:+out.reinforcement.toFixed(3),interfaceLatencyMs:+elapsed.toFixed(2),connectomeSimRate:substeps*20};
    o.car.neural=telemetry;
    return{horizonSeconds:.25,controls:[{t:0,steering:out.steering,throttle:out.throttle,brake:out.brake}],energyDeploy:out.energyDeploy,pitRequest:o.car.tyres.some(t=>t.wear>.78||t.punctured),tyreRequest:null,strategyIntent:o.nearby.some(n=>n.distance<13)?'TRAFFIC RESPONSE':'NEURAL CONTROL',radio:'',memoryUpdate:''};
  }
}

export class DeterministicDriver extends AGPConnectomeDriver{}
export function decisionToControl(d:DriverDecision):Control{const p=d.controls[0];return{steering:clamp(p.steering,-1,1),throttle:clamp(p.throttle,0,1),brake:clamp(p.brake,0,1),energyDeploy:clamp(d.energyDeploy,0,1)};}
export function academyCandidateSeeds(count=160,seed=0xA6C2026){const r=new PRNG(seed);return Array.from({length:count},()=>Math.floor(r.next()*0xffffffff)>>>0);}
export function academyQualificationMetric(lapCompletion:number,offTrackRate:number,collisionRate:number,paceRatio:number){return lapCompletion>=.96&&offTrackRate<=.08&&collisionRate<=.04&&paceRatio>=.72;}
function performanceNow(){return typeof performance!=='undefined'&&performance.now?performance.now():Date.now();}

import type {
  CarState,
  ConstructorTuning,
  Control,
  RaceIncident,
  RaceState,
  Surface,
  Weather
} from '@agp/shared';

export const PHYSICS_HZ = 120;
export const FIXED_DT = 1 / PHYSICS_HZ;
export const TRACK_RX = 128;
export const TRACK_RZ = 76;
export const TRACK_WIDTH = 12;

const CIRCUIT_POINTS = [
  [-55,-70],[-15,-72],[35,-68],[78,-56],[112,-34],[124,-4],[116,26],[91,48],
  [55,60],[26,52],[14,32],[26,14],[5,4],[-22,14],[-46,36],[-76,55],
  [-108,46],[-126,20],[-120,-5],[-96,-18],[-68,-10],[-50,-28],[-76,-42],[-90,-62]
] as const;

export const NEUTRAL_TUNING: ConstructorTuning = {
  aeroEfficiency: 1,
  downforce: 1,
  mechanicalGrip: 1,
  energySystem: 1,
  braking: 1,
  tyreManagement: 1,
  reliability: 1,
  controlResponse: 1
};

function rawTrackPoint(t: number) {
  const n = CIRCUIT_POINTS.length;
  const u = (((t % 1) + 1) % 1) * n;
  const i = Math.floor(u);
  const f = u - i;
  const p0 = CIRCUIT_POINTS[(i - 1 + n) % n];
  const p1 = CIRCUIT_POINTS[i % n];
  const p2 = CIRCUIT_POINTS[(i + 1) % n];
  const p3 = CIRCUIT_POINTS[(i + 2) % n];
  const f2 = f * f;
  const f3 = f2 * f;
  const cat = (a: number,b: number,c: number,d: number) =>
    .5 * ((2*b) + (-a+c)*f + (2*a-5*b+4*c-d)*f2 + (-a+3*b-3*c+d)*f3);
  return {x:cat(p0[0],p1[0],p2[0],p3[0]),z:cat(p0[1],p1[1],p2[1],p3[1])};
}

const ARC_SAMPLES = 1536;
const ARC_DISTANCES: number[] = [0];
const ARC_POINTS = Array.from({length:ARC_SAMPLES+1},(_,i)=>rawTrackPoint(i/ARC_SAMPLES));
for(let i=1;i<ARC_POINTS.length;i++) {
  ARC_DISTANCES[i] = ARC_DISTANCES[i-1] + Math.hypot(
    ARC_POINTS[i].x - ARC_POINTS[i-1].x,
    ARC_POINTS[i].z - ARC_POINTS[i-1].z
  );
}
export const TRACK_LENGTH = ARC_DISTANCES.at(-1)!;

export class SeededRandom {
  constructor(private state = 0x9e3779b9) {}
  next() {
    let x = this.state | 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x | 0;
    return (x >>> 0) / 4294967296;
  }
}

export function trackPoint(t: number) {
  const target = (((t % 1) + 1) % 1) * TRACK_LENGTH;
  let lo = 0, hi = ARC_DISTANCES.length - 1;
  while(lo < hi) {
    const mid = (lo + hi) >> 1;
    if(ARC_DISTANCES[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  const upper = Math.max(1,lo);
  const lower = upper - 1;
  const span = ARC_DISTANCES[upper] - ARC_DISTANCES[lower] || 1;
  const mix = (target - ARC_DISTANCES[lower]) / span;
  return rawTrackPoint((lower + mix) / ARC_SAMPLES);
}

export function trackTangent(t: number) {
  const e = 0.0001;
  const p = trackPoint(t);
  const q = trackPoint((t + e) % 1);
  const l = Math.hypot(q.x-p.x,q.z-p.z) || 1;
  return {x:(q.x-p.x)/l,z:(q.z-p.z)/l,yaw:Math.atan2(q.x-p.x,q.z-p.z)};
}

export function trackCurvature(t: number) {
  const a = trackTangent((t-.006+1)%1).yaw;
  const b = trackTangent((t+.006)%1).yaw;
  return Math.abs(wrapAngle(b-a))/.012;
}

/**
 * Finds the closest circuit point. Supplying a progress hint keeps the hot physics
 * path local to the car's previous position instead of rescanning the whole track.
 * Callers without a reliable hint retain the global search fallback.
 */
export function nearestTrack(x: number,z: number,hintT?:number) {
  let best = Infinity, bestT = hintT??0;
  const consider=(t:number)=>{
    const wrapped=(t+1)%1,p=trackPoint(wrapped),d=(p.x-x)**2+(p.z-z)**2;
    if(d<best){best=d;bestT=wrapped;}
  };
  if(hintT===undefined) {
    for(let i=0;i<360;i++) consider(i/360);
  } else {
    for(let k=-10;k<=10;k++) consider(hintT+k*.003);
  }
  for(let j=0;j<5;j++) {
    const span=1/(360*Math.pow(3,j));
    const centre=bestT;
    for(let k=-2;k<=2;k++) consider(centre+k*span);
  }
  return {t:bestT,distance:Math.sqrt(best)};
}

export function surfaceAt(distance: number): Surface {
  return distance < TRACK_WIDTH*.5 ? 'asphalt' : distance < TRACK_WIDTH*.67 ? 'kerb' : distance < TRACK_WIDTH*1.1 ? 'grass' : 'gravel';
}

function normaliseTuning(tuning?: Partial<ConstructorTuning>): ConstructorTuning {
  const out = {...NEUTRAL_TUNING,...tuning};
  for(const key of Object.keys(out) as Array<keyof ConstructorTuning>) out[key]=clamp(out[key],.985,1.015);
  return out;
}

export function createCar(
  id:string,
  name:string,
  number:number,
  colour:string,
  grid:number,
  tuning?:Partial<ConstructorTuning>
):CarState {
  const t=(0.982-grid*.0048+1)%1;
  const p=trackPoint(t),tan=trackTangent(t);
  const lateral=(grid%2?1:-1)*2.05;
  return {
    id,name,number,colour,
    x:p.x+tan.z*lateral,z:p.z-tan.x*lateral,yaw:tan.yaw,speed:0,vx:0,vz:0,
    lap:0,progress:t,position:grid+1,lastLap:null,bestLap:null,sector:3,
    damage:0,frontWing:1,rearWing:1,floor:1,suspension:1,brakes:1,powertrain:1,energySystem:1,
    battery:1,surface:'asphalt',
    tyres:Array.from({length:4},()=>({temperature:72,wear:0,slipRatio:0,slipAngle:0,locked:false,punctured:false})),
    controls:{steering:0,throttle:0,brake:0,energyDeploy:0},status:'RUNNING',compound:'MEDIUM',pitStops:0,penaltySeconds:0,fuel:1,
    tuning:normaliseTuning(tuning)
  };
}

function weatherWetness(weather:Weather) {
  if(weather==='HEAVY_RAIN'||weather==='RAIN') return .78;
  if(weather==='LIGHT_RAIN') return .38;
  if(weather==='DRYING') return .24;
  return 0;
}

function compoundGrip(car:CarState,wetness:number) {
  const dry = car.compound==='SOFT' ? 1.025 : car.compound==='HARD' ? .982 : car.compound==='WET' ? .89 : car.compound==='INTERMEDIATE' ? .94 : 1;
  if(wetness<.12) return dry;
  if(car.compound==='WET') return 1.02 + wetness*.08;
  if(car.compound==='INTERMEDIATE') return 1.01 + wetness*.02;
  return Math.max(.5,dry-wetness*.38);
}

export class RaceSimulation {
  state:RaceState;
  private lapStart=new Map<string,number>();
  private previousProgress=new Map<string,number>();
  private started=new Set<string>();
  private boundaryContact=new Set<string>();
  private rng:SeededRandom;

  constructor(cars:CarState[], public laps=3, seed=4127, weather:Weather='CLEAR') {
    this.rng=new SeededRandom(seed);
    this.state={time:0,tick:0,flag:'GREEN',laps,cars,seed,weather,wetness:weatherWetness(weather),incidents:[]};
    cars.forEach(c=>{this.lapStart.set(c.id,0);this.previousProgress.set(c.id,c.progress);});
  }

  step(inputs:Map<string,Control>,dt=FIXED_DT) {
    this.state.time += dt;
    this.state.tick++;
    if(this.state.weather==='DRYING') this.state.wetness=Math.max(0,this.state.wetness-dt*.0018);

    for(const car of this.state.cars) {
      if(car.status!=='RUNNING') continue;
      const t=car.tuning??NEUTRAL_TUNING;
      const raw=inputs.get(car.id)??car.controls;
      const response=t.controlResponse;
      const control={
        steering:clamp(lerp(car.controls.steering,raw.steering,.58*response),-1,1),
        throttle:clamp(lerp(car.controls.throttle,raw.throttle,.65*response),0,1),
        brake:clamp(lerp(car.controls.brake,raw.brake,.72*response),0,1),
        energyDeploy:clamp(raw.energyDeploy,0,1)
      };
      car.controls=control;

      const hint=this.previousProgress.get(car.id)??car.progress;
      const near=nearestTrack(car.x,car.z,hint);
      car.surface=surfaceAt(near.distance);
      const surfaceGrip={asphalt:1,kerb:.83,grass:.38,gravel:.24}[car.surface];
      const tyreHealth=1-car.tyres.reduce((s,x)=>s+x.wear,0)/5;
      const wingHealth=(car.frontWing+(car.rearWing??1)+(car.floor??1))/3;
      const damageGrip=(1-car.damage*.28)*(.68+.32*wingHealth);
      const wetGrip=1-this.state.wetness*.18;
      const grip=surfaceGrip*compoundGrip(car,this.state.wetness)*wetGrip*t.mechanicalGrip*damageGrip*tyreHealth;

      const deploy=Math.min(control.energyDeploy,car.battery*4)*(car.energySystem??1)*t.energySystem;
      const powerHealth=(car.powertrain??1);
      const aeroEfficiency=t.aeroEfficiency*(.75+.25*(car.floor??1));
      const drive=control.throttle*(13.65+deploy*2.75)*powerHealth*(1-car.speed/106);
      const drag=.00138*car.speed*car.speed/aeroEfficiency;
      const brake=(car.speed<4?0:control.brake)*31.5*grip*t.braking*(car.brakes??1);
      const terrainLoss=car.surface==='gravel'?8.5:car.surface==='grass'?3.2:0;
      const longitudinal=drive-drag-brake*Math.sign(car.speed||1)-terrainLoss;
      car.speed=clamp(car.speed+longitudinal*dt,0,107);

      const downforce=(.84+.16*t.downforce)*(.72+.28*wingHealth);
      const maxYaw=(1.92*grip*downforce)/(1+car.speed*.012);
      car.yaw+=control.steering*maxYaw*dt*(car.speed/20);
      car.vx=Math.sin(car.yaw)*car.speed;
      car.vz=Math.cos(car.yaw)*car.speed;
      car.x+=car.vx*dt;
      car.z+=car.vz*dt;

      const bounded=nearestTrack(car.x,car.z,near.t),boundary=TRACK_WIDTH*.5+.76;
      if(bounded.distance>boundary) {
        const p=trackPoint(bounded.t),tan=trackTangent(bounded.t),dx=car.x-p.x,dz=car.z-p.z;
        const side=Math.sign(dx*tan.z-dz*tan.x)||1;
        const firstImpact=!this.boundaryContact.has(car.id);
        if(firstImpact) {
          this.boundaryContact.add(car.id);
          const impact=clamp((car.speed-10)/75,0,1);
          const damage=(.0025+impact*.012)/t.reliability;
          car.damage=clamp(car.damage+damage,0,1);
          car.frontWing=clamp(car.frontWing-damage*1.35,.45,1);
          if(impact>.12)this.incident('OFF_TRACK',[car.id],impact>.62?'MEDIUM':'LOW',car.lap);
        }
        car.x=p.x+tan.z*boundary*side;
        car.z=p.z-tan.x*boundary*side;
        car.speed=Math.max(5,car.speed*(firstImpact?.86:.965));
        car.yaw=lerpAngle(car.yaw,tan.yaw,firstImpact?.58:.22);
      } else {
        if(bounded.distance<boundary*.9)this.boundaryContact.delete(car.id);
        if(car.speed<3&&this.state.time>6&&control.throttle>.25) {
          const tan=trackTangent(bounded.t);
          car.yaw=lerpAngle(car.yaw,tan.yaw,.14);
          car.speed+=7*dt;
        }
      }

      car.battery=clamp(car.battery-deploy*.011*dt+(1-control.throttle)*.0032*dt*t.energySystem,0,1);
      car.fuel=clamp(car.fuel-control.throttle*.00012*dt,0,1);

      for(const tyre of car.tyres) {
        tyre.slipRatio=control.throttle*Math.max(0,car.speed/85)-control.brake*(car.speed/55);
        tyre.slipAngle=Math.abs(control.steering)*car.speed/38;
        tyre.locked=control.brake>.84&&car.speed>18&&grip<.92;
        tyre.temperature=clamp(tyre.temperature+(Math.abs(tyre.slipRatio)+tyre.slipAngle)*.7*dt-(tyre.temperature-82)*.018*dt,55,145);
        const wearRate=(Math.abs(tyre.slipRatio)*.000024+Math.max(0,tyre.temperature-108)*.000001)/t.tyreManagement;
        tyre.wear=clamp(tyre.wear+wearRate*dt*120,0,1);
        if(tyre.wear>.985&&this.rng.next()<.00002)tyre.punctured=true;
      }
      if(car.tyres.some(x=>x.punctured))car.speed=Math.min(car.speed,36);

      const prev=this.previousProgress.get(car.id)??bounded.t;
      car.progress=bounded.t;
      car.surface=surfaceAt(bounded.distance);
      car.sector=Math.min(3,Math.floor(bounded.t*3)+1);
      if(prev>.92&&bounded.t<.08&&this.state.time>1) {
        if(!this.started.has(car.id)) {
          this.started.add(car.id);this.lapStart.set(car.id,this.state.time);
        } else {
          car.lap++;
          const start=this.lapStart.get(car.id)??this.state.time;
          const lapTime=this.state.time-start;
          car.lastLap=lapTime;
          car.bestLap=car.bestLap===null?lapTime:Math.min(car.bestLap,lapTime);
          this.lapStart.set(car.id,this.state.time);
          if(car.lap>=this.laps) {
            car.status='FINISHED';
            this.incident('FINISH',[car.id],'LOW',car.lap);
          }
        }
      }
      this.previousProgress.set(car.id,bounded.t);
    }

    // Low-restitution contact. Car placement is resolved before damage is applied.
    for(let i=0;i<this.state.cars.length;i++)for(let j=i+1;j<this.state.cars.length;j++) {
      const a=this.state.cars[i],b=this.state.cars[j];
      if(a.status==='RETIRED'||b.status==='RETIRED')continue;
      const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),contact=this.state.time<7?2.25:2.95;
      if(d>0&&d<contact) {
        const nx=dx/d,nz=dz/d,push=(contact-d)*.52,relative=Math.abs(a.speed-b.speed);
        a.x-=nx*push;a.z-=nz*push;b.x+=nx*push;b.z+=nz*push;
        a.speed*=relative>9?.974:.995;b.speed*=relative>9?.974:.995;
        if(relative>4) {
          const damage=clamp((relative-4)*.00012,.0001,.0024);
          a.damage=clamp(a.damage+damage,0,1);b.damage=clamp(b.damage+damage,0,1);
          a.frontWing=clamp(a.frontWing-damage*.75,.35,1);b.frontWing=clamp(b.frontWing-damage*.75,.35,1);
        }
        if(this.state.tick%180===0&&relative>5)this.incident('CONTACT',[a.id,b.id],relative>14?'HIGH':'MEDIUM',Math.max(a.lap,b.lap));
      }
    }

    this.state.cars.sort((a,b)=>(b.lap+b.progress)-(a.lap+a.progress)).forEach((c,i)=>c.position=i+1);
    if(this.state.cars.every(c=>c.status!=='RUNNING'))this.state.flag='CHEQUERED';
  }

  private incident(type:RaceIncident['type'],cars:string[],severity:RaceIncident['severity'],lap:number) {
    const recent=this.state.incidents.at(-1);
    if(recent&&recent.type===type&&this.state.time-recent.time<2.5)return;
    this.state.incidents.push({id:`${this.state.tick}-${type}`,time:this.state.time,lap,type,cars,severity});
    if(this.state.incidents.length>80)this.state.incidents.shift();
  }
}

export function clamp(n:number,min:number,max:number){return Math.max(min,Math.min(max,Number.isFinite(n)?n:0));}
export function wrapAngle(a:number){while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;}
function lerp(a:number,b:number,t:number){return a+(b-a)*t;}
function lerpAngle(a:number,b:number,t:number){return a+wrapAngle(b-a)*t;}

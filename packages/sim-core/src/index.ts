import type { CarState, Control, RaceState, Surface } from '@agp/shared';

export const PHYSICS_HZ = 120;
export const FIXED_DT = 1 / PHYSICS_HZ;
export const TRACK_RX = 116;
export const TRACK_RZ = 72;
export const TRACK_WIDTH = 13;
const TAU = Math.PI * 2;

export class SeededRandom {
  constructor(private state = 0x9e3779b9) {}
  next(){ let x=this.state|0; x^=x<<13; x^=x>>>17; x^=x<<5; this.state=x|0; return (x>>>0)/4294967296; }
}

export function trackPoint(t:number){
  const a=t*TAU;
  const ripple=Math.sin(a*3)*7 + Math.sin(a*5)*2;
  return { x:Math.cos(a)*(TRACK_RX+ripple), z:Math.sin(a)*(TRACK_RZ+ripple*.32) };
}
export function trackTangent(t:number){
  const e=0.0001, p=trackPoint(t), q=trackPoint((t+e)%1); const l=Math.hypot(q.x-p.x,q.z-p.z)||1;
  return {x:(q.x-p.x)/l,z:(q.z-p.z)/l,yaw:Math.atan2(q.x-p.x,q.z-p.z)};
}
export function nearestTrack(x:number,z:number){
  let best=Infinity, bestT=0;
  for(let i=0;i<360;i++){ const t=i/360,p=trackPoint(t),d=(p.x-x)**2+(p.z-z)**2;if(d<best){best=d;bestT=t;} }
  for(let j=0;j<5;j++){ const span=1/(360*Math.pow(3,j)); let chosen=bestT;
    for(let k=-2;k<=2;k++){const t=(bestT+k*span+1)%1,p=trackPoint(t),d=(p.x-x)**2+(p.z-z)**2;if(d<best){best=d;chosen=t;}}
    bestT=chosen;
  }
  return {t:bestT,distance:Math.sqrt(best)};
}
export function surfaceAt(distance:number):Surface { return distance<TRACK_WIDTH*.5?'asphalt':distance<TRACK_WIDTH*.67?'kerb':distance<TRACK_WIDTH*1.1?'grass':'gravel'; }

export function createCar(id:string,name:string,number:number,colour:string,grid:number):CarState{
  const t=(0.985-grid*.004+1)%1,p=trackPoint(t),tan=trackTangent(t),lateral=(grid%2?1:-1)*2.2;
  return {id,name,number,colour,x:p.x+tan.z*lateral,z:p.z-tan.x*lateral,yaw:tan.yaw,speed:0,vx:0,vz:0,lap:0,progress:t,position:grid+1,lastLap:null,bestLap:null,sector:3,damage:0,frontWing:1,battery:1,surface:'asphalt',tyres:Array.from({length:4},()=>({temperature:72,wear:0,slipRatio:0,slipAngle:0,locked:false,punctured:false})),controls:{steering:0,throttle:0,brake:0,energyDeploy:0},status:'RUNNING'};
}

export class RaceSimulation {
  state:RaceState; private lapStart=new Map<string,number>(); private previousProgress=new Map<string,number>();
  constructor(cars:CarState[], public laps=3, seed=4127){
    this.state={time:0,tick:0,flag:'GREEN',laps,cars,seed}; cars.forEach(c=>{this.lapStart.set(c.id,0);this.previousProgress.set(c.id,c.progress);});
  }
  step(inputs:Map<string,Control>,dt=FIXED_DT){
    this.state.time+=dt; this.state.tick++;
    for(const car of this.state.cars){ if(car.status!=='RUNNING')continue; const raw=inputs.get(car.id)??car.controls;
      const control={steering:clamp(raw.steering,-1,1),throttle:clamp(raw.throttle,0,1),brake:clamp(raw.brake,0,1),energyDeploy:clamp(raw.energyDeploy,0,1)}; car.controls=control;
      const near=nearestTrack(car.x,car.z); car.surface=surfaceAt(near.distance); const grip={asphalt:1,kerb:.78,grass:.38,gravel:.24}[car.surface];
      const tyreHealth=1-car.tyres.reduce((s,t)=>s+t.wear,0)/5; const damageGrip=(1-car.damage*.35)*(.62+.38*car.frontWing);
      const deploy=Math.min(control.energyDeploy,car.battery*4); const drive=control.throttle*(13.8+deploy*2.8)*(1-car.speed/103); const drag=.00145*car.speed*car.speed;
      const brake=control.brake*30*grip; const longitudinal=drive-drag-brake*Math.sign(car.speed||1)-(car.surface==='gravel'?8:car.surface==='grass'?3:0);
      car.speed=clamp(car.speed+longitudinal*dt,0,105); const maxYaw=(1.9*grip*tyreHealth*damageGrip)/(1+car.speed*.012); car.yaw+=control.steering*maxYaw*dt*(car.speed/20);
      car.vx=Math.sin(car.yaw)*car.speed; car.vz=Math.cos(car.yaw)*car.speed; car.x+=car.vx*dt; car.z+=car.vz*dt;
      car.battery=clamp(car.battery-deploy*.011*dt+(1-control.throttle)*.003*dt,0,1);
      for(const tyre of car.tyres){ tyre.slipRatio=control.throttle*Math.max(0,car.speed/85)-control.brake*(car.speed/55); tyre.slipAngle=Math.abs(control.steering)*car.speed/38; tyre.locked=control.brake>.82&&car.speed>18&&grip<.9; tyre.temperature=clamp(tyre.temperature+(Math.abs(tyre.slipRatio)+tyre.slipAngle)*.7*dt-(tyre.temperature-82)*.018*dt,55,145); tyre.wear=clamp(tyre.wear+(Math.abs(tyre.slipRatio)*.000024+Math.max(0,tyre.temperature-108)*.000001)*dt*120,0,1); }
      if(near.distance>TRACK_WIDTH*1.9){car.damage=clamp(car.damage+.0007,0,1);car.speed*=.997;}
      const prev=this.previousProgress.get(car.id)??near.t; car.progress=near.t; car.sector=Math.min(3,Math.floor(near.t*3)+1);
      if(prev>.92&&near.t<.08&&this.state.time>2){car.lap++;const start=this.lapStart.get(car.id)??0;const lapTime=this.state.time-start;car.lastLap=lapTime;car.bestLap=car.bestLap===null?lapTime:Math.min(car.bestLap,lapTime);this.lapStart.set(car.id,this.state.time);if(car.lap>=this.laps)car.status='FINISHED';}
      this.previousProgress.set(car.id,near.t);
    }
    // Coherent low-restitution contact; avoids cars passing through one another.
    for(let i=0;i<this.state.cars.length;i++)for(let j=i+1;j<this.state.cars.length;j++){const a=this.state.cars[i],b=this.state.cars[j],dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);if(d>0&&d<3.25){const nx=dx/d,nz=dz/d,push=(3.25-d)*.5;a.x-=nx*push;a.z-=nz*push;b.x+=nx*push;b.z+=nz*push;a.speed*=.975;b.speed*=.975;a.damage=clamp(a.damage+.003,0,1);b.damage=clamp(b.damage+.003,0,1);}}
    this.state.cars.sort((a,b)=>(b.lap+b.progress)-(a.lap+a.progress)).forEach((c,i)=>c.position=i+1);
    if(this.state.cars.every(c=>c.status!=='RUNNING'))this.state.flag='CHEQUERED';
  }
}
export function clamp(n:number,min:number,max:number){return Math.max(min,Math.min(max,Number.isFinite(n)?n:0));}

import type { CarState, Control, RaceIncident, RaceState, Surface, Weather } from '@agp/shared';

export const PHYSICS_HZ = 120;
export const FIXED_DT = 1 / PHYSICS_HZ;
export const TRACK_RX = 128;
export const TRACK_RZ = 76;
export const TRACK_WIDTH = 12;

const CIRCUIT_POINTS=[
  [-55,-70],[-15,-72],[35,-68],[78,-56],[112,-34],[124,-4],[116,26],[91,48],
  [55,60],[26,52],[14,32],[26,14],[5,4],[-22,14],[-46,36],[-76,55],
  [-108,46],[-126,20],[-120,-5],[-96,-18],[-68,-10],[-50,-28],[-76,-42],[-90,-62]
] as const;

function rawTrackPoint(t:number){
  const n=CIRCUIT_POINTS.length,u=((t%1)+1)%1*n,i=Math.floor(u),f=u-i;
  const p0=CIRCUIT_POINTS[(i-1+n)%n],p1=CIRCUIT_POINTS[i%n],p2=CIRCUIT_POINTS[(i+1)%n],p3=CIRCUIT_POINTS[(i+2)%n];
  const f2=f*f,f3=f2*f,cat=(a:number,b:number,c:number,d:number)=>.5*((2*b)+(-a+c)*f+(2*a-5*b+4*c-d)*f2+(-a+3*b-3*c+d)*f3);
  return{x:cat(p0[0],p1[0],p2[0],p3[0]),z:cat(p0[1],p1[1],p2[1],p3[1])};
}

const ARC_SAMPLES=1536,ARC_DISTANCES:number[]=[0],ARC_POINTS=Array.from({length:ARC_SAMPLES+1},(_,i)=>rawTrackPoint(i/ARC_SAMPLES));
for(let i=1;i<ARC_POINTS.length;i++)ARC_DISTANCES[i]=ARC_DISTANCES[i-1]+Math.hypot(ARC_POINTS[i].x-ARC_POINTS[i-1].x,ARC_POINTS[i].z-ARC_POINTS[i-1].z);
export const TRACK_LENGTH=ARC_DISTANCES.at(-1)!;

export class SeededRandom {
  constructor(private state = 0x9e3779b9) {}
  next(){ let x=this.state|0; x^=x<<13; x^=x>>>17; x^=x<<5; this.state=x|0; return (x>>>0)/4294967296; }
}

export function trackPoint(t:number){
  const target=(((t%1)+1)%1)*TRACK_LENGTH;let lo=0,hi=ARC_DISTANCES.length-1;
  while(lo<hi){const mid=(lo+hi)>>1;if(ARC_DISTANCES[mid]<target)lo=mid+1;else hi=mid;}
  const upper=Math.max(1,lo),lower=upper-1,span=ARC_DISTANCES[upper]-ARC_DISTANCES[lower]||1,mix=(target-ARC_DISTANCES[lower])/span;
  return rawTrackPoint((lower+mix)/ARC_SAMPLES);
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
  const t=(0.982-grid*.0075+1)%1,p=trackPoint(t),tan=trackTangent(t),lateral=(grid%2?1:-1)*2.05;
  return {id,name,number,colour,x:p.x+tan.z*lateral,z:p.z-tan.x*lateral,yaw:tan.yaw,speed:0,vx:0,vz:0,lap:0,progress:t,position:grid+1,lastLap:null,bestLap:null,sector:3,damage:0,frontWing:1,battery:1,surface:'asphalt',tyres:Array.from({length:4},()=>({temperature:72,wear:0,slipRatio:0,slipAngle:0,locked:false,punctured:false})),controls:{steering:0,throttle:0,brake:0,energyDeploy:0},status:'RUNNING',compound:'MEDIUM',pitStops:0,penaltySeconds:0,fuel:1};
}

export class RaceSimulation {
  state:RaceState; private lapStart=new Map<string,number>(); private previousProgress=new Map<string,number>(); private started=new Set<string>();
  constructor(cars:CarState[], public laps=3, seed=4127, weather:Weather='CLEAR'){
    this.state={time:0,tick:0,flag:'GREEN',laps,cars,seed,weather,wetness:weather==='RAIN'?.72:0,incidents:[]}; cars.forEach(c=>{this.lapStart.set(c.id,0);this.previousProgress.set(c.id,c.progress);});
  }
  step(inputs:Map<string,Control>,dt=FIXED_DT){
    this.state.time+=dt; this.state.tick++;
    for(const car of this.state.cars){ if(car.status!=='RUNNING')continue; const raw=inputs.get(car.id)??car.controls;
      const control={steering:clamp(raw.steering,-1,1),throttle:clamp(raw.throttle,0,1),brake:clamp(raw.brake,0,1),energyDeploy:clamp(raw.energyDeploy,0,1)}; car.controls=control;
      const near=nearestTrack(car.x,car.z); car.surface=surfaceAt(near.distance); const wetGrip=1-this.state.wetness*(car.compound==='WET'?.13:car.compound==='INTERMEDIATE'?.22:.42); const grip={asphalt:1,kerb:.78,grass:.38,gravel:.24}[car.surface]*wetGrip;
      const tyreHealth=1-car.tyres.reduce((s,t)=>s+t.wear,0)/5; const damageGrip=(1-car.damage*.35)*(.62+.38*car.frontWing);
      const deploy=Math.min(control.energyDeploy,car.battery*4); const drive=control.throttle*(13.8+deploy*2.8)*(1-car.speed/103); const drag=.00145*car.speed*car.speed;
      const brake=(car.speed<5?0:control.brake)*30*grip; const longitudinal=drive-drag-brake*Math.sign(car.speed||1)-(car.surface==='gravel'?8:car.surface==='grass'?3:0);
      car.speed=clamp(car.speed+longitudinal*dt,0,105); const maxYaw=(1.9*grip*tyreHealth*damageGrip)/(1+car.speed*.012); car.yaw+=control.steering*maxYaw*dt*(car.speed/20);
      car.vx=Math.sin(car.yaw)*car.speed; car.vz=Math.cos(car.yaw)*car.speed; car.x+=car.vx*dt; car.z+=car.vz*dt;
      const bounded=nearestTrack(car.x,car.z),boundary=TRACK_WIDTH*.5+.72;if(bounded.distance>boundary){const p=trackPoint(bounded.t),tan=trackTangent(bounded.t),dx=car.x-p.x,dz=car.z-p.z,side=Math.sign(dx*tan.z-dz*tan.x)||1;car.x=p.x+tan.z*boundary*side;car.z=p.z-tan.x*boundary*side;car.speed=Math.max(5,car.speed*.78);car.yaw=lerpAngle(car.yaw,tan.yaw,.72);car.damage=clamp(car.damage+.0015,0,1);if(this.state.tick%360===0)this.incident('OFF_TRACK',[car.id],'LOW',car.lap);}else if(car.speed<3&&this.state.time>6&&control.throttle>.25){const tan=trackTangent(bounded.t);car.yaw=lerpAngle(car.yaw,tan.yaw,.16);car.speed+=7*dt;}
      car.battery=clamp(car.battery-deploy*.011*dt+(1-control.throttle)*.003*dt,0,1);car.fuel=clamp(car.fuel-control.throttle*.00012*dt,0,1);
      for(const tyre of car.tyres){ tyre.slipRatio=control.throttle*Math.max(0,car.speed/85)-control.brake*(car.speed/55); tyre.slipAngle=Math.abs(control.steering)*car.speed/38; tyre.locked=control.brake>.82&&car.speed>18&&grip<.9; tyre.temperature=clamp(tyre.temperature+(Math.abs(tyre.slipRatio)+tyre.slipAngle)*.7*dt-(tyre.temperature-82)*.018*dt,55,145); tyre.wear=clamp(tyre.wear+(Math.abs(tyre.slipRatio)*.000024+Math.max(0,tyre.temperature-108)*.000001)*dt*120,0,1); }
      if(near.distance>TRACK_WIDTH*1.9){car.damage=clamp(car.damage+.0007,0,1);car.speed*=.997;if(this.state.tick%600===0)this.incident('OFF_TRACK',[car.id],car.damage>.3?'MEDIUM':'LOW',car.lap);}
      const prev=this.previousProgress.get(car.id)??near.t; car.progress=near.t; car.sector=Math.min(3,Math.floor(near.t*3)+1);
      if(prev>.92&&near.t<.08&&this.state.time>1){if(!this.started.has(car.id)){this.started.add(car.id);this.lapStart.set(car.id,this.state.time);}else{car.lap++;const start=this.lapStart.get(car.id)??this.state.time;const lapTime=this.state.time-start;car.lastLap=lapTime;car.bestLap=car.bestLap===null?lapTime:Math.min(car.bestLap,lapTime);this.lapStart.set(car.id,this.state.time);if(car.lap>=this.laps){car.status='FINISHED';this.incident('FINISH',[car.id],'LOW',car.lap);}}}
      this.previousProgress.set(car.id,near.t);
    }
    // Coherent low-restitution contact; avoids cars passing through one another.
    for(let i=0;i<this.state.cars.length;i++)for(let j=i+1;j<this.state.cars.length;j++){const a=this.state.cars[i],b=this.state.cars[j],dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),contact=this.state.time<7?2.45:3.05;if(d>0&&d<contact){const nx=dx/d,nz=dz/d,push=(contact-d)*.52,relative=Math.abs(a.speed-b.speed);a.x-=nx*push;a.z-=nz*push;b.x+=nx*push;b.z+=nz*push;a.speed*=relative>9?.975:.994;b.speed*=relative>9?.975:.994;if(relative>4){const damage=clamp((relative-4)*.00018,.0002,.0025);a.damage=clamp(a.damage+damage,0,1);b.damage=clamp(b.damage+damage,0,1);}if(this.state.tick%180===0&&relative>5)this.incident('CONTACT',[a.id,b.id],relative>14?'HIGH':'MEDIUM',Math.max(a.lap,b.lap));}}
    this.state.cars.sort((a,b)=>(b.lap+b.progress)-(a.lap+a.progress)).forEach((c,i)=>c.position=i+1);
    if(this.state.cars.every(c=>c.status!=='RUNNING'))this.state.flag='CHEQUERED';
  }
  private incident(type:RaceIncident['type'],cars:string[],severity:RaceIncident['severity'],lap:number){const recent=this.state.incidents.at(-1);if(recent&&recent.type===type&&this.state.time-recent.time<3)return;this.state.incidents.push({id:`${this.state.tick}-${type}`,time:this.state.time,lap,type,cars,severity});if(this.state.incidents.length>60)this.state.incidents.shift();}
}
export function clamp(n:number,min:number,max:number){return Math.max(min,Math.min(max,Number.isFinite(n)?n:0));}
function lerpAngle(a:number,b:number,t:number){const d=Math.atan2(Math.sin(b-a),Math.cos(b-a));return a+d*t;}

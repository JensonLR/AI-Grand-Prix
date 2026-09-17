import type { Control,RaceIncident,TyreCompound,CarState } from '@agp/shared';
import { RaceSimulation,FIXED_DT,clamp,trackLength,trackPoint,trackTangent } from '@agp/sim-core';

type PitPhase='REQUESTED'|'ENTRY'|'STOP'|'EXIT';
interface PitRuntime {phase:PitPhase;timer:number;target:TyreCompound;stopX?:number;stopZ?:number;}

/** Sporting layer around the deterministic vehicle simulation. */
export class ChampionshipRaceSimulation extends RaceSimulation {
  private pits=new Map<string,PitRuntime>();
  private seenIncident='';
  private flagUntil=0;
  private recentHigh:number[]=[];
  private redOrder:string[]=[];
  private restartPending=false;

  override step(inputs:Map<string,Control>,dt=FIXED_DT){
    const strategic=new Map<string,Control>();
    const ordered=[...this.state.cars].filter(c=>c.status==='RUNNING').sort((a,b)=>a.position-b.position);
    for(const car of this.state.cars){
      const raw=inputs.get(car.id)??car.controls;
      let throttle=raw.throttle,brake=raw.brake;
      let pit=this.pits.get(car.id);

      // A standing start is a sporting protocol, not a neural cold-start test. The neural
      // driver keeps steering authority, while launch control guarantees every healthy car
      // releases the brakes and gets off its grid slot before full motor authority takes over.
      if(this.state.time<=4.5&&this.state.flag==='GREEN'&&car.status==='RUNNING'){
        throttle=Math.max(throttle,.72);
        brake=0;
      }

      if(!pit&&car.status==='RUNNING'&&car.lap<this.laps-1&&this.shouldPit(car)){
        pit={phase:'REQUESTED',timer:0,target:this.targetCompound()};this.pits.set(car.id,pit);
      }
      if(pit?.phase==='REQUESTED'&&car.progress>.90)pit.phase='ENTRY';
      if(pit?.phase==='ENTRY'){
        throttle=Math.min(throttle,.34);if(car.speed>22)brake=Math.max(brake,.52);
        if(car.progress>.982||car.progress<.018){pit.phase='STOP';pit.timer=0;pit.stopX=car.x;pit.stopZ=car.z;}
      }
      if(pit?.phase==='STOP'){throttle=0;brake=1;}
      if(pit?.phase==='EXIT'){throttle=Math.min(throttle,.55);if(car.speed>25)brake=Math.max(brake,.3);}
      if(this.state.flag==='YELLOW')throttle=Math.min(throttle,.72);
      if(this.state.flag==='VSC'){throttle=Math.min(throttle,.42);if(car.speed>38)brake=Math.max(brake,.24);}
      if(this.state.flag==='SAFETY_CAR'){
        const index=ordered.findIndex(c=>c.id===car.id),ahead=index>0?ordered[index-1]:null,target=index===0?28:30;
        throttle=Math.min(throttle,car.speed<target?.38:.12);if(car.speed>target+1)brake=Math.max(brake,.34);
        if(ahead){let gap=(ahead.lap+ahead.progress)-(car.lap+car.progress);if(gap<0)gap+=1;if(gap<.010){throttle=Math.min(throttle,.08);if(car.speed>Math.max(12,ahead.speed-1))brake=Math.max(brake,.44);}}
      }
      if(this.state.flag==='RED'){throttle=0;brake=1;}
      strategic.set(car.id,{...raw,throttle,brake});
    }
    super.step(strategic,dt);
    if(this.state.flag==='RED')for(const car of this.state.cars)if(car.status==='RUNNING'){car.speed=0;car.vx=0;car.vz=0;car.controls={...car.controls,throttle:0,brake:1};}
    for(const car of this.state.cars){
      const pit=this.pits.get(car.id);if(!pit)continue;
      if(pit.phase==='ENTRY')car.speed=Math.min(car.speed,22);
      if(pit.phase==='STOP'){
        pit.timer+=dt;car.speed=0;car.vx=0;car.vz=0;if(pit.stopX!==undefined)car.x=pit.stopX;if(pit.stopZ!==undefined)car.z=pit.stopZ;
        if(pit.timer>=2.4){car.compound=pit.target;car.pitStops++;for(const tyre of car.tyres){tyre.wear=0;tyre.temperature=78;tyre.slipAngle=0;tyre.slipRatio=0;tyre.locked=false;tyre.punctured=false;}this.pushIncident('PIT',[car.id],'LOW',car.lap);pit.phase='EXIT';pit.timer=0;}
      }else if(pit.phase==='EXIT'){car.speed=Math.min(car.speed,25);if(car.progress>.07&&car.progress<.90)this.pits.delete(car.id);}
    }
    const latest=this.state.incidents.at(-1);if(latest&&latest.id!==this.seenIncident&&latest.type!=='FLAG'){this.seenIncident=latest.id;this.handleIncident(latest);}this.advanceRaceControl();if(this.state.cars.every(c=>c.status!=='RUNNING'))this.state.flag='CHEQUERED';
  }

  private handleIncident(incident:RaceIncident){
    if(this.state.flag==='RED'||this.state.flag==='CHEQUERED')return;
    if(incident.severity==='HIGH'){this.recentHigh=this.recentHigh.filter(t=>this.state.time-t<14);this.recentHigh.push(this.state.time);if(this.recentHigh.length>=2||this.state.wetness>.82){this.enterRedFlag(incident);return;}this.state.flag='SAFETY_CAR';this.flagUntil=Math.max(this.flagUntil,this.state.time+18);this.pushIncident('FLAG',incident.cars,'HIGH',incident.lap);return;}
    if(incident.severity==='MEDIUM'){this.state.flag='VSC';this.flagUntil=Math.max(this.flagUntil,this.state.time+7);this.pushIncident('FLAG',incident.cars,'MEDIUM',incident.lap);return;}
    if(incident.type==='OFF_TRACK'){this.state.flag='YELLOW';this.flagUntil=Math.max(this.flagUntil,this.state.time+3.5);this.pushIncident('FLAG',incident.cars,'LOW',incident.lap);}
  }
  private enterRedFlag(incident:RaceIncident){this.redOrder=[...this.state.cars].filter(c=>c.status==='RUNNING').sort((a,b)=>a.position-b.position).map(c=>c.id);this.state.flag='RED';this.flagUntil=this.state.time+8;this.restartPending=true;this.pushIncident('FLAG',incident.cars,'HIGH',incident.lap);}
  private advanceRaceControl(){if(this.state.flag==='CHEQUERED'||this.state.time<this.flagUntil)return;if(this.state.flag==='RED'&&this.restartPending){this.prepareRollingRestart();this.restartPending=false;this.state.flag='SAFETY_CAR';this.flagUntil=this.state.time+11;this.pushIncident('FLAG',this.redOrder.slice(0,1),'MEDIUM',this.state.cars[0]?.lap??0);return;}if(['YELLOW','VSC','SAFETY_CAR'].includes(this.state.flag)){this.state.flag='GREEN';this.flagUntil=0;this.pushIncident('FLAG',[],'LOW',this.state.cars[0]?.lap??0);}}
  private prepareRollingRestart(){const live=this.redOrder.map(id=>this.state.cars.find(c=>c.id===id)).filter((c):c is CarState=>Boolean(c&&c.status==='RUNNING'));if(!live.length)return;const lapLen=trackLength(this.trackId),leaderScore=live[0].lap+live[0].progress,spacing=8.5/lapLen;live.forEach((car,i)=>{const score=Math.max(0,leaderScore-i*spacing),lap=Math.floor(score),progress=score-lap,p=trackPoint(progress,this.trackId),tan=trackTangent(progress,this.trackId);car.lap=lap;car.progress=progress;car.x=p.x;car.z=p.z;car.yaw=tan.yaw;car.speed=0;car.vx=0;car.vz=0;car.controls={...car.controls,throttle:0,brake:1};});}

  private shouldPit(car:typeof this.state.cars[number]){
    if(this.state.flag==='RED')return false;
    const punctured=car.tyres.some(t=>t.punctured);
    if(punctured)return true;
    // Grid positions sit around progress .98, exactly where pit entry lives. Never interpret
    // that starting coordinate as a strategy window: healthy cars must complete lap one first.
    if(car.lap<1||this.state.time<25)return false;
    const wear=car.tyres.reduce((n,t)=>n+t.wear,0)/car.tyres.length;
    if(this.state.wetness>.55&&car.compound!=='WET')return true;
    if(this.state.wetness>.18&&this.state.wetness<=.55&&!['INTERMEDIATE','WET'].includes(car.compound))return true;
    if(this.state.wetness<.10&&['INTERMEDIATE','WET'].includes(car.compound))return true;
    return wear>.66;
  }
  private targetCompound():TyreCompound{if(this.state.wetness>.55)return 'WET';if(this.state.wetness>.18)return 'INTERMEDIATE';return this.state.time<170?'MEDIUM':'HARD';}
  private pushIncident(type:RaceIncident['type'],cars:string[],severity:RaceIncident['severity'],lap:number){const id=`${this.state.tick}-${type}-${cars.join('-')}-${this.state.incidents.length}`;if(this.state.incidents.some(i=>i.id===id))return;this.state.incidents.push({id,time:this.state.time,lap,type,cars,severity});if(this.state.incidents.length>80)this.state.incidents.shift();}
  getPitPhase(carId:string){return this.pits.get(carId)?.phase??null;}
  getPitTimer(carId:string){return clamp(this.pits.get(carId)?.timer??0,0,9);}
}

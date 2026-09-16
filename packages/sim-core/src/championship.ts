import type { Control,RaceIncident,TyreCompound } from '@agp/shared';
import { RaceSimulation,FIXED_DT,clamp } from './index.ts';

type PitPhase='REQUESTED'|'ENTRY'|'STOP'|'EXIT';
interface PitRuntime {phase:PitPhase;timer:number;target:TyreCompound;stopX?:number;stopZ?:number;}

/**
 * Sporting layer around the deterministic vehicle simulation.
 * It adds pit procedure, automatic tyre strategy and temporary race-control flags
 * without changing the underlying car dynamics or neural driver implementation.
 */
export class ChampionshipRaceSimulation extends RaceSimulation {
  private pits=new Map<string,PitRuntime>();
  private seenIncident='';
  private flagUntil=0;

  override step(inputs:Map<string,Control>,dt=FIXED_DT){
    const strategic=new Map<string,Control>();
    for(const car of this.state.cars){
      const raw=inputs.get(car.id)??car.controls;
      let throttle=raw.throttle,brake=raw.brake;
      let pit=this.pits.get(car.id);
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
      if(this.state.flag==='YELLOW'){throttle=Math.min(throttle,.72);}
      if(this.state.flag==='VSC'){throttle=Math.min(throttle,.48);if(car.speed>44)brake=Math.max(brake,.18);}
      strategic.set(car.id,{...raw,throttle,brake});
    }

    super.step(strategic,dt);

    for(const car of this.state.cars){
      const pit=this.pits.get(car.id);if(!pit)continue;
      if(pit.phase==='ENTRY')car.speed=Math.min(car.speed,22);
      if(pit.phase==='STOP'){
        pit.timer+=dt;car.speed=0;car.vx=0;car.vz=0;if(pit.stopX!==undefined)car.x=pit.stopX;if(pit.stopZ!==undefined)car.z=pit.stopZ;
        if(pit.timer>=2.4){
          car.compound=pit.target;car.pitStops++;
          for(const tyre of car.tyres){tyre.wear=0;tyre.temperature=78;tyre.slipAngle=0;tyre.slipRatio=0;tyre.locked=false;tyre.punctured=false;}
          this.pushIncident('PIT',[car.id],'LOW',car.lap);pit.phase='EXIT';pit.timer=0;
        }
      } else if(pit.phase==='EXIT'){
        car.speed=Math.min(car.speed,25);
        if(car.progress>.07&&car.progress<.90)this.pits.delete(car.id);
      }
    }

    const latest=this.state.incidents.at(-1);
    if(latest&&latest.id!==this.seenIncident){
      this.seenIncident=latest.id;
      if(latest.severity==='HIGH'){this.state.flag='VSC';this.flagUntil=Math.max(this.flagUntil,this.state.time+7);}
      else if(latest.severity==='MEDIUM'){this.state.flag='YELLOW';this.flagUntil=Math.max(this.flagUntil,this.state.time+4);}
    }
    if((this.state.flag==='YELLOW'||this.state.flag==='VSC')&&this.state.time>=this.flagUntil)this.state.flag='GREEN';
    if(this.state.cars.every(c=>c.status!=='RUNNING'))this.state.flag='CHEQUERED';
  }

  private shouldPit(car:typeof this.state.cars[number]){
    const wear=car.tyres.reduce((n,t)=>n+t.wear,0)/car.tyres.length;
    if(car.tyres.some(t=>t.punctured))return true;
    if(this.state.wetness>.55&&car.compound!=='WET')return true;
    if(this.state.wetness>.18&&this.state.wetness<=.55&&!['INTERMEDIATE','WET'].includes(car.compound))return true;
    if(this.state.wetness<.10&&['INTERMEDIATE','WET'].includes(car.compound))return true;
    return wear>.66;
  }

  private targetCompound():TyreCompound{
    if(this.state.wetness>.55)return 'WET';
    if(this.state.wetness>.18)return 'INTERMEDIATE';
    return this.state.time<170?'MEDIUM':'HARD';
  }

  private pushIncident(type:RaceIncident['type'],cars:string[],severity:RaceIncident['severity'],lap:number){
    const id=`${this.state.tick}-${type}-${cars.join('-')}`;
    if(this.state.incidents.some(i=>i.id===id))return;
    this.state.incidents.push({id,time:this.state.time,lap,type,cars,severity});
    if(this.state.incidents.length>80)this.state.incidents.shift();
  }

  getPitPhase(carId:string){return this.pits.get(carId)?.phase??null;}
  getPitTimer(carId:string){return clamp(this.pits.get(carId)?.timer??0,0,9);}
}

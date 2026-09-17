import type { RaceIncident,RaceState } from '@agp/shared';
import type { CameraMode } from './FlyGrandPrixScene';

export interface BroadcastShot {
  focusId:string;
  camera:CameraMode;
  label:string;
  detail:string;
  priority:'RACE'|'BATTLE'|'PIT'|'INCIDENT'|'FINISH';
  incident?:RaceIncident;
}

const raceProgress=(car:RaceState['cars'][number])=>car.lap+car.progress;
const recentIncident=(state:RaceState)=>[...state.incidents].reverse().find(event=>state.time-event.time<=5.5);

/**
 * Deterministic television director. It only chooses presentation targets/cameras; it never
 * changes simulation state, neural inputs, controls, classification or championship data.
 */
export function chooseBroadcastShot(state:RaceState,beat:number):BroadcastShot|null{
  const ordered=[...state.cars].sort((a,b)=>a.position-b.position);
  if(!ordered.length)return null;
  const leader=ordered[0];
  const incident=recentIncident(state);
  if(incident){
    const car=ordered.find(item=>incident.cars.includes(item.id))??leader;
    const pit=incident.type==='PIT';
    return {
      focusId:car.id,
      camera:pit?'trackside':incident.severity==='HIGH'?'aerial':'tcam',
      label:pit?'PIT LANE':'INCIDENT REVIEW',
      detail:`${incident.type.replaceAll('_',' ')} · ${car.name}`,
      priority:pit?'PIT':'INCIDENT',
      incident
    };
  }
  if(state.flag==='CHEQUERED')return {focusId:leader.id,camera:'broadcast',label:'WINNER',detail:leader.name,priority:'FINISH'};
  if(leader.lap>=Math.max(0,state.laps-1)&&leader.progress>.68){
    return {focusId:leader.id,camera:beat%2?'tcam':'trackside',label:'FINAL LAP',detail:`P1 · ${leader.name}`,priority:'FINISH'};
  }
  let battle:null|{front:typeof leader;back:typeof leader;gap:number}=null;
  for(let i=1;i<ordered.length;i++){
    const front=ordered[i-1],back=ordered[i];
    if(front.status!=='RUNNING'||back.status!=='RUNNING')continue;
    const gap=Math.abs(raceProgress(front)-raceProgress(back));
    if(gap<.012&&(!battle||gap<battle.gap))battle={front,back,gap};
  }
  if(battle){
    const car=beat%2?battle.back:battle.front;
    return {focusId:car.id,camera:beat%3===0?'trackside':'tcam',label:'BATTLE',detail:`P${battle.front.position} / P${battle.back.position} · ${battle.front.name} vs ${battle.back.name}`,priority:'BATTLE'};
  }
  const midfield=ordered[Math.min(ordered.length-1,4+(beat%Math.max(1,Math.min(8,ordered.length-4))))]??leader;
  const cycle:CameraMode[]=['broadcast','trackside','tcam','aerial','chase'];
  const focus=beat%4===0?leader:midfield;
  return {focusId:focus.id,camera:cycle[beat%cycle.length],label:'WORLD FEED',detail:`P${focus.position} · ${focus.name}`,priority:'RACE'};
}

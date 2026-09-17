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
const recentIncident=(state:RaceState)=>[...state.incidents].reverse().find(event=>state.time-event.time<=7.5);

/**
 * Broadcast director V4.
 * The old director changed subject/camera on almost every 4.5 s beat, which made the race
 * feel like a slideshow. V4 deliberately holds a story for two beats (~9 s) and only cuts
 * early for a genuine incident/pit event. Simulation state is never modified here.
 */
export function chooseBroadcastShot(state:RaceState,beat:number):BroadcastShot|null{
  const ordered=[...state.cars].sort((a,b)=>a.position-b.position);
  if(!ordered.length)return null;
  const leader=ordered[0];
  const storyBeat=Math.floor(beat/2);
  const incident=recentIncident(state);

  if(incident){
    const car=ordered.find(item=>incident.cars.includes(item.id))??leader;
    const pit=incident.type==='PIT';
    return {
      focusId:car.id,
      camera:pit?'trackside':incident.severity==='HIGH'?'aerial':'broadcast',
      label:pit?'PIT WINDOW':'RACE CONTROL',
      detail:`${incident.type.replaceAll('_',' ')} · ${car.name}`,
      priority:pit?'PIT':'INCIDENT',
      incident
    };
  }

  if(state.flag==='CHEQUERED')return {focusId:leader.id,camera:'broadcast',label:'WINNER',detail:leader.name,priority:'FINISH'};

  if(leader.lap>=Math.max(0,state.laps-1)&&leader.progress>.62){
    return {focusId:leader.id,camera:storyBeat%3===1?'tcam':'broadcast',label:'FINAL LAP',detail:`P1 · ${leader.name}`,priority:'FINISH'};
  }

  let battle:null|{front:typeof leader;back:typeof leader;gap:number}=null;
  for(let i=1;i<ordered.length;i++){
    const front=ordered[i-1],back=ordered[i];
    if(front.status!=='RUNNING'||back.status!=='RUNNING')continue;
    const gap=Math.abs(raceProgress(front)-raceProgress(back));
    if(gap<.014&&(!battle||gap<battle.gap))battle={front,back,gap};
  }
  if(battle){
    // Hold the same pair long enough for the viewer to understand the fight.
    const car=storyBeat%2===0?battle.back:battle.front;
    const camera:CameraMode=storyBeat%4===3?'tcam':'broadcast';
    return {focusId:car.id,camera,label:'BATTLE FOR POSITION',detail:`P${battle.front.position} / P${battle.back.position} · ${battle.front.name} vs ${battle.back.name}`,priority:'BATTLE'};
  }

  // A race story should have rhythm: leader, upper midfield, then a different battle group.
  // Subjects change every two UI beats instead of every beat.
  const candidates=ordered.filter(car=>car.status==='RUNNING');
  const upper=candidates[Math.min(candidates.length-1,3+(storyBeat%4))]??leader;
  const lower=candidates[Math.min(candidates.length-1,8+(storyBeat%5))]??upper;
  const focus=storyBeat%5===0?leader:storyBeat%3===0?lower:upper;
  const camera:CameraMode=storyBeat%7===5?'trackside':storyBeat%9===7?'tcam':'broadcast';
  return {focusId:focus.id,camera,label:'WORLD FEED',detail:`P${focus.position} · ${focus.name}`,priority:'RACE'};
}

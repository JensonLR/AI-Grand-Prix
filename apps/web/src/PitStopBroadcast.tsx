import type { CSSProperties } from 'react';
import type { RaceState } from '@agp/shared';
import { ENTRANTS,teamFor } from './championship';
import { TeamMark } from './TeamMark';

export function PitStopBroadcast({state}:{state:RaceState}){
  const event=[...state.incidents].reverse().find(item=>item.type==='PIT'&&state.time-item.time<=5.5);
  if(!event)return null;
  const driver=ENTRANTS.find(item=>event.cars.includes(item.id));
  if(!driver)return null;
  const team=teamFor(driver),age=Math.max(0,state.time-event.time),phase=age<.75?'BOX':age<3.15?'SERVICE':'RELEASE';
  const service=Math.min(2.4,Math.max(0,age-.65));
  return <aside className={`pit-broadcast phase-${phase.toLowerCase()}`} style={{'--pit-team':team.colour,'--pit-secondary':team.secondary,'--pit-accent':team.accent} as CSSProperties} aria-live="polite">
    <header><span className="pit-live"><i/> PIT LANE</span><TeamMark teamId={team.id}/><b>{team.short}</b></header>
    <div className="pit-driver"><span>#{driver.number}</span><strong>{driver.name}</strong><small>{phase==='BOX'?'HITTING MARKS':phase==='SERVICE'?'TYRES · JACK · RELEASE CHECK':'PIT EXIT'}</small></div>
    <div className="pit-stage" aria-hidden>
      <div className="pit-car"><i/><i/><i/><i/></div>
      <div className="pit-crew front-left"><i/><b/></div><div className="pit-crew front-right"><i/><b/></div>
      <div className="pit-crew rear-left"><i/><b/></div><div className="pit-crew rear-right"><i/><b/></div>
      <div className="pit-crew jack"><i/><b/></div><div className="pit-crew release"><i/><b/></div>
      <div className="pit-wheel wheel-a"/><div className="pit-wheel wheel-b"/><div className="pit-wheel wheel-c"/><div className="pit-wheel wheel-d"/>
    </div>
    <footer><span><small>STOP</small><strong>{service.toFixed(1)}s</strong></span><i><em style={{width:`${Math.min(100,service/2.4*100)}%`}}/></i><b>{phase}</b></footer>
  </aside>;
}

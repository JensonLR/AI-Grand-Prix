import type { CSSProperties } from 'react';
import type { SessionType,TrackDefinition } from '@agp/shared';
import { ChampionshipMark } from './ChampionshipBrand';
import { CircuitSilhouette } from './CircuitSilhouette';
import { TeamMark } from './TeamMark';
import { ENTRANTS,TEAMS } from './championship';

export function PaddockHome({track,onMode,onWeekend,onReplay,onDrivers,onGarage,onCalendar,onChampionship,onConnectome,error}:{track:any;onMode:(s:SessionType,trackId?:string)=>void;onWeekend:()=>void;onReplay:()=>void;onDrivers:()=>void;onGarage:()=>void;onCalendar:()=>void;onChampionship:()=>void;onConnectome:()=>void;error:string}){
  return <section className="paddock-v2">
    <header className="paddock-top"><ChampionshipMark/><div className="paddock-live"><i/><span>LOCAL NEURAL GRID</span><b>22 / 22 READY</b></div></header>
    <div className="paddock-grid">
      <article className="paddock-round">
        <header><div><small>CURRENT CHAMPIONSHIP ROUND</small><strong>{String(track.round).padStart(2,'0')}</strong></div><span>{track.sprint?'SPRINT WEEKEND':'GRAND PRIX WEEKEND'}</span></header>
        <CircuitSilhouette trackId={track.id}/>
        <div className="paddock-round-copy"><small>{track.country.toUpperCase()} · {track.dates}</small><h2>{track.grandPrix}</h2><p>{track.circuitName} · {track.venue}{track.officialLengthM?` · ${(track.officialLengthM/1000).toFixed(3)} KM`:''}</p></div>
        <div className="paddock-round-actions"><button onClick={onWeekend}>START RACE WEEKEND <b>→</b></button><button onClick={()=>onMode('QUICK_RACE',track.id)}>QUICK RACE</button></div>
      </article>
      <div className="paddock-modes">
        <button className="paddock-mode primary" onClick={onWeekend}><small>01 · CHAMPIONSHIP</small><strong>RACE WEEKEND</strong><span>Practice · Qualifying · Grand Prix · persistent standings</span><b>→</b></button>
        <button className="paddock-mode" onClick={onCalendar}><small>02 · SEASON</small><strong>24-ROUND CALENDAR</strong><span>Every 2027 championship circuit available and playable.</span><b>→</b></button>
        <button className="paddock-mode" onClick={()=>onMode('NEUTRAL_TEST')}><small>03 · SCIENCE</small><strong>NEUTRAL TEST</strong><span>Identical machinery. Frozen conditions. Compare the brains.</span><b>→</b></button>
        <button className="paddock-mode" onClick={onConnectome}><small>04 · TELEMETRY</small><strong>CONNECTOME LAB</strong><span>Inspect neural activity, phenotype and persistent calibration.</span><b>→</b></button>
        <button className="paddock-mode" onClick={onReplay}><small>05 · BROADCAST</small><strong>RACE ARCHIVE</strong><span>Replay races with timing, cameras and neural telemetry.</span><b>↗</b></button>
        <button className="paddock-mode" onClick={()=>onMode('HUMAN_TEST',track.id)}><small>06 · DRIVE</small><strong>HUMAN TEST</strong><span>Take an AGP development car onto the current circuit.</span><b>→</b></button>
      </div>
    </div>
    <section className="paddock-constructors"><header><span>THE GRID</span><div><button onClick={onDrivers}>22 DRIVERS</button><button onClick={onGarage}>11 CONSTRUCTORS</button><button onClick={onChampionship}>STANDINGS</button></div></header><div>{TEAMS.map(t=><button key={t.id} onClick={onGarage} style={{'--team':t.colour,'--accent':t.accent} as CSSProperties}><TeamMark teamId={t.id}/><span><strong>{t.short}</strong><small>{ENTRANTS.filter(d=>d.teamId===t.id).map(d=>`#${d.number}`).join(' · ')}</small></span></button>)}</div></section>
    {error&&<div className="error-toast">{error}</div>}
  </section>
}

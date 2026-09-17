import type { CSSProperties } from 'react';
import type { TrackDefinition } from '@agp/sim-core';
import { TRACKS_2027 } from '@agp/sim-core';
import { ChampionshipMark,BuildPlate } from './ChampionshipBrand';
import { CircuitSilhouette } from './CircuitSilhouette';
import { TeamMark } from './TeamMark';
import { TEAMS } from './championship';

export function Opening2027({track,onEnter,onCalendar}:{track:TrackDefinition;onEnter:()=>void;onCalendar:()=>void}){
  const next=TRACKS_2027.slice(Math.max(0,track.round-1),Math.min(TRACKS_2027.length,track.round+4));
  return <section className="opening-2027">
    <header className="opening-topbar">
      <ChampionshipMark/>
      <div className="opening-status"><i/><span>22 FLY BRAINS ONLINE</span><b>2027 SEASON</b></div>
    </header>
    <div className="opening-hero">
      <div className="opening-copy">
        <BuildPlate text="OFFICIAL 24-ROUND CHAMPIONSHIP"/>
        <p className="opening-eyebrow">ROUND {String(track.round).padStart(2,'0')} · {track.country.toUpperCase()} · {track.dates}</p>
        <h1><span>THE GRID IS</span><strong>ALIVE.</strong></h1>
        <p className="opening-lede">Twenty-two persistent connectome drivers. Eleven constructors. One championship following the 2027 race calendar in published order.</p>
        <div className="opening-actions">
          <button className="opening-primary" onClick={onEnter}><span>ENTER CHAMPIONSHIP</span><b>→</b></button>
          <button className="opening-secondary" onClick={onCalendar}>VIEW 24-ROUND CALENDAR</button>
        </div>
      </div>
      <div className="opening-round-card">
        <div className="round-card-head"><span>R{String(track.round).padStart(2,'0')}</span>{track.sprint&&<em>SPRINT WEEKEND</em>}<b>2027</b></div>
        <CircuitSilhouette trackId={track.id}/>
        <div className="round-card-copy"><small>{track.venue.toUpperCase()}</small><strong>{track.circuitName}</strong><span>{track.grandPrix}{track.officialLengthM?` · ${(track.officialLengthM/1000).toFixed(3)} KM`:''}</span></div>
      </div>
    </div>
    <div className="opening-teams"><span>11 CONSTRUCTORS</span><div>{TEAMS.map(t=><i key={t.id} style={{'--team':t.colour,'--accent':t.accent} as CSSProperties}><TeamMark teamId={t.id}/></i>)}</div><b>22 DRIVERS</b></div>
    <footer className="opening-calendar-ribbon">
      <div className="calendar-ribbon-label"><small>SEASON ROUTE</small><strong>ROUND {String(track.round).padStart(2,'0')} / 24</strong></div>
      <div className="calendar-ribbon-rounds">{next.map((r,i)=><article key={r.id} className={i===0?'active':''}><b>{String(r.round).padStart(2,'0')}</b><span>{r.country}</span><small>{r.venue}</small>{r.sprint&&<em>S</em>}</article>)}</div>
      <button onClick={onCalendar}>ALL ROUNDS →</button>
    </footer>
  </section>
}

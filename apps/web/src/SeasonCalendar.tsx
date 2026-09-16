import type { CSSProperties } from 'react';
import { TRACKS_2027,trackPoint } from '@agp/sim-core';

export function SeasonCalendar({currentRound,onQuickRace,onBack}:{currentRound:number;onQuickRace:(trackId:string)=>void;onBack:()=>void}){
  return <section className="panel-screen cwc-season"><header className="panel-head"><button className="mini-brand" onClick={onBack}><b>AI</b><span>GRAND PRIX</span></button><div><small>OFFICIAL CHAMPIONSHIP ORDER</small><h2>2027 CALENDAR</h2></div><button className="close" onClick={onBack}>BACK</button></header><div className="cwc-season-intro"><div><small>CONNECTOME WORLD CHAMPIONSHIP</small><h3>24 ROUNDS.<br/>22 BRAINS.</h3><p>The championship follows the published 2027 Formula 1 venue order. Track geometry is stored as AGP simulation data and rendered in our own visual system.</p></div><div><strong>{String(currentRound).padStart(2,'0')} / 24</strong><span>CURRENT ROUND</span></div></div><div className="cwc-calendar-grid">{TRACKS_2027.map(track=><article key={track.id} className={track.round===currentRound?'current':track.round<currentRound?'complete':''} style={{'--round':`${track.round}`} as CSSProperties}><header><b>{String(track.round).padStart(2,'0')}</b><span>{track.country}</span>{track.sprint&&<em>SPRINT</em>}</header><MiniTrack trackId={track.id}/><div><small>{track.dates} · {track.venue}</small><strong>{track.grandPrix}</strong><span>{track.circuitName}{track.officialLengthM?` · ${(track.officialLengthM/1000).toFixed(3)} KM`:''}</span></div><button onClick={()=>onQuickRace(track.id)}>QUICK RACE <b>→</b></button></article>)}</div></section>
}

function MiniTrack({trackId}:{trackId:string}){
  const pts=Array.from({length:96},(_,i)=>trackPoint(i/96,trackId));
  const minX=Math.min(...pts.map(p=>p.x)),maxX=Math.max(...pts.map(p=>p.x)),minZ=Math.min(...pts.map(p=>p.z)),maxZ=Math.max(...pts.map(p=>p.z)),span=Math.max(maxX-minX,maxZ-minZ)||1;
  const path=pts.map((p,i)=>`${i?'L':'M'} ${10+(p.x-minX)/span*80} ${10+(p.z-minZ)/span*80}`).join(' ')+' Z';
  return <svg viewBox="0 0 100 100" aria-label={`${trackId} circuit layout`}><path d={path}/></svg>
}

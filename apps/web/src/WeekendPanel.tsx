import type { CSSProperties } from 'react';
import type { TrackDefinition } from '@agp/sim-core';
import { trackPoint } from '@agp/sim-core';
import { ENTRANTS,TEAMS } from './championship';
import { ChampionshipMark } from './ChampionshipBrand';

export type WeekendStage='FP1'|'FP2'|'FP3'|'SQ1'|'SQ2'|'SQ3'|'SPRINT'|'Q1'|'Q2'|'Q3'|'GRAND_PRIX';

export const weekendSequence=(sprint:boolean):WeekendStage[]=>sprint
  ? ['FP1','SQ1','SQ2','SQ3','SPRINT','Q1','Q2','Q3','GRAND_PRIX']
  : ['FP1','FP2','FP3','Q1','Q2','Q3','GRAND_PRIX'];

const stageTitle=(stage:WeekendStage)=>({FP1:'FREE PRACTICE 1',FP2:'FREE PRACTICE 2',FP3:'FREE PRACTICE 3',SQ1:'SPRINT QUALIFYING · SQ1',SQ2:'SPRINT QUALIFYING · SQ2',SQ3:'SPRINT QUALIFYING · SQ3',SPRINT:'SPRINT',Q1:'QUALIFYING · Q1',Q2:'QUALIFYING · Q2',Q3:'QUALIFYING · Q3',GRAND_PRIX:'GRAND PRIX'}[stage]);
const stageDescription=(stage:WeekendStage)=>({
  FP1:'Open running for all 22 brains. Learn the circuit with no points at risk.',
  FP2:'Second practice run. Cars and persistent championship calibrations continue developing.',
  FP3:'Final preparation before knockout qualifying.',
  SQ1:'22 cars. Fastest 15 progress to SQ2.',
  SQ2:'15 cars. Fastest 10 progress to SQ3.',
  SQ3:'Top-10 shootout. This classification builds the Sprint grid.',
  SPRINT:'Short points-paying race. Top eight score 8–1 championship points.',
  Q1:'22 cars. Fastest 15 progress to Q2.',
  Q2:'15 cars. Fastest 10 progress to Q3.',
  Q3:'Top-10 shootout. Final classification builds the Grand Prix grid.',
  GRAND_PRIX:'The main event. Full points, pit strategy, race control and championship progression.'
}[stage]);

export function WeekendPanel({track,completed,qualifyingOrder,onRun,onBack}:{track:TrackDefinition;completed:WeekendStage[];qualifyingOrder:string[];onRun:(stage:WeekendStage)=>void;onBack:()=>void}){
  const sequence=weekendSequence(track.sprint);
  return <section className="panel-screen cwc-weekend"><header className="panel-head"><button className="mini-brand" onClick={onBack}><ChampionshipMark compact/></button><div><small>ROUND {String(track.round).padStart(2,'0')} · {track.country.toUpperCase()}</small><h2>{track.sprint?'SPRINT WEEKEND':'GRAND PRIX WEEKEND'}</h2></div><button className="close" onClick={onBack}>BACK</button></header><div className="cwc-weekend-body"><div className="cwc-weekend-copy"><small>CONNECTOME WORLD CHAMPIONSHIP · {track.dates}</small><h3>{track.grandPrix.toUpperCase()}</h3><WeekendTrack trackId={track.id}/><p>{track.sprint?'One practice, Sprint Qualifying, Sprint, then Grand Prix Qualifying and the main race.':'Three practice sessions lead into Q1, Q2, Q3 and the Grand Prix.'} Only the Sprint and Grand Prix change championship points; Quick Race remains completely separate.</p>{track.sprint&&<span className="cwc-sprint-badge">SPRINT FORMAT</span>}<div className="cwc-weekend-teams">{TEAMS.map(t=><i key={t.id} title={t.name} style={{background:t.colour}}/>)}</div></div><div className="cwc-session-stack cwc-session-stack-full">{sequence.map((stage,index)=>{const done=completed.includes(stage),unlocked=index===0||completed.includes(sequence[index-1]),state=done?'COMPLETE':unlocked?'READY':'LOCKED';return <Session key={stage} n={String(index+1).padStart(2,'0')} title={stageTitle(stage)} state={state} description={stageDescription(stage)} disabled={!unlocked&&!done} onClick={()=>onRun(stage)}/>})}</div>{qualifyingOrder.length>0&&<section className="cwc-grid-preview"><header><small>GRID CLASSIFICATION</small><strong>{completed.includes('Q3')?'GRAND PRIX STARTING GRID':completed.includes('SQ3')?'SPRINT STARTING GRID':'LATEST SESSION ORDER'}</strong></header><div>{qualifyingOrder.map((id,i)=>{const d=ENTRANTS.find(x=>x.id===id);if(!d)return null;return <span key={id} style={{'--driver':d.colour} as CSSProperties}><b>{i+1}</b><i/><strong>{d.short}</strong><small>#{d.number}</small></span>})}</div></section>}</div></section>
}

function WeekendTrack({trackId}:{trackId:string}){const pts=Array.from({length:110},(_,i)=>trackPoint(i/110,trackId)),minX=Math.min(...pts.map(p=>p.x)),maxX=Math.max(...pts.map(p=>p.x)),minZ=Math.min(...pts.map(p=>p.z)),maxZ=Math.max(...pts.map(p=>p.z)),span=Math.max(maxX-minX,maxZ-minZ)||1,path=pts.map((p,i)=>`${i?'L':'M'} ${8+(p.x-minX)/span*84} ${8+(p.z-minZ)/span*84}`).join(' ')+' Z';return <svg className="cwc-weekend-track" viewBox="0 0 100 100"><path d={path}/></svg>}
function Session({n,title,state,description,onClick,disabled=false}:{n:string;title:string;state:string;description:string;onClick:()=>void;disabled?:boolean}){return <button className={`cwc-session ${state.toLowerCase()}`} disabled={disabled} onClick={onClick}><small>{n} · {state}</small><strong>{title}</strong><span>{description}</span><b>{state==='COMPLETE'?'✓':'→'}</b></button>}

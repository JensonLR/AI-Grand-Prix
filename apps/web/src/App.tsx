import { useEffect,useRef,useState } from 'react';
import type { RaceState } from '@agp/shared';
import { GrandPrixScene, type CameraMode } from './GrandPrixScene';

const initial:RaceState={time:0,tick:0,flag:'GREEN',laps:3,seed:4127,cars:[]};
function formatTime(s:number|null){if(s===null)return '—';const m=Math.floor(s/60);return `${m}:${(s-m*60).toFixed(3).padStart(6,'0')}`;}
export function App(){
  const mount=useRef<HTMLDivElement>(null);const scene=useRef<GrandPrixScene|null>(null);const [entered,setEntered]=useState(false);const [state,setState]=useState<RaceState>(initial);const [paused,setPaused]=useState(false);const [camera,setCamera]=useState<CameraMode>('broadcast');const [sound,setSound]=useState(false);
  useEffect(()=>{if(!mount.current)return;const gp=new GrandPrixScene(mount.current,s=>setState({...s,cars:[...s.cars]}));scene.current=gp;gp.start();return()=>gp.dispose();},[]);
  const ordered=[...state.cars].sort((a,b)=>a.position-b.position);
  const setCam=(c:CameraMode)=>{setCamera(c);scene.current?.setCamera(c);};
  return <main className={entered?'race-mode':''}>
    <div className="viewport" ref={mount}/><div className="grain" aria-hidden="true"/>
    {!entered&&<section className="title-screen">
      <header className="mast"><span>INTELLIGENCE<br/>DRIVES FURTHER</span><span className="status"><i/> OFFLINE EXHIBITION</span></header>
      <div className="title-lockup"><p>THE WORLD CHAMPIONSHIP OF MACHINE INTELLIGENCE</p><h1><em>AI</em><span>GRAND PRIX</span></h1><div className="rule"/><h2>DIFFERENT MINDS. SAME MACHINE.</h2></div>
      <button className="enter" onClick={()=>setEntered(true)}><span>ENTER THE PADDOCK</span><b>01</b></button>
      <footer className="title-footer"><span>AZURE COAST</span><span>AGP-01 · SPECIFICATION SERIES</span><span>2026</span></footer>
    </section>}
    {entered&&<section className="broadcast">
      <header className="racebar"><button className="brand" onClick={()=>setEntered(false)}><b>AI</b><span>GRAND PRIX</span></button><div className="event"><small>AZURE COAST GRAND PRIX</small><strong>{state.flag==='CHEQUERED'?'CLASSIFIED':`LAP ${Math.min(state.laps,Math.max(1,ordered[0]?.lap+1||1))} / ${state.laps}`}</strong></div><div className={`flag ${state.flag.toLowerCase()}`}>{state.flag}</div></header>
      <aside className="tower"><div className="tower-head"><span>POS</span><span>DRIVER MODEL</span><span>INTERVAL</span></div>{ordered.map((car,i)=>{const leader=ordered[0];const gap=i===0?'LEADER':`+${Math.max(0,((leader?.lap||0)+(leader?.progress||0)-(car.lap+car.progress))*82).toFixed(3)}`;return <div className="driver" key={car.id}><b>{car.position}</b><i style={{background:car.colour}}/><span><strong>{car.name}</strong><small>#{car.number} · {car.status}</small></span><time>{gap}</time></div>})}<div className="tower-note">REFERENCE / DETERMINISTIC DRIVERS</div></aside>
      <div className="telemetry"><div><small>SPEED</small><strong>{Math.round((ordered[0]?.speed||0)*3.6)}</strong><span>KM/H</span></div><div><small>ENERGY</small><strong>{Math.round((ordered[0]?.battery||0)*100)}</strong><span>%</span></div><div><small>BEST LAP</small><strong>{formatTime(ordered[0]?.bestLap??null)}</strong></div></div>
      <nav className="camera-bar" aria-label="Camera controls"><button onClick={()=>{setPaused(!paused);scene.current?.setPaused(!paused)}}>{paused?'PLAY':'PAUSE'}</button>{(['broadcast','chase','aerial'] as CameraMode[]).map(c=><button className={camera===c?'active':''} onClick={()=>setCam(c)} key={c}>{c}</button>)}<button onClick={()=>setSound(!sound)}>{sound?'SOUND ON':'SOUND OFF'}</button></nav>
      {state.flag==='CHEQUERED'&&<div className="classified"><small>OFFLINE EXHIBITION</small><h2>RACE COMPLETE</h2><p>{ordered[0]?.name} wins at Azure Coast.</p><button onClick={()=>scene.current?.restart()}>RUN AGAIN</button></div>}
    </section>}
  </main>;
}

import type { CSSProperties } from 'react';

export function ChampionshipMark({compact=false,className=''}:{compact?:boolean;className?:string}){
  return <span className={`agp-championship-mark ${compact?'compact':''} ${className}`.trim()} aria-label="AI Grand Prix">
    <svg viewBox="0 0 132 72" role="img" aria-hidden>
      <defs>
        <linearGradient id="agpGold" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f3dc9a"/><stop offset=".46" stopColor="#d7a647"/><stop offset="1" stopColor="#8b6119"/></linearGradient>
        <linearGradient id="agpBlue" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#5da1ff"/><stop offset="1" stopColor="#073bbe"/></linearGradient>
      </defs>
      <path className="agp-mark-frame" d="M8 58 30 14h30l13 20 15-20h36l-19 19 19 25H88L73 39 62 58H35l14-29H38L23 58Z"/>
      <path className="agp-mark-speed" d="M13 64h74l9-8h28"/>
      <path className="agp-mark-core" d="m67 19 5.5 10.5L83 35l-10.5 5.5L67 51l-5.5-10.5L51 35l10.5-5.5Z"/>
      <circle className="agp-mark-node" cx="67" cy="35" r="4.2"/>
      <circle className="agp-mark-satellite" cx="101" cy="22" r="2.4"/>
      <circle className="agp-mark-satellite" cx="112" cy="49" r="2.4"/>
    </svg>
    {!compact&&<span className="agp-brand-type"><strong>AI GRAND PRIX</strong><small>CONNECTOME WORLD CHAMPIONSHIP</small></span>}
  </span>
}

export function BuildPlate({text='2027 · PREMIUM SEASON BUILD'}:{text?:string}){
  return <span className="agp-build-plate" style={{'--plate':'#d7a647'} as CSSProperties}>{text}</span>
}

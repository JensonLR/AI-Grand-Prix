import type { CSSProperties } from 'react';

export function ChampionshipMark({compact=false,className=''}:{compact?:boolean;className?:string}){
  return <span className={`agp-championship-mark ${compact?'compact':''} ${className}`.trim()} aria-label="AI Grand Prix">
    <svg viewBox="0 0 132 72" role="img" aria-hidden>
      <defs>
        <linearGradient id="agpGold" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f3dc9a"/><stop offset=".46" stopColor="#d7a647"/><stop offset="1" stopColor="#8b6119"/></linearGradient>
        <linearGradient id="agpBlue" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#5da1ff"/><stop offset="1" stopColor="#073bbe"/></linearGradient>
      </defs>
      <path className="agp-mark-frame" d="M7 57 27 15h28l12 17 13-17h44l-18 17 18 25H91L73 39 62 57H36l13-28H38L24 57Z"/>
      <path className="agp-mark-speed" d="M9 64h78l9-7h29M18 9h42l7 9 7-9h38"/>
      <path className="agp-mark-core" d="m67 18 5.8 11.2L84 35l-11.2 5.8L67 52l-5.8-11.2L50 35l11.2-5.8Z"/>
      <circle className="agp-mark-node" cx="67" cy="35" r="4.2"/>
      <path className="agp-mark-speed" d="M53 27 42 20M81 27l11-7M53 43l-11 7M81 43l11 7"/>
      <circle className="agp-mark-satellite" cx="42" cy="20" r="2.2"/><circle className="agp-mark-satellite" cx="92" cy="20" r="2.2"/>
      <circle className="agp-mark-satellite" cx="42" cy="50" r="2.2"/><circle className="agp-mark-satellite" cx="92" cy="50" r="2.2"/>
    </svg>
    {!compact&&<span className="agp-brand-type"><strong>AI GRAND PRIX</strong><small>CONNECTOME WORLD CHAMPIONSHIP</small></span>}
  </span>
}

export function BuildPlate({text='2027 · PREMIUM SEASON BUILD'}:{text?:string}){
  return <span className="agp-build-plate" style={{'--plate':'#d7a647'} as CSSProperties}>{text}</span>
}

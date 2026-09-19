import type { CSSProperties } from 'react';

export function ChampionshipMark({compact=false,className=''}:{compact?:boolean;className?:string}){
  return <span className={`agp-championship-mark agp-brand-v9 ${compact?'compact':''} ${className}`.trim()} aria-label="AI Grand Prix · Connectome World Championship">
    <svg viewBox="0 0 184 88" role="img" aria-hidden>
      <defs>
        <linearGradient id="agpV9Gold" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff0bd"/><stop offset=".42" stopColor="#d7a647"/><stop offset="1" stopColor="#8a5c12"/></linearGradient>
        <linearGradient id="agpV9Blue" x1="0" y1=".1" x2="1" y2=".9"><stop stopColor="#66a8ff"/><stop offset=".48" stopColor="#0a55e8"/><stop offset="1" stopColor="#06266f"/></linearGradient>
      </defs>
      <g className="agp-v9-glyph">
        <path className="agp-v9-wing" d="M5 54 31 22h42l-9 11H38L28 45h32l-8 9H5Zm174 0-26-32h-42l9 11h26l10 12h-32l8 9h47Z"/>
        <path className="agp-v9-fly" d="M92 9c-7 0-12 7-12 15 0 5 2 9 5 12-9-9-22-13-34-10 6 13 18 22 32 23-8 5-13 14-13 25 11-3 18-9 22-17 4 8 11 14 22 17 0-11-5-20-13-25 14-1 26-10 32-23-12-3-25 1-34 10 3-3 5-7 5-12 0-8-5-15-12-15Z"/>
        <ellipse className="agp-v9-eye" cx="86" cy="24" rx="5.5" ry="8"/><ellipse className="agp-v9-eye" cx="98" cy="24" rx="5.5" ry="8"/>
        <path className="agp-v9-neural" d="M92 39v18M92 46 78 56M92 46l14 10M92 54 82 68M92 54l10 14"/>
        <circle className="agp-v9-node" cx="92" cy="46" r="3.5"/><circle className="agp-v9-node" cx="78" cy="56" r="2"/><circle className="agp-v9-node" cx="106" cy="56" r="2"/><circle className="agp-v9-node" cx="82" cy="68" r="2"/><circle className="agp-v9-node" cx="102" cy="68" r="2"/>
        <path className="agp-v9-speed" d="M13 64h45l10-7M171 64h-45l-10-7"/>
      </g>
    </svg>
    {!compact&&<span className="agp-brand-type"><strong><em>AI</em> GRAND PRIX</strong><small>CONNECTOME WORLD CHAMPIONSHIP</small><i>22 BRAINS · 11 MACHINES · ONE GRID</i></span>}
  </span>
}

export function BuildPlate({text='2027 · CONNECTOME WORLD CHAMPIONSHIP'}:{text?:string}){
  return <span className="agp-build-plate" style={{'--plate':'#d7a647'} as CSSProperties}>{text}</span>
}

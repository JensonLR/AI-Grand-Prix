import type { CSSProperties } from 'react';
import type { CarState } from '@agp/shared';
import { ENTRANTS,teamFor } from './championship';
import { TeamMark } from './TeamMark';

function Trophy(){return <svg className="agp-trophy" viewBox="0 0 120 150" aria-label="AI Grand Prix winner trophy"><defs><linearGradient id="cup" x1="0" x2="1"><stop stopColor="#8b6320"/><stop offset=".48" stopColor="#f6dea2"/><stop offset=".72" stopColor="#d7a647"/><stop offset="1" stopColor="#765015"/></linearGradient></defs><path fill="url(#cup)" d="M35 9h50v17c0 31-12 46-21 52v25h20v11H36v-11h20V78C47 72 35 57 35 26Zm8 10v7c0 25 8 36 17 43 9-7 17-18 17-43v-7Z"/><path fill="none" stroke="url(#cup)" strokeWidth="8" strokeLinecap="round" d="M36 25H19v13c0 17 9 26 22 26M84 25h17v13c0 17-9 26-22 26"/><path fill="url(#cup)" d="M27 121h66l10 20H17Z"/><path fill="#071018" d="m60 31 7 14 15 2-11 11 3 15-14-7-14 7 3-15-11-11 15-2Z"/></svg>}

export function PodiumCeremony({cars}:{cars:CarState[]}){
  const top=cars.slice(0,3);if(top.length<3)return null;
  const slots=[top[1],top[0],top[2]];
  return <section className="podium-ceremony"><div className="podium-light"/><div className="podium-trophy"><Trophy/><small>CONNECTOME WORLD CHAMPIONSHIP</small><strong>GRAND PRIX WINNER</strong></div><div className="podium-grid">{slots.map((car,slot)=>{const driver=ENTRANTS.find(d=>d.id===car.id),team=driver?teamFor(driver):undefined,place=slot===1?1:slot===0?2:3;return <article className={`podium-place p${place}`} style={{'--podium':car.colour,'--podium-accent':driver?.accent??car.colour} as CSSProperties} key={car.id}><header>{team&&<TeamMark teamId={team.id}/>}<span>P{place}</span></header><div className="podium-number">{car.number}</div><strong>{car.name}</strong><small>{team?.name??'AGP DEVELOPMENT'}</small><div className="podium-block"><b>{place}</b></div></article>})}</div><div className="podium-confetti" aria-hidden>{Array.from({length:24},(_,i)=><i key={i} style={{'--x':`${(i*37)%100}%`,'--delay':`${(i%7)*-.22}s`,'--spin':`${(i%5)*47}deg`} as CSSProperties}/>)}</div></section>
}

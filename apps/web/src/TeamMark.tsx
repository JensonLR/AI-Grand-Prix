type Props={teamId:string;className?:string;title?:string};

/**
 * Bespoke constructor marks for the fly championship. Each symbol has its own silhouette,
 * survives at 18px, and avoids borrowing a real-world motorsport logo.
 */
export function TeamMark({teamId,className='',title}:Props){
  const mark=(()=>{switch(teamId){
    case 'mlarvae': return <>
      <path d="M8 52 24 14h14l-5 12h11l8-12h12L49 52H36l6-15H28l-6 15Z"/>
      <path d="M25 31h25" className="mark-detail"/>
    </>;
    case 'mercedeyes': return <>
      <path d="M5 36C14 21 25 14 36 14s22 7 31 22C58 51 47 58 36 58S14 51 5 36Zm13 0c6 8 11 11 18 11s12-3 18-11c-6-8-11-11-18-11s-12 3-18 11Z"/>
      <circle cx="36" cy="36" r="7" className="mark-cut"/>
      <path d="M36 20v32M20 36h32" className="mark-detail"/>
    </>;
    case 'redbug': return <>
      <path d="M9 18h17l10 11 10-11h17L50 35l12 19H46L36 43 26 54H10l12-19Z"/>
      <path d="M19 13 30 24M53 13 42 24" className="mark-detail"/>
      <circle cx="36" cy="36" r="5" className="mark-cut"/>
    </>;
    case 'flyrrari': return <>
      <path d="M36 5 61 17v23C61 54 51 63 36 68 21 63 11 54 11 40V17Zm0 11-14 7v16c0 8 5 14 14 18 9-4 14-10 14-18V23Z"/>
      <path d="M28 27h16l-8 7 8 7H28l8-7Z" className="mark-cut"/>
      <path d="M36 17v39" className="mark-detail"/>
    </>;
    case 'wingliams': return <>
      <path d="M5 19h14l9 25 8-17 8 17 9-25h14L52 57H42l-6-13-6 13H20Z"/>
      <path d="M12 14h18l6 9 6-9h18" className="mark-detail"/>
    </>;
    case 'racingbugs': return <>
      <path d="M36 7 62 55H48l-5-10H29l-5 10H10Zm0 20-5 10h10Z"/>
      <path d="M7 31h19M46 31h19M15 21l12 7M57 21l-12 7" className="mark-detail"/>
    </>;
    case 'astonmidge': return <>
      <path d="M4 34 24 16h24l20 18-18-4-14 30-14-30Zm26-8 6 14 6-14Z"/>
      <path d="M7 41 23 45M65 41 49 45" className="mark-detail"/>
    </>;
    case 'haasfly': return <>
      <path d="M10 10h13v19h26V10h13v52H49V42H23v20H10Z"/>
      <path d="M27 23 36 31l9-8v11l-9 8-9-8Z" className="mark-cut"/>
    </>;
    case 'audeye': return <>
      <path d="M7 56 26 12h20l19 44H51l-5-11H26l-5 11Zm25-23h8l-4-10Z"/>
      <path d="M14 19h13M45 19h13M36 5v15" className="mark-detail"/>
    </>;
    case 'flypine': return <>
      <path d="M5 56 22 15l14 18 14-23 17 46H52l-5-17-11 16-11-16-5 17Z"/>
      <path d="m27 26 9 10 9-13" className="mark-cut"/>
      <path d="M14 59h44" className="mark-detail"/>
    </>;
    case 'caddislac': return <>
      <path d="M8 15h56L52 29h8L44 58H28L12 29h8Zm17 14 11 17 11-17-11 7Z"/>
      <path d="M18 21h36M36 7v13" className="mark-detail"/>
      <circle cx="36" cy="14" r="4" className="mark-cut"/>
    </>;
    default: return <>
      <path d="M8 36 22 12h28l14 24-14 24H22Zm17 0 11 11 11-11-11-11Z"/>
    </>;
  }})()
  return <svg className={`team-mark team-mark-${teamId} ${className}`} viewBox="0 0 72 72" role={title?'img':'presentation'} aria-label={title}>
    <g className="mark-fill" fill="currentColor">{mark}</g>
    <g className="mark-bio-signature" fill="currentColor" opacity=".92">
      <circle cx="31.5" cy="64.5" r="1.45"/><circle cx="36" cy="65.4" r="1.45"/><circle cx="40.5" cy="64.5" r="1.45"/>
      <path d="M31 62 27.5 58.5M41 62l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
    </g>
  </svg>
}

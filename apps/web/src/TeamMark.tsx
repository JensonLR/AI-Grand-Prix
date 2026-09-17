type Props={teamId:string;className?:string;title?:string};

/** Original, text-free constructor marks. Deliberately abstract: aero, wing, eye, neural and flight motifs. */
export function TeamMark({teamId,className='',title}:Props){
  const content=(()=>{switch(teamId){
    case 'mlarvae':return <><path d="M8 44 28 10h10L25 31h16L56 14 45 48H34l7-12H22L15 48Z"/><path d="m29 18 5-8 3 8Z" className="mark-cut"/></>;
    case 'mercedeyes':return <><path d="M7 32c11-16 39-16 50 0-11 16-39 16-50 0Zm12 0c6 8 20 8 26 0-6-8-20-8-26 0Z"/><path d="M29 22h6v20h-6z" className="mark-cut"/></>;
    case 'redbug':return <><path d="M6 16h22l8 10 8-10h14L43 34l12 14H40l-8-10-8 10H7l14-16Z"/><path d="M27 27h10l-5 7Z" className="mark-cut"/></>;
    case 'flyrrari':return <><path d="M32 5 52 18v21L32 59 12 39V18Zm0 11-11 7v12l11 10 11-10V23Z"/><path d="M29 14h6v32h-6z" className="mark-cut"/></>;
    case 'wingliams':return <><path d="M5 18h14l9 20 6-13 6 13 8-20h11L45 51H34l-6-12-6 12h-8Z"/><path d="m27 18 5-8 5 8Z" className="mark-cut"/></>;
    case 'racingbugs':return <><path d="M10 48 27 8h10l17 40H42l-4-10H26l-4 10Zm19-20h7l-4-10Z"/><path d="M7 28h14v7H7zm36 0h14v7H43z" className="mark-cut"/></>;
    case 'astonmidge':return <><path d="M5 34 24 13h16l19 21-15-4-12 22-12-22Zm20-10 7 12 7-12Z"/><path d="M5 39 21 43l-4 7Z" className="mark-cut"/><path d="m59 39-16 4 4 7Z" className="mark-cut"/></>;
    case 'haasfly':return <><path d="M9 9h12v18h22V9h12v46H43V38H21v17H9Z"/><path d="m23 20 9 7 9-7v7l-9 7-9-7Z" className="mark-cut"/></>;
    case 'audeye':return <><path d="M6 44 22 11h20l16 33H46l-4-9H22l-4 9Zm21-20-3 7h16l-3-7Z"/><path d="M29 7h6v12h-6z" className="mark-cut"/></>;
    case 'flypine':return <><path d="m5 47 15-31 12 15 12-20 15 36H45l-4-12-9 12-9-12-4 12Z"/><path d="m25 20 7 9 7-11-7 3Z" className="mark-cut"/></>;
    case 'caddislac':return <><path d="M8 14h48L45 26h9L39 51H25L10 26h9Zm15 12 9 14 9-14-9 5Z"/><circle cx="32" cy="16" r="5" className="mark-cut"/></>;
    default:return <><path d="M8 32 20 12h24l12 20-12 20H20Zm15 0 9 9 9-9-9-9Z"/></>;
  }})()
  return <svg className={`team-mark ${className}`} viewBox="0 0 64 64" role={title?'img':'presentation'} aria-label={title}><g fill="currentColor">{content}</g></svg>
}

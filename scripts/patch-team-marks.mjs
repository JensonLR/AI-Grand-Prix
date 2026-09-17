/* global console */
import {readFile,writeFile} from 'node:fs/promises';
const path='apps/web/src/ChampionshipApp.tsx';let s=await readFile(path,'utf8');const before=s;
if(!s.includes("from './TeamMark'"))s=s.replace("import { SeasonCalendar } from './SeasonCalendar';","import { SeasonCalendar } from './SeasonCalendar';\nimport { TeamMark } from './TeamMark';");
s=s.replace("<i/><span>{t.short}<small>","<TeamMark teamId={t.id}/><span>{t.short}<small>");
s=s.replace("<div className=\"livery\" style={{'--livery':t.colour,'--secondary':t.secondary,'--accent':t.accent} as CSSProperties}><b>{t.short}</b></div>","<div className=\"livery\" style={{'--livery':t.colour,'--secondary':t.secondary,'--accent':t.accent,'--team':t.colour} as CSSProperties}><TeamMark teamId={t.id} title={t.name}/><b>{t.short}</b></div>");
s=s.replace("<div className=\"cwc-team-row\" key={t.id}><b>{i+1}</b><i style={{background:t.colour}}/><span>","<div className=\"cwc-team-row\" key={t.id} style={{color:t.colour} as CSSProperties}><b>{i+1}</b><i style={{background:t.colour}}/><TeamMark teamId={t.id}/><span>");
if(s!==before){await writeFile(path,s);console.log('wired constructor marks')}else console.log('constructor marks already wired');
const main='apps/web/src/main.tsx';let m=await readFile(main,'utf8');if(!m.includes("./constructor-marks.css")){m=m.replace("import './premium.css';","import './premium.css';\nimport './constructor-marks.css';");await writeFile(main,m);console.log('imported constructor mark styles')}

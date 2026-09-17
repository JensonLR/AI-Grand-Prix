import { readFileSync,writeFileSync } from 'node:fs';

const path='apps/web/src/ChampionshipApp.tsx';
let source=readFileSync(path,'utf8');

if(!source.includes("import { PhenotypeInspector } from './PhenotypeInspector';")){
  source=source.replace(
    "import { WeekendPanel,type WeekendStage } from './WeekendPanel';",
    "import { WeekendPanel,type WeekendStage } from './WeekendPanel';\nimport { PhenotypeInspector } from './PhenotypeInspector';"
  );
}

source=source.replace(
  "useEffect(()=>{if(state.flag!=='CHEQUERED'||raceKind!=='live'||!weekendStage)return;setWeekendCompleted(old=>old.includes(weekendStage)?old:[...old,weekendStage]);if(weekendStage==='QUALIFYING'){setQualifyingOrder([...state.cars].sort((a,b)=>(a.bestLap??Infinity)-(b.bestLap??Infinity)||a.position-b.position).map(c=>c.id));}},[state.flag,state.cars,raceKind,weekendStage]);",
  "useEffect(()=>{if(state.flag!=='CHEQUERED'||raceKind!=='live'||!weekendStage||weekendCompleted.includes(weekendStage))return;setWeekendCompleted(old=>[...old,weekendStage]);if(weekendStage==='QUALIFYING'){setQualifyingOrder([...state.cars].sort((a,b)=>(a.bestLap??Infinity)-(b.bestLap??Infinity)||a.position-b.position).map(c=>c.id));}},[state.flag,state.cars,raceKind,weekendStage,weekendCompleted]);"
);

if(!source.includes('<PhenotypeInspector driver={d}/>')){
  source=source.replace(
    '</div><div className="cwc-integrity"><div><strong>REAL CONNECTOME TARGET</strong>',
    '</div><PhenotypeInspector driver={d}/><div className="cwc-integrity"><div><strong>REAL CONNECTOME TARGET</strong>'
  );
}

source=source.replace(
  '<div className="race-progress"><i style={{width:`${progress}%`}}/></header>',
  '<div className="race-progress"><i style={{width:`${progress}%`}}/></div></header>'
);

writeFileSync(path,source);

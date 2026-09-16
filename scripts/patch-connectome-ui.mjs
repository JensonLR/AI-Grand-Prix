import { readFileSync,writeFileSync } from 'node:fs';

const path='apps/web/src/ChampionshipApp.tsx';
let source=readFileSync(path,'utf8');
const once=(needle,replacement)=>{if(source.includes(needle))source=source.replace(needle,replacement);};

once(
  "import { ENTRANTS,TEAMS,teamFor } from './championship';",
  "import { ENTRANTS,TEAMS,teamFor } from './championship';\nimport { WeekendPanel,type WeekendStage } from './WeekendPanel';"
);
once(
  "type Screen='title'|'home'|'setup'|'race'|'replays'|'garage'|'championship'|'drivers'|'connectome';",
  "type Screen='title'|'home'|'setup'|'race'|'replays'|'garage'|'championship'|'drivers'|'connectome'|'weekend';"
);
once(
  "[error,setError]=useState(''),[renderError,setRenderError]=useState(false),[countdown,setCountdown]=useState<number|'GO'|null>(null),[table,setTable]=useState<Record<string,Standing>>(loadTable);",
  "[error,setError]=useState(''),[renderError,setRenderError]=useState(false),[countdown,setCountdown]=useState<number|'GO'|null>(null),[table,setTable]=useState<Record<string,Standing>>(loadTable),[weekendStage,setWeekendStage]=useState<WeekendStage|null>(null),[weekendCompleted,setWeekendCompleted]=useState<WeekendStage[]>([]),[qualifyingOrder,setQualifyingOrder]=useState<string[]>([]);"
);
once(
  "  const ordered=useMemo(()=>[...state.cars].sort((a,b)=>a.position-b.position),[state.cars]),focused=state.cars.find(c=>c.id===focus)??ordered[0];",
  "  useEffect(()=>{if(state.flag!=='CHEQUERED'||raceKind!=='live'||!weekendStage)return;setWeekendCompleted(old=>old.includes(weekendStage)?old:[...old,weekendStage]);if(weekendStage==='QUALIFYING'){setQualifyingOrder([...state.cars].sort((a,b)=>(a.bestLap??Infinity)-(b.bestLap??Infinity)||a.position-b.position).map(c=>c.id));}},[state.flag,state.cars,raceKind,weekendStage]);\n  const ordered=useMemo(()=>[...state.cars].sort((a,b)=>a.position-b.position),[state.cars]),focused=state.cars.find(c=>c.id===focus)??ordered[0];"
);
once(
  "  const launch=()=>{saved.current='';const human=config.session==='HUMAN_TEST';setRaceKind(human?'human':'live');const id=human?'human':ENTRANTS[0].id;setFocus(id);scene.current?.startRace(config);const cam:CameraMode=human?'cockpit':'broadcast';scene.current?.setCamera(cam);setCameraState(cam);setScreen('race');armStart()};",
  "  const launch=()=>{saved.current='';const human=config.session==='HUMAN_TEST';setRaceKind(human?'human':'live');const id=human?'human':ENTRANTS[0].id;setFocus(id);scene.current?.startRace(config);const cam:CameraMode=human?'cockpit':'broadcast';scene.current?.setCamera(cam);setCameraState(cam);setScreen('race');armStart()};\n  const openWeekend=()=>{setWeekendStage(null);setWeekendCompleted([]);setQualifyingOrder([]);setPaused(true);scene.current?.setPaused(true);setScreen('weekend')};\n  const runWeekend=(stage:WeekendStage)=>{saved.current='';const next:RaceConfig={...config,session:stage,laps:stage==='GRAND_PRIX'?Math.max(6,config.laps):3,entrants:22,gridOrder:stage==='GRAND_PRIX'&&qualifyingOrder.length===22?qualifyingOrder:undefined};setConfig(next);setWeekendStage(stage);setRaceKind('live');const id=next.gridOrder?.[0]??ENTRANTS[0].id;setFocus(id);scene.current?.startRace(next);scene.current?.setFocus(id);scene.current?.setCamera('broadcast');setCameraState('broadcast');setScreen('race');armStart()};\n  const advanceWeekend=()=>{if(weekendStage==='PRACTICE')runWeekend('QUALIFYING');else if(weekendStage==='QUALIFYING')runWeekend('GRAND_PRIX');else{setWeekendStage(null);navigate('championship')}};"
);
once(
  "{screen==='title'&&<Title onEnter={()=>setScreen('home')}/>} {screen==='home'&&<Home onMode={prepare} onReplay={watchReplay} onNavigate={navigate} error={error}/>} {screen==='setup'&&",
  "{screen==='title'&&<Title onEnter={()=>setScreen('home')}/>} {screen==='home'&&<Home onMode={prepare} onWeekend={openWeekend} onReplay={watchReplay} onNavigate={navigate} error={error}/>} {screen==='weekend'&&<WeekendPanel completed={weekendCompleted} qualifyingOrder={qualifyingOrder} onRun={runWeekend} onBack={()=>navigate('home')}/>} {screen==='setup'&&"
);
once(
  "{screen==='race'&&<RaceBroadcast state={state}",
  "{screen==='race'&&<RaceBroadcast state={state}"
);
once(
  "onRestart={()=>{scene.current?.restart();armStart()}}/>}\n  </main>",
  "onRestart={()=>{scene.current?.restart();armStart()}}/>}{screen==='race'&&state.flag==='CHEQUERED'&&weekendStage&&<button className=\"cwc-next-session\" onClick={advanceWeekend}>{weekendStage==='PRACTICE'?'CONTINUE TO QUALIFYING':weekendStage==='QUALIFYING'?'BUILD GRID · START GRAND PRIX':'VIEW CHAMPIONSHIP'} <b>→</b></button>}\n  </main>"
);
once(
  "function Home({onMode,onReplay,onNavigate,error}:{onMode:(s:SessionType)=>void;onReplay:()=>void;onNavigate:(s:Screen)=>void;error:string})",
  "function Home({onMode,onWeekend,onReplay,onNavigate,error}:{onMode:(s:SessionType)=>void;onWeekend:()=>void;onReplay:()=>void;onNavigate:(s:Screen)=>void;error:string})"
);
once(
  "<button className=\"mode\" onClick={()=>onMode('GRAND_PRIX')}><small>02 · CHAMPIONSHIP</small><strong>GRAND PRIX</strong><span>Score Drivers + Constructors points.</span><b>→</b></button>",
  "<button className=\"mode\" onClick={onWeekend}><small>02 · WEEKEND</small><strong>RACE WEEKEND</strong><span>Practice → Qualifying → Grand Prix.</span><b>→</b></button>"
);
source=source.replace(
  '<div className="race-progress"><i style={{width:`${progress}%`}}/></header>',
  '<div className="race-progress"><i style={{width:`${progress}%`}}/></div></header>'
);
writeFileSync(path,source);

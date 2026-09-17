import fs from 'node:fs';

function patchApp(){
  const file='apps/web/src/ChampionshipApp.tsx';
  let src=fs.readFileSync(file,'utf8'),before=src;
  if(!src.includes("from './BancFullRuntime'"))src=src.replace("import { readFullBancDevelopment } from './FullBancDriver';","import { readFullBancDevelopment } from './FullBancDriver';\nimport { bancRuntime,preloadBancRuntime,ensureBancRuntimeReady,type BancRuntimeInfo } from './BancFullRuntime';");
  if(!src.includes('[bancInfo,setBancInfo]')){
    const marker='[seasonRound,setSeasonRound]=useState(loadRound);';
    if(!src.includes(marker))throw new Error('BANC readiness patch: app state marker missing');
    src=src.replace(marker,`${marker}\n  const [bancInfo,setBancInfo]=useState<BancRuntimeInfo>(bancRuntime.getInfo());`);
  }
  if(!src.includes('preloadBancRuntime();return unsubscribe')){
    const marker='  useEffect(()=>{if(!mount.current)return;';
    if(!src.includes(marker))throw new Error('BANC readiness patch: mount effect marker missing');
    src=src.replace(marker,"  useEffect(()=>{const unsubscribe=bancRuntime.subscribe(setBancInfo);preloadBancRuntime();return unsubscribe},[]);\n"+marker);
  }
  src=src.replace("gp.startRace({...initialConfig,entrants:22,trackId:round.id,championshipRound:round.round});","gp.startRace({...initialConfig,session:'HUMAN_TEST',entrants:1,trackId:round.id,championshipRound:undefined});");
  if(!src.includes('const ensureBanc=async()=>')){
    const marker='  const navigate=(next:Screen)=>';
    if(!src.includes(marker))throw new Error('BANC readiness patch: navigate marker missing');
    src=src.replace(marker,"  const ensureBanc=async()=>{setError('');try{const info=await ensureBancRuntimeReady();if(info.neurons!==188508||info.edges!==11510975||info.materialization!==888)throw new Error('Full BANC v888 identity check failed');return true}catch(e){setError(e instanceof Error?e.message:'Full BANC v888 runtime is unavailable');return false}};\n"+marker);
  }
  src=src.replace('  const launch=()=>{saved.current=',"  const launch=async()=>{if(!(await ensureBanc()))return;saved.current=");
  src=src.replace('  const runWeekend=(stage:WeekendStage)=>{saved.current=',"  const runWeekend=async(stage:WeekendStage)=>{if(!(await ensureBanc()))return;saved.current=");
  const oldSetup="{screen==='setup'&&<Setup config={config} setConfig={setConfig} onLaunch={launch} onBack={()=>setScreen('home')}/>}";
  const newSetup="{screen==='setup'&&<Setup config={config} setConfig={setConfig} onLaunch={launch} onBack={()=>setScreen('home')} bancInfo={bancInfo} error={error}/>}";
  if(src.includes(oldSetup))src=src.replace(oldSetup,newSetup);
  if(!src.includes('bancInfo:BancRuntimeInfo;error:string')){
    const oldSig="function Setup({config,setConfig,onLaunch,onBack}:{config:RaceConfig;setConfig:React.Dispatch<React.SetStateAction<RaceConfig>>;onLaunch:()=>void;onBack:()=>void})";
    const newSig="function Setup({config,setConfig,onLaunch,onBack,bancInfo,error}:{config:RaceConfig;setConfig:React.Dispatch<React.SetStateAction<RaceConfig>>;onLaunch:()=>void;onBack:()=>void;bancInfo:BancRuntimeInfo;error:string})";
    if(!src.includes(oldSig))throw new Error('BANC readiness patch: setup signature missing');
    src=src.replace(oldSig,newSig);
  }
  const oldLaunch='<button className="launch" onClick={onLaunch}>LAUNCH SESSION <b>→</b></button>';
  if(src.includes(oldLaunch)){
    const newLaunch='<div className={`banc-runtime-gate ${bancInfo.status}`}><i/><span><strong>FULL BANC V888</strong><small>{bancInfo.status===\'ready\'?`${bancInfo.neurons.toLocaleString()} MAPPED ROWS · ${bancInfo.edges.toLocaleString()} DIRECTED PAIRS`:bancInfo.status===\'error\'?`RUNTIME BLOCKED · ${bancInfo.error??\'GRAPH LOAD FAILED\'}`:\'LOADING AND VERIFYING COMPLETE CONNECTOME…\'}</small></span></div>{error&&<div className="inline-error">{error}</div>}<button className="launch" disabled={bancInfo.status!==\'ready\'} onClick={onLaunch}>{bancInfo.status===\'ready\'?\'LAUNCH SESSION\':bancInfo.status===\'error\'?\'BANC RUNTIME UNAVAILABLE\':\'LOADING FULL BANC V888\'} <b>→</b></button>';
    src=src.replace(oldLaunch,newLaunch);
  }
  if(src!==before){fs.writeFileSync(file,src);console.log('Applied app-level full-BANC readiness gate.')}else console.log('App-level BANC readiness already current.');
}

function patchScene(){
  const file='apps/web/src/FlyGrandPrixScene.ts';
  let src=fs.readFileSync(file,'utf8'),before=src;
  if(!src.includes("from './BancFullRuntime'"))src=src.replace("import { FullBancDriver } from './FullBancDriver';","import { FullBancDriver } from './FullBancDriver';\nimport { bancRuntime } from './BancFullRuntime';");
  if(!src.includes('Full BANC v888 graph is not ready; refusing to start a neural race')){
    const marker='  override startRace(config:RaceConfig){\n    const s=internal(this),trackId=config.trackId??DEFAULT_2027_TRACK_ID;';
    if(!src.includes(marker))throw new Error('BANC readiness patch: FlyGrandPrixScene start marker missing');
    src=src.replace(marker,"  override startRace(config:RaceConfig){\n    const needsBanc=config.session!=='HUMAN_TEST'||config.entrants>1;\n    if(needsBanc&&bancRuntime.getInfo().status!=='ready')throw new Error('Full BANC v888 graph is not ready; refusing to start a neural race');\n    const s=internal(this),trackId=config.trackId??DEFAULT_2027_TRACK_ID;");
  }
  if(src!==before){fs.writeFileSync(file,src);console.log('Applied scene-level full-BANC readiness gate.')}else console.log('Scene-level BANC readiness already current.');
}

patchApp();
patchScene();

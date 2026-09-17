import fs from 'node:fs';

const file='apps/web/src/ChampionshipApp.tsx';
let src=fs.readFileSync(file,'utf8');
const before=src;

const unsafe="gp.start();gp.setPaused(true);void ensureBancRuntimeReady().then(()=>{if(scene.current!==gp)return;gp.startRace({...initialConfig,entrants:22,trackId:round.id,championshipRound:round.round});gp.setFocus(ENTRANTS[0].id);gp.setCamera('broadcast');gp.setPaused(true);}).catch(e=>setError(e instanceof Error?e.message:'Full BANC v888 runtime is unavailable'));";
const safe="void (async()=>{try{const response=await fetch(new URL('replays/demo.agpr.json',document.baseURI));if(!response.ok)throw new Error(`Opening replay unavailable (${response.status})`);const replay=await response.json() as ReplayFile;if(scene.current!==gp)return;await gp.loadReplay(replay);gp.setFocus(replay.frames[0]?.cars[0]?.id??ENTRANTS[0].id);gp.setCamera('broadcast');gp.setPaused(false);gp.start();document.documentElement.dataset.agpScene='ready';}catch(e){document.documentElement.dataset.agpScene='error';if(scene.current===gp){setRenderError(true);setError(e instanceof Error?e.message:'Opening race preview failed to load');}}void ensureBancRuntimeReady().then(info=>{document.documentElement.dataset.agpBanc=`v${info.materialization}:${info.neurons}:${info.edges}`;}).catch(e=>{document.documentElement.dataset.agpBanc='error';setError(e instanceof Error?e.message:'Full BANC v888 runtime is unavailable');});})();";

if(src.includes(unsafe))src=src.replace(unsafe,safe);
if(src.includes("await gp.loadReplay(replay);gp.setFocus(replay.frames[0]?.cars[0]?.id??ENTRANTS[0].id);gp.setCamera('broadcast');gp.setPaused(false);gp.start();}")&&!src.includes("document.documentElement.dataset.agpScene='ready'")){
  src=src.replace("await gp.loadReplay(replay);gp.setFocus(replay.frames[0]?.cars[0]?.id??ENTRANTS[0].id);gp.setCamera('broadcast');gp.setPaused(false);gp.start();}","await gp.loadReplay(replay);gp.setFocus(replay.frames[0]?.cars[0]?.id??ENTRANTS[0].id);gp.setCamera('broadcast');gp.setPaused(false);gp.start();document.documentElement.dataset.agpScene='ready';}");
}
if(src.includes(safe)||src.includes("document.documentElement.dataset.agpScene='ready'"))src=src.replace("const round=TRACKS_2027[Math.max(0,loadRound()-1)]??TRACKS_2027[0];",'');
if(!src.includes("await gp.loadReplay(replay);gp.setFocus(replay.frames[0]?.cars[0]?.id??ENTRANTS[0].id);gp.setCamera('broadcast');gp.setPaused(false);gp.start();document.documentElement.dataset.agpScene='ready';")){
  throw new Error('Safe browser boot patch could not prove the 22-car replay initializes before the render loop starts');
}
if(!src.includes("document.documentElement.dataset.agpBanc=`v${info.materialization}:${info.neurons}:${info.edges}`")){
  const old="void ensureBancRuntimeReady().catch(e=>setError(e instanceof Error?e.message:'Full BANC v888 runtime is unavailable'));";
  const next="void ensureBancRuntimeReady().then(info=>{document.documentElement.dataset.agpBanc=`v${info.materialization}:${info.neurons}:${info.edges}`;}).catch(e=>{document.documentElement.dataset.agpBanc='error';setError(e instanceof Error?e.message:'Full BANC v888 runtime is unavailable');});";
  if(src.includes(old))src=src.replace(old,next);
}
if(src.includes('gp.start();gp.setPaused(true);void ensureBancRuntimeReady()'))throw new Error('Unsafe render-before-simulation boot sequence remains');
if(src.includes('const round=TRACKS_2027[Math.max(0,loadRound()-1)]'))throw new Error('Stale opening round variable remains after attract-boot migration');
if(!src.includes("document.documentElement.dataset.agpBanc=`v${info.materialization}:${info.neurons}:${info.edges}`"))throw new Error('BANC runtime readiness marker missing');
if(src!==before){fs.writeFileSync(file,src);console.log('Applied safe 22-car browser attract boot with runtime readiness markers.');}
else console.log('Safe browser attract boot already current.');

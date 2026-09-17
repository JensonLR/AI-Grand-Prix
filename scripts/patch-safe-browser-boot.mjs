import fs from 'node:fs';

const file='apps/web/src/ChampionshipApp.tsx';
let src=fs.readFileSync(file,'utf8');
const before=src;

const unsafe="gp.start();gp.setPaused(true);void ensureBancRuntimeReady().then(()=>{if(scene.current!==gp)return;gp.startRace({...initialConfig,entrants:22,trackId:round.id,championshipRound:round.round});gp.setFocus(ENTRANTS[0].id);gp.setCamera('broadcast');gp.setPaused(true);}).catch(e=>setError(e instanceof Error?e.message:'Full BANC v888 runtime is unavailable'));";
const safe="void (async()=>{try{const response=await fetch(new URL('replays/demo.agpr.json',document.baseURI));if(!response.ok)throw new Error(`Opening replay unavailable (${response.status})`);const replay=await response.json() as ReplayFile;if(scene.current!==gp)return;await gp.loadReplay(replay);gp.setFocus(replay.frames[0]?.cars[0]?.id??ENTRANTS[0].id);gp.setCamera('broadcast');gp.setPaused(false);gp.start();}catch(e){if(scene.current===gp){setRenderError(true);setError(e instanceof Error?e.message:'Opening race preview failed to load');}}void ensureBancRuntimeReady().catch(e=>setError(e instanceof Error?e.message:'Full BANC v888 runtime is unavailable'));})();";

if(src.includes(unsafe))src=src.replace(unsafe,safe);
if(!src.includes("await gp.loadReplay(replay);gp.setFocus(replay.frames[0]?.cars[0]?.id??ENTRANTS[0].id);gp.setCamera('broadcast');gp.setPaused(false);gp.start();")){
  throw new Error('Safe browser boot patch could not prove the 22-car replay initializes before the render loop starts');
}
if(src.includes('gp.start();gp.setPaused(true);void ensureBancRuntimeReady()')){
  throw new Error('Unsafe render-before-simulation boot sequence remains');
}
if(src!==before){fs.writeFileSync(file,src);console.log('Applied safe 22-car browser attract boot.');}
else console.log('Safe browser attract boot already current.');

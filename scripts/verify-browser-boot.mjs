import fs from 'node:fs';

const app=fs.readFileSync('apps/web/src/ChampionshipApp.tsx','utf8');
const scene=fs.readFileSync('apps/web/src/GrandPrixScene.ts','utf8');
const replay=JSON.parse(fs.readFileSync('apps/web/public/replays/demo.agpr.json','utf8'));

const fail=message=>{throw new Error(`Browser boot contract failed: ${message}`)};
if(app.includes('gp.start();gp.setPaused(true);void ensureBancRuntimeReady()'))fail('render loop can start before a simulation exists');
if(!app.includes("fetch(new URL('replays/demo.agpr.json',document.baseURI))"))fail('opening attract replay is not loaded');
if(!app.includes('await gp.loadReplay(replay)'))fail('replay does not initialise scene simulation before render loop');
if(!app.includes("gp.setCamera('broadcast');gp.setPaused(false);gp.start();"))fail('render loop is not started after replay initialisation');
if(!scene.includes('this.updateCamera(now/1000);this.renderer.render(this.scene,this.camera)'))fail('expected renderer contract changed; review safe-boot assumptions');
if(replay.trackId!=='bh-2002')fail(`opening replay is ${replay.trackId}, expected Bahrain bh-2002`);
if(!Array.isArray(replay.frames)||!replay.frames.length)fail('opening replay has no frames');
const cars=replay.frames[0]?.cars?.length??0;
if(cars!==22)fail(`opening replay contains ${cars} cars, expected 22`);
console.log(`Browser boot contract passed: Bahrain attract replay initialises ${cars} cars before RAF; BANC loads in parallel.`);

import {readFile} from 'node:fs/promises';
const [app,scene,opening,home,world,calendar]=await Promise.all([
  readFile('apps/web/src/ChampionshipApp.tsx','utf8'),readFile('apps/web/src/GrandPrixScene.ts','utf8'),readFile('apps/web/src/Opening2027.tsx','utf8'),readFile('apps/web/src/PaddockHome.tsx','utf8'),readFile('apps/web/src/PremiumWorld.ts','utf8'),readFile('packages/sim-core/src/generated/season2027.ts','utf8')
]);
const failures=[];
const require=(condition,message)=>{if(!condition)failures.push(message)};
require(app.includes('<Opening2027 track={track}'), 'Opening2027 is not the production title screen');
require(app.includes('<PaddockHome track={track}'), 'PaddockHome is not the production home screen');
require(app.includes('entrants:22,trackId:round.id'), 'opening scene does not stage the 22-car current-round grid');
require(opening.includes('THE GRID IS')&&opening.includes('OFFICIAL 24-ROUND CHAMPIONSHIP'),'new 2027 opening copy missing');
require(home.includes('24-ROUND CALENDAR')&&home.includes('CURRENT CHAMPIONSHIP ROUND'),'season-first paddock missing');
require(scene.includes('buildPremiumWorld(this.worldGroup'), 'circuit-specific world generator is not active');
require(!scene.includes("this.startRace({session:'QUICK_RACE',laps:3,entrants:8"), 'legacy 8-car constructor auto-start still active');
require(!scene.includes('this.makeLandscape();this.makeVenue();decoratePremiumCircuit'), 'legacy Azure Coast venue path still active in setTrack');
require(calendar.includes('"id":"bh-2002","round":1'), 'Bahrain is not round one in generated calendar');
require(calendar.includes('"id":"ae-2009","round":24'), 'Abu Dhabi is not round 24 in generated calendar');
require((calendar.match(/"round":/g)??[]).length===24,'generated championship does not contain exactly 24 rounds');
require(world.includes("const DESERT=new Set(['bh-2002'"),'Bahrain is not mapped to the desert world');
if(failures.length){console.error('2027 visible-product gate failed:\n- '+failures.join('\n- '));process.exit(1)}
console.log('2027 visible-product gate passed: new mark/opening/paddock, 22-car current-round scene, circuit worlds and 24-round calendar are active.');

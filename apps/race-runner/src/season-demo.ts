import {mkdir,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createCar,DEFAULT_2027_TRACK_ID,FIXED_DT} from '@agp/sim-core';
import {ChampionshipRaceSimulation} from '@agp/sim-core/championship';
import {DeterministicDriver,decisionToControl,observe} from '@agp/driver-sdk';
import {VERSION,type Control,type ReplayFile} from '@agp/shared';
import {ENTRANTS,TEAMS,teamFor} from '../../web/src/championship';
import {constructorDevelopment} from '../../web/src/constructorDevelopment';

const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'../../..'),trackId=DEFAULT_2027_TRACK_ID,round=1;
const states=ENTRANTS.map((d,i)=>{const team=teamFor(d),tuning=constructorDevelopment(team,round).tuning,c=createCar(d.id,d.name,d.number,d.colour,i,tuning,trackId);c.teamId=d.teamId;c.teamName=d.teamName;return c;});
const sim=new ChampionshipRaceSimulation(states,1,2027001,'CLEAR',trackId,round),drivers=new Map(ENTRANTS.map(d=>[d.id,new DeterministicDriver(d.id,d.name)])),controls=new Map<string,Control>(),frames:ReplayFile['frames']=[];
const capture=()=>({t:+sim.state.time.toFixed(3),cars:sim.state.cars.map(c=>({id:c.id,x:+c.x.toFixed(3),z:+c.z.toFixed(3),yaw:+c.yaw.toFixed(5),speed:+c.speed.toFixed(2),lap:c.lap,position:c.position,status:c.status,damage:+c.damage.toFixed(3),compound:c.compound,neural:c.neural?{activeNeurons:c.neural.activeNeurons,spikeRate:c.neural.spikeRate,visualActivity:c.neural.visualActivity,descendingActivity:c.neural.descendingActivity,steeringOutput:c.neural.steeringOutput,throttleOutput:c.neural.throttleOutput,brakeOutput:c.neural.brakeOutput}:undefined}))});
while(sim.state.flag!=='CHEQUERED'&&sim.state.time<360){
  if(sim.state.tick%10===0)for(const car of sim.state.cars){if(car.status!=='RUNNING')continue;const d=drivers.get(car.id)!;controls.set(car.id,decisionToControl(await d.decide(observe(sim.state,car))));}
  sim.step(controls,FIXED_DT);if(sim.state.tick%60===0)frames.push(capture());
}
if(frames.at(-1)?.t!==+sim.state.time.toFixed(3))frames.push(capture());
const finishers=sim.state.cars.filter(c=>c.status==='FINISHED').length;
if(finishers!==22){console.error(`Bahrain public replay failed: ${finishers}/22 finishers`);process.exitCode=1;}else{
  const events:unknown[]=[...sim.state.incidents,...[...sim.state.cars].sort((a,b)=>a.position-b.position).map(c=>({type:'CLASSIFICATION',car:c.id,position:c.position,status:c.status,bestLap:c.bestLap,team:c.teamId,pitStops:c.pitStops}))];
  const replay:ReplayFile={format:'AGPR/1',createdAt:new Date().toISOString(),classification:'NON-BENCHMARK',reason:'Public Round 1 Bahrain season replay using the AGP compact neural simulation interface. Full BANC v888 runtime is not active.',versions:VERSION,seed:sim.state.seed,laps:sim.laps,trackId,championshipRound:round,frames,events};
  const output=resolve(root,'apps/web/public/replays/demo.agpr.json');await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(replay));
  console.log(`Public season replay: Bahrain · ${frames.length} frames · ${finishers}/22 finishers · ${sim.state.time.toFixed(2)}s · ${TEAMS.length} constructors`);
}

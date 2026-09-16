import { mkdir,writeFile } from 'node:fs/promises';
import { dirname,resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RaceSimulation,createCar,FIXED_DT } from '@agp/sim-core';
import { DeterministicDriver,decisionToControl,observe } from '@agp/driver-sdk';
import { VERSION,type ConstructorTuning,type Control,type ReplayFile } from '@agp/shared';

const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'../../..');
const tune=(v:Partial<ConstructorTuning>):ConstructorTuning=>({aeroEfficiency:1,downforce:1,mechanicalGrip:1,energySystem:1,braking:1,tyreManagement:1,reliability:1,controlResponse:1,...v});
const teams={
  mlarvae:{name:'McLARVAE RACING',colour:'#FF7A18',t:tune({aeroEfficiency:1.010,tyreManagement:1.010,controlResponse:.997})},
  mercedeyes:{name:'MERCED-EYES',colour:'#20B8A8',t:tune({energySystem:1.012,reliability:1.006,controlResponse:.992})},
  redbug:{name:'RED BUG RACING',colour:'#D62828',t:tune({downforce:1.007,controlResponse:1.014,reliability:.992})},
  flyrrari:{name:'SCUDERIA FLYRRARI',colour:'#B5162C',t:tune({braking:1.014,downforce:1.010,tyreManagement:.988})},
  wingliams:{name:'WINGLIAMS RACING',colour:'#1254D8',t:tune({aeroEfficiency:1.014,energySystem:1.006,downforce:.989})},
  racingbugs:{name:'RACING BUGS',colour:'#7C3AED',t:tune({mechanicalGrip:1.008,controlResponse:1.012,reliability:.994})},
  astonmidge:{name:'ASTON MIDGE',colour:'#0A6B58',t:tune({downforce:1.014,mechanicalGrip:1.005,aeroEfficiency:.989})},
  haasfly:{name:'HAASFLY',colour:'#C9C3B6',t:tune({reliability:1.014,mechanicalGrip:1.006,aeroEfficiency:.989})},
  audeye:{name:'AUD-EYE SPORT',colour:'#E4572E',t:tune({aeroEfficiency:1.004,energySystem:1.008,controlResponse:.994})},
  flypine:{name:'FLYPINE',colour:'#2C75D8',t:tune({mechanicalGrip:1.014,tyreManagement:1.004,aeroEfficiency:.987})},
  caddislac:{name:'CADDIS-LAC RACING',colour:'#111827',t:tune({energySystem:1.014,braking:1.008,controlResponse:.987})}
} as const;
const roster=[
  ['lando-norwings','Lando Norwings',4,'mlarvae'],['oscar-flyastri','Oscar Flyastri',81,'mlarvae'],['george-buzzell','George Buzzell',63,'mercedeyes'],['kimi-antennelli','Kimi Antennelli',12,'mercedeyes'],['max-verflappen','Max Verflappen',1,'redbug'],['isack-hatchjar','Isack Hatchjar',6,'redbug'],['charles-leflec','Charles LeFlec',16,'flyrrari'],['lewis-hamilwing','Lewis Hamilwing',44,'flyrrari'],['alex-albuzz','Alex Albuzz',23,'wingliams'],['carlos-swarmz','Carlos Swarmz',55,'wingliams'],['liam-larvson','Liam Larvson',30,'racingbugs'],['arvid-wingblad','Arvid Wingblad',41,'racingbugs'],['fernando-flylonso','Fernando Flylonso',14,'astonmidge'],['lance-strollwing','Lance Strollwing',18,'astonmidge'],['esteban-ocellon','Esteban Ocellon',31,'haasfly'],['ollie-buzman','Ollie Buzman',87,'haasfly'],['nico-hoverberg','Nico Hoverberg',27,'audeye'],['gabriel-bortofly','Gabriel Bortofly',5,'audeye'],['pierre-gnatsly','Pierre Gnatsly',10,'flypine'],['franco-larvapinto','Franco Larvapinto',43,'flypine'],['valtteri-botfly','Valtteri Botfly',77,'caddislac'],['sergio-flyrez','Sergio Flyrez',11,'caddislac']
] as const;

const states=roster.map((e,i)=>{const team=teams[e[3]],c=createCar(e[0],e[1],e[2],team.colour,i,team.t);c.teamId=e[3];c.teamName=team.name;return c;});
const sim=new RaceSimulation(states,3,4127,'CLEAR');
const drivers=new Map<string,DeterministicDriver>(roster.map(e=>[e[0],new DeterministicDriver(e[0],e[1])]));
const controls=new Map<string,Control>(),frames:ReplayFile['frames']=[],events:unknown[]=[];
const capture=()=>({t:+sim.state.time.toFixed(3),cars:sim.state.cars.map(c=>({id:c.id,x:+c.x.toFixed(3),z:+c.z.toFixed(3),yaw:+c.yaw.toFixed(5),speed:+c.speed.toFixed(2),lap:c.lap,position:c.position,status:c.status,damage:+c.damage.toFixed(3),compound:c.compound,neural:c.neural?{activeNeurons:c.neural.activeNeurons,spikeRate:c.neural.spikeRate,visualActivity:c.neural.visualActivity,descendingActivity:c.neural.descendingActivity,steeringOutput:c.neural.steeringOutput,throttleOutput:c.neural.throttleOutput,brakeOutput:c.neural.brakeOutput}:undefined}))});

while(sim.state.flag!=='CHEQUERED'&&sim.state.time<480){
  if(sim.state.tick%10===0){for(const car of sim.state.cars){if(car.status!=='RUNNING')continue;const d=drivers.get(car.id)!;controls.set(car.id,decisionToControl(await d.decide(observe(sim.state,car))));}}
  sim.step(controls,FIXED_DT);
  if(sim.state.tick%48===0)frames.push(capture());
}
if(frames.at(-1)?.t!==+sim.state.time.toFixed(3))frames.push(capture());
for(const c of [...sim.state.cars].sort((a,b)=>a.position-b.position))events.push({type:'CLASSIFICATION',car:c.id,position:c.position,status:c.status,bestLap:c.bestLap,team:c.teamId});
for(const incident of sim.state.incidents)events.push(incident);
const replay:ReplayFile={format:'AGPR/1',createdAt:new Date().toISOString(),classification:'NON-BENCHMARK',reason:'AGP compact neural simulation interface. Full BANC v888 runtime is not active.',versions:VERSION,seed:sim.state.seed,laps:sim.laps,frames,events};
for(const output of [resolve(root,'data/races/latest.agpr.json'),resolve(root,'apps/web/public/replays/demo.agpr.json')]){await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(replay));console.log(`Replay: ${output}`);}
console.log(`Race complete: ${sim.state.time.toFixed(2)}s · ${frames.length} frames · ${sim.state.cars.filter(c=>c.status==='FINISHED').length}/22 finishers`);

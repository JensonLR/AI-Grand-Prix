import { mkdir,writeFile } from 'node:fs/promises';
import { dirname,resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCar,FIXED_DT } from '@agp/sim-core';
import { ChampionshipRaceSimulation } from '@agp/sim-core/championship';
import { DeterministicDriver,decisionToControl,observe,academyQualificationMetric,academyCandidateSeeds } from '@agp/driver-sdk';
import { VERSION,type ConstructorTuning,type Control,type ReplayFile } from '@agp/shared';

const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'../../..');
const CERTIFICATION_LIMIT_SECONDS=600;
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
const sim=new ChampionshipRaceSimulation(states,3,4127,'CLEAR');
const drivers=new Map<string,DeterministicDriver>(roster.map(e=>[e[0],new DeterministicDriver(e[0],e[1])]));
const controls=new Map<string,Control>(),frames:ReplayFile['frames']=[],events:unknown[]=[];
const capture=()=>({t:+sim.state.time.toFixed(3),cars:sim.state.cars.map(c=>({id:c.id,x:+c.x.toFixed(3),z:+c.z.toFixed(3),yaw:+c.yaw.toFixed(5),speed:+c.speed.toFixed(2),lap:c.lap,position:c.position,status:c.status,damage:+c.damage.toFixed(3),compound:c.compound,neural:c.neural?{activeNeurons:c.neural.activeNeurons,spikeRate:c.neural.spikeRate,visualActivity:c.neural.visualActivity,descendingActivity:c.neural.descendingActivity,steeringOutput:c.neural.steeringOutput,throttleOutput:c.neural.throttleOutput,brakeOutput:c.neural.brakeOutput}:undefined}))});

while(sim.state.flag!=='CHEQUERED'&&sim.state.time<CERTIFICATION_LIMIT_SECONDS){
  if(sim.state.tick%10===0){for(const car of sim.state.cars){if(car.status!=='RUNNING')continue;const d=drivers.get(car.id)!;controls.set(car.id,decisionToControl(await d.decide(observe(sim.state,car))));}}
  sim.step(controls,FIXED_DT);
  if(sim.state.tick%48===0)frames.push(capture());
}
if(frames.at(-1)?.t!==+sim.state.time.toFixed(3))frames.push(capture());
for(const c of [...sim.state.cars].sort((a,b)=>a.position-b.position))events.push({type:'CLASSIFICATION',car:c.id,position:c.position,status:c.status,bestLap:c.bestLap,team:c.teamId,pitStops:c.pitStops});
for(const incident of sim.state.incidents)events.push(incident);
const replay:ReplayFile={format:'AGPR/1',createdAt:new Date().toISOString(),classification:'NON-BENCHMARK',reason:'AGP compact neural simulation interface. Full BANC v888 runtime is not active.',versions:VERSION,seed:sim.state.seed,laps:sim.laps,frames,events};
for(const output of [resolve(root,'data/races/latest.agpr.json'),resolve(root,'apps/web/public/replays/demo.agpr.json')]){await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(replay));console.log(`Replay: ${output}`);}

const finishers=sim.state.cars.filter(c=>c.status==='FINISHED').length;
const validBest=sim.state.cars.map(c=>c.bestLap).filter((v):v is number=>v!=null&&Number.isFinite(v)).sort((a,b)=>a-b);
// One exceptionally fast phenotype must not make the Super Licence a fastest-only selection.
// Use the median of the five fastest valid laps as a robust competence reference.
const referenceSet=validBest.slice(0,Math.min(5,validBest.length));
const benchmarkBest=referenceSet.length?referenceSet[Math.floor(referenceSet.length/2)]:Infinity;
const licences=sim.state.cars.map(car=>{
  const offTrack=sim.state.incidents.filter(i=>i.type==='OFF_TRACK'&&i.cars.includes(car.id)).length;
  const collisions=sim.state.incidents.filter(i=>i.type==='CONTACT'&&i.cars.includes(car.id)).length;
  const lapCompletion=car.status==='FINISHED'?1:Math.min(1,(car.lap+car.progress)/sim.laps);
  const offTrackRate=offTrack/Math.max(1,frames.length);
  const collisionRate=collisions/Math.max(1,frames.length);
  const paceRatio=car.bestLap&&Number.isFinite(benchmarkBest)?Math.min(1,benchmarkBest/car.bestLap):0;
  return {id:car.id,phenotypeId:car.neural?.phenotypeId??drivers.get(car.id)?.phenotype.id,status:academyQualificationMetric(lapCompletion,offTrackRate,collisionRate,paceRatio)?'QUALIFIED':'FAILED',lapCompletion:+lapCompletion.toFixed(4),offTrackRate:+offTrackRate.toFixed(5),collisionRate:+collisionRate.toFixed(5),paceRatio:+paceRatio.toFixed(4),bestLap:car.bestLap,damage:+car.damage.toFixed(3),pitStops:car.pitStops};
});
const academySeeds=academyCandidateSeeds(160,0xA6C2026);
const licenceFile={format:'AGP-SUPER-LICENCE/1',createdAt:new Date().toISOString(),simulation:VERSION.sim,track:VERSION.track,seed:sim.state.seed,candidateGenerator:{configuredPopulation:160,seed:'0x0A6C2026',firstCandidate:academySeeds[0],lastCandidate:academySeeds.at(-1),note:'Population generation is deterministic. This file certifies the named championship roster from the measured neutral competence race; it does not claim all 160 generated candidates completed full track evaluation.'},paceReference:{method:'MEDIAN_OF_FASTEST_FIVE_VALID_LAPS',seconds:Number.isFinite(benchmarkBest)?+benchmarkBest.toFixed(4):null,reason:'Robust minimum-competence reference so one outlier cannot turn the licence into fastest-only selection.'},gates:{lapCompletion:0.96,maxOffTrackRate:0.08,maxCollisionRate:0.04,minPaceRatio:0.72,maxAssessmentSeconds:CERTIFICATION_LIMIT_SECONDS},drivers:licences};
for(const output of [resolve(root,'data/connectome/super-licence.json'),resolve(root,'apps/web/public/connectome/super-licence.json')]){await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(licenceFile,null,2));console.log(`Super Licence: ${output}`);}
const qualified=licences.filter(l=>l.status==='QUALIFIED').length;
console.log(`Race complete: ${sim.state.time.toFixed(2)}s · ${frames.length} frames · ${finishers}/22 finishers · ${qualified}/22 licensed · reference ${Number.isFinite(benchmarkBest)?benchmarkBest.toFixed(3):'n/a'}s`);
console.log('Final driver state:',JSON.stringify([...sim.state.cars].sort((a,b)=>a.position-b.position).map(c=>({id:c.id,position:c.position,lap:c.lap,progress:+c.progress.toFixed(3),speed:+c.speed.toFixed(1),damage:+c.damage.toFixed(3),surface:c.surface,pitStops:c.pitStops,compound:c.compound,steer:+c.controls.steering.toFixed(2),throttle:+c.controls.throttle.toFixed(2),brake:+c.controls.brake.toFixed(2)}))));
if(finishers!==22||qualified!==22){console.error(`AGP Super Licence smoke race failed: ${22-finishers} non-finisher(s), ${22-qualified} unlicensed phenotype(s).`);process.exitCode=1;}

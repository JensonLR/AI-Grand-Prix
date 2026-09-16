import { createCar,FIXED_DT,RaceSimulation,TRACKS_2027 } from '@agp/sim-core';
import { DeterministicDriver,decisionToControl,observe } from '@agp/driver-sdk';
import type { Control } from '@agp/shared';

const MAX_SECONDS=240;
const SAMPLE_DRIVER_ID='lando-norwings';
const failures:string[]=[];

for(const track of TRACKS_2027){
  const car=createCar(SAMPLE_DRIVER_ID,'Lando Norwings',4,'#FF7A18',0,undefined,track.id);
  const sim=new RaceSimulation([car],1,4127,'CLEAR',track.id,track.round);
  const driver=new DeterministicDriver(SAMPLE_DRIVER_ID,'Lando Norwings');
  const controls=new Map<string,Control>();
  let maxProgress=0;
  while(sim.state.time<MAX_SECONDS&&car.status==='RUNNING'){
    if(sim.state.tick%10===0)controls.set(car.id,decisionToControl(await driver.decide(observe(sim.state,car))));
    sim.step(controls,FIXED_DT);
    maxProgress=Math.max(maxProgress,car.lap+car.progress);
    if(!Number.isFinite(car.x)||!Number.isFinite(car.z)||!Number.isFinite(car.speed))break;
  }
  const completed=car.status==='FINISHED'||maxProgress>=.96;
  const finite=Number.isFinite(car.x)&&Number.isFinite(car.z)&&Number.isFinite(car.speed)&&Number.isFinite(car.neural?.spikeRate??NaN);
  console.log(`${String(track.round).padStart(2,'0')} ${track.venue.padEnd(18)} · ${completed?'PASS':'FAIL'} · progress ${maxProgress.toFixed(3)} · ${sim.state.time.toFixed(1)}s`);
  if(!completed||!finite)failures.push(`${track.round} ${track.venue}: progress=${maxProgress.toFixed(3)} finite=${finite}`);
}

if(failures.length){
  console.error(`Season drivability failed on ${failures.length}/24 circuit(s):\n${failures.join('\n')}`);
  process.exitCode=1;
}else console.log('2027 season drivability: 24/24 circuits pass neural single-lap smoke.');

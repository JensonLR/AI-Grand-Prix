import { describe,expect,it } from 'vitest';
import { createCar,FIXED_DT } from './index';
import { ChampionshipRaceSimulation } from './championship';
import type { Control } from '@agp/shared';

const drive:Control={steering:0,throttle:.45,brake:0,energyDeploy:0};

describe('championship race control',()=>{
  it('requests a weather pit stop for a dry tyre in heavy rain',()=>{
    const car=createCar('test','Test Fly',1,'#fff',0);
    const sim=new ChampionshipRaceSimulation([car],3,42,'HEAVY_RAIN');
    sim.step(new Map([[car.id,drive]]),FIXED_DT);
    expect(sim.getPitPhase(car.id)).not.toBeNull();
  });

  it('completes a stationary tyre service and changes to wet tyres',()=>{
    const car=createCar('test','Test Fly',1,'#fff',0);
    const sim=new ChampionshipRaceSimulation([car],3,42,'HEAVY_RAIN');
    const inputs=new Map([[car.id,drive]]);
    for(let i=0;i<120*8&&car.pitStops===0;i++)sim.step(inputs,FIXED_DT);
    expect(car.pitStops).toBe(1);
    expect(car.compound).toBe('WET');
    expect(car.tyres.every(t=>!t.punctured&&t.wear===0)).toBe(true);
  });
});

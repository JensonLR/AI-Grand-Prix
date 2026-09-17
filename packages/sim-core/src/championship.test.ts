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

  it('deploys a physical Safety Car for a high-severity incident',()=>{
    const a=createCar('a','A',1,'#fff',0),b=createCar('b','B',2,'#000',1);
    const sim=new ChampionshipRaceSimulation([a,b],3,42,'CLEAR');
    sim.state.incidents.push({id:'manual-high',time:sim.state.time,lap:0,type:'CONTACT',cars:['a','b'],severity:'HIGH'});
    sim.step(new Map([['a',drive],['b',drive]]),FIXED_DT);
    expect(sim.state.flag).toBe('SAFETY_CAR');
    for(let i=0;i<120*2;i++)sim.step(new Map([['a',{...drive,throttle:1}],['b',{...drive,throttle:1}]]),FIXED_DT);
    expect(Math.max(a.speed,b.speed)).toBeLessThan(34);
  });

  it('stops the field on a red flag then restarts under Safety Car',()=>{
    const a=createCar('a','A',1,'#fff',0),b=createCar('b','B',2,'#000',1);
    const sim=new ChampionshipRaceSimulation([a,b],3,42,'CLEAR'),inputs=new Map([['a',drive],['b',drive]]);
    sim.state.incidents.push({id:'high-1',time:sim.state.time,lap:0,type:'CONTACT',cars:['a','b'],severity:'HIGH'});sim.step(inputs,FIXED_DT);
    sim.state.incidents.push({id:'high-2',time:sim.state.time,lap:0,type:'CONTACT',cars:['a','b'],severity:'HIGH'});sim.step(inputs,FIXED_DT);
    expect(sim.state.flag).toBe('RED');
    for(let i=0;i<120;i++)sim.step(inputs,FIXED_DT);
    expect(a.speed).toBe(0);expect(b.speed).toBe(0);
    for(let i=0;i<120*8;i++)sim.step(inputs,FIXED_DT);
    expect(sim.state.flag).toBe('SAFETY_CAR');
    expect([a.position,b.position].sort()).toEqual([1,2]);
  });
});

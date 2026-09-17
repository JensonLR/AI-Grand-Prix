import { describe,expect,it } from 'vitest';
import { createCar,FIXED_DT } from './index';
import { ChampionshipRaceSimulation } from './championship';
import type { Control } from '@agp/shared';
const drive:Control={steering:0,throttle:.45,brake:0,energyDeploy:0};
describe('championship race control',()=>{
  it('launches every healthy grid car even while neural motor output is cold',()=>{
    const cars=Array.from({length:22},(_,i)=>createCar(`c${i}`,`Car ${i}`,i+1,'#fff',i));
    const starts=new Map(cars.map(c=>[c.id,{x:c.x,z:c.z}]));
    const sim=new ChampionshipRaceSimulation(cars,3,42,'CLEAR');
    const cold=new Map(cars.map(c=>[c.id,{steering:0,throttle:0,brake:1,energyDeploy:0} as Control]));
    for(let i=0;i<120*3;i++)sim.step(cold,FIXED_DT);
    expect(cars.every(c=>{const s=starts.get(c.id)!;return Math.hypot(c.x-s.x,c.z-s.z)>1})).toBe(true);
    expect(cars.every(c=>c.pitStops===0&&sim.getPitPhase(c.id)===null)).toBe(true);
  });
  it('does not send healthy cars from their grid slots directly into the pits',()=>{
    const cars=Array.from({length:22},(_,i)=>createCar(`c${i}`,`Car ${i}`,i+1,'#fff',i));const sim=new ChampionshipRaceSimulation(cars,3,42,'HEAVY_RAIN');const inputs=new Map(cars.map(c=>[c.id,drive]));for(let i=0;i<120*20;i++)sim.step(inputs,FIXED_DT);expect(cars.every(c=>c.pitStops===0)).toBe(true);
  });
  it('allows weather strategy after lap one',()=>{const car=createCar('test','Test Fly',1,'#fff',0);const sim=new ChampionshipRaceSimulation([car],3,42,'HEAVY_RAIN');car.lap=1;sim.state.time=30;sim.step(new Map([[car.id,drive]]),FIXED_DT);expect(sim.getPitPhase(car.id)).not.toBeNull();});
  it('deploys a physical Safety Car for a high-severity incident',()=>{const a=createCar('a','A',1,'#fff',0),b=createCar('b','B',2,'#000',1);const sim=new ChampionshipRaceSimulation([a,b],3,42,'CLEAR');sim.state.incidents.push({id:'manual-high',time:sim.state.time,lap:0,type:'CONTACT',cars:['a','b'],severity:'HIGH'});sim.step(new Map([['a',drive],['b',drive]]),FIXED_DT);expect(sim.state.flag).toBe('SAFETY_CAR');for(let i=0;i<120*2;i++)sim.step(new Map([['a',{...drive,throttle:1}],['b',{...drive,throttle:1}]]),FIXED_DT);expect(Math.max(a.speed,b.speed)).toBeLessThan(34);});
  it('stops the field on a red flag then restarts under Safety Car',()=>{const a=createCar('a','A',1,'#fff',0),b=createCar('b','B',2,'#000',1);const sim=new ChampionshipRaceSimulation([a,b],3,42,'CLEAR'),inputs=new Map([['a',drive],['b',drive]]);sim.state.incidents.push({id:'high-1',time:sim.state.time,lap:0,type:'CONTACT',cars:['a','b'],severity:'HIGH'});sim.step(inputs,FIXED_DT);sim.state.incidents.push({id:'high-2',time:sim.state.time,lap:0,type:'CONTACT',cars:['a','b'],severity:'HIGH'});sim.step(inputs,FIXED_DT);expect(sim.state.flag).toBe('RED');for(let i=0;i<120;i++)sim.step(inputs,FIXED_DT);expect(a.speed).toBe(0);expect(b.speed).toBe(0);for(let i=0;i<120*8;i++)sim.step(inputs,FIXED_DT);expect(sim.state.flag).toBe('SAFETY_CAR');expect([a.position,b.position].sort()).toEqual([1,2]);});
});

import { describe,expect,it } from 'vitest';
import { FIXED_DT,RaceSimulation,createCar,nearestTrack,trackPoint,trackTangent } from './index';
import type { Control } from '@agp/shared';

describe('authoritative race simulation',()=>{
  it('accelerates, brakes and remains finite',()=>{
    const car=createCar('a','A',1,'#fff',0),sim=new RaceSimulation([car],1,1);
    const controls=new Map<string,Control>([['a',{steering:0,throttle:1,brake:0,energyDeploy:0}]]);
    for(let i=0;i<240;i++)sim.step(controls,FIXED_DT);
    expect(car.speed).toBeGreaterThan(10);
    controls.set('a',{steering:0,throttle:0,brake:1,energyDeploy:0});
    const before=car.speed;for(let i=0;i<120;i++)sim.step(controls,FIXED_DT);
    expect(car.speed).toBeLessThan(before);
    expect(Number.isFinite(car.x)).toBe(true);
  });

  it('constructor tuning is tightly bounded',()=>{
    const car=createCar('a','A',1,'#fff',0,{downforce:2,aeroEfficiency:.2,controlResponse:4});
    expect(car.tuning?.downforce).toBeLessThanOrEqual(1.015);
    expect(car.tuning?.aeroEfficiency).toBeGreaterThanOrEqual(.985);
    expect(car.tuning?.controlResponse).toBeLessThanOrEqual(1.015);
  });

  it('wetness is actually present in wet conditions',()=>{
    const car=createCar('a','A',1,'#fff',0),wet=new RaceSimulation([car],1,1,'HEAVY_RAIN');
    expect(wet.state.wetness).toBeGreaterThan(.7);
  });

  it('track mapping is driveable and reversible enough for control',()=>{
    for(const t of [0,.1,.25,.5,.75,.99]){
      const p=trackPoint(t),n=nearestTrack(p.x,p.z),hinted=nearestTrack(p.x,p.z,t),tan=trackTangent(t);
      expect(n.distance).toBeLessThan(.6);
      expect(hinted.distance).toBeLessThan(.6);
      expect(Math.abs(hinted.distance-n.distance)).toBeLessThan(.12);
      expect(Number.isFinite(tan.yaw)).toBe(true);
    }
  });

  it('applies boundary damage as an impact rather than every physics tick',()=>{
    const car=createCar('a','A',1,'#fff',0),p=trackPoint(.2),tan=trackTangent(.2);
    car.x=p.x+tan.z*9;car.z=p.z-tan.x*9;car.progress=.2;car.speed=34;car.yaw=tan.yaw;
    const sim=new RaceSimulation([car],1,1),controls=new Map<string,Control>([['a',{steering:0,throttle:.35,brake:0,energyDeploy:0}]]);
    for(let i=0;i<180;i++)sim.step(controls,FIXED_DT);
    expect(car.damage).toBeLessThan(.12);
    expect(car.frontWing).toBeGreaterThan(.8);
  });
});

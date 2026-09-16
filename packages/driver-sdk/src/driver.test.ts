import { describe,expect,it } from 'vitest';
import { createCar,RaceSimulation } from '@agp/sim-core';
import { AGPConnectomeDriver,academyCandidateSeeds,academyQualificationMetric,decisionToControl,observe,phenotypeFromSeed } from './index';

describe('connectome phenotype',()=>{
  it('is deterministic from its seed',()=>{
    expect(phenotypeFromSeed(4127)).toEqual(phenotypeFromSeed(4127));
  });

  it('different seeds genuinely differ while staying tightly bounded',()=>{
    const a=phenotypeFromSeed(1),b=phenotypeFromSeed(2);
    expect(a).not.toEqual(b);
    for(const p of [a,b]){
      expect(p.firingThreshold).toBeGreaterThanOrEqual(.955);
      expect(p.firingThreshold).toBeLessThanOrEqual(1.045);
      expect(p.synapticGain).toBeGreaterThanOrEqual(.96);
      expect(p.synapticGain).toBeLessThanOrEqual(1.04);
      expect(p.decoderCalibration).toBeGreaterThanOrEqual(.985);
      expect(p.decoderCalibration).toBeLessThanOrEqual(1.015);
    }
  });

  it('creates a deterministic academy candidate population',()=>{
    expect(academyCandidateSeeds(32,99)).toEqual(academyCandidateSeeds(32,99));
    expect(new Set(academyCandidateSeeds(32,99)).size).toBeGreaterThan(28);
  });

  it('super licence gate enforces minimum competence rather than fastest-only selection',()=>{
    expect(academyQualificationMetric(.99,.03,.01,.78)).toBe(true);
    expect(academyQualificationMetric(.72,.03,.01,.99)).toBe(false);
    expect(academyQualificationMetric(.99,.16,.01,.99)).toBe(false);
  });

  it('produces controls through the neural interface and exposes computed neural telemetry',async()=>{
    const car=createCar('fly-a','Fly A',4,'#fff',0),other=createCar('fly-b','Fly B',8,'#000',1),sim=new RaceSimulation([car,other],1,123);
    const driver=new AGPConnectomeDriver('fly-a','Fly A');
    const decision=await driver.decide(observe(sim.state,car));
    const control=decisionToControl(decision);
    expect(Number.isFinite(control.steering)).toBe(true);
    expect(control.throttle).toBeGreaterThanOrEqual(0);
    expect(control.throttle).toBeLessThanOrEqual(1);
    expect(car.neural?.source).toBe('AGP_SIMULATION_INTERFACE');
    expect(car.neural?.phenotypeId).toMatch(/^FLY-/);
    expect(car.neural?.connectomeSimRate).toBeGreaterThan(0);
  });

  it('same driver seed and same initial observation yield the same control decision',async()=>{
    const carA=createCar('same-fly','Fly',1,'#fff',0),carB=createCar('same-fly','Fly',1,'#fff',0);
    const simA=new RaceSimulation([carA],1,1),simB=new RaceSimulation([carB],1,1);
    const a=new AGPConnectomeDriver('same-fly','Fly'),b=new AGPConnectomeDriver('same-fly','Fly');
    const da=decisionToControl(await a.decide(observe(simA.state,carA))),db=decisionToControl(await b.decide(observe(simB.state,carB)));
    expect(da).toEqual(db);
  });
});

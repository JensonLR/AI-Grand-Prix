import * as THREE from 'three';
import { RaceSimulation,createCar,DEFAULT_2027_TRACK_ID } from '@agp/sim-core';
import { ChampionshipRaceSimulation } from '@agp/sim-core/championship';
import { DeterministicDriver } from '@agp/driver-sdk';
import type { Control,RaceConfig,RaceState,ReplayFile,Weather } from '@agp/shared';
import { GrandPrixScene,type CameraMode,type Entrant as LegacyEntrant } from './GrandPrixScene';
import { ENTRANTS as CWC_DRIVERS,TEAMS,teamFor } from './championship';
import { PersistentDriver } from './PersistentDriver';
import { constructorDevelopment } from './constructorDevelopment';

export type { CameraMode };

export const ENTRANTS:LegacyEntrant[]=CWC_DRIVERS.map(driver=>{
  const team=teamFor(driver);
  return {
    id:driver.id,
    name:driver.name,
    number:driver.number,
    colour:driver.colour,
    secondary:driver.secondary,
    accent:driver.accent,
    temperament:0,
    provider:team.name,
    model:driver.phenotypeId,
    liveryTheory:`${team.philosophy} ${team.interface}`,
    connection:'LOCAL'
  };
});

interface SceneInternals {
  scene:THREE.Scene;
  sim:RaceSimulation;
  drivers:Map<string,DeterministicDriver>;
  controls:Map<string,Control>;
  cars:Map<string,THREE.Group>;
  entrants:Map<string,LegacyEntrant>;
  sceneMode:'live'|'replay'|'human';
  replay:ReplayFile|null;
  replayTime:number;
  replayDuration:number;
  weather:Weather;
  focusId:string;
  paused:boolean;
  clearCars():void;
  applyWeather():void;
  makeCar(e:LegacyEntrant):THREE.Group;
  updateMeshes():void;
  applyReplayFrame(time:number):void;
  onState:(s:RaceState)=>void;
}

const humanEntrant:LegacyEntrant={
  id:'human',name:'HUMAN TEST',number:99,colour:'#F4E8CE',secondary:'#073BBE',accent:'#D7A647',temperament:0,
  provider:'AGP DEVELOPMENT',model:'HUMAN INPUT',liveryTheory:'Ivory and cobalt AGP validation livery.',connection:'LOCAL'
};

const internal=(scene:GrandPrixScene)=>scene as unknown as SceneInternals;
const tuningFor=(id:string,neutral:boolean,round=1)=>{
  if(neutral||id==='human')return undefined;
  const driver=CWC_DRIVERS.find(d=>d.id===id);
  if(!driver)return undefined;const team=teamFor(driver);return constructorDevelopment(team,round).tuning;
};

/**
 * Championship adapter around the original visual scene.
 * The pre-connectome world, cameras, car presentation and broadcast language remain the source of truth.
 * Track geometry, entrants and simulation control are swapped beneath that presentation.
 */
export class FlyGrandPrixScene extends GrandPrixScene {
  override startRace(config:RaceConfig){
    const s=internal(this),trackId=config.trackId??DEFAULT_2027_TRACK_ID;
    for(const driver of s.drivers.values())if(driver instanceof PersistentDriver)driver.persist();
    this.setTrack(trackId);
    s.clearCars();
    s.sceneMode=config.session==='HUMAN_TEST'?'human':'live';
    s.replay=null;s.replayTime=0;s.weather=config.weather;s.applyWeather();
    const requested=Math.max(1,Math.min(config.entrants,CWC_DRIVERS.length));
    const validOrder=(config.gridOrder??[]).filter(id=>ENTRANTS.some(e=>e.id===id));
    const pool=validOrder.length?validOrder.map(id=>ENTRANTS.find(e=>e.id===id)!):ENTRANTS;
    const selected=[...pool.slice(0,requested)];
    if(s.sceneMode==='human')selected[0]=humanEntrant;
    const neutral=config.session==='NEUTRAL_TEST';
    const persistDevelopment=!['NEUTRAL_TEST','BENCHMARK'].includes(config.session);
    const states=selected.map((e,i)=>{
      const car=createCar(e.id,e.name,e.number,e.colour,i,tuningFor(e.id,neutral,config.championshipRound??1),trackId);
      if(e.id!=='human'){
        const d=CWC_DRIVERS.find(x=>x.id===e.id);
        if(d){car.teamId=d.teamId;car.teamName=d.teamName;}
      }
      return car;
    });
    s.sim=new ChampionshipRaceSimulation(states,config.laps,config.seed,config.weather,trackId,config.championshipRound);
    for(const e of selected){
      s.entrants.set(e.id,e);
      if(e.id!=='human'){
        s.drivers.set(e.id,new PersistentDriver(e.id,e.name,persistDevelopment));
        s.controls.set(e.id,{steering:0,throttle:.82,brake:0,energyDeploy:0});
      }
      const mesh=s.makeCar(e);s.cars.set(e.id,mesh);s.scene.add(mesh);
    }
    s.focusId=selected[0].id;s.paused=false;s.updateMeshes();s.onState(s.sim.state);
  }

  override async loadReplay(replay:ReplayFile){
    const s=internal(this),trackId=replay.trackId??DEFAULT_2027_TRACK_ID;
    for(const driver of s.drivers.values())if(driver instanceof PersistentDriver)driver.persist();
    this.setTrack(trackId);
    s.clearCars();s.sceneMode='replay';s.replay=replay;s.replayTime=0;s.replayDuration=replay.frames.at(-1)?.t??0;s.paused=false;s.weather='CLEAR';s.applyWeather();
    const first=replay.frames[0];if(!first)throw new Error('Replay has no frames');
    const entrants=first.cars.map((c,i)=>ENTRANTS.find(e=>e.id===c.id)??{...ENTRANTS[i%ENTRANTS.length],id:c.id,name:c.id.toUpperCase()});
    const states=entrants.map((e,i)=>{
      const car=createCar(e.id,e.name,e.number,e.colour,i,tuningFor(e.id,false,replay.championshipRound??1),trackId);
      const d=CWC_DRIVERS.find(x=>x.id===e.id);if(d){car.teamId=d.teamId;car.teamName=d.teamName;}
      return car;
    });
    s.sim=new RaceSimulation(states,replay.laps,replay.seed,'CLEAR',trackId,replay.championshipRound);
    for(const e of entrants){s.entrants.set(e.id,e);const mesh=s.makeCar(e);s.cars.set(e.id,mesh);s.scene.add(mesh);}
    s.focusId=entrants[0].id;s.applyReplayFrame(0);
  }
}

export const CONSTRUCTORS=TEAMS;

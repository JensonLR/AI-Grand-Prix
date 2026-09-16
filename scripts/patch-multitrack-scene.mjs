import { readFileSync,writeFileSync } from 'node:fs';
const path='apps/web/src/GrandPrixScene.ts';
let source=readFileSync(path,'utf8');
source=source.replace("import { RaceSimulation,createCar,FIXED_DT,trackPoint,trackTangent,TRACK_WIDTH } from '@agp/sim-core';","import { RaceSimulation,createCar,FIXED_DT,trackPoint,trackTangent,TRACK_WIDTH,DEFAULT_2027_TRACK_ID } from '@agp/sim-core';");

const classStart=source.indexOf('export class GrandPrixScene{');
const helperStart=source.indexOf('\nfunction lerpAngle',classStart);
if(classStart<0||helperStart<0)throw new Error('GrandPrixScene class not found');
let cls=source.slice(classStart,helperStart);
if(!cls.includes('private currentTrackId')){
  cls=cls.replace("private lowPower=matchMedia('(max-width: 760px), (prefers-reduced-motion: reduce)').matches;","private lowPower=matchMedia('(max-width: 760px), (prefers-reduced-motion: reduce)').matches;private currentTrackId:string=DEFAULT_2027_TRACK_ID;private trackGroup=new THREE.Group();");
}
cls=cls.replaceAll('trackPoint(','this.tp(').replaceAll('trackTangent(','this.tt(');
cls=cls.replace('const states=selected.map((e,i)=>createCar(e.id,e.name,e.number,e.colour,i));this.sim=new RaceSimulation(states,config.laps,config.seed,config.weather);','this.setTrack(config.trackId??DEFAULT_2027_TRACK_ID);const states=selected.map((e,i)=>createCar(e.id,e.name,e.number,e.colour,i,undefined,this.currentTrackId));this.sim=new RaceSimulation(states,config.laps,config.seed,config.weather,this.currentTrackId,config.championshipRound);');
cls=cls.replace('const states=entrants.map((e,i)=>createCar(e.id,e.name,e.number,e.colour,i));this.sim=new RaceSimulation(states,replay.laps,replay.seed);','this.setTrack(replay.trackId??DEFAULT_2027_TRACK_ID);const states=entrants.map((e,i)=>createCar(e.id,e.name,e.number,e.colour,i,undefined,this.currentTrackId));this.sim=new RaceSimulation(states,replay.laps,replay.seed,\'CLEAR\',this.currentTrackId,replay.championshipRound);');
cls=cls.replace('car.progress=trackProgress(car.x,car.z);','car.progress=trackProgress(car.x,car.z,this.currentTrackId);');
cls=cls.replace('restart(){if(this.replay){void this.loadReplay(this.replay);}else this.startRace({session:this.sceneMode===\'human\'?\'HUMAN_TEST\':\'QUICK_RACE\',laps:this.sim.laps,entrants:this.sim.state.cars.length,weather:this.weather,seed:this.sim.state.seed});}',"restart(){if(this.replay){void this.loadReplay(this.replay);}else this.startRace({session:this.sceneMode==='human'?'HUMAN_TEST':'QUICK_RACE',laps:this.sim.laps,entrants:this.sim.state.cars.length,weather:this.weather,seed:this.sim.state.seed,trackId:this.currentTrackId,championshipRound:this.sim.state.championshipRound});}");
const roadStart=cls.indexOf('  private makeRoad(){');
const cloudsStart=cls.indexOf('  private makeClouds(){',roadStart);
if(roadStart<0||cloudsStart<0)throw new Error('Circuit world methods not found');
let circuit=cls.slice(roadStart,cloudsStart).replaceAll('this.scene.add(','this.trackGroup.add(');
cls=cls.slice(0,roadStart)+circuit+cls.slice(cloudsStart);
cls=cls.replace('this.scene.add(island);this.makeRoad();this.makeLandscape();this.makeVenue();this.makeClouds();','this.scene.add(island);this.scene.add(this.trackGroup);this.makeRoad();this.makeLandscape();this.makeVenue();this.makeClouds();');
if(!cls.includes('  setTrack(trackId:string)')){
  const marker='  setCamera(m:CameraMode){this.mode=m;}';
  const method="  private tp(t:number){return trackPoint(t,this.currentTrackId)}private tt(t:number){return trackTangent(t,this.currentTrackId)}\n  setTrack(trackId:string){const next=trackId||DEFAULT_2027_TRACK_ID;if(next===this.currentTrackId&&this.trackGroup.children.length)return;this.currentTrackId=next;for(const child of [...this.trackGroup.children]){this.trackGroup.remove(child);child.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry?.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats)m?.dispose();}});}this.makeRoad();this.makeLandscape();this.makeVenue();}\n";
  cls=cls.replace(marker,method+marker);
}
source=source.slice(0,classStart)+cls+source.slice(helperStart);
source=source.replace('function trackProgress(x:number,z:number){let best=0,dist=Infinity;for(let i=0;i<180;i++){const p=trackPoint(i/180),d=(p.x-x)**2+(p.z-z)**2;if(d<dist){dist=d;best=i/180;}}return best;}','function trackProgress(x:number,z:number,trackId:string=DEFAULT_2027_TRACK_ID){let best=0,dist=Infinity;for(let i=0;i<256;i++){const p=trackPoint(i/256,trackId),d=(p.x-x)**2+(p.z-z)**2;if(d<dist){dist=d;best=i/256;}}return best;}');
writeFileSync(path,source);

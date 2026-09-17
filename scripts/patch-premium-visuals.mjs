import { readFile,writeFile } from 'node:fs/promises';

async function patch(path,fn){const before=await readFile(path,'utf8'),after=fn(before);if(after!==before){await writeFile(path,after);console.log(`patched ${path}`)}else console.log(`already current ${path}`)}

await patch('apps/web/src/PremiumCar.ts',s=>s
  .replaceAll('front?.39:.43','front ? .39 : .43')
  .replaceAll('front?.34:.39','front ? .34 : .39')
  .replaceAll('front?.27:.29','front ? .27 : .29')
  .replaceAll('front?.17:.19','front ? .17 : .19')
  .replaceAll('front?.285:.305','front ? .285 : .305')
  .replaceAll('front?.34:.38','front ? .34 : .38')
);

await patch('apps/web/src/GrandPrixScene.ts',s=>{
  if(!s.includes("from './PremiumCar'"))s=s.replace("import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';",`import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';\nimport { buildPremiumFormulaCar } from './PremiumCar';\nimport { decoratePremiumCircuit } from './PremiumCircuit';`);
  s=s.replace("export type CameraMode='broadcast'|'chase'|'cockpit'|'trackside'|'aerial';","export type CameraMode='broadcast'|'chase'|'cockpit'|'tcam'|'trackside'|'aerial'|'neural';");
  s=s.replace("this.resize();this.buildWorld();this.startRace({session:'QUICK_RACE',laps:3,entrants:8,weather:'CLEAR',seed:4127});void this.loadCarAsset();","this.resize();this.buildWorld();this.startRace({session:'QUICK_RACE',laps:3,entrants:8,weather:'CLEAR',seed:4127});");
  s=s.replace("this.makeRoad();this.makeLandscape();this.makeVenue();}","this.makeRoad();this.makeLandscape();this.makeVenue();decoratePremiumCircuit(this.trackGroup,this.currentTrackId,this.lowPower);}");
  s=s.replace("private makeCar(e:Entrant){return this.carTemplate?this.makeImportedCar(e):this.makeFallbackCar(e);}","private makeCar(e:Entrant){return buildPremiumFormulaCar(e,this.lowPower);}");
  if(!s.includes("this.mode==='tcam'"))s=s.replace("}else if(this.mode==='aerial'){this.camera.position.lerp(new THREE.Vector3(targetCar.x+12,62,targetCar.z+14),.028);this.camera.lookAt(target);}","}else if(this.mode==='tcam'){this.camera.position.lerp(target.clone().addScaledVector(forward,-1.05).add(new THREE.Vector3(0,1.28,0)),.26);this.camera.lookAt(target.clone().addScaledVector(forward,40).add(new THREE.Vector3(0,.15,0)));}else if(this.mode==='neural'){const orbit=new THREE.Vector3(Math.sin(t*.7)*2.8,1.85+Math.sin(t*.9)*.25,Math.cos(t*.7)*2.8);this.camera.position.lerp(target.clone().add(orbit).addScaledVector(forward,-4.2),.08);this.camera.lookAt(target.clone().addScaledVector(forward,5));}else if(this.mode==='aerial'){this.camera.position.lerp(new THREE.Vector3(targetCar.x+12,62,targetCar.z+14),.028);this.camera.lookAt(target);}");
  return s;
});

await patch('apps/web/src/ChampionshipApp.tsx',s=>s.replace("(['broadcast','trackside','chase','cockpit','aerial'] as CameraMode[])","(['broadcast','trackside','tcam','chase','cockpit','aerial','neural'] as CameraMode[])"));
await patch('apps/web/src/main.tsx',s=>s.includes("./premium.css")?s:s.replace("import './season.css';","import './season.css';\nimport './premium.css';"));

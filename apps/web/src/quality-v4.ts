import * as THREE from 'three';
import type { RaceConfig,ReplayFile,RaceState } from '@agp/shared';
import { FlyGrandPrixScene,type CameraMode } from './FlyGrandPrixScene';
import { GrandPrixScene,type Entrant } from './GrandPrixScene';

type RuntimeScene={
  el:HTMLElement;
  renderer:THREE.WebGLRenderer;
  camera:THREE.PerspectiveCamera;
  sim?:{state:RaceState};
  cars:Map<string,THREE.Group>;
  focusId:string;
  mode:CameraMode;
  lowPower:boolean;
  currentTrackId:string;
  clouds:THREE.Group[];
  __v4QualityApplied?:boolean;
  __v4CameraKey?:string;
};

type FlyPrototype={
  startRace:(this:RuntimeScene,config:RaceConfig)=>void;
  loadReplay:(this:RuntimeScene,replay:ReplayFile)=>Promise<void>;
  updateCamera:(this:RuntimeScene,t:number)=>void;
};

type BasePrototype={
  makeImportedCar:(this:RuntimeScene,e:Entrant)=>THREE.Group;
  makeLogoTexture:(this:RuntimeScene,e:Entrant)=>THREE.CanvasTexture;
  makeNumberTexture:(this:RuntimeScene,e:Entrant)=>THREE.CanvasTexture;
};

const isPhone=()=>matchMedia('(max-width: 760px)').matches;
const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
// Desktop keeps the premium renderer. Phones need either a modern six-core CPU or high DPR;
// recent iPhones satisfy both while older devices retain the balanced tier.
const capable=()=>!reduceMotion()&&(!isPhone()||(navigator.hardwareConcurrency??8)>=6||devicePixelRatio>=2.5);

const teamCodes:Record<string,string>={
  'McLARVAE RACING':'MLR','MERCED-EYES':'MCE','RED BUG RACING':'RBR','SCUDERIA FLYRRARI':'SFR','WINGLIAMS RACING':'WGR','RACING BUGS':'RGB','ASTON MIDGE':'AMG','HAASFLY':'HFL','AUD-EYE SPORT':'AES','FLYPINE':'FLP','CADDIS-LAC RACING':'CLR'
};

function rebuildRenderer(s:RuntimeScene){
  const old=s.renderer;
  const size={w:Math.max(1,s.el.clientWidth),h:Math.max(1,s.el.clientHeight)};
  const high=capable();
  if(high&&!old.getContext().getContextAttributes()?.antialias){
    const next=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    next.outputColorSpace=THREE.SRGBColorSpace;
    next.toneMapping=THREE.ACESFilmicToneMapping;
    next.toneMappingExposure=old.toneMappingExposure||1.12;
    next.shadowMap.enabled=true;
    next.shadowMap.type=THREE.PCFSoftShadowMap;
    next.setPixelRatio(Math.min(devicePixelRatio,isPhone()?1.65:1.85));
    next.setSize(size.w,size.h,false);
    old.domElement.replaceWith(next.domElement);
    s.renderer=next;
    old.dispose();
  }else{
    old.setPixelRatio(Math.min(devicePixelRatio,high?(isPhone()?1.65:1.85):1.2));
    old.shadowMap.enabled=high;
    old.shadowMap.type=THREE.PCFSoftShadowMap;
    old.setSize(size.w,size.h,false);
  }
}

function applyQuality(s:RuntimeScene){
  if(s.__v4QualityApplied)return;
  s.__v4QualityApplied=true;
  const high=capable();
  s.lowPower=!high;
  rebuildRenderer(s);
  s.camera.fov=isPhone()?37:39;
  s.camera.near=.1;s.camera.far=1200;s.camera.updateProjectionMatrix();
  s.currentTrackId='__experience_v4_rebuild__';
  document.documentElement.dataset.agpVisual=high?'premium':'balanced';
}

function cleanScene(s:RuntimeScene){
  if(isPhone())for(const cloud of s.clouds??[])cloud.visible=false;
  for(const car of s.cars.values()){
    for(const child of [...car.children])if(child instanceof THREE.Sprite)car.remove(child);
    car.traverse(object=>{
      if(!(object instanceof THREE.Mesh))return;
      object.castShadow=capable();object.receiveShadow=true;
      const mats=Array.isArray(object.material)?object.material:[object.material];
      for(const material of mats){
        if(material instanceof THREE.MeshStandardMaterial){
          material.envMapIntensity=Math.max(material.envMapIntensity??1,1.25);
          if(/body|paint|accent/i.test(material.name))material.roughness=Math.min(material.roughness,.28);
        }
      }
    });
  }
}

const base=GrandPrixScene.prototype as unknown as BasePrototype;

// Replace the generic black AI badge with a transparent motorsport lock-up. The constructor
// is the primary identity on the car; driver number is secondary and stays legible in motion.
base.makeLogoTexture=function v4TeamDecal(e:Entrant){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=192;const c=canvas.getContext('2d')!,code=teamCodes[e.provider]??e.provider.slice(0,3).toUpperCase();
  c.clearRect(0,0,canvas.width,canvas.height);
  c.save();c.translate(78,96);c.strokeStyle=e.accent;c.fillStyle=e.accent;c.lineWidth=12;c.lineCap='round';c.lineJoin='round';
  // Abstract wing/insect intelligence glyph; the team-specific colours and code turn it into
  // a coherent constructor badge without borrowing a real racing marque.
  c.beginPath();c.moveTo(-48,18);c.quadraticCurveTo(-22,-38,0,-5);c.quadraticCurveTo(22,-38,48,18);c.quadraticCurveTo(20,6,0,35);c.quadraticCurveTo(-20,6,-48,18);c.stroke();
  c.beginPath();c.moveTo(0,-38);c.lineTo(0,44);c.stroke();c.fillStyle=e.secondary;c.beginPath();c.arc(0,-38,9,0,Math.PI*2);c.fill();c.restore();
  c.fillStyle=e.secondary;c.font='900 69px Arial, sans-serif';c.textAlign='left';c.textBaseline='middle';c.fillText(code,158,78);
  c.fillStyle=e.accent;c.font='700 25px Arial, sans-serif';c.letterSpacing='4px';c.fillText(`#${String(e.number).padStart(2,'0')}  ${e.name.toUpperCase()}`,162,135);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());return texture;
};

base.makeNumberTexture=function v4NumberDecal(e:Entrant){
  const canvas=document.createElement('canvas');canvas.width=320;canvas.height=220;const c=canvas.getContext('2d')!;c.clearRect(0,0,320,220);
  c.strokeStyle=e.accent;c.lineWidth=8;c.beginPath();c.moveTo(36,184);c.lineTo(284,184);c.stroke();
  c.fillStyle=e.secondary;c.font='italic 900 150px Arial, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(String(e.number),160,105);
  c.fillStyle=e.accent;c.font='800 18px Arial, sans-serif';c.letterSpacing='5px';c.fillText(teamCodes[e.provider]??'AGP',160,203);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());return texture;
};

const originalImported=base.makeImportedCar;
base.makeImportedCar=function premiumImportedCar(e:Entrant){
  const car=originalImported.call(this,e);
  car.scale.setScalar(.91);
  for(const child of [...car.children])if(child instanceof THREE.Sprite)car.remove(child);
  car.userData.model='AGP-01-V4';
  car.traverse(object=>{
    if(!(object instanceof THREE.Mesh))return;
    const mats=Array.isArray(object.material)?object.material:[object.material];
    for(const material of mats){
      if(!(material instanceof THREE.MeshStandardMaterial))continue;
      material.envMapIntensity=1.35;
      if(/Body/i.test(material.name)){material.metalness=.36;material.roughness=.18;}
      if(/Carbon/i.test(material.name)){material.metalness=.62;material.roughness=.3;}
      if(/Rubber/i.test(material.name)){material.metalness=.02;material.roughness=.86;}
    }
  });
  return car;
};

const proto=FlyGrandPrixScene.prototype as unknown as FlyPrototype;
const originalStartRace=proto.startRace;
const originalLoadReplay=proto.loadReplay;
const originalUpdateCamera=proto.updateCamera;

proto.startRace=function startRaceV4(config:RaceConfig){applyQuality(this);originalStartRace.call(this,config);cleanScene(this);};
proto.loadReplay=async function loadReplayV4(replay:ReplayFile){applyQuality(this);await originalLoadReplay.call(this,replay);cleanScene(this);};

/** Story-following broadcast camera: the car stays large enough to read, cuts happen on a
 * clear story boundary, and there are no long cross-circuit pans through empty sky. */
proto.updateCamera=function updateCameraV4(t:number){
  const state=this.sim?.state;
  const targetCar=state?.cars.find(car=>car.id===this.focusId)??state?.cars.slice().sort((a,b)=>a.position-b.position)[0];
  if(!state||!targetCar||!['broadcast','trackside'].includes(this.mode)){originalUpdateCamera.call(this,t);return;}
  const target=new THREE.Vector3(targetCar.x,1.0,targetCar.z),forward=new THREE.Vector3(Math.sin(targetCar.yaw),0,Math.cos(targetCar.yaw)).normalize(),side=new THREE.Vector3(forward.z,0,-forward.x),phone=isPhone(),story=Math.floor(state.time/9)%4;
  let desired:THREE.Vector3,look:THREE.Vector3,fov:number;
  if(this.mode==='trackside'){
    const sign=Math.sin((targetCar.progress+.07)*31)>0?1:-1;desired=target.clone().addScaledVector(side,(phone?10.5:12.5)*sign).addScaledVector(forward,phone?2:3).add(new THREE.Vector3(0,phone?2.7:3.3,0));look=target.clone().addScaledVector(forward,6).add(new THREE.Vector3(0,.22,0));fov=phone?34:31;
  }else if(story===0){desired=target.clone().addScaledVector(forward,phone?-12.5:-15).addScaledVector(side,phone?5.5:7).add(new THREE.Vector3(0,phone?3:3.6,0));look=target.clone().addScaledVector(forward,9).add(new THREE.Vector3(0,.28,0));fov=phone?36:33;
  }else if(story===1){desired=target.clone().addScaledVector(forward,phone?8:10).addScaledVector(side,phone?-9:-12).add(new THREE.Vector3(0,phone?2.6:3.1,0));look=target.clone().addScaledVector(forward,3).add(new THREE.Vector3(0,.2,0));fov=phone?32:29;
  }else if(story===2){desired=target.clone().addScaledVector(forward,phone?-18:-22).addScaledVector(side,phone?-2.5:-4).add(new THREE.Vector3(0,phone?5:6.3,0));look=target.clone().addScaledVector(forward,12).add(new THREE.Vector3(0,.3,0));fov=phone?38:35;
  }else{desired=target.clone().addScaledVector(side,phone?10:13).addScaledVector(forward,-2).add(new THREE.Vector3(0,phone?3.1:3.7,0));look=target.clone().addScaledVector(forward,5).add(new THREE.Vector3(0,.18,0));fov=phone?34:31;}
  const key=`${this.focusId}:${this.mode}:${story}`;if(this.__v4CameraKey!==key){this.camera.position.copy(desired);this.__v4CameraKey=key;}else this.camera.position.lerp(desired,.075);
  this.camera.fov=THREE.MathUtils.lerp(this.camera.fov,fov,.075);this.camera.updateProjectionMatrix();this.camera.lookAt(look);
};

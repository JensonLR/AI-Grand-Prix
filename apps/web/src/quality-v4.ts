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

type BasePrototype={makeImportedCar:(this:RuntimeScene,e:Entrant)=>THREE.Group};

const isPhone=()=>matchMedia('(max-width: 760px)').matches;
const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const capable=()=>!reduceMotion()&&((navigator.hardwareConcurrency??8)>=6||devicePixelRatio>=2.5);

function rebuildRenderer(s:RuntimeScene){
  const old=s.renderer;
  const size={w:Math.max(1,s.el.clientWidth),h:Math.max(1,s.el.clientHeight)};
  const high=capable();
  // Antialiasing is fixed when a WebGL context is created. The old mobile renderer was
  // born with AA disabled, so merely changing CSS/DPR could never make it look premium.
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
  // Force the next setTrack() to rebuild world/circuit geometry using the new quality tier.
  s.currentTrackId='__experience_v4_rebuild__';
  document.documentElement.dataset.agpVisual=high?'premium':'balanced';
}

function cleanScene(s:RuntimeScene){
  // Giant low-poly cloud blobs looked toy-like on phones. A clean atmospheric sky reads
  // far better and costs less GPU time, leaving budget for cars, circuit and antialiasing.
  if(isPhone())for(const cloud of s.clouds??[])cloud.visible=false;
  for(const car of s.cars.values()){
    // Floating 3D name labels made a full grid unreadable. Identity now belongs to the TV HUD.
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

// Give the approved imported chassis a stronger race-distance presence and cleaner materials.
const base=GrandPrixScene.prototype as unknown as BasePrototype;
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

proto.startRace=function startRaceV4(config:RaceConfig){
  applyQuality(this);
  originalStartRace.call(this,config);
  cleanScene(this);
};

proto.loadReplay=async function loadReplayV4(replay:ReplayFile){
  applyQuality(this);
  await originalLoadReplay.call(this,replay);
  cleanScene(this);
};

/**
 * Mobile-first broadcast camera. The previous default camera sat at fixed circuit markers
 * and merely looked at whichever car the director selected; on a phone that often meant a
 * tiny car, acres of sky and abrupt cross-circuit pans. This camera travels with the story.
 */
proto.updateCamera=function updateCameraV4(t:number){
  const state=this.sim?.state;
  const targetCar=state?.cars.find(car=>car.id===this.focusId)??state?.cars.slice().sort((a,b)=>a.position-b.position)[0];
  if(!state||!targetCar||!['broadcast','trackside'].includes(this.mode)){
    originalUpdateCamera.call(this,t);return;
  }

  const target=new THREE.Vector3(targetCar.x,1.0,targetCar.z);
  const forward=new THREE.Vector3(Math.sin(targetCar.yaw),0,Math.cos(targetCar.yaw)).normalize();
  const side=new THREE.Vector3(forward.z,0,-forward.x);
  const phone=isPhone();
  const story=Math.floor(state.time/9)%4;
  let desired:THREE.Vector3,look:THREE.Vector3,fov:number;

  if(this.mode==='trackside'){
    const sign=Math.sin((targetCar.progress+.07)*31)>0?1:-1;
    desired=target.clone().addScaledVector(side,(phone?10.5:12.5)*sign).addScaledVector(forward,phone?2:3).add(new THREE.Vector3(0,phone?2.7:3.3,0));
    look=target.clone().addScaledVector(forward,6).add(new THREE.Vector3(0,.22,0));
    fov=phone?34:31;
  }else if(story===0){
    desired=target.clone().addScaledVector(forward,phone?-12.5:-15).addScaledVector(side,phone?5.5:7).add(new THREE.Vector3(0,phone?3.0:3.6,0));
    look=target.clone().addScaledVector(forward,9).add(new THREE.Vector3(0,.28,0));fov=phone?36:33;
  }else if(story===1){
    desired=target.clone().addScaledVector(forward,phone?8:10).addScaledVector(side,phone?-9:-12).add(new THREE.Vector3(0,phone?2.6:3.1,0));
    look=target.clone().addScaledVector(forward,3).add(new THREE.Vector3(0,.2,0));fov=phone?32:29;
  }else if(story===2){
    desired=target.clone().addScaledVector(forward,phone?-18:-22).addScaledVector(side,phone?-2.5:-4).add(new THREE.Vector3(0,phone?5:6.3,0));
    look=target.clone().addScaledVector(forward,12).add(new THREE.Vector3(0,.3,0));fov=phone?38:35;
  }else{
    desired=target.clone().addScaledVector(side,phone?10:13).addScaledVector(forward,-2).add(new THREE.Vector3(0,phone?3.1:3.7,0));
    look=target.clone().addScaledVector(forward,5).add(new THREE.Vector3(0,.18,0));fov=phone?34:31;
  }

  const key=`${this.focusId}:${this.mode}:${story}`;
  if(this.__v4CameraKey!==key){this.camera.position.copy(desired);this.__v4CameraKey=key;}
  else this.camera.position.lerp(desired,.075);
  this.camera.fov=THREE.MathUtils.lerp(this.camera.fov,fov,.075);this.camera.updateProjectionMatrix();
  this.camera.lookAt(look);
};

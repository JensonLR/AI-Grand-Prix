import * as THREE from 'three';
import { getTrackDefinition,trackPoint } from '@agp/sim-core';

type WorldKind='desert'|'city'|'park'|'mountain'|'circuit';
const DESERT=new Set(['bh-2002','sa-2021','qa-2004','ae-2009']);
const CITY=new Set(['mc-1929','az-2016','sg-2008','us-2023','es-2026','us-2022']);
const PARK=new Set(['au-1953','ca-1978','it-1922','br-1940','gb-1948']);
const MOUNTAIN=new Set(['pt-2008','at-1969','be-1925','tr-2005']);
const seeded=(seed:number)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const hash=(s:string)=>{let h=2166136261>>>0;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h>>>0;};

export interface PremiumWorldResult{water:THREE.Mesh|null;kind:WorldKind;}

function kindFor(id:string):WorldKind{if(DESERT.has(id))return'desert';if(CITY.has(id))return'city';if(PARK.has(id))return'park';if(MOUNTAIN.has(id))return'mountain';return'circuit';}

export function buildPremiumWorld(group:THREE.Group,scene:THREE.Scene,trackId:string,lowPower=false):PremiumWorldResult{
  const track=getTrackDefinition(trackId),kind=kindFor(trackId),rand=seeded(hash(trackId)),pts=Array.from({length:80},(_,i)=>trackPoint(i/80,trackId));
  const minX=Math.min(...pts.map(p=>p.x)),maxX=Math.max(...pts.map(p=>p.x)),minZ=Math.min(...pts.map(p=>p.z)),maxZ=Math.max(...pts.map(p=>p.z)),cx=(minX+maxX)/2,cz=(minZ+maxZ)/2,span=Math.max(maxX-minX,maxZ-minZ),radius=Math.max(280,span*1.65);
  const palette={
    desert:{sky:'#7f9fb8',ground:'#b59462',far:'#8b724f'},city:{sky:'#61758c',ground:'#42484b',far:'#252b31'},park:{sky:'#7699b8',ground:'#4f6845',far:'#314632'},mountain:{sky:'#7695af',ground:'#4d6045',far:'#304132'},circuit:{sky:'#7798b7',ground:'#67705e',far:'#414b40'}
  }[kind];
  scene.background=new THREE.Color(palette.sky);
  const ground=new THREE.Mesh(new THREE.CircleGeometry(radius,lowPower?48:96),new THREE.MeshStandardMaterial({color:palette.ground,roughness:.96,metalness:.01}));ground.rotation.x=-Math.PI/2;ground.position.set(cx,-.16,cz);ground.receiveShadow=!lowPower;group.add(ground);
  const farGround=new THREE.Mesh(new THREE.RingGeometry(radius*.72,radius*1.22,lowPower?40:72),new THREE.MeshStandardMaterial({color:palette.far,roughness:1}));farGround.rotation.x=-Math.PI/2;farGround.position.set(cx,-.2,cz);group.add(farGround);
  let water:THREE.Mesh|null=null;

  if(kind==='desert'){
    const dunes=new THREE.InstancedMesh(new THREE.ConeGeometry(18,8,lowPower?8:12),new THREE.MeshStandardMaterial({color:'#a88759',roughness:1}),lowPower?18:36),d=new THREE.Object3D();
    for(let i=0;i<dunes.count;i++){const a=rand()*Math.PI*2,r=span*.7+rand()*span*.65;d.position.set(cx+Math.cos(a)*r,-1.3,cz+Math.sin(a)*r);d.scale.set(.7+rand()*1.8,.5+rand()*.9,.7+rand()*1.8);d.rotation.y=rand()*Math.PI;d.updateMatrix();dunes.setMatrixAt(i,d.matrix);}group.add(dunes);
    const lights=new THREE.InstancedMesh(new THREE.CylinderGeometry(.05,.09,10,6),new THREE.MeshStandardMaterial({color:'#3b4145',metalness:.7,roughness:.35}),lowPower?20:42);for(let i=0;i<lights.count;i++){const p=pts[(i*7)%pts.length];d.position.set(p.x+(rand()>.5?1:-1)*(15+rand()*10),5,p.z+(rand()-.5)*5);d.scale.set(1,1,1);d.rotation.set(0,0,0);d.updateMatrix();lights.setMatrixAt(i,d.matrix);}group.add(lights);
  }

  if(kind==='city'){
    const count=lowPower?34:72,geo=new THREE.BoxGeometry(1,1,1),mat=new THREE.MeshStandardMaterial({color:trackId==='us-2023'?'#31313d':'#39414a',roughness:.7,metalness:.14}),skyline=new THREE.InstancedMesh(geo,mat,count),d=new THREE.Object3D();
    for(let i=0;i<count;i++){const a=(i/count)*Math.PI*2+rand()*.12,r=span*.82+rand()*span*.55,h=8+rand()*(trackId==='sg-2008'||trackId==='us-2023'?46:30);d.position.set(cx+Math.cos(a)*r,h/2-.1,cz+Math.sin(a)*r);d.scale.set(6+rand()*13,h,6+rand()*13);d.rotation.y=rand()*.6;d.updateMatrix();skyline.setMatrixAt(i,d.matrix);}group.add(skyline);
    if(['mc-1929','sg-2008','us-2022'].includes(trackId)){
      water=new THREE.Mesh(new THREE.PlaneGeometry(radius*.9,radius*1.8),new THREE.MeshPhysicalMaterial({color:'#0b5f80',roughness:.12,metalness:.24,clearcoat:.65,clearcoatRoughness:.18}));water.rotation.x=-Math.PI/2;water.rotation.z=.18;water.position.set(cx+radius*.55,-.35,cz);group.add(water);
    }
  }

  if(kind==='park'||kind==='mountain'||kind==='circuit'){
    const treeCount=lowPower?45:100,trunk=new THREE.MeshStandardMaterial({color:'#49392a',roughness:1}),leaf=new THREE.MeshStandardMaterial({color:kind==='mountain'?'#28432c':'#355b36',roughness:.95}),d=new THREE.Object3D(),trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.16,.24,2.6,5),trunk,treeCount),tops=new THREE.InstancedMesh(new THREE.ConeGeometry(1.5,4.2,7),leaf,treeCount);
    for(let i=0;i<treeCount;i++){const a=rand()*Math.PI*2,r=span*.64+rand()*span*.8,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r,s=.7+rand()*1.5;d.position.set(x,1.3*s,z);d.scale.set(s,s,s);d.rotation.y=rand()*Math.PI;d.updateMatrix();trunks.setMatrixAt(i,d.matrix);d.position.y=4.0*s;d.updateMatrix();tops.setMatrixAt(i,d.matrix);}group.add(trunks,tops);
    if(kind==='mountain'){
      const hills=new THREE.InstancedMesh(new THREE.ConeGeometry(28,22,12),new THREE.MeshStandardMaterial({color:'#3b4b38',roughness:1}),lowPower?12:24);for(let i=0;i<hills.count;i++){const a=rand()*Math.PI*2,r=span*1.0+rand()*span*.6;d.position.set(cx+Math.cos(a)*r,3,cz+Math.sin(a)*r);d.scale.set(.8+rand()*1.8,.6+rand()*1.6,.8+rand()*1.8);d.rotation.y=rand()*Math.PI;d.updateMatrix();hills.setMatrixAt(i,d.matrix);}group.add(hills);
    }
  }

  // Venue plaque is generated from metadata so the world always says which championship circuit is loaded.
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const c=canvas.getContext('2d')!;c.fillStyle='#050708';c.fillRect(0,0,1024,256);c.fillStyle='#d7a647';c.fillRect(0,0,20,256);c.fillStyle='#f4e8ce';c.font='900 72px Arial Black,Arial';c.fillText(track.venue.toUpperCase(),58,105);c.fillStyle='#9ca8b4';c.font='600 32px Arial';c.fillText(`ROUND ${String(track.round).padStart(2,'0')} · ${track.country.toUpperCase()} · 2027`,60,174);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const p=trackPoint(.03,trackId),sign=new THREE.Mesh(new THREE.PlaneGeometry(22,5.5),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));sign.position.set(p.x+18,4,p.z+18);sign.rotation.y=-.65;group.add(sign);
  group.userData.world={trackId,kind,venue:track.venue};
  return{water,kind};
}

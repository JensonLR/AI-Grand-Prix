import * as THREE from 'three';
import { getTrackDefinition,trackPoint } from '@agp/sim-core';

type WorldKind='desert'|'city'|'park'|'mountain'|'circuit';
const DESERT=new Set(['bh-2002','sa-2021','qa-2004','ae-2009']);
const CITY=new Set(['mc-1929','az-2016','sg-2008','us-2023','es-2026','us-2022']);
const PARK=new Set(['au-1953','ca-1978','it-1922','br-1940','gb-1948']);
const MOUNTAIN=new Set(['pt-2008','at-1969','be-1925','tr-2005']);
const seeded=(seed:number)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const hash=(s:string)=>{let h=2166136261>>>0;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h>>>0;};

type VenueProfile={tone:string;accent:string;feature:'flood'|'waterfront'|'park'|'forest'|'metro'|'stadium'|'harbour'|'hills'|'airfield'|'alpine'|'boulevard';};
const VENUE:Record<string,VenueProfile>={
'bh-2002':{tone:'#b89b67',accent:'#f0c86a',feature:'flood'},'sa-2021':{tone:'#77756c',accent:'#6edcff',feature:'waterfront'},
'au-1953':{tone:'#426b4a',accent:'#d9e7c5',feature:'park'},'jp-1962':{tone:'#31543b',accent:'#e7e4dc',feature:'forest'},
'cn-2004':{tone:'#535b61',accent:'#d74a4a',feature:'metro'},'us-2022':{tone:'#506c5b',accent:'#ef87b5',feature:'stadium'},
'ca-1978':{tone:'#3f6748',accent:'#d7e7db',feature:'waterfront'},'mc-1929':{tone:'#8d8b82',accent:'#5fc6e8',feature:'harbour'},
'pt-2008':{tone:'#8b7954',accent:'#e3c06b',feature:'hills'},'gb-1948':{tone:'#52614b',accent:'#b8c5ce',feature:'airfield'},
'at-1969':{tone:'#476047',accent:'#d8e1d4',feature:'alpine'},'be-1925':{tone:'#2f5138',accent:'#c9d6c7',feature:'forest'},
'hu-1986':{tone:'#6d704e',accent:'#d9bd65',feature:'hills'},'it-1922':{tone:'#35593d',accent:'#d8e2d4',feature:'forest'},
'es-2026':{tone:'#69625a',accent:'#e2b94d',feature:'metro'},'az-2016':{tone:'#7a756d',accent:'#62b9d5',feature:'boulevard'},
'tr-2005':{tone:'#667052',accent:'#d0c17c',feature:'hills'},'sg-2008':{tone:'#3d4c58',accent:'#8ee9e0',feature:'boulevard'},
'us-2012':{tone:'#826c50',accent:'#e0584d',feature:'hills'},'mx-1962':{tone:'#6b6859',accent:'#63b58d',feature:'stadium'},
'br-1940':{tone:'#486147',accent:'#e1c85c',feature:'stadium'},'us-2023':{tone:'#393846',accent:'#ef5ac8',feature:'boulevard'},
'qa-2004':{tone:'#aa956f',accent:'#c9e5ff',feature:'flood'},'ae-2009':{tone:'#a9946d',accent:'#63cfe0',feature:'harbour'}
};
export interface PremiumWorldResult{water:THREE.Mesh|null;kind:WorldKind;}
function kindFor(id:string):WorldKind{if(DESERT.has(id))return'desert';if(CITY.has(id))return'city';if(PARK.has(id))return'park';if(MOUNTAIN.has(id))return'mountain';return'circuit';}

function terrainTexture(kind:WorldKind,seed:number){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const c=canvas.getContext('2d')!,rng=seeded(seed);
  const base=kind==='desert'?'#bda77b':kind==='park'?'#52684b':kind==='mountain'?'#52604b':kind==='city'?'#4b5153':'#646b5a';c.fillStyle=base;c.fillRect(0,0,512,512);
  // Fine deterministic material variation avoids the featureless flat-colour ground that
  // made the old world look like an untextured prototype.
  for(let i=0;i<6500;i++){
    const a=.015+rng()*.055,v=kind==='desert'?(rng()>.5?'255,241,207':'104,83,55'):(rng()>.5?'220,225,208':'30,39,31');c.fillStyle=`rgba(${v},${a})`;const s=.6+rng()*2.2;c.fillRect(rng()*512,rng()*512,s,s);
  }
  if(kind==='desert')for(let i=0;i<34;i++){c.strokeStyle=`rgba(255,238,198,${.018+rng()*.035})`;c.lineWidth=.7+rng()*1.4;c.beginPath();const y=rng()*512;c.moveTo(-30,y);c.bezierCurveTo(130,y+20-rng()*40,330,y-20+rng()*40,550,y+10-rng()*20);c.stroke();}
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(14,14);tex.anisotropy=4;return tex;
}

function skyDome(kind:WorldKind,radius:number,cx:number,cz:number){
  const colours=kind==='desert'?['#6f93b0','#a7c4d8','#eed7a8']:kind==='city'?['#526a80','#8da8bb','#c5c0ad']:['#668aaa','#9eb9ce','#d8cfac'];
  const material=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color(colours[0])},mid:{value:new THREE.Color(colours[1])},horizon:{value:new THREE.Color(colours[2])}},vertexShader:`varying vec3 vPos;void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`uniform vec3 top;uniform vec3 mid;uniform vec3 horizon;varying vec3 vPos;void main(){float h=clamp(normalize(vPos).y,0.0,1.0);vec3 low=mix(horizon,mid,smoothstep(0.0,.20,h));vec3 col=mix(low,top,smoothstep(.22,.85,h));gl_FragColor=vec4(col,1.0);}`});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(radius*1.17,40,18),material);dome.position.set(cx,-radius*.10,cz);dome.renderOrder=-20;return dome;
}

function venuePlaque(trackId:string){
  const track=getTrackDefinition(trackId),canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const c=canvas.getContext('2d')!;
  const g=c.createLinearGradient(0,0,1024,0);g.addColorStop(0,'#05080b');g.addColorStop(1,'#12202a');c.fillStyle=g;c.fillRect(0,0,1024,256);c.fillStyle='#dcb052';c.fillRect(0,0,14,256);c.fillStyle='#f4efe5';c.font='800 66px Arial, sans-serif';c.fillText(track.venue.toUpperCase(),50,104);c.fillStyle='#94a0aa';c.font='600 29px Arial, sans-serif';c.fillText(`ROUND ${String(track.round).padStart(2,'0')}  ·  ${track.country.toUpperCase()}  ·  2027`,52,174);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

export function buildPremiumWorld(group:THREE.Group,scene:THREE.Scene,trackId:string,lowPower=false):PremiumWorldResult{
  const track=getTrackDefinition(trackId),kind=kindFor(trackId),rand=seeded(hash(trackId)),pts=Array.from({length:96},(_,i)=>trackPoint(i/96,trackId));
  const minX=Math.min(...pts.map(p=>p.x)),maxX=Math.max(...pts.map(p=>p.x)),minZ=Math.min(...pts.map(p=>p.z)),maxZ=Math.max(...pts.map(p=>p.z)),cx=(minX+maxX)/2,cz=(minZ+maxZ)/2,span=Math.max(maxX-minX,maxZ-minZ),radius=Math.max(300,span*1.75),seed=hash(trackId);
  const groundColours={desert:'#b8a174',city:'#454c4f',park:'#526a4a',mountain:'#505f49',circuit:'#626b59'} as const;
  scene.background=new THREE.Color(kind==='desert'?'#9bb8cc':'#7f9db6');
  group.add(skyDome(kind,radius,cx,cz));

  const groundMat=new THREE.MeshStandardMaterial({map:terrainTexture(kind,seed),color:groundColours[kind],roughness:.96,metalness:.005});
  const ground=new THREE.Mesh(new THREE.CircleGeometry(radius,lowPower?64:112),groundMat);ground.rotation.x=-Math.PI/2;ground.position.set(cx,-.17,cz);ground.receiveShadow=true;group.add(ground);
  const far=new THREE.Mesh(new THREE.RingGeometry(radius*.88,radius*1.30,lowPower?56:96),new THREE.MeshStandardMaterial({color:kind==='desert'?'#8b7656':'#3f4a3d',roughness:1}));far.rotation.x=-Math.PI/2;far.position.set(cx,-.21,cz);group.add(far);
  let water:THREE.Mesh|null=null;

  if(kind==='desert'){
    // Broad, softened dune forms live at the horizon. The previous cone geometry was visibly
    // artificial from broadcast cameras.
    const duneMat=new THREE.MeshStandardMaterial({color:'#aa9065',roughness:1}),duneGeo=new THREE.SphereGeometry(1,lowPower?12:18,lowPower?7:10),count=lowPower?14:26,dunes=new THREE.InstancedMesh(duneGeo,duneMat,count),d=new THREE.Object3D();
    for(let i=0;i<count;i++){
      const a=rand()*Math.PI*2,r=span*.86+rand()*span*.72,w=17+rand()*35,h=4+rand()*8;d.position.set(cx+Math.cos(a)*r,-h*.44,cz+Math.sin(a)*r);d.scale.set(w,h,w*(.72+rand()*.45));d.rotation.y=rand()*Math.PI;d.updateMatrix();dunes.setMatrixAt(i,d.matrix);
    }
    dunes.receiveShadow=true;group.add(dunes);
    // Sparse floodlights create believable circuit scale without cluttering every shot.
    const lightCount=lowPower?10:20,poleGeo=new THREE.CylinderGeometry(.045,.075,10,7),poleMat=new THREE.MeshStandardMaterial({color:'#465159',metalness:.74,roughness:.3}),poles=new THREE.InstancedMesh(poleGeo,poleMat,lightCount),dummy=new THREE.Object3D();
    for(let i=0;i<lightCount;i++){const p=pts[(i*9)%pts.length],sign=i%2?1:-1;dummy.position.set(p.x+sign*(18+rand()*9),5,p.z+(rand()-.5)*8);dummy.scale.set(1,1,1);dummy.rotation.set(0,0,0);dummy.updateMatrix();poles.setMatrixAt(i,dummy.matrix);}group.add(poles);
  }

  if(kind==='city'){
    const count=lowPower?30:58,geo=new THREE.BoxGeometry(1,1,1),mat=new THREE.MeshStandardMaterial({color:trackId==='us-2023'?'#30333b':'#3c454d',roughness:.6,metalness:.16}),skyline=new THREE.InstancedMesh(geo,mat,count),d=new THREE.Object3D();
    for(let i=0;i<count;i++){const a=(i/count)*Math.PI*2+rand()*.1,r=span*.90+rand()*span*.58,h=9+rand()*(trackId==='sg-2008'||trackId==='us-2023'?42:28);d.position.set(cx+Math.cos(a)*r,h/2-.1,cz+Math.sin(a)*r);d.scale.set(5+rand()*12,h,5+rand()*12);d.rotation.y=rand()*.55;d.updateMatrix();skyline.setMatrixAt(i,d.matrix);}group.add(skyline);
    if(['mc-1929','sg-2008','us-2022'].includes(trackId)){water=new THREE.Mesh(new THREE.PlaneGeometry(radius*.9,radius*1.8),new THREE.MeshPhysicalMaterial({color:'#0c6686',roughness:.16,metalness:.24,clearcoat:.55,clearcoatRoughness:.2}));water.rotation.x=-Math.PI/2;water.rotation.z=.18;water.position.set(cx+radius*.55,-.35,cz);group.add(water);}
  }

  if(kind==='park'||kind==='mountain'||kind==='circuit'){
    const treeCount=lowPower?34:76,trunk=new THREE.MeshStandardMaterial({color:'#4a3829',roughness:1}),leaf=new THREE.MeshStandardMaterial({color:kind==='mountain'?'#29472e':'#365d3a',roughness:.96}),d=new THREE.Object3D(),trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.13,.22,2.5,6),trunk,treeCount),tops=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),leaf,treeCount);
    for(let i=0;i<treeCount;i++){const a=rand()*Math.PI*2,r=span*.68+rand()*span*.83,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r,s=.65+rand()*1.4;d.position.set(x,1.25*s,z);d.scale.set(s,s,s);d.rotation.y=rand()*Math.PI;d.updateMatrix();trunks.setMatrixAt(i,d.matrix);d.position.y=3.6*s;d.scale.set(1.45*s,2.0*s,1.45*s);d.updateMatrix();tops.setMatrixAt(i,d.matrix);}group.add(trunks,tops);
    if(kind==='mountain'){
      const hillCount=lowPower?9:17,hills=new THREE.InstancedMesh(new THREE.SphereGeometry(1,12,7),new THREE.MeshStandardMaterial({color:'#40513d',roughness:1}),hillCount);
      for(let i=0;i<hillCount;i++){const a=rand()*Math.PI*2,r=span*1.06+rand()*span*.68,w=25+rand()*28,h=12+rand()*19;d.position.set(cx+Math.cos(a)*r,-h*.30,cz+Math.sin(a)*r);d.scale.set(w,h,w);d.rotation.y=rand()*Math.PI;d.updateMatrix();hills.setMatrixAt(i,d.matrix);}group.add(hills);
    }
  }

  // V8 venue fingerprint: every championship stop gets a distinct architectural read.
  const profile=VENUE[trackId]??{tone:'#596255',accent:'#d7a647',feature:'park' as const};
  const landmarkMat=new THREE.MeshStandardMaterial({color:profile.tone,roughness:.62,metalness:.12}),glow=new THREE.MeshStandardMaterial({color:profile.accent,emissive:profile.accent,emissiveIntensity:.35,roughness:.35});
  const lp=trackPoint(.34,trackId),landmark=new THREE.Group();landmark.position.set(lp.x+span*.30,0,lp.z+span*.24);group.add(landmark);
  const tower=(x:number,z:number,h:number,w:number)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,w),landmarkMat);m.position.set(x,h/2,z);landmark.add(m);const crown=new THREE.Mesh(new THREE.BoxGeometry(w*1.15,.35,w*1.15),glow);crown.position.set(x,h,z);landmark.add(crown);};
  if(profile.feature==='stadium'){for(let i=0;i<10;i++){const a=i/10*Math.PI*2,m=new THREE.Mesh(new THREE.BoxGeometry(8,5,16),landmarkMat);m.position.set(Math.cos(a)*24,2.5,Math.sin(a)*24);m.rotation.y=-a;landmark.add(m);}}
  else if(profile.feature==='harbour'||profile.feature==='waterfront'){for(let i=0;i<(lowPower?3:6);i++){const hull=new THREE.Mesh(new THREE.BoxGeometry(2.4,.7,6+i),new THREE.MeshStandardMaterial({color:'#e6e2d7',roughness:.35}));hull.position.set(i*5-12,.35,8+Math.sin(i)*4);landmark.add(hull);}tower(-16,-8,18,7);}
  else if(profile.feature==='alpine'||profile.feature==='hills'){for(let i=0;i<5;i++){const hill=new THREE.Mesh(new THREE.ConeGeometry(18+i*3,12+i*4,8),landmarkMat);hill.position.set((i-2)*22,5,-15-Math.abs(i-2)*8);landmark.add(hill);}}
  else if(profile.feature==='airfield'){tower(-14,0,8,18);tower(12,4,6,14);const mast=new THREE.Mesh(new THREE.CylinderGeometry(.18,.22,24,7),glow);mast.position.set(0,12,-12);landmark.add(mast);}
  else if(profile.feature==='forest'||profile.feature==='park'){for(let i=0;i<(lowPower?8:16);i++){const tree=new THREE.Mesh(new THREE.ConeGeometry(2.4,8,7),landmarkMat);tree.position.set((i%8)*6-21,4,Math.floor(i/8)*8);landmark.add(tree);}}
  else {for(let i=0;i<(lowPower?4:8);i++)tower((i%4)*10-15,Math.floor(i/4)*12,10+(i*7)%24,5+(i%3)*2);}
  if(profile.feature==='flood'||profile.feature==='boulevard'){for(let i=0;i<6;i++){const mast=new THREE.Mesh(new THREE.CylinderGeometry(.10,.14,16,6),landmarkMat);mast.position.set(i*9-23,8,-10);landmark.add(mast);const lamp=new THREE.Mesh(new THREE.SphereGeometry(.32,8,5),glow);lamp.position.set(i*9-23,16,-10);landmark.add(lamp);}}
  group.userData.venueProfile={...profile,round:track.round};

  // One restrained metadata plaque near start/finish. The old world repeated large signage
  // in the camera's focal plane, competing with cars and broadcast graphics.
  const p=trackPoint(.028,trackId),sign=new THREE.Mesh(new THREE.PlaneGeometry(15.5,3.6),new THREE.MeshBasicMaterial({map:venuePlaque(trackId),side:THREE.DoubleSide}));sign.position.set(p.x+16,2.8,p.z+17);sign.rotation.y=-.65;group.add(sign);
  group.userData.world={trackId,kind,venue:track.venue,version:8};
  return{water,kind};
}

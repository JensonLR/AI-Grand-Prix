import * as THREE from 'three';
import { getTrackDefinition,trackPoint,trackTangent,TRACK_WIDTH } from '@agp/sim-core';

const hash=(s:string)=>{let h=2166136261>>>0;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h>>>0;};
const mk=(colour:string,metalness=.1,roughness=.65)=>new THREE.MeshStandardMaterial({color:colour,metalness,roughness});

function textureLabel(trackId:string){
  const t=getTrackDefinition(trackId),canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const c=canvas.getContext('2d')!;
  c.fillStyle='#071018';c.fillRect(0,0,1024,256);c.fillStyle='#f4e8ce';c.font='900 86px Arial Black,Arial';c.textAlign='center';c.textBaseline='middle';c.fillText(t.venue.toUpperCase(),512,105);c.fillStyle='#d7a647';c.font='700 34px Arial';c.fillText(`AI GRAND PRIX · ROUND ${String(t.round).padStart(2,'0')} · 2027`,512,185);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}

export function decoratePremiumCircuit(group:THREE.Group,trackId:string,lowPower=false){
  const t=getTrackDefinition(trackId),seed=hash(trackId),dummy=new THREE.Object3D();
  const barrierMat=mk(seed%2?'#d9d6cd':'#20262b',.28,.38),fenceMat=mk('#626a70',.78,.28),kerbA=mk('#f4e8ce',.05,.76),kerbB=mk(seed%3===0?'#d62828':'#073bbe',.05,.73),dark=mk('#11161b',.45,.34),gold=mk('#d7a647',.5,.28),concrete=mk('#7a7e7d',.05,.82);
  const samples=lowPower?96:150;
  const barrierGeo=new THREE.BoxGeometry(.22,.78,2.3),postGeo=new THREE.CylinderGeometry(.028,.038,1.8,5),kerbGeo=new THREE.BoxGeometry(.46,.055,1.65);
  const barriers=new THREE.InstancedMesh(barrierGeo,barrierMat,samples*2),posts=new THREE.InstancedMesh(postGeo,fenceMat,lowPower?0:samples*2),kerbs=new THREE.InstancedMesh(kerbGeo,kerbA,samples*2);
  let bi=0,pi=0,ki=0;
  for(let i=0;i<samples;i++){
    const u=i/samples,p=trackPoint(u,trackId),tan=trackTangent(u,trackId),yaw=Math.atan2(tan.x,tan.z);
    for(const side of [-1,1]){
      const bx=p.x+tan.z*(TRACK_WIDTH*.5+2.1)*side,bz=p.z-tan.x*(TRACK_WIDTH*.5+2.1)*side;
      dummy.position.set(bx,.48,bz);dummy.rotation.set(0,yaw,0);dummy.updateMatrix();barriers.setMatrixAt(bi++,dummy.matrix);
      if(!lowPower){dummy.position.set(p.x+tan.z*(TRACK_WIDTH*.5+2.35)*side,1.35,p.z-tan.x*(TRACK_WIDTH*.5+2.35)*side);dummy.rotation.set(0,0,0);dummy.updateMatrix();posts.setMatrixAt(pi++,dummy.matrix);}
      const kx=p.x+tan.z*(TRACK_WIDTH*.5-.26)*side,kz=p.z-tan.x*(TRACK_WIDTH*.5-.26)*side;dummy.position.set(kx,.205,kz);dummy.rotation.set(0,yaw,0);dummy.updateMatrix();kerbs.setMatrixAt(ki++,dummy.matrix);
    }
  }
  barriers.count=bi;kerbs.count=ki;barriers.castShadow=!lowPower;barriers.receiveShadow=true;kerbs.receiveShadow=true;group.add(barriers,kerbs);if(!lowPower){posts.count=pi;group.add(posts);}

  // Alternating kerb identity without doubling road geometry.
  const accentKerbs=new THREE.InstancedMesh(kerbGeo,kerbB,Math.floor(samples/2));let ai=0;
  for(let i=0;i<samples;i+=4){const u=i/samples,p=trackPoint(u,trackId),tan=trackTangent(u,trackId),yaw=Math.atan2(tan.x,tan.z),side=i%8===0?1:-1;dummy.position.set(p.x+tan.z*(TRACK_WIDTH*.5-.26)*side,.212,p.z-tan.x*(TRACK_WIDTH*.5-.26)*side);dummy.rotation.set(0,yaw,0);dummy.updateMatrix();accentKerbs.setMatrixAt(ai++,dummy.matrix);}accentKerbs.count=ai;group.add(accentKerbs);

  // Grandstands: deliberately generic AGP architecture, positioned from circuit data rather than copied venue models.
  const standCount=lowPower?3:6;
  for(let i=0;i<standCount;i++){
    const u=((i+.35)/standCount+.04*(seed%5))%1,p=trackPoint(u,trackId),tan=trackTangent(u,trackId),side=i%2?1:-1,yaw=Math.atan2(tan.x,tan.z),stand=new THREE.Group();
    for(let row=0;row<(lowPower?3:5);row++){
      const seat=new THREE.Mesh(new THREE.BoxGeometry(11-row*.65,.28,1.05),row%2?dark:concrete);seat.position.set(0,row*.48,-row*.55);seat.receiveShadow=true;stand.add(seat);
    }
    const roof=new THREE.Mesh(new THREE.BoxGeometry(11.5,.14,2.9),dark);roof.position.set(0,3.05,-1.35);roof.rotation.x=-.1;stand.add(roof);
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(8.7,1.25),new THREE.MeshBasicMaterial({map:textureLabel(trackId),side:THREE.DoubleSide}));sign.position.set(0,2.1,.12);stand.add(sign);
    stand.position.set(p.x+tan.z*(TRACK_WIDTH*.5+12.5)*side,.3,p.z-tan.x*(TRACK_WIDTH*.5+12.5)*side);stand.rotation.y=yaw+(side<0?Math.PI:0);group.add(stand);
  }

  // Start/finish gantry and two sector gantries.
  for(const [j,u] of [0,.333,.666].entries()){
    const p=trackPoint(u,trackId),tan=trackTangent(u,trackId),yaw=Math.atan2(tan.x,tan.z),gantry=new THREE.Group();
    const beam=new THREE.Mesh(new THREE.BoxGeometry(TRACK_WIDTH+5,.34,.34),j===0?gold:dark);beam.position.y=5.1;gantry.add(beam);
    for(const side of [-1,1]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.32,5.1,.32),dark);leg.position.set(side*(TRACK_WIDTH*.5+2.1),2.55,0);gantry.add(leg);}
    if(j===0){const board=new THREE.Mesh(new THREE.PlaneGeometry(7.4,1.55),new THREE.MeshBasicMaterial({map:textureLabel(trackId),side:THREE.DoubleSide}));board.position.set(0,4.35,.21);gantry.add(board);}
    gantry.position.set(p.x,0,p.z);gantry.rotation.y=yaw;group.add(gantry);
  }

  // Braking boards and race-control light posts around the lap.
  const boardMat=new THREE.MeshBasicMaterial({color:'#f4e8ce'}),boardText=mk('#071018',.05,.8);
  for(let i=0;i<(lowPower?8:14);i++){
    const u=(.06+i/(lowPower?8:14))%1,p=trackPoint(u,trackId),tan=trackTangent(u,trackId),side=i%2?1:-1;
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.04,.05,2.5,6),fenceMat);pole.position.set(p.x+tan.z*(TRACK_WIDTH*.5+4)*side,1.25,p.z-tan.x*(TRACK_WIDTH*.5+4)*side);group.add(pole);
    const board=new THREE.Mesh(new THREE.BoxGeometry(.82,.72,.09),i%3===0?boardText:boardMat);board.position.copy(pole.position).add(new THREE.Vector3(0,1.15,0));board.rotation.y=Math.atan2(tan.x,tan.z);group.add(board);
  }

  // Paddock/pit silhouette close to start finish for visual density.
  const sp=trackPoint(.015,trackId),st=trackTangent(.015,trackId),pit=new THREE.Group();
  for(let i=0;i<(lowPower?4:8);i++){const box=new THREE.Mesh(new THREE.BoxGeometry(4.3,2.5,4.1),i%2?dark:concrete);box.position.set(i*4.5,1.25,0);pit.add(box);const stripe=new THREE.Mesh(new THREE.BoxGeometry(4.34,.18,4.14),i%2?gold:kerbB);stripe.position.set(i*4.5,2.25,0);pit.add(stripe);}pit.position.set(sp.x+st.z*(TRACK_WIDTH*.5+7),0,sp.z-st.x*(TRACK_WIDTH*.5+7));pit.rotation.y=Math.atan2(st.x,st.z);group.add(pit);

  group.userData.premiumCircuit={trackId,venue:t.venue,round:t.round};
}

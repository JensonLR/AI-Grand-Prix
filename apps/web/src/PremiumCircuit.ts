import * as THREE from 'three';
import { getTrackDefinition,trackPoint,trackTangent,TRACK_WIDTH } from '@agp/sim-core';

const hash=(s:string)=>{let h=2166136261>>>0;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h>>>0;};
const mk=(colour:string,metalness=.1,roughness=.65)=>new THREE.MeshStandardMaterial({color:colour,metalness,roughness});

function boardTexture(trackId:string){
  const t=getTrackDefinition(trackId),canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const c=canvas.getContext('2d')!;
  const g=c.createLinearGradient(0,0,1024,0);g.addColorStop(0,'#05080b');g.addColorStop(.7,'#101820');g.addColorStop(1,'#071018');c.fillStyle=g;c.fillRect(0,0,1024,256);
  c.fillStyle='#d9ad50';c.fillRect(0,0,13,256);c.fillStyle='#f4efe5';c.font='800 70px Arial, sans-serif';c.textAlign='left';c.textBaseline='middle';c.fillText(t.venue.toUpperCase(),54,103);
  c.fillStyle='#8e9ba5';c.font='600 29px Arial, sans-serif';c.fillText(`AI GRAND PRIX  ·  ROUND ${String(t.round).padStart(2,'0')}  ·  2027`,56,171);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;return tex;
}

function circuitRibbon(trackId:string,side:-1|1,offset:number,bottom:number,top:number,segments:number){
  const positions:number[]=[],uv:number[]=[],indices:number[]=[];
  for(let i=0;i<=segments;i++){
    const u=(i%segments)/segments,p=trackPoint(u,trackId),tan=trackTangent(u,trackId),nx=tan.z*side,nz=-tan.x*side,x=p.x+nx*offset,z=p.z+nz*offset;
    positions.push(x,bottom,z,x,top,z);uv.push(i/12,0,i/12,1);
    if(i<segments){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}

function addSmoothSafetySystem(group:THREE.Group,trackId:string,lowPower:boolean){
  const segments=lowPower?110:190,offset=TRACK_WIDTH*.5+2.2;
  const wallMat=new THREE.MeshStandardMaterial({color:'#c9c8c3',roughness:.7,metalness:.08});
  const railMat=new THREE.MeshStandardMaterial({color:'#56616a',roughness:.36,metalness:.74});
  for(const side of [-1,1] as const){
    const wall=new THREE.Mesh(circuitRibbon(trackId,side,offset,.10,.55,segments),wallMat);wall.receiveShadow=true;wall.castShadow=!lowPower;group.add(wall);
    // A slim dark rail above the wall reads as a proper safety system without a row of blocks.
    const rail=new THREE.Mesh(circuitRibbon(trackId,side,offset+.03,.58,.66,segments),railMat);rail.receiveShadow=true;group.add(rail);
  }

  if(lowPower)return;
  const dummy=new THREE.Object3D(),postGeo=new THREE.CylinderGeometry(.026,.032,1.9,6),postMat=mk('#59636b',.72,.3),postCount=70;
  const posts=new THREE.InstancedMesh(postGeo,postMat,postCount*2);let n=0;
  for(let i=0;i<postCount;i++){
    const u=i/postCount,p=trackPoint(u,trackId),tan=trackTangent(u,trackId);
    for(const side of [-1,1]){dummy.position.set(p.x+tan.z*(offset+.08)*side,1.48,p.z-tan.x*(offset+.08)*side);dummy.rotation.set(0,0,0);dummy.updateMatrix();posts.setMatrixAt(n++,dummy.matrix);}
  }
  posts.count=n;group.add(posts);
}

function addKerbs(group:THREE.Group,trackId:string,lowPower:boolean,seed:number){
  const count=lowPower?110:180,dummy=new THREE.Object3D(),geo=new THREE.BoxGeometry(.54,.055,1.45),ivory=mk('#f3eee3',.02,.72),accent=mk(seed%3===0?'#ca3037':'#2458b8',.04,.67),a=new THREE.InstancedMesh(geo,ivory,count*2),b=new THREE.InstancedMesh(geo,accent,count*2);let ai=0,bi=0;
  for(let i=0;i<count;i++){
    const u=i/count,p=trackPoint(u,trackId),tan=trackTangent(u,trackId),yaw=Math.atan2(tan.x,tan.z),m=i%2===0?a:b;
    for(const side of [-1,1]){dummy.position.set(p.x+tan.z*(TRACK_WIDTH*.5-.12)*side,.12,p.z-tan.x*(TRACK_WIDTH*.5-.12)*side);dummy.rotation.set(0,yaw,0);dummy.updateMatrix();m.setMatrixAt(m===a?ai++:bi++,dummy.matrix);}
  }
  a.count=ai;b.count=bi;a.receiveShadow=b.receiveShadow=true;group.add(a,b);
}

function addGrandstand(group:THREE.Group,trackId:string,u:number,side:-1|1,lowPower:boolean,index:number){
  const p=trackPoint(u,trackId),tan=trackTangent(u,trackId),yaw=Math.atan2(tan.x,tan.z),stand=new THREE.Group();
  const concrete=mk('#454b50',.08,.78),seat=mk(index%2?'#1b2229':'#262e35',.2,.62),roofMat=mk('#171c21',.46,.35),steel=mk('#747e85',.76,.27);
  const rows=lowPower?3:5;
  for(let row=0;row<rows;row++){
    const deck=new THREE.Mesh(new THREE.BoxGeometry(9.8-row*.36,.18,.76),row%2?seat:concrete);deck.position.set(0,.48+row*.39,-row*.49);deck.receiveShadow=true;stand.add(deck);
  }
  for(const x of [-4.3,0,4.3]){const support=new THREE.Mesh(new THREE.CylinderGeometry(.045,.055,3.2,7),steel);support.position.set(x,1.65,-1.15);support.rotation.z=x===0?0:.04*Math.sign(x);stand.add(support);}
  const roof=new THREE.Mesh(new THREE.BoxGeometry(10.6,.10,2.65),roofMat);roof.position.set(0,3.16,-1.18);roof.rotation.x=-.08;roof.castShadow=!lowPower;stand.add(roof);
  if(!lowPower){const fascia=new THREE.Mesh(new THREE.PlaneGeometry(7.3,.72),new THREE.MeshBasicMaterial({map:boardTexture(trackId),side:THREE.DoubleSide}));fascia.position.set(0,2.56,.03);stand.add(fascia);}
  stand.position.set(p.x+tan.z*(TRACK_WIDTH*.5+12.8)*side,.05,p.z-tan.x*(TRACK_WIDTH*.5+12.8)*side);stand.rotation.y=yaw+(side<0?Math.PI:0);group.add(stand);
}

function addGantry(group:THREE.Group,trackId:string,u:number,primary:boolean){
  const p=trackPoint(u,trackId),tan=trackTangent(u,trackId),yaw=Math.atan2(tan.x,tan.z),g=new THREE.Group(),carbon=mk('#161d23',.56,.33),metal=mk('#8a9297',.8,.25);
  for(const side of [-1,1]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.10,.13,5.0,8),metal);leg.position.set(side*(TRACK_WIDTH*.5+1.8),2.5,0);g.add(leg);}
  const beam=new THREE.Mesh(new THREE.BoxGeometry(TRACK_WIDTH+4.0,.22,.28),carbon);beam.position.y=4.88;g.add(beam);
  if(primary){const board=new THREE.Mesh(new THREE.PlaneGeometry(7.2,1.28),new THREE.MeshBasicMaterial({map:boardTexture(trackId),side:THREE.DoubleSide}));board.position.set(0,4.3,.17);g.add(board);}
  g.position.set(p.x,0,p.z);g.rotation.y=yaw;group.add(g);
}

export function decoratePremiumCircuit(group:THREE.Group,trackId:string,lowPower=false){
  const t=getTrackDefinition(trackId),seed=hash(trackId);
  addSmoothSafetySystem(group,trackId,lowPower);
  addKerbs(group,trackId,lowPower,seed);

  // Lower, cleaner broadcast architecture. It gives the venue scale without filling the
  // camera with black slabs or hiding the racing surface.
  const standCount=lowPower?2:5;
  for(let i=0;i<standCount;i++)addGrandstand(group,trackId,((i+.52)/standCount+.037*(seed%4))%1,i%2?1:-1,lowPower,i);

  addGantry(group,trackId,0,true);
  addGantry(group,trackId,.34,false);
  addGantry(group,trackId,.68,false);

  // Sparse braking markers / marshal LEDs rather than repeated billboard clutter.
  const dummy=new THREE.Object3D(),poleMat=mk('#454e55',.72,.32),lampMat=new THREE.MeshStandardMaterial({color:'#e8c86e',emissive:'#e8c86e',emissiveIntensity:1.5}),poleGeo=new THREE.CylinderGeometry(.035,.045,2.3,6),lampGeo=new THREE.BoxGeometry(.18,.35,.12),count=lowPower?7:12,poles=new THREE.InstancedMesh(poleGeo,poleMat,count),lamps=new THREE.InstancedMesh(lampGeo,lampMat,count);
  for(let i=0;i<count;i++){
    const u=(.075+i/count)%1,p=trackPoint(u,trackId),tan=trackTangent(u,trackId),side=i%2?1:-1,x=p.x+tan.z*(TRACK_WIDTH*.5+3.4)*side,z=p.z-tan.x*(TRACK_WIDTH*.5+3.4)*side,yaw=Math.atan2(tan.x,tan.z);
    dummy.position.set(x,1.15,z);dummy.rotation.set(0,0,0);dummy.updateMatrix();poles.setMatrixAt(i,dummy.matrix);
    dummy.position.set(x,2.23,z);dummy.rotation.set(0,yaw,0);dummy.updateMatrix();lamps.setMatrixAt(i,dummy.matrix);
  }
  group.add(poles,lamps);

  // Pit building silhouette stays deliberately set back from the asphalt. The interactive
  // crew/pit-lane module supplies the foreground detail during pit coverage.
  const sp=trackPoint(.012,trackId),st=trackTangent(.012,trackId),pit=new THREE.Group(),base=mk('#30363b',.16,.66),glass=new THREE.MeshPhysicalMaterial({color:'#172631',metalness:.28,roughness:.18,transmission:.04,transparent:true,opacity:.92}),gold=mk('#c9a24e',.45,.34);
  const building=new THREE.Mesh(new THREE.BoxGeometry(29,3.0,4.3),base);building.position.set(0,1.5,0);building.castShadow=!lowPower;pit.add(building);
  const windows=new THREE.Mesh(new THREE.BoxGeometry(27.5,.92,4.36),glass);windows.position.set(0,2.05,0);pit.add(windows);
  const canopy=new THREE.Mesh(new THREE.BoxGeometry(30,.12,5.15),mk('#171d22',.55,.35));canopy.position.set(0,3.08,-.18);pit.add(canopy);
  const line=new THREE.Mesh(new THREE.BoxGeometry(29.4,.07,.11),gold);line.position.set(0,2.95,2.19);pit.add(line);
  pit.position.set(sp.x+st.z*(TRACK_WIDTH*.5+10.8),0,sp.z-st.x*(TRACK_WIDTH*.5+10.8));pit.rotation.y=Math.atan2(st.x,st.z);group.add(pit);

  group.userData.premiumCircuit={trackId,venue:t.venue,round:t.round,version:4};
}

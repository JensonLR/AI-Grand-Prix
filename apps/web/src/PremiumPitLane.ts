import * as THREE from 'three';
import type { RaceState } from '@agp/shared';
import { trackPoint,trackTangent } from '@agp/sim-core';
import { ENTRANTS,TEAMS } from './championship';

type CrewRig={root:THREE.Group;people:THREE.Group[];wheels:THREE.Mesh[];jack:THREE.Group};

const mat=(colour:string,roughness=.48)=>new THREE.MeshStandardMaterial({color:colour,roughness,metalness:.18});
const add=(parent:THREE.Object3D,mesh:THREE.Object3D,x:number,y:number,z:number)=>{mesh.position.set(x,y,z);parent.add(mesh);return mesh;};

function crewMember(colour:string,accent:string,lowPower:boolean){
  const g=new THREE.Group(),body=mat(colour),trim=mat(accent,.36),dark=mat('#090d11',.72);
  add(g,new THREE.Mesh(new THREE.CylinderGeometry(.18,.23,.68,lowPower?6:10),body),0,.58,0);
  add(g,new THREE.Mesh(new THREE.SphereGeometry(.18,lowPower?7:12,lowPower?5:8),dark),0,1.02,0);
  add(g,new THREE.Mesh(new THREE.BoxGeometry(.39,.07,.25),trim),0,.78,.02);
  if(!lowPower){
    const arm=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.52,7),body);arm.rotation.z=Math.PI*.42;add(g,arm,.27,.65,.04);
    const arm2=arm.clone();arm2.rotation.z=-Math.PI*.42;add(g,arm2,-.27,.65,.04);
  }
  return g;
}

function buildRig(team:(typeof TEAMS)[number],lowPower:boolean):CrewRig{
  const root=new THREE.Group();
  const pad=add(root,new THREE.Mesh(new THREE.BoxGeometry(4.6,.035,5.25),new THREE.MeshStandardMaterial({color:'#11171d',roughness:.9})),0,.02,0);
  pad.receiveShadow=true;
  const stripe=add(root,new THREE.Mesh(new THREE.BoxGeometry(.12,.045,5.15),mat(team.colour,.58)),-2.05,.05,0);stripe.receiveShadow=true;
  add(root,new THREE.Mesh(new THREE.BoxGeometry(4.25,.06,.08),mat(team.accent,.4)),0,.055,-2.18);
  const people:THREE.Group[]=[];
  const positions:[number,number,number][]=[[-1.45,0,.9],[1.45,0,.9],[-1.45,0,-.95],[1.45,0,-.95],[0,0,-1.72],[1.85,0,-1.72]];
  for(const [x,y,z] of positions.slice(0,lowPower?4:6)){const p=crewMember(team.colour,team.accent,lowPower);p.position.set(x,y,z);root.add(p);people.push(p);}
  const wheelMat=mat('#050607',.96),wheels:THREE.Mesh[]=[];
  for(const [x,z] of [[-1.7,1.55],[1.7,1.55],[-1.7,-1.55],[1.7,-1.55]] as const){const w=new THREE.Mesh(new THREE.TorusGeometry(.34,.12,7,lowPower?12:20),wheelMat);w.rotation.y=Math.PI/2;w.position.set(x,.36,z);root.add(w);wheels.push(w);}
  const jack=new THREE.Group();add(jack,new THREE.Mesh(new THREE.BoxGeometry(.13,.13,1.15),mat(team.accent,.32)),0,.14,0);add(jack,new THREE.Mesh(new THREE.BoxGeometry(.56,.10,.2),mat('#b7bec4',.25)),0,.14,.45);jack.position.set(0,0,-1.45);root.add(jack);
  root.userData.teamId=team.id;
  return {root,people,wheels,jack};
}

/** A physically connected pit lane: branches from the circuit, runs past all 11 garages,
 * then blends back onto the racing surface. Presentation-only; race physics remain authoritative. */
export class PremiumPitLane{
  private root=new THREE.Group();
  private rigs=new Map<string,CrewRig>();
  constructor(parent:THREE.Group,trackId:string,private lowPower:boolean){
    parent.add(this.root);
    const entry=.935,exit=.055,samples=48,points:THREE.Vector3[]=[];
    for(let i=0;i<=samples;i++){
      const q=i/samples,t=(entry+(1-entry+exit)*q)%1,p=trackPoint(t,trackId),tan=trackTangent(t,trackId);
      const blend=Math.sin(Math.PI*q),offset=blend*17;
      points.push(new THREE.Vector3(p.x+tan.z*offset,.105,p.z-tan.x*offset));
    }
    const curve=new THREE.CatmullRomCurve3(points,false,'centripetal');
    const strip=(width:number,y:number,material:THREE.Material)=>{
      const n=96,pos:number[]=[],idx:number[]=[];
      for(let i=0;i<=n;i++){const q=i/n,p=curve.getPoint(q),t=curve.getTangent(q).normalize(),nx=t.z,nz=-t.x;pos.push(p.x+nx*width/2,y,p.z+nz*width/2,p.x-nx*width/2,y,p.z-nz*width/2);if(i<n){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}}
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,material);mesh.receiveShadow=true;this.root.add(mesh);
    };
    strip(7.6,.09,new THREE.MeshStandardMaterial({color:'#252a2e',roughness:.96,metalness:.02}));
    for(const side of [-1,1]){const pts=Array.from({length:72},(_,i)=>{const q=i/71,p=curve.getPoint(q),t=curve.getTangent(q).normalize();return new THREE.Vector3(p.x+t.z*3.25*side,.145,p.z-t.x*3.25*side)});this.root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),90,.055,5,false),mat(side<0?'#d8c863':'#f3f0e7',.62)));}
    // Pit wall follows the fast-lane edge instead of floating beside start/finish.
    const wallPts=Array.from({length:48},(_,i)=>{const q=.08+i/47*.84,p=curve.getPoint(q),t=curve.getTangent(q).normalize();return new THREE.Vector3(p.x-t.z*3.85,.62,p.z+t.x*3.85)});
    this.root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wallPts),72,.18,6,false),mat('#aeb5b9',.32)));
    TEAMS.forEach((team,index)=>{const q=.16+index*.068,p=curve.getPoint(q),t=curve.getTangent(q).normalize(),rig=buildRig(team,lowPower);rig.root.position.set(p.x+t.z*1.05,.13,p.z-t.x*1.05);rig.root.rotation.y=Math.atan2(t.x,t.z);this.root.add(rig.root);this.rigs.set(team.id,rig);});
    // Garage canopy gives the lane a continuous architectural spine.
    if(!lowPower){for(let i=0;i<11;i++){const q=.16+i*.068,p=curve.getPoint(q),t=curve.getTangent(q).normalize(),garage=new THREE.Mesh(new THREE.BoxGeometry(5.0,2.8,5.6),mat('#151b20',.58));garage.position.set(p.x+t.z*5.1,1.45,p.z-t.x*5.1);garage.rotation.y=Math.atan2(t.x,t.z);this.root.add(garage);}}
    this.root.userData.connectedPitLane={trackId,entry,exit,garages:11};
  }
  update(state:RaceState|undefined,time:number){
    if(!state)return;
    const event=[...state.incidents].reverse().find(item=>item.type==='PIT'&&state.time-item.time<=5.5),driver=event?ENTRANTS.find(item=>event.cars.includes(item.id)):undefined,activeTeam=driver?.teamId;
    for(const [teamId,rig] of this.rigs){
      const active=teamId===activeTeam,phase=active?Math.max(0,state.time-(event?.time??state.time)):0;
      rig.people.forEach((person,index)=>{const pulse=active?Math.sin(time*12+index*.8):Math.sin(time*1.4+index)*.05;person.rotation.x=active&&phase<3.2?(index<4?-.34-Math.abs(pulse)*.18:.08*pulse):0;person.rotation.y=active?Math.sin(time*7+index)*.035:Math.sin(time*.7+index)*.012;person.position.y=active?Math.max(0,.03+Math.abs(pulse)*.045):0;});
      rig.wheels.forEach((wheel,index)=>{wheel.rotation.x=active?time*(index%2?8:-8):0;wheel.rotation.y=Math.PI/2;wheel.position.y=active&&phase<3.2?.28+.06*Math.sin(time*13+index):.36;});
      rig.jack.rotation.x=active&&phase>.55&&phase<3.05?-.12:0;rig.root.scale.setScalar(active?1.025:1);
    }
  }
  dispose(){this.root.removeFromParent();this.root.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>material.dispose());}});this.rigs.clear();}
}

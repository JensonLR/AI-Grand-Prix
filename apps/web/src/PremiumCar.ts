import * as THREE from 'three';

export interface PremiumCarEntrant {
  id:string;
  name:string;
  number:number;
  colour:string;
  secondary:string;
  accent:string;
  provider:string;
}

const hash=(text:string)=>{let h=2166136261>>>0;for(const c of text){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h>>>0;};
const paint=(colour:string,metalness=.32,roughness=.16,clearcoat=1)=>new THREE.MeshPhysicalMaterial({color:colour,metalness,roughness,clearcoat,clearcoatRoughness:.055,envMapIntensity:1.35});
const standard=(colour:string,metalness=.45,roughness=.32)=>new THREE.MeshStandardMaterial({color:colour,metalness,roughness,envMapIntensity:1.15});

/** Low-poly frustum with smooth normals. Front is +Z; dimensions can taper independently. */
function aeroWedge(frontW:number,rearW:number,frontH:number,rearH:number,length:number){
  const zf=length/2,zr=-length/2;
  const v=new Float32Array([
    -frontW/2,-frontH/2,zf, frontW/2,-frontH/2,zf, frontW/2,frontH/2,zf, -frontW/2,frontH/2,zf,
    -rearW/2,-rearH/2,zr, rearW/2,-rearH/2,zr, rearW/2,rearH/2,zr, -rearW/2,rearH/2,zr,
  ]);
  const i=[0,1,2,0,2,3, 5,4,7,5,7,6, 4,0,3,4,3,7, 1,5,6,1,6,2, 3,2,6,3,6,7, 4,5,1,4,1,0];
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(v,3));g.setIndex(i);g.computeVertexNormals();return g;
}

function curvedFin(length:number,height:number,thickness:number){
  const shape=new THREE.Shape();shape.moveTo(-length*.5,0);shape.lineTo(length*.48,0);shape.quadraticCurveTo(length*.30,height*.72,length*.05,height);shape.quadraticCurveTo(-length*.30,height*.82,-length*.5,height*.18);shape.closePath();
  const g=new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:2,curveSegments:8});g.translate(0,0,-thickness/2);return g;
}

function add(group:THREE.Group,geometry:THREE.BufferGeometry,material:THREE.Material,pos:[number,number,number],rot:[number,number,number]=[0,0,0],scale:[number,number,number]=[1,1,1]){
  const m=new THREE.Mesh(geometry,material);m.position.set(...pos);m.rotation.set(...rot);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;
}

function rod(group:THREE.Group,a:THREE.Vector3,b:THREE.Vector3,material:THREE.Material,r=.018,segments=6){
  const d=b.clone().sub(a),m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),segments),material);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());m.castShadow=true;group.add(m);return m;
}

function identityTexture(e:PremiumCarEntrant,kind:'number'|'team'){
  const canvas=document.createElement('canvas');canvas.width=kind==='team'?1024:384;canvas.height=256;const c=canvas.getContext('2d')!;
  c.clearRect(0,0,canvas.width,canvas.height);
  if(kind==='number'){
    c.fillStyle='rgba(3,5,7,.86)';c.beginPath();c.roundRect(16,16,352,224,32);c.fill();c.strokeStyle=e.accent;c.lineWidth=10;c.stroke();
    c.fillStyle='#F8F3E8';c.font='900 174px Arial Black,Arial';c.textAlign='center';c.textBaseline='middle';c.fillText(String(e.number),192,133);
  }else{
    const short=e.provider.replace(/RACING|SCUDERIA|SPORT/gi,'').trim().slice(0,18).toUpperCase();
    c.fillStyle='rgba(2,4,6,.72)';c.beginPath();c.roundRect(8,8,1008,240,26);c.fill();c.fillStyle=e.accent;c.fillRect(8,8,24,240);
    c.fillStyle='#FAF5EA';c.font='900 82px Arial Black,Arial';c.textAlign='left';c.textBaseline='middle';c.fillText(short,70,110);
    c.fillStyle=e.accent;c.font='700 34px Arial';c.fillText(`#${e.number}  ${e.name.toUpperCase()}`,72,185);
  }
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}

function buildFlyDriver(lowPower:boolean){
  const fly=new THREE.Group();fly.name='Drosophila driver';
  const chitin=standard('#3a2419',.08,.62),dark=standard('#17100d',.04,.78),eye=new THREE.MeshPhysicalMaterial({color:'#8f1416',roughness:.28,clearcoat:.5}),wing=new THREE.MeshPhysicalMaterial({color:'#d8e1d8',transparent:true,opacity:.34,roughness:.18,side:THREE.DoubleSide,depthWrite:false});
  const head=add(fly,new THREE.SphereGeometry(.105,lowPower?10:18,lowPower?7:12),chitin,[0,.10,.10],[0,0,0],[1,1,.92]);
  for(const side of [-1,1]){add(fly,new THREE.SphereGeometry(.065,lowPower?8:14,lowPower?6:10),eye,[side*.073,.115,.125],[0,0,0],[.58,1,.82]);const antenna=rod(fly,new THREE.Vector3(side*.045,.18,.14),new THREE.Vector3(side*.12,.27,.20),dark,.009,5);antenna.castShadow=true;}
  add(fly,new THREE.SphereGeometry(.12,lowPower?10:18,lowPower?7:12),dark,[0,.02,-.04],[0,0,0],[.82,.72,1.08]);
  add(fly,new THREE.SphereGeometry(.09,lowPower?9:16,lowPower?6:10),chitin,[0,-.04,-.18],[Math.PI/2,0,0],[.72,.72,1.35]);
  if(!lowPower){for(const side of [-1,1]){const w=add(fly,new THREE.PlaneGeometry(.12,.28),wing,[side*.085,.075,-.09],[-.55,side*.32,side*.38]);w.renderOrder=6;}}
  for(const side of [-1,1])for(let i=0;i<3;i++){const z=.04-i*.10;rod(fly,new THREE.Vector3(side*.055,.02,z),new THREE.Vector3(side*(.18+i*.018),-.09,z+.035),dark,.006,4);}
  fly.rotation.x=-.10;fly.scale.setScalar(1.05);return fly;
}

function helmetPalette(e:PremiumCarEntrant){
  const h=hash(e.id),pick=h%3;
  return pick===0?[e.secondary,e.accent]:pick===1?[e.accent,'#F7F1E5']:[e.colour,'#F7F1E5'];
}

/**
 * AGP-27: an original contemporary single-seater silhouette built specifically for the
 * Connectome World Championship. It uses modern Formula proportions without copying any
 * one real chassis: long wheelbase, narrow raised nose, sculpted sidepod undercuts,
 * ground-effect floor edges, exposed wishbones, 18-inch-style tyres and multi-plane wings.
 */
export function buildPremiumFormulaCar(e:PremiumCarEntrant,lowPower=false){
  const g=new THREE.Group();g.name=`AGP-27 ${e.provider} #${e.number}`;
  const teams=['McLARVAE RACING','MERCED-EYES','RED BUG RACING','SCUDERIA FLYRRARI','WINGLIAMS RACING','RACING BUGS','ASTON MIDGE','HAASFLY','AUD-EYE SPORT','FLYPINE','CADDIS-LAC RACING'];
  const known=teams.indexOf(e.provider),variant=known>=0?known:hash(e.provider)%11;
  const body=paint(e.colour,.34,.13,1),secondary=paint(e.secondary,.27,.17,.95),accent=paint(e.accent,.42,.14,.92);
  const carbon=standard('#050607',.82,.20),carbon2=standard('#111519',.66,.29),rubber=standard('#050506',.02,.93),rim=standard('#a7adb1',.92,.16),brake=standard('#4d5053',.84,.28),visor=paint('#061822',.58,.07,.92);

  // Floor / venturi silhouette: thin, wide and visually separate from the bodywork.
  add(g,aeroWedge(1.62,2.18,.06,.085,4.92),carbon,[0,.18,-.10]);
  add(g,aeroWedge(1.34,1.98,.045,.055,2.65),carbon2,[0,.245,-.68]);
  for(const side of [-1,1]){
    add(g,aeroWedge(.11,.18,.11,.15,3.22),carbon,[side*.99,.27,-.43],[0,0,side*.035]);
    if(!lowPower){add(g,aeroWedge(.045,.07,.22,.30,1.62),carbon2,[side*.91,.32,-1.52],[0,0,side*.06]);}
  }

  // Lower chassis, raised survival cell and much narrower nose than the previous capsule car.
  add(g,aeroWedge(.48,1.08,.24,.38,2.45),body,[0,.47,1.02]);
  add(g,aeroWedge(.22,.54,.16,.25,1.82),secondary,[0,.43,2.83]);
  add(g,aeroWedge(.72,1.02,.40,.53,2.32),body,[0,.61,-.42]);
  add(g,aeroWedge(.96,.55,.48,.61,1.78),body,[0,.67,-1.68]);
  add(g,aeroWedge(.44,.20,.73,.42,1.32),body,[0,.77,-2.10]);
  // Spine / engine-cover fin gives a recognisable broadcast silhouette.
  const engineFin=add(g,curvedFin(1.72,.74,.075),body,[0,1.00,-1.43],[0,Math.PI/2,0]);engineFin.castShadow=true;
  add(g,aeroWedge(.18,.10,.09,.09,3.70),accent,[0,.93,-.12]);

  // Sidepods with dark frontal inlet and a real undercut gap instead of capsule tubes.
  for(const side of [-1,1]){
    const x=side*.73;
    add(g,aeroWedge(.62,.48,.42,.31,2.05),body,[x,.54,-.62],[0,0,side*.035]);
    add(g,aeroWedge(.53,.34,.16,.10,1.72),secondary,[x,.76,-.47],[0,0,side*.025]);
    add(g,aeroWedge(.50,.38,.24,.18,.78),carbon2,[x,.55,.57]);
    add(g,aeroWedge(.42,.24,.10,.07,1.80),carbon,[x,.31,-.52]);
    // Floor-edge fence and a thin livery keyline retain team colour at race distance.
    add(g,new THREE.BoxGeometry(.035,.25,1.72),accent,[side*1.055,.35,-.78],[0,0,side*.035]);
    add(g,new THREE.BoxGeometry(.026,.055,2.60),secondary,[side*.93,.73,-.33],[0,0,side*.08]);
  }

  // Cockpit shoulders and a visible physical Drosophila driver. The fly is intentionally
  // exposed above the survival cell so broadcast/t-cam/chase shots read the biological premise.
  add(g,aeroWedge(.88,.69,.25,.35,.95),carbon2,[0,.77,-.28]);
  const flyDriver=buildFlyDriver(lowPower);flyDriver.position.set(0,1.12,-.43);flyDriver.scale.setScalar(lowPower?.82:1.02);g.add(flyDriver);
  const haloMat=standard('#111418',.90,.13),halo=new THREE.Mesh(new THREE.TorusGeometry(.37,.034,lowPower?5:8,lowPower?18:32,Math.PI*1.62),haloMat);
  halo.position.set(0,1.09,-.48);halo.rotation.set(Math.PI/2,0,.76);halo.castShadow=true;g.add(halo);
  rod(g,new THREE.Vector3(0,1.06,-.78),new THREE.Vector3(0,.80,.03),haloMat,.034,lowPower?5:8);
  rod(g,new THREE.Vector3(-.31,1.04,-.44),new THREE.Vector3(-.04,.86,.05),haloMat,.024,6);rod(g,new THREE.Vector3(.31,1.04,-.44),new THREE.Vector3(.04,.86,.05),haloMat,.024,6);

  // Mirrors and small aero furniture.
  for(const side of [-1,1]){
    rod(g,new THREE.Vector3(side*.47,.83,.03),new THREE.Vector3(side*.89,.91,.08),carbon,.016,5);
    add(g,aeroWedge(.24,.18,.13,.11,.20),body,[side*.96,.92,.08],[0,side>0?Math.PI/2:-Math.PI/2,0]);
    if(!lowPower){add(g,new THREE.BoxGeometry(.035,.28,.42),accent,[side*.61,.72,.64],[0,0,side*.18]);}
  }

  // Modern three-plane front wing, central neutral section and curved outer fences.
  add(g,aeroWedge(3.98,3.42,.045,.045,.36),carbon,[0,.17,3.63],[-.025,0,0]);
  add(g,aeroWedge(3.72,3.18,.04,.04,.27),secondary,[0,.235,3.48],[-.075,0,0]);
  add(g,aeroWedge(3.35,2.92,.035,.035,.22),accent,[0,.295,3.33],[-.12,0,0]);
  add(g,new THREE.BoxGeometry(.72,.035,.50),carbon2,[0,.20,3.54]);
  for(const side of [-1,1]){
    add(g,aeroWedge(.055,.055,.46,.33,.82),carbon,[side*1.98,.34,3.50],[0,0,side*.055]);
    add(g,new THREE.BoxGeometry(.035,.22,.68),secondary,[side*1.86,.31,3.48],[0,0,side*.10]);
  }

  // Rear wing / beam wing / diffuser with more realistic vertical separation.
  add(g,aeroWedge(3.22,3.36,.09,.12,.38),carbon,[0,1.02,-2.82],[-.05,0,0]);
  add(g,aeroWedge(3.02,3.16,.055,.07,.28),accent,[0,1.22,-2.75],[-.14,0,0]);
  for(const side of [-1,1])add(g,aeroWedge(.055,.055,.79,.65,.64),secondary,[side*1.63,.92,-2.78],[0,0,side*.018]);
  rod(g,new THREE.Vector3(-.38,.45,-2.27),new THREE.Vector3(-.26,1.04,-2.68),carbon,.038,7);rod(g,new THREE.Vector3(.38,.45,-2.27),new THREE.Vector3(.26,1.04,-2.68),carbon,.038,7);
  add(g,aeroWedge(2.12,1.62,.06,.07,.42),carbon2,[0,.42,-2.61],[.18,0,0]);
  add(g,aeroWedge(1.96,1.56,.24,.10,.48),carbon,[0,.28,-2.69],[.13,0,0]);
  if(!lowPower)for(const x of [-.72,-.36,0,.36,.72])add(g,new THREE.BoxGeometry(.022,.29,.46),carbon2,[x,.31,-2.65],[.16,0,0]);

  // Wheels, rims, brake discs and double wishbones. Rear tyres are visibly wider.
  const wheels:THREE.Mesh[]=[];
  const specs=[[-1.49,.43,2.18,true],[1.49,.43,2.18,true],[-1.51,.46,-1.88,false],[1.51,.46,-1.88,false]] as const;
  for(const [x,y,z,front] of specs){
    const radius=front ? .405 : .445,width=front ? .34 : .405;
    const tyre=add(g,new THREE.CylinderGeometry(radius,radius,width,lowPower?14:28),rubber,[x,y,z],[0,0,Math.PI/2]);wheels.push(tyre);
    add(g,new THREE.CylinderGeometry(radius*.67,radius*.67,width+.012,lowPower?12:24),rim,[x,y,z],[0,0,Math.PI/2]);
    add(g,new THREE.CylinderGeometry(radius*.41,radius*.41,width+.024,lowPower?10:20),brake,[x,y,z],[0,0,Math.PI/2]);
    const side= Math.sign(x),outerX=x+side*(width*.52+.01);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(radius*.72,.014,6,lowPower?18:34),accent);ring.position.set(outerX,y,z);ring.rotation.y=Math.PI/2;g.add(ring);
    if(!lowPower){
      const tyreMark=new THREE.Mesh(new THREE.TorusGeometry(radius*.86,.009,4,32),secondary);tyreMark.position.set(outerX+side*.004,y,z);tyreMark.rotation.y=Math.PI/2;g.add(tyreMark);
    }
    const inX=side*.52;
    rod(g,new THREE.Vector3(inX,.37,z-.22),new THREE.Vector3(x*.91,y+.12,z+.11),carbon,.021,6);
    rod(g,new THREE.Vector3(inX,.56,z-.18),new THREE.Vector3(x*.91,y-.08,z-.08),carbon,.021,6);
    rod(g,new THREE.Vector3(inX,.32,z+.18),new THREE.Vector3(x*.91,y,z),carbon,.017,6);
  }

  // Constructor livery languages: large clean zones, not random stripes.
  if(variant===0){
    add(g,aeroWedge(.35,.24,.035,.035,3.45),secondary,[0,.955,.05],[0,0,-.045]);
    for(const side of [-1,1])add(g,new THREE.BoxGeometry(.032,.18,1.95),accent,[side*.92,.57,-.56],[0,0,side*.22]);
  }else if(variant===1){
    add(g,aeroWedge(.92,.60,.035,.035,2.45),secondary,[0,.96,.38],[0,0,.10]);
    for(const side of [-1,1])add(g,new THREE.BoxGeometry(.026,.085,2.75),accent,[side*.79,.76,-.12],[0,0,side*.075]);
  }else if(variant===2){
    for(const side of [-1,1]){add(g,new THREE.BoxGeometry(.034,.27,1.72),secondary,[side*.91,.60,-.77],[0,0,side*.22]);add(g,new THREE.BoxGeometry(.025,.14,1.40),accent,[side*.99,.49,.48],[0,0,-side*.31]);}
  }else if(variant===3){
    add(g,new THREE.BoxGeometry(.13,.035,4.05),accent,[0,.965,-.08]);for(const side of [-1,1])add(g,new THREE.BoxGeometry(.022,.12,1.76),secondary,[side*.96,.63,-.59],[0,0,side*.14]);
  }else if(variant===4){
    add(g,aeroWedge(.58,.32,.035,.035,2.72),secondary,[0,.95,1.02],[0,0,-.12]);for(const side of [-1,1])add(g,new THREE.BoxGeometry(.024,.07,2.82),accent,[side*.88,.72,-.15],[0,0,side*.14]);
  }else if(variant===5){
    for(const side of [-1,1]){add(g,new THREE.BoxGeometry(.027,.19,1.48),accent,[side*.91,.61,.40],[0,0,side*.38]);add(g,new THREE.BoxGeometry(.024,.13,1.20),secondary,[side*.91,.56,-1.02],[0,0,-side*.25]);}
  }else if(variant===6){
    for(const side of [-1,1])add(g,new THREE.BoxGeometry(.024,.055,3.12),accent,[side*.83,.74,-.15],[0,0,side*.035]);add(g,aeroWedge(.44,.30,.032,.032,1.98),secondary,[0,.95,.62],[0,0,.075]);
  }else if(variant===7){
    add(g,aeroWedge(.82,.55,.035,.035,2.60),secondary,[0,.96,.22],[0,0,.11]);for(const side of [-1,1])add(g,new THREE.BoxGeometry(.028,.22,1.68),accent,[side*.94,.58,-.45],[0,0,-side*.28]);
  }else if(variant===8){
    for(const side of [-1,1]){add(g,new THREE.BoxGeometry(.024,.06,2.98),accent,[side*.82,.73,-.10],[0,0,-side*.10]);add(g,new THREE.BoxGeometry(.028,.14,1.18),secondary,[side*.96,.57,-1.02],[0,0,side*.20]);}
  }else if(variant===9){
    for(const side of [-1,1]){add(g,new THREE.BoxGeometry(.030,.18,2.16),secondary,[side*.90,.61,-.22],[0,0,side*(e.number%2 ? .32 : .25)]);add(g,new THREE.BoxGeometry(.022,.055,2.45),accent,[side*.79,.75,.03],[0,0,-side*.08]);}
  }else{
    add(g,new THREE.BoxGeometry(.16,.035,3.88),secondary,[0,.96,-.08],[0,0,-.04]);for(const side of [-1,1]){add(g,new THREE.BoxGeometry(.022,.06,2.82),accent,[side*.84,.72,-.14],[0,0,side*.11]);add(g,new THREE.BoxGeometry(.020,.095,1.65),secondary,[side*.98,.55,-.67],[0,0,-side*.18]);}
  }

  // Crisp, generated identifiers stay readable without baking unreliable AI text into textures.
  const numberTexture=identityTexture(e,'number'),numberMaterial=new THREE.MeshBasicMaterial({map:numberTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
  const number=add(g,new THREE.PlaneGeometry(.68,.46),numberMaterial,[0,.985,1.12],[-Math.PI/2,0,0]);number.renderOrder=4;
  const teamTexture=identityTexture(e,'team'),teamMaterial=new THREE.MeshBasicMaterial({map:teamTexture,transparent:true,depthWrite:false,side:THREE.DoubleSide});
  for(const side of [-1,1]){const decal=add(g,new THREE.PlaneGeometry(1.26,.30),teamMaterial.clone(),[side*1.015,.61,-.72],[0,side>0?Math.PI/2:-Math.PI/2,0]);decal.renderOrder=5;}

  // Constructor signature pass: eleven readable identities remain distinct at TV distance.
  const signature=variant%2===0?accent:secondary,signatureAngle=.05+(variant%5)*.035;
  for(const side of [-1,1])add(g,new THREE.BoxGeometry(.028,.075,.92),signature,[side*(.34+(variant%3)*.06),.79,2.02-(variant%4)*.14],[0,0,side*signatureAngle]);
  if(variant%3===0)add(g,new THREE.BoxGeometry(.58,.035,.16),secondary,[0,1.04,-1.58],[0,0,.08]);
  else if(variant%3===1)add(g,new THREE.BoxGeometry(.035,.28,.58),accent,[0,1.04,-1.64],[0,0,-.10]);
  else for(const side of [-1,1])add(g,new THREE.BoxGeometry(.035,.15,.42),secondary,[side*.28,1.00,-1.58],[0,0,side*.12]);

  // Wet-race effects.
  const sprayMaterial=new THREE.MeshBasicMaterial({color:'#edf5f8',transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
  const sprays=[-1,1].map(side=>add(g,new THREE.ConeGeometry(.22,1.48,lowPower?5:8,1,true),sprayMaterial.clone(),[side*1.20,.34,-2.42],[-Math.PI/2,0,0]));sprays.forEach(m=>{m.visible=false;m.renderOrder=2;});
  const rain=add(g,new THREE.BoxGeometry(.24,.085,.05),new THREE.MeshStandardMaterial({color:'#f32626',emissive:'#f32626',emissiveIntensity:3.2}),[0,.55,-2.98]);

  g.userData.flyDriver=flyDriver;g.userData.rainLight=rain;g.userData.wheels=wheels;g.userData.spray=sprays;g.userData.premiumCar=true;g.userData.team=e.provider;g.userData.variant=variant;g.userData.chassis='AGP-27';
  g.scale.setScalar(.80);
  return g;
}

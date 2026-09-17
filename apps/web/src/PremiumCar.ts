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
const mat=(colour:string,metalness=.28,roughness=.22,clearcoat=1)=>new THREE.MeshPhysicalMaterial({color:colour,metalness,roughness,clearcoat,clearcoatRoughness:.075,envMapIntensity:1.25});
const std=(colour:string,metalness=.4,roughness=.34)=>new THREE.MeshStandardMaterial({color:colour,metalness,roughness,envMapIntensity:1.1});

function canvasTexture(e:PremiumCarEntrant,kind:'number'|'team'){
  const canvas=document.createElement('canvas');
  canvas.width=kind==='team'?1024:384;canvas.height=256;
  const c=canvas.getContext('2d')!;
  c.clearRect(0,0,canvas.width,canvas.height);
  if(kind==='number'){
    c.fillStyle='rgba(3,5,7,.9)';c.beginPath();c.roundRect(12,12,360,232,36);c.fill();
    c.strokeStyle=e.accent;c.lineWidth=12;c.stroke();c.fillStyle='#F7F2E8';c.font='900 178px Arial Black,Arial';c.textAlign='center';c.textBaseline='middle';c.fillText(String(e.number),192,136);
  }else{
    const short=e.provider.replace(/RACING|SCUDERIA|SPORT/gi,'').trim().slice(0,18).toUpperCase();
    c.fillStyle='rgba(2,4,6,.78)';c.beginPath();c.roundRect(8,8,1008,240,28);c.fill();
    c.fillStyle=e.accent;c.fillRect(8,8,28,240);c.fillStyle=e.colour;c.fillRect(36,8,12,240);
    c.fillStyle='#F7F2E8';c.font='900 86px Arial Black,Arial';c.textAlign='left';c.textBaseline='middle';c.fillText(short,82,112);
    c.fillStyle=e.accent;c.font='700 38px Arial';c.fillText(`AGP · #${e.number} · ${e.name.toUpperCase()}`,84,188);
  }
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}

function rod(group:THREE.Group,a:THREE.Vector3,b:THREE.Vector3,material:THREE.Material,r=.025,segments=6){
  const d=b.clone().sub(a),m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),segments),material);
  m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());m.castShadow=true;group.add(m);return m;
}

function addMesh(group:THREE.Group,geometry:THREE.BufferGeometry,material:THREE.Material,pos:[number,number,number],rot:[number,number,number]=[0,0,0],scale:[number,number,number]=[1,1,1]){
  const m=new THREE.Mesh(geometry,material);m.position.set(...pos);m.rotation.set(...rot);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;
}

/**
 * Original AGP open-wheel car. It deliberately avoids copying any one current F1 chassis,
 * but uses the visual grammar of a modern ground-effect Formula car: wide floor, sculpted
 * sidepods, halo, exposed suspension, multi-element wings and 18-inch wheel proportions.
 */
export function buildPremiumFormulaCar(e:PremiumCarEntrant,lowPower=false){
  const g=new THREE.Group();
  const seed=hash(e.provider),teams=['McLARVAE RACING','MERCED-EYES','RED BUG RACING','SCUDERIA FLYRRARI','WINGLIAMS RACING','RACING BUGS','ASTON MIDGE','HAASFLY','AUD-EYE SPORT','FLYPINE','CADDIS-LAC RACING'],known=teams.indexOf(e.provider),variant=known>=0?known:seed%11;
  const body=mat(e.colour,.34,.15,1),secondary=mat(e.secondary,.25,.18,.92),accent=mat(e.accent,.48,.14,.9);
  const carbon=std('#050708',.78,.22),carbonSoft=std('#11151a',.62,.32),rubber=std('#070809',.03,.93),rim=std('#aeb5ba',.92,.17),brake=std('#5e6265',.8,.3),visor=mat('#061b28',.55,.08,.9);
  const floor=addMesh(g,new THREE.BoxGeometry(2.08,.075,5.05),carbon,[0,.18,.12]);
  floor.geometry.translate(0,0,-.05);

  // Main survival cell / engine cover.
  addMesh(g,new THREE.CapsuleGeometry(.57,2.5,lowPower?6:10,lowPower?12:22),body,[0,.54,-.15],[Math.PI/2,0,0],[1,.92,1.12]);
  addMesh(g,new THREE.CapsuleGeometry(.48,1.55,lowPower?5:9,lowPower?10:20),body,[0,.73,-1.55],[Math.PI/2,0,0],[1,.86,1]);
  addMesh(g,new THREE.ConeGeometry(.31,2.48,lowPower?8:14),secondary,[0,.43,2.22],[Math.PI/2,0,0],[1,.9,1]);
  addMesh(g,new THREE.BoxGeometry(.22,.055,4.7),accent,[0,.88,-.05]);

  // Sidepods: compact inlets, undercut and coke-bottle taper.
  for(const side of [-1,1]){
    const x=side*.76;
    addMesh(g,new THREE.CapsuleGeometry(.31,1.52,lowPower?5:8,lowPower?10:18),body,[x,.48,-.55],[Math.PI/2,0,0],[1,.78,1]);
    addMesh(g,new THREE.BoxGeometry(.64,.17,1.42),secondary,[x,.69,-.37],[0,0,side*.035]);
    addMesh(g,new THREE.BoxGeometry(.52,.22,.16),carbonSoft,[x,.63,.38]);
    addMesh(g,new THREE.BoxGeometry(.72,.045,2.85),carbon,[side*.82,.25,-.35],[0,0,side*.01]);
    addMesh(g,new THREE.BoxGeometry(.055,.26,1.45),accent,[side*1.03,.36,-.78],[0,0,side*.03]);
    // Driver-specific accent slash; same constructor palette, different angle by car number.
    const slash=addMesh(g,new THREE.BoxGeometry(.035,.38,1.35),accent,[side*.95,.57,-.2],[0,0,side*((e.number%2?1:-1)*.22)]);slash.material=accent;
  }

  // Cockpit, headrest and halo.
  addMesh(g,new THREE.SphereGeometry(.43,lowPower?12:22,lowPower?8:14),carbonSoft,[0,.86,-.6],[0,0,0],[1,.7,1.24]);
  addMesh(g,new THREE.SphereGeometry(.3,lowPower?10:18,lowPower?7:12),visor,[0,1.02,-.43],[0,0,0],[1,.7,.88]);
  const haloMat=std('#15191d',.82,.16);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(.39,.035,lowPower?5:8,lowPower?18:32,Math.PI*1.55),haloMat);halo.position.set(0,1.08,-.52);halo.rotation.set(Math.PI/2,0,.8);halo.castShadow=true;g.add(halo);
  rod(g,new THREE.Vector3(0,1.06,-.82),new THREE.Vector3(0,.78,-.12),haloMat,.035,lowPower?5:8);
  rod(g,new THREE.Vector3(-.33,1.03,-.5),new THREE.Vector3(-.02,.88,-.06),haloMat,.028,lowPower?5:8);
  rod(g,new THREE.Vector3(.33,1.03,-.5),new THREE.Vector3(.02,.88,-.06),haloMat,.028,lowPower?5:8);

  // Front wing: three elements, sculpted central section and endplates.
  addMesh(g,new THREE.BoxGeometry(4.15,.055,.34),carbon,[0,.19,3.55],[0,0,0]);
  addMesh(g,new THREE.BoxGeometry(3.8,.045,.22),secondary,[0,.255,3.47],[-.05,0,0]);
  addMesh(g,new THREE.BoxGeometry(3.35,.04,.18),accent,[0,.30,3.35],[-.09,0,0]);
  for(const side of [-1,1]){
    addMesh(g,new THREE.BoxGeometry(.055,.43,.78),carbon,[side*2.02,.34,3.48],[0,0,side*.04]);
    addMesh(g,new THREE.BoxGeometry(.035,.28,.64),e.number%2?accent:secondary,[side*1.88,.33,3.43],[0,0,side*.1]);
  }

  // Rear wing + DRS flap + swan-neck supports.
  addMesh(g,new THREE.BoxGeometry(3.45,.12,.42),carbon,[0,1.03,-2.78],[-.06,0,0]);
  addMesh(g,new THREE.BoxGeometry(3.2,.075,.28),accent,[0,1.22,-2.71],[-.14,0,0]);
  for(const side of [-1,1])addMesh(g,new THREE.BoxGeometry(.055,.78,.62),secondary,[side*1.69,.91,-2.75],[0,0,side*.015]);
  rod(g,new THREE.Vector3(-.42,.45,-2.28),new THREE.Vector3(-.3,1.05,-2.68),carbon,.045,lowPower?5:8);
  rod(g,new THREE.Vector3(.42,.45,-2.28),new THREE.Vector3(.3,1.05,-2.68),carbon,.045,lowPower?5:8);

  // Diffuser / beam wing detailing.
  addMesh(g,new THREE.BoxGeometry(2.05,.08,.55),carbon,[0,.27,-2.64],[.16,0,0]);
  if(!lowPower){for(const side of [-.7,-.35,0,.35,.7])addMesh(g,new THREE.BoxGeometry(.025,.34,.5),carbonSoft,[side,.34,-2.62],[.18,0,0]);}

  // Mirrors and aero horns.
  for(const side of [-1,1]){
    rod(g,new THREE.Vector3(side*.48,.83,-.08),new THREE.Vector3(side*.92,.9,-.02),carbon,.018,5);
    addMesh(g,new THREE.CapsuleGeometry(.10,.18,4,8),body,[side*.98,.91,-.01],[0,0,Math.PI/2],[1,.7,1]);
    if(!lowPower)addMesh(g,new THREE.BoxGeometry(.06,.32,.54),accent,[side*.64,.78,.58],[0,0,side*.24]);
  }

  // Wheels, brake discs and suspension.
  const wheels:THREE.Mesh[]=[];
  const wheelSpecs=[[-1.48,.44,2.25,true],[1.48,.44,2.25,true],[-1.5,.49,-1.86,false],[1.5,.49,-1.86,false]] as const;
  for(const [x,y,z,front] of wheelSpecs){
    const tyre=addMesh(g,new THREE.CylinderGeometry(front ? .39 : .43,front ? .39 : .43,front ? .34 : .39,lowPower?12:24),rubber,[x,y,z],[0,0,Math.PI/2]);
    const outer=addMesh(g,new THREE.CylinderGeometry(front ? .27 : .29,front ? .27 : .29,.352,lowPower?12:24),rim,[x,y,z],[0,0,Math.PI/2]);
    addMesh(g,new THREE.CylinderGeometry(front ? .17 : .19,front ? .17 : .19,.365,lowPower?10:18),brake,[x,y,z],[0,0,Math.PI/2]);
    // Thin constructor-colour wheel ring for instant identity at race distance.
    const ring=new THREE.Mesh(new THREE.TorusGeometry(front ? .285 : .305,.018,6,lowPower?16:28),accent);ring.position.set(x+(x>0?.2:-.2),y,z);ring.rotation.y=Math.PI/2;g.add(ring);
    wheels.push(tyre);void outer;
    const inboard=new THREE.Vector3(Math.sign(x)*.55,front ? .34 : .38,z+(front?-.14:.12));
    rod(g,inboard,new THREE.Vector3(x*.92,y+.13,z+.12),carbon,.022,6);
    rod(g,inboard.clone().setY(inboard.y+.18),new THREE.Vector3(x*.92,y-.09,z-.09),carbon,.022,6);
    rod(g,new THREE.Vector3(Math.sign(x)*.5,.27,z),new THREE.Vector3(x*.92,y,z),carbon,.018,6);
  }

  // Eleven constructor-specific livery languages. Team identity is geometry + palette, not paint alone.
  if(variant===0){ // McLARVAE — papaya spear / black floor
    addMesh(g,new THREE.BoxGeometry(.26,.05,3.7),secondary,[0,.92,-.05],[0,0,-.06]);
    for(const side of [-1,1])addMesh(g,new THREE.BoxGeometry(.045,.18,2.1),accent,[side*.93,.56,-.48],[0,0,side*.23]);
  }else if(variant===1){ // MERCED-EYES — teal silver technical ribbon
    addMesh(g,new THREE.BoxGeometry(1.08,.045,2.58),secondary,[0,.91,.3],[0,0,.12]);
    for(const side of [-1,1])addMesh(g,new THREE.BoxGeometry(.035,.10,2.8),accent,[side*.74,.76,-.15],[0,0,side*.08]);
  }else if(variant===2){ // RED BUG — aggressive cobalt/red slash
    for(const side of [-1,1]){addMesh(g,new THREE.BoxGeometry(.055,.31,1.92),secondary,[side*.9,.59,-.82],[0,0,side*.23]);addMesh(g,new THREE.BoxGeometry(.04,.2,1.45),accent,[side*.99,.49,.55],[0,0,-side*.34]);}
  }else if(variant===3){ // FLYRRARI — central gold spine / deep body
    addMesh(g,new THREE.BoxGeometry(.17,.055,4.12),accent,[0,.93,-.1],[0,0,0]);
    for(const side of [-1,1])addMesh(g,new THREE.BoxGeometry(.03,.14,1.82),secondary,[side*.97,.63,-.56],[0,0,side*.15]);
  }else if(variant===4){ // WINGLIAMS — ivory geometric nose and cyan edge
    addMesh(g,new THREE.BoxGeometry(.62,.055,2.8),secondary,[0,.9,1.05],[0,0,-.14]);
    for(const side of [-1,1])addMesh(g,new THREE.BoxGeometry(.035,.09,3.0),accent,[side*.89,.69,-.18],[0,0,side*.16]);
  }else if(variant===5){ // RACING BUGS — violet emerald chevrons
    for(const side of [-1,1]){addMesh(g,new THREE.BoxGeometry(.04,.22,1.58),accent,[side*.91,.61,.42],[0,0,side*.42]);addMesh(g,new THREE.BoxGeometry(.035,.16,1.3),secondary,[side*.9,.54,-.98],[0,0,-side*.28]);}
  }else if(variant===6){ // ASTON MIDGE — British green with gold beltline
    for(const side of [-1,1])addMesh(g,new THREE.BoxGeometry(.035,.07,3.25),accent,[side*.83,.71,-.16],[0,0,side*.04]);
    addMesh(g,new THREE.BoxGeometry(.5,.045,2.05),secondary,[0,.9,.58],[0,0,.09]);
  }else if(variant===7){ // HAASFLY — silver technical blocks with red strike
    addMesh(g,new THREE.BoxGeometry(.92,.045,2.68),secondary,[0,.91,.2],[0,0,.13]);
    for(const side of [-1,1])addMesh(g,new THREE.BoxGeometry(.04,.26,1.8),accent,[side*.95,.58,-.42],[0,0,-side*.31]);
  }else if(variant===8){ // AUD-EYE — burnt orange / ice-blue signal lines
    for(const side of [-1,1]){addMesh(g,new THREE.BoxGeometry(.035,.08,3.12),accent,[side*.81,.72,-.12],[0,0,-side*.12]);addMesh(g,new THREE.BoxGeometry(.04,.18,1.22),secondary,[side*.96,.55,-1.05],[0,0,side*.23]);}
  }else if(variant===9){ // FLYPINE — blue/pink mountain sweep
    for(const side of [-1,1]){addMesh(g,new THREE.BoxGeometry(.045,.22,2.32),secondary,[side*.9,.6,-.25],[0,0,side*(e.number%2 ? .35 : .27)]);addMesh(g,new THREE.BoxGeometry(.035,.07,2.6),accent,[side*.78,.75,.02],[0,0,-side*.09]);}
  }else{ // CADDIS-LAC — stealth black with gold/teal pinstripes
    addMesh(g,new THREE.BoxGeometry(.24,.05,3.98),secondary,[0,.92,-.08],[0,0,-.05]);
    for(const side of [-1,1]){addMesh(g,new THREE.BoxGeometry(.032,.08,3.0),accent,[side*.84,.7,-.14],[0,0,side*.12]);addMesh(g,new THREE.BoxGeometry(.026,.12,1.8),secondary,[side*.98,.54,-.64],[0,0,-side*.2]);}
  }

  // High-resolution readable identifiers; no baked AI-generated text.
  const ntex=canvasTexture(e,'number'),nmat=new THREE.MeshBasicMaterial({map:ntex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
  const numberTop=addMesh(g,new THREE.PlaneGeometry(.72,.5),nmat,[0,.945,1.05],[-Math.PI/2,0,0]);
  numberTop.renderOrder=4;
  const ttex=canvasTexture(e,'team'),tmat=new THREE.MeshBasicMaterial({map:ttex,transparent:true,depthWrite:false,side:THREE.DoubleSide});
  for(const side of [-1,1]){
    const decal=addMesh(g,new THREE.PlaneGeometry(1.42,.36),tmat.clone(),[side*1.075,.61,-.67],[0,side>0?Math.PI/2:-Math.PI/2,0]);decal.renderOrder=5;
  }

  const sprayMaterial=new THREE.MeshBasicMaterial({color:'#e9f2f6',transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
  const sprays=[-1,1].map(side=>addMesh(g,new THREE.ConeGeometry(.24,1.55,lowPower?5:8,1,true),sprayMaterial.clone(),[side*1.22,.35,-2.48],[-Math.PI/2,0,0],[1,1,1]));
  sprays.forEach(x=>{x.visible=false;x.renderOrder=2;});
  const rain=addMesh(g,new THREE.BoxGeometry(.28,.10,.055),new THREE.MeshStandardMaterial({color:'#f32626',emissive:'#f32626',emissiveIntensity:3.2}),[0,.55,-2.98]);
  g.userData.rainLight=rain;g.userData.wheels=wheels;g.userData.spray=sprays;g.userData.premiumCar=true;g.userData.team=e.provider;g.userData.variant=variant;
  g.scale.setScalar(.78);
  return g;
}

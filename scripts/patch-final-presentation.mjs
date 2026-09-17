import { readFileSync,writeFileSync } from 'node:fs';

function load(path){return readFileSync(path,'utf8')}
function save(path,text){writeFileSync(path,text)}
function replaceRequired(text,from,to,label){if(text.includes(to))return text;if(!text.includes(from))throw new Error(`Final presentation patch failed: ${label}`);return text.replace(from,to)}
function insertBeforeRequired(text,anchor,insert,sentinel,label){if(text.includes(sentinel))return text;const at=text.indexOf(anchor);if(at<0)throw new Error(`Final presentation patch failed: ${label}`);return text.slice(0,at)+insert+text.slice(at)}

{
  const path='apps/web/src/ChampionshipApp.tsx';
  let s=load(path);
  s=replaceRequired(s,
    "import { ChampionshipMark } from './ChampionshipBrand';",
    "import { ChampionshipMark } from './ChampionshipBrand';\nimport { chooseBroadcastShot,type BroadcastShot } from './BroadcastDirector';\nimport { PitStopBroadcast } from './PitStopBroadcast';\nimport { PodiumCeremony } from './PodiumCeremony';",
    'ChampionshipApp presentation imports');
  s=replaceRequired(s,
    "useEffect(()=>{const unsubscribe=bancRuntime.subscribe(setBancInfo);preloadBancRuntime();return unsubscribe},[]);",
    "useEffect(()=>{const unsubscribe=bancRuntime.subscribe(setBancInfo),timer=window.setTimeout(()=>{void preloadBancRuntime()},280);return()=>{unsubscribe();clearTimeout(timer)}},[]);",
    'deferred BANC preload');
  if(!s.includes('directorBeat=Math.floor')){
    const fn=s.indexOf('function RaceBroadcast('),ret=s.indexOf('\n  return <section',fn);
    if(fn<0||ret<0)throw new Error('Final presentation patch failed: RaceBroadcast hook insertion');
    const hooks="\n  const [autoDirector,setAutoDirector]=useState(!human),[directorShot,setDirectorShot]=useState<BroadcastShot|null>(null),directorBeat=Math.floor(state.time/4.5),incidentKey=state.incidents.at(-1)?.id??'';\n  useEffect(()=>{if(!autoDirector||paused||human)return;const shot=chooseBroadcastShot(state,directorBeat);if(!shot)return;setDirectorShot(shot);onFocus(shot.focusId);onCamera(shot.camera)},[autoDirector,directorBeat,incidentKey,paused,human,state.flag]);";
    s=s.slice(0,ret)+hooks+s.slice(ret);
  }
  s=replaceRequired(s,
    '</div>}<aside className="tower">',
    '</div>}{autoDirector&&directorShot&&<div className="director-cue"><span><small>AUTO DIRECTOR · {directorShot.priority}</small><strong>{directorShot.label} · {directorShot.detail}</strong></span></div>}<aside className="tower">',
    'director cue');
  s=replaceRequired(s,
    '{state.incidents.length>0&&<div className="incident">',
    '<PitStopBroadcast state={state}/>{state.incidents.length>0&&<div className="incident">',
    'pit broadcast insertion');
  s=replaceRequired(s,
    "{(['broadcast','trackside','tcam','chase','cockpit','aerial','neural'] as CameraMode[]).map(c=><button className={camera===c?'active':''} onClick={()=>onCamera(c)} key={c}>{c}</button>)}",
    "<button className={`director-toggle ${autoDirector?'active':''}`} onClick={()=>setAutoDirector(v=>!v)}>{autoDirector?'AUTO TV':'AUTO TV OFF'}</button>{(['broadcast','trackside','tcam','chase','cockpit','aerial','neural'] as CameraMode[]).map(c=><button className={camera===c?'active':''} onClick={()=>{setAutoDirector(false);onCamera(c)}} key={c}>{c}</button>)}",
    'automatic director controls');
  s=replaceRequired(s,'return <div className="results"><div className="results-title">','return <div className="results has-podium"><div className="results-title">','podium results shell');
  s=replaceRequired(s,'</p></div><div className="results-list">','</p></div><PodiumCeremony cars={cars}/><div className="results-list">','podium ceremony insertion');
  save(path,s);
}

{
  const path='apps/web/src/GrandPrixScene.ts';
  let s=load(path);
  s=replaceRequired(s,
    "import { buildPremiumWorld } from './PremiumWorld';",
    "import { buildPremiumWorld } from './PremiumWorld';\nimport { PremiumPitLane } from './PremiumPitLane';",
    '3D pit lane import');
  s=replaceRequired(s,
    "private currentTrackId:string=DEFAULT_2027_TRACK_ID;private worldGroup=new THREE.Group();private trackGroup=new THREE.Group();",
    "private currentTrackId:string=DEFAULT_2027_TRACK_ID;private worldGroup=new THREE.Group();private trackGroup=new THREE.Group();private pitLane:PremiumPitLane|null=null;",
    '3D pit lane field');
  s=replaceRequired(s,
    "setTrack(trackId:string){const next=trackId||DEFAULT_2027_TRACK_ID;if(next===this.currentTrackId&&this.trackGroup.children.length&&this.worldGroup.children.length)return;this.currentTrackId=next;this.clearGroup(this.trackGroup);this.clearGroup(this.worldGroup);const world=buildPremiumWorld(this.worldGroup,this.scene,this.currentTrackId,this.lowPower);this.water=world.water;this.makeRoad();decoratePremiumCircuit(this.trackGroup,this.currentTrackId,this.lowPower);}",
    "setTrack(trackId:string){const next=trackId||DEFAULT_2027_TRACK_ID;if(next===this.currentTrackId&&this.trackGroup.children.length&&this.worldGroup.children.length)return;this.currentTrackId=next;this.pitLane?.dispose();this.pitLane=null;this.clearGroup(this.trackGroup);this.clearGroup(this.worldGroup);const world=buildPremiumWorld(this.worldGroup,this.scene,this.currentTrackId,this.lowPower);this.water=world.water;this.makeRoad();decoratePremiumCircuit(this.trackGroup,this.currentTrackId,this.lowPower);this.pitLane=new PremiumPitLane(this.trackGroup,this.currentTrackId,this.lowPower);}",
    'track-change pit lane lifecycle');
  s=replaceRequired(s,'this.animateWorld(now/1000);this.updateCamera(now/1000);','this.animateWorld(now/1000);this.pitLane?.update(this.sim?.state,now/1000);this.updateCamera(now/1000);','pit lane animation update');
  if(!s.includes('this.pitLane=new PremiumPitLane(this.trackGroup,this.currentTrackId,this.lowPower);this.makeClouds();')){
    const build=s.indexOf('private buildWorld(){');
    if(build<0)throw new Error('Final presentation patch failed: buildWorld location');
    const anchor='decoratePremiumCircuit(this.trackGroup,this.currentTrackId,this.lowPower);this.makeClouds();',at=s.indexOf(anchor,build);
    if(at<0)throw new Error('Final presentation patch failed: initial pit lane construction');
    s=s.slice(0,at)+anchor.replace(';this.makeClouds();',';this.pitLane=new PremiumPitLane(this.trackGroup,this.currentTrackId,this.lowPower);this.makeClouds();')+s.slice(at+anchor.length);
  }
  s=replaceRequired(s,'dispose(){cancelAnimationFrame(this.raf);','dispose(){cancelAnimationFrame(this.raf);this.pitLane?.dispose();this.pitLane=null;','pit lane disposal');
  save(path,s);
}

{
  const path='apps/web/src/PremiumCar.ts';
  let s=load(path);
  const art=`  // Constructor signature pass: eleven readable identities remain distinct at TV distance.\n  const signature=variant%2===0?accent:secondary,signatureAngle=.05+(variant%5)*.035;\n  for(const side of [-1,1])add(g,new THREE.BoxGeometry(.028,.075,.92),signature,[side*(.34+(variant%3)*.06),.79,2.02-(variant%4)*.14],[0,0,side*signatureAngle]);\n  if(variant%3===0)add(g,new THREE.BoxGeometry(.58,.035,.16),secondary,[0,1.04,-1.58],[0,0,.08]);\n  else if(variant%3===1)add(g,new THREE.BoxGeometry(.035,.28,.58),accent,[0,1.04,-1.64],[0,0,-.10]);\n  else for(const side of [-1,1])add(g,new THREE.BoxGeometry(.035,.15,.42),secondary,[side*.28,1.00,-1.58],[0,0,side*.12]);\n\n`;
  s=insertBeforeRequired(s,'  // Wet-race effects.\n',art,'Constructor signature pass: eleven readable identities','constructor identity art pass');
  save(path,s);
}

console.log('Final presentation patch applied: auto TV, incident/pit direction, 3D pit lane, podium, constructor signature art.');

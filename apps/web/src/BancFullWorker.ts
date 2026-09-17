type BancManifest={
  schema:string;materialization:number;neurons:number;directedNeuronPairs:number;runtimeBytes:number;
  interface:{sensoryBuckets:number;motorBuckets:number};
};
type InitMessage={type:'init';baseUrl:string};
type DecideMessage={type:'decide';requestId:number;driverKey:string;seed:number;sensors:number[];calibration:number[]};
type DisposeMessage={type:'dispose';driverKey:string};
type RequestMessage=InitMessage|DecideMessage|DisposeMessage;
type Graph={manifest:BancManifest;offsets:Uint32Array;targets:Uint32Array;counts:Uint16Array;sensory:Uint8Array;motor:Uint8Array;overflow:Map<number,number>;sensoryNodes:Uint32Array[];motorNodes:Uint32Array[]};
type DriverState={v:Float32Array;lastSteer:number;calibration:Float32Array;seed:number;decisions:number};

const scope=globalThis as unknown as {onmessage:((event:MessageEvent<RequestMessage>)=>void)|null;postMessage:(value:unknown)=>void};
let baseUrl='';
let graphPromise:Promise<Graph>|null=null;
const drivers=new Map<string,DriverState>();
const MAX_FRONTIER=4200;
const PROPAGATION_STEPS=3;

const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
const hash=(text:string)=>{let h=2166136261>>>0;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h||1};

async function getBuffer(url:string){const r=await fetch(url);if(!r.ok)throw new Error(`BANC asset ${r.status}: ${url}`);return r.arrayBuffer();}
async function getJson<T>(url:string):Promise<T>{const r=await fetch(url);if(!r.ok)throw new Error(`BANC asset ${r.status}: ${url}`);return r.json() as Promise<T>}
function bucketise(source:Uint8Array,count:number){const lists=Array.from({length:count},()=>[] as number[]);for(let i=0;i<source.length;i++){const b=source[i];if(b<count)lists[b].push(i)}return lists.map(v=>Uint32Array.from(v))}

async function loadGraph():Promise<Graph>{
  if(!baseUrl)throw new Error('BANC runtime base URL has not been initialised');
  const root=baseUrl.endsWith('/')?baseUrl:`${baseUrl}/`;
  const manifest=await getJson<BancManifest>(`${root}manifest.json`);
  if(manifest.schema!=='BANC-V888-FULL-GRAPH/1'||manifest.materialization!==888)throw new Error(`Unsupported BANC manifest ${manifest.schema}`);
  const [offsetsRaw,targetsRaw,countsRaw,sensoryRaw,motorRaw,overflowRaw]=await Promise.all([
    getBuffer(`${root}offsets.u32`),getBuffer(`${root}targets.u32`),getBuffer(`${root}counts.u16`),
    getBuffer(`${root}sensory-buckets.u8`),getBuffer(`${root}motor-buckets.u8`),getJson<number[][]>(`${root}count-overflow.json`)
  ]);
  const offsets=new Uint32Array(offsetsRaw),targets=new Uint32Array(targetsRaw),counts=new Uint16Array(countsRaw),sensory=new Uint8Array(sensoryRaw),motor=new Uint8Array(motorRaw);
  if(offsets.length!==manifest.neurons+1)throw new Error(`BANC offsets ${offsets.length} != ${manifest.neurons+1}`);
  if(targets.length!==manifest.directedNeuronPairs||counts.length!==manifest.directedNeuronPairs)throw new Error('BANC edge arrays do not match manifest');
  if(sensory.length!==manifest.neurons||motor.length!==manifest.neurons)throw new Error('BANC annotation arrays do not match manifest');
  const overflow=new Map<number,number>(overflowRaw.map(([i,count])=>[i,count]));
  return{manifest,offsets,targets,counts,sensory,motor,overflow,sensoryNodes:bucketise(sensory,12),motorNodes:bucketise(motor,5)};
}
function ensureGraph(){return graphPromise??=(loadGraph().then(g=>{scope.postMessage({type:'ready',neurons:g.manifest.neurons,edges:g.manifest.directedNeuronPairs,materialization:g.manifest.materialization,runtimeBytes:g.manifest.runtimeBytes});return g}).catch(error=>{scope.postMessage({type:'error',message:error instanceof Error?error.message:String(error)});throw error}))}

function stateFor(key:string,seed:number,calibration:number[],neurons:number){
  let state=drivers.get(key);if(state)return state;
  state={v:new Float32Array(neurons),lastSteer:0,calibration:new Float32Array(5),seed,decisions:0};
  for(let i=0;i<Math.min(5,calibration.length);i++)state.calibration[i]=Number.isFinite(calibration[i])?calibration[i]:0;
  drivers.set(key,state);return state;
}
function activeFrontier(v:Float32Array,threshold:number){
  let count=0;for(let i=0;i<v.length;i++)if(v[i]>=threshold)count++;
  if(!count)return{nodes:new Uint32Array(0),count:0};
  const keep=Math.min(count,MAX_FRONTIER),nodes=new Uint32Array(keep),stride=count/keep;let seen=0,next=0,out=0;
  for(let i=0;i<v.length&&out<keep;i++)if(v[i]>=threshold){if(seen>=next){nodes[out++]=i;next+=stride}seen++}
  return{nodes:out===nodes.length?nodes:nodes.slice(0,out),count};
}
function meanNodes(v:Float32Array,nodes:Uint32Array){if(!nodes.length)return 0;let sum=0;for(let i=0;i<nodes.length;i++)sum+=Math.tanh(v[nodes[i]]);return sum/nodes.length}

function runDecision(g:Graph,key:string,seed:number,sensors:number[],calibration:number[]){
  const st=stateFor(key,seed,calibration,g.manifest.neurons),v=st.v;
  st.decisions++;
  const phenotype=((seed>>>8)&1023)/1023,leak=.79+phenotype*.055,threshold=.52+(((seed>>>18)&255)/255-.5)*.035;
  for(let i=0;i<v.length;i++)v[i]*=leak;
  for(let b=0;b<12;b++){
    const signal=clamp(Number(sensors[b]??0),0,1.5),nodes=g.sensoryNodes[b];if(signal<=0||!nodes.length)continue;
    const inject=.34*signal*(.97+phenotype*.06);for(let i=0;i<nodes.length;i++)v[nodes[i]]=Math.min(2.5,v[nodes[i]]+inject);
  }
  let totalSpikes=0;
  for(let step=0;step<PROPAGATION_STEPS;step++){
    const frontier=activeFrontier(v,threshold+.025*step);totalSpikes+=frontier.count;if(!frontier.nodes.length)break;
    const globalInhibition=Math.min(.055,frontier.count/g.manifest.neurons*.6);
    for(let a=0;a<frontier.nodes.length;a++){
      const pre=frontier.nodes[a],start=g.offsets[pre],end=g.offsets[pre+1],degree=Math.max(1,end-start),preActivity=Math.min(1.4,v[pre]);
      v[pre]*=.18;
      for(let e=start;e<end;e++){
        const count=g.counts[e]===65535?(g.overflow.get(e)??65535):g.counts[e],target=g.targets[e];
        const strength=Math.log1p(count)*(.0105/Math.sqrt(degree));
        v[target]=Math.min(2.8,v[target]+preActivity*strength);
      }
    }
    if(globalInhibition>0)for(let i=0;i<v.length;i++)v[i]=Math.max(0,v[i]-globalInhibition);
  }
  const motor=g.motorNodes.map(nodes=>meanNodes(v,nodes));
  const steerDrive=(motor[1]-motor[0])*7.2+st.calibration[0];
  const rawSteer=Math.tanh(steerDrive),steering=clamp(st.lastSteer*.36+rawSteer*.64,-1,1);st.lastSteer=steering;
  const throttle=clamp(.48+motor[2]*2.35-motor[3]*.72+st.calibration[1]);
  const brake=clamp(motor[3]*2.7-motor[2]*.42-.035+st.calibration[2]);
  const energyDeploy=clamp(motor[4]*1.95+motor[2]*.38-.08+st.calibration[3]);
  const sensoryMean=sensors.slice(0,8).reduce((a,b)=>a+Number(b||0),0)/8;
  const descendingMean=(motor[0]+motor[1]+motor[2]+motor[3]+motor[4])/5;
  return{steering,throttle,brake,energyDeploy,activeNeurons:Math.min(g.manifest.neurons,totalSpikes),spikeRate:totalSpikes/PROPAGATION_STEPS,visualActivity:sensoryMean,descendingActivity:descendingMean,calibration:Array.from(st.calibration),decisions:st.decisions};
}

scope.onmessage=(event)=>{
  const msg=event.data;
  if(msg.type==='init'){baseUrl=msg.baseUrl;void ensureGraph();return}
  if(msg.type==='dispose'){drivers.delete(msg.driverKey);return}
  if(msg.type==='decide')void ensureGraph().then(g=>{
    const result=runDecision(g,msg.driverKey,msg.seed,msg.sensors,msg.calibration);
    scope.postMessage({type:'decision',requestId:msg.requestId,result,neurons:g.manifest.neurons,edges:g.manifest.directedNeuronPairs,materialization:g.manifest.materialization});
  }).catch(error=>scope.postMessage({type:'decision-error',requestId:msg.requestId,message:error instanceof Error?error.message:String(error)}));
};

export {};

export interface BancDecisionResult{
  steering:number;throttle:number;brake:number;energyDeploy:number;activeNeurons:number;spikeRate:number;visualActivity:number;descendingActivity:number;calibration:number[];decisions:number;
}
export interface BancRuntimeInfo{status:'idle'|'loading'|'ready'|'error';neurons:number;edges:number;materialization:number;runtimeBytes:number;error?:string}
type WorkerReply={type:'ready';neurons:number;edges:number;materialization:number;runtimeBytes:number}|{type:'error';message:string}|{type:'decision';requestId:number;result:BancDecisionResult;neurons:number;edges:number;materialization:number}|{type:'decision-error';requestId:number;message:string};

class BancRuntimeClient{
  private worker:Worker|null=null;private sequence=0;private pending=new Map<number,{resolve:(v:BancDecisionResult)=>void;reject:(e:Error)=>void}>();
  private info:BancRuntimeInfo={status:'idle',neurons:0,edges:0,materialization:888,runtimeBytes:0};private listeners=new Set<(v:BancRuntimeInfo)=>void>();
  private fail(message:string){
    const error=new Error(message);this.info={...this.info,status:'error',error:message};
    for(const pending of this.pending.values())pending.reject(error);this.pending.clear();this.emit();
  }
  private ensureWorker(){
    if(this.worker)return this.worker;
    this.info={...this.info,status:'loading',error:undefined};this.emit();
    const worker=new Worker(new URL('./BancFullWorker.ts',import.meta.url),{type:'module',name:'agp-banc-v888'});
    worker.onmessage=(event:MessageEvent<WorkerReply>)=>this.onMessage(event.data);
    worker.onerror=event=>this.fail(event.message||'BANC worker failed');
    const baseUrl=new URL('connectome/banc-v888-full/',document.baseURI).href;
    worker.postMessage({type:'init',baseUrl});this.worker=worker;return worker;
  }
  private onMessage(message:WorkerReply){
    if(message.type==='ready'){
      if(message.materialization!==888||message.neurons!==188508||message.edges!==11510975){this.fail(`BANC graph identity mismatch: v${message.materialization}, ${message.neurons} rows, ${message.edges} pairs`);return;}
      this.info={status:'ready',neurons:message.neurons,edges:message.edges,materialization:message.materialization,runtimeBytes:message.runtimeBytes};this.emit();return;
    }
    if(message.type==='error'){this.fail(message.message);return}
    const pending=this.pending.get(message.requestId);if(!pending)return;this.pending.delete(message.requestId);
    if(message.type==='decision-error')pending.reject(new Error(message.message));else pending.resolve(message.result);
  }
  private emit(){const value=this.getInfo();for(const listener of this.listeners)listener(value)}
  preload(){this.ensureWorker()}
  ready(timeoutMs=120000):Promise<BancRuntimeInfo>{
    this.ensureWorker();
    return new Promise((resolve,reject)=>{
      let timer:number|undefined;
      const finish=()=>{if(timer!==undefined)clearTimeout(timer);this.listeners.delete(listener)};
      const listener=(value:BancRuntimeInfo)=>{
        if(value.status==='ready'){finish();resolve(value)}
        else if(value.status==='error'){finish();reject(new Error(value.error||'Full BANC v888 runtime failed to initialise'))}
      };
      this.listeners.add(listener);listener(this.getInfo());
      if(this.info.status!=='ready'&&this.info.status!=='error')timer=globalThis.setTimeout(()=>{finish();reject(new Error('Full BANC v888 graph did not become ready before the safety timeout'))},timeoutMs) as unknown as number;
    });
  }
  decide(driverKey:string,seed:number,sensors:number[],calibration:number[]){
    if(this.info.status!=='ready')return Promise.reject(new Error(`Full BANC v888 runtime is ${this.info.status}; race control is blocked until the complete graph is ready`));
    const worker=this.ensureWorker(),requestId=++this.sequence;
    return new Promise<BancDecisionResult>((resolve,reject)=>{this.pending.set(requestId,{resolve,reject});worker.postMessage({type:'decide',requestId,driverKey,seed,sensors,calibration})});
  }
  disposeDriver(driverKey:string){this.worker?.postMessage({type:'dispose',driverKey})}
  subscribe(listener:(v:BancRuntimeInfo)=>void){this.listeners.add(listener);listener(this.getInfo());return()=>this.listeners.delete(listener)}
  getInfo(){return{...this.info}}
}

export const bancRuntime=new BancRuntimeClient();
export const preloadBancRuntime=()=>bancRuntime.preload();
export const ensureBancRuntimeReady=(timeoutMs?:number)=>bancRuntime.ready(timeoutMs);

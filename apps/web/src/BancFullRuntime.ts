export interface BancDecisionResult{
  steering:number;throttle:number;brake:number;energyDeploy:number;activeNeurons:number;spikeRate:number;visualActivity:number;descendingActivity:number;calibration:number[];decisions:number;
}
export interface BancRuntimeInfo{status:'idle'|'loading'|'ready'|'error';neurons:number;edges:number;materialization:number;runtimeBytes:number;error?:string}
type WorkerReply={type:'ready';neurons:number;edges:number;materialization:number;runtimeBytes:number}|{type:'error';message:string}|{type:'decision';requestId:number;result:BancDecisionResult;neurons:number;edges:number;materialization:number}|{type:'decision-error';requestId:number;message:string};

class BancRuntimeClient{
  private worker:Worker|null=null;private sequence=0;private pending=new Map<number,{resolve:(v:BancDecisionResult)=>void;reject:(e:Error)=>void}>();
  private info:BancRuntimeInfo={status:'idle',neurons:0,edges:0,materialization:888,runtimeBytes:0};private listeners=new Set<(v:BancRuntimeInfo)=>void>();
  private ensureWorker(){
    if(this.worker)return this.worker;
    this.info={...this.info,status:'loading'};this.emit();
    const worker=new Worker(new URL('./BancFullWorker.ts',import.meta.url),{type:'module',name:'agp-banc-v888'});
    worker.onmessage=(event:MessageEvent<WorkerReply>)=>this.onMessage(event.data);
    worker.onerror=event=>{this.info={...this.info,status:'error',error:event.message||'BANC worker failed'};this.emit()};
    const baseUrl=new URL('connectome/banc-v888-full/',document.baseURI).href;
    worker.postMessage({type:'init',baseUrl});this.worker=worker;return worker;
  }
  private onMessage(message:WorkerReply){
    if(message.type==='ready'){this.info={status:'ready',neurons:message.neurons,edges:message.edges,materialization:message.materialization,runtimeBytes:message.runtimeBytes};this.emit();return}
    if(message.type==='error'){this.info={...this.info,status:'error',error:message.message};this.emit();return}
    const pending=this.pending.get(message.requestId);if(!pending)return;this.pending.delete(message.requestId);
    if(message.type==='decision-error')pending.reject(new Error(message.message));else pending.resolve(message.result);
  }
  private emit(){const value=this.getInfo();for(const listener of this.listeners)listener(value)}
  preload(){this.ensureWorker()}
  decide(driverKey:string,seed:number,sensors:number[],calibration:number[]){
    const worker=this.ensureWorker(),requestId=++this.sequence;
    return new Promise<BancDecisionResult>((resolve,reject)=>{this.pending.set(requestId,{resolve,reject});worker.postMessage({type:'decide',requestId,driverKey,seed,sensors,calibration})});
  }
  disposeDriver(driverKey:string){this.worker?.postMessage({type:'dispose',driverKey})}
  subscribe(listener:(v:BancRuntimeInfo)=>void){this.listeners.add(listener);listener(this.getInfo());return()=>this.listeners.delete(listener)}
  getInfo(){return{...this.info}}
}

export const bancRuntime=new BancRuntimeClient();
export const preloadBancRuntime=()=>bancRuntime.preload();

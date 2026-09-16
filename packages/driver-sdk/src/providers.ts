import { DecisionSchema,type DriverAdapter,type DriverDecision,type DriverObservation } from './index';
const SHARED_PROMPT=`You control an AGP-01 specification racing car. Finish as high as possible while obeying flags and avoiding unnecessary contact. Return JSON only with horizonSeconds, controls[{t,steering,throttle,brake}], energyDeploy, pitRequest, tyreRequest, strategyIntent, radio, memoryUpdate. Steering is -1..1; throttle, brake and energyDeploy are 0..1. You receive track geometry, never an ideal line. Your controls directly drive authoritative physics.`;
export class OpenAICompatibleDriver implements DriverAdapter{
  provider='OPENAI_COMPATIBLE';constructor(public id:string,public displayName:string,private baseUrl:string,private model:string,private apiKey?:string){}
  async initialize(){const r=await fetch(`${this.baseUrl.replace(/\/$/,'')}/models`,{headers:this.apiKey?{Authorization:`Bearer ${this.apiKey}`}:{}});if(!r.ok)throw new Error(`Provider unavailable (${r.status})`);}
  async decide(observation:DriverObservation,memory:string):Promise<DriverDecision>{const r=await fetch(`${this.baseUrl.replace(/\/$/,'')}/chat/completions`,{method:'POST',headers:{'content-type':'application/json',...(this.apiKey?{Authorization:`Bearer ${this.apiKey}`}:{})},body:JSON.stringify({model:this.model,temperature:0,messages:[{role:'system',content:SHARED_PROMPT},{role:'user',content:JSON.stringify({observation,memory})}],response_format:{type:'json_object'}})});if(!r.ok)throw new Error(`Decision failed (${r.status})`);const data=await r.json() as any;const text=data?.choices?.[0]?.message?.content;if(typeof text!=='string')throw new Error('Provider returned no decision');return DecisionSchema.parse(JSON.parse(text));}
  async shutdown(){}
}
export class OllamaDriver extends OpenAICompatibleDriver{provider='OLLAMA';constructor(id:string,name:string,baseUrl:string,model:string){super(id,name,`${baseUrl.replace(/\/$/,'')}/v1`,model);}}
export { SHARED_PROMPT };

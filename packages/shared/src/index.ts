export const VERSION = {
  sim: '0.1.0', car: 'AGP-01/0.1', track: 'AZURE-COAST/0.1', protocol: 'AGP-DRIVER/1', prompt: 'AGP-PROMPT/1'
} as const;
export type Surface = 'asphalt' | 'kerb' | 'grass' | 'gravel';
export type RaceFlag = 'GREEN' | 'YELLOW' | 'CHEQUERED';
export interface Control { steering: number; throttle: number; brake: number; energyDeploy: number; }
export interface TyreState { temperature: number; wear: number; slipRatio: number; slipAngle: number; locked: boolean; punctured: boolean; }
export interface CarState {
  id:string; number:number; name:string; colour:string; x:number; z:number; yaw:number; speed:number; vx:number; vz:number;
  lap:number; progress:number; position:number; lastLap:number|null; bestLap:number|null; sector:number; damage:number; frontWing:number;
  battery:number; surface:Surface; tyres:TyreState[]; controls:Control; status:'RUNNING'|'FINISHED'|'RETIRED';
}
export interface RaceState { time:number; tick:number; flag:RaceFlag; laps:number; cars:CarState[]; seed:number; }

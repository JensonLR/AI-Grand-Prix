export const VERSION = {
  sim: '0.1.0', car: 'AGP-01/0.1', track: 'AZURE-COAST/0.1', protocol: 'AGP-DRIVER/1', prompt: 'AGP-PROMPT/1'
} as const;
export type Surface = 'asphalt' | 'kerb' | 'grass' | 'gravel';
export type RaceFlag = 'GREEN' | 'YELLOW' | 'CHEQUERED';
export type Weather = 'CLEAR' | 'OVERCAST' | 'RAIN';
export type SessionType = 'QUICK_RACE' | 'GRAND_PRIX' | 'TIME_TRIAL' | 'BENCHMARK' | 'HUMAN_TEST';
export type TyreCompound = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET';
export interface RaceConfig { session:SessionType; laps:number; entrants:number; weather:Weather; seed:number; humanCarId?:string; }
export interface Control { steering: number; throttle: number; brake: number; energyDeploy: number; }
export interface TyreState { temperature: number; wear: number; slipRatio: number; slipAngle: number; locked: boolean; punctured: boolean; }
export interface CarState {
  id:string; number:number; name:string; colour:string; x:number; z:number; yaw:number; speed:number; vx:number; vz:number;
  lap:number; progress:number; position:number; lastLap:number|null; bestLap:number|null; sector:number; damage:number; frontWing:number;
  battery:number; surface:Surface; tyres:TyreState[]; controls:Control; status:'RUNNING'|'FINISHED'|'RETIRED';
  compound:TyreCompound; pitStops:number; penaltySeconds:number; fuel:number;
}
export interface RaceIncident { id:string; time:number; lap:number; type:'CONTACT'|'OFF_TRACK'|'PENALTY'|'PIT'|'FINISH'; cars:string[]; severity:'LOW'|'MEDIUM'|'HIGH'; }
export interface RaceState { time:number; tick:number; flag:RaceFlag; laps:number; cars:CarState[]; seed:number; weather:Weather; wetness:number; incidents:RaceIncident[]; }

export interface ReplayCarFrame { id:string;x:number;z:number;yaw:number;speed:number;lap:number;position:number;status:CarState['status']; }
export interface ReplayFrame { t:number;cars:ReplayCarFrame[]; }
export interface ReplayFile { format:'AGPR/1';createdAt:string;classification:'VALID BENCHMARK'|'NON-BENCHMARK';reason:string;versions:typeof VERSION;seed:number;laps:number;frames:ReplayFrame[];events:unknown[]; }

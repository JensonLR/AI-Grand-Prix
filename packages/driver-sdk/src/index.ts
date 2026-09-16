import { z } from 'zod';
import type { CarState, Control, RaceState } from '@agp/shared';
import { nearestTrack, trackPoint, trackTangent, clamp } from '@agp/sim-core';

export const DecisionSchema=z.object({horizonSeconds:z.number().min(.25).max(6),controls:z.array(z.object({t:z.number().min(0).max(6),steering:z.number(),throttle:z.number(),brake:z.number()})).min(1).max(16),energyDeploy:z.number().default(0),pitRequest:z.boolean().default(false),tyreRequest:z.enum(['SOFT','MEDIUM','HARD','INTERMEDIATE','WET']).nullable().default(null),strategyIntent:z.string().max(180).default(''),radio:z.string().max(180).default(''),memoryUpdate:z.string().max(8000).default('')});
export type DriverDecision=z.infer<typeof DecisionSchema>;
export interface DriverObservation{car:CarState;race:{time:number;lap:number;position:number;flag:string};track:Array<{distance:number;headingDelta:number;leftBoundary:number;rightBoundary:number}>;nearby:Array<{id:string;distance:number;relativeSpeed:number}>;}
export interface DriverAdapter{id:string;provider:string;displayName:string;initialize():Promise<void>;decide(observation:DriverObservation,memory:string):Promise<DriverDecision>;shutdown():Promise<void>;}
export function observe(state:RaceState,car:CarState):DriverObservation{
  const samples=[0,10,20,40,60,80,120,160,220,300].map(distance=>{const advance=distance/610;const tan=trackTangent((car.progress+advance)%1);let d=tan.yaw-car.yaw;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return{distance,headingDelta:d,leftBoundary:6.5,rightBoundary:6.5};});
  return {car,race:{time:state.time,lap:car.lap,position:car.position,flag:state.flag},track:samples,nearby:state.cars.filter(c=>c.id!==car.id).map(c=>({id:c.id,distance:Math.hypot(c.x-car.x,c.z-car.z),relativeSpeed:c.speed-car.speed})).filter(c=>c.distance<80)};
}
export class DeterministicDriver implements DriverAdapter{
  provider='OFFLINE'; displayName:string; constructor(public id:string,name:string,private temperament=0){this.displayName=name;}
  async initialize(){} async shutdown(){}
  async decide(o:DriverObservation):Promise<DriverDecision>{const c=o.car,look=clamp(.012+c.speed/1250,.014,.075),target=trackPoint((nearestTrack(c.x,c.z).t+look)%1),desired=Math.atan2(target.x-c.x,target.z-c.z);let error=desired-c.yaw;while(error>Math.PI)error-=Math.PI*2;while(error<-Math.PI)error+=Math.PI*2;const corner=Math.abs(o.track[5].headingDelta);const targetSpeed=clamp(83-corner*38+this.temperament*2,24,92);const brake=clamp((c.speed-targetSpeed)/15,0,1);const throttle=clamp((targetSpeed-c.speed)/16+.42,0,1)*(1-brake);return {horizonSeconds:.25,controls:[{t:0,steering:clamp(error*2.7,-1,1),throttle,brake}],energyDeploy:c.battery>.18&&throttle>.8?.7:0,pitRequest:false,tyreRequest:null,strategyIntent:'RACE',radio:'',memoryUpdate:''};}
}
export function decisionToControl(d:DriverDecision):Control{const p=d.controls[0];return{steering:clamp(p.steering,-1,1),throttle:clamp(p.throttle,0,1),brake:clamp(p.brake,0,1),energyDeploy:clamp(d.energyDeploy,0,1)};}

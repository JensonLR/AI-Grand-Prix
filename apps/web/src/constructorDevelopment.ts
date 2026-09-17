import type { ConstructorTuning } from '@agp/shared';
import { clamp } from '@agp/sim-core';
import type { Team } from './championship';

export const DEVELOPMENT_DIMENSIONS=['aeroEfficiency','downforce','mechanicalGrip','energySystem','braking','tyreManagement','reliability','controlResponse'] as const;
export type DevelopmentDimension=(typeof DEVELOPMENT_DIMENSIONS)[number];
export type DevelopmentAllocation=Record<DevelopmentDimension,number>;

const label=(k:DevelopmentDimension)=>({aeroEfficiency:'AERO EFFICIENCY',downforce:'DOWNFORCE',mechanicalGrip:'MECHANICAL GRIP',energySystem:'ENERGY SYSTEM',braking:'BRAKING',tyreManagement:'TYRE MANAGEMENT',reliability:'RELIABILITY',controlResponse:'NEURAL RESPONSE'}[k]);

function exactHundred(raw:Record<DevelopmentDimension,number>):DevelopmentAllocation{
  const entries=DEVELOPMENT_DIMENSIONS.map(k=>[k,Math.max(1,raw[k])] as const),sum=entries.reduce((n,[,v])=>n+v,0);
  const scaled=entries.map(([k,v])=>[k,v/sum*100] as const),out=Object.fromEntries(scaled.map(([k,v])=>[k,Math.floor(v)])) as DevelopmentAllocation;
  let left=100-DEVELOPMENT_DIMENSIONS.reduce((n,k)=>n+out[k],0);
  for(const [k] of [...scaled].sort((a,b)=>(b[1]%1)-(a[1]%1))){if(left--<=0)break;out[k]++;}
  return out;
}

export function baseDevelopment(team:Team):DevelopmentAllocation{
  const raw={} as Record<DevelopmentDimension,number>;
  for(const k of DEVELOPMENT_DIMENSIONS)raw[k]=12.5+(team.tuning[k]-1)*320;
  return exactHundred(raw);
}

export interface ConstructorDevelopmentPackage{
  round:number;
  totalBudget:100;
  allocation:DevelopmentAllocation;
  baseAllocation:DevelopmentAllocation;
  focus:DevelopmentDimension[];
  releasedPoints:number;
  packageName:string;
  tuning:ConstructorTuning;
}

/**
 * Every team always owns exactly the same 100 development points. Across the season it may
 * redistribute a small number of points from its weakest initial area toward its two strongest
 * engineering philosophies. That is a trade-off, not a free horsepower upgrade.
 */
export function constructorDevelopment(team:Team,round:number):ConstructorDevelopmentPackage{
  const base=baseDevelopment(team),allocation={...base},rank=[...DEVELOPMENT_DIMENSIONS].sort((a,b)=>team.tuning[b]-team.tuning[a]),focus=rank.slice(0,2),weak=[...rank].reverse();
  const moves=Math.min(7,Math.floor(Math.max(0,round-1)/3));
  for(let i=0;i<moves;i++){
    const target=focus[i%focus.length],source=weak.find(k=>k!==target&&allocation[k]>6);
    if(!source)break;allocation[source]--;allocation[target]++;
  }
  const tuning={...team.tuning};
  for(const k of DEVELOPMENT_DIMENSIONS)tuning[k]=clamp(team.tuning[k]+(allocation[k]-base[k])*.00042,.985,1.015);
  const releasedPoints=DEVELOPMENT_DIMENSIONS.reduce((n,k)=>n+Math.max(0,allocation[k]-base[k]),0);
  return{round,totalBudget:100,allocation,baseAllocation:base,focus,releasedPoints,packageName:`R${String(round).padStart(2,'0')} · ${label(focus[0])} / ${label(focus[1])}`,tuning};
}

export const developmentLabel=label;

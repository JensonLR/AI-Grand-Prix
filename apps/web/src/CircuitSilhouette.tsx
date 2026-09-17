import { trackPoint } from '@agp/sim-core';

export function CircuitSilhouette({trackId,className='',cars}:{trackId:string;className?:string;cars?:Array<{x:number;z:number;colour:string}>}){
  const pts=Array.from({length:180},(_,i)=>trackPoint(i/180,trackId));
  const minX=Math.min(...pts.map(p=>p.x)),maxX=Math.max(...pts.map(p=>p.x)),minZ=Math.min(...pts.map(p=>p.z)),maxZ=Math.max(...pts.map(p=>p.z));
  const span=Math.max(maxX-minX,maxZ-minZ)||1,ox=(100-(maxX-minX)/span*82)/2,oz=(100-(maxZ-minZ)/span*82)/2;
  const sx=(x:number)=>ox+(x-minX)/span*82,sz=(z:number)=>oz+(z-minZ)/span*82;
  const path=pts.map((p,i)=>`${i?'L':'M'} ${sx(p.x).toFixed(2)} ${sz(p.z).toFixed(2)}`).join(' ')+' Z';
  return <svg className={`agp-circuit-silhouette ${className}`.trim()} viewBox="0 0 100 100" aria-label="Circuit layout">
    <path className="circuit-glow" d={path}/><path className="circuit-main" d={path}/>
    <circle className="circuit-start" cx={sx(pts[0].x)} cy={sz(pts[0].z)} r="1.75"/>
    {cars?.map((c,i)=><circle key={i} className="circuit-car" cx={sx(c.x)} cy={sz(c.z)} r="1.15" style={{fill:c.colour}}/>)}
  </svg>
}

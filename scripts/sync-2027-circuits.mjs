import { mkdir,writeFile,readFile } from 'node:fs/promises';
import { dirname,resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,'..');
const output=resolve(root,'packages/sim-core/src/generated/season2027.ts');
const publicOutput=resolve(root,'apps/web/public/tracks/season2027.json');
const sourceBase='https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits';
const SIM_LAP_LENGTH=780;

const calendar=[
  ['bh-2002','Bahrain','Sakhir','Bahrain Grand Prix','12–14 Mar',true],
  ['sa-2021','Saudi Arabia','Jeddah','Saudi Arabian Grand Prix','19–21 Mar',false],
  ['au-1953','Australia','Melbourne','Australian Grand Prix','2–4 Apr',true],
  ['jp-1962','Japan','Suzuka','Japanese Grand Prix','9–11 Apr',true],
  ['cn-2004','China','Shanghai','Chinese Grand Prix','16–18 Apr',false],
  ['us-2022','United States','Miami','Miami Grand Prix','30 Apr–2 May',false],
  ['ca-1978','Canada','Montréal','Canadian Grand Prix','21–23 May',true],
  ['mc-1929','Monaco','Monaco','Monaco Grand Prix','4–6 Jun',true],
  ['pt-2008','Portugal','Portimão','Portuguese Grand Prix','18–20 Jun',false],
  ['gb-1948','Great Britain','Silverstone','British Grand Prix','2–4 Jul',true],
  ['at-1969','Austria','Spielberg','Austrian Grand Prix','9–11 Jul',false],
  ['be-1925','Belgium','Spa-Francorchamps','Belgian Grand Prix','23–25 Jul',false],
  ['hu-1986','Hungary','Budapest','Hungarian Grand Prix','30 Jul–1 Aug',false],
  ['it-1922','Italy','Monza','Italian Grand Prix','3–5 Sep',true],
  ['es-2026','Spain','Madrid','Spanish Grand Prix','10–12 Sep',false],
  ['az-2016','Azerbaijan','Baku','Azerbaijan Grand Prix','24–26 Sep',false],
  ['tr-2005','Türkiye','Istanbul','Turkish Grand Prix','1–3 Oct',false],
  ['sg-2008','Singapore','Singapore','Singapore Grand Prix','8–10 Oct',false],
  ['us-2012','United States','Austin','United States Grand Prix','22–24 Oct',false],
  ['mx-1962','Mexico','Mexico City','Mexico City Grand Prix','29–31 Oct',false],
  ['br-1940','Brazil','São Paulo','São Paulo Grand Prix','5–7 Nov',true],
  ['us-2023','United States','Las Vegas','Las Vegas Grand Prix','19–21 Nov',false],
  ['qa-2004','Qatar','Lusail','Qatar Grand Prix','3–5 Dec',true],
  ['ae-2009','United Arab Emirates','Yas Marina','Abu Dhabi Grand Prix','10–12 Dec',true]
];

function resample(points,count){
  const closed=[...points];
  const a=closed[0],b=closed.at(-1);
  if(a[0]!==b[0]||a[1]!==b[1])closed.push([...a]);
  const cumulative=[0];
  for(let i=1;i<closed.length;i++)cumulative[i]=cumulative[i-1]+Math.hypot(closed[i][0]-closed[i-1][0],closed[i][1]-closed[i-1][1]);
  const total=cumulative.at(-1)||1,out=[];
  let seg=1;
  for(let i=0;i<count;i++){
    const target=total*i/count;
    while(seg<cumulative.length-1&&cumulative[seg]<target)seg++;
    const lo=seg-1,span=cumulative[seg]-cumulative[lo]||1,mix=(target-cumulative[lo])/span;
    out.push([closed[lo][0]+(closed[seg][0]-closed[lo][0])*mix,closed[lo][1]+(closed[seg][1]-closed[lo][1])*mix]);
  }
  return out;
}

function normalise(coords){
  const lat0=coords.reduce((n,p)=>n+p[1],0)/coords.length*Math.PI/180;
  const lon0=coords.reduce((n,p)=>n+p[0],0)/coords.length;
  const latMean=coords.reduce((n,p)=>n+p[1],0)/coords.length;
  const metres=coords.map(([lon,lat])=>[(lon-lon0)*111320*Math.cos(lat0),-(lat-latMean)*110540]);
  const sampled=resample(metres,192);
  let length=0;for(let i=0;i<sampled.length;i++){const a=sampled[i],b=sampled[(i+1)%sampled.length];length+=Math.hypot(b[0]-a[0],b[1]-a[1]);}
  const scale=SIM_LAP_LENGTH/(length||1);
  return sampled.map(([x,z])=>[+(x*scale).toFixed(3),+(z*scale).toFixed(3)]);
}

async function fetchCircuit(id){
  const url=`${sourceBase}/${id}.geojson`;
  const response=await fetch(url,{headers:{'user-agent':'AI-Grand-Prix circuit sync'}});
  if(!response.ok)throw new Error(`${id}: ${response.status} ${response.statusText}`);
  const json=await response.json();
  const feature=json.features?.[0];
  if(!feature?.geometry?.coordinates?.length)throw new Error(`${id}: missing LineString geometry`);
  return {url,feature};
}

const previous=await readFile(output,'utf8').catch(()=>null);
try{
  const tracks=[];
  for(let i=0;i<calendar.length;i++){
    const [id,country,venue,grandPrix,dates,sprint]=calendar[i];
    const {url,feature}=await fetchCircuit(id);
    tracks.push({
      id,round:i+1,country,venue,grandPrix,dates,sprint,
      circuitName:feature.properties?.Name??venue,
      officialLengthM:Number(feature.properties?.length)||null,
      altitudeM:Number(feature.properties?.altitude)||0,
      source:url,
      points:normalise(feature.geometry.coordinates)
    });
  }
  const banner=`// GENERATED FILE — scripts/sync-2027-circuits.mjs\n// Calendar order: FIA/F1 2027 announcement, 16 Sep 2026.\n// Geometry: bacinger/f1-circuits (MIT), normalised for AGP simulation scale.\n`;
  const ts=`${banner}export interface SeasonTrack { id:string; round:number; country:string; venue:string; grandPrix:string; dates:string; sprint:boolean; circuitName:string; officialLengthM:number|null; altitudeM:number; source:string; points:readonly (readonly [number,number])[]; }\nexport const SEASON_2027_TRACKS=${JSON.stringify(tracks)} as const satisfies readonly SeasonTrack[];\nexport const DEFAULT_2027_TRACK_ID=SEASON_2027_TRACKS[0].id;\n`;
  await mkdir(dirname(output),{recursive:true});
  await writeFile(output,ts);
  await mkdir(dirname(publicOutput),{recursive:true});
  await writeFile(publicOutput,JSON.stringify({schema:'AGP-TRACK-SEASON/1',season:2027,calendarSource:'FIA / Formula 1, announced 2026-09-16',geometrySource:'bacinger/f1-circuits, MIT',simulationLapLength:SIM_LAP_LENGTH,tracks},null,2));
  console.log(`Synced ${tracks.length} 2027 circuits.`);
}catch(error){
  if(previous){console.warn(`Circuit sync unavailable; retaining committed dataset. ${error}`);process.exitCode=0;}
  else throw error;
}

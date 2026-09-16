import { readFileSync,writeFileSync } from 'node:fs';
const path='packages/driver-sdk/src/index.ts';
let source=readFileSync(path,'utf8');
source=source.replace("import { TRACK_LENGTH,TRACK_WIDTH,clamp,trackPoint,trackTangent,wrapAngle } from '@agp/sim-core';","import { TRACK_WIDTH,clamp,trackLength,trackPoint,trackTangent,wrapAngle } from '@agp/sim-core';");
source=source.replace('  const centre=trackPoint(car.progress),local=trackTangent(car.progress);','  const trackId=state.trackId;\n  const centre=trackPoint(car.progress,trackId),local=trackTangent(car.progress,trackId),lapLength=trackLength(trackId);');
source=source.replace('    const tan=trackTangent((car.progress+distance/TRACK_LENGTH)%1);','    const tan=trackTangent((car.progress+distance/lapLength)%1,trackId);');
writeFileSync(path,source);

import { readFileSync,writeFileSync } from 'node:fs';

const path='apps/web/src/ChampionshipApp.tsx';
let source=readFileSync(path,'utf8');
source=source.replace(
  '<div className="race-progress"><i style={{width:`${progress}%`}}/></header>',
  '<div className="race-progress"><i style={{width:`${progress}%`}}/></div></header>'
);
writeFileSync(path,source);

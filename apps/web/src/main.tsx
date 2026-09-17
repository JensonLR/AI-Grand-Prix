import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './restore-agp01';
import './quality-v4';
import { ChampionshipApp } from './ChampionshipApp';
import './styles.css';
import './championship.css';
import './weekend.css';
import './phenotype.css';
import './season.css';
import './premium.css';
import './constructor-marks.css';
import './development.css';
import './product-v2.css';
import './race-viewport.css';
import './podium.css';
import './final-polish.css';
import './mobile-restoration.css';
import './experience-v4.css';
import './experience-v4-ux.css';
import './mobile-race-v5.css';
import './mobile-championship-v6.css';
import './mobile-entire-app-v7.css';

createRoot(document.getElementById('root')!).render(<StrictMode><ChampionshipApp/></StrictMode>);

const hosted=location.protocol==='https:'||(location.protocol==='http:'&&!['localhost','127.0.0.1'].includes(location.hostname));
if(hosted&&'serviceWorker' in navigator){
  addEventListener('load',()=>{void navigator.serviceWorker.register(new URL('sw.js',document.baseURI)).catch(()=>undefined)},{once:true});
}

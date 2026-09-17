import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
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

createRoot(document.getElementById('root')!).render(<StrictMode><ChampionshipApp/></StrictMode>);

if(import.meta.env.PROD&&'serviceWorker' in navigator){
  addEventListener('load',()=>{void navigator.serviceWorker.register(new URL('sw.js',document.baseURI)).catch(()=>undefined)},{once:true});
}

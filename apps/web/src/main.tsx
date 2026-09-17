import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChampionshipApp } from './ChampionshipApp';
import { preloadBancRuntime } from './BancFullRuntime';
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

preloadBancRuntime();
createRoot(document.getElementById('root')!).render(<StrictMode><ChampionshipApp/></StrictMode>);

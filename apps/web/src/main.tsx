import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChampionshipApp } from './ChampionshipApp';
import './styles.css';
import './championship.css';
import './weekend.css';
import './phenotype.css';
import './season.css';

createRoot(document.getElementById('root')!).render(<StrictMode><ChampionshipApp/></StrictMode>);

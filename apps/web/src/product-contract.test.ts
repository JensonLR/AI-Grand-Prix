import { readFileSync } from 'node:fs';
import { describe,expect,it } from 'vitest';

const read=(path:string)=>readFileSync(path,'utf8');

describe('Connectome World Championship product contract',()=>{
  it('keeps the restored GrandPrixScene as the visual source of truth',()=>{
    const adapter=read('apps/web/src/FlyGrandPrixScene.ts');
    expect(adapter).toContain("from './GrandPrixScene'");
    expect(adapter).toContain('extends GrandPrixScene');
    expect(adapter).toContain('CWC_DRIVERS');
  });

  it('ships the full 22-driver / 11-constructor registry',()=>{
    const registry=read('apps/web/src/championship.ts');
    expect((registry.match(/\['[^']+','[^']+',\d+,'[^']+'\]/g)??[]).length).toBe(22);
    expect(registry).toContain('McLARVAE RACING');
    expect(registry).toContain('CADDIS-LAC RACING');
  });

  it('has first-class mobile controls and safe-area handling',()=>{
    const base=read('apps/web/src/championship.css');
    const weekend=read('apps/web/src/weekend.css');
    expect(base).toContain('@media (max-width:760px)');
    expect(base).toContain('.touch-drive');
    expect(base).toContain('landscape');
    expect(weekend).toContain('safe-area-inset-bottom');
    expect(weekend).toContain('touch-action:none');
  });

  it('contains real weekend progression and inspectable phenotype UI',()=>{
    const app=read('apps/web/src/ChampionshipApp.tsx');
    expect(app).toContain('WeekendPanel');
    expect(app).toContain('qualifyingOrder');
    expect(app).toContain('gridOrder');
    expect(app).toContain('PhenotypeInspector');
  });
});

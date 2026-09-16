import { describe,expect,it } from 'vitest';
import { TRACKS_2027,getTrackDefinition,nearestTrack,trackLength,trackPoint,trackTangent } from './index';

describe('2027 multitrack championship',()=>{
  it('contains exactly 24 rounds in published order',()=>{
    expect(TRACKS_2027).toHaveLength(24);
    expect(TRACKS_2027.map(t=>t.round)).toEqual(Array.from({length:24},(_,i)=>i+1));
    expect(TRACKS_2027[0].venue).toBe('Sakhir');
    expect(TRACKS_2027.at(-1)?.venue).toBe('Yas Marina');
  });

  it('has ten marked Sprint venues',()=>{
    expect(TRACKS_2027.filter(t=>t.sprint)).toHaveLength(10);
  });

  it('provides finite driveable geometry for every circuit',()=>{
    for(const track of TRACKS_2027){
      expect(track.points.length).toBeGreaterThanOrEqual(64);
      expect(trackLength(track.id)).toBeGreaterThan(500);
      for(const t of [0,.07,.2,.41,.63,.82,.98]){
        const p=trackPoint(t,track.id),tan=trackTangent(t,track.id),nearest=nearestTrack(p.x,p.z,t,track.id);
        expect(Number.isFinite(p.x)&&Number.isFinite(p.z)).toBe(true);
        expect(Number.isFinite(tan.yaw)).toBe(true);
        expect(nearest.distance).toBeLessThan(.8);
      }
    }
  });

  it('resolves unknown circuit ids safely to the season opener',()=>{
    expect(getTrackDefinition('missing').id).toBe(TRACKS_2027[0].id);
  });
});

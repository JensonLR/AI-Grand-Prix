import * as THREE from 'three';
import type { Weather } from '@agp/shared';

export class PremiumWeather {
  private rain:THREE.Points;
  private material:THREE.PointsMaterial;
  private positions:Float32Array;
  private intensity=0;
  constructor(private scene:THREE.Scene,private lowPower:boolean){
    const count=lowPower?320:900;this.positions=new Float32Array(count*3);
    for(let i=0;i<count;i++){this.positions[i*3]=(Math.random()-.5)*180;this.positions[i*3+1]=Math.random()*75;this.positions[i*3+2]=(Math.random()-.5)*180;}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.positions,3));
    this.material=new THREE.PointsMaterial({color:'#d8eaff',size:lowPower ? .08 : .115,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true});
    this.rain=new THREE.Points(geo,this.material);this.rain.frustumCulled=false;this.rain.visible=false;scene.add(this.rain);
  }
  setWeather(weather:Weather){
    this.intensity=weather==='HEAVY_RAIN'?1:weather==='RAIN' ? .72 : weather==='LIGHT_RAIN' ? .44 : weather==='DRYING' ? .18 : 0;
    this.rain.visible=this.intensity>0;this.material.opacity=.2+this.intensity*.58;
  }
  update(_time:number,camera:THREE.Camera){
    if(!this.rain.visible)return;this.rain.position.x=camera.position.x;this.rain.position.z=camera.position.z;
    const p=this.positions,fall=(this.lowPower?1.05:1.42)*(1+this.intensity*1.8);
    for(let i=0;i<p.length;i+=3){p[i+1]-=fall;if(p[i+1]<-4){p[i+1]=72+Math.random()*18;p[i]=(Math.random()-.5)*180;p[i+2]=(Math.random()-.5)*180;}}
    (this.rain.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate=true;
  }
  dispose(){this.scene.remove(this.rain);this.rain.geometry.dispose();this.material.dispose();}
}

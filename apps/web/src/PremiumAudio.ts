export class PremiumRaceAudio {
  private ctx:AudioContext|null=null;
  private master:GainNode|null=null;
  private engineGain:GainNode|null=null;
  private windGain:GainNode|null=null;
  private tyreGain:GainNode|null=null;
  private neuralGain:GainNode|null=null;
  private engine:OscillatorNode[]=[];
  private neural:OscillatorNode|null=null;
  private wind:AudioBufferSourceNode|null=null;
  private tyre:AudioBufferSourceNode|null=null;
  private enabled=false;

  private noiseBuffer(ctx:AudioContext,seconds=2){
    const buffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate*seconds),ctx.sampleRate),d=buffer.getChannelData(0);
    let last=0;for(let i=0;i<d.length;i++){const white=Math.random()*2-1;last=last*.985+white*.015;d[i]=white*.58+last*.42;}return buffer;
  }

  async setEnabled(enabled:boolean){
    this.enabled=enabled;
    if(!enabled){if(this.master&&this.ctx)this.master.gain.setTargetAtTime(0,this.ctx.currentTime,.04);return;}
    if(!this.ctx){
      const ctx=this.ctx=new AudioContext(),master=this.master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
      const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-18;compressor.knee.value=16;compressor.ratio.value=4;compressor.attack.value=.004;compressor.release.value=.16;compressor.connect(master);

      const engineGain=this.engineGain=ctx.createGain();engineGain.gain.value=.18;const engineFilter=ctx.createBiquadFilter();engineFilter.type='lowpass';engineFilter.frequency.value=3200;engineFilter.Q.value=.8;engineGain.connect(engineFilter).connect(compressor);
      const waves:OscillatorType[]=['sawtooth','triangle','sine'];
      this.engine=waves.map((wave,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=wave;g.gain.value=[.42,.25,.12][i];o.connect(g).connect(engineGain);o.start();return o;});

      const windGain=this.windGain=ctx.createGain(),windFilter=ctx.createBiquadFilter();windFilter.type='highpass';windFilter.frequency.value=900;windFilter.Q.value=.55;windGain.gain.value=0;windGain.connect(windFilter).connect(compressor);this.wind=ctx.createBufferSource();this.wind.buffer=this.noiseBuffer(ctx);this.wind.loop=true;this.wind.connect(windGain);this.wind.start();

      const tyreGain=this.tyreGain=ctx.createGain(),tyreFilter=ctx.createBiquadFilter();tyreFilter.type='bandpass';tyreFilter.frequency.value=1250;tyreFilter.Q.value=1.5;tyreGain.gain.value=0;tyreGain.connect(tyreFilter).connect(compressor);this.tyre=ctx.createBufferSource();this.tyre.buffer=this.noiseBuffer(ctx,1.2);this.tyre.loop=true;this.tyre.connect(tyreGain);this.tyre.start();

      this.neuralGain=ctx.createGain();this.neuralGain.gain.value=0;const neuralFilter=ctx.createBiquadFilter();neuralFilter.type='bandpass';neuralFilter.frequency.value=480;neuralFilter.Q.value=5;this.neuralGain.connect(neuralFilter).connect(compressor);this.neural=ctx.createOscillator();this.neural.type='sine';this.neural.connect(this.neuralGain);this.neural.start();
    }
    await this.ctx.resume();this.master!.gain.setTargetAtTime(.72,this.ctx.currentTime,.08);
  }

  update(speed:number,throttle:number,wetness:number,paused:boolean,spikeRate=0,slip=0){
    const ctx=this.ctx;if(!ctx||!this.master)return;const now=ctx.currentTime;
    const rpmNorm=Math.min(1,Math.max(0,speed/92*.72+throttle*.38)),base=74+rpmNorm*188;
    this.engine[0]?.frequency.setTargetAtTime(base,now,.025);this.engine[1]?.frequency.setTargetAtTime(base*2.02,now,.028);this.engine[2]?.frequency.setTargetAtTime(base*3.97,now,.032);
    this.engineGain?.gain.setTargetAtTime(paused?.015:.075+.14*throttle+.09*rpmNorm,now,.045);
    this.windGain?.gain.setTargetAtTime(paused?0:Math.pow(Math.min(1,speed/85),1.7)*.13,now,.08);
    const scrub=Math.min(1,Math.max(0,slip)+Math.max(0,speed-48)/160+wetness*.12);this.tyreGain?.gain.setTargetAtTime(paused?0:scrub*.055,now,.03);
    if(this.neural&&this.neuralGain){this.neural.frequency.setTargetAtTime(180+Math.min(1,spikeRate/24)*520,now,.08);this.neuralGain.gain.setTargetAtTime(paused?0:Math.min(.018,.002+spikeRate*.00045),now,.12);}
    if(this.enabled)this.master.gain.setTargetAtTime(paused?.24:.72,now,.08);
  }

  uiPulse(success=true){const ctx=this.ctx;if(!ctx||!this.enabled)return;const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(success?420:210,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(success?720:145,ctx.currentTime+.11);g.gain.setValueAtTime(.035,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.16);o.connect(g).connect(this.master!);o.start();o.stop(ctx.currentTime+.17);}

  dispose(){for(const o of this.engine){try{o.stop();}catch{}}try{this.neural?.stop();}catch{}try{this.wind?.stop();}catch{}try{this.tyre?.stop();}catch{}void this.ctx?.close();this.ctx=null;this.master=null;}
}

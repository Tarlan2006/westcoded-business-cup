import assert from 'node:assert/strict';
const contexts = [], spoken = [], requests = [];
class Param { value = 0; setTargetAtTime(v) { this.value = v; } setValueAtTime(v) { this.value = v; } linearRampToValueAtTime(v) { this.value = v; } cancelScheduledValues() {} }
class Node { connect(target) { return target; } disconnect() { this.disconnected = true; } }
class Context {
  sampleRate = 1000; currentTime = 1; state = 'running'; destination = {}; sources = []; gains = [];
  constructor() { contexts.push(this); }
  createGain() { const n = Object.assign(new Node(), {gain:new Param()}); this.gains.push(n); return n; }
  createAnalyser() { return new Node(); }
  createBuffer(channels, length) { const data=new Float32Array(length); return { getChannelData:()=>data, duration:length/this.sampleRate }; }
  createBufferSource() { const n=Object.assign(new Node(), {start(){this.started=true},stop(at){this.stopped=true;this.stopAt=at}}); this.sources.push(n); return n; }
  async resume() {}
}
globalThis.AudioContext = Context;
globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text=text; } };
globalThis.window = {setTimeout:()=>1,clearTimeout(){},speechSynthesis:{getVoices:()=>[{name:'Samantha',lang:'en-US',localService:true}],addEventListener(){},speak:u=>spoken.push(u),cancel(){}}};
globalThis.fetch = async url => { requests.push(url); return {ok:true,json:async()=>({clips:{}})}; };
const {setMusic,pauseMusic,unlock,speakFallback}=await import('../src/audio/engine.ts');
const {ambienceThemes,themeForActivity}=await import('../src/audio/ambienceThemes.ts');
setMusic(true,{theme:'cosmic'});assert.equal(contexts.length,0,'No AudioContext/autoplay before gesture');
await unlock();const c=contexts[0], bus=c.gains[1];
const active=()=>c.sources.filter(s=>s.loop&&!s.stopped);
assert.equal(active().length,1);assert.equal(bus.gain.value,.028);
setMusic(true,{theme:'cosmic'});assert.equal(active().length,1,'No duplicate loop');
for(const theme of Object.keys(ambienceThemes)) {
 setMusic(true,{theme});assert.equal(active().length,1);
 const samples=active()[0].buffer.getChannelData(0);assert.equal(samples[0],0);assert(Math.abs(samples.at(-1))<.00001);
 assert(samples.every(x=>Number.isFinite(x)&&Math.abs(x)<=1),'No NaN or clipping');
}
const mic=Symbol(),tab=Symbol();pauseMusic(mic,true);assert.equal(bus.gain.value,0);assert.equal(active().length,0);
pauseMusic(tab,true);pauseMusic(mic,false);assert.equal(active().length,0,'Another pause must keep silence');
pauseMusic(tab,false);assert.equal(active().length,1);
const speech=speakFallback('Hello, pal.');assert.equal(bus.gain.value,.004,'Speech ducks background');spoken.at(-1).onend();await speech;assert.equal(bus.gain.value,.028);
setMusic(false);assert.equal(active().length,0);assert.equal(bus.gain.value,0);
assert.equal(themeForActivity('space'),'cosmic');assert.equal(themeForActivity('quiz'),'curious');assert.equal(themeForActivity('sketch'),'studio');
assert(requests.every(p=>p==='/audio/manifest.json'),'Music must not fetch tracks or a remote service');
console.log('PASS nine music themes, gesture gate, single loop, fades, independent pause owners, speech ducking and mute');

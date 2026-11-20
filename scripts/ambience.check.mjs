import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const settle = () => new Promise(resolve => setTimeout(resolve, 0));
const contexts = [], spoken = [], requests = [];
class Param { value = 0; setTargetAtTime(v) { this.value = v; } setValueAtTime(v) { this.value = v; } linearRampToValueAtTime(v) { this.value = v; } cancelScheduledValues() {} }
class Node { connect(target) { return target; } disconnect() { this.disconnected = true; } }
class Context {
  sampleRate = 1000; currentTime = 1; state = 'running'; destination = {}; sources = []; gains = [];
  constructor() { contexts.push(this); }
  createGain() { const n = Object.assign(new Node(), {gain:new Param()}); this.gains.push(n); return n; }
  createAnalyser() { return new Node(); }
  createBuffer(channels, length) { const data=new Float32Array(length); return { getChannelData:()=>data, duration:length/this.sampleRate }; }
  createBufferSource() { const n=Object.assign(new Node(), {playbackRate:new Param(),start(){this.started=true},stop(at){this.stopped=true;this.stopAt=at}}); this.sources.push(n); return n; }
  async decodeAudioData() { return this.createBuffer(1,1000); }
  async resume() {}
}
globalThis.AudioContext = Context;
globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text=text; } };
globalThis.window = {setTimeout:()=>1,clearTimeout(){},speechSynthesis:{getVoices:()=>[{name:'Samantha',lang:'en-US',localService:true}],addEventListener(){},speak:u=>spoken.push(u),cancel(){}}};
globalThis.fetch = async url => { requests.push(url); return {ok:true,json:async()=>url.includes('voice-index')?{voice:'aidos-luna-v1',texts:{'Hello, pal.':'/audio/test.mp3'}}:{voice:'aidos-luna-v1',clips:{}},arrayBuffer:async()=>new ArrayBuffer(10)}; };
const {setMusic,pauseMusic,unlock,speakFallback}=await import('../src/audio/engine.ts');
const {ambienceThemes,themeForActivity}=await import('../src/audio/ambienceThemes.ts');
const {changeLanguage}=await import('../src/i18n/index.ts');
await changeLanguage('en', false);
setMusic(true,{theme:'cosmic'});assert.equal(contexts.length,0,'No AudioContext/autoplay before gesture');
await unlock();await settle();const c=contexts[0], bus=c.gains[1];
const active=()=>c.sources.filter(s=>s.loop&&!s.stopped);
assert.equal(active().length,1);assert.equal(bus.gain.value,.075);
setMusic(true,{theme:'cosmic'});assert.equal(active().length,1,'No duplicate loop');
const tracks = new Set();
for (const theme of Object.keys(ambienceThemes)) {
  setMusic(true, {theme});
  await settle();
  assert.equal(active().length, 1);
  assert(requests.includes('/audio/music/' + theme + '.mp3?v=1'));
  const file = await readFile('public/audio/music/' + theme + '.mp3');
  tracks.add(createHash('sha256').update(file).digest('hex'));
}
assert.equal(tracks.size, 9);
setMusic(true,{theme:'cosmic'});
setMusic(true,{theme:'studio'});
setMusic(false);
await settle();
assert.equal(active().length, 0, 'Stale downloads cannot restart muted music');
setMusic(true,{theme:'studio'});
await settle();
const mic=Symbol(),tab=Symbol();pauseMusic(mic,true);assert.equal(bus.gain.value,0);assert.equal(active().length,0);
pauseMusic(tab,true);pauseMusic(mic,false);assert.equal(active().length,0,'Another pause must keep silence');
pauseMusic(tab,false);assert.equal(active().length,1);
const speech=speakFallback('Hello, pal.');await new Promise(r=>setTimeout(r,0));assert.equal(bus.gain.value,.010,'Speech ducks background');c.sources.at(-1).onended();await speech;assert.equal(bus.gain.value,.075);
setMusic(false);assert.equal(active().length,0);assert.equal(bus.gain.value,0);
assert.equal(themeForActivity('space'),'cosmic');assert.equal(themeForActivity('quiz'),'curious');assert.equal(themeForActivity('sketch'),'studio');
assert(requests.every(p=>p.startsWith('/audio/')),'Cached speech and music need no external service');assert.equal(spoken.length,0,'No device speech');
console.log('PASS nine music themes, gesture gate, single loop, fades, independent pause owners, speech ducking and mute');

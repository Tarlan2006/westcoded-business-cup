import { readFileSync,writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { readClips } from './audio-content.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const normalize=s=>s.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu,'').replace(/\s+/g,' ').trim();
const rows=readClips().clips.map(r=>({...r,text:normalize(r.text)}));
const add=text=>{text=normalize(text);if(!rows.some(r=>r.text===text)){const id='voice_'+createHash('sha256').update(text).digest('hex').slice(0,16);rows.push({id,text,file:`/audio/unified/${id}.mp3`});}};
for(const q of read('content/quiz.json'))add(q.question);
for(const q of read('content/faq.json'))add(q.answer);
for(const c of read('src/games/sketch/cases.json'))for(const clue of c.clues)add(clue.text);
for(const o of read('src/games/space/objects.json'))add(`${o.name}. ${o.fact}`);
for(const path of ['src/screens/ToddlerMission.tsx','src/components/AnimalSounds.tsx']){
  const source=readFileSync(path,'utf8');for(const m of source.matchAll(/(?:speech|praise|line): "([^"]+)"/g))add(m[1]);
}
for(let n=1;n<=10;n++){add(`Yes! ${n} balloons! Great counting!`);add(`Close! There were ${n}. Next one!`);}
for(const text of ['Count the balloons!','Two more minutes, pal!',"Let's ask a grown-up! We can explore animals or space together.","Great question! Let's ask a grown-up and find out together.","I didn't hear that, try again!","Let's take a little break and try again soon!"])add(text);
writeFileSync('content/voice/catalog.json',JSON.stringify(rows,null,2)+'\n');
console.log(rows.length+' voice entries, '+rows.reduce((n,r)=>n+r.text.length,0)+' characters');

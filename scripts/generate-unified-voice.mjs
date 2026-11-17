import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
const base=process.env.VOICE_SITE??'https://aidos.nexcel.kz';
const voice='aidos-luna-v1',cache='scripts/.cache/unified-voice';
await mkdir(cache,{recursive:true});
const rows=JSON.parse(await readFile('content/voice/catalog.json','utf8'));
const ffmpeg=process.env.FFMPEG??'scripts/.cache/tts-venv/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v9.0.2.exe';
const fingerprintPath=cache+'/fingerprints.json';
const fingerprints=JSON.parse(await readFile(fingerprintPath,'utf8').catch(()=>'{}'));
const timings=[];
for(const [i,row] of rows.entries()){
 const file=`${cache}/${row.id}.mp3`;
 const fingerprint=createHash('sha256').update(voice+'\n'+row.text).digest('hex');
 if(!existsSync(file)||fingerprints[row.id]!==fingerprint){
  for(let attempt=0;;attempt++){
   const start=Date.now();const response=await fetch(`${base}/api/voice/${row.id}`,{signal:AbortSignal.timeout(16000)});
   if(response.status===429&&attempt<30){await new Promise(r=>setTimeout(r,10500));continue;}
   if(!response.ok){if(attempt<2){await new Promise(r=>setTimeout(r,3000));continue;}throw new Error(`Voice ${row.id}: HTTP ${response.status}`);}
   if(response.headers.get('X-AIdos-Voice')!==voice)throw new Error('Wrong voice');
   const bytes=Buffer.from(await response.arrayBuffer());await writeFile(file,bytes);fingerprints[row.id]=fingerprint;await writeFile(fingerprintPath,JSON.stringify(fingerprints));
   timings.push({id:row.id,ms:Date.now()-start,bytes:bytes.length});break;
  }
 }
 if(i%10===0)console.log(`Prepared ${i+1}/${rows.length}`);
}
const durations=new Map();
for(const row of rows){
 const source=`${cache}/${row.id}.mp3`,target='public'+row.file;await mkdir(dirname(target),{recursive:true});
 // Both stored and live clips retain the same model, speaker and natural speed.
 const result=spawnSync(ffmpeg,['-hide_banner','-y','-i',source,'-ar','24000','-ac','1','-c:a','libmp3lame','-b:a','64k',target],{encoding:'utf8',windowsHide:true});
 if(result.status!==0)throw new Error('Audio encoding failed: '+row.id);
 const match=result.stderr.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);if(!match)throw new Error('Missing duration');
 durations.set(row.id,Math.round((Number(match[1])*3600+Number(match[2])*60+Number(match[3]))*1000));
}
for(const name of ['common','hunt','roadtrip','lava','local-lines']){
 const path=`content/${name}.json`,bank=JSON.parse(await readFile(path,'utf8'));for(const row of bank)row.durationMs=durations.get(row.id);await writeFile(path,'[\n'+bank.map(row=>'  '+JSON.stringify(row)).join(',\n')+'\n]\n');
}
const path='public/audio/manifest.json',manifest=JSON.parse(await readFile(path,'utf8'));manifest.voice=voice;await writeFile(path,JSON.stringify(manifest,null,2)+'\n');
await writeFile('public/audio/voice-index.json',JSON.stringify({voice,texts:Object.fromEntries(rows.map(r=>[r.text,r.file]))},null,2)+'\n');
await writeFile(`${cache}/timings.json`,JSON.stringify(timings,null,2));
console.log(`DONE ${rows.length} clips in one voice`);

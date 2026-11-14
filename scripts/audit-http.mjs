import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
const base = process.env.SMOKE_URL ?? 'http://127.0.0.1:5184';
assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'Rate-limit audit runs locally only');
const result = { base, http: [], bundle: [], audio: {} };
for (const [path, expected] of [['/',200],['/privacy',200],['/missing-audit-page',404],['/.env',404],['/.git/config',404],['/assets/index.js.map',404],['/api/missing',404],['/api/health',200]]) {
  const r = await fetch(base+path); assert.equal(r.status,expected,path);
  assert.equal(r.headers.get('x-content-type-options'),'nosniff'); assert.equal(r.headers.get('x-frame-options'),'DENY');
  assert.equal(r.headers.get('permissions-policy'),'microphone=(self), camera=(), geolocation=()');
  result.http.push({path,status:r.status,headers:Object.fromEntries(['referrer-policy','x-content-type-options','x-frame-options','permissions-policy'].map(h=>[h,r.headers.get(h)]))});
}
for (const origin of ['https://mypal.tarlan-b06.workers.dev','https://mission-control.tarlan-b06.workers.dev','http://localhost:5173','https://foreign.example']) {
 const r=await fetch(base+'/api/ask',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({question:'x'.repeat(301)})});
 assert.equal(r.status,origin.includes('foreign')?403:200); result.http.push({origin,status:r.status});
}
const statuses=[];
for(let i=0;i<40;i++) { const r=await fetch(base+'/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"question":""}'});statuses.push(r.status); if(r.status===429)assert(r.headers.get('retry-after')); }
assert(statuses.includes(429));result.rateLimit={requests:40,statuses};
for(const name of await readdir('dist/client/assets')){
 if(!name.endsWith('.js'))continue;
 const bytes=await readFile('dist/client/assets/'+name);const s=bytes.toString();
 result.bundle.push({name,bytes:bytes.length,gzipBytes:gzipSync(bytes).length,consoleLog:(s.match(/console\.log\(/g)||[]).length,debugger:(s.match(/\bdebugger\b/g)||[]).length,localhost:(s.match(/https?:\/\/(localhost|127\.0\.0\.1)/g)||[]).length,legacyHost:(s.match(/https?:\/\/mission-control\./g)||[]).length,secretPatterns:/(?:gsk_[a-zA-Z0-9]{30,}|sk-proj-[a-zA-Z0-9]{30,}|BEGIN PRIVATE KEY)/.test(s)});
}
assert(result.bundle.every(b=>!b.secretPatterns&&!b.consoleLog&&!b.debugger&&!b.localhost&&!b.legacyHost));
const manifest=await(await fetch(base+'/audio/manifest.json')).json(); result.audio.manifest=true;
const entries=Object.values(manifest.clips);
for (const path of entries) { const r=await fetch(base+path); assert.equal(r.status,200,path); assert((await r.arrayBuffer()).byteLength>100,path); }
result.audio.manifestEntries=entries.length;
await writeFile('docs/audit/after-http-bundle.json',JSON.stringify(result,null,2));
console.log('PASS headers, private paths, CORS, bounded local rate limit and client bundle checks');

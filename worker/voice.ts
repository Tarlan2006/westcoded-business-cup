import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import catalog from '../content/voice/catalog.json';
import { AIDOS_VOICE,normalizeSpeech,voiceModel,voiceSpeaker } from '../shared/voice';
import { unsafe,deadline,IpLimiter } from './safety';
import { refuseQuestion } from '../shared/ask-faq';

const lines=new Map(catalog.map(line=>[line.id,line.text]));
const limiter=new IpLimiter();
const pending=new Map<string,Promise<ArrayBuffer>>();
export const voice=new Hono<{Bindings:{AI:Ai}}>();

export async function synthesize(ai: Ai,text: string):Promise<ArrayBuffer> {
  const stream=await deadline(ai.run(voiceModel as Parameters<Ai['run']>[0],{
    text,speaker:voiceSpeaker,encoding:'mp3',bit_rate:48000,
  } as never),6000) as unknown as ReadableStream;
  if(!stream || typeof stream.getReader!=='function')throw new Error('voice_unavailable');
  const bytes=await deadline(new Response(stream).arrayBuffer(),6000);
  if(bytes.byteLength<100 || bytes.byteLength>1_000_000)throw new Error('voice_size');
  return bytes;
}
const audio=(bytes:ArrayBuffer)=>new Response(bytes,{headers:{'Content-Type':'audio/mpeg','X-AIdos-Voice':AIDOS_VOICE,'Cache-Control':'private, no-store'}});
function failure(error: unknown) {
  const message=error instanceof Error ? error.message : '';
  if(/^voice_(unavailable|size)$/.test(message))return message;
  if(/timeout/i.test(message))return 'timeout';
  if(/bit.?rate|sample.?rate|encoding/i.test(message))return 'audio_format';
  if(/agree|terms|license/i.test(message))return 'model_terms';
  if(/unauthorized|permission|not authorized/i.test(message))return 'model_access';
  const code=message.match(/\b(1\d{3,4})\b/)?.[1];
  return code ? `provider_${code}` : 'provider_unavailable';
}

// Only fixed public catalogue text can be cached. No profile, nickname or parent notes.
voice.get('/api/voice/:id',async c=>{
  const id=c.req.param('id'),text=lines.get(id);
  if(!text)return c.body(null,404);
  const key=new Request(`${new URL(c.req.url).origin}/voice-cache/${AIDOS_VOICE}/${id}`);
  const cache=(caches as unknown as {default:Cache}).default;
  const hit=await cache.match(key);if(hit)return hit;
  if(!limiter.take(c.req.header('CF-Connecting-IP')??'local')){c.header('Retry-After','10');return c.body(null,429);}
  try {
    let job=pending.get(id);
    if(!job){job=synthesize(c.env.AI,text);pending.set(id,job);void job.finally(()=>pending.delete(id)).catch(()=>{});}
    const result=audio(await job);result.headers.set('Cache-Control','public, max-age=2592000');
    c.executionCtx.waitUntil(cache.put(key,result.clone()));return result;
  }catch(error){return c.json({code:failure(error)},503);}
});

voice.post('/api/voice',bodyLimit({maxSize:2048,onError:c=>c.body(null,413)}),async c=>{
  const body=await c.req.json<{text?:unknown}>().catch(()=>null);
  if(typeof body?.text!=='string')return c.body(null,400);
  const text=normalizeSpeech(body.text);
  if(!text || text.length>280 || unsafe(text) || refuseQuestion(text))return c.body(null,400);
  try{return audio(await synthesize(c.env.AI,text));}catch(error){return c.json({code:failure(error)},503);}
});

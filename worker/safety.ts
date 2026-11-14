export const retryReply = "I didn't hear that, try again!";
export const safeReply = "Let's ask a grown-up! We can explore animals or space together.";
export function unsafe(text: string) {
 const s = text.normalize("NFKC").replace(/[​-‍﻿]/g, "");
 return /\b(fuck\w*|shit\w*|bitch\w*|asshole|kill\w*|murder\w*|stab\w*|suicide|porn\w*|sex\w*|naked|bomb\w*|weapon\w*|gun|ignore|override|system prompt|pretend to be|act as)\b|https?:|www\.|[\w.+-]+@[\w.-]+|\b[\w-]+\.(com|org|net|io)\b|(?:\d[ ().+-]*){7,}|\b\d+\s+(?:[a-z]+\s+){0,4}(?:street|road|avenue|lane|drive)\b|\b(?:my|your|their|his|her) (?:full name|name|address|phone|school)|\b(?:called|named) [A-Z]/i.test(s);
}
export function safeOutput(text: string) {
 if (unsafe(text) || text.length > 280) return safeReply;
 return text.match(/[^.!?]+[.!?]*/g)?.slice(0,2).join("").trim() || safeReply;
}
export async function deadline<T>(work: Promise<T>, ms = 8000): Promise<T> {
 let timer: ReturnType<typeof setTimeout>;
 try { return await Promise.race([work, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("upstream_timeout")), ms); })]); }
 finally { clearTimeout(timer!); }
}
export class IpLimiter {
 private buckets = new Map<string, { minute: number; hour: number; time: number }>();
 take(ip: string, now = Date.now()) {
  for (const [key,b] of this.buckets) if (now-b.time >= 3600000) this.buckets.delete(key);
  const b = this.buckets.get(ip) ?? {minute:30,hour:300,time:now};
  if (!this.buckets.has(ip) && this.buckets.size >= 4096) return false;
  const elapsed = Math.max(0,now-b.time);
  b.minute=Math.min(30,b.minute+elapsed/2000); b.hour=Math.min(300,b.hour+elapsed/12000); b.time=now;
  this.buckets.set(ip,b); if(b.minute<1 || b.hour<1) return false;
  b.minute--; b.hour--; return true;
 }
}

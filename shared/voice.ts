export const AIDOS_VOICE = 'aidos-luna-v1';
export const voiceModel = '@cf/deepgram/aura-2-en';
export const voiceSpeaker = 'luna';
export const normalizeSpeech = (text: string) => text.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu,'').replace(/\s+/g,' ').trim();

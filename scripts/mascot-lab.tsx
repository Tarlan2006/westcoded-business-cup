import { useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Mascot } from '../src/components/Mascot';
import type { Emotion } from '../src/components/mascotMotion';
import { changeVoicePlayback } from '../src/audio/speechMotion';
import { playQueue, stopSpeech, unlock } from '../src/audio/engine';

const labels: Record<Emotion,string> = {
  idle:'Покой', greeting:'Приветствие', listening:'Слушает', thinking:'Размышляет',
  speaking:'Говорит', correct:'Правильно', wrong:'Попробуем ещё', network:'Нет связи',
};
function Lab() {
  const [intent,setIntent]=useState<Emotion>('idle');
  const [id,setId]=useState(0);
  const serial=useRef(0);
  const silent=useRef(false);
  function endSilence() {
    if(silent.current) changeVoicePlayback('recorded',-1);
    silent.current=false;
  }
  const stage=useRef<HTMLDivElement>(null);
  const [shown,setShown]=useState<Emotion>('idle');
  useEffect(()=>{
    const guide=stage.current!.querySelector<HTMLElement>('.aidos-mascot')!;
    const update=()=>setShown(guide.dataset.emotion as Emotion || 'idle');
    const observer=new MutationObserver(update);observer.observe(guide,{attributes:true,attributeFilter:['data-emotion']});
    update();return ()=>{observer.disconnect();endSilence();};
  },[]);
  async function select(intent: Emotion) {
    const id=++serial.current;
    stopSpeech();endSilence();
    setId(id);setIntent(intent);
    if(intent==='speaking' || intent==='wrong') {
      await unlock();
      if(id===serial.current) await playQueue([intent==='wrong'?'common_quiz_encourage':'common_setup_greeting']);
    }
  }
  return <><div ref={stage} className="stage"><Mascot size={280} pose="point" emotion={intent==='speaking'?'idle':intent} eventKey={id}/></div>
    <output>{labels[shown]}</output><div className="controls">{(Object.keys(labels) as Emotion[]).map(key=>
      <button type="button" key={key} data-event={key} onClick={()=>void select(key)}>{labels[key]}</button>)}
      <button type="button" data-event="silent" onClick={()=>{
        void select('idle');silent.current=true;changeVoicePlayback('recorded',1);
      }}>Реплика с тишиной</button></div>
  </>;
}
const host = document.getElementById('mascot-lab') as HTMLElement & { previewRoot?: Root };
(host.previewRoot ??= createRoot(host)).render(<Lab/>);

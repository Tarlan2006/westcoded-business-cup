import * as T from 'three';
import { createAidos } from './model';

type Host = { canvas: HTMLCanvasElement; read: () => { pose: string; mouth: number }; ready: (ok: boolean) => void; last: string };
const hosts = new Set<Host>();
let renderer: T.WebGLRenderer | undefined;
let scene: T.Scene, camera: T.OrthographicCamera, model: ReturnType<typeof createAidos>;
let frame = 0, lastTime = 0, disposeTimer: ReturnType<typeof setTimeout> | undefined;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function init() {
  if(renderer) return;
  renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setClearColor(0,0);
  renderer.outputColorSpace=T.SRGBColorSpace;
  scene=new T.Scene();camera=new T.OrthographicCamera(-1.35,1.35,3.55,-.05,.1,30);
  camera.position.set(0,0,8);camera.lookAt(0,0,0);
  scene.add(new T.HemisphereLight(0xfff5e5,0x526176,2.5));
  const light=new T.DirectionalLight(0xfff1dd,3);light.position.set(-3,5,6);scene.add(light);
  const fill=new T.DirectionalLight(0xffffff,1);fill.position.set(3,2,-2);scene.add(fill);
  model=createAidos();scene.add(model.root);
  renderer.domElement.addEventListener('webglcontextlost',event=>{
    event.preventDefault();for(const h of hosts)h.ready(false);
  });
}

function tick(time: number) {
  frame=requestAnimationFrame(tick);
  if(document.hidden || time-lastTime<1000/24 || !renderer || renderer.getContext().isContextLost()) return;
  lastTime=time;
  const still=reduced();
  for(const host of hosts) {
    const box=host.canvas.getBoundingClientRect();
    if(!box.width||!box.height||((box.bottom<0||box.top>innerHeight)&&host.last)||host.canvas.closest('[inert],[hidden]'))continue;
    const dpr=Math.min(devicePixelRatio||1,1.5);
    const width=Math.round(box.width*dpr),height=Math.round(box.height*dpr);
    const {pose,mouth}=host.read();
    const key=`${pose}/${width}/${height}/${still}`;
    if(still && host.last===key) continue;
    try {
      if(host.canvas.width!==width||host.canvas.height!==height){host.canvas.width=width;host.canvas.height=height;}
      renderer.setSize(width,height,false);
      const viewHeight=Math.max(3.6,2.85*height/width);
      const half=viewHeight*width/height/2;camera.left=-half;camera.right=half;
      camera.top=3.55+(viewHeight-3.6)/2;camera.bottom=-.05-(viewHeight-3.6)/2;camera.updateProjectionMatrix();
      model.animate(pose,time/1000,mouth,still);
      renderer.render(scene,camera);
      const ctx=host.canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
      ctx.clearRect(0,0,width,height);ctx.drawImage(renderer.domElement,0,0);
      host.last=key;host.canvas.dataset.rendered='true';host.ready(true);
    } catch {host.ready(false);}
  }
}

/** One WebGL context shared by every host, with cheap canvas copies per placement. */
export function mountHost(canvas: HTMLCanvasElement,read: Host['read'],ready: Host['ready']) {
  clearTimeout(disposeTimer);
  try {init();}catch {ready(false);return ()=>{};}
  const host:Host={canvas,read,ready,last:''};hosts.add(host);
  if(!frame)frame=requestAnimationFrame(tick);
  return ()=>{
    hosts.delete(host);
    if(!hosts.size){
      cancelAnimationFrame(frame);frame=0;
      disposeTimer=setTimeout(()=>{
        scene.traverse(object=>{if(object instanceof T.Mesh){object.geometry.dispose();const mats=Array.isArray(object.material)?object.material:[object.material];mats.forEach(m=>m.dispose());}});
        renderer?.dispose();renderer=undefined;
      },1000);
    }
  };
}

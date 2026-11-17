import * as T from 'three';

/** Original procedural character: articulated meshes, no downloaded model or textures. */
export function createAidos() {
  const root = new T.Group();
  const mat = (color: string, roughness = .72) => new T.MeshStandardMaterial({ color, roughness });
  const skin = mat('#eeb78b'), coat = mat('#087f91'), trim = mat('#edc05e', .4);
  const hair = mat('#543025'), boots = mat('#69412c'), cream = mat('#fff1d3');
  const white = mat('#fffaf0'), iris = mat('#65452c'), black = mat('#211b23');
  const sphere = new T.SphereGeometry(1, 24, 16);
  function ell(parent: T.Object3D, material: T.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number) {
    const mesh = new T.Mesh(sphere, material); mesh.position.set(x,y,z); mesh.scale.set(sx,sy,sz); parent.add(mesh); return mesh;
  }
  function tube(parent: T.Object3D, points: number[][], radius: number, material = trim) {
    const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p as [number,number,number])));
    const mesh = new T.Mesh(new T.TubeGeometry(curve, 24, radius, 6, false), material); parent.add(mesh); return mesh;
  }
  const joint = (parent: T.Object3D, x: number,y: number,z: number) => { const group = new T.Group(); group.position.set(x,y,z); parent.add(group); return group; };
  // Feet and legs stay planted; arms and neck have independent pivots.
  for (const x of [-.22,.22]) {
    ell(root,coat,x,.65,0,.18,.56,.19);
    ell(root,boots,x,.2,.1,.21,.2,.31);
    tube(root,[[x-.14,.31,.23],[x,.34,.31],[x+.14,.31,.23]],.018);
  }
  ell(root,mat('#175982'),0,1.55,-.3,.46,.6,.24); // backpack
  ell(root,coat,0,1.45,0,.46,.72,.29);
  ell(root,cream,0,1.72,.27,.18,.39,.035);
  for(const side of [-1,1]) {
    tube(root,[[side*.1,2.03,.24],[side*.16,1.8,.3],[side*.12,1.36,.3],[side*.23,.87,.2]],.027);
    // Paired ram-horn oyu motifs, embroidered on the coat.
    for(const y of [1.05,1.34,1.63]) {
      const x = side*.29;
      tube(root,[[x,y-.08,.27],[x-side*.07,y,.3],[x-side*.06,y+.09,.28],[x+side*.04,y+.1,.25],[x+side*.065,y+.04,.25],[x+side*.02,y+.01,.28]],.017);
    }
    tube(root,[[side*.34,2,.1],[side*.36,1.75,.28],[side*.38,1.45,.22]],.045,mat('#245777'));
  }
  const arms = [-1,1].map(side => {
    const shoulder = joint(root,side*.43,1.93,0);
    ell(shoulder,coat,0,-.24,0,.15,.3,.16);
    const elbow=joint(shoulder,0,-.48,0);
    ell(elbow,coat,0,-.19,0,.125,.25,.13);
    ell(elbow,trim,0,-.37,0,.13,.055,.14);
    const hand=joint(elbow,0,-.48,0);
    ell(hand,skin,0,0,0,.13,.16,.08);
    for(let i=0;i<4;i++) ell(hand,skin,(i-1.5)*.055,-.12,0,.033,.095,.044);
    ell(hand,skin,side*.12,.01,.015,.065,.095,.055).rotation.z=side*.55;
    return {shoulder,elbow,hand};
  });
  const head=joint(root,0,2.16,0);
  ell(head,skin,0,.43,0,.55,.62,.45);
  for(const side of [-1,1]) {
    ell(head,skin,side*.53,.38,0,.12,.18,.09);
    ell(head,mat('#db9376'),side*.56,.39,.045,.055,.1,.035);
    ell(head,white,side*.22,.48,.387,.155,.18,.065);
    ell(head,iris,side*.21,.47,.445,.083,.112,.035);
    ell(head,black,side*.21,.47,.477,.043,.073,.018);
    ell(head,white,side*.21-.024,.515,.493,.025,.032,.012);
    tube(head,[[side*.09,.72,.39],[side*.22,.77,.41],[side*.36,.71,.35]],.025,hair);
  }
  ell(head,skin,0,.31,.452,.095,.105,.11);
  const mouth=ell(head,mat('#873d36'),0,.13,.411,.15,.018,.025);
  tube(head,[[-.16,.16,.4],[0,.11,.44],[.16,.16,.4]],.016,mat('#9c523c'));
  // Sculpted hair locks, with a fitted taqiya above them.
  ell(head,hair,0,.81,-.04,.55,.29,.42);
  for(let i=0;i<6;i++) {
    const lock=ell(head,hair,-.37+i*.14,.85-Math.sin(i)*.07,.3,.14,.23,.14);
    lock.rotation.z=-.6;
  }
  const hat=new T.Mesh(new T.CylinderGeometry(.39,.53,.22,40),coat); hat.position.set(0,1.03,-.055); head.add(hat);
  const hatTop=ell(head,coat,0,1.14,-.055,.39,.08,.39);
  hatTop.name='taqiya';
  for(const y of [.93,1.11]) {
    const ring=new T.Mesh(new T.TorusGeometry(y<1?.52:.4,.016,6,40),trim);
    ring.rotation.x=Math.PI/2;ring.position.set(0,y,-.055);head.add(ring);
  }
  for(let i=0;i<10;i++) {
    const a=i*Math.PI/5;
    tube(head,[[Math.sin(a)*.47,.96,Math.cos(a)*.47-.055],[Math.sin(a+.13)*.44,1.04,Math.cos(a+.13)*.44-.055],[Math.sin(a)*.42,1.09,Math.cos(a)*.42-.055]],.014);
  }
  const tablet=joint(root,0,1.39,.72);
  const board=new T.Mesh(new T.BoxGeometry(.53,.36,.045),mat('#245777')); tablet.add(board);
  const screen=new T.Mesh(new T.BoxGeometry(.43,.27,.048),mat('#a5e0ed'));tablet.add(screen);
  root.rotation.y=-.1;
  function animate(pose: string, time: number, mouthLevel: number, reduced: boolean) {
    const t=reduced?0:time;
    head.rotation.set(mouthLevel>0 ? Math.sin(t*2.5)*.025 : 0, Math.sin(t*.65)*.045, Math.sin(t*.8)*.018);
    mouth.scale.y=.018 + (reduced?0:mouthLevel*.1);
    tablet.visible=pose==='tablet';
    arms.forEach(({shoulder,elbow,hand},i)=>{
      const side=i===0?-1:1;
      shoulder.rotation.set(0,0,side*.12); elbow.rotation.set(-.08,0,0); hand.rotation.set(0,0,0);
      if(pose==='wave' && i===1) { shoulder.rotation.z=2.1;elbow.rotation.z=.35;hand.rotation.z=reduced?0:Math.sin(t*2)*.12; }
      else if(pose==='jump') {shoulder.rotation.z=side*2.55;elbow.rotation.z=side*.22;}
      else if(pose==='tablet') {shoulder.rotation.x=-.58;shoulder.rotation.z=-side*.18;elbow.rotation.x=-.7;}
      else if(pose==='point' && i===1) {shoulder.rotation.z=1;elbow.rotation.x=-.45;}
      if(mouthLevel>0 && !reduced) shoulder.rotation.x+=Math.sin(t*1.7)*.045;
    });
  }
  return {root,animate};
}

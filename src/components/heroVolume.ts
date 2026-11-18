/** A small software 3D rig. No WebGL context: joints and face markings share
 * the same model space and are projected through a rotating camera. */
type V = {x:number;y:number;z:number};
type Pose = Record<string,number>;
const rad=(v:number)=>v*Math.PI/180;
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
export function turnToward(current:number,target:number,dt:number,reduced=false){
  return reduced?target:mix(current,target,1-Math.exp(-Math.min(.05,Math.max(0,dt))/.14));
}
export function rotateHero(v:V,yaw:number):V {
  return {x:v.x*Math.cos(yaw)+v.z*Math.sin(yaw),y:v.y,z:v.z*Math.cos(yaw)-v.x*Math.sin(yaw)};
}
export function projectHero(v:V,yaw:number){
  const p=rotateHero(v,yaw),scale=320/(320-p.z);
  return {x:40+p.x*scale,y:30+(p.y-30)*scale,z:p.z,scale};
}
const advance=(v:V,length:number,angle:number):V=>({x:v.x,y:v.y+Math.cos(rad(angle))*length,z:v.z-Math.sin(rad(angle))*length});
export function heroJoints(pose:Pose,side:'l'|'r',hanging=false){
  const x=side==='l'?-10:10,dy=pose['body-y']||0;
  const shoulder={x,y:57+dy,z:0};
  const elbow=hanging&&side==='r'?{x:27,y:27+dy,z:0}:advance(shoulder,11,pose[`arm-${side}`]||0);
  const wrist=hanging&&side==='r'?{x:16,y:3+dy,z:0}:advance(elbow,10,(pose[`arm-${side}`]||0)+(pose[`elbow-${side}`]||0));
  if(!hanging){
    const out=Math.min(1,Math.max(0,(Math.abs(pose[`arm-${side}`]||0)-45)/45));
    const sign=side==='l'?-1:1;
    elbow.x+=sign*(1+out*10); wrist.x+=sign*(1.5+out*17);
    elbow.y-=out*5; wrist.y-=out*9;
  }
  const hip={x:side==='l'?-6:6,y:75+dy,z:0};
  const knee=advance(hip,10,pose[`leg-${side}-upper`]||0);
  const ankle=advance(knee,12,(pose[`leg-${side}-upper`]||0)+(pose[`leg-${side}-lower`]||0));
  return {shoulder,elbow,wrist,hip,knee,ankle};
}
type Draw=()=>void;
export function renderHeroVolume(ctx:CanvasRenderingContext2D,pose:Pose,yaw:number,options:{hanging?:boolean;blink?:boolean;shadow?:boolean}={}){
  ctx.setTransform(3,0,0,3,0,0);ctx.clearRect(0,0,72,90);ctx.scale(.9,.9);
  ctx.lineCap='round';ctx.lineJoin='round';
  if(options.shadow!==false){ctx.fillStyle='rgba(25,29,40,.15)';ctx.beginPath();ctx.ellipse(40,98,17,2,0,0,Math.PI*2);ctx.fill();}
  const queue:{z:number;draw:Draw}[]=[];
  const shade={red:['#ff7775','#ec252f','#990b20'],blue:['#32a8e4','#0879b5','#063956']};
  const material=(type:'red'|'blue',x:number,y:number,r:number)=>{
    const colors=shade[type],g=ctx.createRadialGradient(x-r*.45,y-r*.65,r*.03,x+r*.3,y+r*.2,r*1.45);
    g.addColorStop(0,colors[0]);g.addColorStop(.48,colors[1]);g.addColorStop(1,colors[2]);return g;
  };
  const capsule=(a:V,b:V,r:number,type:'red'|'blue',web=false)=>{
    const pa=projectHero(a,yaw),pb=projectHero(b,yaw),width=2*r*(pa.scale+pb.scale)/2;
    queue.push({z:(pa.z+pb.z)/2,draw:()=>{
      ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);ctx.strokeStyle='#412c3a';ctx.lineWidth=width+1.1;ctx.stroke();
      const dx=pb.x-pa.x,dy=pb.y-pa.y,len=Math.hypot(dx,dy)||1;
      const grad=ctx.createLinearGradient(pa.x-dy/len*r,pa.y+dx/len*r,pa.x+dy/len*r,pa.y-dx/len*r);
      grad.addColorStop(0,shade[type][0]);grad.addColorStop(.45,shade[type][1]);grad.addColorStop(1,shade[type][2]);
      ctx.strokeStyle=grad;ctx.lineWidth=width;ctx.stroke();
      if(web){ctx.strokeStyle='rgba(65,20,30,.7)';ctx.lineWidth=.55;
        for(const t of [.35,.72]){const x=mix(pa.x,pb.x,t),y=mix(pa.y,pb.y,t);ctx.beginPath();ctx.moveTo(x-dy/len*r*.8,y+dx/len*r*.8);ctx.quadraticCurveTo(x+dx/len*.8,y+dy/len*.8,x+dy/len*r*.8,y-dx/len*r*.8);ctx.stroke();}
      }
    }});
  };
  const volume=(center:V,rx:number,ry:number,rz:number,type:'red'|'blue',extra?:Draw)=>{
    const p=projectHero(center,yaw),r=Math.sqrt(rx*rx*Math.cos(yaw)**2+rz*rz*Math.sin(yaw)**2)*p.scale;
    queue.push({z:p.z,draw:()=>{
      ctx.beginPath();ctx.ellipse(p.x,p.y,r,ry*p.scale,0,0,Math.PI*2);
      ctx.fillStyle=material(type,p.x,p.y,Math.max(r,ry*p.scale));ctx.fill();ctx.strokeStyle='#412c3a';ctx.lineWidth=.95;ctx.stroke();extra?.();
    }});
  };
  const dy=pose['body-y']||0;
  for(const side of ['l','r'] as const){
    const j=heroJoints(pose,side,options.hanging);
    // Shared endpoints and overlapping radii keep every joint visibly joined.
    capsule(j.hip,j.knee,4.1,'blue');capsule(j.knee,j.ankle,3.3,'red',true);
    volume({...j.ankle,y:j.ankle.y+.1,z:j.ankle.z+2.2},3.6,2.7,6.3,'red');
    capsule(j.shoulder,j.elbow,4,'blue');capsule(j.elbow,j.wrist,3.35,'red',true);
    volume(j.wrist,3.5,3.6,3,'red');
    for(let finger=0;finger<4;finger++){
      const x=j.wrist.x-2.2+finger*1.4;
      const from={x,y:j.wrist.y+1,z:j.wrist.z+1};
      capsule(from,{x:x+.25,y:j.wrist.y+4-(finger===3?1:0),z:j.wrist.z+2},.7,'red');
    }
    capsule({x:j.wrist.x-2,y:j.wrist.y,z:j.wrist.z+1},{x:j.wrist.x-4,y:j.wrist.y+2,z:j.wrist.z+2},1,'red');
  }
  volume({x:0,y:76+dy,z:0},10,5,6.5,'blue');
  volume({x:0,y:65+dy,z:0},12.3,14.5,7,'blue');
  capsule({x:0,y:52+dy,z:0},{x:0,y:59+dy,z:0},6,'red');
  // Front torso panel and emblem rotate with the body, rather than mirroring.
  const front=projectHero({x:0,y:64+dy,z:7.1},yaw);
  queue.push({z:front.z+.1,draw:()=>{
    if(Math.cos(yaw)<.05)return;
    const panel=[{x:-8,y:53+dy,z:5},{x:8,y:53+dy,z:5},{x:5,y:73+dy,z:6},{x:0,y:77+dy,z:6},{x:-5,y:73+dy,z:6}].map(p=>projectHero(p,yaw));
    ctx.beginPath();panel.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=material('red',front.x,front.y,14);ctx.fill();ctx.strokeStyle='#632334';ctx.lineWidth=.6;ctx.stroke();
    ctx.strokeStyle='rgba(70,16,34,.65)';ctx.lineWidth=.55;
    for(const y of [59,66,72]){
      const a=projectHero({x:-5,y:y+dy,z:7},yaw),b=projectHero({x:5,y:y+dy,z:7},yaw);
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(front.x,(a.y+b.y)/2+1,b.x,b.y);ctx.stroke();
    }
    ctx.strokeStyle='#382431';ctx.fillStyle='#201d28';ctx.lineWidth=.7;ctx.beginPath();ctx.ellipse(front.x,front.y,1.3,2.5,0,0,Math.PI*2);ctx.fill();
    for(const sign of [-1,1])for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(front.x,front.y-1+i*.6);ctx.lineTo(front.x+sign*3,front.y-3+i*1.9);ctx.lineTo(front.x+sign*4,front.y-4+i*2.4);ctx.stroke();}
  }});
  // The head is a shaded ellipsoid; webbing and lenses live on its surface.
  const headY=30+dy*.4,rx=24,ry=28,rz=21;
  const surface=(x:number,y:number):V=>({x,y:headY+y,z:4+rz*Math.sqrt(Math.max(0,1-(x/rx)**2-(y/ry)**2))});
  const visible=(v:V)=>rotateHero({x:v.x/(rx*rx),y:(v.y-headY)/(ry*ry),z:(v.z-4)/(rz*rz)},yaw).z>0;
  volume({x:0,y:headY,z:4},rx,ry,rz,'red',()=>{
    const hp=projectHero({x:0,y:headY,z:4},yaw),hr=Math.sqrt(rx*rx*Math.cos(yaw)**2+rz*rz*Math.sin(yaw)**2)*hp.scale;
    ctx.save();ctx.beginPath();ctx.ellipse(hp.x,hp.y,hr,ry*hp.scale,0,0,Math.PI*2);ctx.clip();
    ctx.beginPath();ctx.ellipse(hp.x-hr*.08,hp.y,hr*.87,ry*hp.scale*.89,0,3.6,4.8);
    ctx.strokeStyle='rgba(255,224,219,.65)';ctx.lineWidth=1.15;ctx.stroke();
    ctx.lineWidth=.6;ctx.strokeStyle='rgba(80,14,30,.8)';
    const line=(points:V[])=>{ctx.beginPath();let started=false;for(const v of points){if(!visible(v)){started=false;continue;}const p=projectHero(v,yaw);if(!started)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);started=true;}ctx.stroke();};
    for(let a=0;a<Math.PI*2;a+=Math.PI/4){const pts:V[]=[];for(let t=-Math.PI/2;t<=Math.PI/2+.01;t+=.04)pts.push({x:rx*Math.cos(t)*Math.sin(a),y:headY+ry*Math.sin(t),z:rz*Math.cos(t)*Math.cos(a)});line(pts);}
    for(const latitude of [-.9,-.48,0,.48,.9]){const pts:V[]=[];for(let a=0;a<=Math.PI*2+.02;a+=.04){const scallop=latitude+.055*Math.cos(a*8);pts.push({x:rx*Math.cos(scallop)*Math.sin(a),y:headY+ry*Math.sin(scallop),z:rz*Math.cos(scallop)*Math.cos(a)});}line(pts);}
    for(const side of [-1,1]){
      const boundary:{x:number;y:number}[]=[];
      const quad=(a:{x:number;y:number},b:{x:number;y:number},c:{x:number;y:number})=>{for(let t=0;t<1;t+=.08)boundary.push({x:(1-t)**2*a.x+2*(1-t)*t*b.x+t*t*c.x,y:(1-t)**2*a.y+2*(1-t)*t*b.y+t*t*c.y});};
      quad({x:side*4,y:7},{x:side*12,y:0},{x:side*19,y:-6});
      quad({x:side*19,y:-6},{x:side*21,y:12},{x:side*13,y:15});
      quad({x:side*13,y:15},{x:side*7,y:16},{x:side*4,y:7});
      const lens=boundary.map(p=>surface(p.x,options.blink?8+(p.y-8)*.12:p.y)).filter(visible).map(p=>projectHero(p,yaw));
      if(lens.length<boundary.length*.4)continue;
      ctx.beginPath();lens.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
      const g=ctx.createLinearGradient(hp.x,hp.y,hp.x+10,hp.y+18);g.addColorStop(0,'#bbd4df');g.addColorStop(.6,'#f4ffff');g.addColorStop(1,'white');ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#24212c';ctx.lineWidth=1.8;ctx.stroke();
    }
    ctx.restore();
  });
  queue[queue.length-1].z=100; // The head overlaps the neck and shoulder roots.
  queue.sort((a,b)=>a.z-b.z);for(const item of queue)item.draw();
}
const unavailable=new WeakSet<HTMLElement>();
const renderers=new WeakMap<HTMLElement,{canvas:HTMLCanvasElement;ctx:CanvasRenderingContext2D;yaw:number;time:number;signature?:string}>();
export function paintHeroVolume(pet:HTMLElement,pose:Pose,reduced=false){
  if(unavailable.has(pet))return;
  let state=renderers.get(pet);
  if(!state){
    const canvas=pet.querySelector<HTMLCanvasElement>('canvas.hero-volume');
    if(!canvas)return;
    let ctx:CanvasRenderingContext2D|null;
    try { ctx=canvas.getContext('2d'); } catch {unavailable.add(pet);return;}
    if(!ctx){unavailable.add(pet);return;} // Keep the SVG fallback if canvas is unavailable.
    state={canvas,ctx,yaw:0,time:performance.now()};renderers.set(pet,state);
    canvas.parentElement?.classList.add('hero-volume-ready');
  }
  const now=performance.now(),hanging=['descending','hanging'].includes(pet.dataset.entry||'');
  const target=hanging?0:(pet.style.getPropertyValue('--pet-flip')==='-1'?-.62:.62);
  state.yaw=turnToward(state.yaw,target,(now-state.time)/1000,reduced);state.time=now;
  const signature=Object.values(pose).map(v=>v.toFixed(2)).join(',')+state.yaw.toFixed(3)+pet.dataset.entry+pet.hasAttribute('data-blink');
  if(signature===state.signature)return;
  state.signature=signature;
  try{renderHeroVolume(state.ctx,pose,state.yaw,{hanging,blink:pet.hasAttribute('data-blink'),shadow:pet.dataset.entry==='walking'||pet.dataset.entry==='landing'});}
  catch {state.canvas.parentElement?.classList.remove('hero-volume-ready');unavailable.add(pet);renderers.delete(pet);}
}

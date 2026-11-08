/** THOKAR procedural 3D workshop — dependency-free, perspective projection, polygon depth sorting.
 * Geometry is indicative, NOT a vehicle-specific service diagram. */
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>mul(a,1/(Math.hypot(...a)||1));
const hex=(color)=>{const str=String(color||'#d73646');if(str.startsWith('rgb'))return (str.match(/[0-9]+/g)||[]).slice(0,3).map(Number);const v=str.replace('#','');return [0,2,4].map(i=>parseInt(v.slice(i,i+2),16)||0)};
const tone=(base,brightness)=>{const c=hex(base);return `rgb(${c.map(v=>Math.round(Math.max(0,Math.min(255,v*brightness)))).join(',')})`};
const ZONES={engine:{name:'Motor',point:[-1.34,1.36,-.10]},electrical:{name:'Eléctrico',point:[-1.68,1.26,.5]},front:{name:'Tren delantero',point:[-1.40,.52,.9]},rear:{name:'Tren trasero',point:[1.40,.50,.93]},cabin:{name:'Habitáculo',point:[.31,1.91,.13]},underbody:{name:'Bajos',point:[.15,.25,.68]}};
class Garage {
 constructor(canvas,onZone){
  this.canvas=canvas;this.ctx=canvas.getContext('2d');this.onZone=onZone;
  this.az=-.72;this.el=.39;this.dist=8.4;this.targetAz=this.az;this.targetEl=this.el;this.targetDist=this.dist;
  this.hood=false;this.color='#c93646';this.body='hatchback';this.points=[];this.contacts=new Map();this.dragged=false;this.frame=0;this.zoneSelected='';this.active=true;
  this.setup();this.invalidate();
 }
 setup(){
  const c=this.canvas;c.style.touchAction='none';
  this.observer=new ResizeObserver(()=>this.invalidate());this.observer.observe(c);
  const end=e=>{this.contacts.delete(e.pointerId);if(!this.contacts.size)this.dragged=false;try{c.releasePointerCapture(e.pointerId)}catch{}};
  c.addEventListener('pointerdown',e=>{c.setPointerCapture(e.pointerId);this.contacts.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY});this.dragged=false;});
  c.addEventListener('pointermove',e=>{
   const previous=this.contacts.get(e.pointerId);if(!previous)return;
   const dx=e.clientX-previous.x,dy=e.clientY-previous.y;
   if(Math.abs(e.clientX-previous.startX)+Math.abs(e.clientY-previous.startY)>5)this.dragged=true;
   if(this.contacts.size===2){
    const entries=[...this.contacts.entries()];const other=entries.find(([id])=>id!==e.pointerId)?.[1];
    if(other){const before=Math.hypot(previous.x-other.x,previous.y-other.y),after=Math.hypot(e.clientX-other.x,e.clientY-other.y);this.targetDist=Math.max(4.8,Math.min(12,this.targetDist-(after-before)*.024));}
   } else {
    this.targetAz+=dx*.006;this.targetEl=Math.max(.15,Math.min(1.17,this.targetEl+dy*.0042));
   }
   previous.x=e.clientX;previous.y=e.clientY;this.invalidate();
  });
  c.addEventListener('pointerup',e=>{
   const prev=this.contacts.get(e.pointerId);
   if(prev&&!this.dragged&&this.contacts.size===1){
    const r=c.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
    const p=this.points.find(p=>x>=p.hitX&&x<=p.hitX+p.hitW&&y>=p.hitY&&y<=p.hitY+p.hitH);
    if(p)this.onZone?.(p.key);
   }
   end(e);
  });
  c.addEventListener('pointercancel',end);
  c.addEventListener('wheel',e=>{e.preventDefault();this.zoom(e.deltaY>0?-.4:.4)},{passive:false});
  c.addEventListener('dblclick',()=>this.reset());
 }
 invalidate(){if(this.frame)return;const tick=()=>{this.frame=0;const easing=.115;const shift=Math.abs(this.targetAz-this.az)+Math.abs(this.targetEl-this.el)+Math.abs(this.targetDist-this.dist);this.az+=(this.targetAz-this.az)*easing;this.el+=(this.targetEl-this.el)*easing;this.dist+=(this.targetDist-this.dist)*easing;this.render();if(shift>.003)this.frame=requestAnimationFrame(tick);};this.frame=requestAnimationFrame(tick);}
 setVehicle(vehicle){const palette=['#aeb9c7','#8dabb1','#d7dce5','#8d353b','#4b596b','#af9d85'];const s=String(vehicle?.color||vehicle?.brand||'');let h=0;for(const ch of s)h=(h*31+ch.charCodeAt(0))>>>0;this.color=palette[h%palette.length];this.body=vehicle?.bodyType||'hatchback';this.invalidate();}
 setSelected(zone){this.zoneSelected=zone;this.invalidate();}
 setHood(v){this.hood=!!v;this.invalidate();}
 toggleHood(){this.hood=!this.hood;this.invalidate();return this.hood;}
 zoom(z){this.targetDist=Math.max(5.2,Math.min(12.5,this.targetDist-z));this.invalidate();}
 reset(){this.targetAz=-.72;this.targetEl=.39;this.targetDist=8.4;this.invalidate();}
 preset(view){
   if(view==='front'){this.targetAz=-Math.PI/2;this.targetEl=.30;this.targetDist=7.5;}
   else if(view==='side'){this.targetAz=0;this.targetEl=.3;this.targetDist=7.8;}
   else if(view==='engine'){this.hood=true;this.targetAz=-.95;this.targetEl=.88;this.targetDist=6.9;}
   else if(view==='rear'){this.targetAz=Math.PI/2;this.targetEl=.30;this.targetDist=7.9;}
   else if(view==='underbody'){this.targetAz=-.64;this.targetEl=.16;this.targetDist=7.1;}
   else this.reset();this.invalidate();
 }
 focusZone(zone){this.zoneSelected=zone;if(zone==='engine'||zone==='electrical')this.preset('engine');else if(zone==='front')this.preset('front');else if(zone==='rear')this.preset('rear');else if(zone==='underbody')this.preset('underbody');else if(zone==='cabin'){this.targetAz=-.4;this.targetEl=.67;this.targetDist=7.5;this.invalidate();}}
 dispose(){this.observer?.disconnect();if(this.frame)cancelAnimationFrame(this.frame)}
 render(){const c=this.canvas,rect=c.getBoundingClientRect();if(rect.width<2||rect.height<2)return;const dpr=Math.min(2,window.devicePixelRatio||1);c.width=Math.round(rect.width*dpr);c.height=Math.round(rect.height*dpr);const ctx=this.ctx;ctx.setTransform(dpr,0,0,dpr,0,0);const w=rect.width,h=rect.height;ctx.clearRect(0,0,w,h);
  const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#131924');bg.addColorStop(.58,'#202b3a');bg.addColorStop(1,'#0b1019');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  ctx.save();ctx.globalAlpha=.13;ctx.fillStyle='#b5c9dd';ctx.fillRect(w*.14,0,w*.2,6);ctx.fillRect(w*.68,0,w*.17,6);ctx.restore();
  const target=[0,.88,0],cam=[Math.sin(this.az)*Math.cos(this.el)*this.dist+target[0],Math.sin(this.el)*this.dist+target[1],Math.cos(this.az)*Math.cos(this.el)*this.dist+target[2]],fwd=norm(sub(target,cam)),right=norm(cross(fwd,[0,1,0])),up=cross(right,fwd);const f=Math.min(w*1.06,h*2.2);
  const project=p=>{const d=sub(p,cam),depth=dot(d,fwd);if(depth<=.1)return null;return {x:w/2+dot(d,right)*f/depth,y:h*.56-dot(d,up)*f/depth,depth};};
  const faces=[];const face=(vertices,color,alpha=1)=>faces.push({vertices,color,alpha,depth:vertices.reduce((n,p)=>n+dot(sub(p,cam),fwd),0)/vertices.length});
  const box=(x1,y1,z1,x2,y2,z2,color)=>{const v=[[x1,y1,z1],[x2,y1,z1],[x2,y2,z1],[x1,y2,z1],[x1,y1,z2],[x2,y1,z2],[x2,y2,z2],[x1,y2,z2]];const quads=[[0,1,2,3],[4,7,6,5],[0,4,5,1],[3,2,6,7],[0,3,7,4],[1,5,6,2]];for(const q of quads)face(q.map(i=>v[i]),color)};
  // Garage floor grid is part of the 3D world
  for(let x=-5;x<=5;x++)face([[x,0,-5],[x,0,5],[x+.009,0,5],[x+.009,0,-5]],'#405168',.34);
  for(let z=-5;z<=5;z++)face([[-5,0,z],[5,0,z],[5,0,z+.009],[-5,0,z+.009]],'#405168',.34);
  box(-2.23,.43,-.91,2.24,1.03,.91,this.color);
  // roof/cabin panels, bonnet/windscreen/trunk, headlights, grille
  const shapes={
    hatchback:{baseF:-.99,baseR:1.60,topF:-.58,topR:1.13,topY:1.77,topZ:.59},
    sedan:{baseF:-.98,baseR:1.34,topF:-.51,topR:1.02,topY:1.73,topZ:.57},
    suv:{baseF:-1.03,baseR:1.77,topF:-.91,topR:1.57,topY:1.99,topZ:.65},
    pickup:{baseF:-1.01,baseR:.41,topF:-.78,topR:.14,topY:1.90,topZ:.62},
    van:{baseF:-1.45,baseR:1.75,topF:-1.30,topR:1.55,topY:2.12,topZ:.68}
  };
  const g=shapes[this.body]||shapes.hatchback, baseY=1.03,baseZ=.73;
  face([[g.baseF,baseY,-baseZ],[g.baseR,baseY,-baseZ],[g.topR,g.topY,-g.topZ],[g.topF,g.topY,-g.topZ]],'#263645');
  face([[g.baseF,baseY,baseZ],[g.topF,g.topY,g.topZ],[g.topR,g.topY,g.topZ],[g.baseR,baseY,baseZ]],'#263645');
  face([[g.topF,g.topY,-g.topZ],[g.topR,g.topY,-g.topZ],[g.topR,g.topY,g.topZ],[g.topF,g.topY,g.topZ]],tone(this.color,.78));
  face([[g.baseF,baseY,-baseZ],[g.baseF,baseY,baseZ],[g.topF,g.topY,g.topZ],[g.topF,g.topY,-g.topZ]],'#436175');
  face([[g.baseR,baseY,-baseZ],[g.topR,g.topY,-g.topZ],[g.topR,g.topY,g.topZ],[g.baseR,baseY,baseZ]],'#304b61');
  // Aristas de puerta, manillas y espejos; los elementos mantienen perspectiva en el giro.
  for(const z of [-.80,.80]){
    box(.25,.93,z-.022,.64,1.02,z+.022,tone(this.color,.58));
    box(-.48,.87,z-.026,-.21,.93,z+.026,'#b7c0ca');
    box(.81,.88,z-.025,1.05,.94,z+.025,'#b7c0ca');
    box(-.95,1.10,z-.15,-.79,1.24,z+.15,'#202b38');
  }
  for(const z of [-.47,.47])box(-2.265,.65,z-.022,-2.253,.91,z+.022,'#121822');
  for(let i=0;i<6;i++){
    const z=-.43+i*.17;box(-2.268,.76,z-.035,-2.259,.785,z+.035,'#8193a9');
  }
  if(this.body==='pickup'){
    box(.47,1.015,-.82,2.17,1.10,.82,tone(this.color,.67));
    for(const z of [-.83,.83])box(.45,1.06,z-.045,2.20,1.19,z+.045,tone(this.color,.87));
    box(2.03,1.06,-.81,2.20,1.2,.81,tone(this.color,.9));
  }
  if(!this.hood){face([[-2.2,1.055,-.87],[-.97,1.055,-.83],[-.97,1.055,.83],[-2.2,1.055,.87]],tone(this.color,.96));}else{
    box(-2.12,.97,-.8,-.96,1.015,.8,'#1c232a');
    box(-1.82,1.0,-.34,-1.10,1.34,.32,'#5b6269');
    box(-1.76,1.34,-.34,-1.15,1.40,.30,'#171b22');
    for(let i=0;i<4;i++)box(-1.68+i*.12,1.4,-.2,-1.64+i*.12,1.45,.16,'#8a9398');
    box(-1.75,1.03,.45,-1.18,1.24,.76,'#242832');
    box(-1.95,1.05,-.76,-1.35,1.19,-.45,'#252d30');
    box(-1.9,1.19,-.7,-1.38,1.23,-.5,'#e63e43');
    face([[-2.43,1.91,-.90],[-2.29,1.94,.90],[-.93,1.10,.80],[-.93,1.10,-.8]],tone(this.color,.97));
  }
  face([[1.35,1.045,-.85],[2.23,1.045,-.85],[2.23,1.045,.85],[1.35,1.045,.85]],tone(this.color,.88));
  for(const z of [-.84,.84])face([[-2.19,1.00,z],[-.95,1.00,z],[-.95,1.03,z*.83],[-2.19,1.03,z*.84]],'#d7dfe7',.16);
  face([[g.topF,g.topY+.004,-g.topZ*.86],[g.topR,g.topY+.004,-g.topZ*.86],[g.topR,g.topY+.004,g.topZ*.86],[g.topF,g.topY+.004,g.topZ*.86]],'#edf2fa',.10);
  face([[-2.255,.67,-.65],[-2.255,.91,-.65],[-2.255,.91,.65],[-2.255,.67,.65]],'#202733');
  for(const z of [-.78,.78]){box(-2.27,.81,z-.13,-2.23,.95,z+.13,'#fff4cc');box(2.23,.78,z-.14,2.28,.98,z+.14,'#a51b25');}
  for(const z of [-.95,.95])for(const x of [-1.45,1.46]){
    // wheel rings viewed along z-axis, true circular 3D geometry
    const outer=[],inner=[],hub=[];for(let i=0;i<20;i++){const a=i*Math.PI/10;outer.push([x+Math.cos(a)*.48,.50+Math.sin(a)*.48,z]);inner.push([x+Math.cos(a)*.30,.50+Math.sin(a)*.30,z+(z>0?.018:-.018)]);hub.push([x+Math.cos(a)*.14,.50+Math.sin(a)*.14,z+(z>0?.035:-.035)]);}face(outer,'#11151a');face(inner,'#777d87');face(hub,'#b5bac0');
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5;face([[x,.5,z+(z>0?.04:-.04)],[x+Math.cos(a)*.25,.5+Math.sin(a)*.25,z+(z>0?.045:-.045)],[x+Math.cos(a+.35)*.25,.5+Math.sin(a+.35)*.25,z+(z>0?.045:-.045)]],'#37404c');}
  }
  faces.sort((a,b)=>b.depth-a.depth);
  // Lightweight projective shadows
  const shadow=project([0,.015,0]);if(shadow){ctx.save();ctx.translate(shadow.x,shadow.y);ctx.scale(1,.33);const grad=ctx.createRadialGradient(0,0,0,0,0,Math.min(w*.4,280));grad.addColorStop(0,'#0008');grad.addColorStop(1,'#0000');ctx.fillStyle=grad;ctx.beginPath();ctx.arc(0,0,Math.min(w*.4,280),0,Math.PI*2);ctx.fill();ctx.restore();}
  for(const p of faces){const screen=p.vertices.map(project);if(screen.some(x=>!x))continue;const n=norm(cross(sub(p.vertices[1],p.vertices[0]),sub(p.vertices[2],p.vertices[0])));const light=Math.max(.45,Math.min(1.22,.8+dot(n,norm([-1,2,1]))*.27));ctx.globalAlpha=p.alpha;ctx.fillStyle=tone(p.color,light);ctx.beginPath();ctx.moveTo(screen[0].x,screen[0].y);for(let i=1;i<screen.length;i++)ctx.lineTo(screen[i].x,screen[i].y);ctx.closePath();ctx.fill();ctx.globalAlpha=1;}
  // Marcadores de inspección discretos: ninguna etiqueta ni número tapa las piezas.
  this.points=[];
  for(const [key,zone] of Object.entries(ZONES)){
    let point=zone.point;
    if(!this.hood&&(key==='engine'||key==='electrical'))point=[point[0],1.11,point[2]];
    const a=project(point);if(!a||a.x<10||a.x>w-10||a.y<10||a.y>h-10)continue;
    const selected=key===this.zoneSelected;
    ctx.save();
    ctx.shadowColor=selected?'#ff4558':'#66b4dc';ctx.shadowBlur=selected?18:10;
    ctx.beginPath();ctx.arc(a.x,a.y,selected?8.5:5.2,0,Math.PI*2);ctx.fillStyle=selected?'#ff6978':'#9ac8df';ctx.fill();
    ctx.shadowBlur=0;ctx.lineWidth=2;ctx.strokeStyle=selected?'#ffe4e8':'#14283b';ctx.stroke();
    ctx.strokeStyle=selected?'#ff9aa3a0':'#bedbeb66';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(a.x,a.y,selected?17:11,0,Math.PI*2);ctx.stroke();
    if(selected){
      const label=zone.name;ctx.font='600 12px system-ui,sans-serif';const tw=ctx.measureText(label).width,bw=Math.min(w*.7,tw+28),bx=Math.max(8,Math.min(w-bw-8,a.x-bw/2)),by=Math.max(45,a.y-47);
      ctx.beginPath();ctx.roundRect(bx,by,bw,28,12);ctx.fillStyle='#16222fe9';ctx.fill();ctx.strokeStyle='#ff788ba9';ctx.stroke();
      ctx.fillStyle='#f6f8fb';ctx.textAlign='center';ctx.fillText(label,bx+bw/2,by+18);
    }
    ctx.restore();this.points.push({key,x:a.x,y:a.y,hitX:a.x-21,hitY:a.y-21,hitW:42,hitH:42});
  }
  ctx.fillStyle='#d9dfe9aa';ctx.font='10px sans-serif';ctx.textAlign='left';ctx.fillText('THOKAR · TALLER 3D',14,h-18);
 }
}
export function createWorkshop(canvas,onZone){return new Garage(canvas,onZone)}
export {ZONES};

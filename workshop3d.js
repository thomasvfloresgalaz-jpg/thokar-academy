/** THOKAR procedural 3D workshop — dependency-free, perspective projection, polygon depth sorting.
 * Geometry is indicative, NOT a vehicle-specific service diagram. */
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>mul(a,1/(Math.hypot(...a)||1));
const hex=(color)=>{const str=String(color||'#d73646');if(str.startsWith('rgb'))return (str.match(/[0-9]+/g)||[]).slice(0,3).map(Number);const v=str.replace('#','');return [0,2,4].map(i=>parseInt(v.slice(i,i+2),16)||0)};
const tone=(base,brightness)=>{const c=hex(base);return `rgb(${c.map(v=>Math.round(Math.max(0,Math.min(255,v*brightness)))).join(',')})`};
const ZONES={engine:{name:'Motor',point:[-1.34,1.36,-.10]},electrical:{name:'Eléctrico',point:[-1.68,1.26,.5]},front:{name:'Tren delantero',point:[-1.40,.52,.9]},rear:{name:'Tren trasero',point:[1.40,.50,.93]},cabin:{name:'Habitáculo',point:[.31,1.91,.13]},underbody:{name:'Bajos',point:[.15,.25,.68]}};
class Garage {
 constructor(canvas,onZone){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.onZone=onZone;this.az=-.68;this.el=.30;this.dist=8.6;this.hood=false;this.running=false;this.color='#c93646';this.body='hatchback';this.hover='';this.points=[];this.pointer=null;this.frame=0;this.zoneSelected='';this.setup();this.render();}
 setup(){const c=this.canvas;this.resize=()=>this.render();this.observer=new ResizeObserver(this.resize);this.observer.observe(c);c.addEventListener('pointerdown',e=>{this.pointer={x:e.clientX,y:e.clientY,px:e.clientX,py:e.clientY,drag:false};c.setPointerCapture(e.pointerId)});c.addEventListener('pointermove',e=>{if(!this.pointer)return;const dx=e.clientX-this.pointer.px,dy=e.clientY-this.pointer.py;if(Math.abs(e.clientX-this.pointer.x)+Math.abs(e.clientY-this.pointer.y)>6)this.pointer.drag=true;if(this.pointer.drag){this.az+=dx*.009;this.el=Math.max(.13,Math.min(1.10,this.el+dy*.005));this.render()}this.pointer.px=e.clientX;this.pointer.py=e.clientY});c.addEventListener('pointerup',e=>{if(this.pointer&&!this.pointer.drag){const rect=c.getBoundingClientRect();const x=e.clientX-rect.left,y=e.clientY-rect.top;let best=null,min=28;for(const p of this.points){const d=Math.hypot(p.x-x,p.y-y);if(d<min){min=d;best=p;}}if(best)this.onZone?.(best.key);}this.pointer=null});c.addEventListener('wheel',e=>{e.preventDefault();this.zoom(e.deltaY>0?-.5:.5)},{passive:false});}
 setVehicle(vehicle){const palette=['#c93646','#7289a7','#e2e3e4','#353b49','#6f8991','#ad8865'];const s=String(vehicle?.color||vehicle?.brand||'');let h=0;for(const ch of s)h=(h*31+ch.charCodeAt(0))>>>0;this.color=palette[h%palette.length];this.body=vehicle?.bodyType||'hatchback';this.render();}
 setSelected(zone){this.zoneSelected=zone;this.render();}
 setHood(v){this.hood=v;this.render();}
 toggleHood(){this.hood=!this.hood;this.render();return this.hood;}
 zoom(z){this.dist=Math.max(5,Math.min(13,this.dist-z));this.render();}
 reset(){this.az=-.68;this.el=.3;this.dist=8.6;this.render();}
 dispose(){this.observer?.disconnect()}
 render(){const c=this.canvas,rect=c.getBoundingClientRect();if(rect.width<2||rect.height<2)return;const dpr=Math.min(2,window.devicePixelRatio||1);c.width=Math.round(rect.width*dpr);c.height=Math.round(rect.height*dpr);const ctx=this.ctx;ctx.setTransform(dpr,0,0,dpr,0,0);const w=rect.width,h=rect.height;ctx.clearRect(0,0,w,h);
  const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#18243a');bg.addColorStop(.75,'#252b36');bg.addColorStop(1,'#161c27');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
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
  this.points=[];for(const [key,zone] of Object.entries(ZONES)){let point=zone.point;if(!this.hood&&(key==='engine'||key==='electrical'))point=[point[0],1.13,point[2]];const p=project(point);if(!p)continue;this.points.push({...p,key});const selected=key===this.zoneSelected;ctx.beginPath();ctx.arc(p.x,p.y,selected?16:13,0,Math.PI*2);ctx.fillStyle=selected?'#ff475b':'#171b28de';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=selected?'#fff':'#ff6576';ctx.stroke();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 11px sans-serif';ctx.fillText(String(this.points.length),p.x,p.y+4);}
  ctx.fillStyle='#d9dfe9aa';ctx.font='10px sans-serif';ctx.textAlign='left';ctx.fillText('THOKAR · ESCENA PROCEDIMENTAL 3D',12,h-43);
 }
}
export function createWorkshop(canvas,onZone){return new Garage(canvas,onZone)}
export {ZONES};

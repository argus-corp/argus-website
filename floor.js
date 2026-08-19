/* ============================================================
   ARGUS — Live Floor Model (factory-floor animation)
   Self-contained SVG scene + takt simulation. Renders into #floorSvg,
   drives the stat cells (#floorPass / #floorRework / #floorFail / #floorPacked).
   ============================================================ */
(function initFloor(){
"use strict";
const NS="http://www.w3.org/2000/svg";
const svg=document.getElementById("floorSvg");
if(!svg) return;
const el=(t,a={})=>{const e=document.createElementNS(NS,t);for(const k in a)if(a[k]!=null)e.setAttribute(k,a[k]);return e;};
const add=(p,t,a)=>{const e=el(t,a);p.appendChild(e);return e;};
const txt=(p,s,a)=>{const e=add(p,"text",a);e.textContent=s;return e;};

const C={pre:"#6a7280",preDim:"#525c6a",gar:"#8791a0",text2:"#a3aab6",muted:"#828a97",
  accent:"#00E5A0",accentL:"#33FFC0",accentD:"#00B880",blue:"#22c3e6",purple:"#6c63ff",
  danger:"#ff4d6a",amber:"#f5b942",hair:"rgba(255,255,255,.07)"};
const FM="'JetBrains Mono',monospace", FD="'Space Grotesk',sans-serif";
const TAU=Math.PI*2;

/* geometry */
const W=1200,H=700, ML=196, MR=140, MT=56;
const N=6;
const usable=W-ML-MR, pitch=usable/N;
const cx=i=>ML+pitch*(i+0.5);
const laneW=Math.min(52,pitch*0.36);
const RET=laneW/2+15;
const LABX=ML-52, CHX=38, KLABX=16;

const BANDS=[
 {k:"cut", label:"CUTTING",           h:48, gap:10, zone:"pre"},
 {k:"sew", label:"ASSEMBLY PHASE 1",            h:48, gap:10, zone:"pre"},
 {k:"link",label:"ASSEMBLY PHASE 2",           h:48, gap:10, zone:"pre"},
 {k:"asm", label:"ASSEMBLY PHASE 3",          h:48, gap:16, zone:"pre"},
 {k:"def", label:"DEFECT DETECTION",  h:86, gap:10, zone:"argus", proc:"cam"},
 {k:"iron",label:"IRONING · STEAMING",h:86, gap:10, zone:"mid",  proc:"iron"},
 {k:"meas",label:"MEASUREMENTS",      h:92, gap:10, zone:"argus", proc:"meas"},
 {k:"out", label:"PACKED · SHIPPED",  h:48, gap:0,  zone:"out"},
];
(()=>{let y=MT;for(const b of BANDS){b.y0=y;b.y1=y+b.h;b.cyc=(b.y0+b.y1)/2;y=b.y1+b.gap;}})();
const band=k=>BANDS.find(b=>b.k===k);
const TOP=BANDS[0].y0, BOT=BANDS[BANDS.length-1].y1;
band("def").cartY=band("def").y0+52;
band("iron").cartY=band("iron").y0+52;
band("meas").cartY=band("meas").y0+58;
const railHeadY=band("meas").y0+26;
const cartY=b=>b.cartY!=null?b.cartY:b.cyc;

const FLOW=["cut","sew","link","asm","def","iron","meas","out"];
const NF=FLOW.length;
const DEF_S=FLOW.indexOf("def");
const flowY=s=> s<0 ? TOP-46 : s>=NF ? BOT+44 : cartY(band(FLOW[s]));

/* helpers */
function coneD(x,y,hb,len){ return `M${x-3},${y} L${x-hb},${y+len} L${x+hb},${y+len} L${x+3},${y} Z`; }
const arrowUp=(p,x,y,w,h,fill,o=1)=>add(p,"path",{d:`M${x},${y-h} L${x-w},${y} L${x+w},${y} Z`,fill,opacity:o});
const arrowRight=(p,x,y,w,h,fill,o=1)=>add(p,"path",{d:`M${x+w},${y} L${x-h},${y-w} L${x-h},${y+w} Z`,fill,opacity:o});
function tshirt(x,y,s){const p=(dx,dy)=>`${(x+dx*s).toFixed(1)},${(y+dy*s).toFixed(1)}`;
  return `M${p(-6,-4)} L${p(-9.5,-1)} L${p(-6.5,2.5)} L${p(-6.5,8)} L${p(6.5,8)} L${p(6.5,2.5)} L${p(9.5,-1)} L${p(6,-4)} L${p(2.8,-4)} Q${p(0,-1.2)} ${p(-2.8,-4)} Z`;}
function arcPath(x,y,r,frac){ frac=Math.max(0,Math.min(.9999,frac));
  const a0=-Math.PI/2,a1=a0+frac*TAU,large=frac>0.5?1:0;
  return `M${(x+r*Math.cos(a0)).toFixed(2)},${(y+r*Math.sin(a0)).toFixed(2)} A${r},${r} 0 ${large} 1 ${(x+r*Math.cos(a1)).toFixed(2)},${(y+r*Math.sin(a1)).toFixed(2)}`;}

/* defs */
const gDefs=add(svg,"defs");
(()=>{const f=add(gDefs,"filter",{id:"floorGlow",x:"-60%",y:"-60%",width:"220%",height:"220%"});
  add(f,"feGaussianBlur",{in:"SourceGraphic",stdDeviation:"3",result:"b"});
  const m=add(f,"feMerge");add(m,"feMergeNode",{in:"b"});add(m,"feMergeNode",{in:"SourceGraphic"});})();
(()=>{const g=add(gDefs,"linearGradient",{id:"floorArgusG",x1:"0",y1:"0",x2:"0",y2:"1"});
  add(g,"stop",{offset:"0","stop-color":C.accent,"stop-opacity":".10"});
  add(g,"stop",{offset:"1","stop-color":C.accent,"stop-opacity":".02"});})();
(()=>{const g=add(gDefs,"linearGradient",{id:"floorConeG",x1:"0",y1:"0",x2:"0",y2:"1"});
  add(g,"stop",{offset:"0","stop-color":C.accentL,"stop-opacity":".55"});
  add(g,"stop",{offset:"1","stop-color":C.accentL,"stop-opacity":"0"});})();

const gBg=add(svg,"g"), gLane=add(svg,"g"), gStatic=add(svg,"g"),
      gCart=add(svg,"g"), gPie=add(svg,"g"), gFx=add(svg,"g");

/* bands + labels */
BANDS.forEach(b=>{
  const isA=b.zone==="argus";
  add(gBg,"rect",{x:ML-28,y:b.y0,width:usable+56,height:b.h,rx:13,
    fill:isA?"url(#floorArgusG)":"rgba(255,255,255,.014)",stroke:isA?"rgba(0,229,160,.24)":C.hair,"stroke-width":1});
  txt(gStatic,b.label,{x:LABX,y:b.cyc,fill:isA?C.accent:C.muted,"font-family":FM,"font-size":10.5,"letter-spacing":1,
    "text-anchor":"end","dominant-baseline":"middle"});
});

/* lanes + return tracks */
for(let i=0;i<N;i++){
  const x=cx(i);
  txt(gStatic,"LINE "+(i+1),{x,y:TOP-15,fill:C.text2,"font-family":FD,"font-size":12,"font-weight":600,"text-anchor":"middle","letter-spacing":.5});
  add(gLane,"line",{x1:x,y1:TOP,x2:x,y2:BOT,stroke:"rgba(255,255,255,.05)","stroke-width":laneW,"stroke-linecap":"round"});
  add(gLane,"line",{x1:x,y1:TOP,x2:x,y2:BOT,stroke:"rgba(255,255,255,.06)","stroke-width":1,"stroke-dasharray":"1 5"});
  add(gLane,"line",{x1:x+RET,y1:TOP+6,x2:x+RET,y2:band("meas").cyc,stroke:"rgba(255,77,106,.13)","stroke-width":1.4,"stroke-dasharray":"2 9"});
  arrowUp(gLane,x+RET,TOP+6,4.2,7,"rgba(255,77,106,.55)");
}

/* defect cameras */
const cams=[];
for(let i=0;i<N;i++){
  const x=cx(i), y=band("def").y0+15, g=add(gStatic,"g");
  add(g,"rect",{x:x-14,y:y-8,width:28,height:15,rx:4,fill:"#13161d",stroke:"rgba(0,229,160,.55)","stroke-width":1.2});
  add(g,"circle",{cx:x,cy:y-1,r:3.8,fill:"none",stroke:C.accent,"stroke-width":1.5});
  add(g,"circle",{cx:x,cy:y-1,r:1.5,fill:C.accent});
  const cone=add(g,"path",{d:coneD(x,y+7,15,18),fill:"url(#floorConeG)",opacity:.12});
  cams.push({x,cone,pulse:0});
}
/* ironing steam glyphs */
for(let i=0;i<N;i++){
  const x=cx(i), yc=band("iron").y0+16, g=add(gStatic,"g",{opacity:.7});
  add(g,"path",{d:`M${x-10},${yc+6} L${x-6},${yc-5} L${x+10},${yc-5} L${x+10},${yc+6} Z`,fill:"none",stroke:C.text2,"stroke-width":1.3,"stroke-linejoin":"round"});
  for(let s=-1;s<=1;s++) add(g,"path",{d:`M${x+s*5},${yc-9} q3,-3 0,-7`,fill:"none",stroke:C.blue,"stroke-width":1.2,"stroke-linecap":"round"});
}

/* measurement rail + head */
const railX0=ML-14, railX1=W-MR+14;
for(let i=0;i<=6;i++){const px=railX0+(railX1-railX0)*i/6;
  add(gStatic,"line",{x1:px,y1:railHeadY-18,x2:px,y2:railHeadY-6,stroke:"rgba(255,255,255,.12)","stroke-width":2});}
add(gStatic,"rect",{x:railX0,y:railHeadY-6,width:railX1-railX0,height:6,rx:3,fill:"#1a1e27",stroke:"rgba(0,229,160,.35)","stroke-width":1});
add(gStatic,"line",{x1:railX0,y1:railHeadY-3,x2:railX1,y2:railHeadY-3,stroke:"rgba(0,229,160,.25)","stroke-width":1,"stroke-dasharray":"4 6"});
const head=add(gStatic,"g");
const headCone=add(head,"path",{d:coneD(0,9,24,40),fill:"url(#floorConeG)",opacity:.35});
add(head,"rect",{x:-21,y:-13,width:42,height:19,rx:5,fill:"#0c0f15",stroke:C.accentL,"stroke-width":1.6,filter:"url(#floorGlow)"});
add(head,"rect",{x:-7,y:5,width:14,height:7,rx:2,fill:C.accentL});
txt(head,"SCAN",{x:0,y:-18,fill:C.accentL,"font-family":FM,"font-size":9,"letter-spacing":1,"text-anchor":"middle"});

/* ARGUS coverage — defect + measurements only */
(()=>{const x=W-MR+50;
  const brk=(y0,y1)=>add(gStatic,"path",{d:`M${x-8},${y0} H${x} V${y1} H${x-8}`,fill:"none",stroke:"rgba(0,229,160,.42)","stroke-width":1.5});
  brk(band("def").y0,band("def").y1); brk(band("meas").y0,band("meas").y1);
  const my=(band("def").y0+band("meas").y1)/2;
  txt(gStatic,"ARGUS COVERAGE",{x:x+15,y:my,fill:C.accent,"font-family":FD,"font-size":12,"font-weight":700,"letter-spacing":2,
    "text-anchor":"middle","dominant-baseline":"middle",transform:`rotate(90 ${x+15} ${my})`});})();

/* knowledge loop — from defect AND measurement to the start */
const laneL=cx(0)-laneW/2;
const yTop=band("cut").y0-9, yD=band("def").y1+5, yM=band("meas").y1+7, cutMid=band("cut").cyc;
(()=>{const s="rgba(34,195,230,.24)";
  add(gStatic,"path",{d:`M${laneL},${band("meas").cyc} C ${CHX+44},${band("meas").cyc} ${CHX},${band("meas").cyc} ${CHX},${yM}`,fill:"none",stroke:s,"stroke-width":1.4});
  add(gStatic,"path",{d:`M${laneL},${band("def").cyc} C ${CHX+44},${band("def").cyc} ${CHX},${band("def").cyc} ${CHX},${yD}`,fill:"none",stroke:s,"stroke-width":1.4});
  add(gStatic,"line",{x1:CHX,y1:yM,x2:CHX,y2:yTop,stroke:s,"stroke-width":1.4,"stroke-dasharray":"2 7"});
  add(gStatic,"path",{d:`M${CHX},${yTop} C ${CHX},${cutMid} ${CHX},${cutMid} ${laneL-20},${cutMid}`,fill:"none",stroke:s,"stroke-width":1.4});
  arrowRight(gStatic,laneL-8,cutMid,5,9,"rgba(34,195,230,.7)");
  txt(gStatic,"KNOWLEDGE LOOP",{x:KLABX,y:(yTop+yM)/2,fill:C.blue,"font-family":FM,"font-size":10,"letter-spacing":1.4,
    "text-anchor":"middle","dominant-baseline":"middle",transform:`rotate(-90 ${KLABX} ${(yTop+yM)/2})`});})();

/* ============ simulation ============ */
const rnd=(a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;})(20260723);
const P_CAM=0.06, P_MFAIL=0.03, P_MREWORK=0.07, REWORK_V=62;
const TAKT=5.6, TRANSFER=1.05, DWELL=TAKT-TRANSFER;
const ease=k=>k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;

let carts=[], rejects=[], scraps=[], pulses=[], fx=[];
let counters={pass:0,rework:0,fail:0,packed:0};
let tk=0, needCarts=true;
let measProg=Array(N).fill(0), scanned=new Set();
const flash=(x,y,color,r,life)=>fx.push({x,y,color,r,life,age:0});

function prefill(){ carts=[]; for(let s=0;s<NF;s++) for(let i=0;i<N;i++) carts.push({line:i,s,ps:s-1}); }
function spawnReject(line,bandY,pulseY){ rejects.push({line,x:cx(line)+RET,y:bandY});
  pulses.push({y:pulseY}); flash(cx(line)+RET,bandY,C.danger,17,.6); }
function taktTick(){
  for(const c of carts){ c.ps=c.s; c.s++; }
  carts=carts.filter(c=>c.s<NF+1);
  for(let i=0;i<N;i++) carts.push({line:i,s:0,ps:-1});
  for(const c of carts) if(c.s===DEF_S && rnd()<P_CAM){ counters.rework++; spawnReject(c.line,band("def").cyc,yD); cams[c.line].pulse=1; }
  measProg=Array(N).fill(0); scanned.clear(); needCarts=true;
}

function stepSim(dt){
  tk+=dt;
  if(tk>=TAKT){ tk-=TAKT; taktTick(); }
  const phase = tk<TRANSFER ? "transfer" : "dwell";
  const te = tk-TRANSFER;

  let hx=cx(0), scanning=false;
  if(phase==="dwell"){
    const slot=DWELL/7, k=Math.min(6,Math.floor(te/slot)), loc=(te-k*slot)/slot;
    if(k<6){
      const prev=k===0?0:k-1;
      hx=cx(prev)+(cx(k)-cx(prev))*ease(Math.min(1,loc/0.5));
      scanning=loc>=0.5;
      if(scanning && !scanned.has(k)){ scanned.add(k); measProg[k]=0.001;
        const r=rnd();
        if(r<P_MFAIL){ counters.fail++; flash(cx(k),railHeadY+32,C.danger,22,.6); scraps.push({x:cx(k),y:band("meas").cyc}); }
        else if(r<P_MFAIL+P_MREWORK){ counters.rework++; spawnReject(k,band("meas").cyc,yM); flash(cx(k),railHeadY+32,C.danger,18,.5); }
        else { counters.pass++; counters.packed++; flash(cx(k),railHeadY+32,C.accentL,18,.5); }
      }
    } else hx=cx(5)+(cx(0)-cx(5))*ease(Math.min(1,loc));
  }
  head.setAttribute("transform",`translate(${hx.toFixed(1)},${railHeadY})`);
  headCone.setAttribute("opacity",(scanning?0.85:0.3).toFixed(2));
  for(let i=0;i<N;i++) if(measProg[i]>0) measProg[i]=Math.min(1,measProg[i]+dt/(DWELL*0.5));
  window.__floorPD = phase==="dwell" ? Math.min(1,te/DWELL) : 0;

  for(const r of rejects) r.y-=REWORK_V*dt;
  rejects=rejects.filter(r=>{ if(r.y<=TOP-14){ counters.packed++; return false; } return true; });
  for(const p of pulses) p.y-=REWORK_V*dt; pulses=pulses.filter(p=>p.y>yTop-4);
  for(const s of scraps) s.y+=REWORK_V*1.1*dt; scraps=scraps.filter(s=>s.y<BOT+30);
  for(const c of cams) c.pulse=Math.max(0,c.pulse-dt*1.4);
  for(const f of fx) f.age+=dt; fx=fx.filter(f=>f.age<f.life);
  return phase;
}

/* ============ render ============ */
function drawGarment(parent,x,y,dim,red){
  add(parent,"ellipse",{cx:x,cy:y+9,rx:11,ry:2.6,fill:"rgba(0,0,0,.32)"});
  add(parent,"path",{d:tshirt(x,y,1.16),fill:red?C.danger:(dim?C.pre:C.gar),
    stroke:red?"#ff9aab":"rgba(255,255,255,.14)","stroke-width":1,opacity:dim?.82:1});
}
function drawCarts(){
  gCart.textContent="";
  for(const c of carts){
    const x=cx(c.line);
    let y; if(tk<TRANSFER){ const f=ease(Math.min(1,tk/TRANSFER)); y=flowY(c.ps)+(flowY(c.s)-flowY(c.ps))*f; } else y=flowY(c.s);
    if(y>BOT+28) continue;
    const zone = c.s>=0 && c.s<NF ? band(FLOW[c.s]).zone : "pre";
    drawGarment(gCart,x,y,zone==="pre",false);
  }
}
function drawPies(pd){
  gPie.textContent="";
  const ring=(x,y,r,frac,col)=>{
    add(gPie,"circle",{cx:x,cy:y,r,fill:"none",stroke:"rgba(255,255,255,.1)","stroke-width":3});
    if(frac>0.001){ add(gPie,"path",{d:arcPath(x,y,r,frac),fill:"none",stroke:col,"stroke-width":3,"stroke-linecap":"round",filter:"url(#floorGlow)"});
      const a=-Math.PI/2+Math.min(.9999,frac)*TAU;
      add(gPie,"line",{x1:x,y1:y,x2:x+r*Math.cos(a),y2:y+r*Math.sin(a),stroke:col,"stroke-width":1.3,opacity:.7}); }
  };
  for(let i=0;i<N;i++){
    ring(cx(i),band("def").cartY,18,pd,C.accent);
    ring(cx(i),band("iron").cartY,18,pd,C.blue);
    ring(cx(i),band("meas").cartY,18,measProg[i],C.accentL);
  }
}
function drawFx(){
  gFx.textContent="";
  for(const r of rejects){ add(gFx,"path",{d:tshirt(r.x,r.y,0.95),fill:C.danger,opacity:.95});
    add(gFx,"circle",{cx:r.x,cy:r.y+1,r:9,fill:"none",stroke:"#fff","stroke-width":1,opacity:.5}); }
  for(const s of scraps){ const o=Math.max(0,1-(s.y-band("meas").cyc)/120);
    add(gFx,"path",{d:tshirt(s.x,s.y,0.9),fill:C.danger,opacity:(o*.9).toFixed(2)});
    add(gFx,"path",{d:`M${s.x-4},${s.y-3} L${s.x+4},${s.y+4} M${s.x+4},${s.y-3} L${s.x-4},${s.y+4}`,stroke:"#fff","stroke-width":1.2,opacity:(o*.8).toFixed(2)}); }
  cams.forEach(c=>c.cone.setAttribute("opacity",(0.12+c.pulse*0.5).toFixed(3)));
  for(const f of fx){ const k=f.age/f.life;
    add(gFx,"circle",{cx:f.x,cy:f.y,r:(f.r*(0.4+k)).toFixed(1),fill:"none",stroke:f.color,"stroke-width":(2*(1-k)).toFixed(2),opacity:(1-k).toFixed(2)}); }
  for(const p of pulses){
    add(gFx,"circle",{cx:CHX,cy:p.y,r:4.2,fill:C.blue,filter:"url(#floorGlow)",opacity:.95});
    add(gFx,"circle",{cx:CHX,cy:p.y,r:9,fill:"none",stroke:C.blue,"stroke-width":1,opacity:.4}); }
}

/* HUD */
const $=id=>document.getElementById(id);
const elPass=$("floorPass"), elRework=$("floorRework"), elFail=$("floorFail"), elPacked=$("floorPacked");
function renderHUD(){
  if(elPass) elPass.textContent=counters.pass.toLocaleString("en-US");
  if(elRework) elRework.textContent=counters.rework.toLocaleString("en-US");
  if(elFail) elFail.textContent=counters.fail.toLocaleString("en-US");
  if(elPacked) elPacked.textContent=counters.packed.toLocaleString("en-US");
}

/* loop — pause when off-screen */
let last=0, visible=true;
try{ new IntersectionObserver(e=>{visible=e[0].isIntersecting;},{threshold:0}).observe(svg); }catch(e){}
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
function frame(ts){
  const dt=Math.min(0.05,(ts-last)/1000||0); last=ts;
  if(visible){
    const phase=stepSim(dt);
    if(phase==="transfer"||needCarts){ drawCarts(); if(phase!=="transfer") needCarts=false; }
    drawPies(window.__floorPD||0); drawFx(); renderHUD();
  }
  requestAnimationFrame(frame);
}
prefill();
if(reduce){ tk=TRANSFER+DWELL*0.5; stepSim(0); drawCarts(); drawPies(0.5); drawFx(); renderHUD(); }
else requestAnimationFrame(ts=>{last=ts;frame(ts);});
})();

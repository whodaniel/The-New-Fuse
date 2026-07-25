#!/usr/bin/env python3
"""Generate self-contained unified_graph_explorer.html from unified_graph.json.gz."""
import json, os

from common import (OUT as OUT_DIR, b64_of_file, viz_links,
                    CHROME_CSS, chrome_header, chrome_footer)

GZ = os.path.join(OUT_DIR, "unified_graph.json.gz")
STATS = os.path.join(OUT_DIR, "unified_graph_stats.json")
HTML_OUT = os.path.join(OUT_DIR, "unified_graph_explorer.html")

b64 = b64_of_file(GZ)
stats = json.load(open(STATS))
meta = stats["meta"]

links = viz_links(exclude_titles=("Unified Semantic Graph Explorer",))

TEMPLATE = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>TNF Unified Semantic Graph Explorer</title>
<style>
  :root { --bg:#0f1117; --panel:#181b24; --border:#2a2f3d; --text:#e6e8ee; --dim:#8b91a3; --accent:#5b9dff; }
  * { box-sizing:border-box; }
  html,body { margin:0; height:100%; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background:var(--bg); color:var(--text); overflow:hidden; }
  body { display:flex; flex-direction:column; }
  #layout { display:flex; flex:1; min-height:0; }
  #pagenav a { color:var(--dim); text-decoration:none; }
  #pagenav a:hover { color:var(--accent); }
__CHROME_CSS__
  #side { width:360px; min-width:360px; border-right:1px solid var(--border); display:flex; flex-direction:column; transition:margin-left .18s ease; }
  #side.collapsed { margin-left:-360px; }
  #collapse { position:absolute; top:10px; left:0; z-index:8; background:var(--panel); border:1px solid var(--border); border-left:none; color:var(--dim); border-radius:0 8px 8px 0; padding:8px 6px; cursor:pointer; font-size:12px; }
  #collapse:hover { color:var(--text); border-color:var(--accent); }
  #side header { padding:14px 16px 8px; }
  #side h1 { margin:0; font-size:16px; }
  #side .sub { color:var(--dim); font-size:11px; margin-top:2px; }
  #controls { padding:8px 16px; display:flex; flex-direction:column; gap:8px; }
  input[type=search] { background:var(--panel); border:1px solid var(--border); color:var(--text); border-radius:8px; padding:9px 12px; font-size:13px; outline:none; width:100%; }
  input[type=search]:focus { border-color:var(--accent); }
  #origins { display:flex; flex-wrap:wrap; gap:4px; }
  .chip { font-size:10px; padding:3px 8px; border-radius:10px; border:1px solid var(--border); cursor:pointer; user-select:none; opacity:.45; }
  .chip.on { opacity:1; }
  #results { flex:1; overflow-y:auto; padding:0 8px 8px; }
  .res { padding:6px 8px; border-radius:6px; cursor:pointer; font-size:12px; display:flex; align-items:center; gap:6px; }
  .res:hover { background:var(--panel); }
  .res.sel { background:#22304a; }
  .dot { width:8px; height:8px; border-radius:4px; flex:none; }
  .res .lbl { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-family:ui-monospace,Menlo,monospace; }
  .res .ty { color:var(--dim); font-size:10px; flex:none; }
  #rescount { color:var(--dim); font-size:11px; padding:2px 16px; }
  #detail { border-top:1px solid var(--border); padding:10px 16px; font-size:12px; max-height:270px; overflow-y:auto; }
  #detail .name { font-weight:600; font-size:13px; word-break:break-all; font-family:ui-monospace,Menlo,monospace; }
  #detail .kv { color:var(--dim); margin:4px 0; }
  #detail button, #topbar button, #pathbox button { background:var(--panel); border:1px solid var(--border); color:var(--text); border-radius:6px; padding:5px 10px; font-size:11px; cursor:pointer; }
  #detail button:hover, #topbar button:hover { border-color:var(--accent); }
  #main { flex:1; position:relative; min-width:0; }
  #canvas { position:absolute; inset:0; width:100%; height:100%; cursor:grab; }
  #linkspanel { display:none; padding:0 16px 12px; font-size:12px; overflow-y:auto; flex:1; }
  #linkspanel a { display:block; color:var(--accent); text-decoration:none; padding:7px 8px; border-radius:6px; font-size:12px; }
  #linkspanel a:hover { background:var(--panel); }
  #linkspanel .ldesc { color:var(--dim); font-size:10px; padding:0 8px 4px; margin-top:-4px; }
  #topbar { position:absolute; top:10px; left:12px; display:flex; gap:8px; align-items:center; background:rgba(24,27,36,.9); border:1px solid var(--border); border-radius:8px; padding:6px 10px; font-size:12px; z-index:5; }
  #topbar select { background:var(--panel); border:1px solid var(--border); color:var(--text); border-radius:6px; padding:3px 6px; font-size:12px; }
  #pathbox { position:absolute; top:10px; right:12px; width:300px; background:rgba(24,27,36,.94); border:1px solid var(--border); border-radius:8px; padding:10px 12px; font-size:12px; z-index:5; max-height:70%; overflow-y:auto; }
  #pathbox .step { padding:3px 0; font-family:ui-monospace,Menlo,monospace; font-size:11px; word-break:break-all; }
  #pathbox .via { color:var(--accent); font-size:10px; padding-left:14px; }
  #tooltip { position:absolute; pointer-events:none; background:#000c; border:1px solid var(--border); border-radius:6px; padding:6px 9px; font-size:11px; display:none; z-index:9; max-width:340px; word-break:break-all; }
  #legend { position:absolute; bottom:10px; left:12px; background:rgba(24,27,36,.9); border:1px solid var(--border); border-radius:8px; padding:8px 10px; font-size:10px; display:flex; flex-wrap:wrap; gap:6px 12px; max-width:60%; z-index:5; }
  .leg { display:flex; align-items:center; gap:4px; color:var(--dim); }
  #loading { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:var(--dim); font-size:15px; z-index:20; background:var(--bg); }
  #statspanel { display:none; padding:0 16px 12px; font-size:12px; overflow-y:auto; }
  #statspanel table { width:100%; border-collapse:collapse; }
  #statspanel td { padding:2px 4px; border-bottom:1px solid var(--border); font-size:11px; }
  #statspanel td:last-child { text-align:right; color:var(--dim); }
  #tabs { display:flex; gap:6px; padding:0 16px 6px; }
  #tabs .tab { font-size:11px; padding:4px 10px; border-radius:6px; border:1px solid var(--border); cursor:pointer; color:var(--dim); }
  #tabs .tab.on { color:var(--text); border-color:var(--accent); }
</style>
</head>
<body>
__HDR__
<div id="layout">
  <div id="side">
    <header>
      <h1>TNF Unified Semantic Graph</h1>
      <div class="sub">__NODES__ nodes &middot; __EDGES__ edges &middot; generated __GEN__</div>
      <div class="sub" id="pagenav"><a href="index.html">Hub</a> &middot; <a href="wordcount_report.html">Word Frequency</a></div>
    </header>
    <div id="tabs"><div class="tab on" data-t="search">Search</div><div class="tab" data-t="stats">Stats</div><div class="tab" data-t="links">Links</div></div>
    <div id="searchpanel" style="display:flex;flex-direction:column;flex:1;min-height:0">
      <div id="controls">
        <input type="search" id="q" placeholder="Search all nodes&hellip; (regex ok)">
        <div id="origins"></div>
      </div>
      <div id="rescount"></div>
      <div id="results"></div>
    </div>
    <div id="statspanel"></div>
    <div id="linkspanel"></div>
    <div id="detail"></div>
  </div>
  <div id="main">
    <div id="loading">Decompressing graph&hellip;</div>
    <canvas id="canvas"></canvas>
    <div id="collapse" title="Toggle sidebar">&#9668;</div>
    <div id="topbar" style="left:34px">
      <span>Depth</span>
      <select id="depth"><option>1</option><option selected>2</option><option>3</option></select>
      <span>Max nodes</span>
      <select id="maxn"><option>100</option><option selected>250</option><option>500</option></select>
      <button id="fit">Fit</button>
      <button id="clearpath">Clear A/B</button>
    </div>
    <div id="pathbox" style="display:none"></div>
    <div id="legend"></div>
    <div id="tooltip"></div>
  </div>
</div>
<script id="gzdata" type="application/octet-stream">__B64__</script>
<script>
const ORIGIN_COLORS = {
  'wiki':'#e879f9','memory-graph':'#c084fc','concept-kg':'#5b9dff','filesystem':'#94a3b8',
  'codebase-map':'#34d399','agent-graph':'#f97316','framework-graph':'#facc15',
  'knowledge-tree':'#f43f5e','wordcount':'#22d3ee',
  'handoff':'#fb7185','wiki-inbox':'#a78bfa','observatory':'#4ade80'
};
let G = null;              // {meta,nodes,edges}
let idOf = new Map();      // id -> index
let adj = [];              // index -> [[nbrIdx, edgeIdx], ...]
let degree = [];
let selected = -1, nodeA = -1, nodeB = -1;
let visible = [];          // indices in current ego view
let visSet = new Map();    // nodeIdx -> position obj {x,y,vx,vy,fixed}
let visEdges = [];         // [srcIdx,tgtIdx,edgeIdx]
let pathNodes = new Set(), pathEdges = new Set();
let cam = {x:0,y:0,k:1};
let simTimer = null;
const $ = id => document.getElementById(id);
const canvas = $('canvas'), ctx = canvas.getContext('2d');

function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}

async function init(){
  const b64=$('gzdata').textContent.trim();
  const bin=atob(b64); const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
  if(typeof DecompressionStream==='undefined'){ $('loading').textContent='Needs Chrome/Edge/Safari 16.4+ (DecompressionStream)'; return; }
  const ds=new DecompressionStream('gzip');
  G=JSON.parse(await new Response(new Blob([bytes]).stream().pipeThrough(ds)).text());
  G.nodes.forEach((n,i)=>idOf.set(n.id,i));
  adj=G.nodes.map(()=>[]); degree=new Array(G.nodes.length).fill(0);
  G.edges.forEach((e,ei)=>{
    const s=idOf.get(e.s), t=idOf.get(e.t);
    if(s===undefined||t===undefined) return;
    e.si=s; e.ti=t;
    adj[s].push([t,ei]); adj[t].push([s,ei]);
    degree[s]++; degree[t]++;
  });
  buildOriginChips(); buildLegend(); buildStats();
  $('loading').style.display='none';
  resize(); doSearch();
  // sensible default focus: highest-degree agent node
  let best=-1,bd=-1;
  G.nodes.forEach((n,i)=>{ if(n.origin==='agent-graph'&&degree[i]>bd){bd=degree[i];best=i;} });
  if(best>=0) focusNode(best);
}

/* ---------- search ---------- */
const activeOrigins = new Set(Object.keys(ORIGIN_COLORS));
function buildOriginChips(){
  const box=$('origins');
  Object.keys(ORIGIN_COLORS).forEach(o=>{
    const c=document.createElement('div'); c.className='chip on';
    c.innerHTML=`<span style="color:${ORIGIN_COLORS[o]}">&#9679;</span> ${o}`;
    c.onclick=()=>{ if(activeOrigins.has(o)){activeOrigins.delete(o);c.classList.remove('on');} else {activeOrigins.add(o);c.classList.add('on');} doSearch(); };
    box.appendChild(c);
  });
}
function buildLegend(){
  $('legend').innerHTML=Object.entries(ORIGIN_COLORS).map(([o,c])=>`<span class="leg"><span class="dot" style="background:${c}"></span>${o}</span>`).join('');
}
let deb;
function doSearch(){
  const v=$('q').value.trim(); let re=null;
  if(v){ try{re=new RegExp(v,'i');}catch(e){re=null;} }
  const lv=v.toLowerCase();
  const out=[]; let total=0;
  for(let i=0;i<G.nodes.length;i++){
    const n=G.nodes[i];
    if(!activeOrigins.has(n.origin)) continue;
    if(v){ if(re){ if(!re.test(n.label)&&!re.test(n.id)) continue; }
           else if(!n.label.toLowerCase().includes(lv)&&!n.id.toLowerCase().includes(lv)) continue; }
    total++;
    if(out.length<300) out.push(i);
  }
  out.sort((a,b)=>degree[b]-degree[a]);
  $('rescount').textContent=`${total.toLocaleString()} matches${total>300?' (top 300 by degree shown)':''}`;
  $('results').innerHTML=out.map(i=>{
    const n=G.nodes[i];
    return `<div class="res${i===selected?' sel':''}" data-i="${i}"><span class="dot" style="background:${ORIGIN_COLORS[n.origin]||'#888'}"></span><span class="lbl">${esc(n.label)}</span><span class="ty">${n.type}&middot;${degree[i]}</span></div>`;
  }).join('');
  [...document.querySelectorAll('.res')].forEach(el=>el.onclick=()=>focusNode(+el.dataset.i));
}
$('q').addEventListener('input',()=>{clearTimeout(deb);deb=setTimeout(doSearch,180);});

/* ---------- ego network ---------- */
function focusNode(i){
  selected=i;
  const depth=+$('depth').value, cap=+$('maxn').value;
  const chosen=new Set([i]);
  let frontier=[i];
  for(let d=0;d<depth&&chosen.size<cap;d++){
    const next=[];
    for(const u of frontier){
      const nbrs=adj[u].slice().sort((a,b)=>degree[b[0]]-degree[a[0]]);
      for(const [v] of nbrs){
        if(chosen.size>=cap) break;
        if(!chosen.has(v)){ chosen.add(v); next.push(v); }
      }
      if(chosen.size>=cap) break;
    }
    frontier=next;
  }
  layoutSubgraph(chosen, i);
  renderDetail();
  doSearch();
  if(nodeA>=0&&nodeB>=0) tracePath();
}
function layoutSubgraph(chosen, center){
  visible=[...chosen];
  const keep=new Map();
  visible.forEach(v=>{
    const prev=visSet.get(v);
    keep.set(v, prev || {x:(Math.sin(v*13.37)*300), y:(Math.cos(v*7.77)*300), vx:0, vy:0});
  });
  visSet=keep;
  const c=visSet.get(center); c.x=0; c.y=0;
  visEdges=[];
  const inView=new Set(visible);
  G.edges.forEach((e,ei)=>{ if(inView.has(e.si)&&inView.has(e.ti)) visEdges.push([e.si,e.ti,ei]); });
  cam={x:0,y:0,k:1};
  startSim();
}
function startSim(){
  if(simTimer) cancelAnimationFrame(simTimer);
  let iter=0;
  const N=visible.length;
  function step(){
    const rep = N>300?900:2200, spring=0.02, ideal=70;
    for(let a=0;a<N;a++){
      const na=visSet.get(visible[a]);
      for(let b=a+1;b<N;b++){
        const nb=visSet.get(visible[b]);
        let dx=na.x-nb.x, dy=na.y-nb.y;
        let d2=dx*dx+dy*dy+0.01, d=Math.sqrt(d2);
        if(d<400){ const f=rep/d2; dx/=d; dy/=d; na.vx+=dx*f; na.vy+=dy*f; nb.vx-=dx*f; nb.vy-=dy*f; }
      }
    }
    for(const [s,t] of visEdges){
      const ns=visSet.get(s), nt=visSet.get(t);
      let dx=nt.x-ns.x, dy=nt.y-ns.y;
      const d=Math.sqrt(dx*dx+dy*dy)+0.01;
      const f=spring*(d-ideal);
      dx/=d; dy/=d;
      ns.vx+=dx*f; ns.vy+=dy*f; nt.vx-=dx*f; nt.vy-=dy*f;
    }
    for(const v of visible){
      const n=visSet.get(v);
      if(n.fixed) { n.vx=0; n.vy=0; continue; }
      n.vx*=0.85; n.vy*=0.85;
      n.x+=Math.max(-25,Math.min(25,n.vx));
      n.y+=Math.max(-25,Math.min(25,n.vy));
    }
    draw();
    if(++iter<160) simTimer=requestAnimationFrame(step);
    if(iter===60||iter===160) fitView();
  }
  step();
}
function fitView(){
  if(!visible.length) return;
  let minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
  for(const v of visible){
    const p=visSet.get(v);
    if(p.x<minX)minX=p.x; if(p.x>maxX)maxX=p.x;
    if(p.y<minY)minY=p.y; if(p.y>maxY)maxY=p.y;
  }
  const w=canvas.clientWidth, h=canvas.clientHeight;
  const bw=Math.max(maxX-minX,60), bh=Math.max(maxY-minY,60);
  cam.x=(minX+maxX)/2; cam.y=(minY+maxY)/2;
  cam.k=Math.max(0.15,Math.min(4, Math.min((w-140)/bw,(h-140)/bh)));
  draw();
}

/* ---------- drawing ---------- */
function resize(){
  canvas.width=canvas.clientWidth*devicePixelRatio;
  canvas.height=canvas.clientHeight*devicePixelRatio;
  draw();
}
window.addEventListener('resize',resize);
new ResizeObserver(()=>resize()).observe(document.getElementById('main'));
$('collapse').onclick=()=>{
  const side=document.getElementById('side');
  side.classList.toggle('collapsed');
  $('collapse').innerHTML=side.classList.contains('collapsed')?'&#9658;':'&#9668;';
  setTimeout(()=>{resize(); fitView();},200);
};
$('fit').onclick=()=>fitView();
function w2s(x,y){ return [ (x-cam.x)*cam.k + canvas.clientWidth/2, (y-cam.y)*cam.k + canvas.clientHeight/2 ]; }
function s2w(px,py){ return [ (px-canvas.clientWidth/2)/cam.k + cam.x, (py-canvas.clientHeight/2)/cam.k + cam.y ]; }
function nodeR(i){ return Math.min(16, 4+Math.sqrt(degree[i])); }
function draw(){
  if(!G) return;
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
  // edges
  for(const [s,t,ei] of visEdges){
    const a=visSet.get(s), b=visSet.get(t);
    const [x1,y1]=w2s(a.x,a.y), [x2,y2]=w2s(b.x,b.y);
    const onPath=pathEdges.has(ei);
    ctx.strokeStyle=onPath?'#fbbf24':'#3a4154';
    ctx.lineWidth=onPath?2.4:0.7;
    ctx.globalAlpha=onPath?1:0.75;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  }
  ctx.globalAlpha=1;
  // nodes
  for(const v of visible){
    const p=visSet.get(v), n=G.nodes[v];
    const [x,y]=w2s(p.x,p.y);
    const r=nodeR(v)*Math.min(cam.k,1.4);
    ctx.beginPath(); ctx.arc(x,y,r,0,6.284);
    ctx.fillStyle=ORIGIN_COLORS[n.origin]||'#888';
    ctx.fill();
    if(v===selected||pathNodes.has(v)||v===nodeA||v===nodeB){
      ctx.strokeStyle=v===selected?'#fff':'#fbbf24'; ctx.lineWidth=2; ctx.stroke();
    }
  }
  // labels for large/selected nodes
  ctx.font='10px ui-monospace,Menlo,monospace'; ctx.fillStyle='#cdd3e0';
  const labelSet=visible.filter(v=>v===selected||pathNodes.has(v)||degree[v]>30||visible.length<60);
  for(const v of labelSet.slice(0,80)){
    const p=visSet.get(v); const [x,y]=w2s(p.x,p.y);
    const lbl=G.nodes[v].label;
    ctx.fillText(lbl.length>34?lbl.slice(0,32)+'\u2026':lbl, x+nodeR(v)+3, y+3);
  }
  if(nodeA>=0){ markAB(nodeA,'A'); } if(nodeB>=0){ markAB(nodeB,'B'); }
}
function markAB(v,ch){
  if(!visSet.has(v)) return;
  const p=visSet.get(v); const [x,y]=w2s(p.x,p.y);
  ctx.font='bold 11px sans-serif'; ctx.fillStyle='#fbbf24';
  ctx.fillText(ch, x-3, y-nodeR(v)-5);
}

/* ---------- interaction ---------- */
let dragging=null, panning=false, lastMouse=null;
function nodeAt(px,py){
  const [wx,wy]=s2w(px,py);
  for(const v of visible){
    const p=visSet.get(v);
    const dx=p.x-wx, dy=p.y-wy, r=(nodeR(v)+3)/Math.min(cam.k,1.4);
    if(dx*dx+dy*dy < r*r/(cam.k*cam.k)*4) return v;
  }
  return -1;
}
canvas.addEventListener('mousedown',e=>{
  const r=canvas.getBoundingClientRect();
  const v=nodeAt(e.clientX-r.left,e.clientY-r.top);
  if(v>=0){ dragging=v; visSet.get(v).fixed=true; }
  else { panning=true; canvas.style.cursor='grabbing'; }
  lastMouse=[e.clientX,e.clientY];
});
window.addEventListener('mousemove',e=>{
  const r=canvas.getBoundingClientRect();
  if(dragging!==null){
    const [wx,wy]=s2w(e.clientX-r.left,e.clientY-r.top);
    const p=visSet.get(dragging); p.x=wx; p.y=wy; draw();
  } else if(panning){
    cam.x-=(e.clientX-lastMouse[0])/cam.k; cam.y-=(e.clientY-lastMouse[1])/cam.k;
    lastMouse=[e.clientX,e.clientY]; draw();
  } else {
    const v=nodeAt(e.clientX-r.left,e.clientY-r.top);
    const tip=$('tooltip');
    if(v>=0){
      const n=G.nodes[v];
      tip.style.display='block';
      tip.style.left=(e.clientX-r.left+14)+'px'; tip.style.top=(e.clientY-r.top+10)+'px';
      tip.innerHTML=`<b>${esc(n.label)}</b><br><span style="color:${ORIGIN_COLORS[n.origin]}">${n.origin}</span> &middot; ${n.type} &middot; deg ${degree[v]} &middot; w ${n.weight}`;
    } else tip.style.display='none';
  }
});
window.addEventListener('mouseup',e=>{
  if(dragging!==null){
    const r=canvas.getBoundingClientRect();
    const v=nodeAt(e.clientX-r.left,e.clientY-r.top);
    const moved=Math.hypot(e.clientX-lastMouse[0],e.clientY-lastMouse[1]);
    if(moved<4 && v===dragging) focusNode(v);
    else visSet.get(dragging).fixed=false;
    dragging=null;
  }
  panning=false; canvas.style.cursor='grab';
});
canvas.addEventListener('wheel',e=>{
  e.preventDefault();
  const f=e.deltaY<0?1.12:0.89;
  cam.k=Math.max(0.15,Math.min(6,cam.k*f));
  draw();
},{passive:false});
$('depth').onchange=()=>{ if(selected>=0) focusNode(selected); };
$('maxn').onchange=()=>{ if(selected>=0) focusNode(selected); };

/* ---------- detail + path tracing ---------- */
function renderDetail(){
  if(selected<0){ $('detail').innerHTML=''; return; }
  const n=G.nodes[selected];
  const nb=adj[selected].slice(0,8).map(([v,ei])=>`<div class="kv">&rarr; <span style="color:var(--accent)">${esc(G.edges[ei].type)}</span> ${esc(G.nodes[v].label.slice(0,44))}</div>`).join('');
  $('detail').innerHTML=`
    <div class="name"><span class="dot" style="display:inline-block;background:${ORIGIN_COLORS[n.origin]}"></span> ${esc(n.label)}</div>
    <div class="kv">${n.id} &middot; ${n.origin} / ${n.type} &middot; degree ${degree[selected]} &middot; weight ${n.weight}</div>
    <div style="margin:6px 0"><button id="setA">Set as A</button> <button id="setB">Set as B</button></div>
    ${nb}${adj[selected].length>8?`<div class="kv">&hellip;${adj[selected].length-8} more edges</div>`:''}`;
  $('setA').onclick=()=>{ nodeA=selected; tracePath(); draw(); };
  $('setB').onclick=()=>{ nodeB=selected; tracePath(); draw(); };
}
$('clearpath').onclick=()=>{ nodeA=nodeB=-1; pathNodes.clear(); pathEdges.clear(); $('pathbox').style.display='none'; draw(); };

function tracePath(){
  pathNodes.clear(); pathEdges.clear();
  if(nodeA<0||nodeB<0){ draw(); return; }
  // BFS shortest path
  const prev=new Map(); prev.set(nodeA,[-1,-1]);
  let frontier=[nodeA], found=false;
  while(frontier.length&&!found){
    const next=[];
    for(const u of frontier){
      for(const [v,ei] of adj[u]){
        if(!prev.has(v)){ prev.set(v,[u,ei]); if(v===nodeB){found=true;break;} next.push(v); }
      }
      if(found) break;
    }
    frontier=next;
    if(prev.size>200000) break;
  }
  const box=$('pathbox'); box.style.display='block';
  if(!prev.has(nodeB)){
    box.innerHTML=`<b>No path</b> between A and B (disconnected components).`;
    draw(); return;
  }
  const chain=[]; let cur=nodeB;
  while(cur!==-1){ const [p,ei]=prev.get(cur); chain.push([cur,ei]); cur=p; }
  chain.reverse();
  let html=`<b>Path A &rarr; B</b> &middot; ${chain.length-1} hops<br>`;
  chain.forEach(([v,ei],k)=>{
    pathNodes.add(v);
    if(ei>=0){ pathEdges.add(ei); html+=`<div class="via">&darr; ${esc(G.edges[ei].type)}</div>`; }
    const n=G.nodes[v];
    html+=`<div class="step"><span class="dot" style="display:inline-block;background:${ORIGIN_COLORS[n.origin]}"></span> ${esc(n.label.slice(0,60))} <span style="color:var(--dim)">(${n.origin})</span></div>`;
  });
  box.innerHTML=html;
  // ensure path visible: merge path into view
  const inView=new Set(visible);
  let added=false;
  for(const v of pathNodes) if(!inView.has(v)){ inView.add(v); added=true; }
  if(added) layoutSubgraph(inView, selected>=0?selected:nodeA);
  draw();
}

/* ---------- stats tab ---------- */
function buildStats(){
  const s=__STATS__;
  const hubs=[...G.nodes.keys()].sort((a,b)=>degree[b]-degree[a]).slice(0,20);
  const row=(k,v)=>`<tr><td>${esc(String(k))}</td><td>${(+v).toLocaleString()}</td></tr>`;
  $('statspanel').innerHTML=`
    <p><b>Nodes by origin</b></p><table>${Object.entries(s.nodes_by_origin).map(([k,v])=>row(k,v)).join('')}</table>
    <p><b>Top edge types</b></p><table>${Object.entries(s.edges_by_type).slice(0,15).map(([k,v])=>row(k,v)).join('')}</table>
    <p><b>Cross-system links</b></p><table>${Object.entries(s.cross_links).map(([k,v])=>row(k,v)).join('')}</table>
    <p><b>Top hubs (degree)</b></p><table>${hubs.map(i=>`<tr><td style="cursor:pointer;color:var(--accent)" onclick="focusNode(${i});document.querySelector('[data-t=search]').click()">${esc(G.nodes[i].label.slice(0,40))}</td><td>${degree[i].toLocaleString()}</td></tr>`).join('')}</table>`;
}
const VIZ_LINKS=__LINKS__;
function buildLinks(){
  $('linkspanel').innerHTML='<p style="color:var(--dim);font-size:11px">Other TNF visualization &amp; graph assets found in the codebase:</p>'+
    VIZ_LINKS.map(l=>`<a href="${l.href}" target="_blank">${esc(l.title)}</a><div class="ldesc">${esc(l.desc)}</div>`).join('');
}
document.querySelectorAll('#tabs .tab').forEach(t=>t.onclick=()=>{
  document.querySelectorAll('#tabs .tab').forEach(x=>x.classList.remove('on'));
  t.classList.add('on');
  $('searchpanel').style.display=t.dataset.t==='search'?'flex':'none';
  $('statspanel').style.display=t.dataset.t==='stats'?'block':'none';
  $('linkspanel').style.display=t.dataset.t==='links'?'block':'none';
});
buildLinks();

init();
</script>
__FTR__
</body>
</html>"""

page = (TEMPLATE
        .replace("__CHROME_CSS__", CHROME_CSS)
        .replace("__HDR__", chrome_header("unified_graph_explorer.html"))
        .replace("__FTR__", chrome_footer())
        .replace("__B64__", b64)
        .replace("__NODES__", f"{meta['nodes']:,}")
        .replace("__EDGES__", f"{meta['edges']:,}")
        .replace("__GEN__", meta["generated"])
        .replace("__LINKS__", json.dumps(links))
        .replace("__STATS__", json.dumps({
            "nodes_by_origin": stats["nodes_by_origin"],
            "edges_by_type": stats["edges_by_type"],
            "cross_links": stats["cross_links"]})))

open(HTML_OUT, "w", encoding="utf-8").write(page)
print(HTML_OUT, os.path.getsize(HTML_OUT) / 1048576, "MB")

#!/usr/bin/env python3
import json, html, os

from common import OUT as OUT_DIR, b64_of_file

TSV = os.path.join(OUT_DIR, "wordcount_full.tsv.gz")
STATS = os.path.join(OUT_DIR, "wordcount_stats.json")
HTML_OUT = os.path.join(OUT_DIR, "wordcount_report.html")

with open(STATS) as f:
    stats = json.load(f)

b64 = b64_of_file(TSV)

page = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>TNF Codebase Word Frequency Report</title>
<style>
  :root {{ --bg:#0f1117; --panel:#181b24; --border:#2a2f3d; --text:#e6e8ee; --dim:#8b91a3; --accent:#5b9dff; --bar:#2d5fa8; }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background:var(--bg); color:var(--text); }}
  header {{ padding:32px 40px 16px; }}
  h1 {{ margin:0 0 4px; font-size:24px; }}
  .sub {{ color:var(--dim); font-size:13px; }}
  .cards {{ display:flex; gap:16px; flex-wrap:wrap; padding:16px 40px; }}
  .card {{ background:var(--panel); border:1px solid var(--border); border-radius:10px; padding:16px 22px; min-width:160px; }}
  .card .num {{ font-size:22px; font-weight:600; color:var(--accent); }}
  .card .lbl {{ font-size:12px; color:var(--dim); margin-top:2px; }}
  .controls {{ padding:8px 40px 12px; display:flex; gap:14px; align-items:center; flex-wrap:wrap; }}
  input[type=search] {{ background:var(--panel); border:1px solid var(--border); color:var(--text); border-radius:8px; padding:10px 14px; font-size:14px; width:320px; outline:none; }}
  input[type=search]:focus {{ border-color:var(--accent); }}
  select {{ background:var(--panel); border:1px solid var(--border); color:var(--text); border-radius:8px; padding:8px 10px; font-size:13px; }}
  .hint {{ color:var(--dim); font-size:12px; }}
  .pager {{ display:flex; gap:8px; align-items:center; padding:4px 40px 12px; flex-wrap:wrap; }}
  .pager button {{ background:var(--panel); border:1px solid var(--border); color:var(--text); border-radius:8px; padding:8px 14px; font-size:13px; cursor:pointer; }}
  .pager button:hover:not(:disabled) {{ border-color:var(--accent); }}
  .pager button:disabled {{ opacity:.35; cursor:default; }}
  .pager input {{ background:var(--panel); border:1px solid var(--border); color:var(--text); border-radius:8px; padding:8px 10px; font-size:13px; width:90px; }}
  .pager .info {{ color:var(--dim); font-size:13px; }}
  table {{ border-collapse:collapse; width:calc(100% - 80px); margin:0 40px 12px; }}
  th, td {{ text-align:left; padding:7px 12px; font-size:13px; border-bottom:1px solid var(--border); }}
  th {{ color:var(--dim); font-weight:500; position:sticky; top:0; background:var(--bg); }}
  td.rank {{ color:var(--dim); width:80px; }}
  td.term {{ font-family:ui-monospace,SFMono-Regular,Menlo,monospace; word-break:break-all; }}
  td.count {{ width:120px; text-align:right; font-variant-numeric:tabular-nums; }}
  td.bar {{ width:30%; }}
  .barfill {{ height:10px; background:linear-gradient(90deg,var(--bar),var(--accent)); border-radius:5px; min-width:2px; }}
  #loading {{ padding:40px; color:var(--dim); font-size:15px; }}
  .foot {{ padding:0 40px 40px; color:var(--dim); font-size:12px; }}
</style>
</head>
<body>
<header>
  <h1>TNF Codebase &mdash; Word / Term Frequency</h1>
  <div class="sub">{html.escape(stats['root'])} &middot; generated {stats['generated']}</div>
</header>
<div class="cards">
  <div class="card"><div class="num">{stats['files_indexed']:,}</div><div class="lbl">Files indexed</div></div>
  <div class="card"><div class="num">{stats['text_bytes']/1048576:,.0f} MB</div><div class="lbl">Text scanned</div></div>
  <div class="card"><div class="num">{stats['unique_terms']:,}</div><div class="lbl">Unique terms</div></div>
  <div class="card"><div class="num">{stats['total_occurrences']:,}</div><div class="lbl">Total occurrences</div></div>
</div>
<div id="loading">Decompressing full dataset ({stats['unique_terms']:,} terms)&hellip;</div>
<div id="app" style="display:none">
<div class="controls">
  <input type="search" id="q" placeholder="Filter terms&hellip; (regex ok)">
  <label class="hint"><input type="checkbox" id="hideShort"> hide 1&ndash;2 letter tokens</label>
  <label class="hint">page size
    <select id="psize">
      <option>100</option><option selected>250</option><option>500</option><option>1000</option>
    </select>
  </label>
</div>
<div class="pager">
  <button id="first">&laquo; First</button>
  <button id="prev">&lsaquo; Prev</button>
  <span class="info" id="pinfo"></span>
  <button id="next">Next &rsaquo;</button>
  <button id="last">Last &raquo;</button>
  <input id="goto" type="number" min="1" placeholder="page #">
  <button id="go">Go</button>
  <span class="info" id="minfo"></span>
</div>
<table>
  <thead><tr><th>Rank</th><th>Term</th><th style="text-align:right">Count</th><th></th></tr></thead>
  <tbody id="tb"></tbody>
</table>
<div class="pager">
  <button id="first2">&laquo; First</button>
  <button id="prev2">&lsaquo; Prev</button>
  <span class="info" id="pinfo2"></span>
  <button id="next2">Next &rsaquo;</button>
  <button id="last2">Last &raquo;</button>
</div>
</div>
<div class="foot">All {stats['unique_terms']:,} terms are embedded (gzip) in this file and decompressed in your browser. Source data: wordcount_full.tsv.gz.</div>
<script id="gzdata" type="application/octet-stream">{b64}</script>
<script>
let TERMS = [], COUNTS = null, MAXC = 1;
let filtered = null; // Uint32Array of indices into TERMS
let page = 0, pageSize = 250;

const $ = id => document.getElementById(id);
function esc(s) {{ const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }}

async function init() {{
  const b64 = $('gzdata').textContent.trim();
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  let text;
  if (typeof DecompressionStream !== 'undefined') {{
    const ds = new DecompressionStream('gzip');
    const stream = new Blob([bytes]).stream().pipeThrough(ds);
    text = await new Response(stream).text();
  }} else {{
    $('loading').textContent = 'This browser lacks DecompressionStream. Please open in Chrome, Edge, or Safari 16.4+.';
    return;
  }}
  const lines = text.split('\\n');
  const n = lines.length;
  TERMS = new Array(n); COUNTS = new Float64Array(n);
  let k = 0;
  for (let i = 1; i < n; i++) {{  // skip header
    const line = lines[i];
    if (!line) continue;
    const tab = line.lastIndexOf('\\t');
    TERMS[k] = line.slice(0, tab);
    COUNTS[k] = +line.slice(tab + 1);
    k++;
  }}
  TERMS.length = k;
  COUNTS = COUNTS.subarray(0, k);
  MAXC = COUNTS[0] || 1;
  $('loading').style.display = 'none';
  $('app').style.display = '';
  applyFilter();
}}

function applyFilter() {{
  const v = $('q').value.trim();
  const hs = $('hideShort').checked;
  let re = null;
  if (v) {{ try {{ re = new RegExp(v, 'i'); }} catch (e) {{ re = null; }} }}
  const lv = v.toLowerCase();
  const idx = new Uint32Array(TERMS.length);
  let m = 0;
  for (let i = 0; i < TERMS.length; i++) {{
    const t = TERMS[i];
    if (hs && t.length <= 2) continue;
    if (v) {{
      if (re) {{ if (!re.test(t)) continue; }}
      else if (!t.toLowerCase().includes(lv)) continue;
    }}
    idx[m++] = i;
  }}
  filtered = idx.subarray(0, m);
  page = 0;
  render();
}}

function render() {{
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  page = Math.min(Math.max(0, page), pages - 1);
  const start = page * pageSize, end = Math.min(start + pageSize, total);
  const out = [];
  for (let j = start; j < end; j++) {{
    const i = filtered[j];
    const c = COUNTS[i];
    const w = Math.max(0.4, (c / MAXC) * 100);
    out.push(`<tr><td class="rank">${{(i + 1).toLocaleString()}}</td><td class="term">${{esc(TERMS[i])}}</td><td class="count">${{c.toLocaleString()}}</td><td class="bar"><div class="barfill" style="width:${{w}}%"></div></td></tr>`);
  }}
  $('tb').innerHTML = out.join('');
  const info = `Page ${{(page + 1).toLocaleString()}} of ${{pages.toLocaleString()}}`;
  $('pinfo').textContent = info; $('pinfo2').textContent = info;
  $('minfo').textContent = total === TERMS.length
    ? `${{total.toLocaleString()}} terms`
    : `${{total.toLocaleString()}} of ${{TERMS.length.toLocaleString()}} terms match`;
  const atFirst = page === 0, atLast = page >= pages - 1;
  for (const id of ['first','first2','prev','prev2']) $(id).disabled = atFirst;
  for (const id of ['next','next2','last','last2']) $(id).disabled = atLast;
}}

let deb;
$('q').addEventListener('input', () => {{ clearTimeout(deb); deb = setTimeout(applyFilter, 200); }});
$('hideShort').addEventListener('change', applyFilter);
$('psize').addEventListener('change', () => {{ pageSize = +$('psize').value; page = 0; render(); }});
for (const [id, fn] of [
  ['first', () => page = 0], ['first2', () => page = 0],
  ['prev', () => page--], ['prev2', () => page--],
  ['next', () => page++], ['next2', () => page++],
  ['last', () => page = 1e9], ['last2', () => page = 1e9],
]) $(id).addEventListener('click', () => {{ fn(); render(); }});
$('go').addEventListener('click', () => {{ const p = +$('goto').value; if (p >= 1) {{ page = p - 1; render(); }} }});
$('goto').addEventListener('keydown', e => {{ if (e.key === 'Enter') $('go').click(); }});

init();
</script>
</body>
</html>"""

with open(HTML_OUT, "w", encoding="utf-8") as f:
    f.write(page)
print(HTML_OUT, os.path.getsize(HTML_OUT) / 1048576, "MB")

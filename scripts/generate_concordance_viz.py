#!/usr/bin/env python3
"""Generate the Concordance Visualizer HTML dashboard.

Reads the concordance TSV data and produces:
1. A standalone HTML file with embedded top-N data for instant rendering
2. A compact JSON file for the React component to consume
3. Both files get uploaded to Supabase Storage
"""

import os
import re
import json
import sys
import gzip
import time
from collections import defaultdict, Counter
from pathlib import Path

ROOT = Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CONCORDANCE_DIR = ROOT / "concordance_results"
OUTPUT_DIR = ROOT / "apps" / "frontend" / "public" / "visualizations"

SUPABASE_URL = "https://wslydgtgindrywldatbv.supabase.co"
BUCKET = "concordance"
STORAGE_PATH = "20260508_124525"


def _count_refs(refs_str):
    total = 0
    files = []
    for ref in refs_str.split(';'):
        if ':' not in ref:
            continue
        filepath, lines_str = ref.split(':', 1)
        for entry in lines_str.split(','):
            entry = entry.strip()
            if entry.startswith('..+'):
                total += int(entry[3:])
            else:
                total += 1
        files.append(filepath)
    return total, files


def _parse_refs_detail(refs_str, max_files=3):
    file_refs = []
    total_count = 0
    for ref in refs_str.split(';'):
        if ':' not in ref:
            continue
        filepath, lines_str = ref.split(':', 1)
        line_entries = []
        for entry in lines_str.split(','):
            entry = entry.strip()
            if entry.startswith('..+'):
                total_count += int(entry[3:])
            else:
                try:
                    line_entries.append(int(entry))
                    total_count += 1
                except ValueError:
                    continue
        if len(file_refs) < max_files:
            file_refs.append({"file": filepath, "lines": line_entries[:5], "total": len(line_entries) + sum(1 for e in lines_str.split(',') if e.startswith('..+'))})
    return total_count, file_refs


def load_concordance_tsv():
    gz_path = CONCORDANCE_DIR / "concordance.tsv.gz"
    if not gz_path.exists():
        sys.stderr.write(f"ERROR: {gz_path} not found. Run generate_concordance.py first.\n")
        sys.exit(1)

    words = []
    raw_lines = []
    sys.stderr.write(f" Loading {gz_path} (fast pass)...\n")
    t0 = time.time()
    with gzip.open(gz_path, 'rt', encoding='utf-8') as f:
        for line in f:
            line = line.rstrip('\n')
            if not line:
                continue
            parts = line.split('\t', 1)
            if len(parts) != 2:
                continue
            word = parts[0]
            total, files = _count_refs(parts[1])
            words.append({"word": word, "count": total, "files": files})
            raw_lines.append((word, parts[1]))

    words.sort(key=lambda w: w["count"], reverse=True)
    sys.stderr.write(f" Sorted by frequency\n")

    top_n = 500
    detail_words = {w["word"]: w for w in words[:top_n]}
    sys.stderr.write(f" Parsing file details for top {top_n}...\n")
    t1 = time.time()
    for word, refs_str in raw_lines:
        if word in detail_words:
            total, file_refs = _parse_refs_detail(refs_str)
            detail_words[word]["files"] = file_refs
    sys.stderr.write(f" Detail pass: {time.time()-t1:.1f}s\n")

    del raw_lines
    sys.stderr.write(f" Loaded {len(words)} words in {time.time()-t0:.1f}s\n")
    return words


def categorize_words(words):
    categories = {
        "Keywords & Reserved": set(),
        "Types & Interfaces": set(),
        "Function Names": set(),
        "Agent & System": set(),
        "UI & Components": set(),
        "Data & State": set(),
        "Error & Status": set(),
        "Config & Env": set(),
        "Network & API": set(),
        "Domain-Specific": set(),
    }

    reserved = {
        'this', 'const', 'return', 'if', 'for', 'while', 'else', 'try',
        'catch', 'throw', 'new', 'typeof', 'instanceof', 'void', 'null',
        'undefined', 'true', 'false', 'async', 'await', 'yield', 'from',
        'import', 'export', 'default', 'class', 'extends', 'implements',
        'interface', 'type', 'enum', 'let', 'var', 'function', 'switch',
        'case', 'break', 'continue', 'with', 'in', 'of', 'as', 'is',
        'not', 'and', 'or', 'def', 'elif', 'pass', 'raise', 'except',
        'finally', 'lambda', 'global', 'nonlocal', 'assert', 'del',
        'private', 'public', 'protected', 'static', 'readonly', 'abstract',
        'override', 'super', 'constructor',
    }

    for entry in words:
        w = entry["word"]
        w_lower = w.lower()

        if w in reserved or w_lower in reserved:
            categories["Keywords & Reserved"].add(w)
        elif w_lower.startswith('i') and w[0].isupper() and len(w) > 5:
            categories["Types & Interfaces"].add(w)
        elif any(kw in w_lower for kw in ['agent', 'orchestrat', 'directive', 'autonomy', 'self_', 'prompt', 'skill', 'mcp', 'a2a', 'tnf']):
            categories["Agent & System"].add(w)
        elif any(kw in w_lower for kw in ['component', 'render', 'div', 'span', 'button', 'input', 'modal', 'card', 'layout', 'sidebar', 'header', 'footer', 'page', 'screen']):
            categories["UI & Components"].add(w)
        elif any(kw in w_lower for kw in ['data', 'state', 'store', 'cache', 'queue', 'stack', 'map', 'set', 'list', 'array', 'object', 'record', 'entry']):
            categories["Data & State"].add(w)
        elif any(kw in w_lower for kw in ['error', 'warn', 'fail', 'status', 'success', 'result', 'response', 'exception', 'timeout', 'retry']):
            categories["Error & Status"].add(w)
        elif any(kw in w_lower for kw in ['config', 'env', 'setting', 'option', 'variable', 'secret', 'token', 'key', 'credential']):
            categories["Config & Env"].add(w)
        elif any(kw in w_lower for kw in ['fetch', 'request', 'response', 'url', 'endpoint', 'api', 'http', 'socket', 'websocket', 'relay', 'server', 'client', 'route', 'handler']):
            categories["Network & API"].add(w)
        elif any(kw in w_lower for kw in ['get', 'set', 'update', 'create', 'delete', 'find', 'handle', 'process', 'execute', 'run', 'start', 'stop', 'init', 'load', 'save', 'build', 'parse', 'validate', 'transform']):
            categories["Function Names"].add(w)
        else:
            categories["Domain-Specific"].add(w)

    return {k: list(v) for k, v in categories.items()}


def build_viz_data(words):
    top_words = words[:500]
    categories = categorize_words(words)

    word_to_entry = {w["word"]: w for w in words}

    cat_stats = {}
    for cat_name, cat_words in categories.items():
        cat_entries = [word_to_entry[w] for w in cat_words if w in word_to_entry]
        cat_entries.sort(key=lambda w: w["count"], reverse=True)
        cat_stats[cat_name] = {
            "count": len(cat_words),
            "totalOccurrences": sum(w["count"] for w in cat_entries[:100]),
            "topWords": [{"word": w["word"], "count": w["count"]} for w in cat_entries[:20]],
        }

    file_stats = Counter()
    for entry in words:
        for f in entry["files"]:
            fname = f if isinstance(f, str) else f["file"]
            file_stats[fname] += 1

    viz_data = {
        "metadata": {
            "totalWords": len(words),
            "totalOccurrences": sum(w["count"] for w in words),
            "filesIndexed": len(file_stats),
            "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "supabaseBase": f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{STORAGE_PATH}",
        },
        "topWords": [{"word": w["word"], "count": w["count"], "files": w["files"][:3]} for w in top_words],
        "categories": cat_stats,
        "topFiles": [{"file": f, "identifiers": c} for f, c in file_stats.most_common(50)],
        "distribution": {
            "byLength": build_length_distribution(words),
            "byFrequency": build_frequency_distribution(words),
        },
    }

    return viz_data


def build_length_distribution(words):
    buckets = Counter()
    for w in words[:1000]:
        length = len(w["word"])
        if length <= 3:
            buckets["1-3"] += 1
        elif length <= 6:
            buckets["4-6"] += 1
        elif length <= 10:
            buckets["7-10"] += 1
        elif length <= 15:
            buckets["11-15"] += 1
        else:
            buckets["16+"] += 1
    return dict(buckets)


def build_frequency_distribution(words):
    buckets = Counter()
    for w in words:
        c = w["count"]
        if c == 1:
            buckets["1 (hapax)"] += 1
        elif c <= 5:
            buckets["2-5"] += 1
        elif c <= 50:
            buckets["6-50"] += 1
        elif c <= 500:
            buckets["51-500"] += 1
        elif c <= 5000:
            buckets["501-5K"] += 1
        else:
            buckets["5K+"] += 1
    return dict(buckets)


def generate_html(viz_data):
    data_json = json.dumps(viz_data, ensure_ascii=False)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TNF Concordance Visualizer</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{
  font-family: 'Inter', sans-serif;
  background: #020617;
  background-image: radial-gradient(at 0% 0%, rgba(30,58,138,0.15) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(139,92,246,0.1) 0px, transparent 50%);
  min-height: 100vh;
  color: #f8fafc;
  padding: 32px;
}}
.container {{ max-width: 1400px; margin: 0 auto; }}

/* Header */
.header {{ display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }}
h1 {{ font-weight: 800; letter-spacing: -0.025em; font-size: 2rem; background: linear-gradient(to right, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
.header-right {{ display: flex; gap: 12px; align-items: center; }}
.badge {{
  background: #059669; color: #fff; padding: 4px 12px; border-radius: 9999px;
  font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
}}
.badge.blue {{ background: #2563eb; }}

/* Stats row */
.stats-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 28px; }}
.stat-card {{
  background: rgba(15,23,42,0.6); backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}}
.stat-val {{ font-size: 2rem; font-weight: 800; display: block; margin-bottom: 4px; color: #fff; font-family: 'JetBrains Mono', monospace; }}
.stat-label {{ color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }}

/* Panels */
.panel {{
  background: rgba(15,23,42,0.6); backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.08); border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3); margin-bottom: 24px; overflow: hidden;
}}
.panel-header {{
  padding: 20px 24px 0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;
}}
.panel-title {{ font-size: 1.1rem; font-weight: 800; color: #f1f5f9; }}
.panel-body {{ padding: 16px 24px 24px; }}

/* Filter tabs */
.filter-tabs {{ display: flex; gap: 6px; flex-wrap: wrap; }}
.filter-btn {{
  background: rgba(30,41,59,0.6); border: 1px solid rgba(255,255,255,0.08);
  color: #94a3b8; padding: 6px 14px; border-radius: 8px; font-size: 0.78rem;
  font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap;
}}
.filter-btn:hover {{ border-color: rgba(255,255,255,0.2); color: #e2e8f0; }}
.filter-btn.active {{ background: #3b82f6; border-color: #3b82f6; color: #fff; box-shadow: 0 2px 8px rgba(59,130,246,0.3); }}

/* Search */
.search-box {{
  background: rgba(30,41,59,0.5); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px; padding: 10px 16px; color: #f1f5f9; font-size: 0.85rem;
  font-family: 'JetBrains Mono', monospace; width: 280px; outline: none; transition: all 0.2s;
}}
.search-box::placeholder {{ color: #475569; }}
.search-box:focus {{ border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }}

/* Word cloud / treemap */
.word-grid {{ display: flex; flex-wrap: wrap; gap: 4px; padding-top: 12px; }}
.word-chip {{
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px; border-radius: 6px; cursor: pointer;
  transition: all 0.15s; border: 1px solid transparent; position: relative;
}}
.word-chip:hover {{ transform: scale(1.08); z-index: 10; border-color: rgba(255,255,255,0.2); }}
.word-chip .count {{ font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; color: rgba(255,255,255,0.4); }}

/* Frequency bar chart */
.freq-chart {{ display: flex; flex-direction: column; gap: 3px; }}
.freq-row {{ display: flex; align-items: center; gap: 10px; font-size: 0.78rem; }}
.freq-label {{ width: 80px; text-align: right; color: #94a3b8; font-weight: 600; font-size: 0.72rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }}
.freq-bar-bg {{ flex: 1; height: 20px; background: rgba(255,255,255,0.03); border-radius: 4px; overflow: hidden; }}
.freq-bar {{ height: 100%; border-radius: 4px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); min-width: 2px; }}
.freq-value {{ width: 60px; text-align: right; color: #64748b; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; }}

/* Category cards */
.cat-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }}
.cat-card {{
  background: rgba(30,41,59,0.4); border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s;
}}
.cat-card:hover {{ border-color: rgba(255,255,255,0.15); transform: translateY(-2px); box-shadow: 0 8px 16px rgba(0,0,0,0.3); }}
.cat-card h3 {{ font-size: 0.85rem; font-weight: 800; margin-bottom: 8px; }}
.cat-card .cat-count {{ font-family: 'JetBrains Mono', monospace; font-size: 1.4rem; font-weight: 800; color: #3b82f6; }}
.cat-card .cat-words {{ font-size: 0.72rem; color: #64748b; margin-top: 8px; line-height: 1.5; }}
.cat-card .cat-words span {{ color: #94a3b8; cursor: pointer; transition: color 0.2s; }}
.cat-card .cat-words span:hover {{ color: #60a5fa; }}

/* Detail panel (drill-down) */
.detail-overlay {{
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(2,6,23,0.85); backdrop-filter: blur(8px);
  z-index: 100; display: none; justify-content: center; align-items: flex-start; padding: 40px 20px; overflow-y: auto;
}}
.detail-overlay.open {{ display: flex; }}
.detail-panel {{
  background: rgba(15,23,42,0.95); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px; max-width: 900px; width: 100%; box-shadow: 0 20px 50px rgba(0,0,0,0.6);
  max-height: 85vh; overflow-y: auto;
}}
.detail-header {{
  padding: 24px 28px; border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0;
  background: rgba(15,23,42,0.98); z-index: 10;
}}
.detail-header h2 {{ font-size: 1.5rem; font-weight: 800; font-family: 'JetBrains Mono', monospace; }}
.close-btn {{
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  color: #94a3b8; padding: 8px 16px; border-radius: 8px; cursor: pointer;
  font-size: 0.8rem; font-weight: 600; transition: all 0.2s;
}}
.close-btn:hover {{ background: rgba(255,255,255,0.1); color: #fff; }}
.detail-body {{ padding: 24px 28px; }}
.detail-section {{ margin-bottom: 24px; }}
.detail-section h3 {{ font-size: 0.85rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }}
.file-list {{ display: flex; flex-direction: column; gap: 4px; }}
.file-row {{
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 12px; background: rgba(255,255,255,0.02); border-radius: 8px;
  font-size: 0.78rem; cursor: pointer; transition: all 0.15s; border: 1px solid transparent;
}}
.file-row:hover {{ background: rgba(59,130,246,0.08); border-color: rgba(59,130,246,0.2); }}
.file-row .path {{ color: #e2e8f0; font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; }}
.file-row .lines {{ color: #64748b; font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; }}

/* Distribution bars */
.dist-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }}
@media (max-width: 768px) {{ .dist-grid {{ grid-template-columns: 1fr; }} }}

/* Power phrases section */
.power-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }}
.power-card {{
  background: rgba(30,41,59,0.4); border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px; padding: 16px; transition: all 0.2s;
}}
.power-card:hover {{ border-color: rgba(255,255,255,0.15); }}
.power-card h4 {{ font-size: 0.85rem; font-weight: 800; color: #f59e0b; margin-bottom: 8px; }}
.power-card .phrase {{ font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; color: #94a3b8; padding: 3px 0; cursor: pointer; transition: color 0.2s; }}
.power-card .phrase:hover {{ color: #60a5fa; }}
.power-card .phrase .freq {{ color: #475569; font-size: 0.65rem; }}

/* Scrollbar */
::-webkit-scrollbar {{ width: 6px; }}
::-webkit-scrollbar-track {{ background: transparent; }}
::-webkit-scrollbar-thumb {{ background: #1e293b; border-radius: 3px; }}
::-webkit-scrollbar-thumb:hover {{ background: #334155; }}

/* Loading spinner */
.spinner {{ display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.6s linear infinite; }}
@keyframes spin {{ to {{ transform: rotate(360deg); }} }}

/* Color scale for categories */
.cat-agent {{ color: #3b82f6; }} .cat-agent .cat-count {{ color: #3b82f6; }}
.cat-keywords {{ color: #8b5cf6; }} .cat-keywords .cat-count {{ color: #8b5cf6; }}
.cat-types {{ color: #06b6d4; }} .cat-types .cat-count {{ color: #06b6d4; }}
.cat-functions {{ color: #10b981; }} .cat-functions .cat-count {{ color: #10b981; }}
.cat-ui {{ color: #f59e0b; }} .cat-ui .cat-count {{ color: #f59e0b; }}
.cat-data {{ color: #ec4899; }} .cat-data .cat-count {{ color: #ec4899; }}
.cat-error {{ color: #ef4444; }} .cat-error .cat-count {{ color: #ef4444; }}
.cat-config {{ color: #f97316; }} .cat-config .cat-count {{ color: #f97316; }}
.cat-network {{ color: #14b8a6; }} .cat-network .cat-count {{ color: #14b8a6; }}
.cat-domain {{ color: #a78bfa; }} .cat-domain .cat-count {{ color: #a78bfa; }}

.bar-agent {{ background: #3b82f6; }}
.bar-keywords {{ background: #8b5cf6; }}
.bar-types {{ background: #06b6d4; }}
.bar-functions {{ background: #10b981; }}
.bar-ui {{ background: #f59e0b; }}
.bar-data {{ background: #ec4899; }}
.bar-error {{ background: #ef4444; }}
.bar-config {{ background: #f97316; }}
.bar-network {{ background: #14b8a6; }}
.bar-domain {{ background: #a78bfa; }}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div>
      <h1>TNF Concordance</h1>
      <p style="color:#64748b;font-size:0.85rem;margin-top:4px;">Codebase vocabulary analysis &middot; High-value phrase discovery &middot; Communication pattern monitoring</p>
    </div>
    <div class="header-right">
      <span class="badge" id="statusBadge">LIVE</span>
      <span class="badge blue" id="timestampBadge"></span>
    </div>
  </div>

  <div class="stats-grid" id="statsGrid"></div>

  <!-- Power Phrases & High-Value Vocabulary -->
  <div class="panel">
    <div class="panel-header">
      <span class="panel-title">High-Value Vocabulary & Power Phrases</span>
      <div class="filter-tabs" id="phraseFilters"></div>
    </div>
    <div class="panel-body" id="powerPhrases"></div>
  </div>

  <!-- Category Breakdown -->
  <div class="panel">
    <div class="panel-header">
      <span class="panel-title">Identifier Categories</span>
    </div>
    <div class="panel-body">
      <div class="cat-grid" id="categoryGrid"></div>
    </div>
  </div>

  <!-- Top Words + Distribution -->
  <div class="panel">
    <div class="panel-header">
      <span class="panel-title">Frequency Analysis</span>
      <div style="display:flex;gap:12px;align-items:center;">
        <input type="text" class="search-box" id="wordSearch" placeholder="Search identifiers...">
        <div class="filter-tabs" id="viewTabs"></div>
      </div>
    </div>
    <div class="panel-body">
      <div id="wordView"></div>
    </div>
  </div>

  <!-- Distribution -->
  <div class="panel">
    <div class="panel-header">
      <span class="panel-title">Distribution Analysis</span>
    </div>
    <div class="panel-body">
      <div class="dist-grid" id="distGrid"></div>
    </div>
  </div>

  <!-- Top Files -->
  <div class="panel">
    <div class="panel-header">
      <span class="panel-title">Files by Identifier Density</span>
    </div>
    <div class="panel-body">
      <div class="freq-chart" id="filesChart"></div>
    </div>
  </div>
</div>

<!-- Drill-down detail overlay -->
<div class="detail-overlay" id="detailOverlay" onclick="if(event.target===this)closeDetail()">
  <div class="detail-panel">
    <div class="detail-header">
      <h2 id="detailTitle"></h2>
      <button class="close-btn" onclick="closeDetail()">Close &times;</button>
    </div>
    <div class="detail-body" id="detailBody"></div>
  </div>
</div>

<script>
const DATA = {data_json};

const CAT_COLORS = {{
  'Keywords & Reserved': 'keywords',
  'Types & Interfaces': 'types',
  'Function Names': 'functions',
  'Agent & System': 'agent',
  'UI & Components': 'ui',
  'Data & State': 'data',
  'Error & Status': 'error',
  'Config & Env': 'config',
  'Network & API': 'network',
  'Domain-Specific': 'domain',
}};

const POWER_PHRASE_PATTERNS = [
  {{
    title: 'Agent Directives',
    icon: '🤖',
    patterns: ['directive', 'autonomy', 'orchestrat', 'self_prompt', 'agent_loop', 'prime_directive', 'self_improve', 'coordination', 'heartbeat', 'consciousness'],
  }},
  {{
    title: 'Communication Patterns',
    icon: '💬',
    patterns: ['broadcast', 'relay', 'dispatch', 'subscribe', 'emit', 'notify', 'handoff', 'bridge', 'channel', 'message', 'protocol', 'negotiate'],
  }},
  {{
    title: 'Effective Vocabulary',
    icon: '🎯',
    patterns: ['execute', 'actualiz', 'optimize', 'validate', 'enrich', 'transform', 'orchestrat', 'compounding', 'cascade', 'amplif', 'accelerat', 'operationaliz'],
  }},
  {{
    title: 'System Intelligence',
    icon: '🧠',
    patterns: ['embedding', 'vector', 'similarity', 'retrieval', 'rag', 'semantic', 'knowledge', 'memory', 'context_pack', 'skill_bank', 'blueprint'],
  }},
  {{
    title: 'Resilience Patterns',
    icon: '🛡️',
    patterns: ['retry', 'fallback', 'circuit', 'degraded', 'graceful', 'recovery', 'resilien', 'timeout', 'backoff', 'health_check', 'watchdog'],
  }},
  {{
    title: 'Governance and Control',
    icon: '⚖️',
    patterns: ['authorize', 'permission', 'policy', 'compliance', 'audit', 'govern', 'enforce', 'constraint', 'mandate', 'escalat'],
  }},
];

let currentView = 'cloud';
let searchQuery = '';

function init() {{
  const m = DATA.metadata;
  document.getElementById('timestampBadge').textContent = m.generated.split('T')[0];
  renderStats();
  renderPowerPhrases();
  renderCategories();
  renderWordView();
  renderDistribution();
  renderFilesChart();
  setupSearch();
  setupViewTabs();
}}

function renderStats() {{
  const m = DATA.metadata;
  const grid = document.getElementById('statsGrid');
  const stats = [
    {{ val: m.totalWords.toLocaleString(), label: 'Unique Identifiers' }},
    {{ val: (m.totalOccurrences/1000).toFixed(1) + 'K', label: 'Total Occurrences' }},
    {{ val: m.filesIndexed.toLocaleString(), label: 'Source Files' }},
    {{ val: Object.keys(DATA.categories).length, label: 'Categories' }},
  ];
  grid.innerHTML = stats.map(s => `<div class="stat-card"><span class="stat-val">${{s.val}}</span><span class="stat-label">${{s.label}}</span></div>`).join('');
}}

function renderPowerPhrases() {{
  const container = document.getElementById('powerPhrases');
  const filtersEl = document.getElementById('phraseFilters');

  let html = '<div class="power-grid">';
  POWER_PHRASE_PATTERNS.forEach(group => {{
    const matching = [];
    group.patterns.forEach(pat => {{
      const found = DATA.topWords.filter(w => w.word.toLowerCase().includes(pat.toLowerCase()));
      matching.push(...found.slice(0, 3));
    }});
    const unique = [...new Map(matching.map(m => [m.word, m])).values()].slice(0, 6);
    html += `<div class="power-card">
      <h4>${{group.icon}} ${{group.title}}</h4>
      ${{unique.map(w => `<div class="phrase" onclick="openWordDetail('${{w.word}}')">${{w.word}} <span class="freq">(${{w.count.toLocaleString()}})</span></div>`).join('')}}
    </div>`;
  }});
  html += '</div>';
  container.innerHTML = html;
}}

function renderCategories() {{
  const grid = document.getElementById('categoryGrid');
  let html = '';
  Object.entries(DATA.categories).forEach(([name, cat]) => {{
    const cssClass = CAT_COLORS[name] || 'domain';
    const topWords = cat.topWords.slice(0, 8);
    html += `<div class="cat-card cat-${{cssClass}}" onclick="openCategoryDetail('${{name}}')">
      <h3 class="cat-${{cssClass}}">${{name}}</h3>
      <div class="cat-count">${{cat.count.toLocaleString()}}</div>
      <div style="color:#475569;font-size:0.72rem;margin-top:2px">${{cat.totalOccurrences.toLocaleString()}} occurrences</div>
      <div class="cat-words">${{topWords.map(w => `<span onclick="event.stopPropagation();openWordDetail('${{w.word}}')">${{w.word}}</span>`).join(' &middot; ')}}</div>
    </div>`;
  }});
  grid.innerHTML = html;
}}

function renderWordView() {{
  const container = document.getElementById('wordView');

  if (currentView === 'cloud') {{
    let words = DATA.topWords.slice(0, 200);
    if (searchQuery) {{
      words = DATA.topWords.filter(w => w.word.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 200);
    }}
    const maxCount = words[0]?.count || 1;
    let html = '<div class="word-grid">';
    words.forEach(w => {{
      const ratio = Math.log(w.count) / Math.log(maxCount);
      const size = 0.65 + ratio * 0.6;
      const opacity = 0.4 + ratio * 0.6;
      const cat = findCategory(w.word);
      const barClass = cat ? 'bar-' + (CAT_COLORS[cat] || 'domain') : 'bar-domain';
      const bgColor = cat ? `rgba(${{catColorRGB(CAT_COLORS[cat]||'domain')}},${{0.08 + ratio*0.15}})` : 'rgba(255,255,255,0.03)';
      html += `<div class="word-chip" style="font-size:${{size}}rem;opacity:${{opacity}};background:${{bgColor}}" onclick="openWordDetail('${{w.word}}')">
        ${{w.word}} <span class="count">${{formatCount(w.count)}}</span>
      </div>`;
    }});
    html += '</div>';
    container.innerHTML = html;
  }} else {{
    let words = DATA.topWords.slice(0, 50);
    if (searchQuery) {{
      words = DATA.topWords.filter(w => w.word.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 50);
    }}
    const maxCount = words[0]?.count || 1;
    let html = '<div class="freq-chart">';
    words.forEach((w, i) => {{
      const pct = (w.count / maxCount * 100).toFixed(1);
      const cat = findCategory(w.word);
      const barClass = cat ? 'bar-' + (CAT_COLORS[cat] || 'domain') : 'bar-domain';
      html += `<div class="freq-row">
        <span class="freq-label" title="${{w.word}}" onclick="openWordDetail('${{w.word}}')" style="cursor:pointer">${{w.word}}</span>
        <div class="freq-bar-bg"><div class="freq-bar ${{barClass}}" style="width:${{pct}}%"></div></div>
        <span class="freq-value">${{formatCount(w.count)}}</span>
      </div>`;
    }});
    html += '</div>';
    container.innerHTML = html;
  }}
}}

function renderDistribution() {{
  const grid = document.getElementById('distGrid');
  const dist = DATA.distribution;

  const renderBars = (data, title, colorClass) => {{
    const max = Math.max(...Object.values(data));
    let html = `<div><h3 style="font-size:0.85rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px">${{title}}</h3><div class="freq-chart">`;
    Object.entries(data).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => {{
      const pct = (v/max*100).toFixed(1);
      html += `<div class="freq-row"><span class="freq-label">${{k}}</span><div class="freq-bar-bg"><div class="freq-bar ${{colorClass}}" style="width:${{pct}}%"></div></div><span class="freq-value">${{v.toLocaleString()}}</span></div>`;
    }});
    html += '</div></div>';
    return html;
  }};

  grid.innerHTML = renderBars(dist.byLength, 'By Identifier Length', 'bar-types') + renderBars(dist.byFrequency, 'By Frequency Band', 'bar-agent');
}}

function renderFilesChart() {{
  const container = document.getElementById('filesChart');
  const files = DATA.topFiles.slice(0, 25);
  const max = files[0]?.identifiers || 1;
  let html = '';
  files.forEach(f => {{
    const pct = (f.identifiers / max * 100).toFixed(1);
    const shortPath = f.file.length > 60 ? '...' + f.file.slice(-57) : f.file;
    html += `<div class="freq-row">
      <span class="freq-label" title="${{f.file}}" style="cursor:pointer" onclick="openFileDetail('${{f.file}}')">${{shortPath}}</span>
      <div class="freq-bar-bg"><div class="freq-bar bar-ui" style="width:${{pct}}%"></div></div>
      <span class="freq-value">${{f.identifiers.toLocaleString()}}</span>
    </div>`;
  }});
  container.innerHTML = html;
}}

function setupSearch() {{
  const input = document.getElementById('wordSearch');
  let debounce;
  input.addEventListener('input', () => {{
    clearTimeout(debounce);
    debounce = setTimeout(() => {{
      searchQuery = input.value.trim();
      renderWordView();
    }}, 200);
  }});
}}

function setupViewTabs() {{
  const container = document.getElementById('viewTabs');
  container.innerHTML = [
    {{ id: 'cloud', label: 'Cloud' }},
    {{ id: 'bars', label: 'Bar Chart' }},
  ].map(v => `<button class="filter-btn ${{v.id===currentView?'active':''}}" onclick="switchView('${{v.id}}')">${{v.label}}</button>`).join('');
}}

function switchView(view) {{
  currentView = view;
  setupViewTabs();
  renderWordView();
}}

function findCategory(word) {{
  for (const [cat, data] of Object.entries(DATA.categories)) {{
    if (data.topWords.some(w => w.word === word)) return cat;
  }}
  return null;
}}

function catColorRGB(cssClass) {{
  const map = {{ agent:'59,130,246', keywords:'139,92,246', types:'6,182,212', functions:'16,185,129', ui:'245,158,11', data:'236,72,153', error:'239,68,68', config:'249,115,22', network:'20,184,166', domain:'167,139,250' }};
  return map[cssClass] || '100,116,139';
}}

function formatCount(n) {{
  if (n >= 100000) return (n/1000).toFixed(0) + 'K';
  if (n >= 10000) return (n/1000).toFixed(1) + 'K';
  if (n >= 1000) return (n/1000).toFixed(2) + 'K';
  return n.toString();
}}

function openWordDetail(word) {{
  const entry = DATA.topWords.find(w => w.word === word);
  const overlay = document.getElementById('detailOverlay');
  const title = document.getElementById('detailTitle');
  const body = document.getElementById('detailBody');

  title.textContent = word;

  let html = '';
  if (entry) {{
    const cat = findCategory(word);
    html += `<div class="detail-section"><h3>Statistics</h3>
      <div style="display:flex;gap:24px">
        <div><span style="color:#3b82f6;font-size:1.5rem;font-weight:800;font-family:'JetBrains Mono',monospace">${{entry.count.toLocaleString()}}</span><div style="color:#64748b;font-size:0.72rem">occurrences</div></div>
        <div><span style="color:#10b981;font-size:1.5rem;font-weight:800;font-family:'JetBrains Mono',monospace">${{entry.files.length}}</span><div style="color:#64748b;font-size:0.72rem">files</div></div>
        ${{cat ? `<div><span style="color:#f59e0b;font-size:1rem;font-weight:800">${{cat}}</span><div style="color:#64748b;font-size:0.72rem">category</div></div>` : ''}}
      </div>
    </div>`;
    html += `<div class="detail-section"><h3>File Locations (embedded data &mdash; top 3)</h3><div class="file-list">`;
    entry.files.forEach(f => {{
      html += `<div class="file-row" onclick="openFileDetail('${{f.file}}')">
        <span class="path">${{f.file}}</span>
        <span class="lines">lines ${{f.lines.slice(0,5).join(', ')}}${{f.total > 5 ? '...' : ''}}</span>
      </div>`;
    }});
    html += '</div></div>';
  }}

  html += `<div class="detail-section"><h3>Full Reference Lookup</h3>
    <p style="color:#64748b;font-size:0.78rem;margin-bottom:12px">Load complete file:line references from Supabase Storage</p>
    <button class="filter-btn active" onclick="loadFullRefs('${{word}}')" id="loadRefsBtn">Load Full References</button>
    <div id="fullRefsResult" style="margin-top:12px"></div>
  </div>`;

  body.innerHTML = html;
  overlay.classList.add('open');
}}

async function loadFullRefs(word) {{
  const btn = document.getElementById('loadRefsBtn');
  const result = document.getElementById('fullRefsResult');
  btn.innerHTML = '<span class="spinner"></span> Loading...';
  btn.disabled = true;

  try {{
    const url = DATA.metadata.supabaseBase + '/concordance.tsv.gz';
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const blob = await resp.blob();
    const ds = new DecompressionStream('gzip');
    const stream = blob.stream().pipeThrough(ds);
    const text = await new Response(stream).text();

    const lines = text.split('\\n');
    let found = null;
    for (const line of lines) {{
      if (line.startsWith(word + '\\t')) {{
        found = line;
        break;
      }}
    }}

    if (!found) {{
      result.innerHTML = '<p style="color:#ef4444;font-size:0.85rem">Word not found in full concordance</p>';
      return;
    }}

    const refsStr = found.split('\\t')[1];
    const fileRefs = [];
    for (const ref of refsStr.split(';')) {{
      const colonIdx = ref.indexOf(':');
      if (colonIdx < 0) continue;
      const filepath = ref.slice(0, colonIdx);
      const linesStr = ref.slice(colonIdx + 1);
      const lineNums = [];
      let count = 0;
      for (const entry of linesStr.split(',')) {{
        const trimmed = entry.trim();
        if (trimmed.startsWith('..+')) {{
          count += parseInt(trimmed.slice(3)) || 0;
        }} else {{
          const n = parseInt(trimmed);
          if (!isNaN(n)) {{ lineNums.push(n); count++; }}
        }}
      }}
      fileRefs.push({{ file: filepath, lines: lineNums, total: count }});
    }}

    let html = `<p style="color:#94a3b8;font-size:0.78rem;margin-bottom:8px">${{fileRefs.length}} files containing "${{word}}"</p><div class="file-list">`;
    fileRefs.slice(0, 50).forEach(f => {{
      html += `<div class="file-row" onclick="openFileDetail('${{f.file}}')">
        <span class="path">${{f.file}}</span>
        <span class="lines">${{f.total}}x &middot; lines ${{f.lines.slice(0,8).join(', ')}}${{f.lines.length > 8 ? '...' : ''}}</span>
      </div>`;
    }});
    if (fileRefs.length > 50) html += `<div style="color:#475569;font-size:0.72rem;padding:8px">+${{fileRefs.length-50}} more files</div>`;
    html += '</div>';
    result.innerHTML = html;
  }} catch (err) {{
    result.innerHTML = `<p style="color:#ef4444;font-size:0.85rem">Error: ${{err.message}}</p><p style="color:#475569;font-size:0.72rem">The gzipped TSV is ~20MB. If DecompressionStream is not supported, download manually from:<br><a href="${{DATA.metadata.supabaseBase}}/concordance.tsv.gz" style="color:#3b82f6">${{DATA.metadata.supabaseBase}}/concordance.tsv.gz</a></p>`;
  }}
}}

function openCategoryDetail(catName) {{
  const cat = DATA.categories[catName];
  if (!cat) return;
  const overlay = document.getElementById('detailOverlay');
  const title = document.getElementById('detailTitle');
  const body = document.getElementById('detailBody');
  const cssClass = CAT_COLORS[catName] || 'domain';

  title.innerHTML = `<span class="cat-${{cssClass}}">${{catName}}</span>`;

  let html = `<div class="detail-section"><h3>Category Statistics</h3>
    <div style="display:flex;gap:24px">
      <div><span style="color:#3b82f6;font-size:1.5rem;font-weight:800;font-family:'JetBrains Mono',monospace">${{cat.count.toLocaleString()}}</span><div style="color:#64748b;font-size:0.72rem">identifiers</div></div>
      <div><span style="color:#10b981;font-size:1.5rem;font-weight:800;font-family:'JetBrains Mono',monospace">${{cat.totalOccurrences.toLocaleString()}}</span><div style="color:#64748b;font-size:0.72rem">total occurrences</div></div>
    </div>
  </div>`;

  html += `<div class="detail-section"><h3>Top Words in Category</h3><div class="freq-chart">`;
  const maxC = cat.topWords[0]?.count || 1;
  cat.topWords.forEach(w => {{
    const pct = (w.count / maxC * 100).toFixed(1);
    html += `<div class="freq-row">
      <span class="freq-label" style="cursor:pointer" onclick="openWordDetail('${{w.word}}')">${{w.word}}</span>
      <div class="freq-bar-bg"><div class="freq-bar bar-${{cssClass}}" style="width:${{pct}}%"></div></div>
      <span class="freq-value">${{w.count.toLocaleString()}}</span>
    </div>`;
  }});
  html += '</div></div>';

  body.innerHTML = html;
  overlay.classList.add('open');
}}

function openFileDetail(filepath) {{
  const overlay = document.getElementById('detailOverlay');
  const title = document.getElementById('detailTitle');
  const body = document.getElementById('detailBody');

  title.textContent = filepath;
  title.style.fontSize = '1rem';

  body.innerHTML = `<div class="detail-section">
    <h3>Identifiers in this file</h3>
    <p style="color:#64748b;font-size:0.78rem;margin-bottom:12px">Load per-file identifier data from Supabase Storage</p>
    <button class="filter-btn active" onclick="loadFileRefs('${{filepath}}')" id="loadFileRefsBtn">Load File Identifiers</button>
    <div id="fileRefsResult" style="margin-top:12px"></div>
  </div>`;

  overlay.classList.add('open');
}}

async function loadFileRefs(filepath) {{
  const btn = document.getElementById('loadFileRefsBtn');
  const result = document.getElementById('fileRefsResult');
  btn.innerHTML = '<span class="spinner"></span> Loading...';
  btn.disabled = true;

  try {{
    const url = DATA.metadata.supabaseBase + '/per_file_index.tsv.gz';
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const blob = await resp.blob();
    const ds = new DecompressionStream('gzip');
    const stream = blob.stream().pipeThrough(ds);
    const text = await new Response(stream).text();

    const lines = text.split('\\n');
    let found = null;
    for (const line of lines) {{
      if (line.startsWith(filepath + '\\t')) {{
        found = line;
        break;
      }}
    }}

    if (!found) {{
      result.innerHTML = '<p style="color:#ef4444;font-size:0.85rem">File not found in per-file index</p>';
      return;
    }}

    const refsStr = found.split('\\t')[1];
    const identifiers = [];
    for (const ref of refsStr.split(';')) {{
      const colonIdx = ref.lastIndexOf(':');
      if (colonIdx < 0) continue;
      const word = ref.slice(0, colonIdx);
      const linesStr = ref.slice(colonIdx + 1);
      const lineNums = [];
      for (const entry of linesStr.split(',')) {{
        const trimmed = entry.trim();
        if (trimmed.startsWith('..+')) continue;
        const n = parseInt(trimmed);
        if (!isNaN(n)) lineNums.push(n);
      }}
      if (word) identifiers.push({{ word, lines: lineNums }});
    }}

    let html = `<p style="color:#94a3b8;font-size:0.78rem;margin-bottom:8px">${{identifiers.length}} identifiers in this file</p>`;
    html += '<div class="freq-chart">';
    identifiers.slice(0, 60).forEach(id => {{
      html += `<div class="freq-row">
        <span class="freq-label" style="cursor:pointer" onclick="openWordDetail('${{id.word}}')">${{id.word}}</span>
        <span class="freq-value" style="text-align:left;width:auto;color:#475569">lines ${{id.lines.slice(0,5).join(', ')}}</span>
      </div>`;
    }});
    if (identifiers.length > 60) html += `<div style="color:#475569;font-size:0.72rem;padding:8px">+${{identifiers.length-60}} more identifiers</div>`;
    html += '</div>';
    result.innerHTML = html;
  }} catch (err) {{
    result.innerHTML = `<p style="color:#ef4444;font-size:0.85rem">Error: ${{err.message}}</p>`;
  }}
}}

function closeDetail() {{
  document.getElementById('detailOverlay').classList.remove('open');
  document.getElementById('detailTitle').style.fontSize = '';
}}

document.addEventListener('keydown', e => {{ if (e.key === 'Escape') closeDetail(); }});

init();
</script>
</body>
</html>"""

    return html


def build_react_json(viz_data):
    return json.dumps(viz_data, ensure_ascii=False)


def main():
    sys.stderr.write("TNF Concordance Visualizer Generator\n")
    sys.stderr.write("=" * 40 + "\n")

    words = load_concordance_tsv()
    viz_data = build_viz_data(words)

    sys.stderr.write(f"  Built viz data: {len(viz_data['topWords'])} top words, {len(viz_data['categories'])} categories\n")

    # Generate HTML
    html = generate_html(viz_data)
    html_path = OUTPUT_DIR / "TNF_CONCORDANCE_VISUALIZER.html"
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    html_size = os.path.getsize(html_path) / 1024 / 1024
    sys.stderr.write(f"  HTML: {html_path} ({html_size:.1f} MB)\n")

    # Generate React JSON
    react_json = build_react_json(viz_data)
    react_path = CONCORDANCE_DIR / "concordance_viz_data.json"
    with open(react_path, 'w', encoding='utf-8') as f:
        f.write(react_json)
    json_size = os.path.getsize(react_path) / 1024 / 1024
    sys.stderr.write(f"  React JSON: {react_path} ({json_size:.1f} MB)\n")

    sys.stderr.write(f"\nDone!\n")


if __name__ == '__main__':
    main()
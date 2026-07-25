#!/usr/bin/env python3
"""Shared helpers for the TNF semantic tooling pipeline.

Pipeline (run via build_all.py):
  build_concordance.py  -> wordcount_full.tsv.gz + stats
  build_unified_graph.py-> unified_graph.json.gz + stats
  build_report.py       -> wordcount_report.html
  build_graph_explorer.py-> unified_graph_explorer.html
  build_index.py        -> index.html hub
"""
import base64
import hashlib
import os
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..", "..")))
OUT = os.path.join(ROOT, "concordance_results")


def slugify(s):
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s.lower())).strip("-")


B58_ALPHA = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"


def b58encode(b):
    n = int.from_bytes(b, "big")
    out = ""
    while n:
        n, r = divmod(n, 58)
        out = B58_ALPHA[r] + out
    return "1" * (len(b) - len(b.lstrip(b"\x00"))) + (out or "1")


def kb_vector_id(index):
    # Must match scripts/autonomy/generate_merkle_tree.py (ID#: prefix policy,
    # Phase 9 FOLLOWUP-1; planned migration to VEC#: on next tree rebuild).
    raw = hashlib.sha256(f"tnf-intelligence-salt-2026-{index}".encode()).digest()
    return "ID#:" + b58encode(raw[:8])


def b64_of_file(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("ascii")


def render_template(template, subs, out_path):
    page = template
    for key, val in subs.items():
        page = page.replace(key, val)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(page)
    print(f"{out_path} {os.path.getsize(out_path)/1048576:.2f} MB")


_VIZ = "apps/frontend/public/visualizations"
CANDIDATE_LINKS = [
    ("Unified Semantic Graph Explorer", "concordance_results/unified_graph_explorer.html",
     "31k-node merged graph: wiki, concepts, code, agents, handoffs — search, ego-network, path tracing"),
    ("Word / Term Frequency Report", "concordance_results/wordcount_report.html",
     "All 1.41M terms across the repo, paginated"),
    ("Codebase Map — Master Index", "codebase_index.html",
     "15,707-node searchable codebase index with tracker badges"),
    ("Compounding Memory Live Graph", "data/memory-viz.html",
     "D3 live graph of the wiki memory clusters"),
    ("Concordance Visualizer", f"{_VIZ}/TNF_CONCORDANCE_VISUALIZER.html",
     "149K identifiers, power phrases, categories"),
    ("Intelligence Dashboard", f"{_VIZ}/TNF_INTELLIGENCE_DASHBOARD.html",
     "Autonomy intelligence pipeline dashboard"),
    ("Agent Communication Flow", f"{_VIZ}/agent-communication-flow.html",
     "D3 flow of agent messaging"),
    ("Workflow Dependencies", f"{_VIZ}/workflow-dependencies.html", "Workflow dependency graph"),
    ("Workflow Preview", f"{_VIZ}/workflow-preview.html", "Workflow structure preview"),
    ("Service Architecture Map", f"{_VIZ}/service-architecture-map.html", "Service topology map"),
    ("System Dashboard", f"{_VIZ}/dashboard.html", "General system dashboard"),
    ("Monitoring Dashboard", f"{_VIZ}/monitoring-dashboard.html", "Runtime monitoring view"),
    ("Bundle Size Analyzer", f"{_VIZ}/bundle-size-analyzer.html", "Frontend bundle analysis"),
    ("Codebase Pathway Graph (2026-07-24)",
     "docs/protocols/reports/CODEBASE_PATHWAY_GRAPH_2026-07-24.html", "Execution-path trace report"),
]


def viz_links(exclude_titles=()):
    """Existing visualization assets as [{title, href, desc}].

    hrefs are RELATIVE to concordance_results/ so no personal absolute paths
    ever land in generated (distributable) artifacts.
    """
    candidates = list(CANDIDATE_LINKS)
    sub = f"{_VIZ}/graphs/agent-relationship-graph/subgraphs"
    sub_abs = os.path.join(ROOT, sub)
    if os.path.isdir(sub_abs):
        for name in sorted(os.listdir(sub_abs)):
            if name.endswith(".html"):
                domain = name.replace("agent-relationship-", "").replace("-subgraph.html", "")
                candidates.append((f"Agent Subgraph — {domain}", f"{sub}/{name}",
                                   "Neo4j-derived agent relationship subgraph"))
    return [{"title": t, "href": os.path.relpath(os.path.join(ROOT, rel), OUT), "desc": d}
            for t, rel, d in candidates
            if t not in exclude_titles and os.path.exists(os.path.join(ROOT, rel))]


# ------------------------------------------------------------------ site chrome

LOGO_SOURCE = os.path.join(ROOT, "assets", "brand", "primary", "tnf-logo.png")
_LOGO_THUMB = os.path.join(OUT, ".tnf-logo-96.png")


def logo_data_uri():
    """Official TNF logo as a small base64 data URI (thumbnail built on demand)."""
    if not os.path.exists(_LOGO_THUMB) and os.path.exists(LOGO_SOURCE):
        import subprocess
        subprocess.run(["sips", "-Z", "96", "-s", "format", "png",
                        LOGO_SOURCE, "--out", _LOGO_THUMB],
                       capture_output=True)
    if os.path.exists(_LOGO_THUMB):
        return "data:image/png;base64," + b64_of_file(_LOGO_THUMB)
    return ""


NAV_PAGES = [
    ("index.html", "Hub"),
    ("unified_graph_explorer.html", "Graph Explorer"),
    ("wordcount_report.html", "Word Frequency"),
]

CHROME_CSS = """
  #tnfhdr { display:flex; align-items:center; gap:14px; padding:0 18px; height:52px;
    background:var(--panel); border-bottom:1px solid var(--border); flex:none; }
  #tnfhdr img { height:34px; width:34px; border-radius:7px; }
  #tnfhdr .brand { font-weight:700; font-size:14px; letter-spacing:.4px; white-space:nowrap; }
  #tnfhdr nav { display:flex; gap:4px; margin-left:10px; }
  #tnfhdr nav a { color:var(--dim); text-decoration:none; font-size:12px; padding:6px 12px; border-radius:7px; }
  #tnfhdr nav a:hover { color:var(--text); background:var(--bg); }
  #tnfhdr nav a.on { color:var(--accent); background:var(--bg); }
  #tnfftr { display:flex; align-items:center; gap:16px; padding:8px 18px; font-size:11px;
    color:var(--dim); background:var(--panel); border-top:1px solid var(--border); flex:none; }
  #tnfftr a { color:var(--dim); text-decoration:none; }
  #tnfftr a:hover { color:var(--accent); }
  #tnfnav { width:190px; min-width:190px; border-right:1px solid var(--border); padding:14px 10px; }
  #tnfnav .nt { font-size:10px; color:var(--dim); text-transform:uppercase; letter-spacing:.8px; padding:4px 8px; }
  #tnfnav a { display:block; color:var(--text); text-decoration:none; font-size:12px; padding:7px 10px; border-radius:7px; }
  #tnfnav a:hover { background:var(--panel); }
  #tnfnav a.on { color:var(--accent); background:var(--panel); }
"""


def chrome_header(active):
    logo = logo_data_uri()
    img = f'<img src="{logo}" alt="TNF logo">' if logo else ""
    nav = "".join(f'<a href="{href}"{" class=\"on\"" if href == active else ""}>{label}</a>'
                  for href, label in NAV_PAGES)
    return (f'<div id="tnfhdr">{img}<span class="brand">The New Fuse</span>'
            f'<nav>{nav}</nav></div>')


def chrome_sidebar(active):
    nav = "".join(f'<a href="{href}"{" class=\"on\"" if href == active else ""}>{label}</a>'
                  for href, label in NAV_PAGES)
    return f'<div id="tnfnav"><div class="nt">Navigate</div>{nav}</div>'


def chrome_footer():
    nav = " &middot; ".join(f'<a href="{href}">{label}</a>' for href, label in NAV_PAGES)
    return (f'<div id="tnfftr"><span>The New Fuse &mdash; semantic reports</span>'
            f'<span>{nav}</span><span><a href="README.md">README</a></span></div>')

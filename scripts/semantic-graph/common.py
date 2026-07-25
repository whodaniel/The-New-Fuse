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
    """Existing visualization assets as [{title, href, desc}] with file:// hrefs."""
    candidates = list(CANDIDATE_LINKS)
    sub = f"{_VIZ}/graphs/agent-relationship-graph/subgraphs"
    sub_abs = os.path.join(ROOT, sub)
    if os.path.isdir(sub_abs):
        for name in sorted(os.listdir(sub_abs)):
            if name.endswith(".html"):
                domain = name.replace("agent-relationship-", "").replace("-subgraph.html", "")
                candidates.append((f"Agent Subgraph — {domain}", f"{sub}/{name}",
                                   "Neo4j-derived agent relationship subgraph"))
    return [{"title": t, "href": "file://" + os.path.join(ROOT, rel), "desc": d}
            for t, rel, d in candidates
            if t not in exclude_titles and os.path.exists(os.path.join(ROOT, rel))]

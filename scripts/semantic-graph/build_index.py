#!/usr/bin/env python3
"""Generate concordance_results/index.html — landing hub for all TNF semantic reports."""
import json, html, os, time

from common import (OUT, ROOT, viz_links,
                    CHROME_CSS, chrome_header, chrome_sidebar, chrome_footer)

HTML_OUT = os.path.join(OUT, "index.html")

def load(name):
    try:
        return json.load(open(os.path.join(OUT, name)))
    except (OSError, json.JSONDecodeError):
        return {}

wc = load("wordcount_stats.json")
ug = load("unified_graph_stats.json")
ug_meta = ug.get("meta", {})

primary = [
    ("Unified Semantic Graph Explorer", "unified_graph_explorer.html",
     f"{ug_meta.get('nodes', 0):,} nodes / {ug_meta.get('edges', 0):,} edges across "
     f"{len(ug.get('nodes_by_origin', {}))} systems — search, ego-networks, path tracing"),
    ("Word / Term Frequency Report", "wordcount_report.html",
     f"{wc.get('unique_terms', 0):,} unique terms, {wc.get('total_occurrences', 0):,} occurrences "
     f"across {wc.get('files_indexed', 0):,} files — fully paginated"),
]
datasets = [
    ("unified_graph.json.gz", "Unified graph dataset (machine-readable)"),
    ("unified_graph_stats.json", "Graph stats: nodes_by_origin, edges_by_type, cross_links"),
    ("wordcount_full.tsv.gz", "Full term-frequency TSV"),
    ("wordcount_stats.json", "Word count run stats"),
    ("concordance.tsv.gz", "Legacy concordance TSV (consumed by mcp-concordance-server)"),
    ("per_file_index.tsv.gz", "Term-to-file index (feeds unified graph occurs_in edges)"),
    ("concordance_viz_data.json", "Legacy visualizer dataset (consumed by supabase function)"),
]

others = viz_links(exclude_titles=("Unified Semantic Graph Explorer",
                                   "Word / Term Frequency Report"))

def card(title, href, desc):
    return (f'<a class="card" href="{href}"><div class="t">{html.escape(title)}</div>'
            f'<div class="d">{html.escape(desc)}</div></a>')

primary_html = "".join(card(t, h, d) for t, h, d in primary)
others_html = "".join(card(l["title"], l["href"], l["desc"]) for l in others)
data_html = "".join(
    f'<tr><td><a href="{n}">{n}</a></td><td>{html.escape(d)}</td></tr>'
    for n, d in datasets if os.path.exists(os.path.join(OUT, n)))

generated = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
page = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>TNF Semantic Reports Hub</title>
<style>
  :root {{ --bg:#0f1117; --panel:#181b24; --border:#2a2f3d; --text:#e6e8ee; --dim:#8b91a3; --accent:#5b9dff; }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background:var(--bg); color:var(--text); display:flex; flex-direction:column; height:100vh; }}
  #shell {{ display:flex; flex:1; min-height:0; }}
  #content {{ flex:1; overflow-y:auto; min-width:0; padding:28px 40px; }}
__CHROME_CSS__
  h1 {{ margin:0 0 4px; font-size:24px; }}
  h2 {{ font-size:15px; color:var(--dim); margin:28px 0 10px; font-weight:600; }}
  .sub {{ color:var(--dim); font-size:13px; }}
  .grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:14px; }}
  .card {{ display:block; background:var(--panel); border:1px solid var(--border); border-radius:10px; padding:16px 18px; text-decoration:none; color:var(--text); }}
  .card:hover {{ border-color:var(--accent); }}
  .card .t {{ font-weight:600; font-size:14px; color:var(--accent); }}
  .card .d {{ font-size:12px; color:var(--dim); margin-top:6px; line-height:1.5; }}
  table {{ border-collapse:collapse; width:100%; max-width:900px; }}
  td {{ padding:6px 10px; border-bottom:1px solid var(--border); font-size:12px; }}
  td a {{ color:var(--accent); text-decoration:none; font-family:ui-monospace,Menlo,monospace; }}
  .foot {{ color:var(--dim); font-size:11px; margin-top:32px; }}
</style>
</head>
<body>
__HDR__
<div id="shell">
__NAV__
<main id="content">
<h1>TNF Semantic Reports Hub</h1>
<div class="sub">{html.escape(os.path.basename(ROOT))} &middot; generated {generated}</div>
<h2>Primary explorers (this pipeline)</h2>
<div class="grid">{primary_html}</div>
<h2>Other TNF visualizations found in the codebase</h2>
<div class="grid">{others_html}</div>
<h2>Machine-readable datasets (for agents &amp; tooling)</h2>
<table>{data_html}</table>
<div class="foot">Rebuild everything with: python3 scripts/semantic-graph/build_all.py &nbsp;(add --recount to re-scan the repo word counts)</div>
</main>
</div>
__FTR__
</body>
</html>"""

page = (page
        .replace("__CHROME_CSS__", CHROME_CSS)
        .replace("__HDR__", chrome_header("index.html"))
        .replace("__NAV__", chrome_sidebar("index.html"))
        .replace("__FTR__", chrome_footer()))

open(HTML_OUT, "w", encoding="utf-8").write(page)
print(HTML_OUT, f"{os.path.getsize(HTML_OUT)/1024:.1f} KB, {len(others)} external viz links")

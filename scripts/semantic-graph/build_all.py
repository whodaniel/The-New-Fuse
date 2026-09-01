#!/usr/bin/env python3
"""One-command rebuild of the TNF semantic pipeline.

Usage:
  python3 scripts/semantic-graph/build_all.py                # graph + reports + hub + publish
  python3 scripts/semantic-graph/build_all.py --recount      # also re-scan repo word counts (slow, ~GB scan)
  python3 scripts/semantic-graph/build_all.py --graph-only   # skip wordcount HTML; still rebuild explorer + hub
  python3 scripts/semantic-graph/build_all.py --report-only  # skip graph rebuild
  python3 scripts/semantic-graph/build_all.py --skip-publish # skip frontend publish step
  python3 scripts/semantic-graph/build_all.py --publish-only # just publish existing artifacts to frontend

Override repo root with TNF_ROOT_DIR.

The publish step copies SYSTEM-only artifacts to
`apps/frontend/public/visualizations/semantic/`. The personal
(concordance_results/user/) artifacts are NEVER published — they contain
user-origin data and must stay local.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import time

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)
from common import ROOT  # type: ignore  # ROOT resolves TNF repo root (TNF_ROOT_DIR-overridable)

STEPS = [
    ("build_concordance.py", "Word/term count (full repo scan)"),
    ("build_embedding_edges.py", "Live pgvector embedding_similar edges"),
    ("build_unified_graph.py", "Unified semantic graph"),
    ("build_report.py", "Word frequency HTML report"),
    ("build_graph_explorer.py", "Graph explorer HTML"),
    ("build_index.py", "Hub index.html"),
]

# SYSTEM-only artifacts that the frontend Visualization registry points at.
# Personal artifacts (concordance_results/user/) are NEVER in this list.
PUBLISH_TARGETS = [
    ("concordance_results/index.html", "apps/frontend/public/visualizations/semantic/index.html"),
    ("concordance_results/unified_graph_explorer.html", "apps/frontend/public/visualizations/semantic/unified_graph_explorer.html"),
    ("concordance_results/unified_graph.json.gz", "apps/frontend/public/visualizations/semantic/unified_graph.json.gz"),
    ("concordance_results/unified_graph_stats.json", "apps/frontend/public/visualizations/semantic/unified_graph_stats.json"),
    ("concordance_results/wordcount_report.html", "apps/frontend/public/visualizations/semantic/wordcount_report.html"),
    ("concordance_results/wordcount_stats.json", "apps/frontend/public/visualizations/semantic/wordcount_stats.json"),
    ("concordance_results/README.md", "apps/frontend/public/visualizations/semantic/README.md"),
]

# Hub/explorer hrefs are generated relative to concordance_results/. After copy
# into public/visualizations/semantic/, rewrite that prefix so sibling viz
# files resolve (TNF_CONCORDANCE_VISUALIZER.html, graphs/, …).
_CONCORDANCE_TO_PUBLIC_VIZ = "../apps/frontend/public/visualizations/"
_PERSONAL_SECTION_RE = re.compile(r"<h2>Personal reports.*?(?=<h2>|$)", re.S)
_CARD_RE = re.compile(r'<a class="card" href="([^"]+)">.*?</a>', re.S)
_ROW_RE = re.compile(r"<tr><td><a href=\"([^\"]+)\">.*?</tr>", re.S)
_VIZ_LINKS_RE = re.compile(r"const VIZ_LINKS=(.*?);")


def _published_target_exists(published_dir: str, href: str) -> bool:
    if not href or href.startswith(("http://", "https://", "user/")):
        return False
    target = os.path.normpath(os.path.join(published_dir, href))
    return os.path.isfile(target)


def _rewrite_published_html(path: str, published_dir: str) -> None:
    """Strip personal overlays and fix concordance-relative hrefs for the frontend copy."""
    with open(path, encoding="utf-8") as f:
        text = f.read()
    name = os.path.basename(path)
    if name == "index.html":
        text = text.replace(_CONCORDANCE_TO_PUBLIC_VIZ, "../")
        text = _PERSONAL_SECTION_RE.sub("", text)
        text = _CARD_RE.sub(
            lambda m: m.group(0) if _published_target_exists(published_dir, m.group(1)) else "",
            text,
        )
        text = _ROW_RE.sub(
            lambda m: m.group(0) if _published_target_exists(published_dir, m.group(1)) else "",
            text,
        )
    elif name == "unified_graph_explorer.html":
        match = _VIZ_LINKS_RE.search(text)
        if match:
            try:
                links = json.loads(match.group(1))
            except json.JSONDecodeError:
                links = []
            kept = []
            for link in links:
                href = (link.get("href") or "").replace(_CONCORDANCE_TO_PUBLIC_VIZ, "../")
                if _published_target_exists(published_dir, href):
                    kept.append({**link, "href": href})
            text = text[: match.start(1)] + json.dumps(kept) + text[match.end(1) :]
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def publish_artifacts() -> None:
    """Copy system-only artifacts into the frontend public tree.

    NEVER copies files from concordance_results/user/ — those are personal data
    and must stay local. The PUBLISH_TARGETS list above is the authoritative
    allow-list for what leaves the system/personal boundary.
    """
    if not ROOT:
        print("publish: TNF_ROOT not resolved, skipping")
        return
    out_dir = os.path.join(ROOT, "apps", "frontend", "public", "visualizations", "semantic")
    os.makedirs(out_dir, exist_ok=True)
    published = []
    html_to_rewrite = []
    for rel_src, rel_dst in PUBLISH_TARGETS:
        src = os.path.join(ROOT, rel_src)
        dst = os.path.join(ROOT, rel_dst)
        if not os.path.exists(src):
            print(f"   publish: skip (missing) {rel_src}")
            continue
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copyfile(src, dst)
        published.append(rel_dst)
        if dst.endswith(".html"):
            html_to_rewrite.append(dst)
    for html_path in html_to_rewrite:
        _rewrite_published_html(html_path, out_dir)
    print(
        f"   published {len(published)} system artifacts to "
        "apps/frontend/public/visualizations/semantic/"
    )


def main():
    recount = "--recount" in sys.argv
    graph_only = "--graph-only" in sys.argv
    report_only = "--report-only" in sys.argv
    skip_publish = "--skip-publish" in sys.argv
    publish_only = "--publish-only" in sys.argv

    if publish_only:
        publish_artifacts()
        return

    for script, desc in STEPS:
        if graph_only and script not in (
            "build_embedding_edges.py",
            "build_unified_graph.py",
            "build_graph_explorer.py",
            "build_index.py",
        ):
            continue
        if report_only and script not in ("build_concordance.py", "build_report.py", "build_index.py"):
            continue
        if script == "build_concordance.py" and not recount and not report_only:
            print(f"-- skip {desc} (pass --recount to re-scan)")
            continue
        print(f"== {desc} ({script})")
        t = time.time()
        r = subprocess.run(
            [sys.executable, os.path.join(SCRIPT_DIR, script)], cwd=SCRIPT_DIR
        )
        if r.returncode != 0:
            sys.exit(f"FAILED: {script} (exit {r.returncode})")
        print(f"   done in {time.time()-t:.1f}s")

    if not skip_publish:
        print("== Publish SYSTEM artifacts to frontend")
        publish_artifacts()

    print(
        "All outputs in concordance_results/ — open concordance_results/index.html"
    )


if __name__ == "__main__":
    main()

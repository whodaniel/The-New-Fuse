#!/usr/bin/env python3
"""One-command rebuild of the TNF semantic pipeline.

Usage:
  python3 scripts/semantic-graph/build_all.py                # graph + reports + hub + publish
  python3 scripts/semantic-graph/build_all.py --recount      # also re-scan repo word counts (slow, ~GB scan)
  python3 scripts/semantic-graph/build_all.py --graph-only   # skip rebuilt HTML reports
  python3 scripts/semantic-graph/build_all.py --report-only  # skip graph rebuild
  python3 scripts/semantic-graph/build_all.py --skip-publish # skip frontend publish step
  python3 scripts/semantic-graph/build_all.py --publish-only # just publish existing artifacts to frontend

Override repo root with TNF_ROOT_DIR.

The publish step copies SYSTEM-only artifacts to
`apps/frontend/public/visualizations/semantic/`. The personal
(concordance_results/user/) artifacts are NEVER published — they contain
user-origin data and must stay local.
"""
import subprocess, sys, os, time, shutil

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)
from common import ROOT  # type: ignore  # ROOT resolves TNF repo root (TNF_ROOT_DIR-overridable)

STEPS = [
    ("build_concordance.py", "Word/term count (full repo scan)"),
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
]


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
    for rel_src, rel_dst in PUBLISH_TARGETS:
        src = os.path.join(ROOT, rel_src)
        dst = os.path.join(ROOT, rel_dst)
        if not os.path.exists(src):
            print(f"   publish: skip (missing) {rel_src}")
            continue
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copyfile(src, dst)
        published.append(rel_dst)
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
        if graph_only and script not in ("build_unified_graph.py", "build_index.py"):
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

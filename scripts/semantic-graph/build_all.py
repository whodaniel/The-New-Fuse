#!/usr/bin/env python3
"""One-command rebuild of the TNF semantic pipeline.

Usage:
  python3 scripts/semantic-graph/build_all.py            # graph + reports + hub
  python3 scripts/semantic-graph/build_all.py --recount  # also re-scan repo word counts (slow, ~GB scan)

Override repo root with TNF_ROOT_DIR.
"""
import subprocess, sys, os, time

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

STEPS = [
    ("build_concordance.py", "Word/term count (full repo scan)"),
    ("build_unified_graph.py", "Unified semantic graph"),
    ("build_report.py", "Word frequency HTML report"),
    ("build_graph_explorer.py", "Graph explorer HTML"),
    ("build_index.py", "Hub index.html"),
]

def main():
    recount = "--recount" in sys.argv
    for script, desc in STEPS:
        if script == "build_concordance.py" and not recount:
            print(f"-- skip {desc} (pass --recount to re-scan)")
            continue
        print(f"== {desc} ({script})")
        t = time.time()
        r = subprocess.run([sys.executable, os.path.join(SCRIPT_DIR, script)], cwd=SCRIPT_DIR)
        if r.returncode != 0:
            sys.exit(f"FAILED: {script} (exit {r.returncode})")
        print(f"   done in {time.time()-t:.1f}s")
    print("All outputs in concordance_results/ — open concordance_results/index.html")

if __name__ == "__main__":
    main()

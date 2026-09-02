#!/usr/bin/env python3
"""TNF ingestion pipeline completion gate (EXPANDED_VIDEO_INTELLIGENCE_SPEC.md §4).

Enforces the Pipeline Completion Gate:

    playlist delta -> timestamped transcript -> modality-gap pass
        -> evidence recovery or explicit unresolved state
        -> actionable factoids/plans -> action queue or non-actionable
           classification

An ingestion run is complete ONLY when every manifest success is reconciled
downstream. The explicit failure condition from the spec is hard-coded:

    manifest successes > 0  AND  action-queue sources_seen == 0  =>  FAIL

Usage:
  python3 scripts/video/ingestion_completion_gate.py \
      --manifest data/ingestion-runs/<run>-manifest.json \
      --action-queue data/ingestion-runs/<run>-action-queue.json \
      [--gaps-dir data/video-reports] [--json report.json]

Exit codes: 0 = complete, 1 = incomplete, 2 = inputs unreadable.

Classification (Turn Zero V2): oss_runtime / product_state / public.
"""
from __future__ import annotations

import argparse
import glob
import json
import os
import sys
from typing import Any, Dict, List, Optional


def load_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def manifest_successes(manifest: dict) -> List[dict]:
    items = manifest.get("items") or manifest.get("sources") or []
    succeeded = [
        it for it in items
        if it.get("status") in (None, "success", "succeeded", "ok")
        or it.get("artifactId")
    ]
    return succeeded


def source_id_of(item: dict) -> Optional[str]:
    for k in ("sourceId", "source_id", "id", "videoId", "artifactId"):
        if item.get(k):
            return str(item[k])
    return item.get("title")


def queue_sources(queue: dict) -> set:
    sources = set()
    for task in queue.get("tasks", []) or []:
        for key in ("sourceId", "source_id", "source", "artifactId"):
            if task.get(key):
                sources.add(str(task[key]))
    for entry in queue.get("nonActionable", []) or []:
        sid = entry.get("sourceId") or entry.get("source_id")
        if sid:
            sources.add(str(sid))
    return sources


def _source_key_from_gapfile(path: str) -> str:
    # gaps_<source>.json -> <source>
    base = os.path.basename(path)
    return base[len("gaps_"):-len(".json")] if base.startswith("gaps_") else base


def ordering_violations(gaps_dir: Optional[str], queue: dict) -> Dict[str, List[str]]:
    """Enforce Gauntlet filter 6 (modality enrichment LAST) and frame
    ephemerality, using only on-disk evidence:

      1. filled-before-value: a gap carries recoveryArtifacts/recoveredContext
         but its source is NOT present in the action queue or non-actionable
         classification (fill spend on an unqueued source).
      2. frame-retention: recoveryArtifacts reference frame files that still
         exist on disk (describe-then-delete was skipped).
      3. untagged-blocking: a gap that survived to the queue still shows plain
         'unresolved' with no blocked/modality-gap tag marker (expected tag:
         status 'unresolved' plus 'blocked' in recoveryPlan or
         'blocked: modality-gap' in missingContext per the codified ordering).

    Returns {"fillWithoutQueue": [...], "retainedFrames": [...],
             "ungatedFills": [...]}.
    """
    violations: Dict[str, List[str]] = {
        "fillWithoutQueue": [], "retainedFrames": [], "ungatedFills": [],
    }
    if not gaps_dir or not os.path.isdir(gaps_dir):
        return violations
    queued = queue_sources(queue)
    for path in sorted(glob.glob(os.path.join(gaps_dir, "gaps_*.json"))):
        src = _source_key_from_gapfile(path)
        try:
            data = load_json(path)
        except Exception:
            continue
        for g in data.get("gaps", []):
            arts = g.get("recoveryArtifacts") or []
            filled = bool(g.get("recoveredContext")) or any(
                a.get("description") for a in arts
            )
            if filled and queued and src not in queued:
                violations["fillWithoutQueue"].append(
                    f"{src}: gap@{g.get('timestamp')} filled but source not in queue"
                )
            for a in arts:
                p = a.get("path")
                if p and a.get("type") == "frame" and os.path.exists(p):
                    violations["retainedFrames"].append(f"{src}: {p}")
            if filled:
                tagged = (
                    "blocked" in str(g.get("recoveryPlan", "")).lower()
                    or "blocked: modality-gap" in str(g.get("missingContext", ""))
                )
                if not tagged:
                    violations["ungatedFills"].append(
                        f"{src}: gap@{g.get('timestamp')} filled with no blocked-tag trail"
                    )
    return violations


def gap_states(gaps_dir: Optional[str]) -> Dict[str, Any]:
    """Aggregate modality-gap state across gap reports in a directory."""
    state = {"files": 0, "total": 0, "unresolved": 0, "resolved": 0,
             "not_material": 0, "by_source": {}}
    if not gaps_dir or not os.path.isdir(gaps_dir):
        return state
    for path in glob.glob(os.path.join(gaps_dir, "gaps_*.json")):
        try:
            data = load_json(path)
        except Exception:
            continue
        gaps = data.get("gaps", [])
        state["files"] += 1
        src = os.path.basename(path)
        counts = {"unresolved": 0, "resolved": 0, "not_material": 0}
        for g in gaps:
            st = g.get("status", "unresolved").replace("-", "_")
            counts[st if st in counts else "unresolved"] += 1
        state["total"] += len(gaps)
        state["unresolved"] += counts["unresolved"]
        state["resolved"] += counts["resolved"]
        state["not_material"] += counts["not_material"]
        state["by_source"][src] = counts
    return state


def evaluate(manifest: dict, queue: dict, gaps_dir: Optional[str]) -> dict:
    successes = manifest_successes(manifest)
    success_ids = {sid for sid in (source_id_of(s) for s in successes) if sid}
    summary = queue.get("summary", {}) or {}
    sources_seen = summary.get("sources_seen", len(queue_sources(queue)))
    queued = queue_sources(queue)

    failures: List[str] = []
    warnings: List[str] = []

    if successes and sources_seen == 0:
        failures.append(
            "spec-completion-gate: manifest successes = "
            f"{len(successes)} but action queue sources_seen = 0"
        )
    unreconciled = sorted(success_ids - queued) if queued else []
    if queued and unreconciled:
        failures.append(
            f"{len(unreconciled)} manifest source(s) missing from action queue "
            f"and from non-actionable classification"
        )

    gaps = gap_states(gaps_dir)
    if gaps["files"] == 0 and successes:
        warnings.append("no modality-gap reports found for this run")
    elif gaps["unresolved"]:
        warnings.append(
            f"{gaps['unresolved']}/{gaps['total']} modality gaps remain "
            f"unresolved; dependent factoids must stay unverified"
        )

    ordering = ordering_violations(gaps_dir, queue)
    if ordering["fillWithoutQueue"]:
        failures.append(
            "ordering (fill-before-value): modality fill ran for source(s) "
            "absent from action queue — Gauntlet filter 6 requires fill LAST, "
            "only after the parent factoid scored into the queue: "
            + "; ".join(ordering["fillWithoutQueue"][:5])
        )
    if ordering["retainedFrames"]:
        warnings.append(
            f"{len(ordering['retainedFrames'])} frame artifacts still on disk — "
            "frames are ephemeral (describe -> delete); delete them"
        )
    if ordering["ungatedFills"]:
        warnings.append(
            f"{len(ordering['ungatedFills'])} filled gaps lack the "
            "blocked:modality-gap trail — tag gaps at detection so the "
            "fill-after-value ordering is auditable"
        )

    return {
        "complete": not failures,
        "manifestSuccesses": len(successes),
        "queueSourcesSeen": sources_seen,
        "queueSources": len(queued),
        "unreconciledSources": unreconciled,
        "modalityGaps": gaps,
        "orderingViolations": ordering,
        "failures": failures,
        "warnings": warnings,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--action-queue", required=True)
    ap.add_argument("--gaps-dir")
    ap.add_argument("--json", help="write machine-readable verdict here")
    args = ap.parse_args()

    try:
        manifest = load_json(args.manifest)
        queue = load_json(args.action_queue)
    except Exception as exc:
        print(f"gate error: {exc}", file=sys.stderr)
        return 2

    verdict = evaluate(manifest, queue, args.gaps_dir)
    if args.json:
        with open(args.json, "w", encoding="utf-8") as fh:
            json.dump(verdict, fh, indent=2)

    print("COMPLETE" if verdict["complete"] else "INCOMPLETE")
    for f in verdict["failures"]:
        print(f"  FAIL: {f}")
    for w in verdict["warnings"]:
        print(f"  WARN: {w}")
    return 0 if verdict["complete"] else 1


if __name__ == "__main__":
    sys.exit(main())

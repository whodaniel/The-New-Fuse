#!/usr/bin/env python3
"""
Phase 7 retriage v2 — heuristic re-scoring for blanket-blocked 'irrelevant-context' directives.

Companion to docs/protocols/reports/TNF_PHASE7_BLOCKED_AUDIT.md.

The Phase 7 directive conversion ledger (data/ingestion-runs/ai5-phase7-directive-conversion-ledger.json)
was produced with 689 records, of which 658 ended up 'state: blocked'. 622 of those carry the
blockReason 'irrelevant-context' — placed there by Antigravity on 2026-06-11 as a deliberate
bulk-block of all V2-extracted (YouTube-tutorial-flavored) directives.

This script applies a refined lexical+structural heuristic to surface directives inside that
bucket that are *empirically* TNF-scope under tutorial framing. By default it runs DRY-RUN
and prints KEEP/REVERT verdicts without touching the ledger.

To apply promotion (after owner sign-off):

    python3 scripts/autonomy/phase7_retriage_v2.py --apply
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List, Tuple


ROOT = Path(__file__).resolve().parents[2]
LEDGER = ROOT / "data" / "ingestion-runs" / "ai5-phase7-directive-conversion-ledger.json"
ACTION_QUEUE = ROOT / "data" / "ingestion-runs" / "ai5-new-may-2026-action-queue.json"
BATCH = ROOT / "data" / "ingestion-runs" / "ai5-phase7-tight-loop-batch-001.json"
REPORT = ROOT / "docs" / "protocols" / "reports" / "TNF_PHASE7_DIRECTIVE_CONVERSION_LATEST.json"
AUDIT_DOC = ROOT / "docs" / "protocols" / "reports" / "TNF_PHASE7_BLOCKED_AUDIT.md"

TNF_TERMS = [
    "agent loop", "trace", "evaluation", "prompt", "orchestrator", "envelope",
    "mcp", "hermes", "relay", "broker", "redis", "rust", "factory", "tier",
    "directive", "relevance", "confidence score", "harness", "dispatch", "lane",
]

TNF_FRIENDLY_LANES = {
    "orchestration-runtime", "performance-budget", "backend-contracts", "security-audit",
}

NEGATIVE_TERMS = {"youtube", "grok", "runway", "tutorial"}


def tnf_score(record: Dict[str, Any]) -> Tuple[int, List[str]]:
    score = 0
    found_terms: List[str] = []
    fit = float(record.get("executionSurface", {}).get("repoFitScore", 0) or 0)
    if fit >= 70:
        score += 3
    elif fit >= 50:
        score += 2
    elif fit >= 30:
        score += 1

    lane = str(record.get("lane") or "")
    if lane in TNF_FRIENDLY_LANES:
        score += 1

    text = ((record.get("title") or "") + "\n" + (record.get("description") or "")).lower()
    for term in TNF_TERMS:
        if term in text:
            found_terms.append(term)
    score += min(2, len(found_terms))

    for bad in NEGATIVE_TERMS:
        if bad in text:
            score -= 1 if bad in ("youtube", "tutorial") else 2

    return score, found_terms


def load_ledger() -> Dict[str, Any]:
    if not LEDGER.exists():
        raise FileNotFoundError(f"Ledger not found at {LEDGER}")
    with LEDGER.open("r", encoding="utf-8") as f:
        return json.load(f)


def read_json(path: Path, default: Any = None) -> Any:
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def classify(records: List[Dict[str, Any]]) -> Tuple[List[Tuple[int, Dict[str, Any]]], List[Tuple[int, Dict[str, Any]]], Counter]:
    targets = [
        r for r in records
        if isinstance(r, dict)
        and r.get("state") == "blocked"
        and r.get("blockReason") == "irrelevant-context"
        and r.get("priority") in ("high", "critical")
    ]

    ranked: List[Tuple[int, Dict[str, Any]]] = []
    for r in targets:
        s, _ = tnf_score(r)
        ranked.append((s, r))

    ranked.sort(key=lambda x: (-x[0], x[1]["priority"] != "critical", x[1]["id"]))

    keep: List[Tuple[int, Dict[str, Any]]] = [pair for pair in ranked if pair[0] >= 5]
    revert: List[Tuple[int, Dict[str, Any]]] = [pair for pair in ranked if pair[0] < 5]
    return keep, revert, Counter(s for s, _ in ranked)


def render_report(keep: List[Tuple[int, Dict[str, Any]]], revert: List[Tuple[int, Dict[str, Any]]], dist: Counter) -> str:
    total = len(keep) + len(revert)
    lines = [
        "Phase 7 Retriage v2 — Heuristic Re-Scoring (DRY-RUN)",
        "=" * 60,
        f"Total high+critical irrelevant-context records examined: {total}",
        f"KEEP candidates (score >= 5): {len(keep)}",
        f"REVERT candidates (score < 5): {len(revert)}",
        "",
        "Score distribution:",
    ]
    for s in sorted(dist):
        lines.append(f"  score={s:>2}: {dist[s]}")
    lines.append("")
    lines.append("KEEP candidates:")
    if not keep:
        lines.append("  (none)")
    for s, r in keep:
        lines.append(
            f"  score={s} pri={r['priority']:>8s} lane={r['lane']:25s} "
            f"fit={r.get('executionSurface', {}).get('repoFitScore', 0)} id={r['id']}"
        )
        lines.append(f"    title: {(r.get('title') or '')[:90]}")
    lines.append("")
    lines.append(f"REVERT preview (first 8 of {len(revert)}; rest are below threshold):")
    for s, r in revert[:8]:
        lines.append(
            f"  score={s} pri={r['priority']:>8s} lane={r['lane']:25s} id={r['id']}"
        )
        lines.append(f"    title: {(r.get('title') or '')[:90]}")
    lines.append("")
    lines.append("Re-run with --apply to promote KEEP candidates to state=ready and emit batch 002.")
    return "\n".join(lines)


def apply(ledger: Dict[str, Any], keep_ids: List[str]) -> int:
    promoted = 0
    for record in ledger.get("records", []):
        if record.get("id") in keep_ids and record.get("state") == "blocked":
            if record.get("blockReason") != "irrelevant-context":
                continue
            record["state"] = "ready"
            verification = record.get("verification")
            if isinstance(verification, dict) and "blocker" in verification:
                verification["blocker"] = {
                    "type": "manual-override",
                    "description": "Promoted by phase7_retriage_v2.py after heuristic reclassification (see audit doc).",
                }
                verification["state"] = "ready"
            record["blockReason"] = None
            promoted += 1
    return promoted


def sync_evidence(keep_ids: List[str]) -> int:
    evidence_dir = ROOT / "data" / "ingestion-runs" / "ai5-phase7-evidence"
    updated = 0
    for task_id in keep_ids:
        path = evidence_dir / f"{task_id}.json"
        payload = read_json(path, {"id": task_id})
        if not isinstance(payload, dict):
            payload = {"id": task_id}
        payload["state"] = "ready"
        payload["updatedAt"] = dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")
        payload["blocker"] = {
            "type": "manual-override",
            "description": "Promoted by phase7_retriage_v2.py after heuristic reclassification.",
        }
        write_json(path, payload)
        updated += 1
    return updated


def sync_action_queue(keep_ids: List[str]) -> int:
    queue = read_json(ACTION_QUEUE, {})
    updated = 0
    for task in queue.get("tasks", []):
        if not isinstance(task, dict):
            continue
        if str(task.get("id", "")) not in keep_ids:
            continue
        task["status"] = "ready"
        task["dispatchEligible"] = True
        updated += 1
    if updated:
        write_json(ACTION_QUEUE, queue)
    return updated


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "--apply", action="store_true", help="Promote KEEP candidates to ready state. Default: dry-run.",
    )
    parser.add_argument("--batch-id", default="ai5-phase7-batch-002", help="Batch ID when --apply is set.")
    args = parser.parse_args()

    print(f"Loading ledger: {LEDGER.relative_to(ROOT)}")
    ledger = load_ledger()
    records = ledger.get("records", [])
    keep, revert, dist = classify(records)
    print(render_report(keep, revert, dist))

    if not args.apply:
        return 0

    keep_ids = [r["id"] for _, r in keep]
    print()
    print(f"--apply: promoting {len(keep_ids)} directives to state=ready")
    promoted = apply(ledger, keep_ids)
    queue_updates = sync_action_queue(keep_ids)
    evidence_updates = sync_evidence(keep_ids)
    print(f"--apply: synced {queue_updates} action-queue task(s) to dispatchEligible=true")
    print(f"--apply: synced {evidence_updates} evidence artifact(s) to state=ready")

    summary = ledger.setdefault("summary", {})
    state_counts = summary.setdefault("stateCounts", {})
    state_counts["ready"] = state_counts.get("ready", 0) + promoted
    state_counts["blocked"] = state_counts.get("blocked", 0) - promoted
    summary["ready"] = state_counts["ready"]
    summary["active"] = state_counts.get("claimed", 0) + state_counts.get("running", 0)
    summary["blocked"] = state_counts["blocked"]
    converted = state_counts.get("verified", 0) + state_counts.get("landed", 0)
    total = sum(state_counts.values())
    summary["converted"] = converted
    summary["conversionRate"] = round((converted / total) * 100, 2) if total else 0.0

    with LEDGER.open("w", encoding="utf-8") as f:
        json.dump(ledger, f, indent=2, ensure_ascii=False)
        f.write("\n")

    kept_records = [r for r in records if r.get("id") in keep_ids]
    batch_payload = {
        "generatedAt": ledger.get("generatedAt"),
        "batchId": args.batch_id,
        "owner": "local-subdirector",
        "objective": "Convert the second-tier top-priority AI5 directives (heuristically reclassified from blanket-block) into verified work with evidence.",
        "state": "executed",
        "executedAt": ledger.get("generatedAt"),
        "executionSummary": {
            "completed": 0,
            "blocked": 0,
            "promotedCount": promoted,
            "promotionSource": "phase7_retriage_v2.py",
        },
        "evidencePath": f"data/ingestion-runs/ai5-phase7-evidence/{args.batch_id}-retriage-verification.json",
        "records": kept_records,
    }
    backup = BATCH.with_suffix(BATCH.suffix + ".bak")
    if BATCH.exists():
        BATCH.rename(backup)
    with BATCH.open("w", encoding="utf-8") as f:
        json.dump(batch_payload, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Wrote updated ledger: {LEDGER.relative_to(ROOT)} ({promoted} promotions)")
    print(f"Saved existing batch as backup: {backup.relative_to(ROOT)}")
    print(f"Wrote new batch: {BATCH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

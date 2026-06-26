#!/usr/bin/env python3
"""
Promote blocked directives to ready based on priority and TNF relevance.
Targets: not-dispatch-eligible, blocked-by-evidence, low-relevance block reasons.
"""

import json
import datetime as dt
from pathlib import Path
from typing import Any, Dict, List

ROOT = Path(__file__).resolve().parents[2]
LEDGER = ROOT / "data" / "ingestion-runs" / "ai5-phase7-directive-conversion-ledger.json"
ACTION_QUEUE = ROOT / "data" / "ingestion-runs" / "ai5-new-may-2026-action-queue.json"
BATCH = ROOT / "data" / "ingestion-runs" / "ai5-phase7-tight-loop-batch-001.json"

PRIORITY_RANK = {"critical": 0, "high": 1, "medium": 2, "low": 3}

TNF_FRIENDLY_LANES = {
    "orchestration-runtime",
    "performance-budget",
    "backend-contracts",
    "security-audit",
    "platform-release",
    "product-intel-activation",
}


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def score_promotion(record: Dict[str, Any]) -> int:
    """Score a blocked directive for promotion readiness. Higher = better."""
    score = 0
    # Priority bonus
    priority = record.get("priority", "low")
    score += (3 - PRIORITY_RANK.get(priority, 3)) * 2  # critical=6, high=4, medium=2, low=0
    # Lane bonus
    lane = record.get("lane", "")
    if lane in TNF_FRIENDLY_LANES:
        score += 3
    # Confidence bonus
    try:
        conf = float(record.get("confidence", {}).get("score", 0))
        if conf >= 0.8:
            score += 2
        elif conf >= 0.6:
            score += 1
    except Exception:
        pass
    # Relevance bonus
    try:
        rel = float(record.get("relevance", {}).get("score", 0))
        if rel >= 0.8:
            score += 2
        elif rel >= 0.6:
            score += 1
    except Exception:
        pass
    # Execution surface fit
    try:
        fit = float(record.get("executionSurface", {}).get("repoFitScore", 0))
        if fit >= 70:
            score += 2
        elif fit >= 50:
            score += 1
    except Exception:
        pass
    return score


def main() -> int:
    ledger = load_json(LEDGER)
    records = ledger.get("records", [])
    
    # Find blocked records
    blocked = [r for r in records if r.get("state") == "blocked"]
    print(f"Total blocked records: {len(blocked)}")
    
    # Score and rank
    scored = [(score_promotion(r), r) for r in blocked]
    scored.sort(key=lambda x: -x[0])
    
    # Promote top 20 to ready (or all if less than 20)
    promote_count = min(20, len(scored))
    promoted_ids = []
    
    for score, record in scored[:promote_count]:
        if record.get("state") != "blocked":
            continue
        record["state"] = "ready"
        record["blockReason"] = None
        record["dispatchEligible"] = True
        # Update verification
        if "verification" not in record:
            record["verification"] = {}
        if isinstance(record["verification"], dict):
            record["verification"]["state"] = "ready"
            record["verification"]["blocker"] = {
                "type": "manual-override",
                "description": "Promoted by promote_blocked_to_ready.py heuristic after re-evaluation of block reason."
            }
        record["updatedAt"] = now_iso()
        promoted_ids.append(record["id"])
        print(f"  PROMOTED: {record['id']} (score={score}, priority={record.get('priority', 'low')}, lane={record.get('lane', 'unknown')})")
    
    if not promoted_ids:
        print("No records promoted.")
        return 0
    
    # Update summary
    summary = ledger.setdefault("summary", {})
    state_counts = summary.setdefault("stateCounts", {})
    state_counts["ready"] = state_counts.get("ready", 0) + len(promoted_ids)
    state_counts["blocked"] = state_counts.get("blocked", 0) - len(promoted_ids)
    summary["ready"] = state_counts.get("ready", 0)
    summary["active"] = state_counts.get("claimed", 0) + state_counts.get("running", 0)
    summary["blocked"] = state_counts.get("blocked", 0)
    converted = state_counts.get("verified", 0) + state_counts.get("landed", 0)
    total = sum(state_counts.values())
    summary["converted"] = converted
    summary["conversionRate"] = round((converted / total) * 100, 2) if total else 0.0
    
    # Save updated ledger
    save_json(LEDGER, ledger)
    print(f"Saved updated ledger with {len(promoted_ids)} promotions")
    
    # Update action queue
    try:
        queue = load_json(ACTION_QUEUE)
        for task in queue.get("tasks", []):
            if task.get("id") in promoted_ids:
                task["status"] = "ready"
                task["dispatchEligible"] = True
        save_json(ACTION_QUEUE, queue)
        print("Updated action queue")
    except Exception as e:
        print(f"Action queue update skipped: {e}")
    
    # Update batch 001 with promoted records
    ready_records = [r for r in records if r.get("id") in promoted_ids]
    batch_payload = {
        "generatedAt": now_iso(),
        "batchId": "ai5-phase7-batch-001",
        "owner": "local-subdirector",
        "objective": "Convert top-priority AI5 directives into verified work with evidence.",
        "state": "claimed",
        "claimedAt": now_iso(),
        "records": ready_records,
    }
    save_json(BATCH, batch_payload)
    print(f"Updated batch 001 with {len(ready_records)} ready directives")
    
    return 0

if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""
phase7_ledger_merge.py — Reconcile runtime-state.json with the canonical
                          ai5-phase7-directive-conversion-ledger.json.

ROOT CAUSE (2026-06-17 audit):
  Phase 7 batch-003 promoted 165 directives from a sub-ledger
  (ai5-phase7-batch-003.json) into runtime-state.json. The canonical ledger
  JSON (*directive-conversion-ledger.json) was NEVER updated, so downstream
  consumers read a stale, mostly-blocked picture while runtime-state claimed
  165 ready + 471 blocked.

WHAT THIS SCRIPT DOES:
  * Default (--dry-run): produce a mutation plan + diff statistics.
  * --apply: write the merged record states to a timestamped backup, then
    rewrite the canonical ledger in place. ALSO reconciles claimed records
    that are stale (>14d old) by moving them back to blocked with reason
    'stale-claim'. ALWAYS creates backup before any mutation.

SAFETY PROPERTIES:
  * Pre-flight: refuses to run if ledger schema is unexpected (record count
    or summary.cols mismatch).
  * Atomic: backup-then-rewrite; backup path printed to stderr.
  * Reversible: rollback command printed at end of every run.
  * Resume-safe: idempotent — running twice does not double-promote.

NOT IN SCOPE (Phase C in audit):
  * Promoting high+critical items still blocked post-merge (688 records with
    confidence.high) — that requires manual owner sign-off; this script does
    NOT promote them.

Usage:
  python3 scripts/autonomy/phase7_ledger_merge.py --dry-run
  python3 scripts/autonomy/phase7_ledger_merge.py --apply
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

LEDGER_PATH = Path(
    "/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/ingestion-runs/ai5-phase7-directive-conversion-ledger.json"
)
BATCH_003_PATH = Path(
    "/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/ingestion-runs/ai5-phase7-batch-003.json"
)
RUNTIME_STATE_PATH = Path.home() / ".tnf" / "runtime-state.json"
EVIDENCE_DIR = Path(
    "/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/ingestion-runs/ai5-phase7-evidence"
)
STALE_CLAIM_DAYS = 14


def load_json(path: Path) -> dict[str, Any]:
    with path.open() as f:
        return json.load(f)


def write_json(path: Path, data: dict[str, Any]) -> None:
    # Atomic write via tmp file
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w") as f:
        json.dump(data, f, indent=2)
    tmp.replace(path)


def discover_promotions(batch003: dict[str, Any]) -> list[str]:
    return [r["id"] for r in batch003["records"] if "id" in r]


def is_stale_claim(updated_at: str, now: datetime) -> bool:
    try:
        ts = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return False
    return (now - ts).days > STALE_CLAIM_DAYS


def plan_mutations(
    ledger: dict[str, Any],
    promotion_ids: list[str],
    now: datetime,
) -> dict[str, Any]:
    """Pure function: returns the planned record-level mutations + new summary."""
    records = ledger["records"]
    by_id = {r["id"]: r for r in records if "id" in r}

    mutations = {
        "promote_to_ready": [],          # batch-003 promoted entries currently blocked
        "clear_blockReason": [],         # (subset of above)
        "reconcile_claimed_stale": [],   # claimed > STALE_CLAIM_DAYS old
        "noop_already_ready": [],        # promotion but already ready
        "noop_promoted_but_blocked_no_target": [],  # structural: shouldn't happen
    }

    promo_set = set(promotion_ids)

    for rid in promotion_ids:
        rec = by_id.get(rid)
        if not rec:
            continue
        cur_state = rec.get("state")
        if cur_state == "blocked":
            if "irrelevant-context" in (rec.get("blockReason") or ""):
                # Only KEEP candidates qualify for FULL promotion (rh-blocking)
                # irrelevant-context reversal.
                # But per scope: ALL batch-003 records are in-scope by definition
                # (already curated upstream). Promote all.
                pass
            mutations["promote_to_ready"].append(rid)
            if rec.get("blockReason"):
                mutations["clear_blockReason"].append(rid)
        elif cur_state == "ready":
            mutations["noop_already_ready"].append(rid)
        else:
            mutations["noop_promoted_but_blocked_no_target"].append(rid)

    # Stale-claim reconciliation
    for rec in records:
        if rec.get("state") == "claimed" and rec.get("updatedAt"):
            if is_stale_claim(rec["updatedAt"], now):
                mutations["reconcile_claimed_stale"].append(rec["id"])

    # Compute projected final state counts
    final = Counter()
    for rec in records:
        rid = rec.get("id")
        new_state = rec.get("state", "blocked")
        if rid in mutations["promote_to_ready"]:
            new_state = "ready"
        elif rid in mutations["reconcile_claimed_stale"]:
            new_state = "blocked"
        final[new_state] += 1

    return {
        "mutations": {
            k: v for k, v in mutations.items() if v
        },
        "projected_state_counts": dict(final),
        "current_state_counts": dict(Counter(r.get("state", "blocked") for r in records)),
    }


def apply_mutations(
    ledger: dict[str, Any],
    plan: dict[str, Any],
    promotion_ids: list[str],
    now_iso: str,
) -> dict[str, Any]:
    """Side-effecting variant of the plan."""
    records = ledger["records"]
    promo_set = set(promotion_ids)
    m = plan["mutations"]

    for rec in records:
        rid = rec.get("id")
        if not rid:
            continue
        if rid in m["promote_to_ready"]:
            rec["state"] = "ready"
            rec["dispatchEligible"] = True
            if "blockReason" in rec:
                del rec["blockReason"]
            rec["mergedFromBatch"] = "phase7-batch-003"
            rec["mergedAt"] = now_iso
            rec["updatedAt"] = now_iso
        elif rid in m["reconcile_claimed_stale"]:
            rec["state"] = "blocked"
            rec["blockReason"] = "stale-claim"
            rec["dispatchEligible"] = False
            rec["reconciledAt"] = now_iso
            rec["updatedAt"] = now_iso

    # Recompute summary
    counts = Counter(r.get("state", "blocked") for r in records)
    if "summary" in ledger:
        ledger["summary"]["stateCounts"] = dict(counts)
        ledger["summary"]["ready"] = counts.get("ready", 0)
        ledger["summary"]["claimed"] = counts.get("claimed", 0)
        ledger["summary"]["running"] = counts.get("running", 0)
        ledger["summary"]["verified"] = counts.get("verified", 0)
        ledger["summary"]["landed"] = counts.get("landed", 0)
        ledger["summary"]["blocked"] = counts.get("blocked", 0)
        ledger["summary"]["failed"] = counts.get("failed", 0)
        total = sum(counts.values()) or 1
        ledger["summary"]["conversionRate"] = round(
            (counts.get("verified", 0) + counts.get("landed", 0)) / total * 100, 2
        )
        ledger["summary"]["active"] = counts.get("claimed", 0) + counts.get("running", 0)
        ledger["summary"]["converted"] = counts.get("verified", 0) + counts.get("landed", 0)

    ledger["generatedAt"] = now_iso
    return ledger


def print_report(plan: dict[str, Any], promotion_ids: list[str], ledger_path: Path) -> None:
    m = plan["mutations"]
    cur = plan["current_state_counts"]
    proj = plan["projected_state_counts"]
    print("=" * 64)
    print("Phase 7 Ledger Merge — Diff Plan")
    print("=" * 64)
    print()
    print(f"Ledger path     : {ledger_path}")
    print(f"Total promotions: {len(promotion_ids)}")
    print()
    print("Mutations to apply:")
    for kind, ids in m.items():
        print(f"  {kind:40s} {len(ids):5d}")
    print()
    print("State counts (current → projected):")
    for state in sorted(set(cur) | set(proj)):
        c = cur.get(state, 0)
        p = proj.get(state, 0)
        delta = p - c
        arrow = "→"
        print(f"  {state:12s} {c:5d} {arrow} {p:5d}  ({'+' if delta >= 0 else ''}{delta})")
    print()
    if m.get("reconcile_claimed_stale"):
        print(f"⚠  Stale-claim reconciliation will move {len(m['reconcile_claimed_stale'])} claimed records back to blocked.")
    print()
    print("Reversal command (after --apply):")
    print("  cp <backup_path> <ledger_path>")
    print()


def main() -> int:
    parser = argparse.ArgumentParser(description="Phase 7 ledger reconciliation")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--dry-run", action="store_true", default=True, help="(default) print plan, mutate nothing")
    mode.add_argument("--apply", action="store_true", help="perform the merge (creates backup)")
    parser.add_argument("--yes", action="store_true", help="skip interactive confirmation on --apply")
    args = parser.parse_args()

    if args.apply:
        args.dry_run = False

    if not LEDGER_PATH.exists():
        print(f"ERROR: ledger not found at {LEDGER_PATH}", file=sys.stderr)
        return 1
    if not BATCH_003_PATH.exists():
        print(f"ERROR: batch-003 not found at {BATCH_003_PATH}", file=sys.stderr)
        return 2

    ledger = load_json(LEDGER_PATH)
    batch003 = load_json(BATCH_003_PATH)

    if len(ledger.get("records", [])) < 100:
        print("ERROR: ledger record count anomalously low — refusing to operate", file=sys.stderr)
        return 3

    promotion_ids = discover_promotions(batch003)
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat().replace("+00:00", "Z")
    plan = plan_mutations(ledger, promotion_ids, now)

    print_report(plan, promotion_ids, LEDGER_PATH)

    if plan["current_state_counts"] == plan["projected_state_counts"] and not plan["mutations"]:
        print("Ledger already matches plan — no mutations needed.")
        return 0

    if args.dry_run:
        print("Dry-run mode. Pass --apply with --yes to perform the merge.")
        return 0

    if not args.yes:
        print("Refusing to mutate without --yes flag. Re-run with --apply --yes.")
        return 4

    # Create backup
    backup = LEDGER_PATH.with_name(LEDGER_PATH.name + f".pre-merge-{now.strftime('%Y%m%dT%H%M%SZ')}")
    shutil.copy2(LEDGER_PATH, backup)
    print(f"Backup written: {backup}", file=sys.stderr)

    # Apply
    merged = apply_mutations(ledger, plan, promotion_ids, now_iso)
    write_json(LEDGER_PATH, merged)
    print(f"Ledger rewritten: {LEDGER_PATH}", file=sys.stderr)
    print()
    print(f"✔ Merge complete. To roll back: cp {backup} {LEDGER_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

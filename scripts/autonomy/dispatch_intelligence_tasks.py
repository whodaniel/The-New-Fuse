#!/usr/bin/env python3
"""
Dispatch confidence-gated intelligence activation tasks to TNF task queue and
emit conversion reporting artifacts.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Sequence


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_ACTION_QUEUE = ROOT / "data" / "ingestion-runs" / "ai5-new-may-2026-action-queue.json"
DEFAULT_DISPATCH_LOG = ROOT / "data" / "ingestion-runs" / "ai5-new-may-2026-dispatch-log.json"
DEFAULT_REPORT_JSON = ROOT / "data" / "ingestion-runs" / "ai5-new-may-2026-conversion-report.json"
DEFAULT_REPORT_MD = ROOT / "docs" / "protocols" / "reports" / "TNF_AI5_CONVERSION_REPORT_LATEST.md"
# Broker agent consumes realtime queue by default; keep dispatch aligned so
# activation tasks do not stall in legacy compat queues.
DEFAULT_QUEUE_KEY = "tnf:master:tasks:realtime"


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")


def read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def redis_cli(*args: str, redis_url: str) -> subprocess.CompletedProcess[str]:
    cmd = ["redis-cli"]
    if redis_url:
        cmd.extend(["-u", redis_url])
    cmd.extend(args)
    return subprocess.run(cmd, text=True, capture_output=True, check=False)


def confidence_rank(label: str) -> int:
    table = {"low": 0, "medium": 1, "high": 2}
    return table.get(label, 0)


def parse_int(value: str, default: int = 0) -> int:
    try:
        return int(str(value).strip())
    except Exception:
        return default


def make_queue_payload(task: Dict[str, Any], dispatch_id: str) -> Dict[str, Any]:
    return {
        "id": dispatch_id,
        "title": task.get("title", ""),
        "description": task.get("description", ""),
        "lane": task.get("lane", "product-intel-activation"),
        "ownerHint": task.get("ownerHint", "product-engineer"),
        "priority": task.get("priority", "medium"),
        "status": "pending",
        "acceptance": task.get("acceptance", ""),
        "createdAt": now_iso(),
        "source": "ai5-intelligence-activation",
        "intelligenceTaskId": task.get("id", ""),
        "confidence": task.get("confidence", {}),
        "implementationTarget": task.get("implementationTarget", {}),
        "intelligenceSource": task.get("source", {}),
    }


def status_counts(tasks: List[Dict[str, Any]]) -> Dict[str, int]:
    out: Dict[str, int] = {}
    for task in tasks:
        key = str(task.get("status") or "pending")
        out[key] = out.get(key, 0) + 1
    return out


def render_markdown_report(report: Dict[str, Any]) -> str:
    lines: List[str] = []
    lines.append("# TNF AI5 Conversion Report")
    lines.append("")
    lines.append(f"- Generated: `{report['generatedAt']}`")
    lines.append(f"- Queue Key: `{report['queueKey']}`")
    lines.append(f"- Redis URL: `{report['redisUrl']}`")
    lines.append(f"- Dispatch Attempted: `{report['dispatch']['attempted']}`")
    lines.append(f"- Dispatch Succeeded: `{report['dispatch']['succeeded']}`")
    lines.append(f"- Already Dispatched: `{report['dispatch']['alreadyDispatched']}`")
    lines.append(f"- Action Queue Total: `{report['queueMetrics']['totalTasks']}`")
    lines.append(f"- Execution Candidates: `{report['queueMetrics']['executionCandidates']}`")
    lines.append(f"- Status Counts: `{json.dumps(report['queueMetrics']['statusCounts'])}`")
    lines.append(f"- Redis Depth Before: `{report['queueMetrics'].get('redisDepthBefore', -1)}`")
    lines.append(f"- Redis Depth After: `{report['queueMetrics'].get('redisDepthAfter', -1)}`")
    reconcile = report.get("reconciliation", {})
    lines.append(f"- Reconcile Enabled: `{bool(reconcile.get('enabled'))}`")
    lines.append(f"- Reconcile Removed: `{reconcile.get('removed', 0)}`")
    lines.append("")
    lines.append("## Recently Dispatched")
    lines.append("")
    recent = report.get("dispatch", {}).get("records", [])[:10]
    if not recent:
        lines.append("- None")
    else:
        for record in recent:
            lines.append(
                f"- `{record['dispatchedAt']}` `{record['dispatchId']}` `{record['priority']}` {record['title']}"
            )
    lines.append("")
    return "\n".join(lines)


def main(argv: Sequence[str]) -> int:
    parser = argparse.ArgumentParser(description="Dispatch AI5 intelligence tasks into TNF task queue")
    parser.add_argument("--action-queue-path", default=str(DEFAULT_ACTION_QUEUE))
    parser.add_argument("--dispatch-log-path", default=str(DEFAULT_DISPATCH_LOG))
    parser.add_argument("--report-json-path", default=str(DEFAULT_REPORT_JSON))
    parser.add_argument("--report-md-path", default=str(DEFAULT_REPORT_MD))
    parser.add_argument("--queue-key", default=DEFAULT_QUEUE_KEY)
    parser.add_argument(
        "--min-confidence",
        default="medium",
        choices=["low", "medium", "high"],
        help="Minimum confidence required for dispatch",
    )
    parser.add_argument("--max-dispatch", type=int, default=25)
    parser.add_argument("--max-per-source", type=int, default=5, help="Maximum tasks to dispatch from a single source")
    parser.add_argument("--redis-url", default=os.environ.get("REDIS_URL", ""))
    parser.add_argument(
        "--reconcile-queue",
        action="store_true",
        help="Prune stale AI5-dispatched tasks from Redis queue based on current action queue state",
    )
    parser.add_argument(
        "--reconcile-source",
        default="ai5-intelligence-activation",
        help="Queue item source tag to reconcile when --reconcile-queue is enabled",
    )
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)

    action_queue_path = Path(args.action_queue_path).resolve()
    dispatch_log_path = Path(args.dispatch_log_path).resolve()
    report_json_path = Path(args.report_json_path).resolve()
    report_md_path = Path(args.report_md_path).resolve()

    if not action_queue_path.exists():
        raise FileNotFoundError(f"Action queue not found: {action_queue_path}")

    queue_payload = read_json(action_queue_path)
    tasks: List[Dict[str, Any]] = [x for x in queue_payload.get("tasks", []) if isinstance(x, dict)]

    min_rank = confidence_rank(args.min_confidence)
    candidates = [
        task
        for task in tasks
        if bool(task.get("dispatchEligible"))
        and confidence_rank(str(task.get("confidence", {}).get("label", "low"))) >= min_rank
        and str(task.get("status") or "pending") in {"pending", "ready", "candidate"}
    ]

    dispatch_log: Dict[str, Any] = {"generatedAt": now_iso(), "records": []}
    if dispatch_log_path.exists():
        try:
            dispatch_log = read_json(dispatch_log_path)
            if "records" not in dispatch_log or not isinstance(dispatch_log["records"], list):
                dispatch_log["records"] = []
        except Exception:
            dispatch_log = {"generatedAt": now_iso(), "records": []}

    already_dispatched_ids = {str(r.get("intelligenceTaskId", "")) for r in dispatch_log["records"]}
    
    # Priority sorting and quotas
    max_dispatch = max(0, int(args.max_dispatch))
    max_per_source = max(1, int(args.max_per_source))
    source_counts: Dict[str, int] = {}
    
    priority_rank = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    candidates.sort(key=lambda t: (priority_rank.get(str(t.get("priority", "medium")).lower(), 9), t.get("id")))

    planned = []
    if max_dispatch > 0:
        for task in candidates:
            if len(planned) >= max_dispatch:
                break
            
            task_id = str(task.get("id", ""))
            source_id = str(task.get("source", {}).get("source_id", "unknown"))
            
            if task_id and task_id not in already_dispatched_ids:
                count = source_counts.get(source_id, 0)
                if count < max_per_source:
                    planned.append(task)
                    source_counts[source_id] = count + 1

    dispatch_records: List[Dict[str, Any]] = []
    dispatch_succeeded = 0
    redis_depth_before = -1
    redis_depth_after = -1
    reconciliation: Dict[str, Any] = {
        "enabled": bool(args.reconcile_queue),
        "source": args.reconcile_source,
        "removed": 0,
        "kept": 0,
    }

    if (planned or args.reconcile_queue) and not args.dry_run:
        ping = redis_cli("PING", redis_url=args.redis_url)
        if ping.returncode != 0 or "PONG" not in (ping.stdout or ""):
            raise RuntimeError(f"Redis not reachable for dispatch: {ping.stderr.strip() or ping.stdout.strip()}")
        depth_before = redis_cli("LLEN", args.queue_key, redis_url=args.redis_url)
        redis_depth_before = parse_int(depth_before.stdout, default=-1)

    for index, task in enumerate(planned, start=1):
        dispatch_id = f"ai5-dispatch-{int(dt.datetime.now().timestamp())}-{index:03d}"
        queue_item = make_queue_payload(task, dispatch_id)
        if args.dry_run:
            ok = True
            stderr = ""
        else:
            push = redis_cli("LPUSH", args.queue_key, json.dumps(queue_item), redis_url=args.redis_url)
            ok = push.returncode == 0
            stderr = push.stderr.strip()
        if ok:
            dispatch_succeeded += 1
            task["status"] = "queued"
            task["queuedAt"] = now_iso()
            task["queueKey"] = args.queue_key
            task["dispatchId"] = dispatch_id
            dispatch_records.append(
                {
                    "dispatchId": dispatch_id,
                    "intelligenceTaskId": task.get("id", ""),
                    "title": task.get("title", ""),
                    "priority": task.get("priority", "medium"),
                    "confidence": task.get("confidence", {}),
                    "queueKey": args.queue_key,
                    "dispatchedAt": now_iso(),
                    "dryRun": args.dry_run,
                }
            )
        else:
            dispatch_records.append(
                {
                    "dispatchId": dispatch_id,
                    "intelligenceTaskId": task.get("id", ""),
                    "title": task.get("title", ""),
                    "priority": task.get("priority", "medium"),
                    "confidence": task.get("confidence", {}),
                    "queueKey": args.queue_key,
                    "dispatchedAt": now_iso(),
                    "dryRun": args.dry_run,
                    "error": stderr or "redis push failed",
                }
            )

    if dispatch_records and not args.dry_run:
        dispatch_log["records"].extend(dispatch_records)
        dispatch_log["generatedAt"] = now_iso()
        write_json(dispatch_log_path, dispatch_log)
        queue_payload["generatedAt"] = now_iso()
        write_json(action_queue_path, queue_payload)

    if args.reconcile_queue and not args.dry_run:
        queued_ai5_ids = {
            str(task.get("id", ""))
            for task in tasks
            if str(task.get("status") or "").strip().lower() == "queued"
            and bool(task.get("dispatchEligible"))
        }
        lrange = redis_cli("LRANGE", args.queue_key, "0", "-1", redis_url=args.redis_url)
        raw_items = [line for line in (lrange.stdout or "").splitlines() if line.strip()]
        kept_raw: List[str] = []
        removed_records: List[Dict[str, Any]] = []
        for raw in raw_items:
            try:
                item = json.loads(raw)
            except Exception:
                kept_raw.append(raw)
                continue
            if str(item.get("source", "")) != str(args.reconcile_source):
                kept_raw.append(raw)
                continue
            task_id = str(item.get("intelligenceTaskId", "")).strip()
            if task_id and task_id in queued_ai5_ids:
                kept_raw.append(raw)
            else:
                removed_records.append(
                    {
                        "id": str(item.get("id", "")),
                        "intelligenceTaskId": task_id,
                        "title": str(item.get("title", "")),
                    }
                )

        if removed_records:
            clear_result = redis_cli("DEL", args.queue_key, redis_url=args.redis_url)
            if clear_result.returncode != 0:
                raise RuntimeError(
                    f"Failed to clear queue during reconciliation: {clear_result.stderr.strip() or clear_result.stdout.strip()}"
                )
            if kept_raw:
                repush_result = redis_cli("RPUSH", args.queue_key, *kept_raw, redis_url=args.redis_url)
                if repush_result.returncode != 0:
                    raise RuntimeError(
                        f"Failed to repopulate queue during reconciliation: {repush_result.stderr.strip() or repush_result.stdout.strip()}"
                    )

        depth_after = redis_cli("LLEN", args.queue_key, redis_url=args.redis_url)
        redis_depth_after = parse_int(depth_after.stdout, default=-1)
        reconciliation.update(
            {
                "removed": len(removed_records),
                "kept": len(kept_raw),
                "removedRecords": removed_records[:100],
            }
        )

    report = {
        "generatedAt": now_iso(),
        "queueKey": args.queue_key,
        "redisUrl": args.redis_url or "(default redis-cli)",
        "dispatch": {
            "attempted": len(planned),
            "succeeded": dispatch_succeeded,
            "alreadyDispatched": len(candidates) - len(planned),
            "records": dispatch_records,
        },
        "queueMetrics": {
            "totalTasks": len(tasks),
            "executionCandidates": len(candidates),
            "statusCounts": status_counts(tasks),
            "minConfidence": args.min_confidence,
            "redisDepthBefore": redis_depth_before,
            "redisDepthAfter": redis_depth_after,
        },
        "reconciliation": reconciliation,
    }

    if not args.dry_run:
        write_json(report_json_path, report)
        report_md_path.parent.mkdir(parents=True, exist_ok=True)
        report_md_path.write_text(render_markdown_report(report), encoding="utf-8")

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print(json.dumps({"attempted": len(planned), "succeeded": dispatch_succeeded}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

#!/usr/bin/env python3
"""Drain Local Subdirector (tnf-cli-agent) review, direct, and specialty queues.

Consumes:
  - tnf:subdirector:review:pending
  - tnf:direct:sub-director:<alias>  (tnf-cli-agent, tnf-local-subdirector, sub-director)
  - tnf:master:tasks:analytics
  - tnf:master:tasks:maintenance
  - specialty lanes still stranded on tnf:master:tasks:pending

Local watchdog / specialty tenant loops are acknowledged deterministically
(no model required).

Artifacts: ~/.tnf/sub-director/run-artifacts/subdirector-ack-<id>.json
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

ART_DIR = Path(os.path.expanduser("~/.tnf/sub-director/run-artifacts"))
ART_DIR.mkdir(parents=True, exist_ok=True)

REVIEW_QUEUE = os.environ.get(
    "TNF_SUBDIRECTOR_REVIEW_QUEUE", "tnf:subdirector:review:pending"
)
PENDING_QUEUE = "tnf:master:tasks:pending"
SPECIALTY_QUEUES = [
    "tnf:master:tasks:analytics",
    "tnf:master:tasks:maintenance",
]
SPECIALTY_LANES = {"analytics", "maintenance"}
DEFAULT_ALIASES = [
    "tnf-cli-agent",
    "tnf-local-subdirector",
    "sub-director",
]


def redis(*args: str, timeout: float = 8.0) -> str:
    p = subprocess.run(
        ["redis-cli", "-p", "6379", *args],
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    return (p.stdout or "").strip()


def aliases_from_env() -> list[str]:
    raw = os.environ.get("TNF_LOCAL_SUBDIRECTOR_ALIASES", "")
    primary = (
        os.environ.get("TNF_LOCAL_SUBDIRECTOR_AGENT_ID")
        or os.environ.get("TNF_AGENT_ID")
        or "tnf-cli-agent"
    )
    parts = [primary, *DEFAULT_ALIASES]
    if raw:
        parts.extend(x.strip() for x in raw.split(",") if x.strip())
    seen = set()
    out = []
    for a in parts:
        if a not in seen:
            seen.add(a)
            out.append(a)
    return out


def write_artifact(name: str, body: dict) -> Path:
    path = ART_DIR / f"{name}.json"
    path.write_text(json.dumps(body, indent=2, default=str))
    return path


def brpoplpush(src: str, dest: str, block_sec: int = 1) -> str | None:
    if block_sec <= 0:
        out = redis("RPOPLPUSH", src, dest, timeout=3)
        return out or None
    out = redis("BRPOPLPUSH", src, dest, str(block_sec), timeout=block_sec + 3)
    return out or None


def lrem(key: str, value: str) -> None:
    redis("LREM", key, "1", value)


def acknowledge_payload(raw: str, source_queue: str) -> dict:
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as e:
        art = write_artifact(
            f"subdirector-ack-parse-err-{int(time.time())}",
            {
                "schema": "tnf.local_subdirector.ack/0.1",
                "outcome": "error",
                "error": f"json: {e}",
                "source_queue": source_queue,
                "completed_at": now,
            },
        )
        return {"outcome": "error", "artifact": str(art)}

    # Review-queue shape
    if "reviewAuthority" in payload or "localSubdirectorAgentId" in payload:
        task = payload.get("task") or {}
        ack_id = f"review-{task.get('id') or int(time.time())}"
        body = {
            "schema": "tnf.local_subdirector.ack/0.1",
            "ack_id": ack_id,
            "outcome": "acknowledged",
            "kind": "subdirector_review_queue",
            "reviewAuthority": payload.get("reviewAuthority"),
            "localSubdirectorAgentId": payload.get("localSubdirectorAgentId")
            or "tnf-cli-agent",
            "reason": payload.get("reason"),
            "riskLevel": payload.get("riskLevel"),
            "originalTaskId": task.get("id"),
            "processId": task.get("processId")
            or (task.get("metadata") or {}).get("scheduledProcessId"),
            "title": task.get("title"),
            "source_queue": source_queue,
            "brokerId": payload.get("brokerId"),
            "completed_at": now,
            "action": (
                "Local Subdirector (tnf-cli-agent) acknowledged critical local "
                "watchdog/tenant report. No Super Director escalation."
            ),
        }
        art = write_artifact(f"subdirector-ack-{ack_id}", body)
        body["artifact"] = str(art)
        return body

    # WorkerEnvelope
    if payload.get("type") == "task" and isinstance(payload.get("payload"), dict):
        env_id = ((payload.get("payload") or {}).get("id")) or f"env-{int(time.time())}"
        inner = ((payload.get("payload") or {}).get("payload") or {})
        meta = inner.get("metadata") or {}
        task = inner.get("task") or {}
        report_kind = meta.get("reportKind")
        body = {
            "schema": "tnf.local_subdirector.ack/0.1",
            "ack_id": env_id,
            "envelope_id": env_id,
            "outcome": "acknowledged",
            "kind": report_kind or "direct_envelope",
            "localSubdirectorAgentId": ((payload.get("payload") or {}).get("to") or {}).get(
                "agentId"
            )
            or "tnf-cli-agent",
            "originalTaskId": meta.get("originalTaskId"),
            "processId": meta.get("processId"),
            "title": task.get("title"),
            "source_queue": source_queue,
            "completed_at": now,
            "action": (
                "Local Subdirector drained direct-queue report and recorded receipt."
                if report_kind == "local_subdirector_review"
                else "Local Subdirector drained direct-queue envelope and recorded receipt."
            ),
        }
        art = write_artifact(f"subdirector-ack-{env_id}", body)
        body["artifact"] = str(art)
        return body

    # Raw chronological QueueTask (analytics / maintenance / pending specialty)
    lane = str(((payload.get("itinerary") or {}).get("lane") or "")).lower()
    task_id = payload.get("id") or f"task-{int(time.time())}"
    body = {
        "schema": "tnf.local_subdirector.ack/0.1",
        "ack_id": f"specialty-{task_id}",
        "outcome": "acknowledged",
        "kind": f"specialty_{lane or 'task'}",
        "localSubdirectorAgentId": "tnf-cli-agent",
        "originalTaskId": task_id,
        "processId": payload.get("processId")
        or (payload.get("metadata") or {}).get("scheduledProcessId"),
        "title": payload.get("title"),
        "lane": lane or None,
        "priority": payload.get("priority"),
        "source_queue": source_queue,
        "completed_at": now,
        "action": (
            "Local Subdirector drained specialty tenant loop and recorded receipt "
            f"(lane={lane or 'unknown'})."
        ),
    }
    art = write_artifact(f"subdirector-ack-specialty-{task_id}", body)
    body["artifact"] = str(art)
    return body


def drain_queue(queue: str, max_items: int, block_sec: int = 1) -> list[dict]:
    processing = f"{queue}:processing"
    results = []
    for _ in range(max_items):
        raw = brpoplpush(queue, processing, block_sec=block_sec)
        if not raw:
            break
        try:
            result = acknowledge_payload(raw, queue)
            results.append(result)
        finally:
            lrem(processing, raw)
    return results


def purge_specialty_from_pending(max_items: int = 200) -> list[dict]:
    """Remove analytics/maintenance copies stranded on pending (dual-write residue)."""
    try:
        import redis as redis_py

        r = redis_py.Redis(decode_responses=True)
        items = r.lrange(PENDING_QUEUE, 0, -1)
        keep: list[str] = []
        results: list[dict] = []
        for raw in items:
            try:
                task = json.loads(raw)
            except json.JSONDecodeError:
                keep.append(raw)
                continue
            lane = str(((task.get("itinerary") or {}).get("lane") or "")).lower()
            if lane in SPECIALTY_LANES and len(results) < max_items:
                results.append(acknowledge_payload(raw, PENDING_QUEUE))
            else:
                keep.append(raw)
        pipe = r.pipeline()
        pipe.delete(PENDING_QUEUE)
        if keep:
            pipe.rpush(PENDING_QUEUE, *keep)
        pipe.execute()
        return results
    except Exception as e:
        return [
            {
                "outcome": "error",
                "error": f"pending specialty purge failed: {e}",
            }
        ]


def register_heartbeat(agent_id: str) -> None:
    now = time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())
    record = {
        "id": agent_id,
        "name": "tnf-cli-agent",
        "role": "orchestrator",
        "daccRole": "director",
        "embodiment": "sub-director",
        "platform": "tnf",
        "status": "active",
        "isOnline": True,
        "capabilities": [
            "local_subdirector",
            "lane_coordination",
            "watchdog_review",
            "tenant_loop_governance",
            "analytics_review",
            "maintenance_review",
        ],
        "registeredAt": now,
        "lastSeen": now,
        "aliases": DEFAULT_ALIASES,
        "source": "local-subdirector-drain",
        "subdirector_authorized": True,
    }
    redis("HSET", "tnf:agent-registry", agent_id, json.dumps(record))


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--max-per-queue", type=int, default=20)
    ap.add_argument("--block-sec", type=int, default=1)
    ap.add_argument("--skip-register", action="store_true")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)

    agent_id = (
        os.environ.get("TNF_LOCAL_SUBDIRECTOR_AGENT_ID")
        or os.environ.get("TNF_AGENT_ID")
        or "tnf-cli-agent"
    )
    if not args.skip_register:
        register_heartbeat(agent_id)

    drained = {
        "schema": "tnf.local_subdirector.drain/0.1",
        "agent_id": agent_id,
        "completed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "review": [],
        "direct": {},
        "specialty": {},
        "pending_specialty_purged": [],
        "totals": {
            "review": 0,
            "direct": 0,
            "specialty": 0,
            "pending_specialty_purged": 0,
        },
    }

    review_results = drain_queue(REVIEW_QUEUE, args.max_per_queue, args.block_sec)
    drained["review"] = review_results
    drained["totals"]["review"] = len(review_results)

    for alias in aliases_from_env():
        q = f"tnf:direct:sub-director:{alias}"
        items = drain_queue(
            q,
            args.max_per_queue,
            block_sec=0 if drained["totals"]["direct"] else args.block_sec,
        )
        if items:
            drained["direct"][alias] = items
            drained["totals"]["direct"] += len(items)

    for q in SPECIALTY_QUEUES:
        items = drain_queue(q, args.max_per_queue, block_sec=0)
        if items:
            drained["specialty"][q] = items
            drained["totals"]["specialty"] += len(items)

    purged = purge_specialty_from_pending(args.max_per_queue)
    drained["pending_specialty_purged"] = purged
    drained["totals"]["pending_specialty_purged"] = len(
        [x for x in purged if x.get("outcome") == "acknowledged"]
    )

    if args.json:
        print(json.dumps(drained, indent=2, default=str))
    else:
        print(
            json.dumps(
                {
                    "ok": True,
                    "agent_id": agent_id,
                    "review_drained": drained["totals"]["review"],
                    "direct_drained": drained["totals"]["direct"],
                    "specialty_drained": drained["totals"]["specialty"],
                    "pending_specialty_purged": drained["totals"]["pending_specialty_purged"],
                },
                indent=2,
            )
        )
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

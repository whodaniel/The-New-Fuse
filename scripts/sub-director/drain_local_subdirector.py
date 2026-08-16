#!/usr/bin/env python3
"""Drain Local Subdirector (tnf-cli-agent) review + direct queues.

Consumes:
  - tnf:subdirector:review:pending
  - tnf:direct:sub-director:<alias>  (tnf-cli-agent, tnf-local-subdirector, sub-director)

Local watchdog / local_subdirector_review envelopes are acknowledged deterministically
(no model required). Other envelopes optionally invoke run_one_envelope.py.

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
DEFAULT_ALIASES = [
    "tnf-cli-agent",
    "tnf-local-subdirector",
    "sub-director",
]
REPO_RUN_ONE = Path(__file__).resolve().parent / "run_one_envelope.py"
HOME_RUN_ONE = Path(os.path.expanduser("~/.tnf/sub-director/run_one_envelope.py"))


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
    # preserve order, unique
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


def acknowledge_review(raw: str, source_queue: str) -> dict:
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as e:
        art = write_artifact(f"subdirector-ack-parse-err-{int(time.time())}", {
            "schema": "tnf.local_subdirector.ack/0.1",
            "outcome": "error",
            "error": f"json: {e}",
            "source_queue": source_queue,
            "completed_at": now,
        })
        return {"outcome": "error", "artifact": str(art)}

    # Review-queue shape vs WorkerEnvelope shape
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
    env_id = (
        ((payload.get("payload") or {}).get("id"))
        or f"env-{int(time.time())}"
    )
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


def drain_queue(queue: str, max_items: int, block_sec: int = 1) -> list[dict]:
    processing = f"{queue}:processing"
    results = []
    for _ in range(max_items):
        raw = brpoplpush(queue, processing, block_sec=block_sec)
        if not raw:
            break
        try:
            result = acknowledge_review(raw, queue)
            results.append(result)
        finally:
            lrem(processing, raw)
    return results


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
        "totals": {"review": 0, "direct": 0},
    }

    review_results = drain_queue(REVIEW_QUEUE, args.max_per_queue, args.block_sec)
    drained["review"] = review_results
    drained["totals"]["review"] = len(review_results)

    for alias in aliases_from_env():
        q = f"tnf:direct:sub-director:{alias}"
        # Only block on the first non-empty attempt across aliases to keep cycle fast
        items = drain_queue(q, args.max_per_queue, block_sec=0 if drained["totals"]["direct"] else args.block_sec)
        if items:
            drained["direct"][alias] = items
            drained["totals"]["direct"] += len(items)

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
                    "queues_touched": {
                        "review": REVIEW_QUEUE,
                        "direct": list(drained["direct"].keys()),
                    },
                },
                indent=2,
            )
        )
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

#!/usr/bin/env python3
"""
TNF Task Pusher — Push findings from cron jobs and agents to the task queue.

Usage:
  python3 tnf-task-pusher.py --type bug --title "Auth endpoint 404" --description "/api/auth/login returns 404" --source routing-fixer --priority high
  python3 tnf-task-pusher.py --type improvement --title "Add pricing page" --description "/docs/features/pricing is missing" --source content-audit --priority medium
  python3 tnf-task-pusher.py --stdin < findings.json  # Read JSON from stdin

The task gets pushed to tnf:master:tasks:realtime (Redis list)
where the persistent daemon (brpop) will consume it.
"""

import argparse
import json
import os
import sys
import uuid
from datetime import datetime, timezone

try:
    import redis as redis_py
except ImportError:
    print("FATAL: 'redis' package required")
    sys.exit(1)

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
REDIS_DB = int(os.environ.get("REDIS_DB", "0"))

KEY_TASK_QUEUE = "tnf:master:tasks:realtime"
KEY_TASK_INDEX = "tnf:master:tasks:index"

VALID_TYPES = ["bug", "improvement", "task", "alert", "health", "feature"]
VALID_PRIORITIES = ["critical", "high", "medium", "low"]


def push_task(task: dict) -> str:
    r = redis_py.Redis.from_url(REDIS_URL, db=REDIS_DB, decode_responses=True)
    r.ping()

    task_id = task.setdefault("id", f"task-{uuid.uuid4().hex[:12]}")
    task["createdAt"] = datetime.now(timezone.utc).isoformat()
    task["status"] = "pending"
    task["assignedTo"] = task.get("assignedTo", "agent:tnf-core")

    # Broker Agent requires itinerary.lane for dispatch governance.
    # Without it, broker escalates everything to Director (no dispatch).
    # Valid lanes: realtime_broker_routing, relay_federation, redis_sync,
    #   tauri_sync, directive, or any custom lane.
    # Default: realtime_broker_routing (direct broker dispatch).
    if "itinerary" not in task:
        task["itinerary"] = {}
    task["itinerary"].setdefault("lane", "realtime_broker_routing")

    # Broker federation gate checks require tenant scope.
    # Without tenant, all gate checks fail and task is escalated/rejected.
    if "tenant" not in task:
        task["tenant"] = {"scope": "tnf-core", "id": "default"}
    if "trace" not in task:
        task["trace"] = {"continuity": True, "origin": task.get("source", "unknown")}

    # Push to queue
    r.rpush(KEY_TASK_QUEUE, json.dumps(task))

    # Index for tracking
    r.hset(KEY_TASK_INDEX, task_id, json.dumps({
        "id": task_id,
        "title": task.get("title", ""),
        "type": task.get("type", "task"),
        "priority": task.get("priority", "medium"),
        "status": "pending",
        "source": task.get("source", "unknown"),
        "createdAt": task["createdAt"],
    }))

    return task_id


def main():
    parser = argparse.ArgumentParser(description="Push tasks to TNF daemon queue")
    parser.add_argument("--type", choices=VALID_TYPES, default="task", help="Task type")
    parser.add_argument("--title", required=False, help="Task title")
    parser.add_argument("--description", default="", help="Task description")
    parser.add_argument("--source", default="cron", help="Source agent/job name")
    parser.add_argument("--priority", choices=VALID_PRIORITIES, default="medium")
    parser.add_argument("--assign-to", default="agent:tnf-core", help="Target agent")
    parser.add_argument("--data", default="{}", help="Extra JSON data")
    parser.add_argument("--stdin", action="store_true", help="Read task JSON from stdin")
    parser.add_argument("--count", action="store_true", help="Show pending task count")
    args = parser.parse_args()

    if args.count:
        r = redis_py.Redis.from_url(REDIS_URL, db=REDIS_DB, decode_responses=True)
        count = r.llen(KEY_TASK_QUEUE)
        indexed = r.hlen(KEY_TASK_INDEX) if r.exists(KEY_TASK_INDEX) else 0
        print(f"Pending in queue: {count}")
        print(f"Total indexed: {indexed}")
        return

    if args.stdin:
        task = json.loads(sys.stdin.read())
    else:
        if not args.title:
            parser.error("--title is required (unless using --stdin)")
        try:
            extra = json.loads(args.data)
        except json.JSONDecodeError:
            extra = {}

        task = {
            "title": args.title,
            "description": args.description,
            "type": args.type,
            "priority": args.priority,
            "source": args.source,
            "assignedTo": args.assign_to,
            **extra,
        }

    task_id = push_task(task)
    print(f"Pushed task {task_id}: {task.get('title', 'untitled')}")
    print(f"  Type: {task.get('type')} | Priority: {task.get('priority')} | Source: {task.get('source')}")


if __name__ == "__main__":
    main()

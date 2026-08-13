#!/usr/bin/env python3
"""Compute ready tasks from dispatch manifest and task status."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List


def _load_json(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _status_map(status_payload: Dict[str, Any]) -> Dict[str, str]:
    tasks = status_payload.get("tasks", [])
    out: Dict[str, str] = {}
    for t in tasks:
        tid = t.get("id")
        status = t.get("status", "pending")
        if isinstance(tid, str):
            out[tid] = status
    return out


def _ready_tasks(manifest: Dict[str, Any], statuses: Dict[str, str]) -> List[Dict[str, Any]]:
    ready: List[Dict[str, Any]] = []
    for task in manifest.get("tasks", []):
        tid = task.get("id")
        if not isinstance(tid, str):
            continue
        if statuses.get(tid, "pending") != "pending":
            continue
        deps = task.get("depends_on", [])
        if all(statuses.get(dep) == "done" for dep in deps):
            ready.append(task)
    return ready


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", required=True, help="Path to agent_dispatch_manifest.json")
    parser.add_argument("--status", required=True, help="Path to task_status.json")
    parser.add_argument("--out", required=True, help="Path to write ready_tasks.json")
    args = parser.parse_args()

    manifest = _load_json(Path(args.manifest))
    status_payload = _load_json(Path(args.status))
    statuses = _status_map(status_payload)
    ready = _ready_tasks(manifest, statuses)

    out_payload = {
        "project": manifest.get("project", "unknown"),
        "ready_count": len(ready),
        "ready_tasks": ready,
    }
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out_payload, indent=2) + "\n", encoding="utf-8")
    print(str(out_path))


if __name__ == "__main__":
    main()

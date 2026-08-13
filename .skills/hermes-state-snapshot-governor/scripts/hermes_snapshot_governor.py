#!/usr/bin/env python3
"""Hermes state snapshot audit + pruning governor.

Implements a deterministic Inspect -> Act -> Verify loop for
`~/.hermes/state-snapshots`:
- audit: build consolidated JSON + Markdown with stale classification
- prune: compute safe deletion candidates from verified state
  (stale snapshots and/or intermediate snapshots inside model epochs)
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sqlite3
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple

import yaml

SNAPSHOT_SUFFIX = "-pre-update"
DEFAULT_ROOT = Path.home() / ".hermes" / "state-snapshots"
KEY_FILES = [
    "config.yaml",
    ".env",
    "auth.json",
    "gateway_state.json",
    "channel_directory.json",
    "processes.json",
    "cron/jobs.json",
    "manifest.json",
    "state.db",
]


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def stamp() -> str:
    return datetime.now().strftime("%Y-%m-%d")


def md5sum(path: Path) -> Optional[str]:
    if not path.exists() or not path.is_file():
        return None
    h = hashlib.md5()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def read_json(path: Path) -> Optional[Dict[str, Any]]:
    if not path.exists():
        return None
    try:
        obj = json.loads(path.read_text())
        return obj if isinstance(obj, dict) else None
    except Exception:
        return None


def read_yaml(path: Path) -> Optional[Dict[str, Any]]:
    if not path.exists():
        return None
    try:
        obj = yaml.safe_load(path.read_text())
        return obj if isinstance(obj, dict) else None
    except Exception:
        return None


def parse_env(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {"exists": False, "key_count": 0, "keys": []}
    keys: List[str] = []
    for raw in path.read_text(errors="replace").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key = line.split("=", 1)[0].strip()
        if key:
            keys.append(key)
    return {"exists": True, "key_count": len(keys), "keys": sorted(set(keys))}


def file_info(snapshot_dir: Path) -> Dict[str, Dict[str, Any]]:
    out: Dict[str, Dict[str, Any]] = {}
    for rel in KEY_FILES:
        p = snapshot_dir / rel
        exists = p.exists()
        out[rel] = {
            "exists": exists,
            "size": p.stat().st_size if exists else None,
            "md5": md5sum(p) if exists else None,
        }
    return out


def config_summary(config_path: Path) -> Dict[str, Any]:
    cfg = read_yaml(config_path)
    if not cfg:
        return {"exists": False}

    model = cfg.get("model") if isinstance(cfg.get("model"), dict) else {}
    agent = cfg.get("agent") if isinstance(cfg.get("agent"), dict) else {}
    updates = cfg.get("updates") if isinstance(cfg.get("updates"), dict) else {}
    memory = cfg.get("memory") if isinstance(cfg.get("memory"), dict) else {}

    raw_toolsets = cfg.get("toolsets")
    if isinstance(raw_toolsets, list):
        toolsets = [str(x) for x in raw_toolsets]
    elif isinstance(raw_toolsets, dict):
        toolsets = sorted(str(k) for k in raw_toolsets)
    else:
        toolsets = []

    terminal = cfg.get("terminal") if isinstance(cfg.get("terminal"), dict) else {}

    return {
        "exists": True,
        "config_version": cfg.get("_config_version"),
        "model_default": model.get("default"),
        "model_provider": model.get("provider"),
        "agent_max_turns": agent.get("max_turns"),
        "toolsets": toolsets,
        "toolsets_count": len(toolsets),
        "terminal_cwd": terminal.get("cwd"),
        "updates_pre_update_backup": updates.get("pre_update_backup"),
        "memory_provider": memory.get("provider"),
    }


def auth_summary(path: Path) -> Dict[str, Any]:
    auth = read_json(path)
    if not auth:
        return {"exists": False}

    selected = auth.get("selected_credential_ids") or {}
    pool = auth.get("credential_pool") or {}

    providers: Dict[str, Any] = {}
    for provider, creds in pool.items():
        if not isinstance(creds, list):
            continue
        status_counts = Counter()
        for cred in creds:
            if isinstance(cred, dict):
                status_counts[str(cred.get("last_status") or "unset")] += 1
        providers[str(provider)] = {
            "credential_count": len(creds),
            "status_counts": dict(status_counts),
            "selected_credential_id": selected.get(provider),
        }

    return {
        "exists": True,
        "updated_at": auth.get("updated_at"),
        "active_provider": auth.get("active_provider"),
        "provider_count": len(providers),
        "providers": providers,
    }


def gateway_summary(path: Path) -> Dict[str, Any]:
    gateway = read_json(path)
    if not gateway:
        return {"exists": False}

    platform_states = Counter()
    plats = gateway.get("platforms") if isinstance(gateway.get("platforms"), dict) else {}
    for payload in plats.values():
        if isinstance(payload, dict):
            platform_states[str(payload.get("state") or "unknown")] += 1

    return {
        "exists": True,
        "gateway_state": gateway.get("gateway_state"),
        "active_agents": gateway.get("active_agents"),
        "updated_at": gateway.get("updated_at"),
        "platform_state_counts": dict(platform_states),
    }


def channel_summary(path: Path) -> Dict[str, Any]:
    directory = read_json(path)
    if not directory:
        return {"exists": False}

    plats = directory.get("platforms") if isinstance(directory.get("platforms"), dict) else {}
    counts: Dict[str, int] = {}
    total = 0
    for name, rows in plats.items():
        if isinstance(rows, list):
            counts[str(name)] = len(rows)
            total += len(rows)

    return {
        "exists": True,
        "updated_at": directory.get("updated_at"),
        "total_channels": total,
        "non_empty_platforms": {k: v for k, v in counts.items() if v > 0},
    }


def cron_summary(path: Path) -> Dict[str, Any]:
    cron = read_json(path)
    if not cron:
        return {"exists": False}

    jobs = cron.get("jobs")
    if not isinstance(jobs, list):
        return {"exists": True, "job_count": 0}

    status_counts = Counter()
    enabled = 0
    errored: List[str] = []
    for job in jobs:
        if not isinstance(job, dict):
            continue
        if job.get("enabled") is True:
            enabled += 1
        status = str(job.get("last_status") or "unknown")
        status_counts[status] += 1
        if status == "error":
            errored.append(str(job.get("name") or job.get("id") or "<unnamed>"))

    return {
        "exists": True,
        "job_count": len(jobs),
        "enabled_count": enabled,
        "disabled_count": len(jobs) - enabled,
        "status_counts": dict(status_counts),
        "errored_jobs": sorted(errored),
    }


def db_summary(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {"exists": False, "health": "missing"}
    size = path.stat().st_size
    if size == 0:
        return {"exists": True, "size": size, "health": "empty"}

    out: Dict[str, Any] = {"exists": True, "size": size}
    try:
        conn = sqlite3.connect(str(path))
        cur = conn.cursor()

        quick = cur.execute("PRAGMA quick_check;").fetchone()
        quick_result = quick[0] if quick else "unknown"

        tables = {row[0] for row in cur.execute("SELECT name FROM sqlite_master WHERE type='table';")}
        out["tables"] = sorted(tables)

        if "sessions" not in tables or "messages" not in tables:
            out["health"] = "invalid_schema"
            conn.close()
            return out

        sessions = int(cur.execute("SELECT count(*) FROM sessions;").fetchone()[0])
        messages = int(cur.execute("SELECT count(*) FROM messages;").fetchone()[0])

        session_range = cur.execute(
            "SELECT datetime(min(started_at),'unixepoch'), datetime(max(started_at),'unixepoch') FROM sessions;"
        ).fetchone()
        message_range = cur.execute(
            "SELECT datetime(min(timestamp),'unixepoch'), datetime(max(timestamp),'unixepoch') FROM messages;"
        ).fetchone()

        out.update(
            {
                "health": "ok" if quick_result == "ok" else f"quick_check:{quick_result}",
                "sessions": sessions,
                "messages": messages,
                "sessions_time_range_utc": list(session_range) if session_range else None,
                "messages_time_range_utc": list(message_range) if message_range else None,
            }
        )
        conn.close()
        return out
    except Exception as exc:  # pragma: no cover - defensive
        out["health"] = "error"
        out["error"] = str(exc)
        return out


def non_db_signature(files: Dict[str, Dict[str, Any]]) -> Tuple[str, ...]:
    keys = [
        "config.yaml",
        ".env",
        "auth.json",
        "gateway_state.json",
        "channel_directory.json",
        "processes.json",
        "cron/jobs.json",
    ]
    return tuple((files.get(k) or {}).get("md5") or "-" for k in keys)


def snapshot_dirs(root: Path) -> List[Path]:
    return sorted([p for p in root.iterdir() if p.is_dir() and p.name.endswith(SNAPSHOT_SUFFIX)], key=lambda p: p.name)


def build_records(root: Path) -> List[Dict[str, Any]]:
    records: List[Dict[str, Any]] = []
    for snap in snapshot_dirs(root):
        files = file_info(snap)
        records.append(
            {
                "snapshot": snap.name,
                "manifest": read_json(snap / "manifest.json"),
                "files": files,
                "config": config_summary(snap / "config.yaml"),
                "env": parse_env(snap / ".env"),
                "auth": auth_summary(snap / "auth.json"),
                "gateway": gateway_summary(snap / "gateway_state.json"),
                "channels": channel_summary(snap / "channel_directory.json"),
                "cron": cron_summary(snap / "cron/jobs.json"),
                "state_db": db_summary(snap / "state.db"),
                "stale_reasons": [],
            }
        )

    prev_sig: Optional[Tuple[str, ...]] = None
    for rec in records:
        stale_reasons: List[str] = []
        db_health = str((rec.get("state_db") or {}).get("health"))
        if db_health in {"missing", "empty", "invalid_schema", "error"}:
            stale_reasons.append(f"state.db:{db_health}")

        sig = non_db_signature(rec["files"])
        if prev_sig is not None and sig == prev_sig:
            stale_reasons.append("duplicate_non_db_metadata")
        prev_sig = sig
        rec["stale_reasons"] = stale_reasons

    return records


def model_changes(records: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
    changes: List[Dict[str, Any]] = []
    prev: Tuple[Optional[str], Optional[str]] = (None, None)
    for rec in records:
        cfg = rec.get("config") or {}
        cur = (cfg.get("model_default"), cfg.get("model_provider"))
        if cur != prev:
            changes.append(
                {
                    "snapshot": rec["snapshot"],
                    "model_default": cur[0],
                    "model_provider": cur[1],
                }
            )
            prev = cur
    return changes


def latest_valid_snapshot(records: Sequence[Dict[str, Any]]) -> Optional[str]:
    for rec in reversed(records):
        if (rec.get("state_db") or {}).get("health") == "ok":
            return str(rec["snapshot"])
    return None


def build_index(root: Path, records: Sequence[Dict[str, Any]]) -> Dict[str, Any]:
    return {
        "generated_at_utc": utc_now_iso(),
        "snapshot_root": str(root),
        "snapshot_count": len(records),
        "model_changes": model_changes(records),
        "latest_valid_state_db_snapshot": latest_valid_snapshot(records),
        "records": list(records),
    }


def markdown_report(index: Dict[str, Any]) -> str:
    records = index.get("records") or []
    latest = index.get("latest_valid_state_db_snapshot")
    latest_rec = next((r for r in records if r.get("snapshot") == latest), None)
    stale = [r for r in records if r.get("stale_reasons")]

    lines: List[str] = []
    lines.append("# Hermes State Snapshot Consolidation")
    lines.append("")
    lines.append(f"- Snapshot root: `{index.get('snapshot_root')}`")
    lines.append(f"- Snapshots analyzed: **{index.get('snapshot_count')}**")
    lines.append(f"- Generated (UTC): `{index.get('generated_at_utc')}`")
    lines.append("")

    lines.append("## Consolidated Current State")
    if latest_rec:
        cfg = latest_rec.get("config") or {}
        db = latest_rec.get("state_db") or {}
        auth = latest_rec.get("auth") or {}
        channels = latest_rec.get("channels") or {}
        cron = latest_rec.get("cron") or {}
        gateway = latest_rec.get("gateway") or {}

        lines.append(f"- Anchor snapshot: `{latest}`")
        lines.append(f"- Config version: `{cfg.get('config_version')}`")
        lines.append(f"- Model/provider: `{cfg.get('model_default')}` / `{cfg.get('model_provider')}`")
        lines.append(f"- Agent max turns: `{cfg.get('agent_max_turns')}`")
        lines.append(f"- Sessions/messages: `{db.get('sessions')}` / `{db.get('messages')}`")
        msg_range = db.get("messages_time_range_utc") or ["?", "?"]
        lines.append(f"- Message time range (UTC): `{msg_range[0]}` -> `{msg_range[1]}`")
        lines.append(f"- Active auth provider: `{auth.get('active_provider')}`")
        lines.append(f"- Credential pools tracked: `{auth.get('provider_count')}`")
        lines.append(f"- Channels indexed: `{channels.get('total_channels')}`")
        lines.append(f"- Cron jobs: `{cron.get('job_count')}` total, `{cron.get('enabled_count')}` enabled")
        lines.append(
            f"- Gateway state: `{gateway.get('gateway_state')}` with platform states `{gateway.get('platform_state_counts')}`"
        )
    else:
        lines.append("- No valid `state.db` snapshot is available.")
    lines.append("")

    lines.append("## Snapshot Health Classification")
    lines.append(f"- Healthy snapshots: **{len(records) - len(stale)}**")
    lines.append(f"- Stale snapshots: **{len(stale)}**")
    lines.append("")
    if stale:
        lines.append("### Stale Entries")
        for rec in stale:
            lines.append(f"- `{rec['snapshot']}`: {', '.join(rec['stale_reasons'])}")
        lines.append("")

    lines.append("## Model Timeline (de-duplicated)")
    for change in index.get("model_changes") or []:
        lines.append(
            f"- `{change.get('snapshot')}`: `{change.get('model_default')}` via `{change.get('model_provider')}`"
        )
    lines.append("")

    lines.append("## State DB Growth Timeline")
    for rec in records:
        db = rec.get("state_db") or {}
        if db.get("health") == "ok":
            lines.append(
                f"- `{rec['snapshot']}`: {db.get('sessions')} sessions, {db.get('messages')} messages, {db.get('size')} bytes"
            )
    lines.append("")

    lines.append("## Notes")
    if stale:
        for rec in stale:
            lines.append(f"- `{rec['snapshot']}` flagged stale for: {', '.join(rec['stale_reasons'])}.")
    else:
        lines.append("- No stale snapshots detected in the current on-disk set.")

    return "\n".join(lines) + "\n"


def write_audit_artifacts(root: Path, records: Sequence[Dict[str, Any]], date_stamp: str) -> Tuple[Path, Path, Dict[str, Any]]:
    index = build_index(root, records)
    json_path = root / f"consolidated-index-{date_stamp}.json"
    md_path = root / f"consolidated-report-{date_stamp}.md"
    json_path.write_text(json.dumps(index, indent=2) + "\n")
    md_path.write_text(markdown_report(index))
    return json_path, md_path, index


def compute_epoch_intermediate_candidates(records: Sequence[Dict[str, Any]]) -> List[str]:
    valid = [r for r in records if (r.get("state_db") or {}).get("health") == "ok"]
    if not valid:
        return []

    epochs: List[List[Dict[str, Any]]] = []
    current: List[Dict[str, Any]] = []
    for rec in valid:
        key = ((rec.get("config") or {}).get("model_default"), (rec.get("config") or {}).get("model_provider"))
        if not current:
            current = [rec]
            continue
        prev = (
            (current[-1].get("config") or {}).get("model_default"),
            (current[-1].get("config") or {}).get("model_provider"),
        )
        if key == prev:
            current.append(rec)
        else:
            epochs.append(current)
            current = [rec]
    if current:
        epochs.append(current)

    candidates: List[str] = []
    for epoch in epochs:
        if len(epoch) <= 2:
            continue

        # Verify monotonic growth to avoid deleting weird forks.
        first = epoch[0].get("state_db") or {}
        last = epoch[-1].get("state_db") or {}
        fs, ls = first.get("sessions"), last.get("sessions")
        fm, lm = first.get("messages"), last.get("messages")
        monotonic = (
            isinstance(fs, int)
            and isinstance(ls, int)
            and ls >= fs
            and isinstance(fm, int)
            and isinstance(lm, int)
            and lm >= fm
        )
        if not monotonic:
            continue

        for mid in epoch[1:-1]:
            candidates.append(str(mid["snapshot"]))
    return candidates


def compute_prune_plan(records: Sequence[Dict[str, Any]], include_stale: bool, include_epoch_intermediate: bool) -> Dict[str, Any]:
    stale_candidates = [str(r["snapshot"]) for r in records if r.get("stale_reasons")] if include_stale else []
    epoch_candidates = compute_epoch_intermediate_candidates(records) if include_epoch_intermediate else []

    delete_set = sorted(set(stale_candidates + epoch_candidates))
    latest_valid = latest_valid_snapshot(records)
    if latest_valid and latest_valid in delete_set:
        delete_set.remove(latest_valid)

    rec_by_name = {str(r["snapshot"]): r for r in records}
    delete_rows: List[Dict[str, Any]] = []
    for snap in delete_set:
        rec = rec_by_name.get(snap, {})
        delete_rows.append(
            {
                "snapshot": snap,
                "state_db_size": (rec.get("state_db") or {}).get("size"),
                "state_db_health": (rec.get("state_db") or {}).get("health"),
                "stale_reasons": rec.get("stale_reasons") or [],
                "model_default": (rec.get("config") or {}).get("model_default"),
                "model_provider": (rec.get("config") or {}).get("model_provider"),
            }
        )

    reclaim_bytes = sum(int(r.get("state_db_size") or 0) for r in delete_rows)
    return {
        "generated_at_utc": utc_now_iso(),
        "latest_valid_state_db_snapshot": latest_valid,
        "include_stale": include_stale,
        "include_epoch_intermediate": include_epoch_intermediate,
        "delete_count": len(delete_rows),
        "reclaim_bytes_state_db_only": reclaim_bytes,
        "delete": delete_rows,
    }


def apply_prune(root: Path, plan: Dict[str, Any]) -> Dict[str, Any]:
    removed: List[str] = []
    missing: List[str] = []

    for row in plan.get("delete") or []:
        snap = str(row.get("snapshot"))
        path = root / snap
        if not path.exists():
            missing.append(snap)
            continue
        if not path.is_dir() or not snap.endswith(SNAPSHOT_SUFFIX):
            continue
        shutil.rmtree(path)
        removed.append(snap)

    return {
        "removed": removed,
        "missing": missing,
        "removed_count": len(removed),
        "missing_count": len(missing),
    }


def human_bytes(n: int) -> str:
    units = ["B", "KiB", "MiB", "GiB", "TiB"]
    val = float(max(n, 0))
    unit = 0
    while val >= 1024 and unit < len(units) - 1:
        val /= 1024.0
        unit += 1
    return f"{val:.2f} {units[unit]}"


def cmd_audit(args: argparse.Namespace) -> int:
    root = Path(args.root).expanduser().resolve()
    if not root.exists():
        print(f"error: snapshot root does not exist: {root}")
        return 2

    records = build_records(root)
    json_path, md_path, index = write_audit_artifacts(root, records, args.date or stamp())

    stale_count = sum(1 for r in records if r.get("stale_reasons"))
    print(f"snapshot_root={root}")
    print(f"snapshot_count={len(records)}")
    print(f"stale_count={stale_count}")
    print(f"latest_valid={index.get('latest_valid_state_db_snapshot')}")
    print(f"index={json_path}")
    print(f"report={md_path}")
    return 0


def cmd_prune(args: argparse.Namespace) -> int:
    root = Path(args.root).expanduser().resolve()
    if not root.exists():
        print(f"error: snapshot root does not exist: {root}")
        return 2

    # Inspect
    records = build_records(root)
    plan = compute_prune_plan(records, include_stale=args.include_stale, include_epoch_intermediate=args.include_epoch_intermediate)
    plan_path = root / f"prune-plan-{args.date or stamp()}.json"
    plan_path.write_text(json.dumps(plan, indent=2) + "\n")

    print(f"snapshot_root={root}")
    print(f"delete_count={plan['delete_count']}")
    print(f"reclaim_state_db_only={human_bytes(int(plan['reclaim_bytes_state_db_only']))}")
    print(f"latest_valid={plan.get('latest_valid_state_db_snapshot')}")
    print(f"plan={plan_path}")

    for row in plan.get("delete") or []:
        print(
            "candidate="
            f"{row.get('snapshot')} "
            f"health={row.get('state_db_health')} "
            f"model={row.get('model_default')} "
            f"provider={row.get('model_provider')} "
            f"stale={','.join(row.get('stale_reasons') or []) or '-'}"
        )

    if not args.apply:
        print("mode=dry-run")
        return 0

    # Act
    result = apply_prune(root, plan)
    print(f"mode=apply removed_count={result['removed_count']} missing_count={result['missing_count']}")

    # Verify
    after_records = build_records(root)
    json_path, md_path, index = write_audit_artifacts(root, after_records, args.date or stamp())
    stale_count = sum(1 for r in after_records if r.get("stale_reasons"))

    print(f"verify_snapshot_count={len(after_records)}")
    print(f"verify_stale_count={stale_count}")
    print(f"verify_latest_valid={index.get('latest_valid_state_db_snapshot')}")
    print(f"verify_index={json_path}")
    print(f"verify_report={md_path}")
    return 0


def parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Hermes state snapshot governance helper")
    sub = p.add_subparsers(dest="command", required=True)

    pa = sub.add_parser("audit", help="Generate consolidated snapshot report")
    pa.add_argument("--root", default=str(DEFAULT_ROOT), help="Path to state-snapshots directory")
    pa.add_argument("--date", default=None, help="Date suffix for report files (YYYY-MM-DD)")
    pa.set_defaults(func=cmd_audit)

    pp = sub.add_parser("prune", help="Plan/apply safe snapshot pruning")
    pp.add_argument("--root", default=str(DEFAULT_ROOT), help="Path to state-snapshots directory")
    pp.add_argument("--date", default=None, help="Date suffix for plan/report files (YYYY-MM-DD)")
    pp.add_argument(
        "--include-stale",
        action="store_true",
        default=False,
        help="Include stale snapshots (missing/empty/invalid/duplicate metadata)",
    )
    pp.add_argument(
        "--include-epoch-intermediate",
        action="store_true",
        default=False,
        help="Include intermediate snapshots inside contiguous model/provider epochs",
    )
    pp.add_argument("--apply", action="store_true", default=False, help="Delete candidates (otherwise dry-run)")
    pp.set_defaults(func=cmd_prune)

    return p


def main() -> int:
    args = parser().parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())

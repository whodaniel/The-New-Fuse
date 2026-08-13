#!/usr/bin/env python3
"""TNF multi-agent state governor.

Implements inspect -> act -> verify for stale snapshot/state artifacts across
multiple local agent homes.
"""

from __future__ import annotations

import argparse
import gzip
import json
import os
import shutil
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Sequence

import yaml


@dataclass
class KeepLatestRule:
    name: str
    path: Path
    glob: str
    keep: int


@dataclass
class OlderThanDaysRule:
    name: str
    path: Path
    glob: str
    days: int


@dataclass
class GzipRule:
    name: str
    file: Path
    days: int


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def stamp() -> str:
    return now_utc().strftime("%Y%m%dT%H%M%SZ")


def expand(p: str) -> Path:
    return Path(os.path.expanduser(p)).resolve()


def file_size(path: Path) -> int:
    try:
        return path.stat().st_size
    except FileNotFoundError:
        return 0


def dir_size(path: Path) -> int:
    if not path.exists() or not path.is_dir():
        return 0
    total = 0
    for root, _, files in os.walk(path):
        for name in files:
            fp = Path(root) / name
            try:
                total += fp.stat().st_size
            except FileNotFoundError:
                pass
    return total


def human(n: int) -> str:
    units = ["B", "KB", "MB", "GB", "TB"]
    value = float(n)
    idx = 0
    while value >= 1024 and idx < len(units) - 1:
        value /= 1024
        idx += 1
    return f"{value:.1f}{units[idx]}"


def file_age_minutes(path: Path, now: datetime) -> float | None:
    if not path.exists():
        return None
    age_seconds = now.timestamp() - path.stat().st_mtime
    return max(0.0, age_seconds / 60.0)


def json_generated_at_age_minutes(path: Path, now: datetime) -> float | None:
    if not path.exists():
        return None
    try:
        payload = json.loads(path.read_text())
    except Exception:
        return None
    if not isinstance(payload, dict):
        return None
    raw = payload.get("generatedAt") or payload.get("timestamp")
    if not isinstance(raw, str):
        return None
    try:
        ts = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except Exception:
        return None
    return max(0.0, (now - ts.astimezone(timezone.utc)).total_seconds() / 60.0)


def severity(age_minutes: float | None, warn_minutes: int, crit_minutes: int) -> str:
    if age_minutes is None:
        return "CRIT"
    if age_minutes >= crit_minutes:
        return "CRIT"
    if age_minutes >= warn_minutes:
        return "WARN"
    return "OK"


def protocol_check(
    *,
    name: str,
    path: Path,
    mode: str,
    warn_minutes: int,
    crit_minutes: int,
    now: datetime,
) -> Dict[str, Any]:
    if mode == "json-generatedAt":
        age = json_generated_at_age_minutes(path, now)
    else:
        age = file_age_minutes(path, now)
    return {
        "name": name,
        "path": str(path),
        "mode": mode,
        "exists": path.exists(),
        "age_minutes": None if age is None else round(age, 2),
        "severity": severity(age, warn_minutes, crit_minutes),
        "warn_minutes": warn_minutes,
        "crit_minutes": crit_minutes,
    }


def default_policy() -> Dict[str, Any]:
    return {
        "report_dir": "~/.tnf/reports/protocols/agent-state-governance",
        "keep_latest_rules": [
            {
                "name": "claude_shell_snapshots",
                "path": "~/.claude/shell-snapshots",
                "glob": "*",
                "keep": 120,
            },
            {
                "name": "gemini_settings_backups",
                "path": "~/.gemini",
                "glob": "settings.json.backup.*",
                "keep": 2,
            },
        ],
        "older_than_days_rules": [
            {
                "name": "tnf_terminal_heartbeat_history",
                "path": "~/.tnf/terminal-heartbeat/state/history",
                "glob": "*",
                "days": 30,
            }
        ],
        "gzip_rules": [
            {
                "name": "tnf_master_heartbeat_history",
                "file": "~/.tnf/master-heartbeat/state/master-heartbeat-history.jsonl",
                "days": 21,
            },
            {
                "name": "tnf_watchdog_history",
                "file": "~/.tnf/perpetual-scaffold/state/watchdog-history.jsonl",
                "days": 21,
            },
            {
                "name": "tnf_subdirector_history",
                "file": "~/.tnf/subdirector-autopilot/state/subdirector-autopilot-history.jsonl",
                "days": 21,
            },
            {
                "name": "tnf_cloud_health_history",
                "file": "~/.tnf/cloud-health/state/history.jsonl",
                "days": 21,
            },
        ],
    }


def load_policy(path: Path | None) -> Dict[str, Any]:
    policy = default_policy()
    if not path:
        return policy
    raw = yaml.safe_load(path.read_text())
    if not isinstance(raw, dict):
        raise SystemExit("policy file must decode to a mapping")
    policy.update(raw)
    return policy


def parse_rules(policy: Dict[str, Any]) -> tuple[list[KeepLatestRule], list[OlderThanDaysRule], list[GzipRule], Path]:
    keep_rules: List[KeepLatestRule] = []
    for entry in policy.get("keep_latest_rules", []):
        keep_rules.append(
            KeepLatestRule(
                name=str(entry["name"]),
                path=expand(str(entry["path"])),
                glob=str(entry.get("glob", "*")),
                keep=int(entry["keep"]),
            )
        )

    old_rules: List[OlderThanDaysRule] = []
    for entry in policy.get("older_than_days_rules", []):
        old_rules.append(
            OlderThanDaysRule(
                name=str(entry["name"]),
                path=expand(str(entry["path"])),
                glob=str(entry.get("glob", "*")),
                days=int(entry["days"]),
            )
        )

    gzip_rules: List[GzipRule] = []
    for entry in policy.get("gzip_rules", []):
        gzip_rules.append(
            GzipRule(
                name=str(entry["name"]),
                file=expand(str(entry["file"])),
                days=int(entry["days"]),
            )
        )

    report_dir = expand(str(policy.get("report_dir", "~/.tnf/reports/protocols/agent-state-governance")))
    return keep_rules, old_rules, gzip_rules, report_dir


def list_rule_files(path: Path, glob_pat: str) -> List[Path]:
    if not path.exists():
        return []
    return [p for p in path.glob(glob_pat) if p.is_file()]


def plan_keep_latest(rule: KeepLatestRule) -> Dict[str, Any]:
    files = list_rule_files(rule.path, rule.glob)
    files.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    delete = files[rule.keep :] if len(files) > rule.keep else []
    return {
        "rule": rule.name,
        "kind": "keep_latest",
        "path": str(rule.path),
        "glob": rule.glob,
        "keep": rule.keep,
        "total": len(files),
        "delete_count": len(delete),
        "delete_bytes": sum(file_size(f) for f in delete),
        "delete_files": [str(f) for f in delete],
    }


def plan_older_than(rule: OlderThanDaysRule, now: datetime) -> Dict[str, Any]:
    files = list_rule_files(rule.path, rule.glob)
    cutoff = now - timedelta(days=rule.days)
    delete: List[Path] = []
    for f in files:
        mtime = datetime.fromtimestamp(f.stat().st_mtime, tz=timezone.utc)
        if mtime < cutoff:
            delete.append(f)
    return {
        "rule": rule.name,
        "kind": "older_than_days",
        "path": str(rule.path),
        "glob": rule.glob,
        "days": rule.days,
        "cutoff_utc": cutoff.isoformat(),
        "total": len(files),
        "delete_count": len(delete),
        "delete_bytes": sum(file_size(f) for f in delete),
        "delete_files": [str(f) for f in delete],
    }


def plan_gzip(rule: GzipRule, now: datetime) -> Dict[str, Any]:
    src = rule.file
    dst = src.with_suffix(src.suffix + ".gz")

    if src.exists():
        age_days = int((now.timestamp() - src.stat().st_mtime) // 86400)
        should_gzip = age_days > rule.days
        return {
            "rule": rule.name,
            "kind": "gzip_if_older",
            "file": str(src),
            "dest": str(dst),
            "days": rule.days,
            "age_days": age_days,
            "exists": True,
            "already_gz": dst.exists(),
            "apply": should_gzip,
            "source_bytes": file_size(src),
        }

    return {
        "rule": rule.name,
        "kind": "gzip_if_older",
        "file": str(src),
        "dest": str(dst),
        "days": rule.days,
        "exists": False,
        "already_gz": dst.exists(),
        "apply": False,
        "source_bytes": 0,
    }


def build_plan(policy: Dict[str, Any]) -> Dict[str, Any]:
    now = now_utc()
    keep_rules, old_rules, gzip_rules, _ = parse_rules(policy)

    keep = [plan_keep_latest(r) for r in keep_rules]
    older = [plan_older_than(r, now) for r in old_rules]
    gz = [plan_gzip(r, now) for r in gzip_rules]

    delete_count = sum(item["delete_count"] for item in keep + older)
    delete_bytes = sum(item["delete_bytes"] for item in keep + older)
    gzip_count = sum(1 for item in gz if item["apply"])
    gzip_bytes = sum(item["source_bytes"] for item in gz if item["apply"])

    return {
        "generated_at": now.isoformat(),
        "summary": {
            "delete_count": delete_count,
            "delete_bytes": delete_bytes,
            "gzip_count": gzip_count,
            "gzip_source_bytes": gzip_bytes,
        },
        "keep_latest_rules": keep,
        "older_than_days_rules": older,
        "gzip_rules": gz,
    }


def collect_state_snapshot() -> Dict[str, Any]:
    now = now_utc()
    homes = {
        "gemini": expand("~/.gemini"),
        "claude": expand("~/.claude"),
        "opencode": expand("~/.opencode"),
        "kilo": expand("~/.kilo"),
        "augment": expand("~/.augment"),
        "codex": expand("~/.codex"),
        "tnf": expand("~/.tnf"),
    }
    out: Dict[str, Any] = {"generated_at": now.isoformat(), "agents": {}}

    for name, root in homes.items():
        exists = root.exists()
        info: Dict[str, Any] = {"exists": exists}
        if exists:
            info["size_bytes"] = dir_size(root)
            info["size_human"] = human(info["size_bytes"])

        if name == "claude":
            p = root / "shell-snapshots"
            info["shell_snapshot_count"] = len([f for f in p.glob("*") if f.is_file()]) if p.exists() else 0
        if name == "codex":
            p = root / "shell_snapshots"
            info["shell_snapshot_count"] = len([f for f in p.glob("*") if f.is_file()]) if p.exists() else 0
        if name == "tnf":
            p = root / "terminal-heartbeat" / "state" / "history"
            info["terminal_history_file_count"] = len([f for f in p.glob("*") if f.is_file()]) if p.exists() else 0
            checks = [
                protocol_check(
                    name="frontload_handoff_cache",
                    path=root / "handoff-current.json",
                    mode="mtime",
                    warn_minutes=120,
                    crit_minutes=360,
                    now=now,
                ),
                protocol_check(
                    name="master_heartbeat_latest",
                    path=root / "master-heartbeat" / "state" / "master-heartbeat-latest.json",
                    mode="json-generatedAt",
                    warn_minutes=5,
                    crit_minutes=15,
                    now=now,
                ),
                protocol_check(
                    name="terminal_heartbeat_latest",
                    path=root / "terminal-heartbeat" / "state" / "terminal-heartbeat-latest.json",
                    mode="json-generatedAt",
                    warn_minutes=5,
                    crit_minutes=15,
                    now=now,
                ),
                protocol_check(
                    name="local_subdirector_heartbeat",
                    path=root / "local-subdirector" / "state" / "local-subdirector-heartbeat.json",
                    mode="json-generatedAt",
                    warn_minutes=5,
                    crit_minutes=15,
                    now=now,
                ),
            ]
            info["protocol_checks"] = checks
            info["protocol_check_summary"] = {
                "ok": sum(1 for c in checks if c["severity"] == "OK"),
                "warn": sum(1 for c in checks if c["severity"] == "WARN"),
                "crit": sum(1 for c in checks if c["severity"] == "CRIT"),
            }

        out["agents"][name] = info

    return out


def write_json(path: Path, payload: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def apply_plan(plan: Dict[str, Any]) -> Dict[str, Any]:
    deleted = 0
    deleted_bytes = 0
    gzipped = 0
    gzipped_source_bytes = 0

    for section in ("keep_latest_rules", "older_than_days_rules"):
        for item in plan.get(section, []):
            for raw in item.get("delete_files", []):
                fp = Path(raw)
                if fp.exists() and fp.is_file():
                    sz = file_size(fp)
                    fp.unlink()
                    deleted += 1
                    deleted_bytes += sz

    for item in plan.get("gzip_rules", []):
        if not item.get("apply"):
            continue
        src = Path(item["file"])
        dst = Path(item["dest"])
        if src.exists() and src.is_file():
            with src.open("rb") as in_f, gzip.open(dst, "wb") as out_f:
                shutil.copyfileobj(in_f, out_f)
            src.unlink()
            gzipped += 1
            gzipped_source_bytes += int(item.get("source_bytes", 0))

    return {
        "deleted": deleted,
        "deleted_bytes": deleted_bytes,
        "gzipped": gzipped,
        "gzipped_source_bytes": gzipped_source_bytes,
    }


def print_summary(label: str, payload: Dict[str, Any]) -> None:
    if "summary" in payload:
        s = payload["summary"]
        print(f"{label}: delete_count={s.get('delete_count', 0)} delete_bytes={human(int(s.get('delete_bytes', 0)))} gzip_count={s.get('gzip_count', 0)}")
    else:
        agents = payload.get("agents", {})
        print(f"{label}: agents={len(agents)}")


def run_audit(policy: Dict[str, Any], report_dir: Path) -> Path:
    state = collect_state_snapshot()
    plan = build_plan(policy)
    payload = {"mode": "audit", "state": state, "plan": plan}
    out = report_dir / f"audit-{stamp()}.json"
    write_json(out, payload)
    print_summary("audit-plan", plan)
    print(f"wrote={out}")
    return out


def run_plan(policy: Dict[str, Any], report_dir: Path) -> Path:
    plan = build_plan(policy)
    out = report_dir / f"plan-{stamp()}.json"
    write_json(out, {"mode": "plan", "plan": plan})
    print_summary("plan", plan)
    print(f"wrote={out}")
    return out


def run_apply(policy: Dict[str, Any], report_dir: Path, yes: bool) -> Path:
    if not yes:
        raise SystemExit("apply requires --yes")

    before = collect_state_snapshot()
    plan = build_plan(policy)
    result = apply_plan(plan)
    after = collect_state_snapshot()

    verify_plan = build_plan(policy)
    out = report_dir / f"apply-{stamp()}.json"
    write_json(
        out,
        {
            "mode": "apply",
            "before": before,
            "applied_plan": plan,
            "result": result,
            "after": after,
            "verify_plan": verify_plan,
        },
    )
    print(
        "apply:"
        f" deleted={result['deleted']}"
        f" deleted_bytes={human(result['deleted_bytes'])}"
        f" gzipped={result['gzipped']}"
        f" gzip_source_bytes={human(result['gzipped_source_bytes'])}"
    )
    print_summary("verify-plan", verify_plan)
    print(f"wrote={out}")
    return out


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="TNF multi-agent state governor")
    parser.add_argument("mode", choices=["audit", "plan", "apply"])
    parser.add_argument("--policy", type=Path, help="optional YAML policy override")
    parser.add_argument("--yes", action="store_true", help="required for apply")
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    policy = load_policy(args.policy)
    _, _, _, report_dir = parse_rules(policy)
    report_dir.mkdir(parents=True, exist_ok=True)

    if args.mode == "audit":
        run_audit(policy, report_dir)
    elif args.mode == "plan":
        run_plan(policy, report_dir)
    else:
        run_apply(policy, report_dir, args.yes)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

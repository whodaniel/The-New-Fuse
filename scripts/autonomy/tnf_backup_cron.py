#!/usr/bin/env python3
"""
[CLASS:PRIME] [STATUS:LOCKED] [DOC_TYPE:BACKUP_ENGINE] [DOMAIN_SCOPE:SYSTEM_STORAGE]
TNF Persistent Data Storage, Backup & Cron Engine

Manages user data transparency, automated snapshots, and OS-level persistent cron scheduling.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tarfile
from pathlib import Path
from typing import Any, Dict, List, Optional

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONFIG_PATH = Path.home() / ".tnf" / "backup-config.json"
DEFAULT_BACKUP_DIR = Path.home() / ".tnf" / "backups"


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")


def get_dir_size_bytes(path: Path) -> int:
    if not path.exists():
        return 0
    if path.is_file():
        return path.stat().st_size
    total = 0
    for p in path.glob("**/*"):
        if p.is_file():
            try:
                total += p.stat().st_size
            except Exception:
                pass
    return total


def format_bytes(size: int) -> str:
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if size < 1024.0:
            return f"{size:.2f} {unit}"
        size /= 1024.0
    return f"{size:.2f} PB"


def get_storage_inventory() -> Dict[str, Any]:
    """Provides complete transparency on where user data is saved."""
    inventory = [
        {
            "id": "personal_intel",
            "name": "Personal Intelligence & Notes",
            "description": "Sealed personal extractions, raw notes, and daily thought ledgers.",
            "path": str(Path.home() / ".tnf" / "personal-intelligence"),
            "alt_path": str(ROOT / "docs" / "personal"),
            "classification": "PERSONAL_SEALED",
            "git_status": "EXCLUDED_GITIGNORED",
            "size_bytes": get_dir_size_bytes(Path.home() / ".tnf" / "personal-intelligence") + get_dir_size_bytes(ROOT / "docs" / "personal"),
        },
        {
            "id": "graduated_intel",
            "name": "Graduated Codebase Intel",
            "description": "Vetted, anonymized knowledge units passing the TNF Gauntlet.",
            "path": str(ROOT / "docs" / "distilled-intel"),
            "alt_path": str(ROOT / "data" / "intelligence-artifacts"),
            "classification": "GRADUATED_PUBLIC",
            "git_status": "TRACKED_OPEN_SOURCE",
            "size_bytes": get_dir_size_bytes(ROOT / "docs" / "distilled-intel") + get_dir_size_bytes(ROOT / "data" / "intelligence-artifacts"),
        },
        {
            "id": "transcripts_sensory",
            "name": "Multimodal Transcripts & Sensory Drops",
            "description": "YouTube transcripts, audio matches, and vision cache frames.",
            "path": str(ROOT / "data" / "transcripts"),
            "alt_path": str(ROOT / "data" / "video-transcripts"),
            "classification": "OPERATOR_SENSORY",
            "git_status": "LOCAL_TRACKED",
            "size_bytes": get_dir_size_bytes(ROOT / "data" / "transcripts") + get_dir_size_bytes(ROOT / "data" / "video-transcripts"),
        },
        {
            "id": "concordance_graph",
            "name": "Unified Semantic & Concordance Graph",
            "description": "Cross-system word frequencies, Merkle tree, and term index.",
            "path": str(ROOT / "concordance_results"),
            "alt_path": str(ROOT / "concordance_results" / "user"),
            "classification": "SYSTEM_AND_USER_OVERLAY",
            "git_status": "HYBRID_SEPARATED",
            "size_bytes": get_dir_size_bytes(ROOT / "concordance_results"),
        },
        {
            "id": "harness_config",
            "name": "Harness Configuration & State Ledgers",
            "description": "Agent state ledgers, manifests, and provider credentials.",
            "path": str(ROOT / "data" / "ingestion-runs"),
            "alt_path": str(Path.home() / ".tnf"),
            "classification": "SYSTEM_GOVERNANCE",
            "git_status": "HYBRID_CONFIG",
            "size_bytes": get_dir_size_bytes(ROOT / "data" / "ingestion-runs") + get_dir_size_bytes(Path.home() / ".tnf"),
        },
    ]

    total_bytes = sum(item["size_bytes"] for item in inventory)
    return {
        "timestamp": now_iso(),
        "total_storage_bytes": total_bytes,
        "total_storage_formatted": format_bytes(total_bytes),
        "inventory": [
            {**item, "size_formatted": format_bytes(item["size_bytes"])}
            for item in inventory
        ],
    }


def load_backup_config() -> Dict[str, Any]:
    if DEFAULT_CONFIG_PATH.exists():
        try:
            with DEFAULT_CONFIG_PATH.open("r", encoding="utf-8") as handle:
                return json.load(handle)
        except Exception:
            pass

    return {
        "backup_destination": str(DEFAULT_BACKUP_DIR),
        "schedule": {
            "enabled": True,
            "frequency": "daily",
            "time": "02:00",
            "cron_expression": "0 2 * * *",
        },
        "retention": {
            "keep_last_snapshots": 7,
            "compress_format": "tar.gz",
        },
        "included_targets": [
            "personal_intel",
            "graduated_intel",
            "transcripts_sensory",
            "harness_config",
        ],
    }


def save_backup_config(config: Dict[str, Any]) -> None:
    DEFAULT_CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with DEFAULT_CONFIG_PATH.open("w", encoding="utf-8") as handle:
        json.dump(config, handle, indent=2)


def sync_cron_job(config: Dict[str, Any]) -> Tuple[bool, str]:
    """Installs or removes the persistent cron job in macOS crontab."""
    script_path = ROOT / "scripts" / "autonomy" / "tnf_backup_cron.py"
    cmd_entry = f"{config['schedule']['cron_expression']} /usr/bin/env python3 {script_path} --execute-backup >> {Path.home()}/.tnf/backup-cron.log 2>&1"
    tag = "# TNF_PERSISTENT_BACKUP_JOB"

    try:
        current_crontab = ""
        result = subprocess.run(["crontab", "-l"], capture_output=True, text=True)
        if result.returncode == 0:
            current_crontab = result.stdout

        lines = [line for line in current_crontab.splitlines() if tag not in line and str(script_path) not in line]

        if config["schedule"].get("enabled", False):
            lines.append(f"{cmd_entry} {tag}")

        new_crontab = "\n".join(lines) + "\n" if lines else ""

        proc = subprocess.run(["crontab", "-"], input=new_crontab, text=True, capture_output=True)
        if proc.returncode == 0:
            return True, "Cron job synchronized successfully"
        else:
            return False, f"Crontab write failed: {proc.stderr}"
    except Exception as err:
        return False, f"Failed to sync cron: {err}"


def execute_backup(dest_dir: Optional[Path] = None) -> Dict[str, Any]:
    config = load_backup_config()
    target_dir = Path(dest_dir) if dest_dir else Path(config.get("backup_destination", str(DEFAULT_BACKUP_DIR)))
    target_dir.mkdir(parents=True, exist_ok=True)

    timestamp = dt.datetime.now().strftime("%Y%m%d_%H%M%S")
    archive_name = f"tnf_backup_{timestamp}.tar.gz"
    archive_path = target_dir / archive_name

    sources = [
        Path.home() / ".tnf" / "personal-intelligence",
        ROOT / "docs" / "personal",
        ROOT / "docs" / "distilled-intel",
        ROOT / "data" / "intelligence-artifacts",
        ROOT / "data" / "transcripts",
        ROOT / "data" / "ingestion-runs",
    ]

    backed_up_count = 0
    with tarfile.open(archive_path, "w:gz") as tar:
        for src in sources:
            if src.exists():
                arcname = src.name if src.parent != ROOT else f"tnf_root/{src.name}"
                tar.add(src, arcname=arcname)
                backed_up_count += 1

    size_bytes = archive_path.stat().st_size
    manifest_entry = {
        "id": f"backup-{timestamp}",
        "filename": archive_name,
        "path": str(archive_path),
        "created_at": now_iso(),
        "size_bytes": size_bytes,
        "size_formatted": format_bytes(size_bytes),
        "status": "completed",
    }

    # Record in backup index
    index_file = target_dir / "backup_index.json"
    index_data: List[Dict[str, Any]] = []
    if index_file.exists():
        try:
            with index_file.open("r", encoding="utf-8") as h:
                index_data = json.load(h)
        except Exception:
            index_data = []

    index_data.insert(0, manifest_entry)
    # Enforce retention
    max_keep = config.get("retention", {}).get("keep_last_snapshots", 7)
    if len(index_data) > max_keep:
        stale = index_data[max_keep:]
        index_data = index_data[:max_keep]
        for old in stale:
            try:
                old_file = Path(old["path"])
                if old_file.exists():
                    old_file.unlink()
            except Exception:
                pass

    with index_file.open("w", encoding="utf-8") as h:
        json.dump(index_data, h, indent=2)

    return manifest_entry


def list_backups(dest_dir: Optional[Path] = None) -> List[Dict[str, Any]]:
    config = load_backup_config()
    target_dir = Path(dest_dir) if dest_dir else Path(config.get("backup_destination", str(DEFAULT_BACKUP_DIR)))
    index_file = target_dir / "backup_index.json"
    if index_file.exists():
        try:
            with index_file.open("r", encoding="utf-8") as h:
                return json.load(h)
        except Exception:
            pass
    return []


def main() -> int:
    parser = argparse.ArgumentParser(description="TNF Data Storage & Backup Manager")
    parser.add_argument("--inventory", action="store_true", help="Print storage transparency inventory")
    parser.add_argument("--execute-backup", action="store_true", help="Execute immediate backup snapshot")
    parser.add_argument("--list-backups", action="store_true", help="List previous backup snapshots")
    parser.add_argument("--sync-cron", action="store_true", help="Synchronize persistent cron job")
    parser.add_argument("--set-dest", help="Update backup destination folder")
    parser.add_argument("--set-cron", help="Update cron schedule expression (e.g. '0 2 * * *')")
    parser.add_argument("--enable-cron", action="store_true", help="Enable automated cron backup")
    parser.add_argument("--disable-cron", action="store_true", help="Disable automated cron backup")
    args = parser.parse_args()

    config = load_backup_config()

    if args.set_dest:
        config["backup_destination"] = str(Path(args.set_dest).resolve())
        save_backup_config(config)
        print(f"Updated backup destination to: {config['backup_destination']}")

    if args.set_cron:
        config["schedule"]["cron_expression"] = args.set_cron
        save_backup_config(config)
        print(f"Updated cron expression to: {args.set_cron}")

    if args.enable_cron:
        config["schedule"]["enabled"] = True
        save_backup_config(config)
        ok, msg = sync_cron_job(config)
        print(f"Cron enabled: {msg}")

    if args.disable_cron:
        config["schedule"]["enabled"] = False
        save_backup_config(config)
        ok, msg = sync_cron_job(config)
        print(f"Cron disabled: {msg}")

    if args.sync_cron:
        ok, msg = sync_cron_job(config)
        print(f"Cron sync: {msg}")

    if args.execute_backup:
        res = execute_backup()
        print(json.dumps(res, indent=2))

    if args.inventory:
        res = get_storage_inventory()
        print(json.dumps(res, indent=2))

    if args.list_backups:
        res = list_backups()
        print(json.dumps(res, indent=2))

    if not any([args.inventory, args.execute_backup, args.list_backups, args.sync_cron, args.set_dest, args.set_cron, args.enable_cron, args.disable_cron]):
        print(json.dumps({
            "inventory": get_storage_inventory(),
            "config": config,
            "backups": list_backups(),
        }, indent=2))

    return 0


if __name__ == "__main__":
    sys.exit(main())

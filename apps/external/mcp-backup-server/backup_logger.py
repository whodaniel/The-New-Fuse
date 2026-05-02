import os
import json
import time
from datetime import datetime
from typing import Dict, Any

LOG_FILE = os.path.join(os.path.dirname(__file__), "backup_history.log")


def log_backup_start(backup_id: str, target: str, source_dir: str) -> None:
    entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "type": "start",
        "backup_id": backup_id,
        "target": target,
        "source_dir": source_dir,
    }
    _write_entry(entry)


def log_backup_progress(
    backup_id: str, current: int, total: int, current_file: str
) -> None:
    entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "type": "progress",
        "backup_id": backup_id,
        "processed": current,
        "total": total,
        "percent": round((current / total) * 100, 2),
        "current_file": current_file,
    }
    _write_entry(entry)


def log_backup_complete(backup_id: str, target: str, stats: Dict[str, Any]) -> None:
    entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "type": "complete",
        "backup_id": backup_id,
        "target": target,
        "stats": stats,
        "duration": time.time() - stats.get("start_time", 0),
    }
    _write_entry(entry)


def log_backup_error(
    backup_id: str, target: str, error_msg: str, file_path: str = None
) -> None:
    entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "type": "error",
        "backup_id": backup_id,
        "target": target,
        "error": error_msg,
        "file": file_path,
    }
    _write_entry(entry)


def _write_entry(entry: Dict) -> None:
    with open(LOG_FILE, "a", encoding="utf8") as f:
        f.write(json.dumps(entry) + "\n")


def get_last_backup_status(target: str = None) -> Dict:
    if not os.path.exists(LOG_FILE):
        return {}

    with open(LOG_FILE, "r") as f:
        lines = f.readlines()

    for line in reversed(lines):
        try:
            entry = json.loads(line)
            if target is None or entry.get("target") == target:
                if entry.get("type") in ["complete", "start", "progress"]:
                    return entry
        except json.JSONDecodeError:
            continue
    return {}

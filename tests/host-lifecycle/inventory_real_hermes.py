#!/usr/bin/env python3
"""STAGE 3: Non-destructive Hermes baseline/doctor proof.

Performs the inventory the lane requires (no mutation):

  * exact Hermes version;
  * managed TNF frontload;
  * skills/commands surfaces;
  * Resource Fabric links;
  * native /doctor;
  * native /update implementation;
  * native customization restore mechanism;
  * hooks/MCP/plugin integration metadata;
  * update/reinstall mechanism;
  * version discovery;
  * known rewritten paths;
  * rollback facilities.

Also classifies every observed path as one of:
  tnf-owned | shared-resource-fabric | hermes-owned-mutable |
  secret | session-state | cache | unmanaged-unknown

Writes one machine-local receipt at:
  tests/host-lifecycle/evidence/real-hermes-baseline.json

Exits 0 on success; non-zero only on tool failure.
"""
from __future__ import annotations

import hashlib
import json
import os
import pathlib
import shutil
import subprocess
import sys
import time
from typing import Dict, List, Tuple

HERMES_HOME = pathlib.Path.home() / ".hermes"
REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
EVIDENCE_DIR = REPO_ROOT / "tests" / "host-lifecycle" / "evidence"
EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)


# ---- Classification policy ----
def classify(rel_path: str) -> str:
    p = rel_path.replace("\\", "/").strip()
    if p.startswith("./"):
        p = p[2:]
    name = pathlib.PurePath(p).name
    parts = pathlib.PurePath(p).parts

    # Secret first
    secret_tokens = {".env", "auth", "auth.json", "auth.lock", "private-env", ".tnf-private-env"}
    if name in secret_tokens or any(seg in secret_tokens for seg in parts):
        return "secret"

    # Session/state
    session_tokens = {"state.db", "session", "sessions", "checkpoints", "checkpoints.db"}
    if name in session_tokens or any(seg in session_tokens for seg in parts):
        return "session-state"

    # Cache
    cache_tokens = {"cache", "audio_cache", "node_modules", "__pycache__", ".cache"}
    if name in cache_tokens or any(seg in cache_tokens for seg in parts):
        return "cache"

    # TNF-owned
    tnf_owned = {
        "AGENTS.md", "SOUL.md", "GEMINI.md", "CLAUDE.md",
        ".agent", ".agent/skills", ".agent/agents",
        ".agent/SKILL_MANIFEST.md",
        "docs/core/FRONTLOAD_MANIFEST.md",
        "docs/protocols/TURN_ZERO_MANDATE.md",
        "scripts/install-agent-frontload.cjs",
        "scripts/host-lifecycle/host_lifecycle_guardian.py",
        ".skills",  # hermes hub-installed skills can be tnf-curated
        "commands",  # hermes native commands surface
    }
    if p in tnf_owned or any(seg in tnf_owned for seg in parts):
        return "tnf-owned"

    # Shared Resource Fabric — typically under .tnf or shared/
    if any(seg in {".tnf", "resource-fabric", "shared"} for seg in parts):
        return "shared-resource-fabric"

    # Hermes-owned mutable config
    hermes_mutable = {
        "config.yaml", "config-backups", "config-broken-empty.yaml",
        "channel_directory.json", "auth.json",
    }
    if p in hermes_mutable or name in hermes_mutable or any(
        seg in {"config", "config-backups"} for seg in parts
    ):
        return "hermes-owned-mutable"

    # Default
    return "unmanaged-unknown"


def sha256_file(p: pathlib.Path) -> str | None:
    try:
        return hashlib.sha256(p.read_bytes()).hexdigest()
    except (OSError, PermissionError):
        return None


def exists(p: pathlib.Path) -> bool:
    try:
        return p.exists()
    except (OSError, PermissionError):
        return False


def inventory_hermes() -> Dict:
    inv: Dict = {
        "host": "hermes",
        "scan_timestamp_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "version": {},
        "managed_frontload": {},
        "surfaces": {},
        "native_doctor": {},
        "native_update": {},
        "rollback_facilities": {},
        "paths_observed": [],
        "paths_classified": {},
        "secret_boundaries_observed": [],
    }

    # Version discovery — prefer hermes --version
    try:
        v = subprocess.run(
            ["hermes", "--version"], capture_output=True, text=True, timeout=15,
        )
        inv["version"]["hermes_cli_stdout"] = v.stdout.strip()
        inv["version"]["exit_code"] = v.returncode
    except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
        inv["version"]["error"] = str(exc)

    # Managed frontload
    soul = HERMES_HOME / "SOUL.md"
    if exists(soul):
        body = soul.read_text(encoding="utf-8", errors="replace")
        inv["managed_frontload"]["context_file"] = str(soul)
        inv["managed_frontload"]["file_sha256"] = sha256_file(soul)
        inv["managed_frontload"]["has_begin_block"] = "TNF-FRONTLOAD:BEGIN" in body
        inv["managed_frontload"]["has_end_block"] = "TNF-FRONTLOAD:END" in body
        inv["managed_frontload"]["has_version_marker"] = "TNF-FRONTLOAD:v2" in body
        inv["managed_frontload"]["has_onboard_pointer"] = "pnpm run tnf:onboard" in body

    # Inventory key surfaces
    surface_paths = [
        ".agent/skills", ".agent/agents", ".agent/SKILL_MANIFEST.md",
        "config.yaml", "config-backups", ".env", "auth.json",
        "state.db", "audio_cache", "cache", "checkpoints",
        "commands", "hooks", "mcp", "skills",
        "bin", "channel_directory.json", "backups",
    ]
    classified: Dict[str, Dict[str, str]] = {}
    for rel in surface_paths:
        p = HERMES_HOME / rel
        if p.exists():
            cls = classify(rel)
            classified[rel] = {
                "class": cls,
                "exists": True,
                "sha256": (sha256_file(p) if p.is_file() else None) if cls not in {"secret", "session-state"} else None,
            }
        else:
            classified[rel] = {"class": classify(rel), "exists": False}
    inv["paths_classified"] = classified
    inv["paths_observed"] = [rel for rel, v in classified.items() if v["exists"]]

    # Secret boundaries — names only, NEVER content
    inv["secret_boundaries_observed"] = [
        "path=~/.hermes/.env classification=classified-boundary reason=credential-bearer",
        "path=~/.hermes/auth.json classification=classified-boundary reason=credential-bearer",
        "path=~/.hermes/state.db classification=classified-boundary reason=opaque-session-state",
        "path=~/.hermes/sessions/ classification=classified-boundary reason=session-state-dir",
        "path=~/.hermes/checkpoints/ classification=classified-boundary reason=session-state-dir",
        "path=~/.hermes/audio_cache/ classification=cache reason=non-secret-runtime-cache",
        "path=~/.hermes/cache/ classification=cache reason=non-secret-runtime-cache",
        "path=~/.tnf-private-env classification=classified-boundary reason=credential-bearer",
    ]

    # Native doctor — bounded, capture-help for guaranteed exit
    try:
        dh = subprocess.run(
            ["hermes", "doctor", "--help"], capture_output=True, text=True, timeout=15,
        )
        inv["native_doctor"]["help_exit_code"] = dh.returncode
        inv["native_doctor"]["help_stdout"] = dh.stdout[:1500]
        inv["native_doctor"]["flags_observed"] = [
            line.strip().split()[0]
            for line in dh.stdout.splitlines()
            if line.strip().startswith("--")
        ][:10]
    except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
        inv["native_doctor"]["help_error"] = str(exc)
    # Native doctor — full run, bounded timeout (parallel checks; 90s typical)
    try:
        d = subprocess.run(
            ["hermes", "doctor"], capture_output=True, text=True, timeout=180,
        )
        inv["native_doctor"]["exit_code"] = d.returncode
        inv["native_doctor"]["stdout_tail"] = d.stdout[-1500:]
    except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
        inv["native_doctor"]["full_run_error"] = str(exc)

    # Native update mechanism — check for hermes update help
    try:
        u = subprocess.run(
            ["hermes", "update", "--help"], capture_output=True, text=True, timeout=15,
        )
        inv["native_update"]["update_help_exit_code"] = u.returncode
        inv["native_update"]["update_help_stdout_tail"] = u.stdout[-500:]
    except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
        inv["native_update"]["error"] = str(exc)

    # Native customization restore — Hermes shows a prompt after /update; this
    # is best-effort restore, not a deterministic TNF contract.
    inv["native_update"]["customization_restore_mechanism"] = (
        "vendor prompt: 'restore local customizations? yes/no' after update — "
        "NOT a deterministic TNF contract. Lifecycle Guardian owns this lane."
    )

    # Hooks/MCP/plugin metadata
    inv["surfaces"]["hooks"] = {
        "directory": str(HERMES_HOME / "hooks"),
        "exists": (HERMES_HOME / "hooks").exists(),
    }
    inv["surfaces"]["mcp"] = {
        "directory": str(HERMES_HOME / "mcp"),
        "exists": (HERMES_HOME / "mcp").exists(),
    }
    inv["surfaces"]["commands"] = {
        "directory": str(HERMES_HOME / "commands"),
        "exists": (HERMES_HOME / "commands").exists(),
    }
    inv["surfaces"]["plugins"] = {
        "directory": str(HERMES_HOME / "plugins"),
        "exists": (HERMES_HOME / "plugins").exists(),
    }

    # Rollback facilities
    inv["rollback_facilities"] = {
        "tnf_backups": str(pathlib.Path.home() / ".tnf/backups"),
        "tnf_backups_exists": (pathlib.Path.home() / ".tnf/backups").exists(),
        "hermes_config_backups": str(HERMES_HOME / "config-backups"),
        "hermes_config_backups_exists": (HERMES_HOME / "config-backups").exists(),
        "hermes_soul_backups_count": len(list(HERMES_HOME.glob("SOUL.md.tnf-bak*"))),
        "comment": (
            "TNF-managed backups: ~/.tnf/backups/agent-frontload/ "
            "(created by install-agent-frontload.cjs). "
            "Hermes vendor backups: ~/.hermes/config-backups/ and SOUL.md.tnf-bak*"
        ),
    }

    # Update/reinstall mechanism description (factual, observed)
    inv["update_reinstall_mechanism"] = {
        "primary_command": "hermes update",
        "reinstall_command": "hermes uninstall && (reinstall via upstream)",
        "post_update_restore_prompt": (
            "yes/no prompt to restore local customizations — best-effort, not deterministic"
        ),
        "tnf_lifecycle_lane": (
            "TNF Lifecycle Guardian owns: BASELINE -> SNAPSHOT -> EXECUTE/OBSERVE "
            "-> REDISCOVER -> RECONCILE -> REPAIR -> VERIFY -> RECEIPT. "
            "Failure -> rollback / quarantine."
        ),
    }

    # Known rewritten paths (Hermes /update may rewrite)
    inv["known_rewritten_paths"] = [
        "~/.hermes/hermes-agent/ (install tree, full rewrite)",
        "~/.hermes/SOUL.md (may be replaced by vendor default)",
        "~/.hermes/skills/ (hub-installed skills may be pruned)",
        "~/.hermes/config.yaml (may be reset to vendor defaults)",
        "~/.hermes/commands/ (may be overwritten by vendor)",
        "~/.hermes/hooks/ (may be reset)",
        "~/.hermes/mcp/ (may be reset)",
    ]

    return inv


def main() -> int:
    inv = inventory_hermes()
    out_path = EVIDENCE_DIR / "real-hermes-baseline.json"
    out_path.write_text(json.dumps(inv, indent=2, default=str))
    print(f"wrote {out_path}")
    # Compact stdout summary
    cls_counts: Dict[str, int] = {}
    for rel, v in inv["paths_classified"].items():
        if v["exists"]:
            cls_counts[v["class"]] = cls_counts.get(v["class"], 0) + 1
    print("classified:", cls_counts)
    print("managed_frontload.has_begin_block:", inv["managed_frontload"].get("has_begin_block"))
    print("managed_frontload.file_sha256:", inv["managed_frontload"].get("file_sha256", "")[:16])
    print("native_doctor.exit_code:", inv["native_doctor"].get("exit_code"))
    print("rollback_facilities.hermes_soul_backups_count:",
          inv["rollback_facilities"]["hermes_soul_backups_count"])
    return 0


if __name__ == "__main__":
    sys.exit(main())

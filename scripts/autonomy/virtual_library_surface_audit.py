#!/usr/bin/env python3
"""
Build a canonical surface map for Virtual Library assets and agent runtimes.

Outputs:
  - docs/protocols/storage/tnf-virtual-library-surface-map.json
  - docs/protocols/reports/TNF_VIRTUAL_LIBRARY_SURFACE_AUDIT.md
"""

from __future__ import annotations

import json
import os
import subprocess
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


HOME = Path.home()
REPO_ROOT = Path(__file__).resolve().parents[2]
CANONICAL_LIBRARY = Path(
    os.environ.get(
        "TNF_VIRTUAL_LIBRARY_CANONICAL_ROOT",
        str(HOME / "Projects/virtual-library-blueprints"),
    )
).expanduser()
MONOREPO_LIBRARY = REPO_ROOT / "apps/virtual-library-blueprints"
KILO_HOME = HOME / ".kilo"
OPENCODE_HOME = HOME / ".opencode"
GEMINI_HOME = HOME / ".gemini"

JSON_OUTPUT = REPO_ROOT / "docs/protocols/storage/tnf-virtual-library-surface-map.json"
MD_OUTPUT = REPO_ROOT / "docs/protocols/reports/TNF_VIRTUAL_LIBRARY_SURFACE_AUDIT.md"


@dataclass
class GitInfo:
    path: str
    exists: bool
    is_repo: bool
    branch: str | None
    head: str | None
    remote: str | None
    dirty: bool | None


def sanitize_path(value: str | Path) -> str:
    p = str(value)
    home = str(HOME)
    if p == home:
        return "~"
    if p.startswith(f"{home}/"):
        return p.replace(home, "~", 1)
    return p


def run(cmd: list[str], cwd: Path | None = None) -> str | None:
    try:
        out = subprocess.check_output(cmd, cwd=str(cwd) if cwd else None, stderr=subprocess.DEVNULL)
        return out.decode("utf-8").strip()
    except Exception:
        return None


def git_info(path: Path) -> GitInfo:
    if not path.exists():
        return GitInfo(sanitize_path(path), False, False, None, None, None, None)
    is_repo = run(["git", "-C", str(path), "rev-parse", "--is-inside-work-tree"]) == "true"
    if not is_repo:
        return GitInfo(sanitize_path(path), True, False, None, None, None, None)
    return GitInfo(
        path=sanitize_path(path),
        exists=True,
        is_repo=True,
        branch=run(["git", "-C", str(path), "branch", "--show-current"]),
        head=run(["git", "-C", str(path), "rev-parse", "HEAD"]),
        remote=run(["git", "-C", str(path), "remote", "get-url", "origin"]),
        dirty=bool(run(["git", "-C", str(path), "status", "--porcelain"])),
    )


def read_json(path: Path) -> Any:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def list_gemini_skills() -> list[str]:
    skills_dir = GEMINI_HOME / "skills"
    if not skills_dir.exists():
        return []
    out: list[str] = []
    for p in sorted(skills_dir.rglob("*")):
        if p.is_file() and (p.name == "SKILL.md" or p.suffix == ".skill"):
            out.append(sanitize_path(p))
    return out


def build_surface_map() -> dict[str, Any]:
    canonical_git = git_info(CANONICAL_LIBRARY)
    monorepo_git = git_info(MONOREPO_LIBRARY)

    kilo_pkg = read_json(KILO_HOME / "package.json") or {}
    opencode_pkg = read_json(OPENCODE_HOME / "package.json") or {}

    drift = {}
    if canonical_git.head and monorepo_git.head:
        drift["head_mismatch"] = canonical_git.head != monorepo_git.head
    else:
        drift["head_mismatch"] = None

    if canonical_git.remote and monorepo_git.remote:
        drift["remote_mismatch"] = canonical_git.remote != monorepo_git.remote
    else:
        drift["remote_mismatch"] = None

    drift["branch_mismatch"] = (
        canonical_git.branch != monorepo_git.branch
        if canonical_git.branch is not None and monorepo_git.branch is not None
        else None
    )

    generated_at = datetime.now(timezone.utc).isoformat()

    return {
        "generated_at_utc": generated_at,
        "system": "TNF Virtual Library",
        "canonicalization": {
            "canonical_codebase": sanitize_path(CANONICAL_LIBRARY),
            "monorepo_mirror_codebase": sanitize_path(MONOREPO_LIBRARY),
            "drift": drift,
        },
        "surfaces": {
            "codebases": {
                "canonical": canonical_git.__dict__,
                "monorepo_mirror": monorepo_git.__dict__,
            },
            "agent_runtime_homes": {
                "kilo": {
                    "path": sanitize_path(KILO_HOME),
                    "exists": KILO_HOME.exists(),
                    "dependencies": (kilo_pkg.get("dependencies") or {}),
                    "role": "runtime/tooling state (not story source of truth)",
                },
                "opencode": {
                    "path": sanitize_path(OPENCODE_HOME),
                    "exists": OPENCODE_HOME.exists(),
                    "dependencies": (opencode_pkg.get("dependencies") or {}),
                    "role": "runtime/tooling state (not story source of truth)",
                },
                "gemini": {
                    "path": sanitize_path(GEMINI_HOME),
                    "exists": GEMINI_HOME.exists(),
                    "skills": list_gemini_skills(),
                    "memory_file": sanitize_path(GEMINI_HOME / "GEMINI.md"),
                    "role": "agent memory/skills/runtime state (not story source of truth)",
                },
            },
            "story_data_authoritative_tables": [
                "story_sessions",
                "story_answers",
                "note_cards",
                "timeline_events",
                "library_navigation",
                "story_session_agent_access",
            ],
        },
        "process_contract": {
            "authoritative_edit_path": sanitize_path(CANONICAL_LIBRARY),
            "mirror_sync_required": True,
            "privacy_wall_required": True,
            "owner_scope_keys": ["owner_principal_id", "visibility_scope", "release_state", "agent_allowlist"],
        },
    }


def build_markdown(data: dict[str, Any]) -> str:
    canonical = data["surfaces"]["codebases"]["canonical"]
    mirror = data["surfaces"]["codebases"]["monorepo_mirror"]
    drift = data["canonicalization"]["drift"]
    kilo = data["surfaces"]["agent_runtime_homes"]["kilo"]
    opencode = data["surfaces"]["agent_runtime_homes"]["opencode"]
    gemini = data["surfaces"]["agent_runtime_homes"]["gemini"]

    lines = [
        "# TNF Virtual Library Surface Audit",
        "",
        f"- Generated (UTC): `{data['generated_at_utc']}`",
        "",
        "## Canonicalization Decision",
        f"- Canonical codebase: `{data['canonicalization']['canonical_codebase']}`",
        f"- Monorepo mirror: `{data['canonicalization']['monorepo_mirror_codebase']}`",
        "",
        "## Git State",
        f"- Canonical branch/head: `{canonical.get('branch')}` / `{canonical.get('head')}`",
        f"- Mirror branch/head: `{mirror.get('branch')}` / `{mirror.get('head')}`",
        f"- Head mismatch: `{drift.get('head_mismatch')}`",
        f"- Branch mismatch: `{drift.get('branch_mismatch')}`",
        f"- Remote mismatch: `{drift.get('remote_mismatch')}`",
        "",
        "## Runtime Surface Classification",
        f"- `.kilo` path: `{kilo.get('path')}`",
        f"- `.kilo` dependencies: `{json.dumps(kilo.get('dependencies', {}), sort_keys=True)}`",
        f"- `.opencode` path: `{opencode.get('path')}`",
        f"- `.opencode` dependencies: `{json.dumps(opencode.get('dependencies', {}), sort_keys=True)}`",
        f"- `.gemini` path: `{gemini.get('path')}`",
        f"- `.gemini` skills discovered: `{len(gemini.get('skills', []))}`",
        "",
        "## Story Data Authority",
        "- Authoritative tables:",
    ]
    for t in data["surfaces"]["story_data_authoritative_tables"]:
        lines.append(f"  - `{t}`")

    lines.extend(
        [
            "",
            "## Coherence Rules",
            "- Edit Virtual Library code only in canonical codebase first.",
            "- Sync to monorepo mirror after validation.",
            "- Treat `.kilo`, `.opencode`, and `.gemini` as runtime surfaces, not source-of-truth story content.",
            "- Enforce owner-scoped privacy wall (`owner_principal_id`, release gating, grants).",
        ]
    )

    return "\n".join(lines) + "\n"


def main() -> int:
    data = build_surface_map()
    JSON_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    MD_OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    JSON_OUTPUT.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    MD_OUTPUT.write_text(build_markdown(data), encoding="utf-8")

    print(f"Wrote {JSON_OUTPUT}")
    print(f"Wrote {MD_OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

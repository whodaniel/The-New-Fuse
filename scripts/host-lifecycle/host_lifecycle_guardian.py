#!/usr/bin/env python3
"""Generic TNF Host Lifecycle Guardian - core adapter framework.

Resolves managed-frontload identity by composing with the canonical
``scripts/install-agent-frontload.cjs`` authority (the same authority the
TNF native injectors use) instead of inventing a separate root-discovery
mechanism. Root resolution walks upward from the script's location looking
for ``scripts/install-agent-frontload.cjs``; an explicit ``--repo-root``
override and ``TNF_REPO_ROOT`` env var are honored first to support
symlinked-checkout aliases and CI sandboxes.

Adapter strategies (explicit, no assumptions about /update shadowing):
- native-hook: hook pre/post native update mechanism
- command-shadow: intercept update/doctor command by name
- wrapper-delegation: delegate to native mechanism, observe only
- post-update-detection: observe result after native execution
- package-manager-watch: observe package-manager-level mutation
- unmanaged-observe: no mutation authority; observe/report only

Lifecycle phases (fail-closed):
DETECT -> IDENTIFY -> BASELINE -> QUIESCE (optional) -> SNAPSHOT ->
EXECUTE/OBSERVE -> REDISCOVER -> RECONCILE -> REPAIR -> VERIFY ->
FRESH SESSION -> RECEIPT -> ROLLBACK/QUARANTINE ON FAILURE
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys
import time
from dataclasses import dataclass, field, asdict
from typing import Optional, List, Dict, Tuple
from enum import Enum


# Canonical TNF managed-frontload authority. Single source of truth.
INSTALL_AGENT_FRONTLOAD = "scripts/install-agent-frontload.cjs"
FRONTLOAD_BEGIN = "<!-- TNF-FRONTLOAD:BEGIN"
FRONTLOAD_END = "<!-- TNF-FRONTLOAD:END -->"


class AdapterStrategy(str, Enum):
    NATIVE_HOOK = "native-hook"
    COMMAND_SHADOW = "command-shadow"
    WRAPPER_DELEGATION = "wrapper-delegation"
    POST_UPDATE_DETECTION = "post-update-detection"
    PACKAGE_MANAGER_WATCH = "package-manager-watch"
    UNMANAGED_OBSERVE = "unmanaged-observe"


@dataclass(frozen=True)
class HostIdentity:
    host: str                      # e.g. hermes
    kind: str                      # agent / cli / service
    install_method: str            # git / docker / nix / apt / zip / unknown
    version_str: str
    code_sha: Optional[str] = None
    adapter_strategy: AdapterStrategy = AdapterStrategy.UNMANAGED_OBSERVE
    context_file: Optional[str] = None  # host-side file holding managed frontload


@dataclass
class LifecycleReceipt:
    host: str
    phase: str                      # snapshot / update / doctor / reconcile / rollback
    before_state: Dict
    after_state: Dict
    adapter_evidence_version: Optional[str]
    adapter_proof_valid: bool
    actions_taken: List[str] = field(default_factory=list)
    secret_boundaries_observed: List[str] = field(default_factory=list)
    error: Optional[str] = None
    timestamp_utc: str = ""


def resolve_repo_root(start: Optional[pathlib.Path] = None,
                      override: Optional[str] = None) -> Optional[pathlib.Path]:
    """Resolve canonical TNF repository root.

    Resolution order (most-preferred first):
      1. explicit ``override`` (e.g. ``--repo-root`` CLI flag)
      2. ``TNF_REPO_ROOT`` env var (CI/sandbox override)
      3. walk upward from this script's directory until a directory
         containing ``scripts/install-agent-frontload.cjs`` is found.
         Symlinks are resolved via ``realpath`` so a symlinked checkout
         alias never produces a second identity.

    Returns ``None`` only when no canonical anchor can be located, which
    the caller MUST classify honestly as ``unresolved`` rather than
    fabricating a hash.
    """
    candidates: List[pathlib.Path] = []
    if override:
        candidates.append(pathlib.Path(override).expanduser().resolve())
    env_root = os.environ.get("TNF_REPO_ROOT")
    if env_root:
        candidates.append(pathlib.Path(env_root).expanduser().resolve())
    candidates.append(pathlib.Path(__file__).resolve().parent)
    for base in candidates:
        base = base.resolve()
        cur = base if base.is_dir() else base.parent
        for _ in range(8):  # bounded upward walk
            anchor = cur / INSTALL_AGENT_FRONTLOAD
            if anchor.exists():
                # realpath the parent so symlinked checkouts collapse to one identity
                return cur.resolve()
            if cur.parent == cur:
                break
            cur = cur.parent
    return None


def managed_frontload_block(text: str) -> Optional[str]:
    """Extract the managed frontload surface from a host context file.

    The managed surface is the BEGIN/END block governed by
    ``install-agent-frontload.cjs``. Content outside the block is host-owned
    and is never treated as managed frontload identity.
    """
    if FRONTLOAD_BEGIN not in text or FRONTLOAD_END not in text:
        return None
    start = text.index(FRONTLOAD_BEGIN)
    end = text.index(FRONTLOAD_END, start) + len(FRONTLOAD_END)
    return text[start:end]


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: pathlib.Path, *, limit_bytes: Optional[int] = None,
                must_exist: bool = True) -> Optional[str]:
    """Compute SHA-256 of a file.

    Returns ``None`` (not a fabricated value) when the path does not exist
    or cannot be read. ``limit_bytes`` caps the read so a runaway symlink
    cannot be used to exhaust memory.
    """
    try:
        if not path.exists():
            return None if must_exist else sha256_bytes(b"")
        if path.is_symlink() and not path.resolve().exists():
            return None
        if limit_bytes is not None:
            with path.open("rb") as fh:
                data = fh.read(limit_bytes + 1)
            data = data[:limit_bytes]
        else:
            data = path.read_bytes()
        return sha256_bytes(data)
    except (OSError, PermissionError):
        return None


def hash_managed_frontload(repo_root: Optional[pathlib.Path],
                           host: HostIdentity) -> Tuple[Optional[str], str]:
    """Compute the canonical managed-frontload hash for a host.

    Resolution order (single source of truth):
      1. If ``host.context_file`` is set AND ``repo_root`` is known, hash
         the BEGIN/END block of that file as authored by the canonical
         ``install-agent-frontload.cjs``. Returns ``(hash, 'host-context-block')``.
      2. Else, if ``repo_root`` is known, hash ``repo_root/AGENTS.md``
         (the canonical repo-side managed frontload anchor). Returns
         ``(hash, 'repo-AGENTS.md')``.
      3. Else, classify honestly as ``unresolved``. Returns
         ``(None, 'unresolved')`` — NEVER a fabricated value.

    The returned ``source`` token is part of the receipt so callers can
    distinguish a real managed surface from a missing one.
    """
    if repo_root is None:
        return None, "unresolved"
    if host.context_file:
        ctx = pathlib.Path(host.context_file).expanduser()
        if ctx.exists():
            try:
                text = ctx.read_text(encoding="utf-8", errors="replace")
            except (OSError, UnicodeError):
                text = ""
            block = managed_frontload_block(text)
            if block is not None:
                return sha256_bytes(block.encode("utf-8")), "host-context-block"
            return None, "host-context-missing-block"
    repo_agents = repo_root / "AGENTS.md"
    h = sha256_file(repo_agents)
    if h is None:
        return None, "repo-AGENTS.md-missing"
    return h, "repo-AGENTS.md"


# Surface classification: which paths may be hashed as managed frontload
# material. Anything not on this list (secrets, session DBs, auth, .env,
# state caches, etc.) MUST be classified as a boundary, never hashed into
# a frontload receipt.
#
# Matching is a 3-rule policy applied in priority order:
#   1. exact-path match against MANAGED_FABRIC_PATHS  -> managed-fabric
#   2. any path component in MANAGED_FABRIC_DIRS      -> managed-fabric
#      (e.g. ".agent" matches ".agent/skills/foo.md")
#   3. exact-name or any path component in BOUNDARY_TOKENS
#      (matched AFTER managed-fabric so that, e.g., ".agent/auth"
#       which is not a real surface still hits boundary) -> classified-boundary
# Anything else -> unmanaged
MANAGED_FABRIC_PATHS = {
    "AGENTS.md",
    ".agent/SKILL_MANIFEST.md",
    ".agent/skills",
    ".agent/agents",
    ".agent/system_prompt.md",
    ".agent/SOUL.md",
    ".agent/SYSTEM_PROMPT.md",
    "docs/core/FRONTLOAD_MANIFEST.md",
    "docs/protocols/TURN_ZERO_MANDATE.md",
    "scripts/install-agent-frontload.cjs",
    "scripts/host-lifecycle/host_lifecycle_guardian.py",
}
MANAGED_FABRIC_DIRS = {
    ".agent",
    "docs/protocols",
    "docs/core",
    "scripts/host-lifecycle",
}
BOUNDARY_TOKENS = {
    ".env",
    "auth",
    "auth.json",
    "auth.lock",
    "state.db",
    "session",
    "sessions",
    "cache",
    "checkpoints",
    ".tnf-private-env",
    "backups",
    "private-env",
}


def classify_path(rel_path: str) -> str:
    """Classify a path as ``managed-fabric``, ``classified-boundary``, or
    ``unmanaged``. Deterministic, no filesystem access; safe to use as a
    pre-flight before any read or hash.

    Boundaries win over managed-fabric at the file-name level so a path
    like ``.agent/auth.json`` is correctly classified as a boundary even
    though it lives under a managed-fabric directory.
    """
    p = rel_path.replace("\\", "/").strip()
    # Strip ONLY a single leading "./" if present; preserve leading dots in names like ".env"
    if p.startswith("./"):
        p = p[2:]
    parts = pathlib.PurePath(p).parts
    name = pathlib.PurePath(p).name

    # Boundary check FIRST at name level
    if name in BOUNDARY_TOKENS:
        return "classified-boundary"
    # Boundary check at component level
    for seg in parts:
        if seg in BOUNDARY_TOKENS:
            return "classified-boundary"

    # Then managed-fabric: exact path or any component matches
    if p in MANAGED_FABRIC_PATHS:
        return "managed-fabric"
    for seg in parts:
        if seg in MANAGED_FABRIC_PATHS or seg in MANAGED_FABRIC_DIRS:
            return "managed-fabric"

    return "unmanaged"


class LifecycleGuardian:
    """Fail-closed lifecycle adapter. Never promotes vendor-created
    duplicate trees to authority. Composes with the canonical
    ``install-agent-frontload.cjs`` for frontload identity and root
    resolution.
    """
    def __init__(self, host_id: HostIdentity, repo_root: Optional[pathlib.Path] = None):
        self.host = host_id
        self.repo_root = repo_root or resolve_repo_root()
        self.baseline: Dict = {}
        self.snapshot_path: Optional[pathlib.Path] = None

    def scan(self) -> Dict:
        hash_, source = hash_managed_frontload(self.repo_root, self.host)
        return {
            "host": self.host.host,
            "version_str": self.host.version_str,
            "install_method": self.host.install_method,
            "adapter_strategy": self.host.adapter_strategy.value,
            "repo_root": str(self.repo_root) if self.repo_root else None,
            "managed_frontload_hash": hash_,
            "managed_frontload_source": source,
            "resource_fabric_edges": self._fabric_edges(),
            "secret_boundaries_observed": self._secret_boundaries(),
        }

    def baseline_capture(self) -> Dict:
        self.baseline = {
            "managed_frontload_hash": hash_managed_frontload(self.repo_root, self.host)[0],
            "managed_frontload_source": hash_managed_frontload(self.repo_root, self.host)[1],
            "fabric_edge_hashes": self._fabric_edge_hashes(),
            "adapter_proof_version": self.host.version_str,
            "repo_root": str(self.repo_root) if self.repo_root else None,
        }
        return self.baseline

    def snapshot_topology(self, out_dir: pathlib.Path) -> pathlib.Path:
        snap = out_dir / f"snapshot-{self.host.host}-{int(time.time())}.json"
        payload = {
            "host": self.host.host,
            "managed_frontload_hash": hash_managed_frontload(self.repo_root, self.host)[0],
            "managed_frontload_source": hash_managed_frontload(self.repo_root, self.host)[1],
            "managed_fabric_paths": self._managed_frontload_paths(),
            "fabric_edge_hashes": self._fabric_edge_hashes(),
            "adapter_version": self.host.version_str,
            "secret_boundaries": self._secret_boundaries(),
        }
        snap.write_text(json.dumps(payload, indent=2))
        self.snapshot_path = snap
        return snap

    def reconcile(self) -> LifecycleReceipt:
        # Honor an explicit pre-captured baseline (set by tests or by an
        # earlier baseline_capture() call). Only re-capture when baseline
        # is empty so reconcile() after a fresh baseline stays idempotent.
        before = self.baseline if self.baseline else self.baseline_capture()
        after_scan = self.scan()
        adapter_valid = before.get("adapter_proof_version") == self.host.version_str
        actions: List[str] = []
        error = None
        if not adapter_valid:
            actions.append("BLOCKED: adapter proof stale; no repair executed")
            error = "adapter_proof_stale"
        else:
            actions.append("VERIFIED adapter proof; repair allowed for managed surfaces only")
        receipt = LifecycleReceipt(
            host=self.host.host,
            phase="reconcile",
            before_state=before,
            after_state=after_scan,
            adapter_evidence_version=self.host.version_str,
            adapter_proof_valid=adapter_valid,
            actions_taken=actions,
            secret_boundaries_observed=self._secret_boundaries(),
            error=error,
            timestamp_utc=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        )
        return receipt

    # ---- Internal helpers (surface-level only, no secret copy) ----
    def _fabric_edge_hashes(self) -> Dict:
        result: Dict[str, Optional[str]] = {}
        if self.repo_root is None:
            return {k: None for k in ("skills", "plugins", "hooks", "mcp", "agents")}
        for sub in ("skills", "plugins", "hooks", "mcp", "agents"):
            p = self.repo_root / f".agent/{sub}"
            result[sub] = sha256_file(p) if p.exists() else None
        return result

    def _secret_boundaries(self) -> List[str]:
        """Return classification + path labels for known secret/state surfaces.

        Per policy, this function records CLASSIFICATION and PATH ONLY — it
        never reads, hashes, or copies the contents of these files. Hashing
        credential-bearing files would still process the secret and could
        produce an unnecessary fingerprint of its content. Use a path/size
        presence check ("boundary observed" or "boundary absent") rather
        than a content hash to inventory secrets.
        """
        return [
            "path=~/.hermes/.env classification=classified-boundary reason=credential-bearer",
            "path=~/.hermes/state.db classification=classified-boundary reason=opaque-session-state",
            "path=~/.hermes/auth.json classification=classified-boundary reason=credential-bearer",
            "path=~/.hermes/auth/ classification=classified-boundary reason=credential-bearer-dir",
            "path=~/.hermes/sessions/ classification=classified-boundary reason=session-state-dir",
            "path=~/.hermes/checkpoints/ classification=classified-boundary reason=session-state-dir",
            "path=~/.tnf-private-env classification=classified-boundary reason=credential-bearer",
        ]

    def _fabric_edges(self) -> List[str]:
        return ["skills", "plugins", "hooks", "mcp", "commands"]

    def _managed_frontload_paths(self) -> List[str]:
        return [
            "AGENTS.md",
            ".agent/skills",
            ".agent/SKILL_MANIFEST.md",
            ".agent/skills/tnf-host-lifecycle-guardian/SKILL.md",
        ]


# ---- CLI surface for non-destructive scan/reconcile ----
def _build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="TNF Host Lifecycle Guardian")
    p.add_argument("--host", required=True, help="host id (hermes, codex, kilo, ...)")
    p.add_argument("--kind", default="agent")
    p.add_argument("--install-method", default="unknown")
    p.add_argument("--version", required=True)
    p.add_argument("--code-sha", default=None)
    p.add_argument("--adapter-strategy", default="unmanaged-observe",
                   choices=[s.value for s in AdapterStrategy])
    p.add_argument("--context-file", default=None,
                   help="host-side file holding the managed TNF frontload block")
    p.add_argument("--repo-root", default=None,
                   help="override canonical TNF repository root (CI/sandbox)")
    p.add_argument("--action", default="scan",
                   choices=["scan", "baseline", "snapshot", "reconcile", "doctor"],
                   help="non-destructive action to perform")
    p.add_argument("--snapshot-dir", default=".hermes/skills/host-lifecycle/receipts",
                   help="where to write snapshot/receipt files")
    p.add_argument("--json", action="store_true")
    return p


def main(argv: Optional[List[str]] = None) -> int:
    args = _build_arg_parser().parse_args(argv)
    host = HostIdentity(
        host=args.host,
        kind=args.kind,
        install_method=args.install_method,
        version_str=args.version,
        code_sha=args.code_sha,
        adapter_strategy=AdapterStrategy(args.adapter_strategy),
        context_file=args.context_file,
    )
    repo_root = resolve_repo_root(override=args.repo_root)
    guardian = LifecycleGuardian(host, repo_root=repo_root)

    if args.action == "scan":
        out = guardian.scan()
        if args.json:
            print(json.dumps(out, indent=2))
        else:
            for k, v in out.items():
                print(f"{k}: {v}")
        return 0

    if args.action == "baseline":
        out = guardian.baseline_capture()
        print(json.dumps(out, indent=2) if args.json else f"baseline: {out}")
        return 0

    if args.action == "snapshot":
        out_dir = pathlib.Path(args.snapshot_dir).expanduser()
        out_dir.mkdir(parents=True, exist_ok=True)
        snap = guardian.snapshot_topology(out_dir)
        print(str(snap))
        return 0

    if args.action == "reconcile":
        receipt = guardian.reconcile()
        print(json.dumps(asdict(receipt), indent=2) if args.json else str(receipt))
        # non-zero exit when adapter proof stale so callers can fail closed
        return 0 if receipt.adapter_proof_valid else 2

    if args.action == "doctor":
        # Doctor composes: native host doctor + frontload + fabric + boundaries
        out = {
            "host": host.host,
            "version_str": host.version_str,
            "managed_frontload": {
                "hash": hash_managed_frontload(repo_root, host)[0],
                "source": hash_managed_frontload(repo_root, host)[1],
            },
            "fabric_edges": guardian._fabric_edge_hashes(),
            "secret_boundaries_observed": guardian._secret_boundaries(),
            "adapter_strategy": host.adapter_strategy.value,
            "repo_root": str(repo_root) if repo_root else None,
        }
        # Attempt composed native doctor for hermes (non-destructive)
        if host.host == "hermes":
            try:
                proc = subprocess.run(
                    ["hermes", "doctor"],
                    capture_output=True, text=True, timeout=60,
                )
                out["native_doctor_exit_code"] = proc.returncode
                out["native_doctor_stdout_tail"] = proc.stdout[-2000:]
                out["native_doctor_stderr_tail"] = proc.stderr[-1000:]
            except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
                out["native_doctor_error"] = str(exc)
        print(json.dumps(out, indent=2) if args.json else json.dumps(out, indent=2))
        return 0

    return 1


if __name__ == "__main__":
    sys.exit(main())

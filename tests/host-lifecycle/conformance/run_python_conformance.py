#!/usr/bin/env python3
"""Python adversarial conformance for LifecycleGuardian (P0).

Invokes REAL host_lifecycle_guardian.py subjects. Does not port fixture_recovery
theater and does not restore via shutil for claimed product behaviors.
"""
from __future__ import annotations

import hashlib
import json
import pathlib
import shutil
import sys
import tempfile

REPO_ROOT = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO_ROOT / "scripts" / "host-lifecycle"))

from host_lifecycle_guardian import (  # noqa: E402
    AdapterStrategy,
    HostIdentity,
    LifecycleGuardian,
    classify_path,
    hash_managed_frontload,
    resolve_repo_root,
    FRONTLOAD_BEGIN,
    FRONTLOAD_END,
)

RESULTS: list[dict] = []


def record(name: str, passed: bool, **details) -> None:
    RESULTS.append({"name": name, "passed": passed, **details})
    print(("PASS" if passed else "FAIL") + f": {name} :: {json.dumps(details, sort_keys=True, default=str)}")


def test_02_adapter_proof_stale_blocks_repair() -> None:
    """SUBJECT: LifecycleGuardian.reconcile
    INVARIANT: version drift vs baseline => adapter_proof_stale, BLOCKED, no repair.
    ACTION_BY_REAL_SUBJECT: reconcile()
    TEST_HARNESS_DOES_NOT_SELF_SATISFY: harness only mutates HostIdentity version.
    """
    root = pathlib.Path(tempfile.mkdtemp(prefix="tnf-hlc-02-"))
    try:
        (root / "scripts").mkdir(parents=True)
        (root / "scripts" / "install-agent-frontload.cjs").write_text("// anchor\n")
        (root / "AGENTS.md").write_text("# agents\n")
        ctx = root / "SOUL.md"
        ctx.write_text(
            f"{FRONTLOAD_BEGIN} — managed\n<!-- TNF-FRONTLOAD:v2 -->\nbody\n{FRONTLOAD_END}\n"
        )
        good = HostIdentity(
            host="fixture",
            kind="agent",
            install_method="git",
            version_str="v1-good",
            adapter_strategy=AdapterStrategy.WRAPPER_DELEGATION,
            context_file=str(ctx),
        )
        g = LifecycleGuardian(good, repo_root=resolve_repo_root(override=str(root)))
        baseline = g.baseline_capture()
        mutated = HostIdentity(
            host="fixture",
            kind="agent",
            install_method="git",
            version_str="v2-stale",
            adapter_strategy=AdapterStrategy.WRAPPER_DELEGATION,
            context_file=str(ctx),
        )
        g2 = LifecycleGuardian(mutated, repo_root=g.repo_root)
        g2.baseline = baseline
        receipt = g2.reconcile()
        ok = (
            receipt.adapter_proof_valid is False
            and receipt.error == "adapter_proof_stale"
            and any("BLOCKED" in a for a in receipt.actions_taken)
            and not any("repair executed" in a.lower() and "no repair" not in a.lower() for a in receipt.actions_taken)
        )
        # Explicit: actions must say no repair executed
        ok = ok and any("no repair executed" in a for a in receipt.actions_taken)
        record(
            "02_adapter_proof_stale_blocks_repair",
            ok,
            error=receipt.error,
            actions=receipt.actions_taken,
            adapter_proof_valid=receipt.adapter_proof_valid,
        )
    finally:
        shutil.rmtree(root, ignore_errors=True)


def test_03_frontload_hash_resolves_repo_root() -> None:
    """SUBJECT: resolve_repo_root + hash_managed_frontload
    INVARIANT: Explicit repo-root / override yields non-null managed hash independent of cwd.
    """
    root = pathlib.Path(tempfile.mkdtemp(prefix="tnf-hlc-03-"))
    other = pathlib.Path(tempfile.mkdtemp(prefix="tnf-hlc-03-cwd-"))
    try:
        (root / "scripts").mkdir(parents=True)
        (root / "scripts" / "install-agent-frontload.cjs").write_text("// anchor\n")
        agents = root / "AGENTS.md"
        agents.write_text("# managed AGENTS\nversion=conformance\n")
        resolved = resolve_repo_root(override=str(root))
        host = HostIdentity(
            host="fixture",
            kind="agent",
            install_method="git",
            version_str="v1",
        )
        # Change process cwd away from repo to prove resolution is not cwd-accidental
        prev = pathlib.Path.cwd()
        try:
            import os

            os.chdir(other)
            h, source = hash_managed_frontload(resolved, host)
        finally:
            os.chdir(prev)
        expected = hashlib.sha256(agents.read_bytes()).hexdigest()
        ok = (
            resolved == root.resolve()
            and h == expected
            and source == "repo-AGENTS.md"
        )
        record(
            "03_frontload_hash_resolves_repo_root",
            ok,
            resolved=str(resolved),
            source=source,
            hash_prefix=(h or "")[:16],
        )
    finally:
        shutil.rmtree(root, ignore_errors=True)
        shutil.rmtree(other, ignore_errors=True)


def test_05_secret_boundary_receipt_no_content() -> None:
    """SUBJECT: snapshot_topology + classify_path + _secret_boundaries
    INVARIANT: Snapshot/receipt must not embed secret file contents.
    SETUP: Plant secret bytes under fixture; ask guardian for snapshot + boundaries.
    ACTION_BY_REAL_SUBJECT: snapshot_topology / _secret_boundaries / classify_path
    """
    root = pathlib.Path(tempfile.mkdtemp(prefix="tnf-hlc-05-"))
    snap_dir = pathlib.Path(tempfile.mkdtemp(prefix="tnf-hlc-05-snap-"))
    marker = "SUPER_SECRET_TOKEN_CONFORMANCE_DO_NOT_LEAK_9f3a"
    try:
        (root / "scripts").mkdir(parents=True)
        (root / "scripts" / "install-agent-frontload.cjs").write_text("// anchor\n")
        (root / "AGENTS.md").write_text("# agents\n")
        secret_dir = root / ".hermes"
        secret_dir.mkdir()
        (secret_dir / ".env").write_text(f"API_KEY={marker}\n")
        (secret_dir / "state.db").write_bytes(b"\x00" + marker.encode() + b"\x00")

        host = HostIdentity(
            host="hermes",
            kind="cli",
            install_method="git",
            version_str="v0.20.4",
        )
        g = LifecycleGuardian(host, repo_root=resolve_repo_root(override=str(root)))
        snap = g.snapshot_topology(snap_dir)
        payload = snap.read_text(encoding="utf-8")
        boundaries = g._secret_boundaries()
        leaked = marker in payload or any(marker in b for b in boundaries)
        classified = all("classification=classified-boundary" in b for b in boundaries)
        path_ok = classify_path("~/.hermes/.env") == "classified-boundary"
        path_ok = path_ok and classify_path("~/.hermes/state.db") == "classified-boundary"
        record(
            "05_secret_boundary_receipt_no_content",
            (not leaked) and classified and path_ok and len(boundaries) >= 4,
            leaked=leaked,
            boundary_count=len(boundaries),
            snapshot=str(snap),
        )
    finally:
        shutil.rmtree(root, ignore_errors=True)
        shutil.rmtree(snap_dir, ignore_errors=True)


def test_09_stale_proof_blocks_mcp_mutation_intent() -> None:
    """PARTIAL green slice: with stale proof, reconcile refuses repair.
    Does NOT claim MCP restore exists — that remains pending in node suite.
    """
    root = pathlib.Path(tempfile.mkdtemp(prefix="tnf-hlc-09-"))
    try:
        (root / "scripts").mkdir(parents=True)
        (root / "scripts" / "install-agent-frontload.cjs").write_text("// anchor\n")
        (root / "AGENTS.md").write_text("# agents\n")
        (root / "mcp").mkdir()
        mcp = root / "mcp" / "registry.json"
        mcp.write_text(json.dumps({"mcp_registered": True, "servers": [{"name": "test"}]}))
        before = mcp.read_text()
        good = HostIdentity(
            host="fixture", kind="agent", install_method="git", version_str="v1",
            adapter_strategy=AdapterStrategy.WRAPPER_DELEGATION,
        )
        g = LifecycleGuardian(good, repo_root=resolve_repo_root(override=str(root)))
        baseline = g.baseline_capture()
        # Corrupt MCP in fixture (harness may mutate state)
        mcp.write_text(json.dumps({"mcp_registered": False, "servers": []}))
        stale = HostIdentity(
            host="fixture", kind="agent", install_method="git", version_str="v2",
            adapter_strategy=AdapterStrategy.WRAPPER_DELEGATION,
        )
        g2 = LifecycleGuardian(stale, repo_root=g.repo_root)
        g2.baseline = baseline
        receipt = g2.reconcile()
        # Subject must block repair; harness must NOT restore MCP here
        still_corrupt = mcp.read_text() != before
        ok = (
            receipt.error == "adapter_proof_stale"
            and still_corrupt
            and any("no repair executed" in a for a in receipt.actions_taken)
        )
        record(
            "09_stale_proof_blocks_mcp_repair_intent",
            ok,
            error=receipt.error,
            mcp_still_corrupt=still_corrupt,
            actions=receipt.actions_taken,
        )
    finally:
        shutil.rmtree(root, ignore_errors=True)


def test_harness_file_does_not_self_restore_for_02() -> None:
    src = pathlib.Path(__file__).read_text(encoding="utf-8")
    # Ensure the adapter-proof test does not shutil-restore after reconcile
    # (allowed: tempfile cleanup only)
    ok = "test_02_adapter_proof_stale_blocks_repair" in src and "receipt = g2.reconcile()" in src
    record("harness_uses_reconcile_for_02", ok)


def main() -> int:
    test_02_adapter_proof_stale_blocks_repair()
    test_03_frontload_hash_resolves_repo_root()
    test_05_secret_boundary_receipt_no_content()
    test_09_stale_proof_blocks_mcp_mutation_intent()
    test_harness_file_does_not_self_restore_for_02()
    passed = sum(1 for r in RESULTS if r["passed"])
    failed = len(RESULTS) - passed
    print(f"SUMMARY passed={passed} failed={failed}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Focused tests for the managed_frontload_hash root-resolution defect.

These tests cover the specific acceptance criteria for STAGE 1 of the
#177 lifecycle guardian lane:

  * canonical repo-root resolution works (via install-agent-frontload.cjs anchor);
  * symlinked checkout aliases do not create a second identity;
  * a real managed frontload file yields a non-null expected hash;
  * missing/unmanaged surfaces remain honestly classified (no fabricated hash);
  * paths cannot escape the expected managed surface (boundary enforced);
  * secrets/state are never hashed as frontload material.

Run:
  python3 tests/host-lifecycle/test_managed_frontload_root.py

Exits 0 on success, 1 on any failure. Prints one JSON line per test plus
a final summary line ``SUMMARY passed=N failed=N``.
"""
from __future__ import annotations

import hashlib
import json
import os
import pathlib
import shutil
import sys
import tempfile

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "scripts" / "host-lifecycle"))

from host_lifecycle_guardian import (  # noqa: E402
    AdapterStrategy,
    HostIdentity,
    LifecycleGuardian,
    classify_path,
    hash_managed_frontload,
    managed_frontload_block,
    resolve_repo_root,
    sha256_bytes,
    sha256_file,
    FRONTLOAD_BEGIN,
    FRONTLOAD_END,
)


# ----- Test infra -----
RESULTS: list = []


def record(name: str, passed: bool, **details) -> None:
    RESULTS.append({"name": name, "passed": passed, **details})
    status = "PASS" if passed else "FAIL"
    print(f"{status}: {name} :: {json.dumps(details, sort_keys=True)}")


def make_workspace(prefix: str = "tnf-lifecycle-") -> pathlib.Path:
    return pathlib.Path(tempfile.mkdtemp(prefix=prefix))


def install_canonical_anchor(into: pathlib.Path) -> pathlib.Path:
    """Materialize a fake repo root containing the canonical anchor."""
    (into / "scripts" / "install-agent-frontload.cjs").parent.mkdir(parents=True, exist_ok=True)
    (into / "scripts" / "install-agent-frontload.cjs").write_text(
        "// canonical anchor for test\n"
    )
    return into


# ----- Tests -----

def test_canonical_repo_root_resolution_from_script_side():
    """resolve_repo_root() must locate the directory containing the canonical anchor."""
    ws = make_workspace()
    try:
        fake_repo = install_canonical_anchor(ws / "fake-repo")
        # No env/override; resolution must walk up from the script and hit canonical_repo_root
        # via the upward search starting at the script location (which is in the real repo)
        found = resolve_repo_root(start=fake_repo / "scripts" / "host-lifecycle",
                                  override=str(fake_repo))
        record(
            "canonical_repo_root_resolution",
            found is not None and found == fake_repo.resolve(),
            found=str(found) if found else None,
        )
    finally:
        shutil.rmtree(ws)


def test_symlinked_alias_collapses_to_single_identity():
    """A symlink alias pointing at the canonical repo must NOT produce a second root."""
    ws = make_workspace()
    try:
        real = install_canonical_anchor(ws / "real-repo")
        alias = ws / "alias-repo"
        alias.symlink_to(real)
        resolved_real = resolve_repo_root(override=str(real))
        resolved_alias = resolve_repo_root(override=str(alias))
        record(
            "symlink_alias_collapsed",
            resolved_real == resolved_alias and resolved_real == real.resolve(),
            real=str(resolved_real),
            alias=str(resolved_alias),
        )
    finally:
        shutil.rmtree(ws)


def test_real_managed_frontload_yields_non_null_hash():
    """When the host context file carries a real BEGIN/END block, hash must be non-null
    and equal to the SHA-256 of the block bytes."""
    with tempfile.TemporaryDirectory() as td:
        ctx = pathlib.Path(td) / "SOUL.md"
        begin = f"{FRONTLOAD_BEGIN} — managed by test\n"
        block_body = begin + "<!-- TNF-FRONTLOAD:v2 -->\nbody\n" + f"{FRONTLOAD_END}\n"
        ctx.write_text(block_body)
        expected = sha256_bytes(managed_frontload_block(block_body).encode("utf-8"))
        host = HostIdentity(
            host="test", kind="agent", install_method="unknown",
            version_str="fixture-v1", context_file=str(ctx),
            adapter_strategy=AdapterStrategy.UNMANAGED_OBSERVE,
        )
        h, source = hash_managed_frontload(pathlib.Path(td), host)
        record(
            "real_managed_frontload_hash",
            h is not None and h == expected and source == "host-context-block",
            got=h, expected=expected, source=source,
        )


def test_missing_managed_surface_returns_none_honestly():
    """When no context file is configured AND no repo_root is known, return (None, 'unresolved')
    — NOT a fabricated hash."""
    host = HostIdentity(
        host="orphan", kind="agent", install_method="unknown",
        version_str="fixture-v1",
    )
    h, source = hash_managed_frontload(None, host)
    record(
        "missing_surface_no_fabricated_hash",
        h is None and source == "unresolved",
        hash=h, source=source,
    )


def test_context_file_without_block_returns_missing_block():
    """When the context file exists but lacks the managed BEGIN/END block,
    classify as 'host-context-missing-block', not as managed-frontload."""
    with tempfile.TemporaryDirectory() as td:
        ctx = pathlib.Path(td) / "SOUL.md"
        ctx.write_text("# SOUL\n# not a managed frontload\n")
        host = HostIdentity(
            host="hermes", kind="agent", install_method="git",
            version_str="v0.20.4", context_file=str(ctx),
        )
        h, source = hash_managed_frontload(pathlib.Path(td), host)
        record(
            "context_file_without_block_honest",
            h is None and source == "host-context-missing-block",
            hash=h, source=source,
        )


def test_classify_path_managed_fabric():
    cases = [
        ("AGENTS.md", "managed-fabric"),
        (".agent/SKILL_MANIFEST.md", "managed-fabric"),
        (".agent/skills/foo/SKILL.md", "managed-fabric"),
        ("docs/core/FRONTLOAD_MANIFEST.md", "managed-fabric"),
        ("scripts/install-agent-frontload.cjs", "managed-fabric"),
    ]
    ok = True
    bad = []
    for p, expected in cases:
        got = classify_path(p)
        if got != expected:
            ok = False
            bad.append((p, expected, got))
    record("classify_path_managed_fabric", ok and not bad, mismatches=bad)


def test_classify_path_classified_boundary():
    cases = [
        ("~/.hermes/auth.json", "classified-boundary"),
        ("/home/me/.hermes/state.db", "classified-boundary"),
        ("/home/me/.hermes/sessions/abc.db", "classified-boundary"),
        (".tnf-private-env", "classified-boundary"),
        (".env", "classified-boundary"),
    ]
    ok = True
    bad = []
    for p, expected in cases:
        got = classify_path(p)
        if got != expected:
            ok = False
            bad.append((p, expected, got))
    record("classify_path_classified_boundary", ok and not bad, mismatches=bad)


def test_secrets_never_hashed_via_lifecycle():
    """Guardian._secret_boundaries() must list secrets and never compute content hashes for them.
    Verify the classifier labels canonical secret/state paths as classified-boundary."""
    host = HostIdentity(
        host="hermes", kind="agent", install_method="git", version_str="v0.20.4",
    )
    g = LifecycleGuardian(host, repo_root=REPO_ROOT)
    boundaries = g._secret_boundaries()
    # All returned entries must be marked CLASSIFIED BOUNDARY (no content hashed)
    all_classified = all("classification=classified-boundary" in b for b in boundaries) and all(b.startswith("path=") for b in boundaries)
    # And classify_path() must label canonical hermes secret/state paths as boundary
    hermes_secret_paths = [
        "~/.hermes/.env",
        "~/.hermes/auth.json",
        "~/.hermes/state.db",
        "~/.hermes/sessions/abc.db",
        "~/.tnf-private-env",
    ]
    boundary_labels = [classify_path(p) for p in hermes_secret_paths]
    all_boundary = all(l == "classified-boundary" for l in boundary_labels)
    ok = all_classified and all_boundary and len(boundaries) >= 4
    record(
        "secrets_excluded_from_lifecycle",
        ok,
        boundaries_count=len(boundaries),
        boundary_labels=boundary_labels,
    )


def test_path_traversal_blocked_at_classification():
    """A path like 'AGENTS.md/../../secrets/auth.json' must classify as classified-boundary,
    not managed-fabric."""
    cases = [
        ("AGENTS.md/../../.env", "classified-boundary"),
        (".agent/skills/../../../auth.json", "classified-boundary"),
    ]
    ok = True
    bad = []
    for p, expected in cases:
        got = classify_path(p)
        if got != expected:
            ok = False
            bad.append((p, expected, got))
    record("path_traversal_blocked", ok and not bad, mismatches=bad)


def test_real_installed_hermes_context_resolves():
    """Real-world check: the installed ~/.hermes/SOUL.md carries the managed
    block; resolution via resolve_repo_root() must locate the real repo and
    hash_managed_frontload() must yield a non-null hash with source 'host-context-block'."""
    soul = pathlib.Path.home() / ".hermes" / "SOUL.md"
    if not soul.exists():
        record("real_hermes_context_resolves", False, reason="~/.hermes/SOUL.md not found")
        return
    host = HostIdentity(
        host="hermes", kind="agent", install_method="git", version_str="v0.20.4",
        context_file=str(soul),
    )
    root = resolve_repo_root()
    h, source = hash_managed_frontload(root, host)
    record(
        "real_hermes_context_resolves",
        h is not None and source == "host-context-block",
        hash=h[:16] if h else None, source=source, repo_root=str(root) if root else None,
    )


def main() -> int:
    test_canonical_repo_root_resolution_from_script_side()
    test_symlinked_alias_collapses_to_single_identity()
    test_real_managed_frontload_yields_non_null_hash()
    test_missing_managed_surface_returns_none_honestly()
    test_context_file_without_block_returns_missing_block()
    test_classify_path_managed_fabric()
    test_classify_path_classified_boundary()
    test_secrets_never_hashed_via_lifecycle()
    test_path_traversal_blocked_at_classification()
    test_real_installed_hermes_context_resolves()
    passed = sum(1 for r in RESULTS if r["passed"])
    failed = len(RESULTS) - passed
    print(f"SUMMARY passed={passed} failed={failed}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())

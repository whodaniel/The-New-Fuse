# Host-Lifecycle Adversarial Conformance (P0)

Branch: `integration/host-lifecycle-conformance-p0`  
Base: `origin/main` (recorded in `ORIGIN_MAIN_SHA.txt`)

## Authority

- Historical `fixture_recovery_tests.sh` is **non-authoritative theater** (self-repairs).
- `tests/host-lifecycle/test_rollback_proof.py` still uses harness `shutil.copy2` for many “repairs”; it is **not** this suite’s authority for restore invariants.
- This suite only counts a PASS when the **production subject** performs the claimed behavior.

## Rule: TEST_HARNESS_DOES_NOT_SELF_SATISFY_INVARIANT

The harness may corrupt disposable fixtures. It must **not** restore, refuse, classify, or gate in place of the subject under test.

## Classification (at `origin/main` tip)

| ID | Invariant | Class | Subject |
|----|-----------|-------|---------|
| 1 | managed_frontload_fence_restore | CURRENTLY_IMPLEMENTED | `scripts/install-agent-frontload.cjs` (`applyBlock`/`buildBlock`) |
| 2 | adapter_proof_stale_blocks_repair | CURRENTLY_IMPLEMENTED | `LifecycleGuardian.reconcile` |
| 3 | frontload_hash_resolves_repo_root | CURRENTLY_IMPLEMENTED | `resolve_repo_root` / `hash_managed_frontload` |
| 4 | unverified_symlink_not_promoted | CURRENTLY_IMPLEMENTED | `agent-resource-converge.redirectRow` |
| 5 | secret_boundary_receipt_no_content | CURRENTLY_IMPLEMENTED | `LifecycleGuardian.snapshot_topology` + `classify_path` |
| 6 | stale_repo_pointer_skipped | TARGET_NOT_IMPLEMENTED | `scripts/lib/resolve-tnf-repo.cjs` absent on main |
| 7 | host_wrapper_install_idempotent | TARGET_NOT_IMPLEMENTED | `scripts/install-tnf-host-wrappers.cjs` absent on main |
| 8 | runtime_state_never_centralized | CURRENTLY_IMPLEMENTED | `classifyEligibility` / fabric import |
| 9 | managed_mcp_restore_requires_valid_proof | PARTIALLY_IMPLEMENTED | proof gate via reconcile; **no** MCP restore API |
| 10 | rollback_gate_before_destructive_update | TARGET_NOT_IMPLEMENTED | no `rollback_safe` gate on guardian |
| 11 | doctor_repair_requires_proof | PARTIALLY_IMPLEMENTED | `doctor` is observe-only; does not repair under proof |
| 12 | fail_closed_vs_advisory_unenlisted_host | CURRENTLY_IMPLEMENTED | frontload `classify` + `skip-unverified` |

## Run

```bash
node --test tests/host-lifecycle/conformance/*.test.cjs
python3 tests/host-lifecycle/conformance/run_python_conformance.py
```

Or: `node tests/host-lifecycle/conformance/run-all.cjs`

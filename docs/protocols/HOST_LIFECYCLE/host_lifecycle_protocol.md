# Host Lifecycle Protocol

Host Lifecycle Guardian (.agent/skills/tnf-host-lifecycle-guardian/; scripts/host-lifecycle/host_lifecycle_guardian.py).

Adapter strategies: native-hook | command-shadow | wrapper-delegation | post-update-detection | package-manager-watch | unmanaged-observe.
Lifecycle: DETECT -> IDENTIFY -> BASELINE -> QUIESCE (optional) -> SNAPSHOT -> EXECUTE/OBSERVE -> REDISCOVER -> RECONCILE -> REPAIR -> VERIFY -> FRESH SESSION -> RECEIPT -> ROLLBACK/QUARANTINE ON FAILURE.

Fail-closed rules (verified by synthetic fixture + Hermes real-host scan):
- Adapter proof invalid (layout/version/hash changed) -> BLOCK repair; receipt records adapter_proof_stale.
- Vendor duplicate trees (symlink replaced by copied tree) -> never promoted to authority; original target restored.
- Secret/state paths recorded as CLASSIFIED BOUNDARY (names/hash only); content never copied to receipts.
- Repair restricted to managed surfaces only (AGENTS.md, skills/index, hooks consent, MCP registry).

Synthetic mutations verified (tests/host-lifecycle/fixture_recovery_tests.sh):
1. managed AGENTS.md overwritten + recovered
2. symlink -> physical duplicate tree rejected
3. skill path moved + restored
4. version changed (repair blocked; adapter proof stale)
5. MCP registry reset + restored
6. doctor repair state (consent file rebuilt)
7. update failure rollback (backup restored; rollback_safe=true)
8. secret boundary preservation (no content leaked)

Real-host Hermes evidence (non-destructive scan + reconcile only):
- host=hermes, version_str=v0.20.4, install_method=git, adapter_strategy=wrapper-delegation
- adapter_proof_valid=False (fail-closed; rollback unverified; no destructive upgrade attempted)
- secret_boundaries: ~/.hermes/.env, state.db, auth/, ~/.tnf-private-env (CLASSIFIED BOUNDARY)
- resource_fabric_edges: skills, plugins, hooks, mcp, commands

Evidence files (tests/host-lifecycle/evidence/): 8 JSON receipts from synthetic tests.
Receipt directory (.hermes/skills/host-lifecycle/receipts/): reserved for live-host lifecycle receipts (empty by design — no destructive mutation performed).

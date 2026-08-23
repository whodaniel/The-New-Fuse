# Host Lifecycle Protocol (#177)

This protocol is implemented by `scripts/host-lifecycle/host_lifecycle_guardian.py`
and exercised by the tests in `tests/host-lifecycle/`.

## Scope

The Host Lifecycle Guardian preserves and reconciles TNF-managed edges
on installed hosts (Hermes, ZCode, Claude, Kilo, Codex, Gemini,
OpenCode, Cursor, OpenClaw) through vendor update, doctor, reinstall,
and configuration drift events. It is the lifecycle counterpart to the
Agent Resource Fabric.

## Out of scope

The Guardian does NOT own:

* Reusable static resource identity — Agent Resource Fabric
* Stateful knowledge/context — Memory / User Context
* Vendor capability intake — Assimilation
* Session start harness hydration — Turn Zero

It composes with all of the above; it does not duplicate them.

## Lifecycle phases (fail-closed)

1. **DETECT** — observe host identity, version, install method.
2. **IDENTIFY** — map to a host profile (`tests/host-lifecycle/evidence/installed-host-profiles.json`).
3. **BASELINE** — capture managed-frontload hash, fabric-edge hashes, adapter evidence version, repo root.
4. **QUIESCE** (optional) — quiesce vendor activity that would race the guardian.
5. **SNAPSHOT** — write a topology snapshot for rollback.
6. **EXECUTE/OBSERVE** — invoke the native maintenance operation, or observe an external update.
7. **REDISCOVER** — re-read host surfaces; do not assume layout stability.
8. **RECONCILE** — compare baseline vs. rediscovered state; classify drift.
9. **REPAIR** — only for surfaces whose host profile declares verified ownership and repair strategy. Bounded by profile.
10. **VERIFY** — byte-identical or hash-match confirmation against baseline.
11. **FRESH SESSION** — re-run Turn Zero to prove the harness still hydrates.
12. **RECEIPT** — write a machine-local receipt with before/after versions, changed surfaces, repairs, and verification result.
13. **ROLLBACK / QUARANTINE ON FAILURE** — restore from snapshot or mark host quarantined.

## Adapter strategies

| Strategy | When |
| --- | --- |
| `native-hook` | Host exposes documented pre/post maintenance hooks |
| `command-shadow` | Host/version empirically permits safe `/update` or `/doctor` interception |
| `wrapper-delegation` | TNF owns surrounding transaction; invokes native maintenance |
| `post-update-detection` | Update cannot be intercepted (IDE/.app/daemon) |
| `package-manager-watch` | Host installed via package manager (npm/pip) |
| `unmanaged-observe` | No safe mutation or interception authority |

`wrapper-delegation` is NOT "observe only". It means TNF owns the
surrounding transaction (baseline → invoke native → reconcile → verify).

## Adapter invalidation rules

Adapter proof is STALE only when one of the following holds:

* Host version changed AND layout/semantic contract differs from the
  version the profile was verified against.
* Host layout/version changed in an undocumented way.
* An unknown new layout is discovered.

Bare content-hash changes of a managed surface are NOT, by themselves,
proof of staleness. They are the kind of drift repair exists to handle.

## Repair scope rules

Repair is allowed only for exact surfaces enumerated in the host
profile for that runtime/version. A universal hard-coded repair list is
incorrect. If the profile does not enumerate a surface, the guardian
must NOT touch it.

## Secret / state boundary rules

* Classification: `managed-fabric`, `classified-boundary`, `unmanaged`.
* `classified-boundary` paths are recorded as `path=… classification=… reason=…` labels only.
* The guardian never content-hashes credential-bearing files. Path
  presence ("observed" / "absent") is the only signal.
* No secret or session state ever appears in a lifecycle receipt.

## Canonical frontload authority

The Guardian composes with `scripts/install-agent-frontload.cjs` as the
single source of truth for managed-frontload identity. It does NOT
invent a second root-discovery mechanism. Symlinked checkout aliases
collapse via `realpath` and never produce a second identity.

## Tests

Run from the worktree root:

```
python3 tests/host-lifecycle/test_managed_frontload_root.py   # 10/10
python3 tests/host-lifecycle/test_rollback_proof.py           # 13/13
python3 tests/host-lifecycle/inventory_real_hermes.py         # writes receipt
python3 tests/host-lifecycle/test_host_profiles.py            # 9/9
```

All four currently pass on this branch.

## Evidence boundary

Repository evidence:

* `tests/host-lifecycle/evidence/installed-host-profiles.json` — schema + observations (no credentials)
* `tests/host-lifecycle/evidence/real-hermes-baseline.json` — non-destructive inventory
* `tests/host-lifecycle/evidence/real-update-blocked.json` — failure-reason record

Machine-local evidence (not committed):

* `~/.tnf/receipts/host-lifecycle/<host>/<phase>-<timestamp>.json`
* `~/.tnf/receipts/host-lifecycle/issue-177-current.json` — recovery checkpoint

---
name: tnf-host-lifecycle-guardian
category: tnf-platform
department: tech
description:
  'TNF host lifecycle guardian — scan, doctor, reconcile, snapshot, rollback,
  and receipt for installed hosts (Hermes / ZCode / Claude / Kilo / Codex /
  Gemini / OpenCode / Cursor / OpenClaw). Fail-closed at stale adapter, unknown
  topology, secret boundary.'
trigger:
  'Use when building/repairing a host-adapter, lifecycle receipt, or
  update/doctor/reinstall reconciliation. Compose with the canonical
  `scripts/install-agent-frontload.cjs` frontload authority.'
---

# tnf-host-lifecycle-guardian

The TNF Host Lifecycle Guardian preserves and reconciles TNF-managed edges
through vendor update, doctor, reinstall, and configuration drift events on
every installed host. It is the lifecycle counterpart to the Agent Resource
Fabric: the Fabric centralizes reusable static resources, the Guardian keeps the
host edges that expose those resources intact.

## Lifecycle (fail-closed)

`DETECT → IDENTIFY → BASELINE → QUIESCE → SNAPSHOT → EXECUTE/OBSERVE → REDISCOVER → RECONCILE → REPAIR → VERIFY → FRESH SESSION → RECEIPT → ROLLBACK / QUARANTINE ON FAILURE`

Every phase is permitted to fail closed. A stale or unverifiable adapter must
NOT silently mutate host state.

## Adapter strategies

Each host profile selects exactly one strategy:

| Strategy                | Meaning                                                                                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `native-hook`           | Host exposes documented pre/post maintenance hooks. TNF wraps them.                                                                                                    |
| `command-shadow`        | Host/version empirically permits safe interception of a reserved `/update` or `/doctor` command. TNF routes that command to itself.                                    |
| `wrapper-delegation`    | TNF snapshots/baselines, invokes the native maintenance operation, then rediscover/reconcile/verify.                                                                   |
| `post-update-detection` | The update cannot be intercepted (IDE auto-updater, .app bundle, vendor daemon). TNF detects the version/layout change before returning the host to trusted operation. |
| `package-manager-watch` | The host is installed by a package manager (npm, pip). TNF detects externally changed installation/version and reconciles on the next managed entrypoint.              |
| `unmanaged-observe`     | No safe mutation or interception authority exists. Observe and report only.                                                                                            |

`command-shadow` is reserved for hosts where the empirical test in
`tests/host-lifecycle/test_host_profiles.py` confirms interception. Until that
test passes on the exact runtime/version, the profile must remain
`wrapper-delegation` or stronger.

`wrapper-delegation` is NOT "observe only". It means TNF owns the surrounding
transaction: baseline → invoke native maintenance → rediscover → reconcile →
verify.

## What invalidates adapter proof (and blocks repair)

Adapter proof becomes STALE only when one of the following semantic conditions
holds. A bare content-hash change of a managed surface does NOT, by itself,
invalidate the adapter — that is exactly the kind of drift repair is meant to
handle.

| Condition                                                                            | Adapter proof state                                                |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Managed content drift, stable verified topology                                      | Potentially repairable from canonical TNF authority                |
| Host version changed AND layout/semantic contract differs                            | STALE — must re-verify before structural repair                    |
| Host layout/version changed in undocumented way                                      | STALE — must re-verify before structural repair                    |
| Unknown new layout discovered                                                        | QUARANTINE — fail closed, no automatic rewrite                     |
| Secret/state path mutated                                                            | NEVER auto-restored through Resource Fabric; quarantine if changed |
| Resource Fabric duplicate tree created by vendor (symlink replaced by physical copy) | NOT promoted to authority; original target restored                |

## Repair scope

Repair is allowed only for the exact surfaces whose host adapter/profile has
verified ownership and a verified repair strategy. A universal hard- coded
repair list (`AGENTS.md`, `skills index`, `hooks registry`) is wrong — repair
scope must come from the host profile, version-locked.

If a profile does not enumerate a surface, the guardian must NOT touch it. If a
profile enumerates a surface that the version/layout no longer supports, repair
is blocked until the profile is re-verified.

## Secret / state boundaries

The guardian classifies paths into:

- `managed-fabric` — TNF owns, may snapshot/repair when adapter proof is valid
- `classified-boundary` — secrets, credentials, opaque session DBs
- `unmanaged` — neither

For `classified-boundary` paths, the guardian records CLASSIFICATION and PATH
only. It does NOT content-hash credential-bearing files merely to inventory them
(hashing still processes the secret and creates an unnecessary content
fingerprint). A path-presence check ("boundary observed" vs "boundary absent")
is sufficient evidence.

Canonical hermes secret boundaries (names only, never contents):

- `~/.hermes/.env` (credential-bearer)
- `~/.hermes/state.db` (opaque-session-state)
- `~/.hermes/auth.json` (credential-bearer)
- `~/.hermes/auth/` (credential-bearer-dir)
- `~/.hermes/sessions/` (session-state-dir)
- `~/.hermes/checkpoints/` (session-state-dir)
- `~/.tnf-private-env` (credential-bearer)

Other hosts use their own profile-specific boundary list.

## Real evidence boundary

Repository contains deterministic fixtures and test data only. Real host
lifecycle receipts belong under a machine-local structure:

```
~/.tnf/receipts/host-lifecycle/<host>/<phase>-<timestamp>.json
```

A receipt at that path is NOT committed to the repository. The repository holds
only:

- `tests/host-lifecycle/evidence/*` — deterministic synthetic-fixture receipts
  (no real host data)
- `tests/host-lifecycle/evidence/installed-host-profiles.json` — host schema +
  observations (no credentials, no opaque session content)
- `tests/host-lifecycle/evidence/real-hermes-baseline.json` — non-destructive
  inventory (names + presence flags, no secrets)
- `tests/host-lifecycle/evidence/real-update-blocked.json` — failure-reason
  record with explicit missing prerequisites

## Composition with existing TNF authorities

The lifecycle guardian does NOT introduce a new resource store, memory system,
provider registry, Turn Zero, or onboarding authority. It composes with:

| Authority             | Role                                                            | Composes with guardian as                                                                                 |
| --------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Assimilation          | Decides what TNF should absorb                                  | Detection source — newly discovered vendor capabilities flow through assimilation before becoming managed |
| Agent Resource Fabric | Owns reusable static resource identity/storage                  | Source of canonical rollback material for managed-fabric surfaces                                         |
| Host Adapter          | Exposes TNF resources to a particular host                      | The adapter evidence version is what the guardian validates                                               |
| Lifecycle Guardian    | Preserves/reconciles host edges through update/doctor/reinstall | This skill                                                                                                |
| Memory / User Context | Owns stateful knowledge/context                                 | The guardian never reads or hashes either                                                                 |
| Turn Zero             | Proves the resulting harness at session entry                   | Post-repair fresh-session probe re-runs Turn Zero                                                         |

## Canonical frontload authority

The guardian's `resolve_repo_root()` and `hash_managed_frontload()` compose with
the canonical anchor `scripts/install-agent-frontload.cjs`. The guardian does
NOT invent its own root-discovery mechanism; it walks up from its own location
looking for that anchor and honors `--repo-root` and `TNF_REPO_ROOT` overrides.
Symlinked checkout aliases collapse via `realpath` and never produce a second
identity.

The managed frontload block is the BEGIN/END span authored by the canonical
install script (markers `<!-- TNF-FRONTLOAD:BEGIN -->` and
`<!-- TNF-FRONTLOAD:END -->`). Outside that block is host-owned and is NEVER
treated as managed-frontload identity.

## Files

Implementation and tests (all present in this worktree):

- `scripts/host-lifecycle/host_lifecycle_guardian.py` — core adapter
  (IMPLEMENTED + TESTED)
- `tests/host-lifecycle/test_managed_frontload_root.py` — root-resolution tests
  (10/10 passing)
- `tests/host-lifecycle/test_rollback_proof.py` — synthetic lifecycle scenarios
  S1–S9, proofs P1–P7 (13/13 passing)
- `tests/host-lifecycle/inventory_real_hermes.py` — non-destructive real-Hermes
  inventory writer
- `tests/host-lifecycle/test_host_profiles.py` — profile vs empirical reality
  (9/9 passing)
- `docs/protocols/HOST_LIFECYCLE/host_lifecycle_protocol.md` — protocol doc

## Status of the lane (2026-08-22)

| Phase                                                                                               | State                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. managed_frontload_hash/root fix                                                                  | IMPLEMENTED + TESTED                                                                                                                                                                                                                                                                                                                           |
| B. synthetic rollback proof (S1–S9, P1–P7)                                                          | IMPLEMENTED + TESTED                                                                                                                                                                                                                                                                                                                           |
| C. non-destructive real Hermes baseline/doctor                                                      | IMPLEMENTED + TESTED                                                                                                                                                                                                                                                                                                                           |
| D. real Hermes update test                                                                          | REAL_UPDATE_BLOCKED — missing prerequisites MP1 (uncommitted WIP in install tree) and MP2 (gateway restart terminates executing shell). Receipt at `tests/host-lifecycle/evidence/real-update-blocked.json` and `~/.tnf/receipts/host-lifecycle/real-update-blocked.json`. Synthetic overwrite + reconcile path covers the same proof surface. |
| E. installed-host profiles (Hermes, Claude, Kilo, Codex, Gemini, OpenCode, Cursor, ZCode, OpenClaw) | IMPLEMENTED + TESTED (9/9)                                                                                                                                                                                                                                                                                                                     |
| F. docs/meta-skill alignment                                                                        | IN PROGRESS — this skill                                                                                                                                                                                                                                                                                                                       |
| G. PR                                                                                               | Pending F + commit                                                                                                                                                                                                                                                                                                                             |
| H. merge #177                                                                                       | After G lands and acceptance review                                                                                                                                                                                                                                                                                                            |
| I. update #178 with lifecycle receipt                                                               | After H                                                                                                                                                                                                                                                                                                                                        |

Recovery checkpoint (no secrets):
`~/.tnf/receipts/host-lifecycle/issue-177-current.json`.

## Public command surface (CANDIDATE — not yet implemented)

The operator-facing command surface below is the candidate shape described in
issue #177. It is NOT yet implemented as a `tnf host …` subcommand; existing
commands `tnf doctor` / `tnf status` / `tnf state` remain the canonical entry
points. When implementation lands, this skill must be updated to reflect the
actual tested command names, not the aspirational ones.

CANDIDATE names (do not document as live until a PR merges):

- `tnf host doctor <host>` — compose native host doctor + frontload integrity +
  Resource Fabric integrity + adapter compatibility + lifecycle/version drift +
  MCP/hooks integration + duplicate-resource detection + fresh-session
  verification
- `tnf host update <host>` — guarded native update: snapshot → invoke native →
  reconcile → verify
- `tnf host reconcile <host>` — re-run reconciliation on a host without a fresh
  update
- `tnf host lifecycle scan` — inventory all installed hosts and report
  managed-frontload hash + adapter proof state
- `tnf host lifecycle receipt <host>` — show the most recent machine-local
  lifecycle receipt for a host

## Host profile schema

See `tests/host-lifecycle/evidence/installed-host-profiles.json` for the
empirical profiles and the schema fields (version*discovery,
managed_frontload_target, tnf_persistent_injection, reusable_resource_surfaces,
mutable_configuration, secrets_state_boundaries, native_update_mechanism,
native_doctor, supported_hooks, intercept*/update, intercept\_/doctor,
rewrite_paths_on_update, resource_fabric_redirect,
post_maintenance_verification, fresh_session_probe, rollback_capability,
adapter_strategy).

`intercept_/update` and `intercept_/doctor` claims must remain
`unmanaged-observe` until a profile-specific test in
`tests/host-lifecycle/test_host_profiles.py` empirically proves interception on
that exact runtime/version. The current default in every profile is therefore
`wrapper-delegation` or `unmanaged-observe`; `native-hook` and `command-shadow`
are reserved for verified cases.

> Note (2026-08-26): the real-host python test suite referenced above
> (`test_managed_frontload_root.py`, `test_rollback_proof.py`,
> `inventory_real_hermes.py`, `test_host_profiles.py`) was migrated to a
> synthetic-fixture suite (`tests/host-lifecycle/fixture_recovery_tests.sh`
>
> - `tests/host-lifecycle/evidence/test1..8_*.json`) on
>   `integration/host-lifecycle-conformance` — same invariants, no destructive
>   real-host operations. Update this doc's Files/Status sections to match once
>   that branch merges.

## Session-learned pitfall (2026-08-22 / #178)

Managed frontload hash returned `null` when the adapter resolved against the
fixture root instead of the repo root (`AGENTS.md` at repo root vs fixture).
Verify path resolution before interpreting a hash result as "missing".

## Operator preference (verified session 2026-08-22)

Brief/directive turns ("all" / "proceed"); suppress repeated legal disclaimers;
action-first with self-verified reporting (full authorization); when asked "most
logical?" clarify via `clarify` (single-select, recommendation first); never
fabricate clean-state claims; always name remaining gaps explicitly; select next
mutation from listed options rather than silent execution.

---

Protected note: this file lives at `.agent/skills/tnf-host-lifecycle-guardian/`
(user-authored / directory skill). It is NOT curator-managed; future autonomous
passes must NOT replace its content wholesale — extend it instead.

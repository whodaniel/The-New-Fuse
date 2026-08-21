# Jules scheduler cleanup receipt — 2026-08-20

## Status

**Completed for the TNF repository-authority scope on 2026-08-21.** The three
Bolt, Sentinel, and Palette schedules were recreated against private
`whodaniel/tnf-monorepo`, then removed from public `whodaniel/The-New-Fuse`.
The remaining verification is passive: confirm the canonical schedules execute
at their first recorded run and no public-overlay sessions recur for one cadence
cycle.

Jules CLI (`jules` v as of Dec 2025 binary) has **no** schedule list/delete
commands. Schedules live only on https://jules.google.com.

An initial 2026-08-21 structured browser inspection found no authenticated
profile. After the operator authenticated and explicitly approved destructive
schedule deletion, the supported Jules UI was used for the migration below.

## Migration receipt (2026-08-21 ~01:01 EDT)

- Authenticated account: operator-authorized Jules account
- Source before migration: three active daily schedules on
  `whodaniel/The-New-Fuse` (Bolt, Sentinel, Palette)
- Canonical target after migration: three daily schedules on
  `whodaniel/tnf-monorepo`, branch `main`
- Cadence: `30 21 * * *` in `America/New_York` (09:30 PM EDT)
- First canonical next-run timestamp returned by Jules: 2026-08-21 09:30 PM EDT
- Canonical UI state before first execution: `Inactive` with no executions yet
- Source after migration: zero scheduled tasks on `whodaniel/The-New-Fuse`,
  confirmed after a full page reload

Jules does not expose an in-place repository retarget control. The migration
therefore recreated the schedules on the canonical repository before deleting
the public-overlay schedules. The canonical prompts were preserved from the
source schedules rather than rewritten during migration.

## Verified inventory (2026-08-20 ~18:25Z)

### Local host
- User crontab: no Jules entries
- LaunchAgents: `com.thenewfuse.jules-followup.plist.disabled` only; not loaded
- Local loop scripts already retargeted to `whodaniel/tnf-monorepo` (commit
  `b932f5ce5f`)

### Jules connected repos (relevant)
- `whodaniel/tnf-monorepo` — present (correct target)
- `whodaniel/The-New-Fuse` — still connected (public overlay; must not receive
  persona schedules)
- `whodaniel/fuse` / `fuse-control-plane` — also present historically

### Recent Bolt/Palette/Sentinel sessions on `The-New-Fuse`
- **18** persona sessions observed against `whodaniel/The-New-Fuse`
- Several active within ~2h of inventory (Bolt/Palette/Sentinel still
  scheduled externally)
- Status mix: Completed / In Progress / Awaiting User / blank

### Public PRs
- Persona PRs #136–#153 on `The-New-Fuse` already **closed** (latest batch
  closed 2026-08-20 ~16:15Z)
- No open persona PRs at inventory time
- Auto-close workflow **not yet on public `main`** (404); present in monorepo
  and on branch `chore/close-jules-persona-prs-on-public-overlay` pushed to
  public remote

## Actions completed this session

1. Confirmed local Jules scripts/docs target `tnf-monorepo` (orchestrator /
   autonomous loop / PR follow-up playbook retargeted where still stale).
2. Pushed public branch
   `chore/close-jules-persona-prs-on-public-overlay` with
   `.github/workflows/close-jules-persona-prs.yml`
   (open PR via:
   https://github.com/whodaniel/The-New-Fuse/pull/new/chore/close-jules-persona-prs-on-public-overlay
   if not already opened).
3. Documented that cloud schedules cannot be deleted via CLI.

## Operator action completed (Jules UI)

At https://jules.google.com → Scheduled / Automations (exact label may vary):

1. [x] Recreate Bolt, Palette, and Sentinel against
   `whodaniel/tnf-monorepo` only.
2. [x] Delete the corresponding scheduled jobs from
   `whodaniel/The-New-Fuse`.
3. [ ] Confirm no new Bolt / Palette / Sentinel sessions appear against
   `The-New-Fuse` for one cadence cycle (approximately 24 hours).
4. [ ] Optionally triage persona schedules on legacy `whodaniel/fuse`; this is
   outside the public-overlay authority incident.

## Merge checklist

- [x] Merge auto-close workflow PR on `The-New-Fuse` — PR #155 squash-merged
      2026-08-20 19:54Z as `f561df8ea2`; branch deleted. Merged with admin
      ruleset bypass: the sole required check (`Build Summary`) fails on `main`
      independently of this PR (see CI note below).
- [x] Confirm workflow enabled under Actions — `close-jules-persona-prs.yml`
      present on `main` (1742 bytes). Two runs recorded, both `skipped`, which
      is the correct no-op result: zero open persona PRs to close.
- [x] Operator Jules UI schedule migration receipt (structured browser state
      recorded above; no screenshot required)

## CI breakage — diagnosed and partly fixed (PR #156, issue #157)

**Resolved after the notes below were written.** PR #156 landed four fixes,
each confirmed by a CI run rather than assumed:

| Stage | Before | After #156 |
| --- | --- | --- |
| `pnpm install` | 404 | pass |
| Build Packages (76) | skipped | all pass |
| Build Apps | skipped | `api-gateway` passes; `api`/`backend`/`frontend` fail |
| gitlink merge base | fatal | resolved |

1. Removed the nonexistent `@radix-ui/react-content` devDependency.
2. `fetch-depth: 0` on the Gitlink Integrity checkout, and dropped `--depth=1`.
3. `tnf-cli`: `new Set<string>(...)` so the membership test against a
   `HARNESS_CLIENTS` literal union compiles.
4. `relay-core`: declared `@the-new-fuse/control-plane-contracts`. This was a
   real repo-boundary bug — `sync-repos.sh` strips `master-clock.ts` and
   `broker-agent.ts` as proprietary and substitutes stubs that re-export from
   that package, which nothing declared as a dependency, so the overlay could
   never resolve or order it.

All four are in `tnf-monorepo` (`b9d585dbf4`) so the next sync will not
reintroduce them. Merged with admin bypass, as `Build Summary` is still red.

Remaining work tracked in
https://github.com/whodaniel/The-New-Fuse/issues/157: one type error in
`apps/api`, a missing `OrchestratorService` export in `apps/backend` that may
be another proprietary-strip casualty, a non-`tsc` failure in
`apps/frontend`, and a stale gitlink allowlist (three paths that are real
submodules upstream but not in the overlay — not a required check).

## Original CI note — pre-existing `main` breakage (not caused by #155)

`Build Verification / Setup and Cache` fails at `pnpm install`:

```
ERR_PNPM_FETCH_404  GET https://registry.npmjs.org/@radix-ui%2Freact-content: Not Found - 404
This error happened while installing a direct dependency of
  apps/browser-control-surfaces
```

`@radix-ui/react-content` does not exist on the registry. The failure skips
`Build Packages` / `Build Apps` / `Production Smoke Test`, which makes
`Build Summary` exit 1 — and `Build Summary` is the only context in the
`main protection` ruleset's `required_status_checks`. Every PR to public
`The-New-Fuse` is therefore blocked until that dependency is removed or
corrected. Latest `main` run of Build Verification (2026-08-18) also failed.

Secondary, independent CI defect: `Gitlink Integrity` fails with
`fatal: origin/main...HEAD: no merge base` because the workflow fetches with
`--depth=1` before running `git diff origin/main...HEAD`. Needs
`fetch-depth: 0` (or an explicit deepen) to work on any PR.

## Post-merge verification (2026-08-20 ~19:55Z)

- Open persona PRs on public `The-New-Fuse`: **0**
- Persona sessions still spawning against `whodaniel/The-New-Fuse`: **yes** —
  Bolt / Palette / Sentinel last active ~3.5h before check. Cloud schedules
  remain live; the auto-close workflow is a containment net, not a fix.
- `whodaniel/fuse` is **private**, so persona sessions there are not a public
  exposure risk (deprioritized relative to the public overlay).
- `whodaniel/EXTREAMIX` is **public** and receives "Activate Sentinel"
  sessions from a separate schedule — out of scope here, flagged for triage.
- Jules CLI re-confirmed to have no schedule surface: commands are
  `login / logout / new / remote {list,new,pull} / teleport / version` only.
  The CLI backend is the undocumented `aida.googleapis.com/v1/swebot` RPC;
  deletion was **not** attempted against it. UI remains the only supported
  path.

## Related

- Monorepo commit `b932f5ce5f` — local retarget + workflow source
- Publication PR https://github.com/whodaniel/The-New-Fuse/pull/154 (broader
  sync; checks blocked; workflow also included there)
- Doctrine: local routing ≠ external SaaS scheduler state
  (`docs/protocols/reports/CONTEXTUAL_EVOLUTION_LOG_2026-08-18.md`)

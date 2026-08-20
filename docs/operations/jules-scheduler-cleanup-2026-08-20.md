# Jules scheduler cleanup receipt — 2026-08-20

## Status

**Partial — local/repo controls done; external Jules cloud schedules still fire
against public `The-New-Fuse` and require operator deletion in the Jules UI.**

Jules CLI (`jules` v as of Dec 2025 binary) has **no** schedule list/delete
commands. Schedules live only on https://jules.google.com.

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

## Operator required (Jules UI)

At https://jules.google.com → Scheduled / Automations (exact label may vary):

1. **Delete** Bolt, Palette, and Sentinel scheduled jobs that target
   `whodaniel/The-New-Fuse`.
2. Optionally delete persona schedules on legacy `whodaniel/fuse` if unused.
3. If persona automation is still desired, **recreate** schedules targeting
   **`whodaniel/tnf-monorepo` only**.
4. After deletion, confirm no new `⚡ Bolt:` / `🎨 Palette:` / `🛡️ Sentinel:`
   sessions appear against `The-New-Fuse` for one cadence cycle (~24h).

## Merge checklist

- [ ] Merge auto-close workflow PR on `The-New-Fuse`
- [ ] Confirm workflow enabled under Actions (billing may block runs)
- [ ] Operator Jules UI schedule deletion receipt (screenshot or note in handoff)

## Related

- Monorepo commit `b932f5ce5f` — local retarget + workflow source
- Publication PR https://github.com/whodaniel/The-New-Fuse/pull/154 (broader
  sync; checks blocked; workflow also included there)
- Doctrine: local routing ≠ external SaaS scheduler state
  (`docs/protocols/reports/CONTEXTUAL_EVOLUTION_LOG_2026-08-18.md`)

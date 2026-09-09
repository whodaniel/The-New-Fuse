# TNF World-Class Campaign — Session Brief

**Written**: 2026-09-02, by Claude (Sonnet 5), end of a session that shipped
Google OAuth on api-server and fixed three subdomains' broken DNS. This document
is the handoff into a **new session** — paste it as the opening prompt.
Everything the new session needs to not re-derive context lives here.

---

## 0. Read this first: what kind of task this is

The user's ask was: "go full depth on all of this and use your own best
judgement to insure the result is we have a world class product/service/
framework that is the best in the world, and the best it possibly can be in all
aspects."

That is not a single task with a completion state. Treat it as a **standing
campaign**, not a to-do list to clear in one sitting. The right posture:

- Work in **phases with checkpoints**, not one continuous unsupervised run.
  After each phase, report findings and get a go/no-go before the next,
  _especially_ for anything destructive (killing a daemon, deleting worker
  registrations, removing a "vaporware" role's references, force-pushing).
- **Verify before fixing, always.** This campaign exists because two agent
  reports (Hermes, an open-code CLI agent) made claims about system state that
  turned out to be a mix of true, false, and unverifiable. Some of that is
  exactly the kind of thing this document is set up to correct — do not repeat
  the pattern by trusting a report (including this one) without checking it
  against the live repo/system yourself.
- **"World class" is a direction, not a metric.** Ground every specific piece of
  work in a concrete defect, gap, or risk found by verification — not in
  abstract polish. The prioritized phase list below is your judgment call made
  concrete; revise it if what you find warrants it, but revise it _because you
  found something_, not by default.
- **This machine has real limits.** Disk was at 98% full mid-session (recovered
  to ~2GB free via pnpm store prune; do not assume more headroom exists — check
  `df -h /` before any large build/checkout operation). This is also a **shared
  checkout** other autonomous TNF agent processes write to concurrently — see §2
  below before touching git.

---

## 1. Full context carried forward from the prior session

### 1.1 What was actually shipped and verified working (do not redo)

- **Google OAuth on api-server**: `GET /api/auth/google` +
  `/api/auth/google/callback` added to `apps/api`. Google Cloud OAuth client
  created and published (non-sensitive scopes, no verification needed). Deployed
  to the `api-server` Cloud Run service. **Verified live**: real Google consent
  screen appears; a completed Supabase session-exchange login was observed
  working end-to-end (logged in as Daniel Goldberg, SUPER_ADMIN, on
  `app.thenewfuse.com/dashboard`).
- **Two pre-existing infra bugs found and fixed while shipping the above** (both
  were silently breaking _every_ api-server deploy attempt):
  - `Dockerfile.api` referenced `packages/jules-skill`, renamed to
    `packages/coding-agent-delegation` weeks earlier. Fixed.
  - `.gcloudignore` had the same stale name, and separately pulled in the entire
    294MB `.agent/` directory (only `.agent/agents/` — 1MB — is actually needed
    at runtime) via an overly-broad `!.agent/` re-include. This also caused a
    real crash: a concurrent background agent process editing files in
    `.agent/test-reports/` mid-tar produced a `FileNotFoundError` in
    `gcloud builds submit`. Scoped the re-include down to `.agent/agents/**`
    only. Fixed.
- **DNS root cause of "Google sign-in broke"**: `api.thenewfuse.com`,
  `library.thenewfuse.com`, and `relay.thenewfuse.com` were all still CNAME'd to
  Google's `ghs.googlehosted.com` (leftover Cloud Run domain-mapping attempts)
  with Cloudflare proxying **off**, serving a broken/self-signed cert and
  bypassing Cloudflare entirely.
  - `api.thenewfuse.com`: repointed to `thenewfuse-main.pages.dev` (Proxied) —
    an existing Cloudflare Worker (`tnf-api-proxy`, `cloudflare-api-proxy/`)
    already had a route for it.
  - `library.thenewfuse.com` and `relay.thenewfuse.com` had **no** existing
    Worker to catch traffic once repointed, so two new minimal reverse-proxy
    Workers were built and deployed: `tnf-library-proxy`
    (`cloudflare-library-proxy/`) and `tnf-relay-proxy`
    (`cloudflare-relay-proxy/`, with explicit WebSocket upgrade passthrough
    since `apps/relay-server` runs a live `ws` server).
  - **Verified live** via the actual Chrome browser (not curl — see §1.3):
    `library.thenewfuse.com` renders the real Virtual Library 3D app;
    `relay.thenewfuse.com/health` returns real relay-server JSON;
    `api.thenewfuse.com/api/health` and `/api/auth/google` both work correctly.
  - **NOT fixed, flagged only**: `marketplace.thenewfuse.com` — Cloud Run domain
    mapping shows ✗ (failing) via `gcloud beta run domain-mappings list`; no DNS
    record exists for it at all yet. Out of scope of what was asked; worth a
    decision (build it properly, or remove the dead mapping).
  - **A real, minor, non-blocking quirk found and NOT chased down**:
    `api.thenewfuse.com/health` (bare, no `/api` prefix) redirects to
    `thenewfuse.com/health` and returns the wrong service (`tnf-landing` instead
    of api-server's health). `api.thenewfuse.com/api/health` (the path actually
    used by real traffic) works correctly. Root cause not identified — suspect a
    Cloudflare zone-level Redirect Rule or Bulk Redirect matching bare `/health`
    that takes priority over the Worker Route, but this was not confirmed.
    **First task of this campaign**: find and either fix or consciously accept
    this (see Phase 1).
- **Disk**: was at 98% full (382MB free), which broke a `git worktree add`
  mid-checkout. Root-caused: NOT the reported "180GB Chrome `code_sign_clone`
  leak" (that's real but `du` wildly overstates it — APFS clone blocks shared
  with the real Chrome.app; emptied 87 of 88 stale clone dirs and disk didn't
  meaningfully move). Real headroom came from `pnpm store prune`
  (`~/Library/pnpm`, was 8.1GB). **The actual 98%-full culprit was never found**
  — `diskutil apfs list` showed `Macintosh HD - Data` volume alone consuming
  476.6GB of the 500GB container, and the user interrupted before the breakdown
  was finished. **Second task of this campaign**: finish that investigation if
  disk pressure recurs, since ~2GB free is not a comfortable margin for the work
  ahead.
- **Merged to `main` and pushed** (three merges, all via a throwaway
  `git worktree` to avoid disturbing the shared, heavily-dirty main checkout —
  see §2): the OAuth work, the Dockerfile/gcloudignore fixes, the two new
  Cloudflare Workers, and (separately) a notation/doc fix + new tooling (§1.2).
  Current `main` tip at end of session: `d45913692`.

### 1.2 Notation reconciliation work (already shipped)

- **The incident**: this session's own agent read
  `.agent/skills/browser-automation/SKILL.md`, which described _only_ the Fuse
  Connect Chrome extension, and concluded that was TNF's only browser-automation
  surface — then separately over-generalized a "legacy" comment in
  `packages/tnf-cli/src/commands/browser.ts` (scoped to that command's old
  navigation backend) into "Fuse Connect is deprecated." **Both were wrong.**
  The actual picture, now correctly documented:
  - `agent-browser` (npm package ~0.26.0, invoked via
    `tnf browser open/snapshot/click/fill/...`) is the current primary tool for
    stateful single-session page automation — its own isolated browser instance,
    no visibility into tabs it didn't open.
  - **Fuse Connect** (`apps/chrome-extension`, product name "Fuse Connect",
    current major version v6/"v7" in its own logs) is separately maintained and
    **current**, not legacy — content scripts + background service worker living
    inside the user's real open tabs, bridged via WebSocket to a local relay,
    giving cross-tab/cross-agent federated messaging that `agent-browser`
    structurally cannot do (a different local agent process addressing an
    in-page agent already running in a specific tab, with Green/Blue channel
    isolation). This is verified live in code
    (`apps/chrome-extension/src/v6/background/index.ts` maintains real
    `WebSocket` connections, `registerAgent(ws)`, a `Map<string, WebSocket>` of
    connections) and has its own operating doc:
    `.agent/skills/tnf-federated-ws-channel-control/SKILL.md`.
  - Fixed: `.agent/skills/browser-automation/SKILL.md` rewritten to document
    both surfaces side by side with an explicit decision rule.
- **New tool, built and committed**:
  `scripts/protocols/notation-reconciliation-audit.cjs` +
  `.agent/skills/notation-reconciliation-auditor/SKILL.md`. Scans TNF's own
  notation corpus (`.agent/skills/**` minus known vendor skill packs —
  `antigravity/`, `cloudflare-deploy/`, `imported-claude-agents/`,
  `api-gateway/` — plus `docs/protocols/*.md` top-level only (not `reports/`),
  `AGENTS.md`, `CLAUDE.md`) for three things: dangling file-path references,
  dangling `pnpm run`/`tnf <subcommand>` references, and lines using
  legacy/deprecated/archived/superseded/etc. language (surfaced for human/agent
  semantic review, **not** auto-judged — the script cannot tell "this really is
  dead" from "this doc is wrong about it being dead," which was exactly the
  original bug). **Read `.agent/skills/notation-reconciliation-auditor/SKILL.md`
  in full before using this tool** — it explains what each of the three sections
  means and doesn't mean, and the false-positive traps already found and fixed
  in the regex (flag syntax after `pnpm run`, `*`-suffixed prefix script
  references).
  - **Last run's numbers** (will have drifted — re-run, don't trust these as
    current): 633 files scanned, **601 dangling paths**, **14 dangling
    commands** (including `tnf host` / `tnf artifacts` / `tnf environment`,
    which several protocol docs describe as real subcommands but which do not
    exist anywhere in `packages/tnf-cli/src` — confirmed by direct grep, not
    just the heuristic), **249 staleness-language flags**. None of this backlog
    has been worked through yet — the tool surfaced it, that's all.

### 1.3 A standing environmental gotcha: local network TLS interception

This machine's network runs a **FortiGuard/Fortinet web-filtering appliance**
that intercepts HTTPS to at least the `thenewfuse.com` zone (possibly others).
Two distinct failure modes were found, both looking like real production outages
if you don't know to check:

1. **curl and WebFetch both get a locally-injected cert**
   (`issuer=Fortinet Certificate Authority` / "self signed certificate in
   certificate chain") for `thenewfuse.com` zone hosts — even for hosts _proven_
   to work fine in a real browser. **Do not trust curl or WebFetch for this
   zone.** Verify via the actual Chrome browser (`mcp__claude-in-chrome__*`
   tools) instead.
2. **The FortiGuard appliance itself serves a block page**
   (`<title>Web Filter Block Override</title>`,
   `FortiGuard Intrusion Prevention - Access Blocked`) with HTTP 403 for at
   least `https://api.thenewfuse.com/health` when queried via curl. This is
   **exactly** what the open-code agent's report characterized as "main site
   returns 403" / "cloud control plane auth/edge split" — checked and confirmed
   **false**: it's this local filter, not a real Cloudflare/production 403.
   **The open-code agent's report was generated by a process that either ran on
   this same machine/network, or is otherwise unreliable on this specific
   claim.** Re-verify any of that report's claims that could plausibly have come
   from a curl/HTTP check on this network before accepting them.

If browser-tool navigation itself starts erroring ("Couldn't determine which
page this action targets", tab group vanishing), that happened intermittently
this session too — `tabs_context_mcp` with `createIfEmpty: true` and a fresh tab
usually recovers it.

### 1.4 The two agent reports this campaign is meant to reconcile

Two reports came in mid-session, both about **live TNF orchestration/ governance
state**, not committed to any file — reproduce them from the prior session's
transcript if needed, or treat the summary below as sufficient:

**Hermes** (an agent named "Hermes", ran a "Fix Sweep") — claimed **9 code fixes
applied, 10 deferred (Tier 2, needing operator sign-off), none committed**.
**Verified this session**: all 9 fixes are real, present in the working tree
exactly as described, and (3 spot-checked in depth: F2 env validation, F3 the
`if (DEV || PROD)` tautology bug — genuinely real bug, correctly fixed — and F7
WS rate limiting) correctly implemented.
`python3 -m py_compile scripts/agents/tnf-task-pusher.py` passes clean as
claimed. **Not yet done**: reviewing/committing these, or evaluating the 10
deferred items. Files touched (uncommitted, still sitting in the working tree as
of end of session — check `git status` first, another process may have touched
them since): `scripts/agents/tnf-task-pusher.py`,
`apps/api-gateway/src/main.ts`, `apps/frontend/src/App.tsx`,
`apps/frontend/src/App.simplified.tsx`, `apps/frontend/src/designSystem.ts`,
`apps/relay-server/src/comprehensive-tnf-relay.js`,
`apps/api/src/dto/register.dto.ts`,
`apps/frontend/src/stubs/class-validator.ts`, plus three deleted dead files
(`apps/frontend/src/MinimalApp.tsx`,
`apps/frontend/src/pages/ConnectExtension.tsx.bak`,
`apps/frontend/src/pages/Admin/Agents/skills.ts.bak`).

**An "open code agent"** (opencode CLI, unnamed persona) — ran a full "chain of
command" audit of TNF's multi-level agent governance hierarchy (Level 0
Governance Policy through Level 5 Worker Swarm) and reported:

- Three "live defects": (a) sub-director heartbeat "silently dead" — clean
  LaunchAgent exit codes but no Redis heartbeat write in 12+ hours; (b)
  orchestrator showing 0 active / 13 stalled agents, with 28 offline
  LLM-Orchestrator coordinator registry entries; (c) "cloud control plane
  auth/edge split" — **checked, this specific claim is false, see §1.3**. Also
  claimed `TNF_GATE_POLICY_TOKEN` unset locally (not checked).
- **"Documented-but-not-real roles"**: `fleet-coordinator`, `slotmanager-agent`,
  `snapshot-dispatcher`, `autonomy-governor`, `mcp-lifecycle-agent` (also
  independently checked: `channel-broker`), plus "Orchestration Agent
  (temporal)" — claimed to exist only as names in the staffing CLI's
  `GOVERNANCE_AGENTS` array (`packages/tnf-cli/src/commands/ staffing/index.ts`)
  and planning docs, zero actual `.agent/agents/*.md` definitions. **Verified
  true** — `find .agent/agents -iname "*<role>*"` returns nothing for every one
  of those names.
- Claimed the entire DACC persona set (Genesis, Controllers, etc.) is
  "additionally self-declared vaporware per its own manual" — **not checked**.
- Offered three follow-up actions, **none taken**: (a) restart the sub-director
  runtime so its heartbeat lands, (b) purge 82 dead worker entries + 28 offline
  coordinators, (c) wire the missing governance roles into proper agent
  definitions.

**launchctl spot-check done this session** (partially corroborates the report):
`com.tnf.master-heartbeat`, `resource-watchdog`, `agent-daemon`,
`subdirector-autopilot`, `local-subdirector` all show live PIDs. **Concerning**:
`com.tnf.master-heartbeat`'s last exit code was **1** (currently running via
LaunchAgent respawn, but crashed at least once). `com.tnf.master-reconciliation`
has **no PID** — not running at all right now.

**Redis** (`redis-cli ping` → `PONG`, local instance, 12,939 keys on db0, prefix
`tnf:*` confirmed populated with real live data e.g.
`tnf:seen:agent_Project-Planner_*`) — attempted to locate the sub-director
heartbeat key by pattern-matching (`*subdirector*`, `*sub-director*`,
`*heartbeat*`) and came up empty; also checked
`scripts/runtime/terminal-heartbeat-pulse.cjs` for the write call and didn't
find it there either before time ran out. **The actual heartbeat mechanism was
never located** — this is the literal first thing to nail down for claim (a)
above, and note the report specifically named a **remote** Redis too ("TRAMWAY
Redis bridge (tramway.proxy.rlwy.net)") which was never checked — the heartbeat
may live there, not on local Redis.

---

## 2. Standing rules for this campaign (do not skip)

- **This is a shared checkout.** Other autonomous TNF agent processes write to
  it concurrently — confirmed this session (a live process appended legitimate
  entries to `docs/protocols/AGENT_STATUS_LEDGER.md` mid-session; a different
  one caused a `gcloud builds submit` crash by deleting a file mid-tar). Before
  any branch-maintenance/history-rewrite/large-refactor work, run
  `node scripts/harness/resolve-workspace-tier.cjs --describe "<task>"` and
  follow its guidance. When you do need to move `HEAD` (merge, checkout a
  different branch) in a working tree this dirty, do it via a **throwaway
  `git worktree`** (`git worktree add <scratch-path> main`, do the merge/push
  there, `git worktree remove --force` after) rather than touching the primary
  checkout's branch — this avoids fighting the dirty working tree and avoids
  `workspace-mutation-guard`'s pre-commit block on `git stash` in a tree with
  30+ untracked/modified foreign files.
- **Pre-commit hooks are real and will block you** —
  `authority:surface: staged`, `privacy:guard`, `secret:sweep`,
  `zero-file:guard`, `docs:pii:guard`, `lint:staged` (prettier auto-runs and
  reformats staged files — expect this), `validate:locked-doc-ledger`,
  `handoff:gate:staged` (requires
  `node scripts/protocols/emit-session-handoff.cjs` to have been run and its
  output — `docs/protocols/reports/SESSION_HANDOFF_LATEST.json`
  - `.md` + `docs/protocols/AGENT_STATUS_LEDGER.md` — staged alongside any
    commit touching a "critical path": `apps/`, `packages/`, `supabase/`,
    `scripts/`, `data/`, `docs/protocols/`, `.github/workflows/`), and
    `build:gate:staged` (scoped type-check, only blocks on errors your commit
    introduces). Commit with an **explicit pathspec** every time
    (`git commit -m "..." -- <exact files>`) — never a bare `git commit` in this
    checkout, or you will sweep up unrelated concurrent-agent changes.
    `emit-session-handoff.cjs` also touches `docs/protocols/LIVING_STATE.md` as
    a side effect (rewrites its "Current Directive" line) —
    `git checkout -- docs/protocols/LIVING_STATE.md` after emitting if that
    file's change isn't wanted in your commit, before staging.
- **`gcloud builds submit`, `wrangler pages deploy`, `wrangler deploy`
  (Workers)** are the established deploy paths for, respectively, the api-server
  Cloud Run service (`scripts/deployment/cloudbuild.yaml`), the
  `thenewfuse-main` Cloudflare Pages project (build locally with
  `apps/frontend/.env.production` — gitignored, not committed, containing real
  `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`/`VITE_API_URL` — then
  `npx wrangler pages deploy dist --project-name=thenewfuse-main --branch=main`
  — **the `--branch=main` is not optional**, omitting it produces a
  branch-preview deployment that never reaches the custom domains, exactly as
  happened once this session before being caught), and individual Cloudflare
  Workers (`cloudflare-*-proxy/` dirs, each with its own `wrangler.toml` and
  `package.json`).
- **Never restart a daemon, purge a registry, or delete "vaporware" references
  without confirming with the user first**, even when a verification pass
  confirms the underlying problem is real. Present the confirmed finding and the
  proposed fix; let the user say go. This includes all three follow-ups the
  open-code agent offered.
- **Google/Cloudflare/GitHub credentials used this session**: `gcloud` active
  account `bizsynth@example.com`, project `the-new-fuse-2025`. Cloudflare
  account `Bizsynth@gmail.co...`, account ID `db1d3832768b2bbad4c5c5d9dbc63f8b`,
  zone `thenewfuse.com`. GitHub remote `origin` =
  `https://github.com/whodaniel/tnf-monorepo.git` (the _private_ dev repo — see
  existing memory `tnf-repo-name-collision-public-sync.md`: there's a
  **separate, public** `The-New-Fuse` remote that auto-syncs; never push
  anything sensitive there).

---

## 3. Phased work plan

Work these in order. Each phase ends with a checkpoint: report findings, get
explicit go-ahead before anything destructive, then proceed.

### Phase 1 — Close out what's already in flight (fast, low-risk, do first)

1. `git status` on the primary checkout. Diff Hermes's 9 claimed files against
   §1.4's list — confirm they're still there and still match (another process
   may have touched them since). Review each fix's actual diff (not just the
   summary) the way F2/F3/F7 were reviewed this session. Evaluate the 10
   deferred items — Hermes gave rationale for each; decide per-item whether the
   deferral is still right or whether this campaign should pick one up.
2. Get the user's go-ahead, then commit Hermes's verified fixes (their own
   suggested commit scope: exactly the 11 paths they touched, via the pathspec
   discipline in §2). Run their suggested smoke test first:
   `pnpm --filter @the-new-fuse/api-gateway run type-check`, then
   `python3 scripts/agents/tnf-task-pusher.py --title "smoke" --source "post-fix"`,
   then check `redis-cli hgetall tnf:broker:federation-gate:metrics` for a new
   `outcome:allow` bump.
3. Chase the `api.thenewfuse.com/health` bare-path redirect quirk from §1.1:
   check Cloudflare dashboard → thenewfuse.com zone → Rules (Redirect Rules /
   Bulk Redirects / Page Rules) for anything matching `/health`. Fix if trivial
   (a stray rule to delete/scope down); otherwise document it as a known,
   accepted quirk (it doesn't affect real traffic, which all goes through
   `/api/*`).
4. If disk is under ~5GB free: finish the `diskutil apfs list` volume breakdown
   from §1.1 before doing any large build/checkout work in later phases.

### Phase 2 — Verify the open-code agent's remaining live-state claims

For each, verify independently (don't trust the report, don't trust this brief
either — check the live system) before deciding anything:

1. **Sub-director heartbeat.** Find the actual write path — trace
   `~/Library/LaunchAgents/com.tnf.local-subdirector.plist` →
   `scripts/runtime/tnf-launchd-guard.sh --job com.tnf.local-subdirector --class probe`
   → whatever script that actually invokes → its Redis (or remote TRAMWAY Redis,
   `tramway.proxy.rlwy.net` — check `.env*`/config for its credentials) write
   call. Once found, check the actual last-write timestamp. If genuinely stale
   by hours: this is a real defect matching the report — surface it, propose a
   fix (the report's suggested restart is a _symptom_ fix; find why it stopped
   writing first, or you'll be back here in another 12 hours).
2. **Orchestrator active/stalled counts.** Find the source of "0 active / 13
   stalled" and "28 offline coordinators" — likely a status file, a `tnf` CLI
   command, or another Redis key pattern. Verify the current numbers, not the
   reported ones (time has passed).
3. **The 82 dead worker registrations.** Same — find where these are tracked,
   confirm the count, and _before_ purging anything, check: is "82 offline"
   actually anomalous, or is this normal churn as Hermes' report characterized a
   similar number ("stale registrations — normal churn")? Don't purge based on a
   raw count without knowing the system's normal baseline.
4. **`TNF_GATE_POLICY_TOKEN`.** Check `env | grep TNF_GATE_POLICY_TOKEN` and
   wherever it's meant to be sourced from (`.env*` files, a secrets manager). If
   genuinely unset and required, that's a real, simple fix.
5. **DACC persona set "vaporware" claim.** Read the DACC manual mentioned in the
   report (locate via `grep -rl "DACC" docs/ .agent/` — the report says it's
   "self-declared" vaporware, meaning the manual itself should say so directly
   if true; confirm, don't infer).

Checkpoint: report what's real, what's stale/false, and a prioritized list of
what's worth fixing vs. what's acceptable aspirational/future-scope
documentation (not everything documented has to exist yet — the sin is _not
saying so_, not having a roadmap).

### Phase 3 — Resolve the "documented-but-not-real" governance roles

For each of `fleet-coordinator`, `slotmanager-agent`, `snapshot-dispatcher`,
`autonomy-governor`, `mcp-lifecycle-agent`, `channel-broker`, and "Orchestration
Agent (temporal)": read what the `GOVERNANCE_AGENTS` array and surrounding
planning docs actually claim each role _does_, then make an explicit call
per-role — build a real `.agent/agents/<role>.md` definition (if the
responsibility is real and currently unowned), or fold its responsibility into
an existing role that already covers it (if duplicative), or
remove/clearly-mark-aspirational the reference (if it's genuinely not needed
yet). **Get user sign-off on the per-role calls before implementing** — this is
a real architecture decision, not a mechanical fix. This is also a direct
instance of the "capability implemented many times" / "same thing documented,
never built" pattern already flagged elsewhere in this project's memory — treat
consistency with that pattern as a vote for "fold into an existing role" over
"build yet another new one" by default.

### Phase 4 — Work the notation-reconciliation-auditor backlog

Re-run `node scripts/protocols/notation-reconciliation-audit.cjs --json` fresh
(numbers will have drifted from §1.2). Do not try to fix 600+ findings in one
pass. Batch by directory/subsystem (e.g., all `docs/protocols/TNF_*.md` files
together, all `.agent/skills/tnf-*` together) and for each batch: read the
flagged doc, verify the dangling path/command against current code, and either
fix the doc (if code is right) or flag the code as the actual defect (if the doc
had it right and something moved unintentionally) — per the auditor skill's own
"After a run" guidance. Prioritize batches that overlap with Phase 2/3 findings
first (docs describing the governance roles, the sub-director, the
orchestrator). For every staleness-language hit, apply the same semantic check
that caught the Fuse Connect bug — don't take "legacy" at face value, and don't
dismiss it either.

### Phase 5 — Broader quality pass

Once Phases 1-4 have closed the specific, verified gaps, use this repo's
existing tooling for a genuinely broad quality pass rather than reinventing one:
`/code-review` (or `/code-review ultra` for the cloud multi-agent version) on
any code changed in Phases 1-4, `/security-review` given this touches
auth/DNS/deploy surfaces, and a fresh
`node scripts/protocols/notation-reconciliation-audit.cjs --strict` run at the
end to confirm the backlog actually shrank rather than assuming it did.

### Phase 6 — Prevent re-drift

Decide, with the user, whether `notation-reconciliation-audit.cjs --strict`
should be wired into a periodic check (a cron skill, or a pre-merge gate for
`docs/protocols/*.md` and `.agent/skills/**` changes) now that it has a proven
backlog to show it catches real things — don't wire it in silently; this changes
what future commits are allowed to do.

---

## 4. What "done" looks like

Not "every one of 601 findings fixed" — that number will keep moving as the repo
evolves, and chasing it to zero is not the goal. Done for this campaign's first
pass means: Hermes's verified work is committed or consciously rejected; every
specific claim in both agent reports has been independently verified true,
false, or explicitly marked unverified-and-why; every "documented-but-not-real"
governance role has an explicit, user-approved resolution (built, folded, or
marked aspirational); the highest-value slice of the notation backlog
(governance/orchestration docs, since that's what triggered this campaign) is
reconciled; and the tooling exists and is proven to keep the backlog from
silently regrowing unnoticed. That's a coherent, honest, verified system — which
is what "world class" actually cashes out to here, more than any specific polish
pass would.

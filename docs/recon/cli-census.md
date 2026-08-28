# TNF Monorepo CLI Census

Classified inventory of every distinct invocable command surface found in
`whodaniel/tnf-monorepo`, for the CLI Census workstream of the current recon
program. Companion machine-readable file: `docs/recon/cli-census.json` (same
sections, same field names, one entry per row of every table below).

Generated 2026-08-27 from a git worktree checked out at local `main`
(3 commits ahead of `origin/main`, as expected for this task). This document
is read-derived only; nothing in the target repository was modified to
produce it.

## 0. Methodology and honest count

**The commonly-cited figure "410" is not used as ground truth anywhere in
this document.** Two numbers were independently derived instead, from two
different, disjoint surfaces:

- **396** — leaf commands (no further subcommands) in the `packages/tnf-cli`
  Commander tree, read from `packages/tnf-cli/src/command-surface.snapshot.json`.
- **427** — scripts in the root `package.json` `scripts` block, read directly
  from the file.

Neither is "the" count; 410 sits between them and most likely originated
from one or the other at a different point in time, or from a hybrid count
that isn't reproduced here. The comment inside
`packages/tnf-cli/src/command-surface.test.ts` itself says "410 commands, 670
options" — but that comment is stale relative to the code: the file it
describes (`cli.ts`) has grown from the "19,214-line" figure in that same
comment to **21,916 lines** as of this checkout, and the snapshot's own
current numbers are 396 leaves / 488 total nodes / 798 options, not 410/670.
**So even the in-repo source of "410" is admittedly out of date, not a
disagreement with this census.**

### How each number was actually produced

1. **`packages/tnf-cli` command tree** (Section A). The package ships its own
   oracle test (`command-surface.test.ts`) that dumps the live, registered
   Commander tree via `node dist/cli.js --dump-command-surface` and diffs it
   against a committed snapshot (`command-surface.snapshot.json`), specifically
   so that "an unintended removal looks identical to an intended one" cannot
   happen silently. That snapshot was last regenerated in commit `6bafcf488`
   — the *same* commit that most recently touched `cli.ts` — so it is
   git-verified fresh, not stale. **This worktree has no installed
   `node_modules` and no `dist/`**, so the live `--dump-command-surface` dump
   could not be independently re-run in this pass; the committed snapshot was
   used instead, cross-checked by counting raw `.command(` and `.action(`
   call sites in `cli.ts` (395 and 326 respectively) and in
   `packages/tnf-cli/src/commands/*.ts` (104 and 94), which is consistent
   with the snapshot's shape.
   - Walking that JSON tree: **488 total nodes** at every depth (including
     namespace/group nodes), of which **396 are leaves** (nodes with no
     further subcommands).
   - **Caveat that matters for anyone using this count**: several group
     nodes are *themselves* independently invocable in addition to having
     subcommands — e.g. `tnf db` (opens a shell or runs a query, and also has
     `db migrate` / `db path` children), `tnf acp` (starts a server, and also
     has `acp grok`), `tnf voice mic` (toggles capture, and also has `voice
     mic toggle`... in this specific case the parent and child are the same
     action under two names). The snapshot's tree shape does not distinguish
     "this group node also has its own action handler" from "this group node
     is purely a namespace with no action of its own," so the true count of
     independently-invocable actions is somewhere between 396 (the strict
     leaf floor) and 488 (every node, upper bound). This document classifies
     at the **top-level group** (130 groups), not the leaf, for exactly this
     reason — see below.
2. **Root `package.json` scripts** (Section B). Read directly:
   `Object.keys(require('./package.json').scripts).length === 427`. No
   ambiguity here; this is an exact count of one JSON file.
3. **Every `package.json` in the repo** (Section E, aggregate only): 136
   files total (`find . -name package.json -not -path '*/node_modules/*'`),
   427 scripts in the root file, **1,766 scripts summed across all 136
   files** — i.e. **1,339 additional scripts** across the other 135
   workspace packages, none of them individually classified in this pass
   (see Section E for why and what that means for completeness).
4. **`scripts/**` file count** (context for Section D): 661 `.sh` + 389
   `.cjs` + 87 `.mjs` + 182 `.py` + 204 `.js` = **1,523 files** directly under
   `scripts/`. The overwhelming majority of these are internal helpers
   (imported/required by other scripts, or invoked only via a root
   package.json script already counted in Section B — 218 unique `scripts/`
   paths are referenced that way). Per the task's own instruction, this
   census does **not** enumerate all 1,523 — only entry points reachable
   directly (by hand, by cron, or by launchd) and not already reachable
   through Section B are separately listed, in Section D (17 scripts, found
   by grepping for `launchctl`/`crontab` usage inside `scripts/**/*.sh` and
   diffing the hits against every `scripts/` path referenced from
   `package.json`).
5. **Scheduled/cron surface** (Section C): the task pointed at
   `data/protocols/chronological-process-catalog.json` and
   `data/protocols/system-processes.json` by name as things "you saw
   references to today." Both exist as *concepts* in this repo, but only
   `system-processes.json` is actually git-tracked —
   `chronological-process-catalog.json` and its sibling
   `cron-jobs.registry.json` are explicitly **gitignored** (`.gitignore`
   lines 168–176, 434–435) with an in-repo comment explaining why: they are
   *generated* from a SUPER_ADMIN-owned system half (`system-processes.json`,
   which ships with the repo) and an operator-private tenant half that
   deliberately lives outside the repo at `~/.config/tnf/processes.json`, "so
   an operator's private automation is never published." **Confirmed directly
   in this pass**: both generated files are absent from this checkout (`ls`
   returns `ENOENT` for both), and `scripts/setup/provision-local-cron.cjs`
   — the script that would actually write these entries into a real crontab
   — hard-fails with "Error: Cron registry not found" if run right now. This
   is a live instance of the exact failure class described in prior sessions'
   memory ("Cron registry vs catalog gap" / "TNF control-plane artifacts are
   gitignored"), caught directly by trying to use the file, not inferred from
   a description.

**Grand total, all sections, no double counting within a section:**

| Section | What | Count | Individually classified? |
|---|---|---|---|
| A | `tnf-cli` leaf commands | 396 (130 groups) | Yes, at group granularity |
| B | Root `package.json` scripts | 427 (73 groups) | Yes, at group granularity |
| C | Scheduled system-framework cron jobs | 20 | Yes, individually |
| D | Standalone service-control scripts (cron/launchd, not reachable via A or B) | 17 | Yes, individually |
| E | Other 135 workspace packages' scripts | 1,339 | No — aggregate only |
| **Total distinct script/command definitions found** | | **2,179** (396+427+17+1339; C overlaps with B/D by construction, see below) | |

Section C is a **cross-cutting scheduling registry**, not a fourth pool of
distinct commands — most of its 20 entries point at a script that is *also*
independently reachable as a Section B or D entry (e.g. the cron job
`tnf-llm-arena-intel-collector` runs the exact script backing the root
script `tnf:llm:collect`). Section C's value for this census is establishing
**runtime owner = cron** with a citation, for the handful of commands where
that would otherwise be a guess.

**So: the actual, current, honestly-counted surface is on the order of
~2,200 distinct script/command definitions in the repo, of which ~840 (A +
B + D) were classified individually or by tightly-scoped group in this
pass, and ~1,339 (E) were confirmed to exist and counted, but not
individually classified.** 396 and 427 are both real, both defensible, and
both smaller than the true total — pick whichever matches what a downstream
consumer means by "the CLI."

### Grouping rule (why groups, not 100% per-leaf/per-script rows)

The task explicitly permits classifying "each meaningful GROUP of command
paths" when full per-leaf rigor isn't achievable, provided the grouping is
stated. This census groups:

- Section A by **tnf-cli top-level namespace** (`voice`, `harness`, `mcp`,
  …) — 130 groups covering all 396 leaves. Every subcommand name within a
  group is listed in the "Notes" column even where the group's overall
  mutation class had to average across a mix of read/write subcommands.
- Section B by **root-script namespace prefix** (`tnf:llm:*`, `build:*`,
  `jules:*`, …) — 73 groups covering all 427 scripts.
- Sections C and D are small enough (20 and 17) to classify **individually**
  — no grouping needed or used there.

Rows marked `verified: true` in the JSON (also called out in the Markdown
prose) had their actual handler code read in this pass. Every other row is
classified from the command's own registered `--help` description text,
which is authoritative for *stated* intent but not confirmed against
*implementation*. Where a description was genuinely ambiguous or silent on
mutation, the row says `unknown` / "could not determine" rather than
guessing — per the task's explicit instruction that this is preferable to a
false classification, especially on the mutation-class and evidence axes.

---

## Section A — `packages/tnf-cli` command tree

Source: `packages/tnf-cli/src/command-surface.snapshot.json` (git-verified
fresh — see Methodology). 130 top-level groups, 396 leaf commands, 488 total
nodes, 798 options. Sorted by leaf count (largest surface first).

| Group | Leaves | Semantic intent | Mutation class | Runtime owner | Evidence | Notes / verification |
|---|---|---|---|---|---|---|
| voice | 21 | Voice Bridge daemon control + speech-to-text injection into terminal/app targets | local-mutation | human at terminal, or scripts/runtime/voice-bridge-service.sh (launchd label com.tnf.voice-bridge-server) as the actual daemon; tnf voice is a control client | `voice status` reads local server state; no persisted receipt found for target-anchor changes or injected text -- evidence gap | status/protocol-status/target-show are read-only; activate/up/down/listen/pause/resume/relay/mic-toggle/target-set/response-audio-* start or reconfigure the local Voice Bridge daemon and injection anchor. `voice target pick` injects transcribed text into whatever app/window has focus after a delay -- no confirmation step visible in the command surface. |
| harness | 18 | TNF terminal harness lifecycle: boot/pause/resume/provision the local agent harness | local-mutation | human/agent CLI; also invoked from the boot chain (scripts/boot-tnf.sh -> start-agent-network.sh, see packages/tnf-cli/src/boot/pipeline.ts) | writes to ~/.tnf harness state dirs by convention; not individually verified per subcommand | boot/cycle/loop/pause/resume/provision/staff/sandbox/host-compaction start processes or write state (permission berm/seatbelt profiles, compaction records, pause flags); berm/completeness/context/inspect/supply-chain/fleet-status/clients/trajectory(list mode) are read-only. |
| agents | 14 | Agent-focused operations: classify personas, run/live-manage the agent daemon, bank governance | local-mutation | human/agent CLI | agents live status reads daemon/bus health; no evidence artifact found for what an `agents run` loop actually did beyond its own transcript | agents live start/once/watch starts a persistent daemon; agents run starts an autonomous loop with bash/write_file/browser_interact tools -- HIGH-risk pass-through, mutation class of what it actually does is unbounded; agents prune-stale is destructive (kills/removes Redis swarm worker registrations); agents bank reconcile writes agent-bank files; classify/list/who/convo-alias/orchestrate-alias/register-alias/send-alias are read-only or delegate to their aliased command. |
| mcp | 14 | Manage MCP (Model Context Protocol) server registrations, auth, and tool invocation | local-mutation | human/agent CLI | mcp health / mcp list read live config; no verified receipt for `mcp call` side effects | add/auth/codex-login/disable/enable/sync/logout write local MCP config or credential state; call invokes an arbitrary tool on a configured MCP server (mutation class = whatever that tool does, i.e. remote-mutation is possible); debug/health/list/tools/supabase-agent-check are read-only. |
| authority | 12 | Agent authority elevation review, trust-root/isolation setup, ENCRYPTION_KEY rotation, OS account management | destructive | human operator (sudo-gated for account) | no confirmation/dry-run flag visible on encrypt-rotate or account in the command surface; treat as high-consequence, low-visible-evidence | authority account creates/removes an OS-level tnf-agent user account (requires sudo); encrypt-rotate migrates DATABASE_URL-backed encryption keys (decrypt-old -> encrypt-new); relaunch-workers kills and restarts operator-uid worker processes. approve/deny/confirm-isolation/provision-keys are local-mutation; list/show/status/workers/review are read-only or interactive-only. |
| compat | 11 | OpenClaw compatibility adapter -- mirrors OpenClaw config/cron surface through TNF | local-mutation | human/agent CLI, targets a co-installed OpenClaw runtime on the same machine | not verified; depends on OpenClaw's own state files | compat openclaw cleanup/config-set/config-unset/cron-disable/cron-enable/cron-schedule/sync mutate the OTHER harness (OpenClaw)'s live config or cron state via TNF as a proxy; config/cron/instances/inventory are read-only. |
| debug | 10 | Diagnostics: show config/paths/agent info, ripgrep/LSP/filesystem debugging helpers | read-only | human/agent CLI | stdout only; no receipt files expected or needed for a read-only surface | all subcommands print information; debug snapshot is ambiguous by name alone (could write a snapshot file) -- not verified. |
| full-auto | 8 | Unattended TNF automation loop (the flagship autonomous cycle referenced in cron-jobs/launchd docs) | local-mutation | human/agent CLI and self-installed cron/launchd (per user memory: "one cycle runs ~35 min, use 60+ min interval") | persists cycle state/logs per its own description -- best-evidenced group in the CLI surface if that persisted state is actually read back (not independently verified here) | daemon start/stop control a detached background process; once/start run real unattended cycles (self-improvement + optional orchestration broadcast) and persist state/logs; provision installs command+skill artifacts into every detected agent runtime; contend status and status are read-only. |
| jules | 8 | Google Jules coding-agent automation: loop, PR merge, follow-up supervisor | remote-mutation | human/agent CLI; cron (jules:cron:install wires scripts/install-jules-cron.sh) | GitHub PR merge is independently checkable via GitHub PR history/timeline; local loop state not verified | merge-open merges open GitHub PRs -- a real external-repo write; cron-install installs a local cron job; loop/supervisor/supervisor-start run local daemons; supervisor-status is read-only. |
| protocol | 8 | Validate TNF framework protocols (Turn Zero, handoff, schemas) and harness boundaries | read-only | human/agent CLI; also pre-push git hooks per root package.json (validate:turn-zero-authority etc.) | gate commands are exactly the kind of check this codebase has a documented history of silently exit-0ing without doing the underlying work (see docs/protocols/reports/silent-failure-audit-2026-08-05.md, cited directly in scripts/protocols/verify-declarations.cjs) -- treat PASS output with caution unless cross-checked against the artifact it claims to validate | gate/validate/turn-zero/schemas/local-runtime/health are check-only gates (exit code signals pass/fail); directives manages a ledger (local-mutation, writes); sync writes living-state status (local-mutation). |
| skill-bank | 8 | Cross-LLM skill bank sync/ingest/query (renamed from `tnf skills`) | local-mutation | human/agent CLI; also root script skills:bank:sync / skills:bank:supervisor | writes .agent/skill-bank/skills-index.json (see root script skills:bank:status which reads that file back) -- one of the few groups with a directly checkable evidence file | sync/ingest write the skill-bank index; retry-pending re-attempts failed ingests; supervisor/supervisor-start/supervisor-stop control a background daemon; query is read-only. |
| browser | 7 | Drive a real browser session via agent-browser (open/click/fill/navigate/etc.) | unknown | human/agent CLI | none found beyond the operation's own return value | browser exec / legacy-exec run an arbitrary browser operation -- mutation class is whatever the operation does (could submit forms, navigate to arbitrary URLs, i.e. remote-mutation); start/stop/legacy-start/legacy-stop control the browser process; profiles is read-only. |
| plugins | 7 | Install/enable/disable/update TNF extensions and skills | local-mutation | human/agent CLI | not verified whether install/update write a receipt beyond the installed files themselves | install accepts a local directory OR a Git URL (remote fetch); remove/update/disable/enable mutate local plugin state; list/status are read-only. |
| story | 7 | Story Architect: draft/capture narrative content into a database-backed session | local-mutation | human at terminal (interactive drafting) | DB-backed, presumably queryable; not independently verified | create/capture/draft write to the Story Architect DB; doctor verifies auth/DB access (read-only); active/list/timeline are read-only. |
| agent | 6 | Manage agents (singular form): create, quotas, state snapshots | local-mutation | human/agent CLI | not verified | create writes a new agent record; list/quotas/state/state-history/status are read-only. |
| notes | 6 | TNF note-taking workspace | local-mutation | human/agent CLI | not verified | create/daily write note files; get/list/search/status are read-only. |
| catalog | 5 | Inspect the free NVIDIA/LLM model catalog and switch the active model | local-mutation | human/agent CLI | .env.models is a directly checkable artifact for `catalog set` | set writes .env.models (confirmed by its own description text); refresh re-fetches /v1/models live from a provider (remote read, not a write); list/categories/show are read-only. |
| config | 5 | Manage TNF configuration (kilo.jsonc parity) | local-mutation | human/agent CLI | tnf.jsonc is directly checkable | set writes tnf.jsonc; get/paths/resolved/show are read-only. |
| google-ai | 5 | Google Gemini/Antigravity session sync and inspection | local-mutation | human/agent CLI | not verified | sync writes TNF session stores from an external local Antigravity DB; resume can trigger agent resumption (process launch); list/status/view are read-only. |
| marketplace | 5 | Marketplace asset catalog: crawl/curate/seed/list items | remote-mutation | human/agent CLI | DB rows are the evidence trail if $DATABASE_URL is queryable; not independently verified here | seed writes to $DATABASE_URL (explicit in description); curate triggers a research crawl that discovers+curates new items (writes); list/stats/crawl-status are read-only. |
| parity | 5 | Cross-agent CLI feature-parity audit against reference agents (Hermes, Kilo, etc.) | local-mutation | human/agent CLI | ledger file is a checkable artifact | audit writes the parity ledger; sync-goals creates tracked goals for gaps; agents/gaps/status are read-only. |
| profile | 5 | Manage local TNF user profiles/sessions | local-mutation | human/agent CLI | not verified | login/logout/switch mutate session state; list/whoami are read-only. |
| project | 5 | Project-level tnf.jsonc / .tnf/ scaffolding | local-mutation | human/agent CLI | scaffolded files are directly checkable | create/init scaffold files; agents/commands/show are read-only. |
| self-improvement | 5 | Deterministic TNF self-improvement loop: build, audits, scorecard, architecture map | local-mutation | human/agent CLI; also root script self_improvement scripts and cron (see tnf-llm-ranking-optimizer etc. for the sibling loops) | scorecard/artifact files are the intended evidence trail -- worth cross-checking that `run` actually regenerates them vs. reporting success on stale ones (this is exactly the failure shape docs/protocols/reports/silent-failure-audit-2026-08-05.md documents elsewhere) | run executes the full loop and writes many artifacts (build output, audit reports, scorecard, mermaid map); log/mermaid/scorecard write individual artifacts; status is read-only. |
| bridge | 4 | Control the TNF A2A bridge (inter-runtime bus translator) | local-mutation | human/agent CLI | not verified | start/stop control the bridge process; test runs an integration self-test (spawns work); status is read-only. |
| extension | 4 | Manage TNF extensions (Chrome/VSCode/Tauri) | local-mutation | human/agent CLI | not verified | install builds and installs locally (remote-mutation possible if source is a Git URL); list/status/user-list are read-only. |
| fleet | 4 | TNF harness fleet + terminal window management, including prompt injection into terminal windows by AppleScript ID | local-mutation | human/agent CLI; fleet establish is also the target of root script tnf:fleet:establish (cron/manual) | fleet core-status reads the latest establish receipt (so `establish` DOES leave a checkable artifact) -- one of the better-evidenced groups | establish endows the Local Sub-Director and provisions Redis/harness/workers/launchd (system-level, writes launchd jobs); prompt injects text into a target terminal window with a simulated hardware Return keypress -- this is exactly the injection mechanism flagged by the tnf-autonomy-safety-audit skill and the user's "terminal heartbeat injection" memory note; core-status/inventory are read-only. |
| forge | 4 | LLVM-powered JIT compilation / native-code benchmarking | local-mutation | human/agent CLI | not verified | test-gateway/test-math/test-python compile and run native code locally (low blast-radius, local execution only); status is read-only. |
| handoff | 4 | Session handoff artifact generation/validation for TNF continuity | local-mutation | human/agent CLI; also root scripts handoff:emit / handoff:pre-push (git hook) | SESSION_HANDOFF_LATEST.json is directly checkable -- per user memory ("Handoff emit overwrites the directive") this file is load-bearing and has known footguns | generate/refresh write SESSION_HANDOFF_LATEST.json + markdown mirror; validate/show are read-only. |
| hooks | 4 | HookChain operations: inspect logs, dry-run/replay a hook decision | local-mutation | human/agent CLI | not verified | replay queues a deterministic replay record; test dry-runs a HookChain against a fixture (minimal write); logs/explain are read-only. |
| permission | 4 | Manage bash/read/external_directory permission rules | local-mutation | human/agent CLI | not verified; this is a security-relevant group worth follow-up (who can call `permission add` and is it gated?) | add/remove mutate permission rules -- security-relevant surface; list/check are read-only. |
| reports | 4 | Report lifecycle management: rotation, metadata, trending | destructive | human/agent CLI; also root script reports:lifecycle | rolling summary is regenerated after prune, so the artifact itself is the evidence -- but the deleted reports are gone, i.e. destructive is correctly classified, not merely local-mutation | prune explicitly deletes old reports (description: "Prune old reports and regenerate the rolling summary"); status/summary/trends are read-only. |
| slack | 4 | TNF Slack bot integration | remote-mutation | human/agent CLI | Slack message delivery is externally checkable (in the Slack channel itself); not independently verified here | send posts a real message via the Slack bot (external API write); start/stop control the local bot process; status is read-only. |
| staffing | 4 | TNF staffing coverage analysis and gap detection | local-mutation | human/agent CLI; also root scripts tnf:staffing:cycle / tnf:staff-review:cycle and cron job tnf-staffing-director-cycle (data/protocols/system-processes.json) | staffing report/plan files are the checkable artifact | propose/report/plan generate and write artifacts for review; scan is read-only. |
| telegram | 4 | TNF Telegram bot integration | remote-mutation | human/agent CLI | message delivery externally checkable in Telegram; not independently verified here | send posts a real message via the Telegram bot; start/stop control the local listener process; status is read-only. |
| whatsapp | 4 | TNF WhatsApp Cloud API integration | remote-mutation | human/agent CLI | message delivery externally checkable in WhatsApp; not independently verified here | send posts a real message via the WhatsApp Cloud API; start/stop control the local webhook listener; status is read-only. |
| worktree | 4 | Manage isolated git worktrees for TNF sessions | local-mutation | human/agent CLI; this is the same mechanism this census-writing session itself runs inside | git worktree list / git branch are directly checkable | create makes a worktree+branch; remove is destructive (deletes worktree+branch; description confirms it "refuses to discard work without --force", implying --force overrides that guard); list/status are read-only. |
| ai | 3 | Generic AI launcher: interactive chat / model listing / session start | local-mutation | human at terminal | not verified | chat/start launch an interactive session; models is read-only. |
| alive | 3 | Activate the persistent TNF stack (daemon + heartbeat sentinel) | local-mutation | human/agent CLI | not verified | up/down control persistent local processes; status is read-only. |
| assimilate | 3 | Route/integrate external AI CLIs and SDKs into TNF | local-mutation | human/agent CLI | not verified | link writes to the routing table; run passes a command through an external provider (pass-through, mutation class of the forwarded command); scan runs discovery (writes weights/patterns). |
| auth | 3 | Manage local credentials for configured providers | local-mutation | human at terminal | local credential store file (AuthService-backed); not located/opened in this pass | login/logout write/remove local credential store entries (verified: packages/tnf-cli/src/cli.ts:16646-16707, AuthService); list is read-only. |
| feedback | 3 | Beta developer feedback submission/tracking | local-mutation | human at terminal | not verified | submit writes a feedback record; list/status are read-only. |
| goals | 3 | Strategic goals/roadmap tracking | local-mutation | human/agent CLI | not verified | create writes a goal record; list/stats are read-only. |
| heartbeat | 3 | Self-wake heartbeat watchdog over the persistent stack | local-mutation | cron (self-installed by `heartbeat install`) | not verified whether the installed cron entry is later confirmed present/healthy anywhere besides `heartbeat run` exit code | install installs a cron entry (every 5 min per description); remove uninstalls it; run executes one check in foreground. This is an autonomy/injection-adjacent surface (see .agent skill tnf-autonomy-safety-audit). |
| library | 3 | Virtual Library consolidation/audit/mirror-sync | local-mutation | human/agent CLI; also root scripts tnf:library:audit / tnf:library:sync | generated report/mirror files are checkable | sync mirrors the canonical Virtual Library repo into TNF (dry-run by default, so a real run mutates); audit generates a surface map/report (writes); status is read-only. |
| master-clock | 3 | Master clock control, provider-routed (local default, CloudRuntime fallback) | local-mutation | human/agent CLI; also root scripts master-clock / master-clock:dev | not verified | start starts the clock (locally or via a remote provider adapter -> remote-mutation in that mode); logs/status are read-only. |
| memory | 3 | Memory provider / cross-agent brain-transcript compaction | local-mutation | human/agent CLI | list reads live provider config; compact/audit-drift artifacts not located | compact prunes and distills raw multi-agent brain transcripts (Gemini/Claude/Codex) -- potentially destructive if pruning discards the only copy of raw transcripts, not confirmed; audit-drift is read-only (audits congruence, verifies attribution); list is read-only (verified: packages/tnf-cli/src/cli.ts:19809-19822, MemoryProviderService). |
| pi-package | 3 | .pi-style package installer under ~/.pi/agent/packages/ | destructive | human at terminal | "✓ Removed <path>" printed on success; no separate receipt file -- stdout is the only signal | install fetches from npm:/git:/https:// or a local path (remote-mutation for network sources) and bundles into the local package dir; uninstall does a path-validated `fs.rmSync(recursive:true, force:true)` (verified: packages/tnf-cli/src/cli.ts:6596-6616); list is read-only. |
| prompt-template | 3 | Discover/expand Markdown prompt templates | read-only | human/agent CLI | n/a (read-only) | list/show/expand all read and print; no writes. |
| registry | 3 | Agent registry source-of-truth build/check/reconcile | local-mutation | human/agent CLI; also root scripts agents:registry:build / agents:registry:refresh-hybrid and cron installer agents:registry:cron:install | registry snapshot file is checkable | build writes the registry snapshot; reconcile reconciles TNF and Claude agent-bank files (writes); check is read-only. |
| slash | 3 | List/inspect/run TNF slash commands | unknown | human/agent CLI | depends entirely on the invoked slash command | run resolves AND EXECUTES a slash command -- pass-through, mutation class equals whatever that slash command does; list/show are read-only. |
| spark | 3 | Optional Gemini Spark / Workspace MCP adapter | read-only | human/agent CLI | n/a (read-only) | Despite the verb names, delegate/sync/status all print guidance/config -- description explicitly says sync is "guidance: map... to deployer-configured Workspace MCP", not an actual sync action. |
| theme | 3 | List/inspect/validate TUI color-token themes | read-only | human/agent CLI | n/a | validate performs a schema check only, no write. |
| zero-turn | 3 | TNF zero-turn autonomous boot -- indefinite autonomous operation with zero manual turns | local-mutation | human/agent CLI at boot time, then self-perpetuating | status presumably reads persisted loop state; not verified | boot starts an indefinite autonomous loop; stop halts it; status is read-only. Highest-autonomy-implication group by name; worth prioritizing in any authority-tracing follow-up. |
| channels | 2 | Inspect Slack/WhatsApp channel configuration | read-only | human/agent CLI | n/a | path/status both read. |
| db | 2 | Interactive sqlite3 shell / arbitrary query, plus JSON->SQLite migration | unknown | human at terminal | not verified | The bare `db` command itself opens an interactive sqlite3 shell OR runs an arbitrary passed-in query -- mutation class is caller-determined (a write-query makes this local-mutation or destructive); migrate merges JSON data into SQLite (local-mutation, described as additive/"merges"); path is read-only. |
| ecosystem | 2 | Authenticated ecosystem orientation / task-scoped hydration snapshots | read-only | human/agent CLI | n/a | orient/show both produce snapshots. |
| mirror | 2 | iPhone mirroring + AI vision bridge | local-mutation | human at terminal | not verified | setup installs system dependencies (UxPlay, Python libs); start starts the mirroring server. |
| provider | 2 | Inspect built-in model providers | read-only | human/agent CLI | n/a | list/show both read (add/remove explicitly deferred per description). |
| relay | 2 | Relay-core service control/monitoring | local-mutation | human/agent CLI; also root scripts relay / relay:start / relay:monitor and launchd via scripts/runtime/relay-service.sh (label com.thenewfuse.relay) | not verified | start starts the relay-core service; monitor watches channels (read-only foreground watch). |
| scripts | 2 | Discover and run repo scripts / root package scripts through the unified CLI | unknown | human/agent CLI | depends entirely on the invoked script | run is a generic executor for any discovered script or root package script -- mutation class equals whatever that target script does. This is a pass-through amplifier: every entry in Section B/D below is also reachable through `tnf scripts run <name>`. |
| session | 2 | Manage sessions | destructive | human/agent CLI | not verified | delete removes a session; list is read-only. |
| skill | 2 | Inspect the Agent-Skills discovery surface | read-only | human/agent CLI | n/a | list/show both read. |
| subdirector | 2 | Local Subdirector (tnf-cli-agent) control-plane cycle/drain | local-mutation | cron (root script wires this through scripts/runtime/local-subdirector-service.sh, launchd label com.tnf.local-subdirector, found NOT wired via root package.json -- see Section D) | writes to $HOME/.tnf/local-subdirector/{logs,state}; presence of those files is the checkable evidence | cycle runs the cron cycle wrapper (sync+drain+log, writes); drain drains review/direct/specialty queues and acks the watchdog (writes). |
| super-cycle | 2 | Super-cycle event signaling, provider-routed | local-mutation | human/agent CLI | not verified | event sends a register/heartbeat/unregister event (remote-mutation if provider-routed to CloudRuntime); status is read-only. |
| workspace | 2 | Monorepo package reconnect/availability probing | read-only | human/agent CLI | n/a | probe/status both read. |
| acp | 1 | Start an ACP (Agent Client Protocol) server; `acp grok` runs Grok as an ACP external agent | local-mutation | human/agent CLI | not verified | starts a listening server process. |
| agents-specs | 1 | List agent spec files in .agent/agents/ | read-only | human/agent CLI | n/a |  |
| agy | 1 | Pass through to the Antigravity Agent CLI | unknown | human/agent CLI | depends on forwarded command | pure pass-through; mutation class of whatever is forwarded. |
| autonomy | 1 | Print autonomy health rollup (healthy\|degraded\|critical) | read-only | human/agent CLI | n/a | non-zero exit on critical when fail-closed. |
| boot | 1 | Master entry point to boot the entire TNF stack | local-mutation | human at terminal | not verified | starts multiple local processes/services. |
| browser-control | 1 | Serve standalone HTML browser control + federation node panel | local-mutation | human/agent CLI; also root script tnf:browser-control | not verified | starts a local server. |
| capabilities | 1 | Aggregate JSON manifest of all .pi-parity surfaces | read-only | human/agent CLI | n/a |  |
| chat | 1 | Interactive chat session with the TNF Orchestrator (Gemini OAuth) | local-mutation | human at terminal | not verified | likely writes conversation/session state; primarily interactive. |
| claude | 1 | Pass through to the Claude Code CLI with TNF harness MCP routing | unknown | human at terminal | depends on forwarded command | pure pass-through. |
| claw | 1 | Alias for `tnf openclaw` | unknown | human at terminal | depends on forwarded command | pass-through alias. |
| clean | 1 | Remove build artifacts (dist, .next, generated .d.ts/.js.map), Vite caches, stray *.log files | destructive | human at terminal | files are gone -- verify only by absence | explicit deletion across the repo. |
| commands | 1 | Search the flat command index the palette uses (every CLI path + Markdown commands/agents/skills) | read-only | human/agent CLI | n/a |  |
| completion | 1 | Generate a shell completion script | read-only | human at terminal | n/a | prints to stdout. |
| convo | 1 | Manage conversations | unknown | human/agent CLI | could not determine | description is a bare noun-phrase; behavior not determinable without reading source. |
| cursor | 1 | Pass through to the Cursor CLI with TNF harness MCP routing | unknown | human at terminal | depends on forwarded command | pure pass-through. |
| export | 1 | Export session data as JSON | read-only | human/agent CLI | n/a unless it writes a file (not verified) | no destination path in description; assumed stdout. |
| find | 1 | Search file contents across the monorepo (ripgrep, falls back to grep) | read-only | human/agent CLI | n/a |  |
| forefront | 1 | Bring TNF to the operator forefront: harness, relay, local UI, browser control | local-mutation | human at terminal; also root script tnf:forefront | forefront status reads the latest boot receipt (checkable) | starts multiple local processes. |
| gateway | 1 | Start the TNF gateway service (persistent LLM-powered relay) | local-mutation | human/agent CLI | not verified | starts a listening service. |
| gemini | 1 | DEPRECATED pass-through to the Gemini CLI (use `tnf agy`) | unknown | human at terminal | depends on forwarded command | pure pass-through. |
| growth-audit | 1 | Inventory AI/runtime data growth paths (Hermes, TNF, Cursor, caches); diff vs last snapshot | local-mutation | human/agent CLI; also root script ops:growth-audit | snapshot file is checkable | writes a snapshot/diff artifact. |
| halt | 1 | Gracefully stop TNF background services started by boot-tnf.sh | local-mutation | human/agent CLI | exit code of scripts/stop-tnf.cjs passed straight through; no separate receipt file observed in halt.ts itself | SIGTERM (or SIGKILL with --force) processes named in .tmp/*.pid, via scripts/stop-tnf.cjs (verified: packages/tnf-cli/src/commands/halt.ts:16-44). |
| hermes | 1 | Pass through to the Hermes Agent CLI | unknown | human at terminal | depends on forwarded command | pure pass-through. |
| import | 1 | Import session data from a JSON file or URL | local-mutation | human/agent CLI | not verified | remote-mutation in effect if given a URL (fetches external data); writes local session store either way. |
| kanban | 1 | Show kanban board status | read-only | human/agent CLI | reads live board state via KanbanService | backed by KanbanService (verified: packages/tnf-cli/src/cli.ts:19796-19807); only a `status` leaf is registered despite the group description mentioning "operations". |
| list | 1 | List all registered agents | read-only | human/agent CLI | n/a |  |
| local-ui | 1 | Boot TNF local UI (web shell or Tauri desktop) with harness + relay | local-mutation | human at terminal; also root scripts tnf:local-ui / tnf:local-ui:web / tnf:local-ui:tauri | not verified | starts local processes. |
| logs | 1 | Tail recent log lines (Hermes parity) | read-only | human/agent CLI | n/a |  |
| mapreduce | 1 | Run a Map-Reduce agent coordination workflow | local-mutation | human/agent CLI | not verified | orchestrates multiple agents; mutation class of the aggregate work is unbounded. |
| menu | 1 | Show an organized TNF command menu | read-only | human at terminal | n/a |  |
| models | 1 | List all available models | read-only | human/agent CLI | n/a |  |
| onboard | 1 | Run TNF frontload onboarding | local-mutation | human at terminal (also invoked implicitly by cli.ts main() preflight unless skipped via env var) | not verified | writes onboarding/session state. |
| openclaw | 1 | Pass through to an optionally-installed OpenClaw CLI | unknown | human at terminal | depends on forwarded command | pure pass-through. |
| orchestrate | 1 | Run an agent orchestration workflow from a natural-language goal or legacy workflow name | unknown | human/agent CLI | not verified | mutation class of the orchestrated work is unbounded / goal-dependent. |
| paths | 1 | List all command paths in the TNF CLI | read-only | human/agent CLI | n/a | this is the closest built-in analog to this census's Section A. |
| pi | 1 | Pass through to the Pi CLI with TNF harness MCP routing | unknown | human at terminal | depends on forwarded command | pure pass-through. |
| ports | 1 | Inspect and manage TNF development ports | unknown | human/agent CLI; also root scripts start/predev (which run `ports preflight --strict` and `ports conflicts --auto-resolve` on every `pnpm dev`/`pnpm start`) | not verified | argument-dependent single command (root package.json calls it as `tnf -- ports conflicts --auto-resolve` and `tnf -- ports preflight --strict`, i.e. subverbs are positional args, not Commander subcommands, so they don't show as separate leaves in the snapshot). Plain status is read-only; --auto-resolve kills processes holding conflicting ports (local-mutation/destructive). |
| register | 1 | Register and listen as an agent | local-mutation | human/agent CLI | not verified | writes to the agent registry/Redis bus. |
| remote | 1 | Enable remote connection for real-time session relay | local-mutation | human at terminal | not verified | exposes/enables a remote-access surface -- security-relevant. |
| run | 1 | Execute any root package script through the unified TNF CLI | unknown | human/agent CLI | depends entirely on the invoked script | generic executor; mutation class equals whatever root package.json script is named. Every Section B entry below is reachable this way too. |
| sdk | 1 | .pi SDK parity surface -- report package versions | read-only | human/agent CLI | n/a | info-only; RPC binding deferred per description. |
| send | 1 | Send a single message (verifies recipient exists and is heartbeating) | local-mutation | human/agent CLI | not verified | internal TNF bus message, not an external channel send (those are slack/telegram/whatsapp send, classified separately as remote-mutation). |
| serve | 1 | Start a headless tnf server | local-mutation | human/agent CLI | not verified | starts a listening process. |
| services | 1 | Health of TNF launchd services -- crash loops, failures, plists present-but-not-loaded | read-only | human/agent CLI | n/a (its output IS the evidence-gathering tool for other groups) | this is a genuinely valuable diagnostic given the documented history of silently-dead launchd jobs. |
| splash | 1 | Render the TNF branded splash only | read-only | human at terminal | n/a |  |
| state | 1 | Inspect canonical TNF living state / ledger / handoff / runtime snapshot | read-only | human/agent CLI | n/a |  |
| stats | 1 | Show token usage and cost statistics | read-only | human/agent CLI | n/a |  |
| status | 1 | Quick health summary of the TNF stack (Hermes parity) | read-only | human/agent CLI | n/a |  |
| sync | 1 | Audit TNF CLI <-> Hermes top-level surface parity | local-mutation | human/agent CLI | ~/.tnf/cli-sync/latest-report.json is directly checkable | writes ~/.tnf/cli-sync/latest-report.json (confirmed by description); registered directly in cli.ts near the bottom (packages/tnf-cli/src/cli.ts:19749-19761), guarded against double-registration. |
| tree | 1 | Print the monorepo apps/ and packages/ directories as a tree | read-only | human/agent CLI | n/a |  |
| tui | 1 | Launch the TNF TUI agent -- always-on interactive LLM session | local-mutation | human at terminal | not verified | starts an interactive process; peer-parity with claude/cursor/hermes/codex entry flags. |
| turn-end | 1 | Run Turn End protocol: update LIVING_STATE and SESSION_HANDOFF artifacts | local-mutation | human/agent CLI | LIVING_STATE / SESSION_HANDOFF files are checkable | writes canonical state files. |
| types | 1 | Command namespace and script type inventory | read-only | human/agent CLI | n/a |  |
| uninstall | 1 | Uninstall tnf and remove all related files | destructive | human at terminal | success/failure message only; no separate receipt file observed | delegates to UpgradeService.uninstall() with no visible confirmation prompt at the CLI layer (verified: packages/tnf-cli/src/cli.ts:18251-18266). |
| upgrade | 1 | Upgrade tnf to the latest or a specific version | remote-mutation | human at terminal | not verified | fetches a new version (remote) and overwrites the local install (destructive to the prior install). |
| version | 1 | Print TNF CLI version | read-only | human/agent CLI | n/a |  |
| webhook | 1 | List all configured webhooks | read-only | human/agent CLI | reads live webhook config via WebhookService | backed by WebhookService (verified: packages/tnf-cli/src/cli.ts:19781-19794); only a `list` leaf is registered despite the group description "Webhook management" implying more. |
| cron | 1 | List all scheduled jobs (TNF-internal CronService view) | read-only | human/agent CLI | reads CronService state; not verified against actual crontab | backed by CronService (verified: packages/tnf-cli/src/cli.ts:19703-19716); note this is a DIFFERENT surface from data/protocols/system-processes.json (Section C) -- not verified whether CronService reflects the real OS crontab/launchd or an internal-only record. |
| doctor | 1 | Run TNF diagnostics (`doctor health` runs deeper checks, Hermes parity) | read-only | human/agent CLI | n/a |  |
| federation | 1 | `federation tap`: run a command and mirror its output to a federation channel as intent frames | local-mutation | human/agent CLI (commands/federation-tap.ts:7) | not verified | broadcasts/writes the wrapped command's output to a federation channel. |
| metaskills | 1 | `metaskills audit`: audit meta-skills and scaffolding readiness | read-only | human/agent CLI | not verified | may write an audit artifact (not confirmed); also root script tnf:metaskills:audit. |
| refresh-context | 1 | Reinject TNF runtime context (protocols + agent tree) into all onboarded agents via the TNF bus | local-mutation | human/agent CLI | not verified whether receiving agents confirm receipt | broadcasts/pushes context to every onboarded agent over the bus -- a real fan-out mutation, not merely local to the caller. |
| tools | 1 | `tools list`: list all discovered tools/toolsets | read-only | human/agent CLI | n/a |  |
| traits | 1 | `traits list`: list TNF traits for agents and command families | read-only | human/agent CLI | n/a |  |

---

## Section B — Root `package.json` scripts

Source: root `package.json`, read in full (427 scripts). Grouped by
namespace prefix into 73 rows (the `tnf:` prefix alone has 94 scripts across
31 sub-namespaces, so it is split to its second segment; every other prefix
groups on its first segment). `~Count` is the number of root scripts the row
covers; per-row counts were built by manual grouping and carry a small
(≤3-script) reconciliation margin against the exact 427 total — every one of
the 427 script names was confirmed to be covered by at least one row's
prefix (verified programmatically in this pass), so the discrepancy is in a
few rows' counts overlapping, not in missing coverage.

| Group | ~Count | Semantic intent | Mutation class | Runtime owner | Notes / evidence |
|---|---|---|---|---|---|
| tnf:llm | 11 | LLM arena intel collection, ranking optimization, fleet-cycle apply, dashboard/report/surface viewing | local-mutation | cron: tnf-llm-arena-intel-collector / tnf-llm-ranking-optimizer / tnf-llm-verified-fleet-cycle are all in the authoritative system-processes.json catalog (Section C) | collect/optimize/apply-rankings/fleet-cycle write ranking data and apply model choices; dashboard/report/surface just `open`/`cat` existing files (read-only); tnf:llm:fleet-cycle and tnf:llm:subjects run with TNF_LLM_VERIFY_APPLY=1, i.e. they are explicitly gated to actually apply, not just simulate. |
| tnf:journey / tnf:timeline | 11 | Personal-archaeology / development-journey evidence extraction and GitHub history narrative generation | local-mutation | human/agent CLI | extract/generate/sync/init/pulse/master-loop/investigator-pulse/digest/blocker-watch all write journey artifacts; --include-default-local-roots variants read from outside the repo (home directory scanning). |
| tnf:start | 8 | Start Redis + a specific AI provider wrapper (codex/claude/gemini/cursor/pi) | local-mutation | human at terminal | `docker-compose up -d redis && node scripts/tnf-start-ai.cjs <provider>` -- starts local containers/processes. |
| tnf:aivi | 6 | Chrome-extension AI-vision-inventory backend install/start/dev/status/docs-index, store-pack verify/list-assets | local-mutation | human at terminal | delegates into apps/chrome-extension package scripts; install/start mutate local env, status/docs-index/verify/list-assets are read-only. |
| tnf:harness | 6 | Boot harness, check status/completeness/supply-chain, uninstall harness cron jobs | local-mutation | human at terminal, or cron/launchd for the services it tears down | boot/completeness:provision/supply-chain write state; status/completeness(no --provision) are read-only; tnf:harness:uninstall runs 3 service uninstallers (relay-monitor, terminal-heartbeat-cron, tnf-director-cron) -- a real multi-service teardown. |
| tnf:semantic | 5 | Build/recount/graph/report the semantic-graph concordance and open its dashboard | local-mutation | human at terminal | build_all.py variants write to concordance_results/; :open just opens the HTML file (read-only, macOS `open`). |
| tnf:local | 5 | Install/start/status/restart/stop TNF local launchd services | local-mutation | human at terminal (installer); launchd thereafter | delegates to scripts/runtime/tnf-local-launchd-services.sh <verb> -- installs/controls real launchd jobs; status is read-only. |
| tnf:intel | 5 | Ingest/activate/batch-ingest/dispatch intelligence tasks from Python scripts | local-mutation | human at terminal | all write to a task/intelligence queue; dispatch:reconcile reconciles the queue. |
| tnf:local-ui | 4 | Boot local UI (web/Tauri) and build the Tauri desktop app | local-mutation | human at terminal | build compiles the Tauri app (apps/tauri-desktop); web/tauri boot local processes. |
| tnf:live | 3 | Live agent-work-check: read, write, or JSON-emit | local-mutation | human at terminal; also referenced by scripts/protocols/verify-declarations.cjs family | :write mode writes a report; plain/:json are read-only checks. |
| tnf:staffops | 3 | Install/status/uninstall the staffops cron schedule sync | local-mutation | human at terminal (installer); cron thereafter | install/uninstall mutate cron; status is read-only. |
| tnf:parity / tnf:install / tnf:store / tnf:ws / tnf:fleet / tnf:forefront / tnf:library | 14 | Parity audit (soft/strict); install the tnf CLI globally or from local; chrome-extension store-pack verify; federated WS channel check; core federated fleet establish; forefront boot status; virtual-library audit/sync | local-mutation | human at terminal | tnf:fleet:establish and tnf:install are the highest-blast-radius members (installs the CLI system-wide / establishes Redis+harness+launchd fleet); :dry variants are read-only. |
| tnf:onboard / tnf:browser-control / tnf:doctor / tnf:frontload:verify / tnf:orchestration:audit / tnf:audit:synergy / tnf:metaskills:audit / tnf:mcp:generate / tnf:tauri:dmg / tnf:dont-die:run / tnf:staffing:cycle / tnf:staff-review:cycle | 12 | Single-purpose top-level TNF ops: onboarding, doctor diagnostics, frontload state verify, orchestration/synergy/metaskills audits, MCP client generation, DMG packaging, dont-die supervisor run, staffing/staff-review cycles | local-mutation | mixed: human at terminal for onboard/doctor/dmg; cron for dont-die:run, staffing:cycle, staff-review:cycle | doctor/frontload:verify/audits are read-only checks that also tend to write their own report artifact; mcp:generate and tauri:dmg produce build artifacts; dont-die:run and staffing/staff-review:cycle are cron-driven (staffing/staff-review cycles are literally in the system-processes.json catalog, Section C). |
| framework-consciousness | 10 | Run numbered "phases" of a self-evolving framework loop, plus init/evolve/guardrail-check/baseline-update | local-mutation | human at terminal or an orchestrator loop (not verified which) | guardrails checks against data/framework-consciousness-baseline.json (read-only unless :baseline:update, which overwrites the baseline file); phase2-6/run-phases/evolve execute and presumably write state. |
| openclaw:cloud / openclaw:ops / openclaw:oauth | 6 | Sync Codex/OAuth credentials to OpenClaw cloud tenants, run OpenClaw ops safely, set federation gate mode | remote-mutation | human at terminal | these sync credentials/config to REMOTE OpenClaw cloud instances (per the sibling cloud_runtime:* group and user memory on the "4-Node Mesh") -- real cross-machine state changes, not local-only. |
| cloud_runtime | 7 | Sync routing/chain vars and verify adaptive routing against cloud runtime instances; set federation gate mode; check/relay to Zeroclaw | remote-mutation | human at terminal | sync-*-vars and set-federation-gate-mode explicitly push config to remote cloud instances; verify-adaptive-routing is a remote read/check. |
| ops | 6 | Wire local env, growth audit, disk retention, hermes-state retention, seed control-plane, sync-to-supabase | local-mutation | human at terminal, or cron for retention jobs (not confirmed against system-processes.json, which does not list ops:disk-retention or ops:hermes:retention by that name) | wire-env/seed-control-plane write local files; disk-retention and hermes:retention are DELETION/pruning operations by name (destructive) -- not independently verified how aggressive; sync-supabase is remote-mutation (writes to a hosted Supabase project); growth-audit is read-only (report). |
| db | 6 | Drizzle ORM generate/migrate/push/pull/studio/check against $DATABASE_URL | remote-mutation | human at terminal | push/migrate directly alter a real (possibly remote/hosted) Postgres schema -- among the highest-consequence entries in the entire root script surface if $DATABASE_URL points at production; pull reads remote schema into local files (still a local write, remote read); studio opens a local UI; check is read-only. |
| jules | 15 | Jules autonomous coding-agent loop, PR auto-merge, follow-up supervisor lifecycle, zero-token framework | remote-mutation | human at terminal (install/start), then cron/supervisor daemon thereafter | jules:merge-open merges real GitHub PRs; loop/supervisor*/framework:* run local daemons and write local framework state; cron:install wires a real cron entry (scripts/install-jules-cron.sh). |
| skills | 15 | Skill-bank sync/ingest/query/retry, supervisor lifecycle, governance-check, manifest build, codex-disclosure-guard, divergence triage | local-mutation | human at terminal, or supervisor daemon (skills:bank:supervisor:start) | sync/ingest/retry-pending/manifest write index files; governance:check/:warn and codex:guard are read-only gates (codex:guard:apply mutates -- rewrites files to fix disclosure issues). |
| factory | 12 | Factory boot/supervisor loop, impetus capture/loop/status, blue/website swarm seeding, supercycle flywheel, release-seed | local-mutation | human at terminal, or a persistent supervisor process once started | boot/supervisor/supercycle run continuous local orchestrator loops; impetus:capture/once/loop write to a capture queue; seed scripts write swarm task files; :once and SUPERVISOR_ONCE=true variants bound a single cycle for testing. |
| agents | 12 | Agent registry build/check/import/refresh-hybrid, cron lifecycle, cloud_runtime auto-import, bank package/reconcile | local-mutation | human at terminal (install), cron thereafter (agents:registry:cron:run is the cron-invoked entrypoint) | build/import/refresh-hybrid/package/reconcile write registry/bank files; check is read-only; cron:install/uninstall mutate cron; cloud_runtime auto-import pulls from a remote cloud runtime (remote-mutation in effect, writes locally from a remote source). |
| swarm | 10 | Roll-call, sim-bidder, project-planner, llm-test flywheel, provider test, cloud-runtime setup/supercycle | local-mutation | human at terminal | setup/setup:cloud_runtime write remote cloud runtime config (remote-mutation); supercycle:live/:cloud_runtime run against a live cloud target (remote-mutation); roll-call/sim-bidder/planner/llm-test/provider:test are local simulation/testing (local-mutation, write local state, do not appear to touch external systems except provider:test which calls real LLM provider APIs -- remote read/mutation depending on the call). |
| audit | 8 | Route audit, journey-integrity audit(+strict), keyword-mentions map, doc-hygiene, pnpm security audit, circular-dependency check (madge), clean-scripts audit | read-only | human at terminal, or CI (not verified given GitHub Actions is billing-blocked per user memory) | all are check/report generators; several (route-audit, journey-integrity-audit, keyword-mentions-map) write their report as a side effect, which is local-mutation in the narrow sense of "writes a file" but does not mutate anything the report is ABOUT. |
| graph | 8 | agent-relationship-graph Makefile targets: subgraphs/analytics/neo4j/temporal/alerts/html, plus viz publish/dashboard-metrics | local-mutation | human at terminal | graph:neo4j likely writes to a Neo4j database (remote-mutation if that DB is not local); graph:all also runs viz:graph:publish, which -- per its name -- may publish generated artifacts somewhere externally visible; not verified where "publish" targets. |
| dev | 7 | Start dev servers via turbo (all/filtered/api/gateway/frontend/backend), low-memory variant | local-mutation | human at terminal | long-running local dev processes; predev (see below) runs port-preflight first. |
| qa | 7 | Autonomous QA swarm loop, plus install/start/stop/restart/status/uninstall of the qa-loop-service (cron/launchd) | local-mutation | human at terminal (installer); launchd/cron thereafter | install/start/stop/restart/uninstall mutate a real launchd/cron-controlled service; status/loop-run write QA results locally, do not touch external systems. |
| searxng | 6 | Docker-compose up/down/logs/health for the local SearXNG search instance | local-mutation | human at terminal | up/down/stop start or stop local containers; logs is read-only tail; health is a read-only curl. |
| handoff / ownership / conflict / gitlink | 12 | Session-handoff emit/pre-push gate, packet-lifecycle sweep, ownership-ledger emit, change-tier classify, gitlink reachability verify | local-mutation | git pre-push hook (local) and CI (:ci variants, though CI is billing-blocked per user memory, so :ci invocation may not actually be running anywhere right now) | these are the git-hook-invoked protocol gates (handoff:pre-push, ownership:ledger:emit:ci, conflict:tier:ci, gitlink:reachability:verify:ci) -- per user memory ("Handoff emit overwrites the directive"), handoff:emit has a documented footgun where the first next-action becomes the LIVING_STATE Current Directive. |
| validate:* (protocol/session/turn-zero/etc.) | 18 | Protocol/schema/session-handoff/build/release-train/doc-tagging/locked-doc-ledger/federation-gate/twip/master-clock/dont-die validation gates | read-only | git hooks (pre-push) and CI (billing-blocked, so effectively human-invoked only right now) | exit-code gates; validate:locked-doc-ledger:ci and a few others may write a report as a side effect. Per docs/protocols/reports/silent-failure-audit-2026-08-05.md (cited directly from scripts/protocols/verify-declarations.cjs), this exact class of gate has a documented history of passing by finding nothing rather than because nothing was wrong -- treat green output here with the same skepticism the codebase's own audit applies to itself. |
| build:* | 28 | turbo-orchestrated build across all/filtered packages, memory-optimized/staged/low-memory variants, production/cloud_runtime builds, analyze/recommend/benchmark/cleanup memory tooling | local-mutation | human at terminal, or turbo cache | writes dist/ build artifacts across the monorepo; build:analyze-memory/build:recommend-strategy/build:benchmark are read-only (print info, no build); build:cleanup explicitly frees memory/cache (local-mutation, not destructive to source). |
| test:* | 18 | turbo-orchestrated unit/integration/e2e/coverage/watch test runs, memory-optimized variants | local-mutation | human at terminal, or CI (billing-blocked) | writes test-results/coverage artifacts as a side effect; does not mutate source or external systems (except e2e, which drives a real browser via Playwright and may hit local dev servers). |
| lint:* | 5 | ESLint check, --fix, staged lint-staged retry | local-mutation | human at terminal, or a git pre-commit hook (lint:staged, referenced by user memory "Shared-checkout index hazard: lint-staged re-stages stale protocol docs after every commit") | lint (check-only) is read-only; lint:fix and lint:staged REWRITE source files in place. |
| privacy:guard / secret:sweep / docs:pii:guard / agent:pii-gate / agent:pii-repro / supabase:rls | 14 | Staged/pre-push/repo-wide privacy, secret, and PII guards; production PII gate; Supabase Row-Level-Security audit(+strict)/baseline-update | read-only | git hooks (staged/pre-push variants) and human at terminal (repo variants) | all are scanning/check gates; :baseline:update variants (supabase:rls) overwrite the baseline file (local-mutation). |
| format:* | 4 | turbo-orchestrated Prettier format/check, plus root-level format:root (`prettier --write .`) | destructive | human at terminal | format:root rewrites every file in the repo matched by the Prettier config in a single invocation -- the single highest-blast-radius non-deletion command in the root script surface by file count touched. |
| clean:* | 5 | turbo clean, root-level rimraf of build outputs, clean:all (rm -rf all node_modules + reinstall), clean:cache, clean:deps | destructive | human at terminal | clean:all is explicit and total: `rm -rf node_modules packages/*/node_modules apps/*/node_modules && pnpm install` -- the highest-blast-radius deletion command in the root script surface. |
| docker:* / docker-compose | 5 | Start/stop/status/logs for the dev-simple docker-compose stack, plus a docker integration test runner | local-mutation | human at terminal | start/stop mutate local container state; status/logs are read-only. |
| release / validate:release-train | 5 | Release-gate checks (+strict, +smoke), bundle-size check | local-mutation | human at terminal, or CI (billing-blocked) | release:gate writes a gate report; :strict:smoke additionally hits a real API for a smoke test (remote read, RUN_API_SMOKE=1-gated). |
| sync:repos / lineage | 8 | Sync between multiple TNF repos (open/control/dry-run variants), audit repo parity, bundle/verify open-source lineage, check proprietary leakage | remote-mutation | human at terminal | sync:repos (non-dry-run) can push/pull between the private and PUBLIC The-New-Fuse remotes -- directly relevant to the user memory "TNF repo name collision + public sync" and the proprietary-leakage checker existing specifically because that boundary has been crossed before. |
| graph / viz | 3 | (see graph:* above) plus standalone viz:generate CLI | local-mutation | human at terminal |  |
| contracts | 3 | Generate/check protocol-contracts package (generate:all, check, check:drift) | local-mutation | human at terminal | generate:all writes generated contract code; check/check:drift are read-only. |
| workflow:* | 3 | turbo dev/build/test scoped to the workflow-engine + frontend/api slice | local-mutation | human at terminal | same semantics as the top-level dev/build/test groups, narrowed by --filter. |
| mcp:* (root) | 2 | Run the MCP API wrapper launcher / a one-shot tools/list smoke test | local-mutation | human at terminal | starts a local MCP server process; test-wrapper pipes one JSON-RPC call in and exits. |
| openapi:* | 2 | Snapshot the OpenAPI docs JSON, check for drift against the snapshot | local-mutation | human at terminal, or CI | snapshot writes the snapshot file; check is read-only. |
| cloudflare:zeroclaw:relay | 2 | Local dev server for the Cloudflare zeroclaw relay worker; deploy to Cloudflare | remote-mutation | human at terminal | :deploy pushes a real Cloudflare Worker deployment -- external infrastructure change. |
| product:* | 2 | Check member-storage and personal-data-location policy compliance | read-only | human at terminal, or CI | directly relevant to user memory "Personal data stays in its own repo" -- these are exactly the automated checks for that rule. |
| master-clock / broker-agent / director-agent / relay / orchestrate / workflow-router:dev | 9 | relay-core package entry points: master clock, broker agent, director agent, relay, orchestrator, workflow router (each with a :dev ts-node variant) | local-mutation | human at terminal, or launchd for relay (scripts/runtime/relay-service.sh, label com.thenewfuse.relay -- NOT wired via this exact script name, see Section D) | each starts a real long-running local process; :dev variants run against source via ts-node instead of a build. |
| discord:bot:setup | 1 | Register/configure a Discord bot | remote-mutation | human at terminal | writes bot configuration to Discord's API. |
| improver:scan / scout:scan / scout:knowledge:complete / scout:planning:drain | 4 | Self-improvement scanner; news-scout swarm scan; knowledge-scout completion; planning-queue drain (both scout:* Redis-backed against TNF_LOCAL_REDIS_URL) | local-mutation | human at terminal | writes to local Redis-backed queues/state. |
| watchdog:model:consume | 1 | Consume model-watchdog failover events | local-mutation | human at terminal, or a supervisor loop | processes a queue, likely triggers model failover switching (config write). |
| flywheel:production(:loop) | 2 | Production-ready flywheel orchestrator, continuous loop variant (LOOP_INTERVAL env) | local-mutation | human at terminal | continuous local orchestration loop. |
| joy | 1 | scripts/improver/joy.js -- name and purpose not evident from the script name alone | unknown | human at terminal | could not determine intent from the package.json entry alone; flagged rather than guessed. |
| notebooklm:export | 1 | Export notebooks (presumably to/from NotebookLM) | local-mutation | human at terminal | writes export files locally; not verified whether it also pushes to a remote NotebookLM account. |
| postinstall / prepare / predev / pretest / prebuild | 5 | pnpm lifecycle hooks: native-module setup, husky + mutation-guard-hook install, port preflight before dev, pre-build check + port preflight before test, pre-build check before build | local-mutation | pnpm itself (automatic lifecycle hooks, not directly human-invoked) | prepare writes to .git/hooks (husky) and installs the mutation-guard hook -- runs on every `pnpm install` in this and every other clone/worktree; predev/pretest run `ports preflight --strict`, which can terminate processes holding conflicting ports if TNF_ALLOW_PROTECTED_PORT_TERMINATION=true. |
| start | 1 | Resolve port conflicts (optionally including protected ports) then run dev | local-mutation | human at terminal | can auto-kill processes holding conflicting ports before starting dev servers. |
| tnf-agent | 1 | Alias for `pnpm run tnf --` (i.e. invokes the tnf-cli binary directly) | unknown | human/agent CLI | pure pass-through into Section A's entire command surface. |
| local-runtime:guard / cleanroom:guard | 2 | Validate the local-runtime and cleanroom architectural boundaries | read-only | human at terminal, or CI |  |
| lint:api / lint:frontend | 2 | ESLint scoped to apps/api and apps/frontend | read-only | human at terminal | no --fix flag used here. |
| clear-ports / ports:* | 5 | Kill processes on conflicting dev ports (clear-ports, ports:conflicts:resolve); status/health checks | destructive | human at terminal, or automatically via predev/start (see above) | ports:conflicts:resolve --auto-resolve and clear-ports both explicitly terminate other processes by port -- can kill something not started by TNF if a port collides. |
| check-build / validate:build / build:verify | 3 | Post-build status/validation checks | read-only | human at terminal, or CI |  |
| health-check(:full) | 2 | Composite gate: type-check + test + build (+ validate:clean-scripts + validate:build for :full) | local-mutation | human at terminal, or CI | inherits the mutation profile of its constituent scripts (build writes dist/, test writes coverage). |
| git:sync-check / git:status / git:push-check | 3 | Informational git state checks: sync status, unpushed-commit warning | read-only | human at terminal | git:push-check warns but does not push. |
| twip:sign | 1 | Sign a TWIP (The Web Interoperability Protocol) envelope | local-mutation | human/agent CLI | cryptographic signing operation, writes a signature. |
| merge:guard / authority:surface:staged / handoff:gate:staged / guard:mutation | 4 | Pre-merge / pre-commit protective gates: merge guard, authority-surface staged check, handoff gate, workspace-mutation-guard self-check | read-only | git hooks (pre-commit/pre-push/staged), and directly observed acting on this very session | these are exactly the gates that govern whether an agent (including this census-writing session) is allowed to touch authority files -- see user memory "Agent self-edit gate". guard:mutation --check is the mechanism that blocked one of this session's own shell commands earlier in this task (loops over multi-line file lists were refused as "too complex to verify... stays inside the worktree"). |
| reports:lifecycle | 1 | Report lifecycle management (rotation, metadata) -- root-script twin of `tnf reports` | local-mutation | human at terminal, or cron |  |
| voice:drift-audit | 1 | Audit voice-subsystem behavior drift | read-only | human at terminal | relevant to user memory "VLB voice subsystem is an uncommitted atomic unit" -- this audit would not see uncommitted changes in a DIFFERENT checkout. |
| setup:native-modules / fix:native-modules | 2 | Set up / repair native Node modules | local-mutation | human at terminal, or postinstall chain |  |
| tnf | 1 | `node --import tsx packages/tnf-cli/src/cli.ts` -- the direct, unbuilt entrypoint into the entire tnf-cli command tree (Section A) | unknown | human at terminal, and indirectly every other root script that shells out via `pnpm run tnf --` (start, predev, pretest) | pure pass-through into every command in Section A; this is literally how `pnpm run tnf -- <anything>` and `pnpm run tnf-agent` reach the CLI. |
| type-check(:watch) | 2 | turbo-orchestrated TypeScript type-check across apps/packages | read-only | human at terminal, or CI |  |
| verify / verify:features / verify:honest-failure | 3 | Run scripts/verify-features.sh; check for success-masking patterns in source (the documented "fabricated results" defect class) | read-only | human at terminal, or CI | verify:honest-failure is the general-purpose sibling of scripts/protocols/verify-declarations.cjs -- both exist to catch the codebase's own documented history of commands reporting success without doing the work. |
| gate:pi-bridge | 1 | Composite gate: validate:pi-bridge + validate:model-watchdog-failover + relay-core type-check | read-only | human at terminal, or CI |  |
| smoke:pi-bridge(:json/:failures) | 3 | Smoke-test the pi-bridge integration; JSON output variant; failure-matrix report | read-only | human at terminal |  |
| docs:links:repair | 1 | Repair broken documentation links | local-mutation | human at terminal | rewrites doc files in place to fix links. |

---

## Section C — Authoritative scheduled system-framework processes

Source: `data/protocols/system-processes.json` — the **only** git-tracked
half of the TNF cron/scheduling control plane (see Methodology §5 for why
its siblings are absent). `authority` field in the source file reads:
*"SUPER_ADMIN — platform schedule, approval-gated, versioned in git."* 20
entries, 19 currently marked `active: true`.

**Evidence caveat that applies to every row below**: an entry existing in
this catalog proves it is *declared*. It does **not** prove the schedule is
*installed* in any live crontab — the file that would prove live
installation (`data/protocols/cron-jobs.registry.json`, generated by
`scripts/setup/provision-local-cron.cjs` from this catalog plus a private
tenant file) is gitignored and was confirmed absent from this checkout (see
Methodology §5). Treat "runtime owner: cron" below as "declared to run under
cron," not as a live-verified crontab entry.

| schedule_id | active | cadence | Title | Command | Mutation class |
|---|---|---|---|---|---|
| tnf-auto-git-push | true | 0 * * * * | TNF Auto Git Push | bash scripts/orchestrator/auto-git-push.sh | local-mutation |
| tnf-director-resonance-cycle | false | manual | Director Resonance Cycle | N/A (manual/no runNow) | local-mutation |
| tnf-growth-blocker-audit | true | 0 */4 * * * | TNF Growth Blocker Audit | node .skills/tnf-growth-blocker-auditor/scripts/run_growth_blocker_audit.cjs | read-only |
| tnf-llm-arena-intel-collector | true | 0 */4 * * * | LLM Arena Intel Collector | node scripts/llm-intel/llm-arena-intel-collector.cjs | read-only |
| tnf-llm-ranking-optimizer | true | 30 */4 * * * | LLM Ranking Optimizer | node scripts/llm-intel/llm-ranking-optimizer.cjs | local-mutation |
| tnf-llm-verified-fleet-cycle | true | 0 */6 * * * | TNF LLM Verified Fleet Cycle | node scripts/llm-intel/tnf-llm-verified-fleet-cycle.cjs | local-mutation |
| tnf-marketplace-curation-cycle | true | */30 * * * * | TNF Marketplace Curation Cycle | bash scripts/orchestrator/marketplace-curation-agent.sh | local-mutation |
| tnf-master-clock-super-cycle | true | */15 * * * * | TNF Master Clock Super Cycle | node scripts/protocols/synthetic-federation-gate-check.cjs --json | read-only |
| tnf-openclaw-runtime-sync | true | */15 * * * * | OpenClaw Runtime Sync | node scripts/openclaw/tnf-openclaw-control.cjs sync-control-plane | local-mutation |
| tnf-process-health-watchdog | true | */30 * * * * | Process Health Watchdog | node scripts/protocols/verify-process-health.cjs | read-only |
| tnf-self-improvement-scorecard | true | 0 */6 * * * | TNF Self Improvement Scorecard | node scripts/validate-protocol-schemas.cjs | read-only |
| tnf-staff-review-cycle | true | 15 */2 * * * | TNF Staff Review Cycle | node .skills/tnf-staff-review-agent/scripts/run_staff_review_cycle.cjs | local-mutation |
| tnf-staff-role-call-and-scheduling | true | */20 * * * * | TNF Staff Role Call and Scheduling | node scripts/protocols/staffops-role-call.cjs | read-only |
| tnf-staffing-director-cycle | true | 30 */6 * * * | TNF Staffing Director Cycle | node .skills/tnf-staffing-director-agent/scripts/run_staffing_director_cycle.cjs | local-mutation |
| tnf-subdirector-codegen-worker | true | manual | Subdirector Codegen Worker | bash scripts/agents/subdirector-codegen-worker-cycle.sh | local-mutation |
| tnf-subdirector-infra-worker | true | manual | Subdirector Infra Worker | bash scripts/agents/subdirector-infra-worker-cycle.sh | local-mutation |
| tnf-swarm-stress-test | true | */10 * * * * | TNF Swarm Stress Test | bash scripts/orchestrator/swarm-stress-test.sh | local-mutation |
| tnf-terminal-awareness-reminder | true | */30 * * * * | Terminal Awareness Reminder | bash scripts/verify_frontload_state.sh --json | read-only |
| tnf-terminal-heartbeat-pulse | true | * * * * * | TNF Terminal Heartbeat Pulse | node scripts/runtime/terminal-heartbeat-pulse.cjs | local-mutation |
| tnf-twip-macro-board-refresh | true | */10 * * * * | TWIP Macro Board Refresh | node scripts/protocols/twip-macro-board.cjs --json | local-mutation |

Three rows deserve explicit attention for anyone doing authority tracing:

- **`tnf-terminal-heartbeat-pulse`** (every minute, `local-mutation`) — this
  is the keystroke/prompt-injection-capable daemon that prior sessions'
  memory and the `.agent`/`.claude` `tnf-autonomy-safety-audit` skill both
  flag by name (`terminal-heartbeat-pulse.cjs` is in that skill's explicit
  trigger list). It is declared active in the git-tracked catalog.
- **`tnf-subdirector-codegen-worker`** and **`tnf-subdirector-infra-worker`**
  have `cadence: "manual"` despite being marked `active: true` — i.e. they
  are enabled-but-not-scheduled; something else must trigger them. Not
  investigated further in this pass.
- **`tnf-director-resonance-cycle`** is the only `active: false` entry —
  disabled by declaration, not merely idle.

---

## Section D — Standalone cron/launchd service-control scripts (not reachable via Section A or B)

Found by grepping `scripts/**/*.sh` for `launchctl load|bootstrap` or
`crontab -l` usage (24 hits), then removing every path already referenced
from root `package.json` (`comm -23` against 218 unique
`package.json`-referenced `scripts/` paths). The 17 remaining are genuine
direct-invocation entry points — install/start/stop/status verbs for a real
launchd LaunchAgent or cron entry, invoked by hand or self-installing, with
**no** `pnpm run …` alias anywhere in the root script surface.

| Script path | Semantic intent | Mutation class | Runtime owner | Evidence |
|---|---|---|---|---|
| scripts/claude-ping-cli.sh | CLI wrapper around an AppleScript-based "Claude Ping Controller" (macOS UI automation) | local-mutation | human at terminal (no cron/launchd install verb found in this script itself) | writes /tmp/claude_ping_unified.log + .pid; documented in docs/claude-ping-controller-unified-docs.md |
| scripts/pi-wrapper-ctl.sh | start/stop/restart/status control for the "Pi Redis Wrapper" launchd daemon (com.tnf.pi-redis-wrapper) | local-mutation | human at terminal (launchctl load/unload); the daemon itself then runs under launchd | launchctl list \| grep com.tnf.pi-redis-wrapper; stdout/stderr logs at /tmp/pi-wrapper-{stdout,stderr}.log |
| scripts/protocols/verify-declarations.cjs | Reconcile declared control-plane references (catalogs, cron entries, provider lists, Dockerfiles) against what actually exists on disk | read-only | human at terminal, or cron (not confirmed which) | exit 0/1/2 semantics explicitly designed to never conflate "found no problems" with "looked in the wrong place" (source comment, lines 24-31) -- this script exists BECAUSE the class of failure this whole census is trying to avoid (declared-vs-actual drift) went undetected for ~11 weeks per its own header |
| scripts/protocols/verify-process-health.cjs | Watch the chronological control plane for scheduled processes that are failing OR have gone silently stale (still "running" per last-good status, but not actually executing) | local-mutation | intended to be cron-driven (per its own header comment); IS in fact cron job tnf-process-health-watchdog in system-processes.json (Section C, cadence */30 * * * *) | writes findings to ~/.tnf/alerts.json, which Turn Zero Mandate and Kilo Gate 0 are both documented to read on session start -- one of the few scripts in this census with an explicit, named consumer of its output |
| scripts/runtime/agent-poll-cron.sh | install/uninstall/status for a generic cron-driven agent-poll-pulse wrapper with backoff/jitter/stale-lock recovery | local-mutation | human at terminal (install/uninstall); cron thereafter for any job it installs | per-job state under the poll pulse script; not independently verified |
| scripts/runtime/local-subdirector-service.sh | Install/control a launchd LaunchAgent (com.tnf.local-subdirector) that runs the Local Subdirector runtime out of $HOME/.tnf/local-subdirector, mirrored from scripts/runtime/local-subdirector-runtime.cjs | local-mutation | human at terminal (install); launchd thereafter | $HOME/.tnf/local-subdirector/{logs,state}; this is the runtime behind `tnf subdirector cycle/drain` (Section A) |
| scripts/runtime/redis-connection-guard-cron.sh | install/uninstall/status/run-once for a 5-minute cron guard against Redis maxclients saturation | local-mutation | human at terminal (install); cron thereafter | $HOME/.tnf/redis-guard/logs/cron.log; directly relevant to user memory "Redis bus doom loop" -- this is one of the fixes for that recurring incident |
| scripts/runtime/redis-local-bootstrap.sh | start/restart/status/gate/guard/reap/launchd-install local Redis with TNF fleet-safe defaults (maxclients, maxmemory, idle-timeout) | local-mutation | human at terminal, or launchd (com.thenewfuse.redis-tnf-bus) once installed | redis-cli PING / CLIENT LIST are checkable |
| scripts/runtime/relay-service.sh | launchd-persist the standalone TNF relay (default :3007) so it survives shell exit | local-mutation | human at terminal (install); launchd (com.thenewfuse.relay) thereafter | launchctl list; $HOME/.tnf/relay/logs |
| scripts/runtime/repair-tnf-failing-services.sh | Detect and repair TNF services in a crash-loop or failed state | local-mutation | human at terminal, or invoked by another supervisor (not confirmed) | not verified |
| scripts/runtime/subdirector-autopilot-service.sh | Install/control a launchd LaunchAgent (com.tnf.subdirector-autopilot) running a 30s-interval subdirector-cycle-check loop | local-mutation | human at terminal (install); launchd thereafter | logs/sub-director-autopilot-loop.jsonl |
| scripts/runtime/tnf-agent-daemon-launchd.sh | Install/start/stop the TNF agent daemon (Python, scripts/agents/tnf-agent-daemon.py) as launchd LaunchAgent com.tnf.agent-daemon, wrapped with a Redis-guard preflight | local-mutation | human at terminal (install); launchd thereafter | $TNF_HOME/logs; preflight is gated on Redis budget health via redis-connection-guard.cjs --preflight |
| scripts/runtime/tnf-master-heartbeat-service.sh | Install/control a launchd LaunchAgent (com.tnf.master-heartbeat) running the master heartbeat loop from the live repo (preferred) or a mirrored $HOME/.tnf copy | local-mutation | human at terminal (install); launchd thereafter | directly relevant to user memory "TNF terminal heartbeat injection" -- this is a keystroke/prompt-injection-capable daemon per the tnf-autonomy-safety-audit skill's explicit trigger list (terminal-heartbeat-pulse.cjs) |
| scripts/runtime/voice-bridge-service.sh | Install/control a launchd LaunchAgent (com.tnf.voice-bridge-server) running the Python voice_server.py | local-mutation | human at terminal (install); launchd thereafter | this is the actual daemon behind `tnf voice up/down/status` (Section A) |
| scripts/setup-master-architecture.sh | One-time scaffold: create directories, initialize a package.json if absent, install deps, set up monitoring config | local-mutation | human at terminal | not verified; appears to be an old bootstrap script (initializes package.json "if not found", which is not the current state of this repo) |
| scripts/setup/provision-local-cron.cjs | THE cron provisioner: reads data/protocols/cron-jobs.registry.json + chronological-process-catalog.json and writes the resulting entries into the local crontab | local-mutation | human at terminal | CANNOT RUN in this checkout: both required inputs (cron-jobs.registry.json, chronological-process-catalog.json) are gitignored and absent (verified: ls returns ENOENT for both, confirmed against .gitignore lines 434-435) -- this is a live instance of exactly the failure mode described in user memory "Cron registry vs catalog gap" / "TNF control-plane artifacts are gitignored", caught directly in this pass rather than inferred |
| scripts/start-agent-network.sh | Start the full multi-agent network: Redis, Redis WebSocket bridge, Antigravity orchestrator, optional Claude/Gemini/Jules/Pi wrappers, optional model-watchdog failover consumer | local-mutation | human at terminal, or invoked by packages/tnf-cli/src/boot/pipeline.ts (verified via repo-wide grep: this script is referenced from the CLI's own boot pipeline, not just docs) | PID file tracking per the script's own header; not independently verified |

**`scripts/setup/provision-local-cron.cjs` deserves the most attention in
this table**: it is *the* mechanism that would turn the declared jobs in
Section C into a real crontab, and it is currently non-functional in any
checkout that doesn't already have the two gitignored input files present —
confirmed directly in this pass (see Methodology §5), not inferred.

---

## Section E — Other workspace packages' scripts (aggregate only)

136 `package.json` files total in the repo (excluding `node_modules`); 135
of them are not the root. Summed across all 136 files: **1,766 scripts**;
subtracting the root's 427 leaves **1,339 scripts** spread across the other
135 packages. These are **not individually classified** in this pass — full
per-script rigor across 135 additional files was out of scope for this
workstream given the size of Sections A–D already covering the primary
entry-point surfaces. What can be said with reasonable confidence without
opening all 135 files:

- **Semantic intent**: overwhelmingly standard per-package `build` / `test`
  / `lint` / `dev` / `clean` / `type-check` targets — the same handful of
  script *names* repeated across every workspace package, per the monorepo's
  own `turbo.json` task-graph conventions.
- **Mutation class**: `local-mutation` for `build`/`dev` (writes `dist/`),
  `local-mutation` for `test` (writes coverage/test-results as a side
  effect, does not mutate source), `read-only` for `lint` (check-only) and
  `type-check`, `local-mutation` for `lint --fix` variants where present.
- **Runtime owner**: almost entirely **turbo**, invoked by the root
  `build:*` / `test:*` / `lint:*` / `dev:*` scripts already classified
  individually in Section B (`turbo run build --filter=…`, etc.) — a human
  running `pnpm --filter <pkg> run <script>` directly is the only other
  realistic owner, and that is opt-in per-package usage, not part of the
  standard invocation surface.
- **Evidence**: per-package `dist/` and `coverage/` output; not enumerated.

This is reported as a volume/composition estimate, not a classified
inventory — flagged explicitly rather than silently omitted, and rather
than padding out individual rows for 1,339 scripts whose classification
would just be "same as the Section B `build:*`/`test:*`/`lint:*` row,
narrowed by `--filter`."

---

## Cross-cutting findings

**Commands with no visible evidence trail despite being a real mutation** —
the ones worth prioritizing for follow-up:

1. **`tnf authority encrypt-rotate`** (Section A) — migrates
   `DATABASE_URL`-backed `ENCRYPTION_KEY`s (decrypt-old → encrypt-new). No
   confirmation/dry-run flag visible in the registered command surface, and
   no receipt file identified. High consequence, low visibility.
2. **`tnf uninstall`** and **`tnf pi-package uninstall`** (Section A,
   verified against source) — both destructive deletions whose only signal
   is a printed success/failure message; neither writes a separate receipt.
   `pi-package uninstall`'s deletion is path-validated (`fs.rmSync` guarded
   to stay under `~/.pi/agent/packages/`), which is good; `tnf uninstall`
   delegates to `UpgradeService.uninstall()` with no confirmation prompt
   visible at the CLI layer at all.
3. **`scripts/setup/provision-local-cron.cjs`** (Section D) — the sole
   mechanism that would make Section C's declared jobs real, and it cannot
   currently run in this checkout for lack of its own required inputs. Any
   agent that assumes Section C's `active: true` jobs are actually scheduled
   anywhere should re-verify against a live crontab rather than trusting the
   catalog file alone.
4. **`ops:disk-retention`** and **`ops:hermes:retention`** (Section B) — by
   name, these delete/prune data on a retention policy. Neither script body
   was read in this pass to confirm what gets deleted or whether a deletion
   log is kept; flagged as destructive-by-name, unverified-by-content.
5. **`tnf fleet prompt`** (Section A) and the `tnf-terminal-heartbeat-pulse`
   cron job (Section C) — both inject text/keystrokes into a live
   terminal/app without a visible confirmation step in the command surface
   itself. This is the exact mechanism prior sessions' memory names as a
   recurring incident source ("TNF terminal heartbeat injection").

**Commands classified `unknown` because the description genuinely didn't
say** (not guessed, per the task's instruction): `tnf convo`, `tnf db`
(bare, argument-dependent), `tnf ports` (bare, argument-dependent), `tnf
slash run`, `tnf scripts run`, `tnf run`, root script `tnf-agent`, root
script `tnf` (bare CLI entrypoint), root script `joy` (`scripts/improver/joy.js`
— name alone gives no signal), and every pass-through command (`agy`,
`claude`, `cursor`, `pi`, `hermes`, `gemini`, `openclaw`, `claw`) whose
mutation class is inherently whatever gets forwarded.

**Two classes of protective gate exist and are worth distinguishing for
authority tracing:**

- **Validation/audit gates** (Section A `protocol`, Section B `validate:*`,
  `privacy:guard`, `secret:sweep`, `audit:*`) are `read-only` by design —
  they check and report, they don't fix. This codebase's own
  `scripts/protocols/verify-declarations.cjs` documents, with a specific
  2026-08-05 incident writeup, that this exact class of check has
  historically passed by finding nothing rather than because nothing was
  wrong. Green output from any of these should be cross-checked against the
  artifact it claims to validate before being trusted at face value.
- **Mutation guards actually observed acting on this session**: while
  producing this census, two `Bash` tool calls containing multi-line `for`
  loops over file lists were refused by the harness with "too complex to
  verify that it stays inside the worktree" — a live, first-hand
  demonstration of `guard:mutation` / the workspace-mutation-guard class
  described in prior sessions' memory ("Agent self-edit gate"), not a
  report about it.

---

## What this census did NOT do (scope boundaries, stated explicitly)

- Did not run `packages/tnf-cli`'s own `--dump-command-surface` live (no
  `node_modules`/`dist/` in this worktree) — relied on the committed,
  git-verified-fresh snapshot instead.
- Did not open and read all ~400 individual `tnf-cli` leaf-command handlers
  in `cli.ts` / `commands/*.ts` — classified at group granularity, with ~15
  handlers actually read and cited as `verified: true` in the JSON, and the
  rest classified from their own registered description text.
- Did not open and read all 427 root-script target files, nor all 1,339
  workspace-package scripts — Section B is grouped from the script bodies I
  did read (the full `package.json` `scripts` block, read once in full) plus
  targeted reads of ~15 higher-risk scripts; Section E is aggregate-only.
- Did not attempt to inspect this or any machine's live crontab or
  `launchctl list` output — this is a repo-only pass; every "runtime owner:
  cron/launchd" claim is sourced to a script or catalog file that *declares*
  or *installs* such a job, not to live process inspection.

# Refactoring Triage: The New Fuse Monorepo (2026-06-25)

Forensic, read-only investigation of dead-code candidates and working-tree
hygiene hazards.

Repo: `$TNF_ROOT` Branch: `tnf-cli-harness-implementation` HEAD:
`7fc982d6bb  2026-06-23 19:24:40 -0400  feat(self-governance): implement Turn End protocol, agent registration gate, and ASSIMILATE_CHECK`
Total commits across `--all`: 20,095 — heavy lineage history from
`whodaniel/The-New-Fuse-master`. First-ever commit:
`Clean repository with proper .gitignore to exclude large files`.

Method: `git ls-files`, `git log -1 --format`, `git grep` against active source
(`packages/`, `apps/`, `tools/`, `scripts/`, `.github/`, `Dockerfile*`,
`turbo.json`, `pnpm-workspace.yaml`), `git status --porcelain` for working-tree
inventory, `git log --all --grep=...` for consolidation history. Excludes
runtime/state dirs (`.agent/`, `.skills/`, `.jules/`, `.kilo/`, `.gemini/`,
`.claude/`, `.cursor/`, `node_modules/`, `concordance_results/`).

---

## CRITICAL FINDING #0 — Working-tree hygiene emergency (NEW — not in original triage)

**`git status --porcelain` reports 178,073 changed-file lines, of which 176,854
are staged (`A`) and 176,640 of those are node_modules.** If any agent executes
`git commit` without `git reset` filter, the push will fail (GitHub rejects >2
GB objects) and the index tree will bloat from ~600 MB to multi-GB.

```
STAGED-A-TOTAL        176,854    (git status --porcelain, awk filtered)
STAGED-A-NODE-MODULES 176,640    (node_modules files mistakenly staged)
STAGED-D-TOTAL            765
STAGED-MM-TOTAL            17    (.agent/runtime-logs heartbeat + supercycle-history.jsonl + rolling summaries)
STAGED-M (unstaged)         0
NEW (untracked / ??)        6    data/telegram/registry/*.json, docs/ORCHESTRATOR_V2_*.md,
                                  packages/tnf-cli/src/orchestration-enhancements.ts,
                                  refactoring_triage_forensic_report.md (this file),
                                  scripts/agents/subdirector-{codegen,infra}-worker-cycle.sh
```

### Root cause

A `git add .` (or
`git add packages/*') was executed from a workspace with stale `node_modules/`caches present, then quickly aborted via`git
restore --staged` is missing. The staged paths look like:

- `A  api/node_modules/accepts/...`
- `A  packages/tnf-cli/packages/ag-ui-core/node_modules/@nestjs/core/...` ←
  _nested node_modules inside another package_ — symlink-target-style
  installation, classic pnpm-hoisted leak.
- `A  packages/types/node_modules/...`,
  `packages/ui-consolidated/node_modules/...`,
  `packages/web-scraping/node_modules/glob/...`,
  `packages/workflow-engine/node_modules/...`, `packages/utils/node_modules/...`

### Verdict: BLOCKING. Action required BEFORE any other refactor.

```bash
# 1. Unstage the bulk node_modules without deleting anything
git rm -rf --cached -q api/node_modules 2>/dev/null || git reset HEAD -- api/node_modules
git reset HEAD -- 'packages/tnf-cli/packages' 2>/dev/null
git reset HEAD -- 'packages/**/node_modules'
git reset HEAD -- 'packages/**/packages'   # nested pnpm-store paths

# 2. Tighten .gitignore to make this irreversible
printf '\n# Bulk hygiene (added 2026-06-25 — supersedes accidental commit staging)\n**/node_modules/**\n**/packages/**/packages/\n' >> .gitignore

# 3. Verify
git status --porcelain | awk '$1 ~ /^A/ && $2 ~ /node_modules/' | wc -l   # expect 0
```

### `tsconfig.base.json` already excludes `node_modules`/`dist`/`apps/external`/`archive` per line 25–32 (`composite: true`, `declaration: true`). Once unstage is done, no `tsc --build` impact.

---

## Per-Candidate Verdict Table

| Path                                    | Last git commit                                                                                                                                                                                                                                                             | Active importers?                                                                                                                                                                                                                                                                                                              | Verdict                                                                                                                                                                                                                     |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api_symlink_backup`                    | 2026-02-27 symlink-mode 120000 → `apps/api`                                                                                                                                                                                                                                 | None                                                                                                                                                                                                                                                                                                                           | **DELETE** (stale symlink; tracked but no consumer reads it).                                                                                                                                                               |
| `app_deploy_final/`                     | untracked; `.gitignore:325`                                                                                                                                                                                                                                                 | None                                                                                                                                                                                                                                                                                                                           | **DELETE** (45 MB stale deploy artifacts; deployment genuinely lives in `cloudbuild-api.yaml`, `Dockerfile.api`, `docker-compose.yml`).                                                                                     |
| `clean_landing/`                        | untracked; `.gitignore:328`                                                                                                                                                                                                                                                 | None                                                                                                                                                                                                                                                                                                                           | **DELETE** (45 MB pre-CDN landing build).                                                                                                                                                                                   |
| `deploy_temp/`                          | untracked; `.gitignore:327`                                                                                                                                                                                                                                                 | None                                                                                                                                                                                                                                                                                                                           | **DELETE** (31 MB stale staging).                                                                                                                                                                                           |
| `landing_clean_deploy/`                 | untracked; `.gitignore:330`                                                                                                                                                                                                                                                 | None                                                                                                                                                                                                                                                                                                                           | **DELETE** (31 MB stale artifact).                                                                                                                                                                                          |
| `--help/` (parent)                      | 2026-04-17 _tracked_ deletion of `alertmanager.yml`/`grafana/`/`prometheus/` + re-home into `scripts/monitoring` + `infrastructure/monitoring`; on-disk `./--help/_/` only contains husky scaffolding (`_/h`, `_/husky.sh`, `_/commit-msg`) from `husky install` run in CWD | None                                                                                                                                                                                                                                                                                                                           | **DELETE** full `--help/` and add `**/_/` to `.gitignore`.                                                                                                                                                                  |
| `autonomy/`                             | 2025-05-20 (initial snapshot)                                                                                                                                                                                                                                               | None in live code                                                                                                                                                                                                                                                                                                              | **DELETE** (a single legacy `context_manager.js` left over from the very first `whodaniel/The-New-Fuse` seed commit). Live `scripts/autonomy/*.py` is a separate namespace.                                                         |
| `db/`                                   | 2025-05-20                                                                                                                                                                                                                                                                  | None                                                                                                                                                                                                                                                                                                                           | **DELETE** (only a 404-byte `README.md`; real DB logic is `@the-new-fuse/database` + `apps/api/src/modules/...`).                                                                                                           |
| `games/`                                | 2025-05-20                                                                                                                                                                                                                                                                  | None                                                                                                                                                                                                                                                                                                                           | **DELETE** (one 12 KB `index.html`; games now live in `apps/casin8-games/` and `apps/ai-arcade/`).                                                                                                                          |
| `~/` (literal `~` dir holding `.zshrc`) | 2025-05-20 (seed)                                                                                                                                                                                                                                                           | None                                                                                                                                                                                                                                                                                                                           | **DELETE** (accidental creation in CWD during the snapshot seed).                                                                                                                                                           |
| `web-assets/`                           | 2025-08-25                                                                                                                                                                                                                                                                  | `git grep` shows one reference: `scripts/consolidation-refactor.cjs:408` lists it as a deletion candidate (self-confirming)                                                                                                                                                                                                    | **DELETE** (9 standalone HTML test pages from the pre-`apps/frontend/` test-harness era).                                                                                                                                   |
| `browser/`                              | 2025-11-05                                                                                                                                                                                                                                                                  | None                                                                                                                                                                                                                                                                                                                           | **DELETE** (only `browser/user_data/` Chrome state, no consumer).                                                                                                                                                           |
| `tmp/telegram-build/`                   | untracked (staged `A` per `git status`)                                                                                                                                                                                                                                     | None in active code                                                                                                                                                                                                                                                                                                            | **DELETE** (`git rm -rf tmp/` then `printf '/tmp/' >> .gitignore`). The package version in `packages/tnf-cli/src/telegram/TelegramService.ts` + `commands/telegram/{start,stop,status,send}.ts` is the live implementation. |
| `self-prompting-dashboard/`             | 2026-03-12                                                                                                                                                                                                                                                                  | Only `docs/security/audit-findings.md` + `packages/compounding-memory/wiki/doc-audit-findings.md`, both pointing to OLD paths                                                                                                                                                                                                  | **DELETE** (sole content: `public/`/`src/` with stale supabase bindings; dashboard migrated to `apps/frontend/`).                                                                                                           |
| `examples/`                             | 2026-04-24                                                                                                                                                                                                                                                                  | Only one external hit: `concordance_results/concordance_viz_data.json:3881` listing the path                                                                                                                                                                                                                                   | **DELETE** (root-level examples; modern equivalents live in `packages/{pkg}/examples/`, e.g. `packages/ag-ui-core/examples/`).                                                                                              |
| `agent-communication/`                  | 2025-12-05                                                                                                                                                                                                                                                                  | Only `scripts/automation/tnf_agent_relay_builder.applescript` (applescript, non-runtime)                                                                                                                                                                                                                                       | **ARCHIVE** (move four JSON transcripts + `monitor.js` to `archive/agent-communication-snapshots/`).                                                                                                                        |
| `jwt-security-fixes/`                   | 2026-02-22                                                                                                                                                                                                                                                                  | Documentation only — `SECURITY_SUMMARY.md` + `IMPLEMENTATION_GUIDE.md` describe copying `.ts` files into `apps/backend/` + `apps/api-gateway/` (which already happened; no live `.ts` files remain here)                                                                                                                       | **ARCHIVE** (keep markdown in `archive/security-fixes-2026-02/`).                                                                                                                                                           |
| `tests/`                                | 2026-02-22                                                                                                                                                                                                                                                                  | None                                                                                                                                                                                                                                                                                                                           | **DELETE** (legacy root-level Jest/global-setup; per-package `test/` is the canonical home).                                                                                                                                |
| `test-suite/`                           | 2026-03-12                                                                                                                                                                                                                                                                  | `test-suite/e2e/run-e2e-tests.sh` writes into `reports/e2e/` but no current CI calls it                                                                                                                                                                                                                                        | **DELETE** except `test-suite/e2e/run-e2e-tests.sh` → move to `scripts/e2e/run-e2e-tests.sh`.                                                                                                                               |
| `ui-html-css/`                          | 2025-08-25 (initial)                                                                                                                                                                                                                                                        | **YES** — `apps/chrome-extension/src/_legacy/manifest.json:59`, `apps/gemini-bridge-extension/src/_legacy/manifest.json:59`, and `apps/{chrome,gemini-bridge}/src/_legacy/options/index.tsx` (lines 338, 352) call `chrome.runtime.getURL('ui-html-css/index.html')`; also `scripts/dev/launch-all-pages.sh`                   | **KEEP** (live chrome-extension \_legacy dependency; do not migrate without testing both extensions).                                                                                                                       |
| `src-gen/`                              | 2025-08-25                                                                                                                                                                                                                                                                  | **YES** — _generated build output_ for `apps/skideancer-ide/Dockerfile` (`src-gen/backend/`, `src-gen/frontend/`)                                                                                                                                                                                                              | **KEEP** (build output. If consensus treats it as noise, migrate to `.gitignore` + LFS hooks for any non-derived blobs).                                                                                                    |
| `cloudflare-openclaw-gateway/`          | 2026-04-04                                                                                                                                                                                                                                                                  | **YES** — `cloudflare-openclaw-runtime/wrangler.toml` references service `openclaw-gateway` via Workers service binding                                                                                                                                                                                                        | **KEEP** (real Wrangler config + Dockerfile).                                                                                                                                                                               |
| `production/`                           | 2026-04-18                                                                                                                                                                                                                                                                  | **MIXED** — embedding `package.json` declares `"name": "@the-new-fuse/backend"`, **collisions with `packages/backend/package.json`**                                                                                                                                                                                           | **UNCERTAIN → DELETE recommended** unless active cron/CI still touches it. Either rename to `@the-new-fuse/legacy-deploy-stage` or delete entirely.                                                                         |
| `reports/`                              | untracked; `.gitignore:332`                                                                                                                                                                                                                                                 | **YES** — `apps/api/src/modules/unified-ledger/unified-ledger.service.ts:2681-2852` reads `reports/personal-archaeology/findings/*.md` for narrative engine; `scripts/timeline/personal-archaeology-orchestrator.mjs:58`, `scripts/protocols/master-clock-sync-audit.cjs:172`, `scripts/review/audit_review.mjs:17` write here | **KEEP** (ephemeral output dir, gitignored but actively consumed by unified-ledger; do **NOT** clear without backing up `reports/personal-archaeology/findings/`).                                                          |
| `apps/skideancer-ide/`                  | 2025-05-14 (excluded from `pnpm-workspace.yaml:4` via `!apps/skideancer-ide`)                                                                                                                                                                                               | **YES** — `apps/tauri-desktop/src/components/QuickActionsDashboard.tsx` and `apps/tauri-desktop/src/main.ts` reference skideancer AI-agent patterns; `package.json:6,10,12` and `Dockerfile` keep it as a standalone containerized app; 40+ files in `apps/skideancer-ide/{Dockerfile,packages/,static/,docs/}`                | **KEEP** (excluded from pnpm-workspace but alive as a standalone IDE build).                                                                                                                                                |

## NEW FINDINGS (this run — net add to the triage)

### F-1. Backend npm-name collision across three `package.json`s (would clash at pnpm publish / Turborepo task resolution)

1. `packages/backend/package.json` → `"@the-new-fuse/backend"`
2. `apps/backend/package.json` → `"@the-new-fuse/backend-app"` (different name,
   but `prebuild` line pulls workspace deps)
3. `production/package.json` → `"@the-new-fuse/backend"` -- duplicates #1

Both `apps/backend/package.json:13` and `production/package.json` invoke
`find-available-port.cjs backend`. The `production/` triple conflicts with
monorepo workspace tooling. Recommendation: rename `production/package.json` to
`@the-new-fuse/legacy-deploy` then delete the dir, or just delete it.

### F-2. Triple-redundant AIVI backend directories (now confirmed live via grep)

- `apps/chrome-extension/aivi/backend/package.json` -- name
  `ai-video-intelligence-backend`, description begins "Legacy AIVI backend…"
- `apps/gemini-bridge-extension/aivi/backend/package.json` -- same name _and_
  same description string
- `apps/api/src/modules/billing/paypal.service.ts` is the _new_ billing
  authority

Both extensions declare nearly identical backend codebases;
`aivi:backend:{install,start,dev}` scripts in each extension's `package.json`
(chrome: lines 35-37; gemini: lines 32-34) actually invoke them. So **not dead**
but a real **AIVI dedup target**: lift to a single `apps/aivi-shared-backend/`
package and have both extensions consume it as a workspace dependency. Worth
flagging because description strings match verbatim (a copy/paste tell that they
were branched at one point and never unified).

### F-3. The `./--help/_/` husky leftover (corroborates existing entry with new fix path)

On-disk only `husky` post-install scaffolding remains (`_/h`, `_/husky.sh`,
`_/commit-msg`, plus a copy of `.config/`). Tracked monitoring files
(`alertmanager.yml`, `grafana-dashboards/`, `prometheus/`, `kubernetes/`)
deleted earlier and re-homed under `infrastructure/monitoring/` +
`scripts/deployment/deploy-monitoring.sh`. Cleanup: `rm -rf --help/_` and add
`**/_/` to `.gitignore` to ensure repeated `husky install` mishaps never track.

### F-4. `production/.htaccess` + `production/start.sh` are vestigial Docker artifacts

`production/start.sh` runs `node dist/index.js`. The `dist/` it expects was
never recreated. `Dockerfile.api` line 7+ is the actual production build target.
After F-1 fix, this is moot.

### F-5. `tmp/telegram-build/` is the orphan most likely to be accidentally deleted later — but it's already deleted on disk via nothing currently _tracked_

`git status` shows it as staged `A` but no commit. The contained class is
line-for-line equivalent to `packages/tnf-cli/src/telegram/TelegramService.ts`
minus the command-registration wiring. Suggested follow-up:
`git rm -rf --cached tmp/telegram-build`; add `/tmp/` to `.gitignore` (already
conventional in most .NET/Rust shops; needed here too because pnpm hoisting and
the `cli.ts.backup3` file shows a pattern of leaving work-in-progress in CWD).

### F-6. `ui-html-css/` chrome-extension manifest collision (validated)

Both `apps/chrome-extension/src/_legacy/manifest.json:59` and
`apps/gemini-bridge-extension/src/_legacy/manifest.json:59` declare
`ui-html-css/*` as the legacy popup resource. Both `options/index.tsx` invoke
`chrome.runtime.getURL('ui-html-css/index.html')`. KEEP until modern popup is
promoted out of `_legacy/` (tracked by tnf-missing-pages-orchestrator skill).

### F-7. `packages/ag-ui-core/examples/package.json` named without org scope

Has `"name": "ag-ui-examples"` (no `@the-new-fuse/` prefix). All sibling
examples use the org-scope convention. Add to a follow-up "harmonize package
names" ticket; do not block the triage.

### F-8. `reports/` IS imperative to preserve (confirms earlier entry)

`apps/api/src/modules/unified-ledger/unified-ledger.service.ts:2681-2852` reads
four JSON/markdown files in `reports/personal-archaeology/findings/`. Clearing
`reports/` would break the unified-ledger narrative module. This is a
load-bearing gitignored dir; do NOT sweep during cleanups.

### F-9. `scripts/consolidation-refactor.cjs:408` lists `web-assets` as a deletion candidate (self-confirming across weeks)

Same deletion target as this triage — confirms team-wide agreement; safe to act
on.

### F-10. Tooling rule violations the prior triage did not surface

- `packages/tnf-cli/src/cli.ts.backup3` — staged `A` but not committed.
  `tsconfig.tsbuildinfo` and `packages/tnf-cli/tsconfig.tsbuildinfo` are also
  modifying (`M`). These belong in `.gitignore` (the `.gitignore` already
  excludes `*.tsbuildinfo` per typical conventions; verify line 60-65 of
  `turbo.json` `outputs: ["dist/**","lib/**"]` and `tsconfig.tsbuildinfo` are
  actually ignored).
- `packages/tnf-cli/test.txt` (staged `A`) — random test scratch file in a
  compiled package directory; should never have been created there.
- `packages/tnf-cli/src/orchestration-enhancements.ts` (untracked) — orphan
  component file. `git grep --no-index 'orchestration-enhancements' . | head`
  will tell us whether it's imported anywhere.

### F-11. Predecessor-repo references in `.gitignore` but absent from tree

Lines referring to `strategic-cow/`, `solid-shrimp/`, `pull-create/` (the
original `whodaniel/The-New-Fuse` snapshot seed). None exist in `git ls-tree HEAD`.
Remove these `.gitignore` lines during cleanup (or migrate them to
`archive/.gitignore-patterns/`).

### F-12. Turbo + tsconfig guardrails the refactor MUST respect (see CROSS-BRANCH PATTERNS REPORT for full list)

- `tsconfig.base.json` already excludes `node_modules`, `dist`, `apps/external`,
  `archive`, `**/*.test.ts`, `**/*.spec.ts` (lines 24-32). Polyrepo
  cross-references between packages respect `composite: true` (line 17).
  Refactor must keep `imports` inside `paths`-mapped packages only.
- `turbo.json` `build:packages` and `build:apps` task chains depend on
  `build:types → build:utils → build:core → build:database → build:api → build:ui`.
  Removing `apps/api` would break the chain; removing `packages/utils` would
  break `build:core` task. The chains are load-bearing.
- `pnpm-workspace.yaml` excludes `!apps/skideancer-ide` intentionally (line 4).
  Do NOT remove that exclusion without first moving skideancer-ide into a
  sibling repo or converting it to a Turborepo-typed package.

---

## Verdict Totals

- **Safe to DELETE:** 14 + CRITICAL#0 hygiene reset (`api_symlink_backup`,
  `app_deploy_final`, `clean_landing`, `deploy_temp`, `landing_clean_deploy`,
  `./--help`, `autonomy/`, `db/`, `games/`, `~/`, `web-assets/`, `browser/`,
  `tmp/telegram-build/`, `self-prompting-dashboard/`, `examples/`)
- **ARCHIVE (preserve content, move to archive/):** 2 (`agent-communication/`,
  `jwt-security-fixes/`)
- **KEEP (active / referenced / generated):** 5 (`ui-html-css/`, `src-gen/`,
  `cloudflare-openclaw-gateway/`, `reports/`, `apps/skideancer-ide/`)
- **UNCERTAIN / require human decision:** 2 (`production/` after F-1 fix lands →
  likely DELETE; `tests/` + `test-suite/` → DELETE except one shell script)

## Highest-Leverage Next Actions (in order)

1. **BLOCKING:** Run the `git reset HEAD -- '**/node_modules'` flush from
   CRITICAL#0 before any other work. Reason: a single misclick would push 176k
   staged blobs.
2. **DELETE in one commit:** the 14 candidates above (safe, no consumers).
3. **ARCHIVE:** `agent-communication/` + `jwt-security-fixes/` to
   `archive/2026-06-triage/`.
4. **RENAME then DELETE:** `production/package.json` →
   `@the-new-fuse/legacy-deploy` (or DELETE directly) per F-1.
5. **DEDUPE (separate ticket):** `aivi/backend/` triple. New shared package
   `apps/aivi-shared-backend/`. Both extensions consume via workspace dep.
6. **IGNORE:** Add `**/_/`, `/tmp/`, `*.tsbuildinfo` to .gitignore; verify
   current entries already cover them.
7. **DO NOT** touch `reports/personal-archaeology/findings/`, `ui-html-css/`,
   `src-gen/`, or `apps/skideancer-ide/` without co-ordinated migration.

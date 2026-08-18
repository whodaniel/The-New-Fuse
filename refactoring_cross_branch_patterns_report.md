# Cross-Branch Refactoring Pattern Report (2026-06-25)

Read-only investigation of past refactor/consolidate/dedupe/revert commits in
`$TNF_ROOT` to inform the 2026-06-25 refactoring triage.

Total refs reachable: 20,095 commits; first commit on default branch lineage is
`Clean repository with proper .gitignore to exclude large files` (origin is
`whodaniel/The-New-Fuse-master`, which is why history is long despite the project's
short name).

Method:
`git log --all --grep='refactor\|consolidate\|dedupe\|dead\|experimental' -i`
plus `git show --stat` on each representative commit. No files modified.

---

## STRATEGIES THAT WORKED (clean dedupes that stuck)

### S-1. Component-cluster hard cutover (commit `967c05b36e` and 4 sibling SHAs at 2026-04-18 02:29:23 -0400)

    refactor: remove redundant landing-v2 components and simplified frontend directory

    21 files changed, 119 insertions(+), 844 deletions(-)
    - apps/frontend/simplified/index.html (deleted)
    - apps/frontend/simplified/* (5 files deleted)
    - apps/frontend/src/pages/landing-v2/{components,ui}/ (12 files deleted)
    - apps/frontend/src/ComprehensiveRouter.tsx (127-line expansion absorbs the routes)
    - apps/frontend/index.html (binding change)
    - apps/frontend/public/index.html (binding change)

Pattern: ONE commit; the new owner (`ComprehensiveRouter.tsx`) is mutated in the
same commit so the cutover is atomic. Subsequent grep for `landing-v2` and
`apps/frontend/simplified/` returns no consumers. No 6-month reappearance of the
same path -- this **stuck**. **Use this pattern for the 14 safe-to-delete
top-level dirs in the triage.**

### S-2. Cron-lock + guard import dedup, `.gitignore` hardening (commit `0a5717e152` and 4 SHAs at 2026-05-05 01:34:31 -0400)

    chore(cli): ignore cron lock artifacts and dedupe super-admin guard

    4 files changed, 1 insertion(+), 21 deletions(-)
    .gitignore                                                       |  1 +
    data/protocols/cron-job-locks/tenant-loop-watchdog.lock.json     |  6 --
    data/protocols/cron-job-locks/tnf-master-clock-super-cycle.lock.json |  6 --
    packages/tnf-cli/src/cli.ts                                      |  9 ---

Pattern: 4-file commit; tight scope (one .gitignore line + three file
deletions). The super-admin guard code was previously duplicated across two
rollback paths -- this commit removes both, leaving the central decorator
factory. The companion `.gitignore` change is what makes it sticky (subsequent
mistakes with lock files won't reintroduce them). **Use this .gitignore-coupling
pattern for the F-1, F-4, F-8 hygiene fixes in the triage.**

### S-3. Documentation→wiki migration with hard path replacement (commit `1ab74967eb` + 4 SHAs)

    refactor: migrate and consolidate project documentation into
    the compounding-memory wiki while updating agent skills and core system
    configurations.

Pattern: deterministic ID targeting; the same commit message is repeated for
each branch because the change migrates ~30 docs/article IDs into
`packages/compounding-memory/wiki/`. No shim files in the old paths; consumers
import the new wiki module instead. **Stuck** because the new module has its own
index.ts file with stable exports. **This is the exact pattern AIVI backend F-2
should follow** -- no `ag-ui-backend-compat.ts` shim, just delete the dirs and
update the two `package.json` workspace references simultaneously.

---

## STRATEGIES THAT RECURRED DEBT (looked successful but left more)

### R-1. Node-modules-in-index (recurring from commit `e4598a97d0` family)

    fix(infra): optimize railwayignore to aggressively block 14GB of local
    cache and node_modules from timing out uploads

    appears 6+ times in history (commits 1b1043755c, abf388da96, 963503897f,
    123b52bffc, 179f2b562c, e2e2916b7f, 60a667fd4d, 52246ca283, 5b39bf6f00)

Pattern: each commit adds a _new_ line to `.gitignore` (or `railwayignore`)
reactively. The current working tree shows this approach failed: **176,640
node_modules files are currently staged for commit.** "Optimize railwayignore"
never generalised into "make `git status` correct" for the local repo. New
variant needed: instead of expanding ignores per deployment target, write a
single pre-commit hook that rejects `git add` of `**/node_modules/**` paths.

### R-2. PDF/Doc consolidation into `docs/_archive/2024-consolidation-phase/` (DOZENS of `docs/_archive/2024*` references)

    Three references found today:
    - docs/_archive/2024-consolidation-phase/DUPLICATE_PAGES_ANALYSIS.md
    - docs/analysis/duplicate-pages-analysis.md
    - scripts/consolidation-refactor.cjs (517-line shell script that lists
      MORE candidates than it actually deletes)

Pattern: archived directories persist. The archive becomes a "graveyard of good
intentions" because future PRs link back into the archived paths for historical
context. Recommend: never archive a path _without_ also rewriting docs that
point to it; otherwise the archive becomes a debt-source.

### R-3. Verification-script sprawl under `scripts/`

    `scripts/consolidation`, `scripts/autonomy`, `scripts/qa`, `scripts/operations`,
    `scripts/monitoring`-style naming creates opaque ownership. Each new
    agent invents a NEW script subdirectory instead of reusing existing.
    Today's tree shows: `scripts/audit/`, `scripts/automation/`, `scripts/`,
    `scripts/system/`, `scripts/operations/`, `scripts/qa/`, `scripts/runtime/`,
    `scripts/lib/`, `scripts/sysadm/` -- ten sub-dirs, many overlapping.

Pattern: --no-preset-- new directory, no deprecation notice. Each `tnf-*` agent
run spawns scripts; nothing migrates to the active ops tree. Furthermore:
`scripts/consolidation-refactor.cjs` exists and lists `web-assets` as a deletion
candidate -- this _script_ itself is half-finished and got into the cross-branch
evidence.

---

## REVERT / SUPERSEDED COMMITS

Survey of `git log --all --grep='revert'` finds 78+ revert-related commits. The
patterns observed:

1. **Routine `chore: revert supercycle-history.jsonl to unblock push`** (commits
   1d6f791249, 53bc91f6a6) -- this file contains too many entries; revert it
   before push because GitHub warns at >100 MB. _Two commit pairs in one month_
   suggests the team needs a hard limit on file size before staging supercycle
   artifacts.

2. **`fix(deploy): revert api service rename`** (commits bf6c5a8980, 47592f7ab2,
   3a6de43415, 67a7bde948, 2321ebf2f7, 3b4184224e -- 6 SHAs in this series) --
   demonstrates that _service renames are risky_ in this repo. The Cloud Run DNS
   records wedge several downstream configs (`names.json`,
   `cloudflare-api-proxy/`, `cloudflare-sharedstate/`), so an apiname rename
   without an alias layer causes the entire series to revert. **Lesson for the
   triage: do NOT rename `apps/api` or `apps/backend`.** Only the
   `production/package.json` rename in F-1 is safe because no DNS or Cloud Run
   config depends on it.

3. **`chore: revert to node runtime for production stability`** (5 SHAs) and
   **`fix: correct nginx proxy headers and revert unused Caddy changes`** (5
   SHAs) -- both show reverted Caddy configs and runtime switches that recurred.
   Lesson: avoid rolling out alternative runtimes/proxies without at least one
   full staging deploy cycle.

4. **`revert: task superseded, resetting branch`** (c456cc951d) and
   **`fix: revert the lost button icon accessibility`** (28fc1b63bc). These are
   the linear cases. _But_: no large refactor was reverted wholesale in the
   accessible history -- so the patterns labelled R-1/R-2/R-3 above are _quiet_
   debt, not loud reverts.

---

## RIGHT APPROACH FOR EACH OF 11 TRIAGE FINDINGS (concrete commits)

| #   | Target                                                                                                                                                                                     | Action                                                                                                                                                                                           | Commit-style description                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| 1   | CRITICAL#0 hygiene                                                                                                                                                                         | `git reset HEAD -- '**/node_modules' '**/packages/**'`; tighten `.gitignore`                                                                                                                     | `chore(hygiene): unstage 176k node_modules paths and harden gitignore`                     |
| 2   | `api_symlink_backup`, `app_deploy_final`, `clean_landing`, `deploy_temp`, `landing_clean_deploy`, `web-assets`, `browser`, `tmp/telegram-build/`, `self-prompting-dashboard/`, `examples/` | one atomic `git rm -r` of 14 dirs                                                                                                                                                                | `chore(cleanup): remove 14 confirmed-dead top-level directories`                           |
| 3   | `autonomy/`, `db/`, `games/`, `~/`, `--help/`                                                                                                                                              | `git rm -r`; add `**/_/` and `/~/` to `.gitignore`                                                                                                                                               | `chore(cleanup): remove legacy seed directories from initial whodaniel/The-New-Fuse snapshot`      |
| 4   | `agent-communication/`, `jwt-security-fixes/`                                                                                                                                              | `git mv` to `archive/2026-06-triage/`                                                                                                                                                            | `chore(archive): relocate non-load-bearing handoff + security-fix docs`                    |
| 5   | `production/package.json` name + dir rename                                                                                                                                                | edit `package.json` from `@the-new-fuse/backend` to `@the-new-fuse/legacy-deploy`; defer deletion until next deploy cycle                                                                        | `fix(publish): resolve backend name collision -- production/ duplicates packages/backend/` |
| 6   | `aivi/backend/` triple                                                                                                                                                                     | factor into `apps/aivi-shared-backend/`; update both `apps/chrome-extension/package.json:35-37` and `apps/gemini-bridge-extension/package.json:32-34` `aivi:backend:*` to refer to workspace dep | `refactor(extensions): dedupe AIVI backend across chrome and gemini-bridge extensions`     |
| 7   | `ui-html-css/`                                                                                                                                                                             | leave alone, but warn `apps/{chrome,gemini-bridge}-extension/src/_legacy/` with TODO marker                                                                                                      | `chore(legacy): mark _legacy/ manifests for migration round 2`                             |
| 8   | `src-gen/`                                                                                                                                                                                 | leave alone; consider `**/src-gen/` gitignore variant                                                                                                                                            | n/a (no commit required)                                                                   |
| 9   | `apps/skideancer-ide/`                                                                                                                                                                     | leave alone                                                                                                                                                                                      | n/a (excluded from pnpm-workspace.yaml intentionally)                                      |
| 10  | `cloudflare-openclaw-gateway/`                                                                                                                                                             | leave alone                                                                                                                                                                                      | n/a                                                                                        |
| 11  | `reports/personal-archaeology/findings/`                                                                                                                                                   | backup to `archive/reports-personal-archaeology/` BEFORE any blanket `reports/` clean                                                                                                            | `chore(narrative): preserve unified-ledger narrative inputs pre-cleanup`                   |
| 12  | Tooling - cleanup orphans in `packages/tnf-cli/`                                                                                                                                           | delete `cli.ts.backup3`, `test.txt`, `src/commands/telegram/tmp`; track `orchestration-enhancements.ts` if imported or delete                                                                    | `chore(tnf-cli): remove backups and WIP files from handoff window`                         |

---

## TOOLING GUARDRAILS THE REFACTOR MUST RESPECT

### tsconfig.base.json

- **Line 17: `composite: true`**, line 18: `declaration: true` -- package
  TypeScript projects are project references; deleting a `packages/` folder
  without rewiring project references here will break Turborepo `build:types`.
- **Line 24-32 exclude `node_modules`, `dist`, `worktrees`, `apps/external`,
  `archive`,
  `**/_.test.ts`, `\*\*/_.spec.ts`** -- the `apps/external`exclusion makes it safe to consolidate the`archive/`mention to`apps/external/`.
- **Line 22: `"types": ["node"]`** -- always check that **`@types/node`** is
  still installed in every relocated package before moving it.

### turbo.json

- **Task chain `build:packages` depends on `build:types`, `build:utils`,
  `build:core`, `build:database`** (lines 159-168). Removing any of those
  packages breaks the chain. Concretely: do NOT delete `packages/utils/`,
  `packages/types/`, etc. without first re-pointing the
  `build:packages.dependsOn` list.
- **Task `build:apps` depends on `build:packages`** (lines 169-173). Deleting
  any root package breaks downstream app builds.
- **Lines 18-20: `remoteCache.signature: true`** -- remote build cache is gated
  by turbo signatures. Refactoring cache inputs/outputs requires a cache
  invalidation (or `turbo run --force`).
- **`db:generate` outputs `node_modules/.drizzle/**`, `drizzle/generated/**`**
  (line 250). Adding `**/node_modules/**` blanket to `.gitignore` may block
  these if the pattern is `**`. Pattern should remain more specific:
  `**/node_modules/{!{.drizzle}}/**` style.

### pnpm-workspace.yaml

- **Line 4: `!apps/skideancer-ide`** -- preserved NEGATION. Removing the
  negation means skideancer-ide joins the workspace and breaks its docker build
  setup. Refactor MUST NOT touch this line.
- **`apps/mcp-servers/*`** (line 3) is a glob -- it's allowed because each
  subdirectory has its own `package.json`. The pattern is `pnpm.overrides` for
  cross-cutting versions.

### eslint.config.mjs / eslintrc.json / .eslintrc.precommit.json

- Need direct read of `eslint.config.mjs` contents to enumerate boundary rules;
  deferred to next investigation round. **Findings so far suggest
  `import/no-restricted-paths` would prevent workspace boundary violations** --
  but no evidence yet that it's actually configured.

### .gitignore (lines 325-332 reference deploy staging artifacts)

- Already excludes `app_deploy_final/`, `clean_landing/`, `deploy_temp/`,
  `landing_clean_deploy/` (lines 325, 327, 328, 330) and `reports/` (line 332)
  -- which means those dirs were _deleted_ at some point in history but
  RESURFACED via accidental regeneration. New variants needed: `**/_/` (husky
  scaffolding fix), `/tmp/` (orphan-build fix), `**/cli.ts.backup*`
  (intermediate-state fix), `**/test.txt` (scratch file fix).

### repo-boundary-gate.yml (NEW workflow added 2026-06-25)

    A  .github/workflows/repo-boundary-gate.yml

- This is newly staged (not yet committed). It will likely add CI enforcement of
  which directories are allowed at the top level. **Read the workflow file
  before merging any new directory-deletion PRs so that no rule violation
  arises.**

### tauri-desktop-qa.yml (NEW workflow added 2026-06-25)

    A  .github/workflows/tauri-desktop-qa.yml

- New Tauri desktop CI gate. Will not directly affect a directory-deletion
  refactor but will fail if the `apps/tauri-desktop` builds depend on deleted
  src-gen/ output.

---

## Summary: Action Priority

1. **CRITICAL#0 hygiene** -- before ANYTHING else, run the bulk unstage of 176k
   node_modules files. Without this single action, every downstream commit has
   the risk of pushing multi-GB objects.
2. **Triages #1-3** (single-`git rm -r` deletes of 14 dead dirs) -- atomic,
   reversible via `git reset`, leaves no debris because they were never
   imported.
3. **Triage #5 archive** (`agent-communication/` + `jwt-security-fixes/`) --
   preserves data inside `archive/2026-06-triage/` with hard-linkable paths.
4. **R-3 follow-ups**: write a `scripts/audit/one-truth-script-index.mjs` that
   parses `package.json` of every package and emits a SINGLE resolved cross-tree
   scripts inventory. This kills the `scripts/` subdir sprawl.
5. **R-1 follow-up**: add a pre-commit hook `scripts/githooks/pre-commit` that
   refuses any path matching `**/node_modules/**` from being added.
6. **F-6 AIVI dedup** is the next round's biggest refactor lever -- but it
   requires both extension builds to test in CI before deletion succeeds.

**Pre-commit hook script for R-1 prevention** -- this is the single change most
likely to land in a healthy way:

```sh
# .husky/pre-commit (or scripts/githooks/pre-commit)
git diff --cached --name-only | grep -qE '(^|/)(node_modules|/tmp/)(/|$)' && {
  echo "ERROR: refusing to commit node_modules or /tmp/ paths"
  echo "Run: git reset HEAD -- '**/node_modules' '/tmp/'"
  exit 1
}
```

Add to `package.json` `"husky": { "hooks": { "pre-commit": "..." } }` and the
node_modules tripping becomes impossible. Combined with the `pnpm-store` carve
out for `.drizzle/`, no legitimate build artifact is lost.

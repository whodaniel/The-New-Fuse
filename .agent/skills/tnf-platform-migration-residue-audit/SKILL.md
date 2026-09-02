---
name: tnf-platform-migration-residue-audit
description:
  Find residue left behind when TNF migrates off a platform (Railway, Heroku,
  Vercel, a CLI, a hosting provider). Detects the renamed-not-removed case,
  where a blind string-replace hid the residue behind a plausible new name. Use
  before claiming a platform is "gone", and when a doc or agent report
  references infrastructure you cannot find.
---

# Platform Migration Residue Audit

## Why this exists

On 2026-09-02 TNF was believed to be off Railway. A literal `railway` grep found
~126 files. The real residue was **~447 files / ~3,725 hits**, because commit
`62b2a3e2f` had string-replaced `railway` → `cloud_runtime` across the tree.

That rename did three harmful things at once:

1. It made the residue invisible to the obvious search.
2. It invented a plausible artifact — `cloud_runtime` reads like real
   infrastructure, but no such CLI has ever existed. 500 lines of documentation
   instructed agents and humans to run it.
3. It renamed the platform's **environment variables** (`RAILWAY_*` →
   `CLOUD_RUNTIME_*`), leaving code that branches on vars nothing will ever set.
   Those branches are permanently dead but look live.

It also produced a false incident: `.agent/agents/super-director.md` and
`docs/architecture/TNF_AUTHORITATIVE_CHAIN_OF_COMMAND.md` still advertised the
dead Railway host `tramway.proxy.rlwy.net` as the live Cloud Redis backbone. An
agent running a chain-of-command audit read that as current and reported a dead
host as live infrastructure, sending a later session hunting a heartbeat on a
store that was never there.

**A rename is not a removal, and it is worse than doing nothing.**

## Run it

Substitute `<platform>` (e.g. `railway`) and `<alias>` — the renamed spelling,
if one exists. Find the alias by reading retirement comments in `scripts/lib/`,
or by grepping for the platform name and seeing what sits beside it.

```bash
P=railway ; A=cloud_runtime

# 1. Both spellings. The alias is usually the larger number.
git grep -lIi "$P" -- . | wc -l
git grep -lI "$A\|$(echo $A | tr a-z A-Z)" -- . | wc -l

# 2. Dead env branches: the platform's own vars, renamed. Nothing sets these.
git grep -hoI "$(echo $A | tr a-z A-Z)_[A-Z_]*" -- . | sort | uniq -c | sort -rn

# 3. Docs instructing a binary that does not exist.
git grep -nI -E "(^|[^a-zA-Z_])$A (run|up|login|link|variables|status|logs|deploy|init)" -- .

# 4. Orphaned platform config files (railway.json/toml under the new name).
git ls-files | grep -i "$A"

# 5. Package scripts and directories carrying the alias.
node -e 'const s=require("./package.json").scripts;for(const k in s)if(/'"$A"'/.test(k+s[k]))console.log(k,"->",s[k])'
```

## Classify before changing anything

Do **not** mass-replace. That is the mistake being cleaned up. Sort every hit:

| Class                | Test                                                              | Action                                                                                    |
| -------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Live code, misnamed  | runs, uses current tooling (`gcloud`/`wrangler`)                  | rename file/script, update every reference                                                |
| Dead platform config | `NIXPACKS` builder, `<platform>.app` schema URL, nothing reads it | delete                                                                                    |
| Dead code            | imported only by its own test; registered nowhere                 | delete                                                                                    |
| Dead env branch      | keys on `<ALIAS>_*` that nothing sets                             | remove the branch — and check the collapse does not leave both sides of an `if` identical |
| **Retired wrapper**  | header says retired, refuses and points elsewhere                 | **KEEP THE OLD NAME** — catching stale invocations is its entire purpose                  |
| Historical record    | dated report, evidence, audit                                     | add a staleness banner; never rewrite evidence                                            |
| Generated artifact   | snapshots, `public-safe-variants`, build output                   | leave; fix the generator                                                                  |
| Vendor pack          | third-party skill docs mentioning the platform generically        | not our residue                                                                           |

## Highest-priority targets

Fix these first regardless of count, because agents read them as instruction:

1. `.agent/agents/*.md`, `.claude/agents/*.md`, `**/SKILL.md` — an agent will
   act on a stale host or a dead command.
2. `docs/architecture/*AUTHORITATIVE*`, `docs/protocols/*` — these become other
   agents' audit findings.
3. Anything an agent report already cited. If a report named infrastructure you
   cannot find, grep the alias before believing the report _or_ dismissing it.

## Traps

- **Filenames vs env vars.** `CLOUD_RUNTIME_DEPLOYMENT_GUIDE` is a document
  name, not a variable. Conflating them produces false positives.
- **Renaming a live directory breaks references.** After a rename, re-grep for
  the old path _and_ old package-script names; a rename creates fresh dangling
  references, which is drift you just authored.
- **Check what still consumes an alias before deleting it.** Some renamed vars
  are genuinely honoured by live code (`LIVE_REDIS_URL`, `REDIS_PRIVATE_URL`
  survived because `packages/relay-core/*` reads them).
- **`notation-reconciliation-audit.cjs` will not confirm this work.** Its scan
  globs cover `.agent/skills`, `docs/protocols/*.md`, `AGENTS.md`, `CLAUDE.md`
  only — not `docs/deployment/`, `scripts/` or `apps/`, where migration residue
  concentrates. Pass explicit globs or its flat total means nothing.

## Done means

Every hit classified, live references resolve, no doc hands out a command that
cannot run, and historical records are marked rather than edited. Not "zero
matches" — archives and history legitimately keep the old name.

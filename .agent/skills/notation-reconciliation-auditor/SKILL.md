# Notation Reconciliation Auditor

## Purpose

Find gaps between what TNF's own documentation/skill notation _claims_ about the
codebase and what's actually there — before an agent inherits a false belief
from a stale doc and acts on it.

This exists because of a real incident (2026-09-02): an agent read
`.agent/skills/browser-automation/SKILL.md`, which only described the Fuse
Connect Chrome extension, and concluded that was TNF's only browser- automation
surface. It also read a "legacy" comment scoped to one CLI command's old
navigation backend and generalized it to "Fuse Connect is deprecated." Both
readings were wrong, and both were caught only because a human happened to know
better and pushed back. Nothing in the harness would have caught it otherwise —
the doc looked authoritative and had no reason, from the inside, to look wrong.

**Do not confuse this with `STATE_FRESHNESS_MANDATE.md`.** That mandate governs
_live external facts_ decaying between observation and use (a repo's head
commit, a service's health). This skill governs _static notation drift_: a doc
asserted something about the codebase's shape — a path, a command, a "this is
legacy/current" claim — and the codebase moved without the doc moving with it.
Different failure mode, different tool
(`scripts/protocols/notation-reconciliation-audit.cjs` here vs
`scripts/protocols/state-freshness-gate.cjs` there), same root cause class: an
unverified claim treated as fact.

## When to run this

- Before trusting a skill/protocol doc's specific path or command claims for a
  task where being wrong is expensive (production deploys, DNS/infra changes,
  anything you can't easily undo).
- After a rename, migration, or "X supersedes Y" change — to catch every doc
  that still points at the old shape, not just the one you happened to be
  reading.
- Periodically, as a standing sweep — `--json` output is meant to be diffed
  run-to-run so new drift is visible, not just the accumulated backlog.
- Whenever a doc's own language claims something is "legacy" / "deprecated" /
  "archived" / "superseded" — that claim is exactly the shape of thing that was
  wrong in the incident above, and deserves a semantic check even when the
  path/command checks pass clean.

## How to run it

```bash
# Default corpus: .agent/skills/**/*.md (excluding known vendor skill packs —
# see the script header), docs/protocols/*.md (top-level only, not reports/),
# AGENTS.md, CLAUDE.md, .agent/*.md
node scripts/protocols/notation-reconciliation-audit.cjs

# Machine-readable, for diffing or feeding into further tooling
node scripts/protocols/notation-reconciliation-audit.cjs --json

# One file only — e.g. before you finish editing a doc you just touched
node scripts/protocols/notation-reconciliation-audit.cjs --only .agent/skills/browser-automation/SKILL.md

# A different/wider corpus than the default (vendor packs, a specific app's
# docs, etc.) — pass glob(s) explicitly; * and ** both work
node scripts/protocols/notation-reconciliation-audit.cjs --scan 'apps/chrome-extension/**/*.md'

# Fail (exit 1) if any dangling path/command was found — for wiring into a
# gate later. Staleness-language hits never fail the run; see below.
node scripts/protocols/notation-reconciliation-audit.cjs --strict
```

## Reading the three sections of output

1. **Dangling paths** — a backtick-quoted repo-relative path referenced in the
   doc doesn't exist. High-confidence: either the doc describes something that
   was renamed/removed/never landed, or it's genuinely wrong. Go look at both
   sides (the doc's claim, and `git log --follow` on the nearest existing
   ancestor path) before fixing — sometimes the _doc_ named the wrong path from
   day one and the fix is correcting the doc, not reviving a path.

2. **Dangling commands** — a `pnpm run <script>` or `` `tnf <subcommand>` ``
   reference that doesn't resolve. `pnpm run` checks are exact (against
   `package.json`'s `scripts`, with `*`-suffixed prefix references like
   `tnf:live:agents:*` checked as a prefix match). `tnf <subcommand>` checks are
   a **grep heuristic** against `packages/tnf-cli/src` — a miss is a prompt to
   check by hand (`tnf --help`, or grep the source yourself), not proof the
   subcommand was removed; dynamic/generated registration can evade the
   heuristic. A hit you get from this script that turns out to be a genuinely
   missing command (as `tnf host` / `tnf artifacts` / `tnf environment` were
   when this skill was written) is exactly the finding worth acting on: either
   implement the command or fix the doc that promised it.

3. **Staleness language** — every line containing legacy/deprecated/
   archived/"no longer"/superseded/outdated/obsolete/sunset, surfaced **without
   judgment**. The script cannot tell "this really is dead" from "this doc is
   wrong about it being dead" — that was precisely the original bug, and it's a
   semantic question a script can't answer. Treat each hit as a prompt: go
   verify the claim against the actual code (grep for who still
   imports/calls/references the "legacy" thing) before either trusting the doc
   or silently agreeing with your own first impression of it, the same way the
   Fuse Connect / `agent-browser` distinction had to be checked by hand in the
   incident this skill is named for.

## What this does not do

- Judge whether a documented _behavior_ still matches actual behavior — that
  needs running the code or a human/agent semantic read, not a static scan.
- Verify anything about live/external state (services, deployments, DNS, process
  health) — that's `state-freshness-gate.cjs`'s job.
- Replace reading the code. This narrows where to look; it doesn't replace
  looking.
- **Look where most drift actually lives.** `DEFAULT_SCAN_GLOBS` is exactly
  `.agent/skills/**/*.md`, `docs/protocols/*.md`, `AGENTS.md`, `CLAUDE.md`
  (minus vendor packs). It does **not** scan `docs/deployment/`,
  `docs/development/`, `scripts/`, `apps/`, `packages/` or `.github/`.

  On 2026-09-02 ~50 files of Railway/`cloud_runtime` drift were remediated
  almost entirely outside that corpus and the totals barely moved — dangling
  paths 601 → 601, commands 14 → 17, staleness 249 → 258, the rises coming from
  newly added "retired/deprecated" banner wording, not new defects. **A flat
  total after real remediation is not evidence the work failed; it usually means
  the tool did not look there.** Point it at what you changed:

  ```bash
  node scripts/protocols/notation-reconciliation-audit.cjs 'docs/deployment/*.md'
  ```

- **Catch renamed platforms, not just missing ones.** This scan cannot see a
  dead dependency that was string-replaced into a plausible new name — the
  `railway` → `cloud_runtime` rename hid ~447 files behind a token that reads
  like real infrastructure. Pair it with
  `.agent/skills/tnf-platform-migration-residue-audit/SKILL.md` whenever a
  platform is believed retired.

## After a run

Findings are a worklist, not a report to file away. For each real dangling
path/command: fix the doc if the code is right, or flag the code as the actual
defect if the doc had it right and something moved unintentionally. For each
staleness-language hit that turns out to be wrong (the doc undersells something
as dead that's actually current — the Fuse Connect case): rewrite the doc to
state the real scope of what's legacy, the way
`.agent/skills/browser-automation/SKILL.md` was rewritten alongside this skill's
introduction.

## Version

- **Skill ID**: `tnf-notation-reconciliation-auditor-v1`
- **Created**: September 2, 2026

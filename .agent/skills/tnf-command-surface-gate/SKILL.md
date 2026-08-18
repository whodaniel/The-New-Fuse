---
name: tnf-command-surface-gate
description: >-
  Keep the tnf CLI command-surface snapshot oracle green. Use when adding,
  renaming, or removing a command/option in packages/tnf-cli/src/cli.ts or
  src/commands/**; when the command-surface gate blocks a commit or CI run; or
  when a "surface drift" failure reports ADDED/CHANGED/REMOVED commands. Covers
  the gate script, the --update flow, and the staged pre-commit wiring.
primary_type: protocol
category: engineering/cli
risk_tier: low
harmful_pattern_detection: false
---

# TNF Command-Surface Gate

The tnf CLI registers ~450 command paths in a 19k-line cli.ts. The
command-surface snapshot (`packages/tnf-cli/src/command-surface.snapshot.json`)
is the regression oracle that catches any command, alias, option, or description
drift. This skill is the workflow for keeping it green.

## When to use

- You added/renamed/removed a command or option in cli.ts or src/commands/\*\*.
- The gate blocked:
  `[command-surface-gate] BLOCKED: command surface differs from snapshot`.
- A concurrent agent's cli.ts churn makes the surface test oscillate.

## The gate

`scripts/protocols/command-surface-gate.cjs` runs the oracle:

- `--mode=staged` (pre-commit): only runs when a surface file is staged (cli.ts,
  src/commands/\*\*, or the snapshot). Unrelated commits pass instantly.
- `--mode=ci` (test.yml `tnf-command-surface` job): always runs the full oracle.
- Escape hatch (logged loudly): `TNF_SKIP_COMMAND_SURFACE_GATE=1`.

The test itself is a standalone script, not a vitest suite — run it with tsx:

```bash
cd packages/tnf-cli && TNF_SKIP_TURN_ZERO_ONBOARD=1 npx tsx src/command-surface.test.ts
```

## Intended drift (command intentionally changed)

```bash
cd packages/tnf-cli && npx tsx src/command-surface.test.ts --update
git diff src/command-surface.snapshot.json   # REVIEW: only your intended changes
```

Then re-run the oracle: `npx tsx src/command-surface.test.ts` →
`PASS ... unchanged`.

## Unintended drift (someone else's churn)

If ADDED/CHANGED lists commands you did not touch (catalog, mcp, tui, ...), a
concurrent agent is mid-refactor on the same cli.ts. Do NOT update the snapshot
to absorb their work. Stop, report the race, and let the owning change land its
own snapshot diff. Per lessons-learned "Concurrent-Agent Git Race", a moving
tree is a hard stop — never fight it with blanket `--update`.

## CI + pre-commit wiring (already in place — verify, don't re-add)

- `.husky/pre-commit` runs
  `node scripts/protocols/command-surface-gate.cjs --mode=staged` last.
- `.github/workflows/test.yml` has a `tnf-command-surface` job in the
  test-summary needs.

## Acceptance

- `node scripts/protocols/command-surface-gate.cjs --mode=ci` → OK
- `sh -n .husky/pre-commit` → no syntax error
- A staged surface change with a matching snapshot diff passes; without it,
  blocks.

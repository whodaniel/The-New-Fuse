# Continuous Improvement Skill

## Description

The capability to autonomously diagnose system health, identify potential
improvements, and automatically apply fixes or generate tasks for other agents.
This skill forms the core of the TNF "flywheel".

## Key Scripts

- `scripts/improver/scan.cjs`: The primary diagnostic loop (runs TNF Doctor, a
  lint baseline, and a TODO/FIXME debt scan, then dispatches TNF Task Envelopes
  for what it finds).
- `scripts/improver/joy.js`: Provides motivational messages and fun insights.
- `scripts/swarm/continuous-testing-loop.cjs`: The loop that invokes the
  improver (gated by its `enableImprover` config).

Note: there is no fix-env.js under scripts/improver/ and no `tnf run` subcommand
— earlier revisions of this skill cited both; they never existed in the repo.

## Workflow

1.  **Diagnostic**: Run `tnf doctor --json`.
2.  **Lint Check**: Run `npm run lint --silent`.
3.  **TODO Scan**: Grep for `TODO:` in codebase.
4.  **Task Creation**: Convert findings into `TNF Task Envelopes`.

## Usage

```bash
# Run one diagnostic cycle (primary entry point)
npm run improver:scan

# Run the continuous testing loop that drives the improver
npm run test:continuous
```

## Related

- Deterministic full self-improvement pipeline (build, audits, scorecard,
  parity): `tnf self-improvement run` — see `packages/tnf-cli/src/cli.ts`.
- Session-level reflection over handoff diffs and lessons: `tnf reflect` (skill:
  `~/.agents/skills/tnf-self-improvement-loop/`).

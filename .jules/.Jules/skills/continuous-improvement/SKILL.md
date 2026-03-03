# Continuous Improvement Skill

## Description

The capability to autonomously diagnose system health, identify potential
improvements, and automatically apply fixes or generate tasks for other agents.
This skill forms the core of the TNF "flywheel".

## Key Scripts

- `scripts/improver/scan.js`: The primary diagnostic loop.
- `scripts/improver/fix-env.js`: Specific fixer for environment issues.
- `scripts/improver/joy.js`: Provides motivational messages and fun insights.

## Workflow

1.  **Diagnostic**: Run `tnf doctor --json`.
2.  **Lint Check**: Run `npm run lint --silent`.
3.  **TODO Scan**: Grep for `TODO:` in codebase.
4.  **Task Creation**: Convert findings into `TNF Task Envelopes`.

## Usage

```bash
# Run a full improvement cycle
tnf run improver:scan
```

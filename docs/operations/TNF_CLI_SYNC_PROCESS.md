# TNF CLI Agent Sync Process

Created: 2026-07-31 Updated: 2026-08-03 Purpose: Keep TNF CLI agent synchronized
with Hermes Agent capabilities

## Overview

The `sync-tnf-cli-with-agents.mjs` script compares TNF CLI **top-level**
commands with Hermes Agent top-level commands and reports real gaps.

Measurement rules (corrected 2026-08-03):

- TNF surface = `program.command('…')` in `packages/tnf-cli/src/cli.ts` **plus**
  `registerXxxCommand(program, …)` modules (kebab-cased).
- Nested subgroup verbs (`.command` under a parent) are **not** counted as
  top-level.
- Coverage = Hermes∩TNF / |Hermes| (overlap), **not** |TNF| / |Hermes|.

## Usage

```bash
node scripts/agents/sync-tnf-cli-with-agents.mjs
node scripts/agents/sync-tnf-cli-with-agents.mjs --auto-fix
```

## Output

- `~/.tnf/cli-sync/latest-report.json`
- Console summary showing coverage percentage

## Related

- `tnf parity audit|status|gaps` — multi-agent parity ledger (ParityService)
- `docs/operations/TNF_CLI_SYNC_2026_07_31_REPORT.md` — initial three-pass
  report

## Scheduled Run

- Every 6 hours via cron (when installed)
- Log: `~/.tnf/cli-sync/cron.log`

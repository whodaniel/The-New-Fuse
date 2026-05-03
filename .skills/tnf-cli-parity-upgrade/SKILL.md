---
name: tnf-cli-parity-upgrade
description: Plan and execute protocol-neutral CLI parity upgrades for TNF against external CLIs (for example OpenCode or OpenClaw) while preserving TNF-native behavior. Use when requests mention parity gaps, missing commands/options, compatibility targets like "same and more," or cross-protocol CLI assimilation.
---

# TNF CLI Parity Upgrade

## Overview

Close CLI capability gaps without turning TNF into a thin alias layer. Preserve TNF-native control-plane behavior and add compatibility where it increases operator leverage.

## Workflow

1. Establish a directive contract before coding.
Use `references/prompt-contract-template.md` and lock scope, constraints, non-goals, and acceptance tests.
2. Audit the actual command surface.
Run `scripts/cli_parity_audit.py` to compare root commands/options and critical subcommands.
3. Prioritize parity deltas.
Ship high-impact operator surfaces first (`run`, auth/providers, attach/web/plugin wrappers, root options).
4. Implement protocol-neutral adapters.
Prefer pass-through compatibility layers and explicit routing over replacing TNF-native entrypoints.
5. Validate with objective checks.
Use `references/acceptance-checklist.md` and report pass/fail per item with command evidence.
6. Summarize what changed.
List files, behavioral deltas, and remaining parity backlog.

## Implementation Rules

- Keep TNF protocol-neutral.
- Preserve TNF-native default UX unless explicitly changed by directive contract.
- Avoid destructive rewrites; layer compatibility incrementally.
- Prefer explicit aliases and wrapper commands over implicit behavior changes.
- Treat parity as measurable: every claim must map to a checked command/option.

## Quick Commands

- Root parity scan:
  `python3 scripts/cli_parity_audit.py --target tnf --reference opencode --json`
- Add subcommand checks:
  `python3 scripts/cli_parity_audit.py --target tnf --reference opencode --subcommand run --subcommand auth --json`
- Human-readable report:
  `python3 scripts/cli_parity_audit.py --target tnf --reference opencode`

## References

- `references/prompt-contract-template.md`
- `references/acceptance-checklist.md`

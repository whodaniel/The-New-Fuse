---
name: tnf-cli-agent-interoperability
description: Design and execute TNF CLI interoperability upgrades for any external AI agent CLI while keeping TNF as the protocol-neutral control plane. Use when requests involve agent CLI parity, command assimilation, wrapper routing, compatibility layers, or onboarding a new agent protocol into TNF.
---

# TNF CLI Agent Interoperability

## Overview

Integrate any agent CLI into TNF with explicit contracts, measurable compatibility checks, and TNF-native guardrails.

## Workflow

1. Define the interoperability contract.
Use `references/interoperability-contract-template.md` to lock goal, in-scope surfaces, exclusions, risk constraints, and acceptance checks.
2. Baseline both command surfaces.
Run `scripts/agent_cli_surface_audit.py` for root and critical subcommands.
3. Classify deltas by impact.
Prioritize operator-critical flows first: auth/providers, run/execute, attach/session, plugin/tooling, and serve/web.
4. Implement TNF adapters.
Prefer additive wrappers, aliases, and routing hooks instead of replacing TNF-native defaults.
5. Validate and regress.
Use `references/interop-acceptance-checklist.md` and attach command evidence.
6. Publish rollout summary.
Report what shipped, what is intentionally deferred, and what remains blocked.

## Implementation Rules

- Keep TNF protocol-neutral.
- Do not couple TNF identity to any one external agent protocol.
- Preserve TNF-native no-arg/startup behavior unless contract explicitly changes it.
- Keep compatibility explicit and inspectable.
- Every parity claim must be backed by a command-level check.

## Quick Commands

- Root surface audit:
  `python3 scripts/agent_cli_surface_audit.py --target tnf --reference <agent-cli> --json`
- Include subcommands:
  `python3 scripts/agent_cli_surface_audit.py --target tnf --reference <agent-cli> --subcommand run --subcommand auth --json`
- Save machine-readable report:
  `python3 scripts/agent_cli_surface_audit.py --target tnf --reference <agent-cli> --out interop-report.json --json`

## References

- `references/interoperability-contract-template.md`
- `references/interop-acceptance-checklist.md`
- `references/routing-patterns.md`

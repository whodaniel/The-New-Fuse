# Executable Intelligence Artifact

**Artifact ID:** eia-848a2e0c6a8cdc83 **Spec:** tnf/executable-intelligence/0.2
**Generated:** 2026-05-17T14:17:10+00:00 **Class/Status:** [INTEL] [PENDING]

## Ownership & Release

- Owner Principal: danielgoldberg
- Visibility: private
- Release State: sealed
- Agent Allowlist: (none)
- Release Approved By: (not released)
- Released At: (not released)
- Release Note: (none)

## Source Attribution

- Source ID: apple-notes-new-may-2026-6238
- Type: note
- URI: apple-notes://on-my-mac/NEW-%20May-2026/6238
- Title: • TNF CLI audit/reconciliation is implemented, with a canonical self…
- Author:
- Publisher:
- Published At:
- Retrieved At: 2026-05-17T14:17:10+00:00

## Taxonomy of Actionability

### Procedural

- Title: • TNF CLI audit/reconciliation is implemented, with a canonical self…
- TNF CLI audit/reconciliation is implemented, with a canonical self-improvement
- Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli/src/cli.ts:912,
- Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli/src/cli.ts:2740,
- Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli/src/cli.ts:3451
- Full self-improvement namespace added to CLI:
- Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli/src/cli.ts:3678
- Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli/src/cli.ts:5276,
- Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli/src/cli.ts:5368
- Skill protocol now calls the canonical CLI loop (not ad-hoc step scripts):
- Documentation and command map updated:
- Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli/README.md:108,
- Desktop/A1-Inter-LLM-Com/The-New-Fuse/docs/reference/command-map.md:16
- Desktop/A1-Inter-LLM-Com/The-New-Fuse/docs/protocols/reports/tnf-cli-
- protocols/reports/tnf-cli-command-paths-2026-05-13.json, Desktop/A1-Inter-
- LLM-Com/The-New-Fuse/docs/protocols/reports/tnf-cli-parity-vs-openclaw-
- - pnpm --filter @the-new-fuse/tnf-cli type-check passed.
- - pnpm --filter @the-new-fuse/tnf-cli build passed.
- - Help surfaces validated via compiled CLI (dist/cli.js) including new self-
- vement run --base-url https://thenewfuse.com --api-url

### Strategic

- Provider-routed control-plane commands are now local-first (Railway
- Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli/src/cli.ts:912,
- Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli/src/cli.ts:2740,
- Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli/src/cli.ts:3451
- Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli/src/cli.ts:3678
- Workflow/orchestration drift fixed by restoring both paths:
- Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli/src/cli.ts:5276,
- Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli/src/cli.ts:5368
- Desktop/A1-Inter-LLM-Com/The-New-Fuse/.skills/tnf-stack-self-improvement-
- loop/scripts/run_loop.sh, Desktop/A1-Inter-LLM-Com/The-New-Fuse/.skills/
- Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli/README.md:108,
- Desktop/A1-Inter-LLM-Com/The-New-Fuse/docs/reference/command-map.md:16
- Desktop/A1-Inter-LLM-Com/The-New-Fuse/docs/protocols/reports/tnf-cli-
- reconciliation-2026-05-13.md, Desktop/A1-Inter-LLM-Com/The-New-Fuse/docs/
- LLM-Com/The-New-Fuse/docs/protocols/reports/tnf-cli-parity-vs-openclaw-

### Governance

- Title: • TNF CLI audit/reconciliation is implemented, with a canonical self…
- TNF CLI audit/reconciliation is implemented, with a canonical self-improvement
- Skill protocol now calls the canonical CLI loop (not ad-hoc step scripts):
- Audit artifacts generated:
- audit from Git history.

## Utility Metrics

- Freshness Decay: High
- Implementation Density: 0.488
- Verification Difficulty: Easy

## Synthesis

Artifact captures 20 procedural, 15 strategic, and 5 governance units. Use
procedural units for immediate execution, then vet strategic and governance
units through TNF gates before protocol adoption.

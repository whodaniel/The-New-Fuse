# AGENT_BANK_PATHWAY_RECONCILIATION_2026-05-14

## Scope

Restore and harden multitenant agent-definition pathways so all local agent runtimes can discover and use the intended definitions without collapsing provider-specific architecture.

## Findings

1. On **May 14, 2026**, `.agent/agents/*.md` had been removed from working state, while many services/scripts still depend on that path.
2. `.claude/agents/*.md` existed locally (`116` files) but only a tiny subset was tracked in git, creating drift risk.
3. Imported provider-neutral wrappers in `.skills/imported-claude-agents/*/SKILL.md` existed (`113`), but were not fully reconciled with current `.claude/agents`.
4. Runtime homes other than Codex lacked the imported Claude skill bank.

## Decisions

1. Preserve provider lanes:
   - `.claude/agents` remains provider-specific source lane.
   - `.agent/agents` remains TNF bank lane for shared TNF runtime expectations.
2. Use a deterministic reconciliation step (not one-off manual copies).
3. Keep distribution protocol-neutral by propagating imported skill wrappers to all supported local runtime homes.

## Implemented Controls

1. New reconciliation script:
   - `scripts/agents/reconcile-agent-banks.cjs`
2. New CLI command:
   - `tnf agents bank reconcile --targets all`
3. Reconciliation behavior:
   - Restores `.agent/agents` from latest git commit containing that tree when missing.
   - Creates missing `.skills/imported-claude-agents/<slug>/SKILL.md` wrappers from `.claude/agents`.
   - Provisions imported skill bank into runtime homes:
     - `~/.codex`, `~/.claude`, `~/.gemini`, `~/.opencode`, `~/.kilo`, `~/.augment`, `~/.tnf`, `~/.hermes`, `~/.hermes/hermes-agent`, and project mirror.
   - Emits pathway artifact:
     - `.agent/fleet/agent-pathway-matrix.json`
   - Emits tracked audit mirror:
     - `docs/protocols/reports/agent-pathway-matrix.latest.json`

## Pathway Model

- `corporate_staff`
- `agency_owner_ops`
- `user_customer_ops`
- `shared_core`
- `unclassified`

These are computed during reconciliation and recorded in the pathway matrix JSON for governance review and drift tracking.

## Operator Commands

```bash
tnf agents bank reconcile --targets all
tnf agents bank reconcile --dry-run --json --targets all
```

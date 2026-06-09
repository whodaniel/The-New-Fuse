# Multi-Agent Integration Protocol (TNF)

## Purpose

Define deterministic coordination rules when multiple agents are concurrently
editing the same TNF repository.

This protocol standardizes:

1. ownership visibility per run
2. local-vs-CI gate split
3. integration-train promotion flow
4. nested gitlink reachability checks
5. conflict escalation tiers

## 1) Change Ownership Ledger

- Runtime ledger file: `data/protocols/CHANGE_OWNERSHIP.jsonl` (gitignored).
- Emit one record per pre-push/CI run with:
  - actor identity
  - branch + head SHA
  - changed file set hash
  - ownership domain counts

Commands:

- Local: `pnpm run ownership:ledger:emit`
- CI: `pnpm run ownership:ledger:emit:ci`

## 2) Local Hooks vs CI Strict Gates

Local pre-push is optimized for speed and early signal:

- Blocking: privacy guard, secret sweep, docs PII guard
- Advisory: handoff freshness, strict RLS audit, conflict tiering, ownership
  ledger emission

CI remains the strict policy surface:

- Session handoff enforcement
- Supabase strict RLS audit
- Conflict tier gating (escalate -> fail in PR flow)
- Intelligence Emission (PRs with procedural/strategic changes MUST invoke `tnf:intel:ingest` CI equivalent, or explicitly declare `NO_INTEL_DELTA`)
- Orchestration Audit Gate (Schedule changes must include a `challenge_rationale`)

## 3) Integration Branch Release Train

Default merge flow into `main`:

1. feature branches merge into `integration/*`
2. integration branch must be green
3. `main` is promoted from integration lineage with linear history

Automation:

- Workflow: `.github/workflows/integration-train-gate.yml`
- Validator: `scripts/protocols/validate-release-train.cjs`

Policy:

- PRs targeting `main` must originate from `integration/*` (or explicitly
  allowed emergency prefix such as `hotfix/*`).
- Pushes to `main` must stay linear (no merge commits).

## 4) Gitlink Reachability Rule

A parent repo must not advance gitlink pointers unless each referenced nested
commit is reachable in the nested repo remote refs/tags.

Automation:

- Existing integrity gate: `scripts/check-gitlinks.sh`
- Reachability validator: `scripts/protocols/verify-gitlink-reachability.cjs`
- Workflow: `.github/workflows/gitlink-integrity.yml`

## 5) Conflict Policy Tiers

Every change set is classified before merge:

- `isolate`: single-surface, low contention
- `merge-with-attribution`: cross-surface/shared ownership
- `escalate`: protocol/workflow/supabase/gitlink-risk surfaces

Automation:

- Classifier: `scripts/protocols/classify-change-tier.cjs`
- Local advisory: `pnpm run conflict:tier`
- CI PR gate: `pnpm run conflict:tier:ci`

## Workflow Cross-Check Matrix

- Privacy/security strict gate: `.github/workflows/privacy-security-gate.yml`
- Gitlink integrity + reachability: `.github/workflows/gitlink-integrity.yml`
- Integration promotion policy: `.github/workflows/integration-train-gate.yml`
- Super Cycle Intelligence Extractor: `.github/workflows/intelligence-emission-gate.yml`
- Orchestration Governance: `.github/workflows/orchestration-audit-gate.yml`

## Operator Rule

When multiple agents are active, do not force-rewrite shared branches or revert
unknown changes. Resolve through attribution or escalation tier, then merge via
the integration train.

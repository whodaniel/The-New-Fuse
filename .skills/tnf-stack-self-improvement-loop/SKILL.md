---
name: tnf-stack-self-improvement-loop
description: Construct, verify, run, and continuously improve the TNF full-stack reliability loop with deterministic build checks, deep link and semantic route audits, auth pathway validation, logging artifacts, architecture diagram generation, specialist-agent audit coverage, and iterative skill refinement. Use when Codex must harden or operate TNF as an ongoing self-improving system.
---

# TNF Stack Self-Improvement Loop

Run this skill for end-to-end TNF reliability operations.

## Core Workflow
1. Build the target stack.
2. Run deterministic audits (links, semantic routes, auth paths).
3. Generate architecture artifacts (Mermaid, optional graph export).
4. Generate a consolidated scorecard.
5. Apply focused fixes based on evidence.
6. Re-run until clean.
7. Commit and publish evidence artifacts.
8. Update skill references when new failure patterns emerge.

## Execution Commands
Run from TNF repo root.

Canonical CLI path:

```bash
tnf self-improvement run \
  --base-url https://thenewfuse.com \
  --api-url https://api.thenewfuse.com \
  --super-admin-token "$TNF_SUPER_ADMIN_INPUT_TOKEN"
```

```bash
bash /Users/<owner>/.codex/skills/tnf-stack-self-improvement-loop/scripts/run_loop.sh \
  --repo /abs/path/to/The-New-Fuse \
  --base-url https://thenewfuse.com \
  --api-url https://api.thenewfuse.com
```

Generate master architecture diagram:

```bash
python3 /Users/<owner>/.codex/skills/tnf-stack-self-improvement-loop/scripts/generate_master_mermaid.py \
  --repo /abs/path/to/The-New-Fuse \
  --out /abs/path/to/The-New-Fuse/docs/architecture/tnf-master-framework.mmd
```

Track iterative run notes and refinement updates:

```bash
bash /Users/<owner>/.codex/skills/tnf-stack-self-improvement-loop/scripts/refinement_log.sh \
  --repo /abs/path/to/The-New-Fuse \
  --note "Describe what changed and why"
```

## Required Outputs
- `apps/frontend/docs/audits/live-link-crawl.json`
- `apps/frontend/docs/audits/all-routes-semantic-audit.json`
- `apps/frontend/docs/audits/auth-path-audit.json`
- `apps/frontend/docs/audits/self-improvement-scorecard.json`
- `docs/architecture/tnf-master-framework.mmd`
- `docs/operations/tnf-self-improvement-cycle.md`

## Guardrails
- Prefer additive compatibility fixes before disruptive rewrites.
- Require audit evidence before declaring “fixed”.
- Keep path-compatibility checks for `/api/*` and `/v1/*` until callers are fully migrated.
- Update audit expectations whenever endpoint contracts intentionally change.

## Specialist Agent Coverage
See [references/agent-audit-matrix.md](references/agent-audit-matrix.md).

## Refinement and Skill Evolution
See [references/refinement-protocol.md](references/refinement-protocol.md).

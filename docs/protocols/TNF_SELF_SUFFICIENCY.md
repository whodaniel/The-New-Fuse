# TNF Self-Sufficiency Protocol

Status: ACTIVE • Protocol ID: TNF_SELF_SUFFICIENCY_CANONICAL

## Mission
TNF must operate as a **self-sufficient, self-contained agentic protocol**:
1. No external agent or external platform may be *required* for TNF to function.
2. Any external AI, MCP, or cloud service may be **optionally orchestrated** by TNF, but each must:
   - Have a bundled local polyfill (in-process or via repo-tracked binary), **or**
   - Be skippable with the same observable affordance (so the boot still reaches OK state).

## Operating Loop
Inspect → Decide (local/orchestrate) → Verify → Recover.

### Local-first decision rule
For every requested capability, the resolver walks tiers in this order:
1. **Native polyfill** (in-tree TypeScript / Rust / Python module invoked by `tnf`).
2. **Bundled binary** (an executable checked into `./.tnf/bin` or `node_modules/.bin`).
3. **Configured local service** (Redis, Postgres, OLLama, sqlite) reachable via env.
4. **Optional remote** (declared in `tnf.jsonc` under `optional.orchestration`).

If tier 4 is unreachable, TNF logs absence and proceeds (it does not boot-fail).

## Non-Goals
- Re-implementing every external vector DB / LLM API inside TNF.
- Forcing offline-only operation as a default posture.
- Removing orchestration surface area; only banning *hard* coupling.

## Enforcement Targets
- `tnf` shell entrypoint must print `Self-sufficiency mode: ENABLED` on boot.
- `tnf doctor` must gate CI on absence of any `external.*` hard dependency.
- New feature PRs that introduce hard external deps require a `self-sufficiency.md` note in the diff.

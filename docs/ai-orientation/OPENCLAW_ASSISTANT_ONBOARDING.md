# OpenClaw Assistant Onboarding (TNF)

Generated: 2026-02-05

This document is **for TNF**: it records what “the OpenClaw assistant instance” learned while onboarding into the existing TNF codebase and protocol ecosystem.

> Framing: **TNF predates OpenClaw.** TNF is the primary protocol/workspace; OpenClaw is an external protocol being *assimilated* into TNF where useful.

---

## 1) Repo at a glance

- Monorepo with heavy emphasis on:
  - multi-agent runtime + orchestration
  - protocol adapters (A2A, MCP, “Clawd/OpenClaw”)
  - browser automation (extension, cloud sandbox, electron)
  - backend + gateway + frontend apps

Sizes (approx):
- `apps/` ~3.6G
- `packages/` ~2.1G
- `docs/` ~14M
- `src/` ~7.3M

Tooling present:
- `pnpm-lock.yaml`
- `turbo.json`

Primary entry docs I started with:
- `README.md`
- `docs/GETTING_STARTED.md`
- `docs/TNF_CODEBASE_ANALYSIS.md`

---

## 2) Where TNF already assimilates OpenClaw/Clawdbot

There is already substantial integration under **“Clawd” naming** (TNF convention), while explicitly tracking OpenClaw history/name changes.

Key artifacts found via code search:

### A) Integration plan + security posture
- `implementation_plans/openclaw_tnf_integration.md`
  - states TNF has already assimilated core Clawdbot/OpenClaw components:
    - `ClawdEngine`
    - `ClawdScheduler`
    - `ClawdSandbox`
    - `ClawdAssimilationService`
  - highlights security concerns (prompt injection, malicious skills) and mitigations via sandbox isolation

### B) Agent runtime integration
- `packages/agent/README.md`
  - `UnifiedAgent` can execute tasks of type `clawd`
  - skills are discovered from `~/.clawd/skills` (Markdown w/ frontmatter + Implementation code)

### C) TNF skill documenting OpenClaw integration
- `.agent/skills/clawd-bot-integration/SKILL.md`
  - Hybrid Controller/Worker architecture:
    - Controller: `ClawdEngine` (inside UnifiedAgent)
    - Worker: Cloud Sandbox (Playwright, shell, file ops)
  - explicit note: TNF uses “Clawd” naming but follows OpenClaw protocols

### D) Backend execution wiring
- `apps/backend/src/jobs/processors/agent-execution.processor.ts` imports `ClawdEngine`
- `apps/backend/src/modules/agent-registry/*` includes protocol flag(s) like `openclaw?: boolean`
- OpenClaw default model selection now aligns with TNF. Run `node tools/set-openclaw-model.js` (see `docs/openclaw/GLM-4.7-configuration.md`) to keep Codex-based sessions working while switching new deployments to GLM 4.7.

---

## 3) Security knobs relevant to OpenClaw-style skills

In `docs/ENVIRONMENT_VARIABLES.md`:

- `OPENCLAW_SKILL_SIGNATURE_REQUIRED` (default `false`)
- `OPENCLAW_SKILL_SIGNING_KEY` (HMAC secret; required if signature required)

This matches the TNF stance of **treating external/community skills as untrusted** unless verified.

---

## 4) What I (this assistant) will do next when “exploring the codebase”

To make onboarding *useful*, I’ll focus on producing a map of:

1. **Protocol layer**
   - A2A: where messages/types live, how routing works
   - MCP: server/client core, tool execution surface
   - Clawd/OpenClaw: protocol adapter points + task type plumbing

2. **Execution surfaces (where tools actually run)**
   - Cloud Sandbox (Playwright/shell/fs) entrypoints + RBAC/audit
   - Backend job queue (Bull/Redis) and workers
   - Frontend surfaces that expose orchestration/agent tooling

3. **Assimilation status report**
   - What TNF already covers that OpenClaw also does (scheduling, skills, messaging)
   - What’s missing or intentionally different
   - Where renames are planned vs not worth doing

Deliverable: a short “TNF ↔ OpenClaw capability overlap matrix” and a “where to plug in new adapters” guide.

---

## 5) Notes / constraints

- The repo currently appears **very dirty** (many modified/untracked files). While onboarding, I will:
  - avoid making speculative edits
  - prefer read-only exploration + documentation
  - only change code when explicitly asked for an implementation task

---

## 6) Quick pointers (files worth reading next)

If you want me to go deep in the exact right order, these are strong candidates:

- `packages/agent/src/implementations/ClawdEngine.ts`
- `packages/agent/src/services/ClawdAssimilationService.ts`
- `apps/cloud-sandbox/` (service boundary; RBAC/quota/audit)
- `packages/relay-core/src/services/MasterAgentRegistry.ts` (routing/registry)
- `packages/a2a-core/` + `packages/mcp-core/` (protocol primitives)

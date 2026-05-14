# TNF Public Release Swarm Playbook (2026-03-03)

## Goal

Ship TNF for public release with a coordinated multi-agent swarm, frontend-first
execution, and hard release gates that prevent mock/demo regressions.

## Command Center

- Primary orchestrator: `.agent/agents/orchestrator.md`
- Planning and dispatch: `.agent/agents/project-planner.md`
- Runtime health: `.agent/agents/continuous-improver.md`
- Queue defaults:
  - planning: `tnf:master:tasks:planning`
  - pending: `tnf:master:tasks:pending`
  - realtime: `tnf:master:tasks:realtime`

## Release Phases

1. Phase A (Frontend Trust): remove remaining fabricated UX states from
   user-facing routes.
2. Phase B (API + Data Truth): ensure every surfaced UI call has real backend
   behavior or explicit unavailable status.
3. Phase C (Security + Compliance): auth, secrets, abuse paths, and
   auditability.
4. Phase D (Reliability + Scale): error budgets, observability, rollback, and
   CloudRuntime recovery drills.
5. Phase E (Launch + Documentation): public docs, onboarding, SEO, and operator
   runbooks.

## Specialty Agent Matrix

| Domain             | Lead Agents                                                     | Core Deliverables                                                              |
| ------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Frontend UX        | `frontend-specialist`, `mobile-developer`, `seo-specialist`     | Production-grade nav/routes, empty/error states, mobile quality, SEO metadata  |
| Backend/API        | `backend-specialist`, `database-architect`                      | Contract correctness, schema integrity, endpoint stability, migration safety   |
| Security           | `security-auditor`, `penetration-tester`                        | Auth gate validation, threat checks, dependency/security hygiene               |
| Reliability        | `devops-engineer`, `performance-optimizer`                      | CloudRuntime deploy resilience, latency/error monitoring, load bottleneck reduction |
| QA                 | `test-engineer`, `picoclaw-tester`, `picoclaw-tester-viability` | End-to-end release test matrix and regression evidence                         |
| GTM + Intelligence | `documentation-writer`, `news-scout`, `scout-llm-opportunities` | Public docs, launch notes, competitive signal updates                          |
| Runtime Execution  | `openclaw-fleet`, `zeroclaw-sandbox`                            | High-concurrency task execution and safe sandbox verification                  |

## Frontend-First Must-Ship Checklist

- [ ] Public routes never show fake/demo content when backend is unavailable.
- [ ] Every async UI has deterministic loading, unavailable, empty, and success
      states.
- [ ] Mobile viewport quality verified for primary surfaces (dashboard, agents,
      workflows, admin).
- [ ] Lighthouse baseline captured for public pages (performance, accessibility,
      SEO).
- [ ] Design consistency pass: typography scale, spacing system, semantic color
      usage.
- [ ] Auth/session UX correctness for expired tokens and permission-denied
      flows.

## System-Wide Release Gates

- [ ] `pnpm run release:gate`
- [ ] `pnpm run release:gate:strict`
- [ ] `pnpm run release:gate:strict:smoke`
- [ ] CloudRuntime deploy status green for API + frontend + claw services
- [ ] Security scan and dependency review complete
- [ ] Rollback procedure tested and documented

## OpenClaw + PicoClaw Model Policy (Free-Tier Compatible)

Use free models for PicoClaw where possible and configure explicit fallbacks.

- Primary: `kilo/auto-free`
- Fallbacks:
  - `moonshotai/kimi-k2.5:free`
  - `minimax/minimax-m2.5:free`
  - `arcee-ai/trinity-large-preview:free`
  - `stepfun/step-3.5-flash:free`
  - `corethink:free`
  - `openrouter/free`

All provider changes should keep active and complete fallback chains configured,
not single-model pinning.

## Immediate Run Commands

```bash
pnpm run tnf:onboard
pnpm run factory:boot
pnpm run factory:release:seed
pnpm run release:gate
```

## Exit Criteria (Public Launch)

- Frontend and API release gates are green.
- No P0 routes depend on fabricated data.
- Security and reliability sign-off completed.
- Launch docs and operator runbooks are published.

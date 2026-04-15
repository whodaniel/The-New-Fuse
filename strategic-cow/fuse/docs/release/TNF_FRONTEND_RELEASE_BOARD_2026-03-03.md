# TNF Frontend Release Board (2026-03-03)

## Objective

Drive frontend to public-release quality with specialty-agent parallel lanes and
measurable acceptance checks.

## Lanes

| Lane                               | Owner                  | Scope                                                        | Acceptance                                                |
| ---------------------------------- | ---------------------- | ------------------------------------------------------------ | --------------------------------------------------------- |
| FE-1 Core UX truthfulness          | `frontend-specialist`  | Remove remaining mock/demo fallbacks from high-traffic pages | No fabricated data paths in production code for P0 routes |
| FE-2 Mobile + responsive hardening | `mobile-developer`     | Dashboard, agents, workflows, admin mobile polish            | No layout breakpoints at 360/390/768/1024 widths          |
| FE-3 Visual consistency            | `primitive-master`     | Typography, spacing, semantic color cleanup                  | Shared tokens applied and inconsistent variants reduced   |
| FE-4 SEO + discoverability         | `seo-specialist`       | Metadata, titles/descriptions, crawlability                  | Public route metadata complete and crawl-safe             |
| FE-5 Reliability UX                | `test-engineer`        | Error/loading/empty states and retry behavior                | Deterministic state transitions for all async surfaces    |
| FE-6 Operator/Admin quality        | `documentation-writer` | Admin UX docs and runbook screenshots                        | Admin runbook reflects live UI behavior                   |

## P0 Route Set

- `/`
- `/dashboard`
- `/agents`
- `/workflows`
- `/admin`
- `/hub`

## Task Sequence

1. Audit each P0 route for mock/demo fallback paths.
2. Replace fallback content with truthful unavailable/empty states.
3. Enforce reusable error and loading state components.
4. Validate mobile breakpoints and interaction affordances.
5. Capture release evidence in a single report artifact.

## Verification Commands

```bash
pnpm run release:gate
pnpm run release:gate:strict
pnpm run qa:swarm:service:status
```

## Done Definition

- All FE lanes accepted.
- P0 routes pass release gate.
- No known high-severity frontend regressions remain open.

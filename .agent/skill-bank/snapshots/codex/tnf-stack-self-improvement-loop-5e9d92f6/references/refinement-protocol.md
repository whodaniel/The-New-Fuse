# Refinement Protocol

## Objective
Continuously improve both TNF reliability routines and this skill definition from real run evidence.

## Loop
1. Run audits and collect artifacts.
2. Classify failures by domain: links, semantic routes, auth, build, deployment.
3. Patch smallest scope first.
4. Re-run affected audits and full scorecard.
5. Log what changed, root cause, and prevention update.
6. Update SKILL.md or references if repeated failure class appears.

## Update Triggers
- Same failure type repeats in 2+ runs.
- New service or route family introduced.
- Endpoint conventions change (`/api/*` vs `/v1/*`).
- New specialist agent required for coverage.

## Documentation Rules
- Keep SKILL.md concise and procedural.
- Move detailed examples and failure catalogs into references files.
- Keep run logs in repository ops docs, not only local notes.

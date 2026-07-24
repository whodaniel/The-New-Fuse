# Railway-era deployment scripts (archived 2026-07-23)

Preserved for reference. **Nothing here runs as-is.**

## Why these are broken

TNF deployed on Railway until it migrated to GCP Cloud Run + Cloudflare +
Supabase + Upstash. During that migration, commit `62b2a3e2f1` string-replaced
`railway` with `cloud_runtime` across the repo — 346 files, 2438 occurrences,
including filenames.

`cloud_runtime` is not a real binary. Every script in this directory invokes it
(`cloud_runtime up`, `cloud_runtime status --json`,
`cloud_runtime variables set`, `npm install -g @cloud_runtime/cli`). To read
them as originally written, substitute `railway` back in.

Some also carry Railway's GraphQL response shape in `jq` filters, e.g.
`.environments.edges[].node.serviceInstances.edges[].node` — there is no Cloud
Run equivalent, so those sections need rewriting rather than renaming.

## What was archived

Scripts whose _purpose_ was Railway deployment: anything under
`scripts/cloud_runtime/` that wasn't wired into a `package.json`, anything with
`cloud_runtime` in its filename, and deploy scripts where dead-CLI calls made up
≥5% of the lines. Original paths are preserved beneath this directory.

## What was deliberately NOT archived

- **Generic deployment tooling** with only incidental references —
  `blue-green-deploy.sh`, `canary-deploy.sh`, `rollback.sh`, `health-check.sh`,
  `smoke-tests.sh`, `orchestrate-deployment.sh`, `validate-deployment.sh`,
  `deploy-automated.sh`, `deployment-dashboard.sh`, `docker-build-all.sh`,
  `activate-perpetual-system.sh`, `robust_set_vars.js`. These are
  platform-agnostic and still useful; they each need a small fix, not removal.
- **Anything wired into a `package.json` script** (12 files), including
  `scripts/cloud_runtime/sync-openclaw-oauth-instance.sh`, which the
  `openclaw-oauth-rotation` skill still depends on.
- **Live callers' dependencies** — `zeroclaw-boot.cjs` (used by
  `packages/tnf-cli/src/boot/pipeline.ts`), `resolve-cloud-redis.sh` (used by
  `scripts/orchestrator/factory-boot.sh`), `final-deploy.sh`,
  `deploy-to-cloud_runtime.sh`, and
  `scripts/deployment/cloud_runtime-deploy.sh`. These were archived and then
  restored once reference-checking caught the callers.

## Still outstanding (line-level callers — addressed 2026-07-24)

Generic deploy tooling, package.json-wired sync scripts, frontend CLI strings,
and `.github/workflows/deploy.yml` no longer invoke the dead `cloud_runtime`
binary. Live callers use `scripts/lib/tnf-cloud-run.sh` (gcloud) or refuse with
a clear redirect to `scripts/deployment/gcp-deploy.sh`.

`CLOUD_MIGRATION_BLUEPRINT.md` is still cited across the repo as the migration
reference and does not exist at that path. The nearest real document is
`packages/compounding-memory/wiki/doc-cloud-migration-blueprint.md`.

# Archived: apps/stripe-provider-bridge (2026-08-09)

## Why archived

Thin Express demo (~100 lines) for Stripe Agentic Provisioning Protocol. Not
wired into production TNF billing; kept the monorepo mental model cluttered.

## Unique capability check

| Capability | Status |
| --- | --- |
| Stripe APP sketch | Preserve in this archive; rehome under `apps/api` or `docs/examples` when billing ships |
| Default OSS / runtime | Never part of regular download |

## Prefer instead

- Future billing: implement in `apps/api` / control-plane when productized
- Do not revive under `apps/` as a parallel demo unless actively exercised

## Restore

```bash
mv archive/apps/stripe-provider-bridge apps/stripe-provider-bridge
```

Re-add to `data/distribution/oss-app-boundary.json` (`nonOssOrPersonalApps`) and
`scripts/sync-repos.sh` `ALWAYS_EXCLUDE`.

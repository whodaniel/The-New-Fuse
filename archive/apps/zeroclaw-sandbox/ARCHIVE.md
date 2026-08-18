# Archived: apps/zeroclaw-sandbox (2026-08-09)

## Why archived

Unused CloudRuntime Docker/sandbox surface. TNF must stay adaptive: fill roles
with the **best current** candidates rather than treat stale CloudRuntime
entrypoints as required infrastructure.

The ~21KB `entrypoint-cloud_runtime.sh` paralleled
`apps/extensions/picoclaw-overseer/entrypoint-cloud_runtime.sh` in pattern
(routing keys, health proxy) but targeted a different runtime (TOML/`zeroclaw`
vs JSON/`picoclaw`). Unifying unused shells was not worth the drag.

## Unique capability check

| Capability                        | Status                                                                                   |
| --------------------------------- | ---------------------------------------------------------------------------------------- |
| ZeroClaw Rust binary image        | Upstream `zeroclaw-labs/zeroclaw` (Dockerfile cloned at build)                           |
| Anthropic OAuth sandbox story     | Operator flow; not required for default TNF runtime                                      |
| Live role fill / adaptive routing | Prefer current control-plane + Cloudflare claw relays / boot scripts — not this app tree |
| PicoClaw overseer                 | Still live: `apps/extensions/picoclaw-overseer` (TNF-Extensions)                         |

## Prefer instead

- Role assignment via adaptive routing / agent registry (best available
  candidate)
- `scripts/orchestrator/zeroclaw-boot.cjs` and Cloudflare zeroclaw relay paths
  when a ZeroClaw runtime is intentionally revived
- PicoClaw proprietary overseer: `apps/extensions/picoclaw-overseer`

## Restore (only if needed)

```bash
mv archive/apps/zeroclaw-sandbox ../TNF-Extensions/zeroclaw-sandbox
```

Then re-add to `data/distribution/oss-app-boundary.json` satellites (not core
`apps/`) and keep `apps/extensions` in `scripts/sync-repos.sh` `ALWAYS_EXCLUDE`.

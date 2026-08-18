# Relay ownership — `relay-core` vs `apps/relay-server`

**Date:** 2026-08-09

## Canonical runtime (use this)

| Need                             | Path                                                                     |
| -------------------------------- | ------------------------------------------------------------------------ |
| Federation / agent WS relay      | `packages/relay-core` (`standalone-relay`, `tnf-relay` bin)              |
| Master clock / broker / director | `packages/relay-core` scripts                                            |
| Root / CLI                       | `pnpm relay`, `pnpm relay:start`, `tnf relay` → **relay-core only**      |
| Boot pipeline artifacts          | `packages/relay-core/dist/standalone-relay.js` (+ clock/broker/director) |

`apps/relay-server` is **not** started by default monorepo or CLI relay
commands.

## Legacy app (keep, don’t grow)

`apps/relay-server` (`tnf-relay-complete`) is the older **API interception /
proxy / dashboard** package (Claude Code env injection, HTTP proxy demos, React
`ui/`, large `scripts/`). It remains an OSS form factor in the boundary for
operators who still load that surface, but:

1. New federation / channel / registry work goes in **`packages/relay-core`**.
2. Do not add parallel “complete relay” features to the app.
3. Prefer shrinking the app over time (delete `README.md.backup`, dual
   `mcp-server.js` / `.mjs` when safe) toward a thin wrapper or archive.

## Operator rule

If something needs “the relay,” start **`@the-new-fuse/relay-core`**. If you
need legacy intercept tooling, say so explicitly and use `apps/relay-server`
under that name — not as a second federation bus.

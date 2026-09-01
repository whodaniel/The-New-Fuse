# SESSION_HANDOFF_LATEST

Protocol ACK: `TNF_PROTOCOL_ACK` Spec: `tnf/session-handoff/0.2` Created At:
`2026-09-01T12:57:27.460Z` Handoff ID: `3bb048df-301d-4944-8dd5-2c020ae9e0f5`

## Scope

- Repository: `whodaniel/tnf-monorepo`
- Canonical Source: `whodaniel/tnf-monorepo`
- Branch: `fix/api-dev-stale-tsbuildinfo`
- Head SHA: `92f3c2ed05945357f140ed68dd05728426e75db2`
- Sensitive Scope: `internal`

## Classification

- Work Domain: `unknown`
- Artifact Destination: `unknown`
- Data Residency: `unknown`
- Sensitivity: `unknown`

## Work Summary

- apps/api: fixed a real, 100%-reproducible dev-server crash. nest-cli.json's
  deleteOutDir wipes dist/ on every 'nest start --watch', but
  tsconfig.tsbuildinfo (tsc's incremental cache) is a sibling file outside dist/
  and was never cleared alongside it — so the second and every subsequent 'pnpm
  dev'/'start:dev' run has tsc trust a now-stale cache, report 0 errors, and
  skip re-emitting dist/main.js, crashing with Cannot find module. Cleared
  tsconfig.tsbuildinfo before nest start in dev/start:dev/start:debug, mirroring
  what the existing clean script already does. Found while diagnosing a live,
  real 502 on /api/agents through the gateway (apps/api simply wasn't running);
  also found and fixed separately (not part of this commit): a corrupted root
  node_modules (brace-expansion missing its real files under
  node_modules/glob/node_modules/ and at top level) via pnpm install + removing
  one leftover empty shadow directory.

## Changed Paths

- apps/api/package.json
- apps/chrome-extension/dist-v7/content/index.js
- apps/chrome-extension/dist-v7/content/main-world-console-hook.js
- apps/chrome-extension/dist-v7/manifest.json
- apps/chrome-extension/dist-v7/native-host/tnf-native-host.cjs
- apps/chrome-extension/dist-v7/popup/index.html
- apps/chrome-extension/dist-v7/popup/popup.css
- apps/chrome-extension/dist-v7/popup/popup.js
- apps/chrome-extension/dist-v7/service-worker.js
- apps/chrome-extension/src/v6/background/browser-automation.ts
- apps/chrome-extension/src/v6/background/index.ts
- apps/chrome-extension/src/v6/content/index.ts
- apps/chrome-extension/src/v6/content/main-world-console-hook.ts
- apps/chrome-extension/src/v6/content/utils/ConsoleCapture.ts
- apps/chrome-extension/src/v6/manifest.json
- apps/chrome-extension/src/v6/shared/types.ts
- apps/chrome-extension/tsconfig.json
- apps/chrome-extension/webpack.v7.config.cjs
- docs/protocols/AGENT_STATUS_LEDGER.md
- docs/protocols/LIVING_STATE.md
- docs/protocols/reports/SESSION_HANDOFF_LATEST.json
- docs/protocols/reports/SESSION_HANDOFF_LATEST.md

## Verification

- privacy_guard: `na`
- secret_sweep: `na`
- docs_pii_guard: `na`
- supabase_rls_audit: `na`

## Continuation

- Owner: `tnf-orchestrator`
- Targets: `story-architect`, `librarian`
- Priority: `medium`

### Resume Checklist

- Read docs/protocols/reports/SESSION_HANDOFF_LATEST.md
- Validate SESSION_HANDOFF_LATEST.json against
  docs/protocols/schemas/tnf-session-handoff.schema.json
- Execute listed next actions in order and preserve privacy/security gates

## Next Actions

- Re-verify /api/agents through the gateway now that apps/api can actually boot
  repeatedly; confirm no other packages in the monorepo share nest-cli.json's
  deleteOutDir+tsbuildinfo combination with the same latent bug.

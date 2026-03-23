# Bridge Report: tnf-mini-omni-voice-loop

Date: 2026-03-23  
Status: IMPLEMENTED

## Objective

Integrate Mini-Omni voice loop execution into TNF’s bridge framework with a
repeatable contract and smoke validation path.

## What Was Added

1. Bridge contract:
   - `docs/protocols/bridges/tnf-mini-omni-voice-loop.yml`
2. Relay-core integration service:
   - `packages/relay-core/src/services/MiniOmniBridgeService.ts`
   - export wired via `packages/relay-core/src/index.ts`
3. Protocol smoke command:
   - `scripts/protocols/mini-omni-bridge-smoke.cjs`

## Validation Notes

1. Relay-core type-check should include the new bridge service:
   - `pnpm --filter @the-new-fuse/relay-core run type-check`
2. Smoke command validates endpoint + streaming bytes:
   - `node scripts/protocols/mini-omni-bridge-smoke.cjs --json`
3. Expected pass condition:
   - `ok=true`
   - `statusCode=200`
   - `bytes > 0`

## Operational Notes

1. Default endpoint is `http://127.0.0.1:60808/chat`.
2. Default sample discovery checks:
   - `MINI_OMNI_SAMPLE_WAV`
   - `$HOME/mini-omni/data/samples/output1.wav`
3. Use `--output <path>` to persist returned audio stream for audit/debug.

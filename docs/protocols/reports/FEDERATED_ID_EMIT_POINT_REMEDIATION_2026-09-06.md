# Federated recovery emit-point remediation — 2026-09-06

Status: implemented and locally verified; overall doctor gate remains failing.

Branch: `tnf/worktree/federated-emit-20260906`.
Base: `f8ef602fd1060eacaf318c2a7288c1149c056e2b`, verified against the live canonical `origin/main` ref.
Classification: core / oss_runtime / product_state / public.

## Changes

- INC-1: standalone recovery frames and audit metadata use the existing `deterministicIdNumber('stall-detector')` Base58 builder.
- INC-2: recovery content omits missing or invalid ID numbers instead of rendering an invalid ID-shaped sentinel.
- INC-3: standalone recovery uses the existing MCID builder and emits identical envelopes in `payload.mcid`, `payload.federation.mcid`, and metadata. Each recovery has a fresh UUID event and correlation ID; causation is null. The channel is in `scope.channel_id`.
- The proposed `correlation_id = channelId` was corrected: the canonical schema requires a UUID, whereas channel names need not be UUIDs.
- Schema validation exposed a related builder bug: hyphenated conversation names were treated as causation UUIDs. Only UUID-shaped lineage candidates are now selected.

## Verification

- Turn Zero Stage A and write readiness passed after regenerating the isolated workspace's inherited invalid handoff through Turn End. The inherited values were `cli-tool`, `oss-main`, and `local` rather than canonical classification values.
- Protocol contracts build: PASS (`node node_modules/typescript/bin/tsc -p packages/protocol-contracts/tsconfig.json`).
- Relay build: PASS (`node node_modules/typescript/bin/tsc -p packages/relay-core/tsconfig.json --skipLibCheck`). The first attempt exposed a missing local protocol-contracts dependency link; the dependency was built and linked within this worktree before the successful build.
- Focused tests: 15/15 PASS via `node --test packages/relay-core/tests/recovery-federation.test.cjs packages/relay-core/tests/message-delivery.test.cjs packages/relay-core/tests/relay-audit.test.cjs`.
- The recovery smoke recursively validates every canonicalEntityId, idNumber, and mcid in the exercised builder outputs and actual serialized WebSocket frames. MCID validation uses Ajv 2020 with formats and the repository's canonical JSON schema. Two real loopback WebSocket deliveries verify stable sender identity and fresh event UUIDs.
- The smoke is part of the existing relay test glob, already invoked by the manual CI core-test workflow. Hosted CI was not run.
- `git diff --check`: PASS.
- `tnf doctor`: FAIL — DATABASE_URL is unset and the cloud API is unreachable from this shell. Doctor also reports missing `.projects/`, missing Stripe env mapping, and a disconnected WhatsApp bridge.

## Scope and continuation

No running production relay was restarted or deployed. The WebSocket test exercises the production recovery emitter and serializer without starting unrelated Redis services. Other workspace dependencies resolve to the existing local installation; protocol-contracts and relay-core were built in this isolated workspace.

This verifies the affected recovery emit paths, not every producer across the monorepo. Do not announce overall emit-point consistency achieved until the doctor gate is green. Restore the authorized DB/API environment and rerun doctor, then integrate and deploy through the normal controlled workflow.

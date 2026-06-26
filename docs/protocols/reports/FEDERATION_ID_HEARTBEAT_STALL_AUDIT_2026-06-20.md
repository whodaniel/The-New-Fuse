# Federation ID + Heartbeat + Stall Defensive Audit (2026-06-20)

Cross-walk of Phase 9 federated IDs (`canonicalEntityId`, `idNumber`, `mcid`),
Turn Zero / handoff / frontload / self-prompt loops, and heartbeat/stall recovery
paths.

## Authority chain (Turn Zero)

| Layer | Canonical source | Role |
|-------|------------------|------|
| Turn Zero mandate | `docs/protocols/TURN_ZERO_MANDATE.md` | Startup sequence, Inspect→Act→Verify |
| Living state | `docs/protocols/LIVING_STATE.md` | Active directive + completed steps |
| Handoff | `docs/protocols/reports/SESSION_HANDOFF_LATEST.json` | Resume packet after restart |
| Agent ledger | `docs/protocols/AGENT_STATUS_LEDGER.md` | Fleet roster + status |
| Frontload workflow | `.agent/workflows/frontload.md` | Session bootstrap wrapper |
| DACC roles | `.agent/ROLE_DEFINITIONS.md` | Director/Orchestrator/Broker/Agent + ID namespaces |

## Three federated ID namespaces (Phase 9)

| Namespace | Format | Assigned by | Used in heartbeat/stall? |
|-----------|--------|-------------|---------------------------|
| `canonicalEntityId` | `TNF:LOCAL:AGENT:PROVIDER:NAME:001` | `buildCanonicalEntityId()` | **Partial** — BROKER-Green + extension page agents (2026-06-20) |
| `idNumber` | `ID#:<Base58>` | Master Clock Redis INCR (prod) or deterministic FNV bridge | **Partial** — bridge/coordinator capture; extension now emits deterministic until REGISTRATION_CONFIRMED |
| `mcid` | `tnf/mcid/0.1` envelope | Per-message / per-registration | **Partial** — self-prompt service + BROKER-Green + extension MESSAGE_SEND (2026-06-20) |

## Heartbeat / stall defensive stack

```
Master Clock (ORCHESTRATOR)     heartbeat 3s, stall check 2.5s, AGENT-XX assignment
        ↓
Relay standalone-relay.ts       HEARTBEAT handler, StallDetector (45s threshold)
        ↓
Extension background            Page-agent heartbeats every 30s + stall watchdog wake pings
        ↓
BROKER-Green coordinator        Broker heartbeat 30s, skips system/AI-echo forwarding
        ↓
SelfPromptService (master-clock) mcid envelope + gate_decisions on stall self-prompts
        ↓
Extension SelfPrompter          Progressive prompt steps into page chat (workflow-engine)
```

### Clues from stall/heartbeat docs & code

1. **StallDetector** (`packages/relay-core/src/services/stall-detector.ts`) tracks
   `conversationId` per channel — aligns with `metadata.conversationId` /
   `correlationId` but does **not** emit `idNumber` on recovery frames.
2. **Recovery messages** use `from: stall-detector`, `isRecoveryAttempt: true` —
   extension `shouldInjectRelayMessage()` blocks most system traffic; heartbeats
   optionally allowed for recovery.
3. **SelfPromptService** builds full **mcid v0.1** with `gate_decisions` —
   strongest ID lineage implementation in the stack; page agents do not yet mirror
   gate_decisions on outbound frames.
4. **Handoff v1.1** (`handoff-protocol.ts`) requires `cumulativeId` (= mcid bundle)
   + `gateDecisions` — aligned with self-prompt but **not** wired into extension
   frontload or Green tab onboarding until 2026-06-20 partial fix.

## Frontload alignment

| Component | Before audit | After 2026-06-20 fix |
|-----------|--------------|----------------------|
| `frontloadPageAgentContext()` | Sent `FUSE_ONBOARDING_CONTEXT` without federation axes | Includes `idNumber`, `canonicalEntityId`, `mcid`, enriched roster |
| Content script handler | **Missing** — frontload packet dropped on floor | `FUSE_ONBOARDING_CONTEXT` case stores context + enables SelfPrompter |
| Turn Zero file list | Static paths only | Handoff JSON now documents federation gap matrix |
| `tnf onboard` / frontload.md | Text-only bootstrap | Unchanged — still canonical for CLI sessions |

## Self-prompt alignment

| Path | mcid / correlation | idNumber | Notes |
|------|-------------------|----------|-------|
| Master Clock SelfPromptService | Full mcid + gates | No | Redis egress via TNF envelope |
| Extension ProgressiveSelfPrompter | No | No | DOM injection only; relies on frontload policy |
| BROKER-Green stall skip | N/A | N/A | Filters `isRecoveryAttempt` / system senders |
| Green coordinator inbound log | correlationId | **Added** idNumber field | `inbound-ai-responses.jsonl` |

## Targeted agent addressing (same channel)

Implemented 2026-06-20 in `apps/chrome-extension/src/v6/shared/federation-identity.ts`:

- `@GLM`, `@Gemini`, `@page-agent-…`, `@ID#:…`, `/to agent message`
- Relay `to` field + `metadata.addressedAgentId`
- Content script skips injection when message addressed to another agent

## Gap matrix (remaining)

| Gap | Severity | Status |
|-----|----------|--------|
| Master Clock REGISTRATION_CONFIRMED → sequential `idNumber` | High | Extension handler ready; requires master-clock Redis bridge live |
| Stall recovery frames lack `idNumber` / full mcid | Medium | **Fixed 2026-06-20** — `recovery-federation.ts` + broker identity on recovery frames |
| SelfPromptService ↔ extension SelfPrompter not linked | Medium | **Fixed 2026-06-20** — SelfPrompter emits mcid; background mirrors `SELF_PROMPT_FEDERATION_FRAME` |
| Handoff v1.1 `cumulativeId` not emitted on session handoff JSON | Medium | **Fixed 2026-06-20** — `emit-session-handoff.cjs` + `session-handoff-mcid.cjs` |
| Session N → N+1 causation chain | Medium | **Fixed 2026-06-20** — handoff lineage mirror + relay `/handoff-lineage` + frontload `sessionLineage` |
| Intent frames + CER (ChatGPT Phase 2) | Planned | BROKER-Green + MESSAGE_SEND schema |
| BROKER-Green process intermittent | High | `green-channel-coordinator-service.sh start` after every fleet restart |
| Relay `agents:0` at health check | Info | Normal when no WS clients connected |
| GLM `chat.z.ai` return path | Medium | Extension dist-v7 reload + passive capture (2026-06-20) |

## Restart resume order

1. Turn Zero: `docs/protocols/TURN_ZERO_MANDATE.md` steps 1–7
2. Read `SESSION_HANDOFF_LATEST.md` (next-agent focus) + this audit
3. `curl http://127.0.0.1:3007/health` and `curl http://127.0.0.1:3007/handoff-lineage`
4. Restart relay: `cd packages/relay-core && node dist/standalone-relay.js`
5. `node scripts/gemini-redis-wrapper.cjs`
6. `bash scripts/runtime/green-channel-coordinator-service.sh start`
7. Reload FuseConnect `apps/chrome-extension/dist-v7`
8. Green ● Syncing on all tabs; verify WS metadata has `idNumber` + `mcid`
9. Standalone smoke: `node scripts/federation-agent.cjs send Green ping`

## Next session emit rule

When running `node scripts/protocols/emit-session-handoff.cjs`, the new handoff **must** chain
`federation_lineage.cumulativeId.lineage.causation_id` from prior mcid
`27ba9127-5afb-41bc-83f9-d365a54c8315` (automatic via `session-handoff-mcid.cjs`).

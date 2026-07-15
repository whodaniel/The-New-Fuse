`[CLASS:INTEL] [STATUS:PENDING]` `[DOC_AUDIT_BACKFILL:2026-07-14]` — header
restored for Gate 3 compliance; reclassify on next vetting pass.

# Agent Status Ledger

Updated: **2026-07-15T12:22:20.350Z** — handoff `4f58084d-8923-4892-bab5-7cc9d8bb32f3` (`df79b1a184db`).
`858a32ed-09b3-4c45-8e72-b5eafb0b085b` (`47cde235c48f`).

## Next Agent Focus (read first)

| Priority | Action                                                                                                     |
| -------- | ---------------------------------------------------------------------------------------------------------- |
| **P0**   | Continue priority queue from SESSION_HANDOFF_LATEST.json continuation.resume_checklist. |
| **P0**   | Emit a fresh handoff artifact immediately after completing the next critical work unit. |

Full detail: `docs/protocols/reports/SESSION_HANDOFF_LATEST.md`

1. `docs/protocols/TURN_ZERO_MANDATE.md`
2. `docs/protocols/LIVING_STATE.md`
3. This ledger
4. `docs/protocols/reports/SESSION_HANDOFF_LATEST.json`
5. `docs/protocols/reports/FEDERATION_ID_HEARTBEAT_STALL_AUDIT_2026-06-20.md`

## Green Federation (Channel Green)

| Component             | Identity                               | Status                                                              |
| --------------------- | -------------------------------------- | ------------------------------------------------------------------- |
| BROKER-Green          | `TNF:LOCAL:AGENT:TNF:BROKER_GREEN:001` | **Restart required** — `green-channel-coordinator-service.sh start` |
| Browser Agent         | `browser-*` + `ID#:` (deterministic)   | Extension background WS bridge                                      |
| Claude tab            | `page-agent-*` + `ID#:`                | On Green when tab synced                                            |
| ChatGPT tab           | `page-agent-*` + `ID#:`                | On Green; inbound confirmed                                         |
| Gemini tab            | `page-agent-*` + `ID#:`                | On Green                                                            |
| GLM tab (`chat.z.ai`) | `page-agent-*` + `ID#:`                | On Green; passive capture in dist-v7                                |
| Gemini compute        | `tnf-gemini-redis-wrapper`             | Running (verify with `pgrep`)                                       |
| Relay                 | `ws://127.0.0.1:3007/ws`               | OK                                                                  |

## Federated ID Coverage (2026-06-20)

| Layer                       | canonicalEntityId | idNumber | mcid                            |
| --------------------------- | ----------------- | -------- | ------------------------------- |
| Master Clock self-prompt    | ✅                | —        | ✅ full v0.1 + gates            |
| BROKER-Green                | ✅                | bridge   | ✅                              |
| Extension MESSAGE_SEND      | ✅                | ✅       | ✅                              |
| Extension HEARTBEAT         | ✅                | ✅       | —                               |
| Frontload onboarding packet | ✅                | ✅       | ✅                              |
| Stall recovery frames       | ✅ broker         | ✅       | ✅ full mcid + causation        |
| Session handoff JSON emit   | ✅                | ✅       | ✅ federation_lineage v1.1      |
| SelfPrompter steps          | ✅                | ✅       | ✅ per-step mcid + relay mirror |

## Heartbeat / Stall Defensive Stack

| Process                   | Interval            | ID metadata                                   |
| ------------------------- | ------------------- | --------------------------------------------- |
| Master Clock              | 3s heartbeat        | AGENT-XX assignment                           |
| Relay StallDetector       | 45s stall threshold | broker idNumber + mcid on recovery            |
| Extension page heartbeats | 30s                 | **idNumber + canonicalEntityId (2026-06-20)** |
| BROKER-Green              | 30s                 | broker mcid on register                       |
| Extension stall watchdog  | configurable        | wake_ping events (no idNumber)                |

### Newly Registered (This Session)

| Agent                       | Identity                                          | Status                                           |
| --------------------------- | ------------------------------------------------- | ------------------------------------------------ |
| agent-registry-manager      | `TNF:LOCAL:AGENT:AGENT-REGISTRY-MANAGER:001`      | **NEW** — registered at 2026-06-23T22:58:16.160Z |
| backend-specialist          | `TNF:LOCAL:AGENT:BACKEND-SPECIALIST:001`          | **NEW** — registered at 2026-06-23T22:58:16.160Z |
| reputation-management-agent | `TNF:LOCAL:AGENT:REPUTATION-MANAGEMENT-AGENT:001` | **NEW** — registered at 2026-06-23T22:58:16.160Z |
| LLM API Scout Agent         | `TNF:LOCAL:AGENT:LLM API SCOUT AGENT:001`         | **NEW** — registered at 2026-06-23T22:58:16.160Z |
| LLM Endpoint Tester Agent   | `TNF:LOCAL:AGENT:LLM ENDPOINT TESTER AGENT:001`   | **NEW** — registered at 2026-06-23T22:58:16.160Z |
| thenewfuse-frontend-tester  | `TNF:LOCAL:AGENT:THENEWFUSE-FRONTEND-TESTER:001`  | **NEW** — registered at 2026-06-23T22:58:16.160Z |
| tnf-fleet-health-probe      | `TNF:LOCAL:AGENT:TNF-FLEET-HEALTH-PROBE:001`      | **NEW** — registered at 2026-06-23T22:58:16.160Z |
| LLM Validation Worker Agent | `TNF:LOCAL:AGENT:LLM VALIDATION WORKER AGENT:001` | **NEW** — registered at 2026-06-23T22:58:16.160Z |

## Protocol Gaps (prioritized)

1. **BROKER-Green intermittent** — must start after fleet restart
2. **Extension + relay reload mandatory** — dist-v7 + relay restart; verify with
   `curl -sS http://127.0.0.1:3007/health` (no `/handoff-lineage` route)
3. **Master Clock sequential idNumber** — requires Redis bridge live for
   REGISTRATION_CONFIRMED
4. **Phase 2** — intent frames, CER, snapshot versioning (ChatGPT spec)

## Session Logs

- `~/.tnf/green-coordinator/federation-session-log.jsonl`
- `~/.tnf/green-coordinator/four-agent-session.jsonl`
- `~/.tnf/green-coordinator/inbound-ai-responses.jsonl`
- `~/.tnf/handoff-current.json` (mirror of SESSION_HANDOFF)

## Operator

- **Director**: `cursor-auto-operator`
- **Active channel**: Green
- **Handoff ID**: `cb8606c4-29fc-40b0-8db9-6c1c3d26fe7f`
- **Cumulative mcid**: `27ba9127-5afb-41bc-83f9-d365a54c8315`
- **Next**: P0 restart checklist in SESSION_HANDOFF_LATEST.md → four-agent
  verification

| 2026-06-20 | Orchestrator | Published SESSION_HANDOFF_LATEST
(ee61db00-218d-4d00-8539-54c2d153d8a6) | ✅ HANDOFF_READY |

| 2026-06-21 | Orchestrator | Published SESSION_HANDOFF_LATEST
(0f195b52-6711-46ea-9c1e-6c33587e29aa) | ✅ HANDOFF_READY |

| 2026-06-21 | Orchestrator | Published SESSION_HANDOFF_LATEST
(3780c9a4-ea23-4700-8037-37d5684bfc2b) | ✅ HANDOFF_READY |

| 2026-06-21 | Orchestrator | Published SESSION_HANDOFF_LATEST
(72de22f9-f7d7-4496-b07c-e1dd86770854) | ✅ HANDOFF_READY |

| 2026-06-23 | Orchestrator | Published SESSION_HANDOFF_LATEST
(cffffbbe-d465-4593-a419-9905dd389fad) | ✅ HANDOFF_READY |

| 2026-06-23 | Orchestrator | Published SESSION_HANDOFF_LATEST
(7c63cbe6-5db1-4be1-95bc-1ee6ce3d108c) | ✅ HANDOFF_READY |

| 2026-06-23 | Orchestrator | Published SESSION_HANDOFF_LATEST
(30532802-3db1-429c-80f3-245a94a7cd75) | ✅ HANDOFF_READY |

| 2026-06-23 | Orchestrator | Published SESSION_HANDOFF_LATEST
(ef70c596-2124-40bd-952e-5239f3e042a0) | ✅ HANDOFF_READY |

| 2026-06-26 | Orchestrator | Published SESSION_HANDOFF_LATEST
(3a181f47-0cb6-4278-b6bd-aa53b295116c) | ✅ HANDOFF_READY |

| 2026-06-26 | Orchestrator | Published SESSION_HANDOFF_LATEST
(43bca6ff-0a6f-43d2-95c1-f59b126553c4) | ✅ HANDOFF_READY |

| 2026-07-04 | Orchestrator | Published SESSION_HANDOFF_LATEST
(d01db68f-a3dc-495e-a87d-cc02b1e1fd43) | ✅ HANDOFF_READY |

| 2026-07-04 | Orchestrator | Published SESSION_HANDOFF_LATEST
(d0d35edf-5c65-4990-912b-774bf158d0b5) | ✅ HANDOFF_READY |

| 2026-07-04 | Orchestrator | Published SESSION_HANDOFF_LATEST
(05334c5e-8773-4bfe-becb-1f8d0e044330) | ✅ HANDOFF_READY |

| 2026-07-04 | Orchestrator | Published SESSION_HANDOFF_LATEST
(be71f172-3ff8-4cf4-8c08-5e18a75ed453) | ✅ HANDOFF_READY |

| 2026-07-04 | Orchestrator | Published SESSION_HANDOFF_LATEST
(606a375f-a504-45f1-97f7-0476fdbf46b6) | ✅ HANDOFF_READY |

| 2026-07-04 | Orchestrator | Published SESSION_HANDOFF_LATEST
(08937909-fa3a-4bbb-8035-6a96f2187daf) | ✅ HANDOFF_READY |

| 2026-07-04 | Orchestrator | Published SESSION_HANDOFF_LATEST
(35c4fae2-f532-4ff7-a269-fd88507a3691) | ✅ HANDOFF_READY |

| 2026-07-05 | Orchestrator | Published SESSION_HANDOFF_LATEST
(df1eb476-5bc0-416e-a438-fd9bde17a793) | ✅ HANDOFF_READY |

| 2026-07-05 | Orchestrator | Published SESSION_HANDOFF_LATEST
(31caf6d5-0612-4c58-9a88-e3209ed6f19a) | ✅ HANDOFF_READY | | 2026-07-14 |
Orchestrator | Recreated control-plane-contracts + pushed agent status
(38848cd6) | ✅ HANDOFF_READY | | 2026-07-14 | Orchestrator | Published
SESSION_HANDOFF_LATEST (eaaf0c4d-1f33-4080-871c-351f9a86e28f) | ✅ HANDOFF_READY
| | 2026-07-14 | Orchestrator | Published SESSION_HANDOFF_LATEST
(b61890f2-3a47-41d0-9e3c-1de7500cd6a6) | ✅ HANDOFF_READY |

| 2026-07-15 | Orchestrator | Published SESSION_HANDOFF_LATEST
(cb8606c4-29fc-40b0-8db9-6c1c3d26fe7f) | ✅ HANDOFF_READY |

| 2026-07-15 | Orchestrator | Published SESSION_HANDOFF_LATEST
(858a32ed-09b3-4c45-8e72-b5eafb0b085b) | ✅ HANDOFF_READY |

| 2026-07-15 | Orchestrator | Published SESSION_HANDOFF_LATEST (a163102c-df43-49f8-81a4-23d93b8275dc) | ✅ HANDOFF_READY |

| 2026-07-15 | Orchestrator | Published SESSION_HANDOFF_LATEST (4f58084d-8923-4892-bab5-7cc9d8bb32f3) | ✅ HANDOFF_READY |

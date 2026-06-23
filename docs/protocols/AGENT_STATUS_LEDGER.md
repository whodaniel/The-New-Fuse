# Agent Status Ledger

Updated: **2026-06-23T22:32:43.588Z** — handoff
`ef70c596-2124-40bd-952e-5239f3e042a0` (`baab5b2825e5`).
`30532802-3db1-429c-80f3-245a94a7cd75` (`199370ded064`).

## Next Agent Focus (read first)

| Priority | Action                                                                                 |
| -------- | -------------------------------------------------------------------------------------- |
| **P0**   | Trigger GCP Cloud Build deploy for API auth 429 fix (gcp-deploy.sh / cloudbuild.yaml). |
| **P0**   | Verify login at app.thenewfuse.com/auth/login after deploy completes.                  |
| **P0**   | Address partial-medium routes: /admin/control-panel, /analytics, /user/profile.        |
| **P0**   | Migrate webhook hooks and resources.service token reads to authFetch.                  |

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
- **Handoff ID**: `ee61db00-218d-4d00-8539-54c2d153d8a6`
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

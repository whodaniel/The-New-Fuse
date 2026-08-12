# TNF Transport Lane Specification

`[CLASS:PRIME] [STATUS:ACTIVE] [DOC_TYPE:TECHNICAL_DOSSIER] [VISIBILITY:COLLECTIVE]`

**Protocol ID:** `TNF_TRANSPORT_LANES`  
**Authority:** Turn Zero / Fleet Delegation Mandate  
**Companion:** `DispatchGuard.ts`, `check-federated-ws-channels.cjs`,
`run_one_envelope.py`

---

## Purpose

TNF uses **three distinct Redis/WebSocket transport lanes**. They are not
interchangeable. Routing a message on the wrong lane looks like success while
nothing processes it.

| Lane                            | Mechanism                                                                | Primary consumers                                                                      | Typical producers                                                |
| ------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **1. Federated WS channels**    | `ws://host:3007/ws` → `CHANNEL_JOIN` → `CHANNEL_MESSAGE`                 | Fuse Connect `page-agent-*` tabs, `BROKER-Green`/`Blue`, subdirector `*-bridge` agents | Local Subdirector bridges, master-clock, extension background    |
| **2. Redis pub/sub bus**        | `PUBLISH` on `tnf:agents`, `tnf:direct:<from>:<to>`, `tnf:conversations` | Live Redis subscribers (`tnf-agent-cli`, wrappers)                                     | `tnf send` (PUBLISH leg), heartbeats, orchestrator fan-out       |
| **3. Sub-director worker LIST** | `LPUSH` → `tnf:direct:sub-director:<agentId>`                            | `run_one_envelope.py` via cron (`BRPOPLPUSH`)                                          | `tnf send` (worker LPUSH leg), `WorkerDispatcher`, orchestration |

---

## Lane 1 — Federated WebSocket (real-time mesh)

- **Default URL:** `ws://127.0.0.1:3007/ws` (federation mesh). Port **3000** is
  the plain agent relay — different protocol surface; do not probe federation
  on 3000.
- **Channels:** `Green`, `Blue`, `Red`, `Yellow`, `Purple`, `General` (+
  activity logs such as `fuse-activity-log`).
- **Identity on wire:** Every `MESSAGE_SEND` / `CHANNEL_MESSAGE` carries
  `idNumber`, `operationalHandle`, `canonicalEntityId`, and `mcid` in metadata.
- **Chrome extension:** Each website AI tab is a `page-agent-*` federated agent;
  multi-threaded coordination is **channel membership**, not a single CLI
  session.
- **Verify:** `pnpm run tnf:ws:channels:check`

---

## Lane 2 — Redis pub/sub (control-plane fan-out)

- Fire-and-forget `PUBLISH`. No subscriber = message **dropped**, not queued.
- `tnf send` still publishes here for agents with live subscribers.
- `DispatchGuard` verifies recipient liveness before publish when
  `--require-live`.

---

## Lane 3 — Worker LIST queues (async cron drain)

- Queue key: `tnf:direct:sub-director:<workerAgentId>`
- Envelope schema: `type: task`, `version: 1.0`, nested `payload.payload.task`
  (see `WorkerEnvelope.ts` / `run_one_envelope.py`).
- **`tnf send --to <worker>`** LPUSHes here **in addition** to Lane 2 when the
  recipient is a `worker` role agent.

---

## Relay port matrix

| Port | Service         | WS path | Use                                            |
| ---- | --------------- | ------- | ---------------------------------------------- |
| 3000 | Agent relay     | `/ws`   | Extension services tab, legacy activity        |
| 3007 | Federation mesh | `/ws`   | Green/Blue, BROKER, A2A bridge, channel checks |

Resolution order: `discoverRelayUrl()` / `resolveFederationRelayUrl()` — prefers
healthy `:3007`, falls back to `:3000`.

---

## Operator rules

1. Do not treat `tnf send` exit 0 on a **worker** as processed until a run
   artifact exists under `~/.tnf/sub-director/run-artifacts/`.
2. Do not treat relay registration as **channel delivery** — run
   `tnf:ws:channels:check` for Green/Blue isolation.
3. Bridge existing terminal agents with `*-bridge` IDs +
   `metadata.representedAgentId` — never register a second WS socket as the same
   terminal agent id.

---

## Cross-references

- `TNF_FEDERATED_TAG_SYNERGY_SPEC.md` — `canonicalEntityId`, UFTE `federatedId`
- `TNF_CONCURRENT_AGENT_COORDINATION_PROTOCOL.md` — overlap detection
- `.agent/skills/tnf-federated-ws-channel-control/SKILL.md` — operational loop

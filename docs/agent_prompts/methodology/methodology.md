# TNF Prompt-Ingestion & Governing-Committee Methodology

Status: ACTIVE (v1.0) Owner: TNF Federated Prompting WG Scope: In-TNF only. No
changes to ~/agent_prompts/. Last review: 2026-07-04 — triggered by
heartbeat/stall-defense review request.

---

## 1. Why this exists

The legacy heartbeat / stall defense loop treated prompts as **out-of-band
inputs**: Claude Code, Cursor, Hermes, or a human operator dropped text on a
channel, then the relay tried to keep the channel "alive." That model has three
blind spots proven by the 2026-06-20 federation audit and the 2026-03-18
handoff/self-prompt review:

1. Recovery frames lacked `idNumber` / full `mcid` lineage, so the system could
   not tell whether a stall was caused by a real outage or by a real human/agent
   trying to push a prompt.
2. Channel participants who were **governing** the system (Director, Brokers,
   the relay-admin operator, cron governors) shared the same voice as ordinary
   page agents. There was no role-graded treatment of prompts.
3. Self-prompt loops were firing on every heartbeat tick, not on observed
   _intent_ signals. Stall-recovery, ordinary user prompts, and director-level
   directives all looked identical at the recovery seam.

This methodology fixes those three classes of problem without breaking the
existing DACC-v1 role hierarchy or the federation gate chain.

## 2. Scope of Evolution

### 2.1 What we are evolving

| Surface                       | Before                                             | After                                                    |
| ----------------------------- | -------------------------------------------------- | -------------------------------------------------------- |
| Heartbeat frame               | `role` optional, never re-classified               | `role` normalised against DACC role table                |
| Recovery message              | Sent as `[SYSTEM]`, recovery-2 only                | Re-routed through committee gate with role + provenance  |
| User / agent prompt ingestion | Free text, anything → channel                      | Normalised intent frame, peer-checked before injection   |
| Stall threshold               | 30s default, single-participant stalls quarantined | 45s, single-participant → committee co-stall partner     |
| Director overrides            | Manual escalation only                             | Auto-broadcast to committee chair + scheduled substitute |
| Cron governance prompt edits  | Owner-keyed only                                   | Owner + role + committee triple-keyed                    |

### 2.2 What we explicitly do NOT evolve

- DACC-v1 hierarchy (Director > Orchestrator > Broker > Agent).
- `canonicalEntityId`, `idNumber`, `mcid` federated ID namespaces.
- Federation gate ordering
  (`tenant_scope >> trace >> terminal >> risk >> channel`).
- Bridge schemas (`tnf-cron-federation-gates.yml`,
  `agent-self-edit-federation-gates.yml`,
  `twip-federation-orchestration-gates.yml`).
- TWIP terminal identification surfaces.

We add to them; we do not replace them.

## 3. Authorities consulted (and how)

| Authority                          | Location                                                                             | What it provides                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| DACC-v1 role definitions           | `.agent/ROLE_DEFINITIONS.md`                                                         | Director/Orchestrator/Broker/Agent vocabulary                             |
| Federation ID audit                | `docs/protocols/reports/FEDERATION_ID_HEARTBEAT_STALL_AUDIT_2026-06-20.md`           | Three-id namespaces, lineage gaps                                         |
| Handoff + self-prompt review       | `docs/protocols/reports/handoff-selfprompt-review-2026-03-18.md`                     | `HandoffPacket v1.1`, MCID self-prompt payloads                           |
| Federation gate API                | `docs/protocols/reports/federation-gate-api-integration-2026-03-18.md`               | `warn`/`enforce` mode on sharedstate-worker                               |
| Federation gate context signal     | `docs/protocols/reports/federation-gate-context-signal-integration-2026-03-19.md`    | TWIP context risk scoring                                                 |
| Federation gate freshness          | `docs/protocols/reports/federation-gate-context-freshness-integration-2026-03-19.md` | Staleness/escalation thresholds                                           |
| Federation gate operator dashboard | `docs/protocols/reports/federation-gate-operator-dashboard-2026-03-19.md`            | Operator NUI for deny/allow inspection                                    |
| Cron governance review             | `docs/protocols/reports/cron-governance-review-2026-03-18.md`                        | Owner-keyed cron mutation policy                                          |
| Agent classification audit         | `docs/protocols/reports/AGENT_CLASSIFICATION_AUDIT_2026-06-14.md`                    | Five-axis vocabulary (role, worker_action, fulfillment, traits, platform) |
| Self-prompt loop                   | `packages/relay-core/src/services/stall-detector.ts:53`                              | Recovery prompt set identifier                                            |
| Stall detector                     | `packages/relay-core/src/services/stall-detector.ts`                                 | Stall threshold + recovery event contract                                 |

Authority cross-walk: every claim below cites the row in this table.

## 4. Methodology — five ordered loops

The methodology is composed of five loops. They run on a strict order because
each one tightens the contract the next one assumes.

### Loop 0 — Inspect: confirm "baton held"

Per DACC-v1 core principle and the 2026-06-20 audit's restart order:

1. `curl http://localhost:3007/health` (relay liveness).
2. `redis-cli ping` (synaptic bus).
3. `pgrep -fl master-clock` (orchestrator baton holder).
4. `redis-cli CLIENT LIST | grep -c brpop` (zombie BRPOP guard).
5. `crontab -l | grep -E '(tnf|hermes)' | wc -l` (cron surface).

If any of #1/#3 fails, escalate to **committee chair**; do not proceed.

### Loop 1 — Classify: who is sending the prompt, and is it a heartbeat?

Authority: DACC-v1 + vendor vocabulary surfaces.

A prompt is **never** processed until it is classified into exactly one of:

| Class key    | Source role                                           | Behaviour                                                  |
| ------------ | ----------------------------------------------------- | ---------------------------------------------------------- |
| `DIRECTIVE`  | Director (or designated chair)                        | Top priority; routes to orchestrator immediately           |
| `GOVERNANCE` | Cron governance or self-edit approval                 | Triple-keyed (owner + role + committee)                    |
| `USER`       | Human end-user (claude-code/cursor/hermes/terminal)   | Normal intent frame, peer-checked                          |
| `AGENT`      | Worker agent                                          | Required `agent-id` + `mcid` + signing prefix `[AGENT-XX]` |
| `RELAY`      | Relay itself (heartbeat, recovery, queue)             | Skip broker, mirror to committee log only                  |
| `ECHO`       | AI domain echo (model replies in a federated channel) | Filtered first, never ingested                             |

The determination is made by one of two normalisers:

1. **Role normaliser** (`packages/relay-core/src/protocol/role-normaliser.ts`) —
   maps a message `role` value to the table above; rejects `"system"` if it
   carries no provenance (the relay system message is `RELAY` not `ECHO`).
2. **Heartbeat classifier** (Loop 1b in `services/heartbeat-classifier.ts`) — a
   classifier-only pipeline that decides whether a frame is "heartbeat-shaped"
   (no `content`, single `type`, has `idNumber`). Non-heartbeat frames leave
   this loop and run Loop 2.

Any frame whose role cannot be resolved is dropped to the **quarantine** queue
`tnf:committee:quarantine` and flagged for an operator. Mirrors the
gate-and-quarantine pattern in `bridge/tnf-cron-federation-gates.yml`.

### Loop 2 — Ingest: build the intent frame

Authority: handoff-selfprompt-review + MCID schema.

A frame that survives Loop 1 is wrapped in **an intent frame**:

```json
{
  "spec": "tnf/intent/0.1",
  "kind": "USER" | "AGENT" | "DIRECTIVE" | "GOVERNANCE",
  "origin": {
    "canonicalEntityId": "TNF:LOCAL:WORKER:HERMES:GPT-OSS-120B:001",
    "idNumber": "ID#:4Xf9qR",
    "mcid": {"trace_id": "…", "correlation_id": "…", "causation_id": null},
    "session_key": "tty:ttys015",
    "tenant_id": "tnf-local"
  },
  "payload_ref": "tnf://prompts/2026-07-04-001",
  "committee_review_required": false,
  "expected_substitute": null,
  "freshness": {
    "captured_at": "…",
    "max_age_ms": 30000
  }
}
```

Key constraints (from existing authorities — we are not inventing new ones):

- All five fields under `origin` are mandatory for `AGENT`/`GOVERNANCE`; for
  `USER` we accept `session_key` + `tenant_id` and let the role normaliser look
  up the canonical entity.
- `freshness.max_age_ms` defaults to `BROKER_MAX_TWIP_CONTEXT_AGE_MS` (900 000
  ms) when present, otherwise 30 000 ms.
- An `AGENT` frame without `idNumber` gets a deterministic FNV bridge id but is
  flagged `pre_registration` so the relay emits a one-shot
  `REGISTRATION_CONFIRMED` after master-clock approves.

The intent frame is **the only shape** that the per-channel relay handlers will
accept going forward. Legacy `CHANNEL_MESSAGE` shapes are still emitted upstream
but are wrapped in `intent_frame` before the relay routes them to a channel
consumer.

### Loop 3 — Committee decision

The "governing committee" in this methodology is not a static group; it is a
**role-keyed quora** that resolves per intent class:

| Class                      | Primary chair                   | Vote set (any = pass)             | Quorum | Escalation target            |
| -------------------------- | ------------------------------- | --------------------------------- | ------ | ---------------------------- |
| `DIRECTIVE`                | Director (or designated chair)  | 1 (= Director alone)              | 1      | (none — terminal)            |
| `GOVERNANCE`               | Cron governance reviewer        | Owner-token + role-token          | 2/2    | Orchestrator + committee log |
| `USER` (channel-broadcast) | Channel broker                  | 1 broker vote + 1 peer agent vote | 2      | Director                     |
| `USER` (peer-to-peer)      | Target peer                     | Peer acknowledgement              | 1      | Channel broker               |
| `AGENT`                    | Orchestrator                    | Signing + role + ID lineage       | 3/3    | Director                     |
| `RELAY`                    | Relay-admin (loopback operator) | n/a — auto-allowed                | n/a    | Committee log only           |
| `ECHO`                     | Filter                          | n/a — auto-discarded              | n/a    | Quiet log only               |

Substitutes:

- The director may designate a `chair-substitute` via Director
  `tnf:director:substitute` channel. While a substitute holds the chair, the
  Director cannot downgrade.
- Brokers may designate a `peer-substitute` per channel. Substitutes inherit the
  full vote of the principal.
- If a quorum can't reach (e.g., broker down + no peer agent) the frame is held
  30 s in `tnf:committee:pending` and re-voted. If still unresolved, the
  orchestrator (Master Clock) is the **tie-breaker**, never the default vote.

Authority cross-walk:

- Director override pattern: `.agent/ROLE_DEFINITIONS.md` lines 80-91.
- Cron governance owner-keying: `cron-governance-review-2026-03-18.md`.
- Federation gate fail-mode (quarantine vs. fail-open): bridge
  `tnf-cron-federation-gates.yml`.
- Peer-substitute is new in this methodology; it lives where
  `committee_substitutes.spec.ts` reaches first via the ingester shell.

### Loop 4 — Delivery through governance gates

Frame passing the committee runs through the **existing** federation gate chain.
Ordering preserved:

1. `TENANT_SCOPE_GATE`
2. `TRACE_CONTINUITY_GATE` (lineage `mcid` + `idNumber`)
3. `TERMINAL_BINDING_GATE` (terminal-bound frames only)
4. `HIGH_RISK_RUNTIME_GATE` (TWIP context risk + approval bypass)
5. `CHANNEL_MEMBERSHIP_GATE`
6. **(NEW)** `COMMITTEE_REVIEW_GATE` — fires only on
   `committee_review_required=true` intent frames; checks the recorded quorum
   decision and that the recorded `expected_substitute` was filled (or left null
   with quorum).

If the `COMMITTEE_REVIEW_GATE` fails **after** the other gates pass, the frame
goes to `tnf:committee:denied` and the denial includes the missing quorum detail
(mirrors behavior on
`docs/protocols/reports/federation-gate-api-integration-2026-03-18.md` line
47-49).

### Loop 5 — Stall defense re-architected around intent classification

The stall detector stops being agnostic. Two cases change:

1. **Stall triggered by `RELAY` recovery** — keep current behavior
   (`recovery:message` → `RELAY` role → committee skip vote).
2. **Stall triggered by intent-frame contention** — escalation behavior changes.
   If two channels both have pending `USER` frames that haven't been
   quorum-resolved in `> stallThresholdMs`, those channels are flagged
   contested; the orchestrator dispatches a substitute broker.

This is the only stall-defense evolution. The detector itself is _not_
rewritten: we wrap it. Per the
"FEDERATION_ID_HEARTBEAT_STALL_AUDIT_2026-06-20.md" finding about partial
coverage, the wrapper still emits `idNumber` and `mcid` on recovery frames.

## 5. Prompt-Ingestion Classes (Operational)

### 5.1 Class A — Facilitator (Director / Chair Substitute)

Inbound from: Director (`DIRECTOR-001`) or a designated chair substitute.

Pipeline:

1. Loop 0 — baton verified.
2. Loop 1 — class = `DIRECTIVE`.
3. Loop 2 — intent frame built.
4. Loop 3 — committee chair = Director; quorum auto-passes.
5. Loop 4 — federation gates (sub-set 1+2+3 only; 4+5+6 short-circuit for
   `DIRECTIVE`).
6. Delivery: routed directly to the master-clock via `tnf:director:directive`
   channel.

Substitute handling: if Director is offline for `> 60 s`, the chair-substitute
auto-promotes; the methodology does not invent an alternative route — it relies
on the existing failover in `.agent/ROLE_DEFINITIONS.md` lines 195-209.

### 5.2 Class B — Operator (Relay-admin / Cron governance)

Inbound from: `relay-admin-http`, cron governance system, or self-edit
governance systems.

Pipeline:

1. Loop 1 — class = `GOVERNANCE`.
2. Loop 2 — intent frame carries `committee_review_required: true`,
   `freshness.max_age_ms = 0` (operators don't start stale), and explicit
   `expected_substitute` (the secondary owner if the primary owner is the
   requester).
3. Loop 3 — quorum: **owner-token AND role-token** must be present. Operator
   without a peer-substitute can't self-approve.
4. Loop 4 — full federation gate chain.
5. Delivery: routed to the bridge evaluator (`cron-governance-gate.cjs` or
   `agent-self-edit-gate.cjs`).

Pitfall: governance frames from loopback only get the quorum waived when the
frame originates BEARER-token-style and the token matches `TNF_OPERATOR_TOKEN`
(the operator surface). The quorum stays on for any remote operator frame (per
`BRIDGE_AUTO_APPROVE_LOOPBACK` in standalone-relay.ts line 277).

### 5.3 Class C — Peer Agent (worker)

Inbound from: registered page-agent or federated AI tab.

Pipeline:

1. Loop 1 — class = `AGENT`.
2. Loop 2 — must carry signing prefix `[AGENT-XX]` + `canonicalEntityId` +
   `idNumber` + `mcid`. Missing lineage → drop to quarantine (mirror
   "federation-gate-freshness" failure mode).
3. Loop 3 — quorum: signing + role + ID lineage (3/3).
4. Loop 4 — full chain.
5. Deliveries proceed.

The AGENT pipeline is unchanged in topology; the only additions are
methodology-level requirements that the **idNumber** check (3/3) gates the
intent frame, which is what the audit flagged as the "still partial" gap.

### 5.4 Class D — Open user prompt (terminal, editor, browser, MCP)

Inbound from: human via CLI, IDE panel, browser flow, or MCP wrapper.

Pipeline:

1. Loop 1 — class = `USER`.
2. Loop 2 — session_key + tenant_id required; intent frame flags
   `committee_review_required: true` if `to: 'broadcast'` or `to: AGENT-NN`
   without consent.
3. Loop 3 — quorum: 1 broker vote + 1 peer agent vote (TU ≥ 2). Without two
   voters the frame is held, not failed.
4. Loop 4 — full chain with risk + freshness applied.
5. Delivery: ingest target follows `to` field; broadcast intents deliver to
   subscribed consumers only after quorum.

### 5.5 Class E — AI echo (model reply on a federated channel)

Inbound from: Gemini / Claude / ChatGPT tab harnessed via FuseConnect / relay.

Pipeline:

1. Loop 1 — class = `ECHO`.
2. Loop 2 — wrap in echo envelope attached to its origin prompt's
   `mcid.causation_id`.
3. Loop 3 — auto-discard by default (no quorum consumed).
4. Loop 4 — bypassed.
5. Delivery: serve back to the originating tab; optionally broadcast if
   `shareContext=true` on the channel.

Echoes never produce their own broadcast; they only echo upstream. This is the
single most useful change for keeping AI-echoes from triggering stalls.

## 6. Operator handbook

### 6.1 How to inspect committee quora

```bash
redis-cli ZRANGEBYSCORE tnf:committee:quorum -inf +inf WITHSCORES | tail -80
redis-cli SMEMBERS tnf:committee:pending
redis-cli SMEMBERS tnf:committee:denied
redis-cli XRANGE tnf:committee:log - + COUNT 200
```

### 6.2 How to designate a chair-substitute

Director sends a `tnf:director:substitute` frame:

```json
{
  "type": "DIRECTIVE",
  "substitute_canonical_id": "TNF:LOCAL:WORKER:DGE:DGE-CHAR:001",
  "effective_until": "2026-07-04T22:00:00Z",
  "reason": "Director sleep window"
}
```

Recorded via `committee_substitutes.spec.ts`.

### 6.3 How to clear a contested stall

1. `redis-cli LRANGE tnf:committee:contested 0 -1` (pipe of MCC `LRANGE`).
2. Identify the contested channel pair.
3. Dispatch `tnf-comm-broker-substitute <channel>` on the broker with
   `reason="contested-stall"` — channel broker then becomes the substitute and
   the contested stalls clear.

### 6.4 How to detect missing lineage

```bash
# Count agent frames missing idNumber in the last 1000 envelopes
redis-cli XLEN tnf:relay:envelopes
redis-cli XREVRANGE tnf:relay:envelopes + - COUNT 1000 | \
  awk '/AGENT/ && !/idNumber/' | wc -l
```

Anything above 0 lines = drift, raise `tnf-comm-lineage-drift` todo.

## 7. Pitfalls (class — fix the class, not the site)

| Pitfall                                     | Class                                                        | Why class, not site                                                     |
| ------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Recovery frames lack `idNumber`             | The `RELAY` recovery path bypasses Loop 2                    | Same shape seen in audit table; fix the seam, not the call-site         |
| Self-prompt loops re-fire on every tick     | `self_prompt` lacks Loop 1 ingest step                       | Without an intent-class gate the loop emits on every heartbeat          |
| Cron governance allows remote self-approval | Loopback-only auto-approve logic                             | Same pattern re-implemented three times across gates                    |
| AI echoes trigger phantom stalls            | Echo lacks class-quorum short-circuit                        | Replayed whenever shareContext flips a channel on                       |
| Director override race                      | Substitute promotion doesn't disable principal               | Same pattern: any new escalator will hit this                           |
| BROKER-Green process intermittent           | `green-channel-coordinator-service.sh` not in restart bundle | Re-listed in audit table; class is "service must survive fleet restart" |

## 8. Acceptance criteria

A claim that this methodology is "shipped" requires all of:

1. `pnpm --filter @the-new-fuse/relay-core run type-check` (no new TS errors).
2. `node scripts/protocols/cron-governance-gate.cjs --self-check` (still
   passes).
3. `node scripts/protocols/agent-self-edit-gate.cjs --self-check` (still
   passes).
4. `redis-cli SMEMBERS tnf:committee:quorum` is empty in steady state.
5. `redis-cli ZRANGEBYSCORE tnf:committee:pending 0 +inf` returns only fresh
   entries (no entry older than `committee_pending_max_ms = 30 000`).
6. Recovery first-paint `(time-to-recovery-frame)` is within 2 s of stall
   detection (`stallThresholdMs` + 2 000 ms).

If any item fails, the methodology is **not yet shipped**. Roll back via
`COMMITTEE_METHODOLOGY_ROLLBACK=1` on the relay — the legacy `recovery:message`
path is preserved bitwise for one quarter.

## 9. Cross-references

- `.agent/ROLE_DEFINITIONS.md` — DACC roles
- `docs/protocols/reports/FEDERATION_ID_HEARTBEAT_STALL_AUDIT_2026-06-20.md`
- `docs/protocols/reports/handoff-selfprompt-review-2026-03-18.md`
- `docs/protocols/twip-orchestration-extension-v0.1.md`
- `docs/protocols/twip-terminal-identification-surfaces.md`
- `docs/protocols/bridges/tnf-cron-federation-gates.yml`
- `docs/protocols/bridges/agent-self-edit-federation-gates.yml`
- `docs/protocols/bridges/twip-federation-orchestration-gates.yml`
- `docs/protocols/schemas/tnf-cron-governance.schema.json`
- `docs/protocols/schemas/tnf-agent-self-edit.schema.json`
- `docs/protocols/schemas/tnf-master-cumulative-id.schema.json`
- `packages/relay-core/src/services/stall-detector.ts`
- `packages/relay-core/src/standalone-relay.ts`
- `packages/relay-core/src/director-agent.ts`

## 10. Changelog

- 2026-07-04 — v1.0 released. Authored after 2026-06-20 federation ID audit.
  Pre-flight, classification-first ingest, role-keyed committee quora,
  substitute-driven escalation, per-class federation gate short-circuits,
  deliberate preservation of DACC-v1 and existing federation gate ordering.

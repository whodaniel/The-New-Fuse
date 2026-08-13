`[CLASS:INTEL] [STATUS:PENDING]`

# Authority Layer — Integration Map & Sequencing

Findings from a read-only sweep on 2026-07-24, mapping what the authority stack
(Phases 0–4a, branch `fix/a2a-signature-verification`) still needs before it is
load-bearing, and how it relates to systems that already exist. No changes were
made to any launcher or running process during this sweep.

---

## 1. The core finding: the authority stack is wired but not yet LOAD-BEARING

The Phase 0 message-auth layer is wired into `RedisAgentClient`
(`scripts/tnf-agent-cli.cjs`), which the worker wrappers route through — so
signature verification applies to live agent traffic today (default
`TNF_MESSAGE_AUTH_MODE=warn`).

**Phases 1–4a are wired at the shared chokepoint but default-off.**
`RedisAgentClient.handleIncomingMessage` → `gateAndDispatch` →
`tnf-wrapper-authority.gateTask` holds tasks that declare authority-shaped
`requiredCapabilities` (`{ with, can }`) when
`TNF_AUTHORITY_CONSUMER=1|true|on`. Unset, the gate is a cheap sync skip — fleet
behaviour unchanged. The stack is therefore **consumed in code** and **not
load-bearing in production** until an operator opts in _after_ isolation is
proven.

**Consequence for the trust-root migration:** isolating agents to the
`tnf-agent` uid is what makes elevation/grants a real boundary (agents cannot
read the operator key). Enabling the consumer flag while workers still share uid
501 would exercise the path under a degraded root — defence-in-depth only.
**Order source of truth:**
[`AUTHORITY_TURNUP_RUNBOOK.md`](./AUTHORITY_TURNUP_RUNBOOK.md) (C2 relaunch → C3
confirm-isolation → C4 pilot flag). See also
`docs/protocols/reports/AUTHORITY_COHERENCE_AUDIT_2026-07-24.md`.

---

## 2. Launcher map — who runs what, and who should migrate

The instinct "move all launchers to `tnf-agent`" is wrong. The fleet splits into
two classes with opposite requirements.

### Operator-side — MUST stay uid 501 (needs the operator key to sign)

These legitimately hold operator authority; running them as `tnf-agent` would
break signing and self-updating:

- **34 cron entries** running `scripts/protocols/run-chronological-process.cjs`
  (heartbeats, audits, handoff generation, self-improvement, attribution). These
  write `LIVING_STATE`, emit handoffs, and would sign grants under the future
  design.
- `turn-end.cjs`, the review console (`tnf-authority review`), and any
  `confirm-isolation` run — these ARE the operator.
- `com.danielgoldberg.agentrelationship.autopilot.plist` (active launchd).

### Worker-side — SHOULD migrate to uid 442 (untrusted; would hold grants)

These are the untrusted LLM workers that, once integration lands, will _request_
grants and call the broker — the processes the boundary exists to contain:

- `scripts/gemini-redis-wrapper.cjs`, `jules-redis-wrapper.cjs`,
  `claude-redis-wrapper.cjs`, `antigravity-redis-wrapper.cjs`
- `pi` worker wrappers
- browser/extension page agents (already sandboxed by the browser, but their
  Node-side bridge counts)

### Currently running (uid 501), for reference

- Two `dist/master-clock.js` instances (pids 18110, 31580) — the "master-clock
  herd" LIVING_STATE flags for an operator-gated cull. Master Clock is
  orchestration authority; classify it operator-side.
- Antigravity IDE.
- No pi/jules/gemini worker currently live at sweep time.

---

## 3. Relationship to the EXISTING `agentApiGrants` system

`apps/api/src/services/agent-api-grants.service.ts` +
`packages/database/src/drizzle/schema/configuration.ts` (`agent_api_grants`,
`agent_api_grant_usage`) already implement a grant system — predating this work.
It is **not a duplicate**; it is the same idea at a different trust boundary:

|          | `agentApiGrants` (exists)           | `tnf-cred-broker` (Phase 4a)      |
| -------- | ----------------------------------- | --------------------------------- |
| Boundary | Server / hosted gateway             | Local machine                     |
| Storage  | Postgres, JWT bearer                | OS keystore, UCAN grant           |
| Guards   | LLM **provider** API access         | any local secret / account        |
| Limits   | rate, daily tokens, USD cap, revoke | TTL, task-bind, single-use, scrub |
| Home     | proprietary control plane           | open runtime                      |

**Reconciliation (design note, not built):** both should conform to the
`CredentialBroker` contract in `packages/control-plane-contracts`. The UCAN
capability grammar should be able to express `agentApiGrants`' limits
(`maxRequestsPerMinute`, `dailyTokenBudget`, `monthlyUsdCap`) as attenuation
conditions, so a single grant vocabulary spans both. The hosted service becomes
the `remote-attestation`/hosted implementation; the local broker is the
open-runtime one. This is the natural place for the SaaS/open split to land.

---

## 4. Recommended sequencing

**Library + chokepoint wiring is DONE (2026-07-24).** Remaining work is operator
turn-up order (do not invert):

1. **DONE — library:** `scripts/lib/tnf-authority-client.cjs`
   (`requestElevation → awaitGrant → verifyHeldGrant → useCredential`, plus
   `withElevation`). E2e test covers approve → verify → spend; secret never
   reaches the agent.
2. **DONE — wrapper chokepoint:** `RedisAgentClient.handleIncomingMessage` →
   `gateAndDispatch` → `tnf-wrapper-authority.gateTask` for every Redis-driven
   wrapper. DEFAULT-OFF via `TNF_AUTHORITY_CONSUMER`. Centralized gate
   supersedes the earlier gemini-only hook.
3. **NEXT — migrate pilot worker to `tnf-agent`**
   (`tnf authority relaunch-workers`), then **`tnf authority confirm-isolation`
   as the normal user** (never `sudo tnf authority …`). Strong `separate-uid`
   only when denial works and no uid-501 worker stragglers remain.
4. **THEN — enable `TNF_AUTHORITY_CONSUMER=1` on that pilot unit only**;
   exercise approve/deny/plain-task via `tnf authority review`.
5. **Fan out** remaining workers one by one (isolate → confirm → flag each).
6. **Deferred:** reconcile `agentApiGrants` → `CredentialBroker` contract
   (SaaS/open convergence — not turn-up).
7. Operator-side launchers (cron, turn-end, review) stay uid 501 throughout.

Enabling the consumer before isolation is safe only as a lab exercise; it is
**not** load-bearing under a degraded root. Isolation-then-flag is what turns
the wired stack into a real boundary.

**Operator turn-up checklist** (encryption migration → TNF launcher relaunch →
confirm-isolation → flag → fan out): see
[`AUTHORITY_TURNUP_RUNBOOK.md`](./AUTHORITY_TURNUP_RUNBOOK.md).

**2026-07-24 afternoon update:** TNF launcher now drops to `tnf-agent`;
`tnf authority workers|relaunch-workers` added; sudo false-pass on
confirm-isolation fixed (SUDO_UID + live straggler re-check). Account exists;
workers still on 501 — isolation not load-bearing yet.

---

## 5. Explicitly out of scope of the original sweep (2026-07-24 morning)

- No launcher was modified _during the morning read-only sweep_; afternoon
  turn-up later changed `scripts/runtime/launch-agent-wrapper.sh`.
- The master-clock herd cull remains operator-gated (LIVING_STATE P0).
- Credential rotation was operator-reported complete the same day.

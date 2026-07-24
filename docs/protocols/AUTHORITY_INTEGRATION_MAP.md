`[CLASS:INTEL] [STATUS:PENDING]`

# Authority Layer — Integration Map & Sequencing

Findings from a read-only sweep on 2026-07-24, mapping what the authority stack
(Phases 0–4a, branch `fix/a2a-signature-verification`) still needs before it is
load-bearing, and how it relates to systems that already exist. No changes were
made to any launcher or running process during this sweep.

---

## 1. The core finding: the authority stack is built but not yet CONSUMED

The Phase 0 message-auth layer is wired into `RedisAgentClient`
(`scripts/tnf-agent-cli.cjs`), which the worker wrappers route through — so
signature verification applies to live agent traffic today.

**Everything above Phase 0 is not yet called by any agent.** A repo-wide grep
for consumers of `tnf-capability-grant`, `tnf-elevation-broker`,
`tnf-cred-broker`, and `tnf-trust-root` (excluding the modules, their tests, and
the CLI) returns nothing. The grant/elevation/broker system is complete and
tested, but no wrapper requests a grant, verifies one, or calls the broker.

**Consequence for the trust-root migration:** isolating agents to the
`tnf-agent` uid gives defence-in-depth (they can't read the operator key), but
nothing yet *depends* on that isolation, because no agent holds a grant that the
key protects. Migration and integration are coupled; doing the migration first
is safe but not yet meaningful on its own.

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

These are the untrusted LLM workers that, once integration lands, will *request*
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

| | `agentApiGrants` (exists) | `tnf-cred-broker` (Phase 4a) |
| --- | --- | --- |
| Boundary | Server / hosted gateway | Local machine |
| Storage | Postgres, JWT bearer | OS keystore, UCAN grant |
| Guards | LLM **provider** API access | any local secret / account |
| Limits | rate, daily tokens, USD cap, revoke | TTL, task-bind, single-use, scrub |
| Home | proprietary control plane | open runtime |

**Reconciliation (design note, not built):** both should conform to the
`CredentialBroker` contract in `packages/control-plane-contracts`. The UCAN
capability grammar should be able to express `agentApiGrants`' limits
(`maxRequestsPerMinute`, `dailyTokenBudget`, `monthlyUsdCap`) as attenuation
conditions, so a single grant vocabulary spans both. The hosted service becomes
the `remote-attestation`/hosted implementation; the local broker is the
open-runtime one. This is the natural place for the SaaS/open split to land.

---

## 4. Recommended sequencing

1. **Integrate the authority stack into ONE worker wrapper end to end** (e.g.
   gemini-redis-wrapper): request a grant, verify it, call the broker for a
   read-only action. This makes the isolation boundary meaningful and validates
   the contracts against a real consumer before fanning out.
2. **Then migrate that wrapper's launcher to `tnf-agent`** and run
   `tnf-authority confirm-isolation`. Now the trust root is genuinely
   non-degraded for a real workload.
3. **Reconcile `agentApiGrants` to the `CredentialBroker` contract** so the
   hosted and local paths share one grant vocabulary.
4. **Fan out** to the remaining worker wrappers.
5. Operator-side launchers (cron, turn-end, review) stay uid 501 throughout.

Migrating launchers before step 1 is safe but buys only defence-in-depth. Wiring
a consumer first is what turns the whole stack from tested-in-isolation into
load-bearing.

---

## 5. Explicitly out of scope of this sweep

- No launcher was modified; no process migrated, killed, or restarted.
- The master-clock herd cull remains operator-gated (LIVING_STATE P0).
- Credential rotation remains operator-only and outstanding.

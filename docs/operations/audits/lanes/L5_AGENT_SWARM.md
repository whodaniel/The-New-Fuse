# L5 — Agent Swarm / Registry Lane Receipt

**Issued**: 2026-08-09T21:25:00-04:00  
**Lane**: L5 Agent Swarm / Registry  
**Embodiment**: Local Sub-Director / fleet-coordinator  
**Mandate**: `docs/operations/audits/FULL_ENCHILADA_HARNESS_PLATFORM_AUDIT_MANDATE_2026-08-09.md`  
**Mode**: REPORT ONLY (live inspect; no remediation applied)  
**Repo**: `/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse`

---

## Executive verdict (L5)

The live swarm is **registry-polluted and operationally hollow**. `tnf list` is dominated by offline **`tnf-thin-client` zombies** (~933/954 ≈ **97.8%**). Durable workers (`hermes-codegen` / `hermes-infra`) remain registered **active** but **fail every cron cycle**. Lane coordination exists as terminal polling + wake pings, not as a trustworthy callable swarm. Federated fleet **establish receipt green** ≠ swarm that can accept work.

---

## Method (live evidence)

| Probe | Result snapshot |
|------|-----------------|
| `redis-cli HLEN`/`HKEYS tnf:agent-registry` | **954** entries; **933** name `tnf-thin-client`; **23** other |
| `./tnf list --no-splash` | ~4783 lines; near-wall of 🔴 offline thin-clients |
| Thin payload sample | `status:"offline"`, unique ids `agent_tnf-thin-client_<ms>`, `routing.callableWorker:true` |
| Crontab workers | codegen `*/5`, infra `*/15` → outcome **error** `envelope parse: Expecting value` every cycle; scripts **`exit 0`** anyway |
| Autopilot latest | `status: degraded`; reasons include `local-subdirector status is critical` |
| Local-subdirector heartbeat | `status: critical`; stall/wake activity against Terminal TTYs |
| Relay-monitor | continuous `tnf-thin-client` online→offline; SELF_PROMPT stalls for AGENT-67/68 |
| `tnf fleet core-status` | registers workers + director as **[ok]** |
| Fleet deployment manifest | dated **2026-06-20**, stale vs current NFT actor |

---

## Registry composition (live)

| Class | Count | Typical status |
|------|------:|----------------|
| `tnf-thin-client_*` | 933 | offline |
| Durable / named (non-thin) | 23 | mostly `active` (stale-active likely) |
| Examples non-thin | `tnf-local-subdirector`, `agent_hermes-codegen-worker_1782364000001`, `agent_hermes-infra-worker_1782364000002`, `agent:hermes-bridge`, duplicate `claude`/`gemini`/`jules`/`antigravity`/`model-watchdog`, `BROKER-*`, offline `agent:tnf-core` | |

**Thin-client root cause**: `scripts/lib/redis-agent-client.cjs` defaults `AGENT_NAME` → **`tnf-thin-client`** and calls `register()` when bus identity missing. Short-lived helpers (e.g. swarm-context-bridge) register→disconnect without HDEL / GC → zombies accumulate; each gets a **new** registry id (timestamp suffix).

**No offline GC**: CLI has report/session prune; **no** `tnf list --prune-offline` / registry TTL observed in use.

---

## What makes sense (keep)

1. **Stable agent IDs** for subdirector workers (`...4000001` / `...4000002`) refreshed by cron — correct pattern.  
2. **`tnf:agent-registry` Redis hash** as live bus SOT (vs filesystem agent cards).  
3. **Capability routing flags** on registry payloads (`callableWorker`, `directorPoolEligible`).  
4. **Subdirector worker cycle scripts** with fleet-pause gate + direct queue `tnf:direct:sub-director:<id>`.  
5. **Local-subdirector as terminal lane observer** (AppleScript sessions) — useful for human/agent TTY coordination when healthy.

---

## Findings (severity · evidence · impact · fix · owner)

### P0 — Thin-client zombie swamp makes `tnf list` unusable

- **Evidence**: 933/954 registry keys are offline `tnf-thin-client`; `tnf list` dumps thousands of lines; relay logs alternate `Agent tnf-thin-client is now online` / `going offline` continuously. Sample payload: offline worker with `callableWorker:true`.
- **Impact**: Operators cannot see real swarm; directors may route to zombies; Redis noise + relay noise; `harness inspect` still claims “All agents registered” (L2 false green).
- **Recommended fix**: (1) stop default name—require explicit `AGENT_NAME` or use ephemeral mode that never HSETs; (2) register with stable id + upsert; (3) add `tnf registry prune --offline --name tnf-thin-client` + TTL; (4) gate `callableWorker` off for ephemeral clients.
- **Owner**: L5 Registry + L2 (shim) + L3 CLI

### P0 — Secrets embedded in local-subdirector heartbeat state

- **Evidence**: `~/.tnf/local-subdirector/state/local-subdirector-heartbeat.json` includes full **PEM private key material** under `config.signingPrivateKeyPem` / `encryptionPrivateKeyPem` (live file read during audit; values **not copied** into this receipt).
- **Impact**: Any process/user that can read `~/.tnf` gets NFT signing/encryption keys; logs/backups/growth-audit risk exfiltration.
- **Recommended fix**: Redact keys from heartbeat snapshots (paths-only); chmod tighten; rotate keys if this file was synced/shared; add secret-scan gate for `~/.tnf/**/*.json`.
- **Owner**: L1 Authority + L5 + L7

### P1 — Subdirector workers fail every cycle; cron exit code lies

- **Evidence**: codegen/infra cron logs:
  ```json
  {"outcome":"error","error":"envelope parse: Expecting value: line 2 column 1 (char 1)"}
  ```
  with `queue_len=0` and `cycle closed rc=1`, but wrappers end with **`exit 0`** (`scripts/agents/subdirector-{codegen,infra}-worker-cycle.sh`). Fleet establish still lists workers as `[ok]`.
- **Impact**: Chronological jobs look successful; no alert; swarm cannot execute queued work even when envelopes appear; empty-queue still errors (runner bug).
- **Recommended fix**: Propagate `run_one_envelope.py` rc; treat empty queue as success `noop`; alert on N consecutive outcomes=error; surface last worker outcome in `fleet core-status`.
- **Owner**: L5 Workers + L0

### P1 — Stale “active” embodiment duplicates (interop wrappers)

- **Evidence**: Non-thin registry shows multiple `active` rows for same platform lineages (`claude`×2, `gemini`×2, `jules`×2, `antigravity`×2, `model-watchdog`×2) with old numeric suffixes (`178101…` vs `178111…`) alongside bridges/brokers.
- **Impact**: Ambiguous who holds channel authority; duplicate embodiment breaks “one agent one role” mental model.
- **Recommended fix**: Embodiment policy: one live row per `(name,platform)` with lastSeen heartbeat; demote predecessors to offline/archived; align with `docs/protocols/TNF_AGENT_ROSTER_CLEANUP.md` (PENDING in doctor).
- **Owner**: L5 + L4

### P1 — Lane coordination ≠ federated work dispatch

- **Evidence**: Local-subdirector cycles observe Terminal TTYs (claude/pi/node/…); emits wake pings (e.g. ttys001 `wakePingCount: 276`). Autopilot wants `restart-local-subdirector-service` + notes owner terminal not observed. Fleet manifest (Jun 20) still lists understudies/workers that may not match live PIDs. Cloud Super Director deferred.
- **Impact**: “Fleet” is terminal babysitting + Redis presence, not a reliable multi-agent task graph. Federated establish marketing overshoots local island reality.
- **Recommended fix**: Split status: `coordination.lanes` (TTY) vs `dispatch.workers` (queue drain health) vs `federation.cloud` (bridge). Do not mark core fleet ok unless worker last-outcome green.
- **Owner**: L0 + L5

### P1 — Autopilot history unbounded → contributes to disk P0

- **Evidence**: `subdirector-autopilot-history.jsonl` ≈ **152MB**; KeepAlive 30s loop; ENOSPC on lock/latest under disk pressure.
- **Impact**: Swarm governor fills disk that zombies also pressure; death spiral.
- **Recommended fix**: Cap/rotate history (size + age); sample degraded cycles; pause autopilot on ENOSPC.
- **Owner**: L5 Autopilot + L7

### P2 — Stall self-prompts for anonymous AGENT-N / tauri nodes

- **Evidence**: Relay: ORCHESTRATOR SELF_PROMPT for `AGENT-67` / `AGENT-68` (idleSeconds 2814 / 1095) targeting `tauri-node-*` sources.
- **Impact**: Bus spam; no human-meaningful identity; implies UI nodes register without durable agent cards.
- **Recommended fix**: Map tauri nodes to stable agent ids or exclude from stall probing; name agents before joining General.
- **Owner**: L5 + L6

### P2 — Relay-monitor JSON parse / A2A auth gaps

- **Evidence**: stderr: `Error parsing message: Expected ',' or '}'...`; `[tnf-message-auth] WARN: A2A_SECRET_KEY is not set`.
- **Impact**: Corrupt or mixed bus payloads drop; auth effectively optional.
- **Recommended fix**: Harden parse (skip/metric); require A2A secret in living env for register path.
- **Owner**: L4 + L5

### P3 — `tnf list` has no summary / filters

- **Evidence**: Full dump only; no `--active`, `--name`, `--role`, `--json-summary` observed in operator path used tonight.
- **Impact**: Even after GC, CLI remains hostile for large fleets.
- **Recommended fix**: Default to summary table + top N; full dump behind `--all`.
- **Owner**: L3 + L5

---

## Worker cron matrix

| Job | Cadence | Registry id | Live outcome | Cron exit |
|-----|---------|-------------|--------------|-----------|
| `subdirector-codegen-worker-cycle.sh` | `*/5` | `agent_hermes-codegen-worker_1782364000001` | envelope parse **error** (empty queue) | forced **0** |
| `subdirector-infra-worker-cycle.sh` | `*/15` | `agent_hermes-infra-worker_1782364000002` | same | forced **0** |
| terminal-heartbeat-pulse | `* * * * *` | n/a | skipped-safe-mode | n/a |

Logs: `~/.tnf/poll-jobs/tnf-subdirector-{codegen,infra}-worker/cron.log`

---

## Federated establish vs operating reality

| Claim (`tnf fleet core-status`) | Reality |
|----------------------------------|---------|
| `[ok] redis` | Redis up; registry bloated |
| `[ok] worker:codegen/infra crons` | Crons fire; **every run errors**; exit masked |
| `[ok] register: workers + director` | Registered; workers not productively draining; thin zombies ≫ real agents |
| `[ok] sync launchd subdirector/heartbeat` | Processes running; subdirector **critical**, autopilot **degraded** |
| NFT / identity ok | Local identity present; **cloud Super Director deferred** |

**Verdict**: Establish proves **wiring**. It does **not** prove **swarm capacity**.

---

## Confusing overlaps (L5 viewpoint)

| Role idea | Competing embodiments |
|-----------|----------------------|
| Sub-Director | `tnf-local-subdirector` launchd · autopilot KeepAlive · stale Jun fleet-deployment-manifest · Cursor/Codex understudy names |
| Worker | hermes cron workers · default `tnf-thin-client` shim · callableWorker zombies |
| Bridge | `agent:hermes-bridge` · `tnf bridge` (not running per alive) · redis-ws-bridge launchd |
| Orchestrator | ORCHESTRATOR-* on bus · `tnf orchestrate` · full-auto / self-improvement loops |

---

## Recommended user flow (swarm slice)

1. `redis-cli HKEYS tnf:agent-registry | count by prefix` or future `tnf list --summary`  
2. Prune thin zombies before trusting dispatch  
3. Check worker cron **outcome JSON**, not just crontab presence  
4. Confirm local-subdirector status ≠ critical  
5. Only then assign lane work / envelopes  

---

## Conflicts with other lanes

- **vs L2**: `harness inspect` PASS + `agents.registration` vs zombie swamp + critical subdirector.  
- **vs L0**: `fleet core-status ok=true` vs workers erroring + degraded autopilot.  
- **vs L1**: Private keys in heartbeat state violate authority/isolation expectations.  
- **vs L7**: Autopilot history + zombie growth are disk villains.

---

## Evidence artifacts captured

- `/tmp/tnf-audit-l2l5/list.txt` (4783 lines)  
- `/tmp/tnf-audit-l2l5/fleet-core.txt`  
- Redis: `tnf:agent-registry` HKEYS counts (933 thin / 23 other / 954 total)  
- Cron logs: `~/.tnf/poll-jobs/tnf-subdirector-*-worker/cron.log`  
- `~/.tnf/subdirector-autopilot/state/subdirector-autopilot-latest.json`  
- `~/.tnf/local-subdirector/state/local-subdirector-heartbeat.json` (**contains secrets — do not publish raw**)  
- `~/.tnf/local-subdirector/state/fleet-deployment-manifest.json` (stale 2026-06-20)  
- Relay stderr/stdout: thin-client churn + AGENT-67/68 stalls

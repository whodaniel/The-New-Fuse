# FULL ENCHILADA — Federated Harness & Platform Audit Report

**Date**: 2026-08-09 (evidence window ~2026-08-10T01:16Z–01:26Z)  
**Authority**: Local Sub-Director (`tnf-local-subdirector`, NFT
`local-oss-5cf0356cd5d96efe`)  
**Repo**: `<TNF_ROOT>`  
**Branch / HEAD**: `fix/honest-failure-reporting` @
`8a762b98d0018f93bc2b313382b36e615387064b` (5 ahead of origin at audit)  
**Mandate**: `docs/operations/audits/FULL_ENCHILADA_HARNESS_PLATFORM_AUDIT_MANDATE_2026-08-09.md`  
**Mode**:
REPORT ONLY — no refactors implemented  
**Lane receipts**: `docs/operations/audits/lanes/L0_SUB_DIRECTOR.md` …
`L7_STATE_GROWTH_OPS.md`  
**Baselines**: `docs/operations/audits/baselines/{LIVE_BASELINE,QUICK_EVIDENCE,ORCHESTRATE_GOAL}_2026-08-09.txt`

---

## Executive Verdict

TNF’s **architecture story is coherent**; its **operating truth is not**.

The platform correctly separates (1) protocol rails (Turn Zero / handoff JSON),
(2) fleet endowment (`fleet establish` + Local Sub-Director NFT identity), (3)
persistence (`alive`), (4) operator cockpit (`forefront`), and (5) foreign-CLI
routing (brand passthroughs + parity ledger). That decomposition **makes sense**
and should be doubled down.

Live evidence shows **establish ≠ healthy operate**:

- `tnf fleet core-status` → **ok=true**
- `tnf harness inspect` → **Overall: PASS**
- Preflight Turn Zero → **ALL PROTOCOLS PASSED**
- Then `tnf protocol gate` (ci) → **exit 1** (`session-handoff-gate BLOCKED`)
- Autopilot → **`status: degraded`**, `localSubdirectorStatus: critical`
- Disk → **~96–100% full** (~748 MiB free) with **~77k** top-level `~/.tnf`
  entries
- Registry → **~933/954** 🔴 `tnf-thin-client` zombies (and/or Redis churn of
  the same class)
- Secrets → PEM material in Sub-Director heartbeat JSON (flagged; scrub
  required)
- Workers → codegen/infra crons error (envelope parse) but **`exit 0`** while
  establish stays `[ok]`
- Interop → MCP **three-way SOT**, A2A bridge **ONLINE from June-stale Redis**,
  process **not running**

**Operator clarity verdict:** Prefer autopilot + process + disk + tip SHA over
any single green badge. Treat “PASS / ok / ONLINE / SYNCHRONIZED” as **necessary
ceremony**, not sufficient health.

**Cynefin:** Complex (dual SOTs, emergent false greens). **Primary P0 class:**
truthful status + disk retention + baton integrity.

---

## Keep (What Makes Sense)

1. **Local Sub-Director endowment** — `~/.tnf/agent.yaml` +
   `tnf fleet establish` / `core-fleet-latest.json` as the install/bootstrap
   receipt (NFT `local-oss-5cf0356cd5d96efe`).
2. **Turn Zero file authority** — `docs/protocols/TURN_ZERO_MANDATE.md` wins;
   `[turn-zero-authority] OK` on live gate.
3. **Structured session handoff JSON** — `SESSION_HANDOFF_LATEST.json` schema +
   ACK + next actions (content coherent when tip-aligned).
4. **IAV vocabulary** — `tnf harness inspect|cycle|loop` as deliberate
   Inspect→Act→Verify.
5. **`tnf alive` stack arm** — clear up/status/down for daemon + self-wake cron.
6. **Curated `tnf menu` + Forefront Ops** — right idea: hide ~444 paths behind a
   short face (L3).
7. **`tnf forefront` as compose cockpit** — onboard → harness → cursor harness →
   local UI → `#/browser` + receipt (L6).
8. **Brand passthroughs with MCP env** — `tnf cursor|claude|pi` injecting
   `data/mcp.clients/*.mcp.json` (L4).
9. **`tnf parity` ledger loop** — audit/status/gaps under
   `docs/operations/parity/` once scoring is de-noised.
10. **`tnf growth-audit` invent posture** — read-only inventory + snapshot
    (extend thresholds; don’t replace).
11. **Orthogonal role axes** — DACC baton ≠ crypto seat ≠ platform
    (ROLE_DEFINITIONS / D23 warning) — design-correct if findable.

---

## Missing

| Gap                                                        | Evidence                                                                         | Blocks                    |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------- |
| Unified gate verdict                                       | Preflight PASS then CI BLOCK on same `tnf protocol gate`                         | Trust in protocol health  |
| Living State single Current Directive slot                 | Append-sludge of handoff UUIDs / heads (L1; `tnf state show`)                    | Cognition after Turn Zero |
| HEAD ↔ handoff tip invariant                               | Handoff SHA `1703dea…` vs live HEAD `8a762b…` (+2) while `[STATUS:SYNCHRONIZED]` | Continuity baton          |
| Authority Crosswalk                                        | DACC × crypto seats × Sub/Super Director × handoff.owner=`tnf-orchestrator`      | Who may command whom      |
| MCP single SOT + absolute `cwd`                            | `~/.tnf/mcp.json` ≠ `~/.config/tnf/mcp/mcp.json` ≠ `data/mcp.clients/*`          | Interop coherence         |
| Honest A2A bridge status                                   | Redis `isOnline` since 2026-06-10; no process; `tnf alive` says not running      | Hermes↔TNF bus            |
| Real `assimilate link` or honest demotion                  | `AssimilationService.linkProvider` print-only                                    | Onboarding lie            |
| Fleet & Alive on curated menu                              | Menu omits `fleet`/`alive`/`growth-audit` (L3)                                   | Day-1 lifecycle           |
| Disk/inode retention for swarm-context + autopilot history | 76,901 `swarm-context-*.md`; 151 MiB autopilot jsonl; retention blind            | ENOSPC, hung `ls`         |
| Capacity%-aware growth severity                            | 96% full still severity `ok`                                                     | Silent near-full          |
| Lock/pid GC + state `running` truth                        | 18/21 locks dead PIDs; lying Hermes “running”                                    | Integrity                 |
| Thin-client TTL / `--alive-only`                           | 900+ 🔴 thin-clients; inspect still “All agents registered”                      | Swarm readability         |
| Autopilot surface in `alive`/`core-status`                 | launchd up + autopilot critical                                                  | Establish≠operate         |
| `agy` in parity + MCP export                               | Gemini successor invisible to parity roster                                      | Interop parity            |
| State-governor cycle artifacts                             | Missing `~/.tnf/snapshots` / retention/lock reports                              | Ops hygiene loop          |

---

## Confusing

1. **Dual PASS/FAIL on one protocol gate** — ceremony green, change-set red (L1
   P0-1).
2. **“SYNCHRONIZED” with append corruption + SHA lag** (L1 P0-2/3).
3. **Three+ authority languages** — DACC director/orchestrator, crypto
   sub/super-director, live Local Sub-Director, crypto CLI `tnf authority`,
   PROTOCOL_MAP “Authority: Sub-Director Swarm…” (L1).
4. **Four “boot the stack” verbs** — `boot` / `alive` / `fleet establish` /
   `forefront` / `harness boot` without primary matrix (L3/L6).
5. **core-fleet `ok` vs autopilot `degraded` vs fleet-status `critical`** —
   triple SOT (L7/L0).
6. **`browser` vs `browser-control` vs `#/browser` vs `dashboard`/`computer-use`
   aliases** (L3/L6).
7. **`agent` vs `agents` dual trees** (L3).
8. **Bridge ONLINE vs process absent vs alive “not running”** (L4 vs L2).
9. **OpenClaw** — broken PATH symlink + parity “not installed” + control-plane
   instance dirs (L4).
10. **Procedural Disclosure “75 flags”** = STATUS listing, not failures (L1).
11. **`tnf list` / inspect green registration** ≠ usable swarm (L5).
12. **Growth-audit severity `ok` at 96% capacity** (L7).

---

## Refactor Candidates (report-only; do not implement in this pass)

1. **Living State emit** — replace Current Directive slot; history under
   `## History` only; stop concat into directive line. (L1)
2. **`tnf protocol gate` phases** — discovery → mutate-detect → CI block;
   **one** end verdict; no premature “ALL PROTOCOLS PASSED”. (L1)
3. **Harness inspect fail-closed** — disk free, zombie ratio,
   autopilot≠degraded/critical, launchd last-exit. (L2)
4. **MCP unify** — canonical `data/mcp_config.json` → sync both home configs;
   absolute `cwd=repoRoot` on exports. (L4)
5. **Bridge status** — process AND TTL heartbeat; purge stale `isOnline`. (L4)
6. **Assimilate** — implement routes table **or** demote menu copy; unify
   `assimilate run` with passthrough MCP. (L4)
7. **Menu Day-1 strip** — Fleet & Alive + growth-audit; demote taxonomy/hooks
   density. (L3)
8. **Retention** — cap/prune `swarm-context-*`; rotate autopilot history +
   authority audit; extend `swarm-disk-retention.sh`. (L7)
9. **Growth-audit severity** — warn if free &lt;2 GB **or** capacity ≥95%; add
   inode/file-count. (L7)
10. **Thin-client policy** — TTL + unique name; `tnf list --alive-only`. (L5)
11. **Authority Crosswalk doc** — Sub-Director owned; Super Director ratifies;
    Orchestrator = master-clock only. (L0/L1)
12. **Orchestrate goal classifier** — refuse mutate workflows for `audit` /
    `report-only` goals (observed false SUCCESS → refactoring triage). (L5/L0)
13. **Defer** — cli.ts ocean split (Stages 0→3 already scoped); merging
    browser-control into local-ui; deleting Hermes aliases.

---

## Best User Flow (step-by-step)

Canonical operator path (aligns L0 + L3 + L6 + L7 checkpoints). Prefer these
verbs; treat others as advanced.

| Step                           | Intent                                    | Commands / Verify                                                                                                                 |
| ------------------------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| 1. Onboard                     | Protocol + frontload integrity            | `tnf onboard` (repair if needed)                                                                                                  |
| 2. Establish fleet             | Endow Local Sub-Director + core OSS wires | `tnf fleet establish` → read `~/.tnf/core-fleet-latest.json` (`ok`) **and** `~/.tnf/agent.yaml`                                   |
| 3. Alive                       | Persistent daemon + sentinel              | `tnf alive up` → `tnf alive status` (daemon running; note bridge separately)                                                      |
| 4. Autopilot / substrate truth | Don’t trust establish alone               | Read `~/.tnf/subdirector-autopilot/state/subdirector-autopilot-latest.json` — **require** not `degraded`/`critical` for “healthy” |
| 5. Disk / inode hygiene        | Before long autonomy                      | `tnf growth-audit`; treat capacity ≥95% or free &lt;2 GB as **action**; prefer python `scandir` over `ls ~/.tnf`                  |
| 6. Forefront                   | Operator cockpit                          | `tnf forefront` → `tnf forefront status` (receipt + `uiUrl`)                                                                      |
| 7. Harness IAV                 | Deliberate turn                           | `tnf harness inspect` then `tnf harness cycle` (or `loop --task …`) — **distrust PASS if disk/autopilot bad**                     |
| 8. Protocol / baton            | Tip truth                                 | `tnf state show`; confirm handoff `head_sha == HEAD`; if drift, emit handoff **deliberately** (not mid-audit)                     |
| 9. Interop (optional)          | Wire foreign CLIs                         | `tnf mcp sync --from repo` → `tnf mcp generate` → prefer `tnf cursor                                                              | claude | pi …`over stub`assimilate link`; `tnf bridge start`only if process+fresh`lastSeen` |
| 10. Audit                      | Inventory + doctor                        | `tnf growth-audit` + `tnf doctor` + targeted lane audits                                                                          |
| 11. Act                        | One owner per task                        | Sub-Director assigns lane; **no** orchestrate refactor patterns for report-only goals                                             |
| 12. Verify                     | Close the loop                            | Re-check alive + autopilot + inspect + forefront status + growth snapshot; `tnf turn-end`                                         |

**Fallbacks:** `tnf local-ui` (UI restart), `tnf browser-control` (panel-only),
`tnf tui --autonomous` (headless agent), `tnf browser …` (agent page automation
— not browser-control).

---

## Prioritized Backlog

### P0

| ID   | Item                                                                                   | Owner | Evidence                                                                                |
| ---- | -------------------------------------------------------------------------------------- | ----- | --------------------------------------------------------------------------------------- |
| P0-A | Reclaim disk / stop swarm-context history flood; rotate autopilot history              | L7/L2 | 76,901 files; ENOSPC in autopilot/heartbeat logs; ~748 MiB free                         |
| P0-B | Fix protocol gate dual verdict; tip-align Living State / handoff vs HEAD               | L1    | Gate exit 1 after “ALL PROTOCOLS PASSED”; SHA `1703dea`≠`8a762b`; directive sludge      |
| P0-C | Unify MCP SOTs + absolute cwd on client exports                                        | L4    | Three config trees; relative `pnpm exec`                                                |
| P0-D | Honest A2A bridge status (process+TTL) + start or OFFLINE                              | L4/L2 | ONLINE from 2026-06-10 Redis; no process                                                |
| P0-E | Growth-audit severity by capacity% / free GB                                           | L7    | severity `ok` at 96%                                                                    |
| P0-F | Harness inspect fail-closed on disk / critical autopilot / zombie flood                | L2    | inspect PASS while degraded; ~933/954 Redis thin-client zombies                         |
| P0-G | Scrub PEM material from Sub-Director heartbeat JSON; keys only in designated key files | L2/L5 | `~/.tnf/local-subdirector/state/local-subdirector-heartbeat.json` (flagged; not copied) |

### P1

| ID   | Item                                                                                                              | Owner    |
| ---- | ----------------------------------------------------------------------------------------------------------------- | -------- |
| P1-A | Authority Crosswalk + refresh Who-Is-Who seats                                                                    | L0/L1    |
| P1-B | Menu Day-1: Fleet & Alive + growth-audit; boot-verb matrix                                                        | L3       |
| P1-C | Implement or un-advertise `assimilate link`; unify run MCP                                                        | L4/L3    |
| P1-D | Thin-client TTL + `list --alive-only`; stop default register without HDEL; surface autopilot in alive/core-status | L5/L0/L2 |
| P1-E | Lock/pid GC; clear lying `running` state                                                                          | L7/L2    |
| P1-F | Forefront soft preflight `fleetOk` / alive warning                                                                | L6       |
| P1-G | OpenClaw broken symlink repair or control-only docs; parity `agy`                                                 | L4       |
| P1-H | Orchestrate refuse audit→refactor false SUCCESS                                                                   | L0/L5    |
| P1-I | PROTOCOL_MAP regen + STATUS hygiene                                                                               | L1       |
| P1-J | Ops docs vs runtime dump relocation                                                                               | L7       |
| P1-K | Worker crons: non-zero exit on envelope parse; establish must not greenwash `exit 0` failures                     | L2/L5    |

### P2

| ID   | Item                                                                       | Owner |
| ---- | -------------------------------------------------------------------------- | ----- |
| P2-A | Continuity Stack diagram (`alive`→`fleet`→heartbeat→subdirector→full-auto) | L2/L3 |
| P2-B | Alias labeling (canonical first); browser vs browser-control one-liner     | L3/L6 |
| P2-C | `tnf interop status` aggregator                                            | L4    |
| P2-D | Parity scoring de-noise (options vs commands)                              | L4    |
| P2-E | Handoff tip-align check beyond path drift                                  | L1    |
| P2-F | Forefront receipt httpProbe/relay/alive fields                             | L6    |
| P2-G | Naming glossary Tier 0 (Authority/Director/Orchestrator)                   | L1    |
| P2-H | CLI help latency Stage 0 snapshot / silent preflight                       | L3    |

### P3

| ID   | Item                                                   | Owner |
| ---- | ------------------------------------------------------ | ----- |
| P3-A | Ledger STATUS pending vs PRIME usage                   | L1    |
| P3-B | Historical ops headers; empty governor cadence wake-up | L7    |
| P3-C | Taxonomy demotion on default menu                      | L3    |
| P3-D | Keep `#/browser` forefront default; improve in-app nav | L6    |

---

## Conflicts Between Experts

| Conflict                                                                         | Prefer                                                                       | Reject / Downgrade                        |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------- |
| Early L2 “healthy / no thin-client spam / no degradation” vs later L2 + L4/L5/L7 | **Later L2** + autopilot JSON + `tnf list` / Redis zombie counts + disk      | Early greenwash receipt confidence        |
| `harness inspect` PASS vs autopilot critical + disk ENOSPC                       | **Operating truth** (autopilot, df, locks)                                   | Inspect-as-sole-SOT                       |
| Bridge ONLINE (L4 Redis) vs alive “not running”                                  | **Process + TTL**                                                            | Registry `isOnline` alone                 |
| core-fleet `ok` vs autopilot `degraded` vs fleet-status `critical`               | **Rollup required**; autopilot for live cycle; core-fleet for bootstrap only | Picking whichever file is nearby          |
| Menu “assimilate link cursor” vs L4 stub                                         | **L4** (do not claim onboard done)                                           | Menu copy as success                      |
| Handoff owner `tnf-orchestrator` vs live Local Sub-Director audit commander      | **Sub-Director** for federated audit authority; orchestrator = master-clock  | Assuming handoff.owner commands this host |
| Parity “openclaw not installed” vs control-plane instances                       | Document **PATH broken vs instance dirs** dual reality                       | Single boolean                            |
| OpenClaw Who-Is-Who refresh during probe                                         | Note incidental write from `tnf agents who`                                  | Treat as intentional audit mutation       |
| Worker cron `exit 0` vs envelope parse errors every cycle                        | **Log truth** — establish must not treat exit 0 as success                   | Cron green badges                         |
| Secrets “in key files” vs PEM blobs in heartbeat JSON                            | **Key-file-only**; scrub heartbeat state                                     | Accidental secret persistence             |

---

## Live Fleet Snapshot at Audit Time

### Identity

- File: `~/.tnf/agent.yaml`
- `name: tnf-local-subdirector` · `director_tier: sub` ·
  `nft_id: local-oss-5cf0356cd5d96efe`
- Wallet: `0x5cf0356cd5d96efe33394821ffacd84789299a74`
- Cloud Super Director: deferred (no cloud Redis URL) — local-subdirector stdout
  repeats identity ready / interval=30000

### Core fleet (`tnf fleet core-status`)

- Receipt: `~/.tnf/core-fleet-latest.json` · `ok: true` ·
  `generatedAt: 2026-08-10T01:16:46.663Z`
- ok steps: nft-identity, identity, env-hints, sync
  local-subdirector/master-heartbeat, relocate launchd, redis PONG, relay
  healthy, mcp path, service installs, harness-boot, codegen `*/5`, infra
  `*/15`, register director + hermes workers

### Alive (`tnf alive status`)

- Agent daemon: **running** (Python pid ~78730)
- A2A Bridge: **not running**
- Heartbeat self-wake cron: **installed**

### Harness

- `tnf harness inspect`: **Overall PASS** (Turn Zero artifacts, Living State
  “synchronized”, disclosure, agents.registration, live loop via
  nvidia-nemotron-3-ultra, 2 handoff next actions)
- `tnf harness fleet-status`: mode=running, paused=no, updatedAt=(never),
  heartbeat lock=(none), state `~/.tnf/fleet/mode.json`

### Protocol / state

- `tnf state show`: Turn Zero present; handoff `a9924b4e-…` @ `1703dea…`
  (2026-08-09T18:16:11.985Z); MCP servers listed; Living State SYNCHRONIZED with
  **append-sludge** directive; ledger header multi-UUID chain
- `tnf protocol gate`: Turn Zero **passed** (handoff fresh ~7.1h; 1 assimilate
  skip warning) → **ALL PROTOCOLS PASSED** → CI `[session-handoff-gate] BLOCKED`
  → **failed exit 1**
- Live HEAD: `8a762b98d0…` (ahead of handoff SHA; branch 5 ahead of origin)

### Autopilot

- File: `~/.tnf/subdirector-autopilot/state/subdirector-autopilot-latest.json`
- `status: degraded` · reasons include master-heartbeat `cycle-running`,
  **local-subdirector critical**, OpenClaw handoff stale &gt;24h
- Actions suggested: restart master-heartbeat, restart local-subdirector,
  terminal heartbeat pulse, refresh OpenClaw handoff

### Registry / swarm

- `tnf list` / Redis: **~933/954** agents offline `tnf-thin-client` zombies
  (~916 in one sampled dump; ~7 🟢). Named survivors include LLM-Provider-Tester
  (🟢), Project-Planner, BROKER-Green, `tnf-local-subdirector`; stale Hermes
  bridge / TNF Core / model-watchdog (June timestamps)
- Root cause (L5): `redis-agent-client` default `AGENT_NAME=tnf-thin-client`
  register without reliable HDEL/GC
- Live ttys (`tnf agents who`): Claude, Cursor, Hermes, Kilo, Pi, TNF CLI
  present
- Worker crons: codegen/infra envelope-parse failures with deceptive `exit 0`
  (fleet-coordinator L2/L5)
- Security: PEM material in `local-subdirector-heartbeat.json` — **do not
  paste**; scrub to key-file paths only

### Interop (L4 snapshot)

- MCP split-brain confirmed; parity mean ~**38%** / **190** gaps; OpenClaw PATH
  broken symlink; bridge status false ONLINE

### Disk / home (L7)

- `~/.tnf` top-level entries: **~77,108** (mostly `swarm-context-*.md` ≈76,901)
- Volume free ~**748 MiB** / ~**96–100%** capacity
- Autopilot history jsonl ~**152 MiB**; authority audit ~**52 MiB**
- Locks: majority dead PID owners; most pid files stale except agent daemon

### launchctl (sample)

| Label                                                                              | Notes                               |
| ---------------------------------------------------------------------------------- | ----------------------------------- |
| `com.tnf.local-subdirector`                                                        | running (interval exit -15 pattern) |
| `com.tnf.subdirector-autopilot`                                                    | running                             |
| `com.tnf.master-heartbeat`                                                         | present; exit 1 observed            |
| `com.tnf.master-reconciliation`                                                    | not loaded / exit 1                 |
| `com.thenewfuse.redis-tnf-bus`                                                     | exit 1 observed                     |
| `com.thenewfuse.api-local` / `api-gateway` / `browser-control` / `redis-ws-bridge` | present                             |
| `com.thenewfuse.relay-monitor`                                                     | running (-15)                       |
| `com.tnf.voice-beam-watchdog` / `ws-green-blue-bridge`                             | present                             |

### CLI surface

- `tnf paths`: **~448** lines (menu claims ~444 CLI paths + dozens package
  scripts)
- `tnf menu`: curated Agent / Taxonomy / Forefront Ops / Core Ops — **missing**
  curated Fleet & Alive strip
- Help exists for: `assimilate`, `forefront`, `local-ui`, `growth-audit`

### Orchestrate caution

- Baseline notes **FALSE SUCCESS**: natural-language full-audit goal matched
  `tnf-refactoring-triage` without writing synthesis — do not trust goal routing
  for report-only audits.

---

## Synthesis Method Notes

1. Read mandate; confirmed identity `~/.tnf/agent.yaml`.
2. Live CLI: `tnf fleet core-status`, `alive status`, `harness inspect`,
   `harness fleet-status`, `list`, `state show`, `protocol gate` (exit 1),
   `paths | head`, `menu --help`, plus
   `assimilate`/`forefront`/`local-ui`/`growth-audit`/`agents who` helps.
3. Runtime files: core-fleet-latest, autopilot-latest, local-subdirector stdout,
   launchctl, `~/.tnf` entry count.
4. Incorporated lane receipts L1–L7 (and corrected L2) under
   `docs/operations/audits/lanes/`; L0 receipt updated alongside this report.
5. **No refactors applied** under this mandate.

---

## Sign-off

**Local Sub-Director** — `tnf-local-subdirector` / NFT
`local-oss-5cf0356cd5d96efe`  
**Report path**:
`docs/operations/audits/FULL_ENCHILADA_AUDIT_REPORT_2026-08-09.md`  
**Lane receipt**: `docs/operations/audits/lanes/L0_SUB_DIRECTOR.md`

Next gated acts (operator-approved only): disk reclaim + Living State Current
Directive rewrite + tip-align handoff + MCP SOT unify + honest bridge status +
menu Day-1 strip.

# L2 — Harness / Runtime Lane Receipt

**Issued**: 2026-08-09T21:25:00-04:00  
**Lane**: L2 Harness/Runtime  
**Embodiment**: Local Sub-Director / fleet-coordinator  
**Mandate**: `docs/operations/audits/FULL_ENCHILADA_HARNESS_PLATFORM_AUDIT_MANDATE_2026-08-09.md`  
**Mode**:
REPORT ONLY (live inspect; no remediation applied)  
**Repo**: `<TNF_ROOT>`

---

## Executive verdict (L2)

The persistent stack **looks installed** (`tnf alive status`, launchd labels
present, `tnf fleet core-status ok=true`) but **is not coherently healthy**.
Critical disk exhaustion, overlapping wake/loop subsystems, false-green
`harness inspect`, and contradictory heartbeat/fleet status surfaces mean
**establish ≠ operate**.

---

## Method (live evidence)

| Probe                                                                                                                              | Result snapshot                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `./tnf alive status --no-splash`                                                                                                   | Daemon running (Python pid) · A2A bridge **not** running · heartbeat self-wake cron installed |
| `./tnf harness status --no-splash`                                                                                                 | mode=running, paused=no; state file `~/.tnf/fleet/mode.json` referenced but **missing**       |
| `./tnf harness inspect --no-splash`                                                                                                | **Overall: PASS** (protocol + agents.registration + live loop)                                |
| `./tnf fleet core-status --no-splash`                                                                                              | `Core fleet ok=true` @ 2026-08-10T01:16:46Z (identity/redis/relay/workers/launchd all [ok])   |
| `./tnf heartbeat status`                                                                                                           | **unknown command** (only `run` / `install` / `remove`)                                       |
| `launchctl print gui/$(id -u)/com.tnf.{local-subdirector,master-heartbeat,subdirector-autopilot}` + `com.thenewfuse.relay-monitor` | all `state = running`                                                                         |
| `crontab -l`                                                                                                                       | codegen `*/5`, infra `*/15`, terminal-heartbeat pulse `* * * * *`                             |
| `df -h /System/Volumes/Data`                                                                                                       | **~747Mi free, 100% capacity**                                                                |
| Logs under `~/.tnf/{master-heartbeat,subdirector-autopilot,local-subdirector,relay-monitor,terminal-heartbeat}`                    | MODULE_NOT_FOUND (historical), **ENOSPC**, safe-mode skip, thin-client churn                  |

---

## What makes sense (keep)

1. **`tnf alive` as stack arming surface** — clear up/status/down contract for
   daemon + self-wake cron.
2. **`tnf harness inspect|cycle|loop`** — correct IAV (inspect→act→verify)
   vocabulary for a single deliberate turn.
3. **`tnf fleet establish|core-status`** — one receipt for “core OSS fleet
   wired” is the right operator primary after onboard.
4. **launchd KeepAlive/StartInterval split** — local-subdirector +
   master-heartbeat interval jobs + KeepAlive autopilot/relay is a workable
   pattern _if_ disks and modules stay green.
5. **Fleet pause gate** in worker scripts (`scripts/lib/tnf-fleet-mode.sh`) —
   single choke for autonomy pause is good.

---

## Findings (severity · evidence · impact · fix · owner)

### P0 — Data volume effectively full; autonomy loops hit ENOSPC

- **Evidence**: `df` → `/System/Volumes/Data` ~747Mi free / 100%. Autopilot
  stderr:
  `ENOSPC: no space left on device, mkdir '.../subdirector-autopilot/state/loop.lock'`.
  Master-heartbeat stderr: `ENOSPC ... master-heartbeat-latest.json.*.tmp`.
  Autopilot history jsonl ≈ **152MB**; local-subdirector wake-events ≈
  **2.3MB**; repo `dump.rdb` ≈ **26MB**.
- **Impact**: Services appear “running” in launchctl while unable to take locks
  or persist state → silent fail / crash-loop / degraded autonomy. All other L2
  signals become untrustworthy under ENOSPC.
- **Recommended fix**: Immediate disk reclamation (growth-audit + prune giant
  jsonl histories, redis dumps, node caches); add hard fail in launchd wrappers
  when free space < threshold; rotate history with size caps.
- **Owner**: L7 State/Growth + L2 Runtime

### P0 — `harness inspect` false green vs operating reality

- **Evidence**: Live `tnf harness inspect` →
  `agents.registration: All agents registered` + `Overall: PASS`. Concurrently
  Redis `tnf:agent-registry` has **954** keys (**933** `tnf-thin-client` offline
  zombies); `local-subdirector-heartbeat.json` `status: "critical"`; workers
  error every cron; autopilot `status: "degraded"`.
- **Impact**: Operator (and audits) trust PASS and stop digging. False SOT for
  “harness healthy.”
- **Recommended fix**: Inspect must include living runtime gates: disk free,
  launchd last exit, worker last outcome≠error, offline zombie ratio,
  local-subdirector status≠critical. Fail closed if any P0 gate trips.
- **Owner**: L2 Harness + L1 Protocol

### P1 — Overlapping control planes: alive / heartbeat / harness / fleet / full-auto / self-improvement

- **Evidence** (`tnf --help` / subcommand helps):
  - `tnf alive` — daemon + heartbeat sentinel
  - `tnf heartbeat` — self-wake cron (no `status`)
  - `tnf harness` — boot / pause / resume / fleet-status / inspect / loop /
    cycle
  - `tnf fleet` — inventory / establish / core-status / prompt
  - `tnf full-auto` — unattended loops
  - `tnf self-improvement` — deterministic scorecard loop
  - Plus crontab terminal-heartbeat + launchd master-heartbeat +
    subdirector-autopilot
- **Impact**: Operators cannot answer “which process keeps the fleet awake?”
  Without a diagram, wake storms and double-duty loops are inevitable.
- **Recommended fix**: Publish a single **Continuity Stack** doc +
  `tnf paths --role runtime` mapping: _arm_ (`alive`) → _establish_ (`fleet`) →
  _pulse_ (`heartbeat`/`master-heartbeat`) → _direct_
  (`local-subdirector`/`autopilot`) → _improve_
  (`self-improvement`/`full-auto`). Collapse alias docs; make `harness status`
  the one fleet pause+health view.
- **Owner**: L3 CLI/UX + L2

### P1 — Master-heartbeat MODULE_NOT_FOUND / fragile lib sync

- **Evidence**: stderr spam
  `Cannot find module '.../master-heartbeat/lib/tnf-fleet-mode.cjs'`. Module
  **present now** after establish/sync (`ls ~/.tnf/master-heartbeat/lib`
  includes `tnf-fleet-mode.cjs`; latest state `status: cycle-running` cycle
  3495). `fleet core-status` reports `sync:master-heartbeat [ok]`.
- **Impact**: Interval launchd job can fatally fail between syncs;
  `last exit code = 1` observed on launchctl print. Establish receipt stays
  green while pulse is intermittently dead.
- **Recommended fix**: Package heartbeat as a single self-contained install
  (bundled lib or require from repo `scripts/lib` with absolute path);
  healthcheck must fail core-status if last cycle fatal within N minutes.
- **Owner**: L2 Runtime

### P1 — Dual LaunchAgent namespaces + empty fleet-health probe

- **Evidence**: Active `com.tnf.*` vs legacy `com.thenewfuse.*` (relay-monitor
  still `com.thenewfuse`). Disabled siblings of both prefixes litter
  `~/Library/LaunchAgents`. `com.tnf.fleet-health-probe.plist` is **0 bytes**
  (empty file). Protocol `TNF_FLEET_HEALTH_PROBE_PROTOCOL.md` still PENDING in
  doctor baseline.
- **Impact**: Ambiguous which label is SOT; empty plist is a landmine for future
  bootstrap; probe protocol claimed but not installed.
- **Recommended fix**: One label prefix (`com.tnf.*`); purge/rename disabled
  husks; either install a real probe plist or delete the empty stub.
- **Owner**: L0 Sub-Director + L2

### P1 — Terminal heartbeat no-op under safe-mode + broken window-info

- **Evidence**: cron every minute; logs:
  `status=skipped-safe-mode observed=6–7 targeted=0 injections=0` and
  `tnf-window-info --app Terminal --list --screens` → `{"count":0}` / command
  failed. Launchd env sets `TNF_INTERACTIVE_SAFE_MODE=true` while cron sets
  `false` — still skipped.
- **Impact**: Heartbeat “installed” but does not inject prompts; autopilot
  reports `terminalHeartbeatStatus: skipped-safe-mode` and
  `ownerObservedCount: 0`.
- **Recommended fix**: Single SOT for safe-mode; `tnf alive status` /
  `harness status` must surface skip reason; fix `tnf-window-info` or deprecate
  injection path.
- **Owner**: L2 + L6 UX

### P2 — A2A bridge not running while alive claims “persistent stack”

- **Evidence**: `tnf alive status` →
  `A2A Bridge: not running (start with tnf bridge start)`.
- **Impact**: Inter-runtime translation missing; thin clients + wrappers
  partially silent / auth warnings (`A2A_SECRET_KEY is not set`).
- **Recommended fix**: Wire bridge into `alive up` optionally, or drop bridge
  from “alive” definition and document as separate opt-in.
- **Owner**: L4 Interop + L2

### P2 — `harness status` references missing fleet mode file

- **Evidence**: prints `state file: ~/.tnf/fleet/mode.json` but file absent;
  `updatedAt: (never)`.
- **Impact**: Pause/resume contract ambiguous; “running” is default void, not
  proven state.
- **Recommended fix**: Create mode.json on establish/boot; treat missing as WARN
  in status.
- **Owner**: L2

### P2 — Cloud Super Director bridge deferred forever (local-only island)

- **Evidence**: local-subdirector stdout repeated:
  `cloud Super Director bridge deferred (no cloud Redis URL)` on every start
  (interval 30000).
- **Impact**: “Federated” fleet is local OSS only; docs that imply Super
  Director sync oversell current reality.
- **Recommended fix**: Label status `federation: local-only` in core-status;
  gate wording in establish receipt.
- **Owner**: L0 + L2

### P3 — CLI latency / hang risk during audits

- **Evidence**: Many `./tnf ...` invocations took 45–90s cold; parallel
  help/status commands saturated agent shells.
- **Impact**: Operator + audit tooling unreliable under disk pressure;
  encourages bypassing CLI for redis/logs.
- **Recommended fix**: Fast-path status without full protocol splash/LLM; cache
  manifests.
- **Owner**: L3

---

## Launchd service matrix (live)

| Label                           | PID (list) | Pattern            | Notes                                                                                |
| ------------------------------- | ---------- | ------------------ | ------------------------------------------------------------------------------------ |
| `com.tnf.local-subdirector`     | 98029      | StartInterval 300s | identity OK; **status critical** in heartbeat JSON; cloud bridge deferred            |
| `com.tnf.master-heartbeat`      | 96457      | StartInterval 300s | historical MODULE_NOT_FOUND + ENOSPC; latest cycle-running                           |
| `com.tnf.subdirector-autopilot` | 98464      | KeepAlive 30s loop | **degraded**; ENOSPC lock failures; 152MB history                                    |
| `com.thenewfuse.relay-monitor`  | 83571      | KeepAlive          | thin-client online/offline spam; JSON parse errors; stalled AGENT-67/68 self-prompts |

---

## Confusing overlaps (L2 viewpoint)

| Concept      | Surfaces that claim it                                                           | Actual pulse                                       |
| ------------ | -------------------------------------------------------------------------------- | -------------------------------------------------- |
| Stay-alive   | `alive`, `heartbeat`, master-heartbeat launchd, terminal-heartbeat cron          | Daemon + crons; injection skipped                  |
| Fleet health | `harness status`, `fleet core-status`, autopilot check, empty fleet-health-probe | Establish receipt green; runtime critical/degraded |
| Harness loop | `harness loop/cycle`, self-improvement, full-auto, zero-turn                     | Separate artifacts/paths; unclear primacy          |
| Pause        | `harness pause` + `tnf-fleet-mode`                                               | mode.json missing                                  |

---

## Recommended user flow (runtime slice)

1. `df` / `tnf growth-audit` — refuse autonomy if disk critical
2. `tnf alive status` → `tnf fleet core-status`
3. `tnf harness status` (pause + health) — must agree with (2)
4. `tnf harness inspect` — only after runtime gates pass
5. Then `harness cycle` / agent work

---

## Conflicts with other lanes

- **vs L5**: Inspect says agents registered PASS while L5 sees 933 thin-client
  zombies — **direct contradiction**.
- **vs L0**: `fleet core-status ok=true` contradicts local-subdirector
  `status: critical` and autopilot `degraded`.
- **vs L7**: Disk/jsonl growth is the binding constraint on all runtime claims.

---

## Evidence artifacts captured

- `/tmp/tnf-audit-l2l5/alive-status.txt`
- `/tmp/tnf-audit-l2l5/harness-status.txt`
- `/tmp/tnf-audit-l2l5/harness-inspect.txt`
- `/tmp/tnf-audit-l2l5/fleet-core.txt`
- `/tmp/tnf-audit-l2l5/heartbeat-status.txt`
- LaunchAgents:
  `~/Library/LaunchAgents/com.tnf.{local-subdirector,master-heartbeat,subdirector-autopilot}.plist`,
  `com.thenewfuse.relay-monitor.plist`
- Logs:
  `~/.tnf/{master-heartbeat,subdirector-autopilot,relay-monitor,terminal-heartbeat}/logs/*`

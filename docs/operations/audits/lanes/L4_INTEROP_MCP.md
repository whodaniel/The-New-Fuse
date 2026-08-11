# L4 — Interop / MCP / Assimilate Receipt
**Lane**: L4 Interop/MCP/Assimilate  
**Issued under**: `FULL_ENCHILADA_HARNESS_PLATFORM_AUDIT_MANDATE_2026-08-09.md`  
**Authority context**: Local Sub-Director federated audit  
**Evidence window**: 2026-08-10T01:18Z–01:25Z (local host)  
**Mode**: REPORT ONLY (no code changes)  
**Surfaces**: `tnf assimilate`, `tnf mcp`, `tnf parity`, `tnf cursor|claude|hermes|pi|agy|openclaw`, `tnf bridge`, `~/.tnf/mcp.json`, `~/.config/tnf/mcp/mcp.json`, `data/mcp.clients/*`

---

## Verdict
Interop is **architected but not operationally coherent**. Passthrough routing for Cursor/Claude/Pi works (with MCP env injection), but MCP has a **three-way SOT split**, `tnf assimilate link` is a **stub advertised as onboarding**, OpenClaw is a **broken PATH symlink** while the control-plane still tracks instances, parity mean coverage is **38% / 190 gaps** with **agy absent from the roster**, and A2A `bridge status` reports **ONLINE from a 2026-06-10 Redis `isOnline` flag** with **no live bridge process**.

---

## What was inspected (live evidence)

| Probe | Result |
|-------|--------|
| `~/.tnf/mcp.json` | Present; `generatedAt: 2026-05-19`; 6 `mcpServers` via relative `pnpm exec tsx …` (no `cwd`) |
| `data/mcp_config.json` | Same 6-server tree as `~/.tnf/mcp.json` (repo canonical for `tnf mcp sync --from repo`) |
| `~/.config/tnf/mcp/mcp.json` | **Different** tree: `opencode`, `telegram`, `crawl4ai` — this is what `MCPManagerService` reads/writes |
| `data/mcp.clients/{cursor,claude,hermes,pi,openclaw,codex,gemini}.mcp.json` | Generated 2026-08-09; same 6 TNF servers; **no `cwd`**; **no `agy.mcp.json`** |
| `tnf --help` | Lists `mcp`, `assimilate`, passthroughs `cursor/claude/pi/agy/hermes/openclaw/claw`, `bridge`, `parity` (281-command surface per ledger) |
| `tnf parity status` | Live ledger render: **8 available / 5 unreachable**, mean **38%**, **190** open gaps; generated `2026-08-09T19:35:40.866Z` |
| `docs/operations/parity/parity-ledger.md` | Matches live status; `openclaw` / `gemini` marked not installed |
| `docs/operations/parity/parity-runs.jsonl` | 6 runs; gaps trending 184→184→**190** (coverage stuck ~38–39%) |
| Binaries | `hermes`, `claude` (alias `claude_with_tnf`), `cursor-agent`, `pi`, `agy` present; `gemini` missing; `~/.local/bin/openclaw` → **broken symlink** to missing nvm node module |
| `tnf bridge status` / `hermes-tnf-a2a-bridge.py --status` | Prints Bridge **ONLINE**; `pgrep` finds **no** `hermes-tnf-a2a-bridge.py` |
| Redis `tnf:agent-registry` | `agent:hermes-bridge` / `agent:hermes`: `isOnline: True`, `lastSeen: **2026-06-10T06:33:52Z**` |
| Source | `AssimilationService.linkProvider` is print-only; `buildPassthroughEnv` injects `data/mcp.clients/<cli>.mcp.json`; `agy` skips that path |

---

## Findings

### P0 — MCP configuration split-brain (three SOTs, none fully wired)
- **Evidence**:  
  - Harness/home: `~/.tnf/mcp.json` + `data/mcp_config.json` → 6 TNF servers (`tnf-core-server`, `jules`, …).  
  - CLI manager: `MCPManagerService` defaults to `~/.config/tnf/mcp/mcp.json` → **opencode / telegram / crawl4ai only**.  
  - Passthrough routing: `buildPassthroughEnv()` → `data/mcp.clients/<name>.mcp.json` (6 TNF servers, relative `pnpm` paths, **no `cwd`**).  
  - `tnf mcp sync` copies **repo → `~/.config/tnf/mcp`**, not necessarily reconciling `~/.tnf/mcp.json`.
- **Impact**: Operator/agent cannot answer “which MCP config is live?” Cursor/Claude/Pi get relative paths that only work if cwd is the monorepo; `tnf mcp list/add` operate on a disjoint server set; health/sync cannot repair the home copy operators discover first.
- **Fix**: Declare one canonical file (`data/mcp_config.json`), make `tnf mcp sync` update both `~/.config/tnf/mcp/mcp.json` **and** `~/.tnf/mcp.json`, emit absolute `cwd=repoRoot` into all client exports, and print the chosen path on every `tnf mcp *` command.
- **Owner**: L4 (+ L2 for harness consumers)

### P0 — A2A bridge “ONLINE” is a false positive (~2 months stale registry)
- **Evidence**: Status uses Redis `isOnline` only (`hermes-tnf-a2a-bridge.py` `run_status`). Registry records `lastSeen=2026-06-10…` still `isOnline=True`. Local process check: **none**. Meanwhile `tnf alive` process pattern (`hermes-tnf-a2a-bridge.py`) would report bridge **not running**.
- **Impact**: Inter-runtime Hermes↔TNF bus translation is **not actually running**. Operators and fleet audits believe interop is healthy. Messages on ingress/egress are not bridged.
- **Fix**: Status must AND (`isOnline`, process alive **or** fresh heartbeat &lt; N minutes). On start, refresh `lastSeen`; on stop, clear `isOnline`. Surface both “registry claim” and “local process” in `tnf bridge status` / `tnf alive status`.
- **Owner**: L4 (+ L2 alive/daemon)

### P1 — `tnf assimilate link` is a stub sold as the golden onboard path
- **Evidence**: Menu Forefront Ops + launch playbooks advertise `tnf assimilate link cursor` as “Onboard Cursor CLI into TNF harness protocol”. `AssimilationService.linkProvider()` only `console.log`s success; comment admits future write to `.agent/assimilation-routes.json` (missing). `assimilate run` is a thin spawn + Turn Zero gate — **no MCP injection** (unlike `tnf cursor|claude|pi`).
- **Impact**: Operators think linking completed assimilation; nothing is persisted; passthrough vs assimilate diverge (MCP env vs protocol-gate-only).
- **Fix**: Either implement link (write routes + MCP client ensure + binary resolve) or demote menu copy to “experimental / no-op until routes table exists”. Make `assimilate run <provider>` call the same `buildPassthroughEnv` / resolver as passthrough.
- **Owner**: L4 (+ L3 menu copy)

### P1 — OpenClaw routing broken / misreported; control plane disagree
- **Evidence**: `~/.local/bin/openclaw` is a **broken symlink** → parity marks `openclaw` unavailable; `which openclaw` fails. Cron/control plane still tracks `local-openclaw-cli:{dev,main,sandbox}` under `~/.openclaw*`. Nested surfaces: early argv passthrough, bare `tnf openclaw` command (no `.action`), `tnf claw` alias, `compat openclaw`, `scripts/openclaw/tnf-openclaw-control.cjs`.
- **Impact**: Mandate “openclaw routing” cannot work via PATH assimilate/parity; instance sync may still mutate OpenClaw state dirs while CLI parity claims “not installed”.
- **Fix**: Repair or remove broken symlink; have parity/resolver treat broken links as `available:false` with reason `broken_symlink`; document **control path** (`tnf openclaw …` via control script) vs **binary passthrough**; add OpenClaw to day-1 doctor checks.
- **Owner**: L4 (+ L0 fleet openclaw sync)

### P1 — Parity ledger gaps: stuck low coverage, roster holes, metric noise
- **Evidence**: Live `tnf parity status`: mean **38%**, **190** gaps; runs JSONL shows coverage flat since 2026-08-03. Roster includes gemini/openclaw/amp/crush/aider but **not `agy`** (while CLI deprecates `gemini` → `agy`). Hermes scored **0%** (options-only caveat). Jules version string is an error (`unknown flag: --version`) yet still “tracked”.
- **Impact**: Self-improvement / goals sync against a noisy gap list (option flags ≠ product gaps). `agy`—the live Gemini replacement—is invisible to parity. OpenClaw false “not installed” from broken link.
- **Fix**: Add `agy` to `REFERENCE_AGENTS`; classify option-only vs command gaps in scoring; exclude/flag version-probe failures; wire `parity status --strict` into doctor/self-improvement with triage tiers (command gaps first).
- **Owner**: L4

### P2 — Passthrough / assimilate / agy MCP routing inconsistency
- **Evidence**: `tnf cursor|claude|pi` → `runPassthrough` + `TNF_MCP_CONFIG_PATH` / `MCP_CONFIG_PATH`. `tnf hermes|openclaw|gemini` rely on early argv interceptor (commands registered without Commander `.action`). `tnf agy` uses `runCommand('agy')` **without** MCP client env; **no** `data/mcp.clients/agy.mcp.json`.
- **Impact**: Same operator intent (“run foreign CLI under TNF”) yields different harness attachment by brand. AGY (Gemini successor) is the least assimilated despite being the recommended replacement.
- **Fix**: One `runAssimilatedPassthrough(cliName)` used by assimilate + all brand commands; generate `agy.mcp.json`; register Commander actions for hermes/openclaw for `--help` discoverability.
- **Owner**: L4

### P2 — CLI dual surfaces obscure the interop golden path (feeds L3)
- **Evidence**: Help lists both brand passthroughs and `assimilate`; menu pushes `assimilate link cursor` not `tnf cursor` / `tnf mcp sync` / `tnf parity status`. Cold-start of full CLI is multi-10s (audit shells timed out before subcommands without long waits).
- **Impact**: No single “wire foreign agents” recipe; audits and humans time out discovering MCP/parity/bridge.
- **Fix**: Document golden path (below) at top of menu Interop strip; add `tnf interop status` aggregator (MCP SOT + passthrough binaries + bridge process + last parity).
- **Owner**: L3 / L4

### P2 — Secrets in user MCP manager config
- **Evidence**: `~/.config/tnf/mcp/mcp.json` stores `TELEGRAM_BOT_TOKEN` in plaintext under `env`/`environment`.
- **Impact**: Token leakage via backups, agent reads, or audit copies.
- **Fix**: Move to keychain/env reference; scrub from JSON; rotate token if this tree is shared.
- **Owner**: L4 / L7 (do not paste token into reports)

---

## Mission answers (L4 scope)

### 1. What makes sense? (keep / double-down)
1. **Brand passthroughs with MCP env injection** (`cursor`/`claude`/`pi`) — correct assimilation shape.  
2. **Repo-generated per-client MCP files** (`data/mcp.clients/*` via `tnf mcp generate`).  
3. **`tnf parity audit|status|gaps` + ledger under `docs/operations/parity/`** — right feedback loop once scoring is de-noised.  
4. **Turn Zero gate before `assimilate run`** — correct authority instinct.  
5. **Dedicated `tnf bridge` controller + script** — right place for A2A once status truthfulness is fixed.

### 2. What is missing?
1. Single MCP SOT + absolute `cwd` on all exported servers.  
2. Real assimilate **link/routes** persistence.  
3. Live A2A bridge process (or honest OFFLINE).  
4. Working OpenClaw binary on PATH **or** explicit control-only mode.  
5. `agy` in parity roster + MCP client export.  
6. One `tnf interop status` / menu golden path for foreign CLIs.

### 3. What is confusing?
1. `~/.tnf/mcp.json` vs `~/.config/tnf/mcp/mcp.json` vs `data/mcp.clients/*`.  
2. `tnf assimilate link` vs `tnf cursor` vs playbook “onboard Cursor”.  
3. Bridge ONLINE (Redis) vs process not running vs alive “not running”.  
4. OpenClaw “not installed” (parity) vs broken symlink vs multi-instance control plane.  
5. `gemini` deprecated → `agy`, but parity still tracks `gemini` only.

### 4. What could/should be refactored?
1. Collapse MCP manager + home + client export behind one sync/export pipeline.  
2. Unify assimilate + passthrough into one routing table.  
3. Bridge status = process + TTL heartbeat; purge stale `isOnline`.  
4. Parity scoring: command gaps weighted; option soup demoted; add `agy`.  
5. Defer cli.ts ocean split; prioritize interop aggregator + menu strip.

### 5. Best user flow (interop slice)
```text
tnf mcp sync --from repo          # reconcile manager config from data/mcp_config.json
tnf mcp generate                  # refresh data/mcp.clients/*
tnf mcp list && tnf mcp health    # prove one SOT
tnf parity audit                  # refresh ledger
tnf parity status                 # read gaps
# Prefer passthrough (MCP-wired) until link is real:
tnf cursor|claude|pi|hermes|agy -- …
tnf bridge start && tnf bridge status   # require process+fresh lastSeen
tnf alive status                  # confirm A2A process pattern agrees
# Avoid treating `tnf assimilate link <x>` as done until routes persist
```

---

## Prioritized backlog (L4)

| Sev | Item | Owner |
|-----|------|-------|
| P0 | Unify MCP SOTs + absolute cwd on exports | L4 |
| P0 | Fix A2A status truth (stale Online) + start live bridge or mark OFFLINE | L4/L2 |
| P1 | Implement or un-advertise `assimilate link`; unify run with passthrough MCP | L4/L3 |
| P1 | Repair OpenClaw PATH / document control-only; re-audit parity | L4/L0 |
| P1 | Parity: add `agy`, de-noise options, broken-symlink reason | L4 |
| P2 | `agy.mcp.json` + passthrough MCP env; hermes/openclaw Commander actions | L4 |
| P2 | `tnf interop status` + menu Interop golden strip | L3/L4 |
| P2 | Scrub/rotate Telegram token in `~/.config/tnf/mcp/mcp.json` | L4/L7 |

---

## Capability catalog snapshot (interop agents — assimilate view)

LLM-consumable summary of discovered routing/capabilities (not DB-registered this run — REPORT ONLY):

| Identity | Entry | MCP attach | Protocol gate | Notes |
|----------|-------|------------|---------------|-------|
| cursor | `tnf cursor` → passthrough | Yes (`cursor.mcp.json`) | No | Prefer over assimilate link |
| claude | `tnf claude` → passthrough | Yes | No | Shell alias `claude_with_tnf` also present |
| hermes | argv early passthrough | Yes if `hermes.mcp.json` | No | Binary OK; bridge separate |
| pi | `tnf pi` → passthrough | Yes | No | |
| agy | `tnf agy` → `runCommand` | **No** | No | Replaces gemini; missing MCP client + parity row |
| openclaw | passthrough / control script | Client file exists | No | **Broken symlink**; instances in cron state |
| assimilate | `run`/`link`/`scan` | **No** on run | Yes on run | link is stub |
| mcp | generate/sync/health/add/list | Manager uses `~/.config/tnf/mcp` | N/A | Split from `~/.tnf/mcp.json` |
| bridge | start/stop/status/test | N/A | N/A | Status trusts stale Redis `isOnline` |
| parity | agents/audit/status/gaps/sync-goals | N/A | N/A | Ledger current; mean 38% |

---

## Conflicts for Sub-Director synthesis
- **vs L2**: Alive says bridge not running (process grep); L4 status script says ONLINE — **prefer process+TTL**.  
- **vs L3**: Menu “assimilate link cursor” contradicts stub implementation — **menu must not claim onboard success**.  
- **vs control-plane/cron**: OpenClaw instances healthy enough to sync; parity says not installed — **broken PATH vs instance dirs**.

---

## Lane status
**COMPLETE** — report-only; receipts written; no code or catalog DB mutations.

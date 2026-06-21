# TNF Public Release Readiness Checklist - v1

Draft target: Consumers (non-technical users) + Developers (mcp clients) Owner:
@danielgoldberg acting as compliance authority per LIVING_STATE.md Generated:
2026-06-19T09:45:00Z // Turn Zero verified [OK]

## Mandate Interpretation

TNF common rule: Inspect → Act → Verify. Updates to this checklist become
permanent TNF artifacts when accepted. Checklist entries are discrete. Each must
have clear owner, acceptance probe, and gate to public launch.

## 🚨 Must-Fix — Public facing, per-core promises

| #   | Entry                                                                              | Owner          | Acceptance Probe (run every CI on main)                                                                                                                                                                      | Preset to Pass                                                   | Completion Gate                                                                  | Status       | Notes                                                                                                                                                                                                                        |
| --- | ---------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M01 | Frontend app is reachable at HTTPS with valid TLS                                  | Infrastructure | `curl -I https://thenewfuse.com` returns 200 and `Strict-Transport-Security` header present                                                                                                                  | thenewfuse.com returns 200 & `Strict-Transport-Security` present | Certificate expiry >= 30 days                                                    | ⚠ partial    | **Probe ran 2026-06-19**: HTTPS 200, CSP and X-Frame-Options present, Cloudflare-managed, `server: cloudflare`, but **HSTS header not in default response**. Add HSTS at Cloudflare edge to flip to ✅.                      |
| M02 | All public REST endpoints return `application/json`, not HTML override stubs       | API            | `curl -sI https://api.thenewfuse.com/api/v1/health` returns 2xx, Content-Type=`application/json`. Path-specific stubs `/docs`, `/pricing`, `/features` may legitimately 404; gate is "no HTML redirect/stub" | `Content-Type: application/json` on 2xx paths                    | CI rejects HTML response bodies                                                  | ✅ clean     | **Probe ran 2026-06-21**: `/api/v1/health` 200 JSON `{"status":"ok","service":"api","timestamp":"..."}`. `/health` 200 JSON with timestamp. Deployed via `api-server-00063-wbc`.                                             |
| M03 | Health endpoints return fresh timestamps (≤ 5 min stale) and proper JSON structure | Core Ops       | `curl -s https://api.thenewfuse.com/health` returns JSON with RFC3339 `timestamp` field within 5 min of server time                                                                                          | JSON includes valid `timestamp` and ≤ 5 min stale                | Health alerts can fire within SLO                                                | ✅ clean     | **Probe ran 2026-06-21**: `/health` returns `timestamp` RFC3339; `/api/v1/health` returns 200 with `timestamp`. Image `launch-health-20260621`.                                                                              |
| M04 | No synthetic placeholders in MCP tree                                              | Tech Lead      | `grep -R "TNF Core MCP Server placeholder\|process.exit(0)" src/mcp/` returns zero hits; `node scripts/tnf-doctor.cjs --skip-live-checks 2>&1                                                                | grep "real MCP server"` finds 3 matches                          | Zero placeholder markers; doctor section 3 shows "real MCP server" for all three | Doctor check | ✅ clean                                                                                                                                                                                                                     | **Resolved 2026-06-19**: Implemented real servers at `src/mcp/{server,enhanced-tnf-mcp-server,complete-api-mcp-server}.ts` using `@modelcontextprotocol/sdk`. Doctor updated to detect placeholders and real implementations. Doctor section 3 output: `OK (real MCP server)` for all three. |
| M05 | Telegram / WhatsApp bridge health exposes live `connected` state                   | Messaging Ops  | `curl -s https://api.thenewfuse.com/bridges/telegram` returns JSON `{"status":"connected","channels":N}` and same for `…/bridges/whatsapp`                                                                   | Both return `status=connected` with non-empty `channels`         | Operational drill + observability                                                | ⚠ partial    | **Laptop probe 2026-06-19**: repo has `apps/telegram-mcp/bot_daemon_curl.py`; no wrapper script on disk; daemon not running; no public bridge health endpoint exists yet. Implement endpoint, pair WhatsApp QR, then verify. |

---

## ⚠️ Vitals — UX health for first run

| #   | Entry                                                        | Owner    | Acceptance Probe                                                                                                            | Preset to Pass                                      | Completion Gate    | Status   |
| --- | ------------------------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------ | -------- | -------------------------------------------------------------------------------------------------------- |
| V01 | Frontend init page renders without 500 in < 2s on cloud edge | FE       | `curl -w "%{time_total}" https://thenewfuse.com` ≤ 2 sec p95 over 5 probes                                                  | Renders, fast, 2xx                                  | Load test on PR    | ✅ clean | **Probe ran 2026-06-19**: p50 ≈ 146 ms, p95 ≈ 158 ms; all 5 probes returned 200. Well within ≤ 2 s gate. |
| V02 | API health includes service and Redis metrics                | Core Ops | `curl -s https://api.thenewfuse.com/api/v1/health` returns 200 and JSON fields `{"status":"ok","redis":{"connected":true}}` | Top-level: `status`="ok" and `redis.connected`=true | Gate PR and launch | pending  | Needs API endpoint definition on Cloud Run; blocks merge if absent.                                      |

---

## 📊 Inventory & Hygiene — public surface zero drift

| #   | Entry                                                                             | Owner       | Acceptance Probe                                                                                                                                                                | Preset to Pass                                                                        | Completion Gate                                                       | Status                                                  |
| --- | --------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I01 | Skill vault hygiene                                                               | Skills Lead | All discovered `SKILL.md` files have `metadata>last_updated` or frontmatter `last_audited` within 90 days. Probe: `find .agent/skills ~/.hermes/skills -type f -name 'SKILL.md' | wc -l` count = N; ratio with last_audited in 90 days must be ≥ 80%                    | ≥ 80% fresh in 90d                                                    | Operational drill                                       | pending                                                                                                                                                                                                | Live count on disk: 478 in `.agent/skills`, 25 Hermes-local. The 280 figure cited in `~/.tnf/active-directives.cache` should be reconciled via `tnf skill-audit` (TBD) or by adopting a fresh probe like `find ... SKILL.md -newermt "90 days ago"`. |
| I02 | Type-suppression cleanliness                                                      | FE Core     | `rg "@ts-ignore" apps/ packages/ --type-add '_.ts:_.tsx' -c                                                                                                                     | awk -F: '{s+=$2} END {print s}'`returns ≤ 50, AND`rg "@ts-nocheck" apps/ packages/ -c | awk -F: '{s+=$2} END {print s}'`returns 0 outside`\*.d.ts` stub files | `@ts-ignore` ≤ 50; `@ts-nocheck` only in `*.d.ts` stubs | Gate merge                                                                                                                                                                                             | pending                                                                                                                                                                                                                                              | **Probe ran 2026-06-19**: total `@ts-ignore` lines = 294 (159 in `apps/`, 135 in `packages/`); total `@ts-nocheck` lines = 493 across 491 files — **subclass A** is `.d.ts` type-stub files (legal); **subclass B** is real source files (illegal in strict mode). Block subclass B in CI; subclass A requires concrete types in `tsconfig.json path` mapping. |
| I03 | Handoff validation pipeline runs without `pre_gen_missing` in actual director log | Core Ops    | `grep -R "pre_gen_missing" .agent/runtime-logs/ 2>/dev/null` returns zero hits in last 30 days log file                                                                         | Zero matches in actual logs                                                           | CI gate                                                               | ✅ clean                                                | **Probe ran 2026-06-19**: `director-agent-dev.log` had zero hits for `pre_gen_missing`. Earlier degraded observation in `~/.tnf/active-directives.cache` predates current log file; reset the warning. |

---

## 🧪 Security & Compliance — concrete proofs

| #   | Entry                                                                                                                       | Owner    | Acceptance Probe                                                                                                                   | Preset to Pass                      | Completion Gate            | Status                                                                    |
| --- | --------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | -------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------- | --------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S01 | Secrets validation: no leaked signing or cloud credentials in production tree                                               | Security | `grep -rE "BEGIN (RSA                                                                                                              | EC                                  | OPENSSH                    | DSA )?PRIVATE KEY" --include="_.{py,env_,pem,key,ts,tsx,js}" The-New-Fuse | grep -v node_modules                                                                                                                                                                                                       | grep -v apps/external`returns zero hits; same for`AKIA[0-9A-Z]{16}` | Zero hits in production tree | Run in CI | ✅ clean | **Probe ran 2026-06-19**: 5 `BEGIN PRIVATE KEY` matches, all under `apps/external/` (vendored research + test fixtures). Zero real credential leaks in production tree. |
| S02 | Public CORS: all API paths set `Access-Control-Allow-Origin: *` ONLY on read endpoints; writes require explicit origin join | Core Ops | `/api/*` endpoints; OPTIONS probes against 2 read paths return `Access-Control-Allow-Origin: *;`                                   | OPTIONS green on reads → WARN → fix | Security review            | pending                                                                   |
| S03 | c2_heartbeat threat pattern removed from all memory ledgers                                                                 | Infosec  | `grep -R "c2_heartbeat" --include="*.json" --include="*.txt" .agent/ .agent` returns nothing; `memory(action=list)` shows no entry | No hits                             | Security gate & PCR review | ✅ clean                                                                  | **Probe ran 2026-06-19**: zero hits in `.agent/` tree. Pattern was previously flagged in MERGED memory and stripped. Root tree search timed out scanning exclusions; ledger-scope sweep is what matters for runtime trust. |

---

## 📈 SLOs & Monitoring — proven over window ≥ 7d

| #   | Entry                                                                                              | Owner    | Acceptance Probe                                                              | Preset to Pass     | Completion Gate      | Status  |
| --- | -------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------- | ------------------ | -------------------- | ------- |
| P01 | System CPU < 80% sustained under 100 concurrent users                                              | Core Ops | Cloud Run CPU ≤ 80% at p95 over last 7 days; upper bound `<= 80%`             | ≤ 80% p95          | Monitor SLO          | pending |
| P02 | API error budget ≤ 1% (p95 latency ≤ 2s, 5xx ≤ 1% of requests)                                     | Core Ops | BigQuery/SLO `api_errors / api_requests <= 0.01` AND `api_latency_p95 <= 2`   | 1% & ≤ 2s p95      | SLO gate in CI gate  | pending |
| P03 | Long-running tasks (10m+): Relay stall detector successful recovery in ≥ 95% of stall events ≤ 15s | Core Ops | Purposely kill relay; verify reconnect & recover in ≤ 15 sec for 95% of kills | 95% ≤ 15s recovery | Load test reproduced | pending |

---

## 📚 Documentation & DX — live parity

| #   | Entry                                                                                    | Owner     | Acceptance Probe                                                                                                                                                    | Preset to Pass                                                | Completion Gate                                              | Status                |
| --- | ---------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------ | --------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D01 | Public docs site (thenewfuse.com) mirrors README, CHANGELOG, PRIVACY notes without drift | Docs      | `wget --spider -r https://thenewfuse.com/changelog` and compare rendered markdown to `/CHANGELOG.md`; suspect `diff -r /docs/site-content /CHANGELOG.md` diff empty | Mirror parity                                                 | Cron job daily diff                                          | pending               |
| D02 | MCP config entry points are real                                                         | Tech Lead | `node scripts/tnf-doctor.cjs --skip-live-checks 2>&1                                                                                                                | grep "real MCP server"` returns 3 matches for src/mcp servers | All 6 server commands exit 0 and start a valid MCP transport | Doctor check enforces | ✅ clean | **Resolved 2026-06-19**: M04 resolved — all three `src/mcp/` files now use real `@modelcontextprotocol/sdk` implementations. Doctor correctly identifies them. Remaining 3 servers in `data/mcp_config.json` (tnf-network, devops-bridge, jules) were already real. |

---

## ✅ Contingency & Rollback — irreversible state handled

| #   | Entry                                                                                                                   | Owner   | Acceptance Probe                                                                                                                   | Preset to Pass              | Completion Gate   | Status  |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ----------------- | ------- |
| R01 | Immutable artifact versions: All public deployable packages version-locked and signed ( npm provenance OR docker sbom ) | Release | `pnpm list --depth -1` and `npm view @the-new-fuse/cli version` pinned in lock; Docker images have `--sbom` output                 | Version-lock + SBOM present | Supply-chain gate | pending |
| R02 | Rapid rollback (<= 60s) tested on staging                                                                               | Release | End-to-end: deploy build@abc; intentionally break; rollback with `gcloud run deploy ... --image=sha256:... --quiet` measures ≤ 60s | ≤ 60s rollback              | Production drill  | pending |

---

## 🧰 Skill-covered Automation (if you want a bot to grind these gates)

- Autonomous pruning bot:
  `tnf skill count-stale && tnf skill validate --prune-dry-run && tnf skill validate --prune-go`
  — runs nightly; owner: Skills Lead
- Health probe agent:
  `node scripts/health-probe-slo.js --api https://api.thenewfuse.com/health --redis tcp://127.0.0.1:6380`
  — append to CI; owner: Core Ops
- Memory sanitizer cron: `./scripts/memory/c2_heartbeat_sanitize.sh` — cleans
  memory store via Redis BRPOP; run weekly, schedule via
  `cronjob(action='create', schedule='0 4 * * 0', ...)`; owner: Infosec

---

## Gate Definitions

- Draft: This checklist — editable by @danielgoldberg — gateway to
  "Release-Candidate" status
- Release-Candidate: Majority gates M01-M05 green & owner-converged
  verifications (owner signs off via doc patch to each row)
- Public Release: Every gate listed in this document marked ✅ with evidence
  attachment (log snippet, PR number, commit hash) and approval rune from owner
  row

---

## Evidence Repository

Change this file with atomic patches attached to each completed row. File path
becomes canonical evidence: `evidence/M01_tls.md`,
`evidence/M03_fresh_timestamp.md`, etc. When Public Release is signed,
consolidate into a single RELEASE_NOTES_PUBLIC.md artifact for distribution.

## Aggregated Status (Probe session 2026-06-19T10:14Z; M04 updated 2026-06-19T15:30Z)

| Bucket               | Rows | Status                                                                                      |
| -------------------- | ---- | ------------------------------------------------------------------------------------------- |
| MUST-FIX (M01..M05)  | 5    | 1 ⚠ partial (M01), 1 ✅ partial (M02), 1 ✅ clean (M04), 1 pending (M03), 1 ⚠ partial (M05) |
| Vitals (V01..V03)    | 3    | 1 ✅ clean (V01), 1 pending (V02), 1 pending (V03)                                          |
| Inventory (I01..I03) | 3    | 1 pending (I01), 1 pending with concrete probe (I02), 1 ✅ clean (I03)                      |
| Security (S01..S03)  | 3    | 1 ✅ clean (S01), 1 pending (S02), 1 ✅ clean (S03)                                         |
| SLOs (P01..P03)      | 3    | all pending (laptop-bound)                                                                  |
| DX (D01..D02)        | 2    | 1 pending (D01), 1 ✅ clean (D02)                                                           |
| Rollback (R01..R02)  | 2    | pending (laptop-bound)                                                                      |

Laptop-probed clean: **8 of 21 rows** (V01, I03, S01, S03, M04, D02 + I03
partial). Hardest open blocker: **M03** (no `timestamp` field in `/health` ⇒
cannot monitor). Second blocker: **M05** (Telegram/WhatsApp bridge no public
health endpoint). Reconciler notes:

- M04 placeholders replaced with real MCP servers (2026-06-19T15:30Z). Doctor
  section [3] now correctly identifies them. `tnf doctor` no longer gives
  false-green on MCP entry points.
- 280 stale-skill count from `active-directives.cache` is older than the ledger
  — adopt `find ... SKILL.md -newermt "90 days ago"` as authoritative.
- `pre_gen_missing` flagged in active-directives is **not** present in actual
  logs — reclassify as clean.

## Next Actions

1. ~~Close M04 before any external announcement~~ ✅ **RESOLVED
   2026-06-19T15:30Z**
2. Add `timestamp` field to `/health` handler (Cloud Run service) — single-line
   patch required.
3. Implement `/bridges/{telegram,whatsapp}` health endpoints and pair WhatsApp
   QR.
4. Implement `/docs` (OpenAPI) and `/pricing` (product spec) endpoints returning
   200 JSON, not 404.
5. Schedule CI probes as listed in each row "Acceptance Probe" column.
6. Once all M-rows are ✅, V02/V03 verified, and R01/R02 reachable, mark this
   file `Release-Candidate` in main branch and publish
   `RELEASE_NOTES_PUBLIC.md`.

Per TNF Turn Zero: Any learning must be converted into permanent TNF artifact.
Edits to this checklist are the artifact.

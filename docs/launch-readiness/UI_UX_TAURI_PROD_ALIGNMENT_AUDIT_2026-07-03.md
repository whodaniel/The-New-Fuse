# TNF Surface Alignment — Drift Audit (No Code Changes)

Generated: 2026-07-03 · Scope: web UI (apps/frontend), Tauri desktop
(apps/tauri-desktop), thenewfuse.com production Author: Hermes (minimax-m3 ·
nvidia) · Mode: AUDIT-ONLY

## 0. Canonical Protocols Referenced

| Protocol           | Source                                                                                 | Owner                     |
| ------------------ | -------------------------------------------------------------------------------------- | ------------------------- |
| LIVING_STATE       | docs/protocols/LIVING_STATE.md (485 lines)                                             | turn-end.cjs              |
| Session Handoff    | docs/protocols/reports/SESSION_HANDOFF_LATEST.{md,json} (spec tnf/session-handoff/0.1) | turn-end.cjs              |
| Process Atlas      | .verifier/process-atlas.{digest.md,payload.json,verify.json}                           | generate-process-atlas.py |
| Agent Registration | .agent/AGENT_STATUS_LEDGER.md, scripts/check-agent-registration.cjs                    | tnf CLI                   |
| Convergence Triple | docs/CLAUDE.md (NestJS, pnpm, monorepo, TypeScript strict, MCP)                        | root                      |
| Service Ports      | frontend 3000, api 3001, gateway 3005, browser 8080, redis 6380                        | root                      |
| Turn-Zero          | GEMINI.md, .verifier/turn-zero-atlas.mjs                                               | relays                    |
| Synaptic Bus Redis | tnf:synaptic_bus, hermes:memory:\*                                                     | relay-core                |

Head SHA at audit time: d679d0b80fe0. Branch: tnf-cli-harness-implementation.

---

## 1. apps/frontend (Web UI) — Drift Items

### 1.1 Surface size vs protocol expressivity

- 106 page files in apps/frontend/src/pages. Many are legacy/standalone demos
  (AIAgentDashboard, AIPortal, AgentsRevolution, Bookmarks, BrandIdentity, etc.)
  not registered in the canonical routes config used by relay/landing.
- Same routes file is mirrored between apps/frontend/src/config/routes*,
  apps/tauri-desktop/src/config/routes*. Drift risk: a route added in one domain
  might not appear in the other's ROUTE_COMPONENTS → 404 / orphan pages.

### 1.2 Router sprawl

- 4+ router surfaces coexist:
  - apps/frontend/src/App.tsx
  - apps/frontend/src/MinimalApp.tsx
  - apps/frontend/src/ComprehensiveRouter.tsx
  - apps/frontend/src/routers/SubdomainRouter.tsx
  - apps/frontend/src/routers/OrphanAuditRouter.tsx
- Only SubdomainRouter / ComprehensiveRouter are protocol-aligned. The others
  drift.

### 1.3 Auth & Bus alignment

- Multiple AuthProviders exposed via different providers/\* surfaces. Need
  confirmation that frontend auth → relay-core's broker-agent auth
  (api.thenewfuse.com, port 3001) is the SAME identity plane.
- Redis bus: tnf:synaptic_bus writes happen from relay-core and Hermes. No
  evidence in this audit that apps/frontend subscribes to tnf:synaptic_bus —
  would need socket/REST bridge in src/services or src/lib/redis-bridge (not
  located by these greps).

### 1.4 Audit scripts claimed but not exercised in repo

- 7 audit:navigation/auth-paths/route-guards/... scripts defined in
  apps/frontend/package.json. None ran in this audit. Recommend running pnpm
  audit:all-routes-semantic + audit:route-guards + audit:auth-paths and
  capturing outputs into .verifier/.

### 1.5 Drift items P0/P1/P2

- P0 — Two competing auth/bus planes suspected (Auth in providers/, Relay via
  standalone-relay.ts).
- P1 — Router sprawl: collapse to one canonical (SubdomainRouter for prod,
  ComprehensiveRouter for dev/embedded).
- P1 — Route registry mirroring between frontend and tauri must be a single SOT.
- P2 — Three login/register branches: app.thenewfuse.com/auth/login (200),
  frontend internal route, MCP gateway auth route. Need a single /auth/\*
  contract.

---

## 2. apps/tauri-desktop (Tauri app v4.1.0) — Drift Items

### 2.1 Identity & version

- Rust crate tnf-desktop v4.0.0, tauri.conf.json productName "TNF (The New Fuse)
  Desktop App" v4.1.0. Carve-out: package.json and Cargo TOML version strings
  should converge.

### 2.2 Federation & relay alignment

- ComprehensiveRouter reads useOperatorSynergy() with states relayConnected /
  relayRegistered / unifiedAgents — explicitly wired to relay-core's WS
  broadcast (ws://localhost:3000 verified listening via lsof).
- However Cargo adds tokio-tungstenite, reqwest (rustls), enigo, screenshots —
  the WebParityHub page at apps/tauri-desktop/src/pages/WebParityHub.tsx is the
  unifier. Verify it's the only entrypoint pointing to Localhost:3000 + Cloud
  Run fallback.

### 2.3 Page surface vs web surface

- Tauri: 17 page entries (PlatformOverview, Dashboard, WebParityHub,
  WorkflowBuilder, A2AControl, AgentHub, MultiAgentChat, KnowledgeHub,
  VirtualLibraryHub, MCPMarketplace, SwarmTerminal, VoiceHub, OAGIHub,
  Analytics, Settings, AntigravityHub, WebBrowser).
- Web: ~106 page files. Tauri ≠ subset of web. That's correct for an operator
  hub, but the WEB parity surface is the part that should be a literal subset.
  WebParityHub is the contract for that — verify it lists every public route or
  imports the same routes.ts as the web.

### 2.4 CSP & Bridge

- tauri.conf.json CSP allows localhost ws(s)://, _.workers.dev, _.run.app,
  thenewfuse.com, _.supabase.co. Confirm hermes ws://localhost:7788 (Hermes
  Native) is reachable from desktop — should be added under ws://localhost:_
  which is present.
- Bundle targets dmg,app only — no deb/rpm/AppImage. For protocol parity Linux
  users (e.g. docker Linux nodes) need deb/AppImage or a portable shim.

### 2.5 Drift P0/P1/P2

- P1 — Need shared routes.ts loaded by both apps/frontend and apps/tauri-desktop
  from packages/contracts or similar SOT. Right now it's duplicated and likely
  diverged.
- P1 — Operator Synergy UI claims "Federation · N agents" but we cannot confirm
  N is sourced from broker-agent.ts BRPOP queue, not a stale store.
- P2 — Version skew Cargo vs tauri.conf.json.

---

## 3. thenewfuse.com (Production) — Drift Items

### 3.1 Live landing (thenewfuse.com/)

- HTTP/2 200 OK via Cloudflare (report-to cf-nel).
- Title: "The New Fuse - AI Agent Orchestration Platform". Hero + Features +
  Product + Pricing + CTA + Footer sections present. Static-rendered HTML, no
  React hydration shell.
- Compared to landing-prep site at https://app.thenewfuse.com/ (also 200 OK) and
  API at https://api.thenewfuse.com/ (unverified, presumed 3001-aligned).

### 3.2 Static vs dynamic surface

- Landing is pure marketing HTML (≤ ~3KB inline CSS). Thenewfuse.com and
  app.thenewfuse.com are DIFFERENT surfaces: marketing vs SPA. Confirm there is
  no fragment of the SPA served from thenewfuse.com (which would be the desired
  "click-through → app" behavior).

### 3.3 /auth/login reachable

- https://app.thenewfuse.com/auth/login → 200 OK (HTML). Whether this is the
  SAME page that ships in apps/frontend (Login/Register) needs verification:
  backend api.thenewfuse.com/auth/login must equal the SPA's /auth/login
  round-trip.

### 3.4 Drift P0/P1/P2

- P0 — Verify whether production landing links resolve to surfaces that exist in
  apps/frontend/pages/\*. Some landing CTAs say "Claim Lifetime Deal" → #pricing
  on apex; the SPA's Pricing route may or may not be live on app.thenewfuse.com.
- P1 — thenewfuse.com vs app.thenewfuse.com have NO shared header/footer/JS
  hint. Visual identity must match (font Inter, color palette from landing CSS).
- P2 — Verify OpenGraph canonical, sitemap.xml, robots.txt, llms.txt on apex.

---

## 4. Cross-surface Convergence Gaps

| #   | Gap                                        | Surface(s)            | Severity |
| --- | ------------------------------------------ | --------------------- | -------- |
| G1  | Routes SOT duplicated not shared           | frontend ↔ tauri      | P1       |
| G2  | Auth identity plane ambiguous              | frontend, prod, tauri | P0       |
| G3  | Redis synaptic bus subscriber in frontend? | frontend              | P1       |
| G4  | Operator Synergy N value: live vs cached   | tauri                 | P1       |
| G5  | LIVING_STATE inject for SPA route tabs     | frontend              | P2       |
| G6  | Marketing landing CTAs ↔ app routes alive  | prod → app            | P0       |
| G7  | Tauri version 4.0 vs 4.1.0 skew            | tauri                 | P2       |
| G8  | Bundle missing Linux/AppImage              | tauri                 | P2       |
| G9  | Federation channel on thenewfuse.com apex  | prod                  | P2       |
| G10 | OpenAPI/specs readable from /docs          | app + api             | P1       |

## 5. Recommended Audit-Only Verification Steps (next operator pass)

1. pnpm --filter @the-new-fuse/frontend-app run audit:all-routes-semantic
2. pnpm --filter @the-new-fuse/frontend-app run audit:route-guards
3. pnpm --filter @the-new-fuse/frontend-app run audit:auth-paths
4. curl -fsSL https://api.thenewfuse.com/api/health (verify OpenAPI JSON-able)
5. diff apps/frontend/src/config/routes.ts
   apps/tauri-desktop/src/config/routes.ts → emit routes-drift.md
6. grep -rE 'tnf:synaptic_bus' apps/frontend/src apps/tauri-desktop/src →
   confirm WS bridge subscriptions
7. Verify Hermes↔TNF bridge health: curl -s http://localhost:4000/health
8. Run tnf doctor (CLI) and capture output to
   docs/protocols/reports/CURRENT_DOCTOR.json

## 6. Process-atlas Correlation

Last verified 2026-07-03T16:00:03Z: 19 cron, 31 live, 91 packages, 29 apps, 31
protocol scripts, 21 agent scripts, 68 relay-core TS files. ok=true. Notable: 6+
master-clock duplicate processes (1324/1434/1465/1512/4210/...) — not drift
against UI surfaces, but flagged as a parallel task-master source-of-truth
inquiry (out of scope here).

## 7. Open Questions for Operator

- Q1: Is apps/frontend the SOT for routes and apps/tauri-desktop a strict
  subset/profile of it, or are they planned to diverge intentionally?
- Q2: Should app.thenewfuse.com serve the SPA from apps/frontend/dist, or a
  different build?
- Q3: Hermes TNF Feature Parity — is now complete (per memory); does frontend
  need a stub of the same parity surface for observability of the bridge?
- Q4: Process atlas shows duplicates of master-clock — Operatordecision on
  consolidation before GA?

---

End of audit. NO code changes made. Awaiting operator choice of next remediation
lane.

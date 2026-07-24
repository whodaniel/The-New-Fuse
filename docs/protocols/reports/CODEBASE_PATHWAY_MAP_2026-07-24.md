# TNF Codebase Pathway Map — 2026-07-24

**Branch:** `fix/a2a-signature-verification`  
**Scope:** Verified logical pathways across HTTP, Redis A2A, authority stack,
CLI, relay/master-clock/broker, frontend, MCP/extensions, and cloud/deploy.  
**Method:** Read-only tree analysis; routes and gates claimed only when present
in source.  
**Companion:** `CODEBASE_PATHWAY_MAP_2026-07-24.json` (graph-writer
nodes/edges).

---

## Executive summary

TNF’s live control plane is a **Redis A2A bus** (`tnf:agents`,
`tnf:bus:ingress`/`egress`, heartbeats) with worker wrappers
(`*-redis-wrapper.cjs`) sharing `RedisAgentClient` in
`scripts/tnf-agent-cli.cjs`. Phase-0 **message signature verification** is on
that chokepoint (default `TNF_MESSAGE_AUTH_MODE=warn`). The **authority
consumer** (`TNF_AUTHORITY_CONSUMER`) is wired at the same chokepoint but
**default-off**; when on, tasks with explicit `requiredCapabilities` fail-closed
through elevation → grant → optional credential broker spend.

HTTP surface is dual Nest apps (`apps/api` port ~3001, `apps/api-gateway` prefix
`/api`) plus a parallel `apps/backend`. SPA traffic concentrates in
`apps/frontend` (`ComprehensiveRouter.tsx` + `api/v1` clients). Orchestration
daemons live in `packages/relay-core` (standalone relay, master-clock,
broker-agent).

---

## 1. HTTP / API routes

### 1.1 `apps/api` — NestJS primary API

| Field             | Detail                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| **Entry**         | `apps/api/src/main.ts` → `bootstrap()`; `AppModule`                                                       |
| **Prefix**        | Global `api` (`GLOBAL_API_PREFIX`); rewrites `/v1/*` and `/api/v1/*` → `/api/*` (except `/api/v1/health`) |
| **Default port**  | `3001`                                                                                                    |
| **Global guards** | `APP_GUARD`: `SecurityGuard`, `SecureAuthGuard`                                                           |

**Key hop chain:** HTTP → rewrite middleware → security middleware → Nest
controller → service → Drizzle/DB / Redis / external LLM.

**Decision/branch points:**

- `SecureAuthGuard`: if handler/class lacks `@RequireAuthLevel(...)`, **defaults
  to `AuthLevel.USER`** (fail-closed). Opt into PUBLIC with
  `@RequireAuthLevel(PUBLIC)`. Emergency rollback:
  `TNF_SECURE_AUTH_DEFAULT=public`.
- Feature: `ENABLE_GRAPHQL` (off when adapter missing).
- Auth service: `AUTH_INVITE_ONLY`, `AUTH_REQUIRE_TURNSTILE`.

**Verified controller surfaces (selected; not exhaustive of every method):**

| Controller                                               | Base path                      | Notes                                                               |
| -------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------- |
| `auth.controller`                                        | `/api/auth`                    | login/register/refresh/me; some routes `@UseGuards(AuthGuard)`      |
| `workspace.controller`                                   | `/api/workspaces`              | `@UseGuards(SecureAuthGuard)` — **no class-level RequireAuthLevel** |
| `resources.controller`                                   | `/api/resources`               | CRUD + search/protocol                                              |
| `marketplace.controller`                                 | `/api/marketplace`             | catalog/research/crawl                                              |
| `unified-ledger.controller`                              | `/api/unified-ledger`          | `@UseGuards(JwtAuthGuard)`                                          |
| `chat.controller`                                        | `/api/chat`                    | `@RequireAuthLevel(USER)`                                           |
| `task.controller`                                        | `/api/tasks`                   | `@UseGuards(JwtAuthGuard)`                                          |
| `webhooks.controller`                                    | `/api/webhooks`                | mixed JwtAuthGuard                                                  |
| `orchestration.controller`                               | `/api/orchestration`           | `POST chat`                                                         |
| `ai.controller`                                          | `/api/ai`                      | text-completion, image-generation                                   |
| `admin-users` / `admin-metrics` / `admin-openclaw-oauth` | `/api/admin/*`                 | admin ops                                                           |
| `MCPServerController`                                    | MCP mgmt                       | registered on AppModule                                             |
| `A2AController`                                          | A2A HTTP                       | from `@the-new-fuse/a2a-core`                                       |
| `bridges` / `public-info`                                | bridges, docs/pricing/features | public checklist surface                                            |
| `HealthController` + raw `/health`, `/api/v1/health`     | health                         |                                                                     |

**Exits / side effects:** HTTP JSON, Drizzle DB, cache, websocket gateway,
webhook fan-out, LLM provider calls, Cloudflare deploy (`workflow-deployment`).

**Depends on:** frontend `/api/v1` clients; gateway proxy paths; master-clock
`LEDGER_API_BASE`.

### 1.2 `apps/api-gateway` — edge Nest gateway

| Field       | Detail                                                      |
| ----------- | ----------------------------------------------------------- |
| **Entry**   | `apps/api-gateway/src/main.ts`; `setGlobalPrefix('api')`    |
| **Pattern** | Gateway controllers proxy/adapt to backend or Nest services |

**Verified gateway controllers:**

| Controller                                 | Path family                                     |
| ------------------------------------------ | ----------------------------------------------- |
| `auth` (dual files under `auth/` and root) | `/api/auth/*`                                   |
| `agent-gateway`                            | `/api/agents/*`                                 |
| `workspace-gateway`                        | `/api/workspaces/*`                             |
| `resources-gateway`                        | `/api/resources/*`                              |
| `marketplace-gateway`                      | `/api/marketplace/*`                            |
| `chat-gateway`                             | `/api/chat/sessions*`                           |
| `mcp-gateway`                              | `/api/mcp/*`                                    |
| `webhook-gateway`                          | `/api/webhooks/*`                               |
| `timeline-gateway`                         | `/api/timeline`, `/api/unified-ledger/timeline` |
| `terminals-gateway`                        | `/api/terminals/graph`                          |
| `system-gateway`                           | `/api/system/mesh-health`, `master-clock`       |
| `sgp-gateway`                              | `/api/sgp/translate/*`                          |
| `ide-gateway`                              | `/api/ide/*`                                    |
| `jules-webhook`                            | `/api/webhooks/incoming/jules/:encodedContext`  |
| `proxy`                                    | `/api/proxy/health`, `services`                 |
| `nexus-observability`                      | `/api/orchestrator/*`, visualizations index     |

**Depends on:** upstream API/backend; JWT via `gateway-auth.guard`.

### 1.3 `apps/backend` — parallel Nest backend

**Entry:** backend Nest bootstrap (separate app). Controllers include:

- `/auth`, `/users`, `/chat`, `/workflows`, `/agents`, `/api/agents`
- `/relay`, `/mcp`, `/api/mcp`, `/admin/mcp`
- `/orchestrator`, `/system`, `/shared-state`, `/mass`
- `/api/agent-registry`, admin suite (`admin/users|metrics|…`)
- `/analytics/default`, nexus observability under `/api`

**Depends on:** Redis services, relay module (`relay.gateway` /
`relay.controller`), MCP module.

### 1.4 Frontend → API client pathway

| Field     | Detail                                                                                                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Entry** | `apps/frontend/src/services/api.ts`, `apiGateway.ts` (`baseUrl: '/api/v1'`), `unifiedLedgerApi.ts`, `resources.service.ts`, `MCPService.ts`, `aiSource.service.ts` (relay `/v1/chat/completions`) |
| **Hops**  | SPA → Vite/proxy or CDN → api-gateway and/or apps/api                                                                                                                                             |
| **Auth**  | Axios/fetch with session/JWT; UI gate `RequireAuth`                                                                                                                                               |

---

## 2. Agent bus / Redis A2A

### 2.1 Shared chokepoint — `RedisAgentClient`

| Field        | Detail                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------- |
| **Entry**    | `scripts/tnf-agent-cli.cjs` → `class RedisAgentClient`; export `{ RedisAgentClient, CONFIG }` |
| **CLI main** | same file argv handler (~L817+) for register/listen/send                                      |

**Channels (`CONFIG.channels`):**

- `tnf:agents`, `tnf:conversations`, `tnf:orchestrator`, `tnf:broker`,
  `tnf:heartbeat`
- `tnf:bus:ingress`, `tnf:bus:egress:{agentId}`, `tnf:direct:{from}:{to}`
- Registry hash: `tnf:agent-registry`

**Inbound pathway:**

```
Redis message
  → subscriber.on('message'|'pmessage')
  → handleIncomingMessage(channel, messageStr)
  → authenticateEnvelope (tnf-message-auth)
  → normalizeIncomingMessage (identity role resolution)
  → [task + TNF_AUTHORITY_CONSUMER] gateAndDispatch
       → tnf-wrapper-authority.gateTask
       → tnf-authority-client.withElevation
       → elevation broker pending + await
  → else dispatchToHandlers
```

**Gates:**

1. **Message auth** (`scripts/lib/tnf-message-auth.cjs`):
   `TNF_MESSAGE_AUTH_MODE` default **`warn`** (unsigned/forged allowed with
   audit); **`enforce`** rejects. Identity-bound roles require Ed25519; HMAC
   shared-secret ≠ identity.
2. **Authority consumer** (`TNF_AUTHORITY_CONSUMER=1|true|on`): default **off**.
   When on, only tasks with explicit `requiredCapabilities`; fail-closed on gate
   errors; denial sends `response` with `elevationRefused`.
3. **Identity** (`tnf-identity.cjs`): elevated self-claim ignored; registry role
   wins when identity-bound.

**Side effects:** Redis publish/subscribe, `tnf:agent-registry` HSET, audit
JSONL under `~/.tnf/authority/`.

### 2.2 Worker wrappers (consumers of chokepoint)

| Wrapper                                 | Entry                                           | Notes                                                          |
| --------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------- |
| `scripts/gemini-redis-wrapper.cjs`      | `GeminiRedisWrapper` + `new RedisAgentClient()` | Handlers for `task`/`event`; authority comment: gated upstream |
| `scripts/jules-redis-wrapper.cjs`       | same pattern                                    |                                                                |
| `scripts/pi-redis-wrapper.cjs`          | same pattern                                    |                                                                |
| `scripts/claude-redis-wrapper.cjs`      | same pattern                                    |                                                                |
| `scripts/antigravity-redis-wrapper.cjs` | same pattern                                    |                                                                |

### 2.3 Alternate thin Redis client (no A2A auth/authority)

| Field       | Detail                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Entry**   | `scripts/lib/redis-agent-client.cjs` — minimal pub/sub, **no** `handleIncomingMessage` / auth / gate                                       |
| **Used by** | `runtime/tnf-director-loop.cjs`, `tnf-swarm-context-bridge.cjs`, `relay-channel-monitor.cjs`, `terminal-heartbeat-pulse.cjs` (via resolve) |

**Gap:** processes using this stub bypass Phase-0 verify and authority consumer.

### 2.4 Other bus participants

- `scripts/redis-ws-bridge.cjs` — WS ↔ `RedisAgentClient`
- `scripts/runtime/green-channel-coordinator.cjs`,
  `federation-channel-broker.cjs`
- `scripts/model-watchdog-failover-consumer.cjs`
- Swarm scripts under `scripts/swarm/*` (many import `packages/tnf-cli/dist`
  RedisAgentClient — separate build artifact path)

### 2.5 Relay ↔ Redis bridge

| Field          | Detail                                                                                             |
| -------------- | -------------------------------------------------------------------------------------------------- |
| **Entry**      | `packages/relay-core/src/redis-relay-bridge.ts` → `RedisRelayBridge`                               |
| **Flow**       | WS message → publish `tnf:bus:ingress` → orchestrator → `tnf:bus:egress:{agentId}` → forward to WS |
| **Depends on** | standalone relay, RedisAgentClient subscribers on ingress/egress                                   |

---

## 3. Authority stack

### 3.1 Module map

| Module            | Path                                                | Role                                                                    |
| ----------------- | --------------------------------------------------- | ----------------------------------------------------------------------- |
| Trust root        | `scripts/lib/tnf-trust-root.cjs`                    | Probe/select strongest available root (`fido2`…`file`); file = degraded |
| Identity          | `scripts/lib/tnf-identity.cjs`                      | Agent keypairs, roles.json, DID                                         |
| Message auth      | `scripts/lib/tnf-message-auth.cjs`                  | Sign/verify HMAC + Ed25519                                              |
| Capability grant  | `scripts/lib/tnf-capability-grant.cjs`              | Issue/verify UCAN-shaped grants                                         |
| Elevation broker  | `scripts/lib/tnf-elevation-broker.cjs`              | `submit` / `decide` / `awaitDecision`; agent cannot `decide`            |
| Credential broker | `scripts/lib/tnf-cred-broker.cjs`                   | Named actions + secrets; 4 fail-closed gates                            |
| Authority client  | `scripts/lib/tnf-authority-client.cjs`              | Agent request/spend API                                                 |
| Wrapper glue      | `scripts/lib/tnf-wrapper-authority.cjs`             | `gateTask`; **default-off**                                             |
| Console           | `scripts/lib/tnf-authority-console.cjs`             | Interactive review UI                                                   |
| Workers helper    | `scripts/lib/tnf-authority-workers.cjs`             | Isolation / relaunch patterns                                           |
| Contracts         | `packages/control-plane-contracts/src/authority.ts` | Types / interfaces                                                      |

### 3.2 Operator CLI pathways

| Entry                         | Symbol / cmds                                                                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `scripts/tnf-authority.cjs`   | `review`, `status`, `list`, `show`, `approve`, `deny`, `confirm-isolation`, `workers`, `relaunch-workers`, `account`, … |
| `packages/tnf-cli/src/cli.ts` | `tnf authority *` → `runAuthorityScript` → above                                                                        |

**Elevation approve pathway:** `tnf authority approve` →
`elevation-broker.decide` → agent-context detection → trust-root sign grant →
write decided + audit → waiting `withElevation` resumes → optional
`cred-broker.invoke`.

**confirm-isolation:** runs denial test (`sudo -u tnf-agent cat operator key`);
refuses marker if readable; keeps trust root degraded until real boundary.

### 3.3 Consumer flag

```
TNF_AUTHORITY_CONSUMER unset/false → gate skipped (zero cost, prior behaviour)
TNF_AUTHORITY_CONSUMER=1|true|on  → task+requiredCapabilities held for elevation; fail-closed
```

Tasks **without** `requiredCapabilities` are never gated even when flag is on
(by design).

### 3.4 Storage / side effects

- `~/.tnf/authority/` (or `TNF_AUTHORITY_DIR`): operator keys, pending/decided
  elevation, `elevation.jsonl`, `broker.jsonl`, `broker-actions.json`, isolation
  marker, audit

---

## 4. TNF CLI entrypoints (`packages/tnf-cli/src/cli.ts`)

**Entry:** Commander `program` in `cli.ts` (large surface).

**High-value command groups (verified `.command` registrations):**

| Group                                               | Purpose                                                    |
| --------------------------------------------------- | ---------------------------------------------------------- | --------- | ------------------- | ------ | -------- | --- | ------------------ |
| `boot`                                              | Boot / triage                                              |
| `onboard`                                           | Onboarding                                                 |
| `authority`                                         | Elevation / trust / isolation / encrypt-rotate             |
| `agents`                                            | list/register/send/orchestrate/convo + `agents live start` |
| `register` / send / listen aliases                  | Agent bus                                                  |
| `relay start                                        | monitor`                                                   | Relay ops |
| `master-clock start                                 | logs                                                       | status`   | Orchestrator daemon |
| `super-cycle event`                                 | Super-cycle                                                |
| `mcp generate                                       | sync                                                       | …`        | MCP utilities       |
| `harness`                                           | Terminal harness lifecycle                                 |
| `doctor`, `ports`, `gate`, `protocol`, `directives` | Ops                                                        |
| `gemini                                             | claude                                                     | pi        | agy                 | cursor | openclaw | …`  | Platform launchers |
| `jules *`                                           | Jules automation                                           |
| `marketplace *`, `ai *`, `forge *`                  | Product surfaces                                           |

**Depends on:** `scripts/tnf-*.cjs`, relay-core package scripts, Redis.

---

## 5. Relay / Master Clock / Broker

### 5.1 Standalone relay

| Field            | Detail                                                                             |
| ---------------- | ---------------------------------------------------------------------------------- |
| **Entry**        | `packages/relay-core/src/standalone-relay.ts` → `TNFRelayServer`; bin `tnf-relay`  |
| **Endpoints**    | `ws://…/ws`, `GET /health`, `/agents`, `/channels` (default port 3000)             |
| **Hops**         | WS connect → JWT auth service → channel/agent registry → optional RedisRelayBridge |
| **Side effects** | In-memory agent/channel state; Redis bridge; stall detector                        |

### 5.2 Master Clock

| Field          | Detail                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------- | ------------- | --- |
| **Entry**      | `packages/relay-core/src/master-clock.ts` → `class MasterClock`; module loads `clock.start()`                                   |
| **npm**        | `pnpm master-clock` / package script `master-clock`                                                                             |
| **Hops**       | RedisClientManager + RelayConnectionManager + ChannelManager + TaskScheduler + SuperCycleScheduler + SelfPrompt + AgentRegistry |
| **Redis keys** | `tnf:master:agents                                                                                                              | heartbeats | channels | tasks:pending | …`  |
| **Gates**      | Stall threshold (~5s), self-prompt cooldown, task queue cooldown                                                                |
| **HTTP deps**  | `LEDGER_API_BASE` → apps/api timeline/ledger                                                                                    |

### 5.3 Broker agent

| Field            | Detail                                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Entry**        | `packages/relay-core/src/broker-agent.ts` → `class BrokerAgent`; `broker.start()` at bottom                                            |
| **npm**          | `broker-agent` script                                                                                                                  |
| **Role**         | Channel/policy dispatch against agent registry; gate decisions allow/deny/quarantine (local policy, **not** TNF authority grant stack) |
| **Side effects** | Redis/Upstash registry updates, task dispatch envelopes                                                                                |

### 5.4 Related

- `director-agent.ts`, `super-cycle-client.ts`, `launchpad.ts`
- Root `package.json`: `"relay"`, `"master-clock"` scripts
- `tnf relay` / `tnf master-clock` CLI wrappers

---

## 6. Frontend page routes

### 6.1 Primary router

| Field              | Detail                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| **Entry**          | `apps/frontend/src/ComprehensiveRouter.tsx` — large `<Routes>` tree                                   |
| **Auth gate**      | `RequireAuth` wrapper for member/admin areas                                                          |
| **Public samples** | `/`, `/landing`, `/pricing`, `/features`, `/docs`, `/marketplace`, `/login`, `/register`, `/auth/*`   |
| **App samples**    | `/dashboard`, `/agents/*`, `/chat`, `/workflows`, `/resources`, `/fairtable`, `/admin`, agency routes |
| **Aliases**        | Many Navigate redirects for catalog parity                                                            |

### 6.2 Modular routes

- `apps/frontend/src/routes/core.routes.tsx` —
  marketing/docs/status/legal/catch-all
- `auth.routes.tsx`, `WorkflowRoutes.tsx`

**Depends on:** API gateway + apps/api; relay for some AI completions.

---

## 7. MCP / extension bridges

| Surface                    | Path                                                                                                                  | Pathway notes                   |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| MCP core                   | `packages/mcp-core`                                                                                                   | `MCPSystemFactory.createServer` |
| MCP packages               | `mcp-cloud-redis-bridge`, `mcp-concordance-server`, `mcp-skills-server`, `mcp-tar-bridge`, `google-sheets-mcp-server` | Package-level servers           |
| App MCP servers            | `apps/mcp-servers/*` (`tnf-network-mcp`, `vision-bridge-mcp`, `gemini-mcp-server.js` WS:3713, `claude-mcp-server.js`) | Process entrypoints             |
| API MCP                    | `apps/api` `TNFMCPModule`, `MCPServerController`; gateway `/api/mcp`                                                  | HTTP management                 |
| Backend MCP                | `apps/backend/src/modules/mcp/*`                                                                                      | Parallel MCP HTTP               |
| Chrome / Gemini bridge ext | `apps/chrome-extension`, `apps/gemini-bridge-extension` (+ `tnf-native-host.cjs`)                                     | Native messaging ↔ TNF          |
| VS Code                    | `apps/vscode-extension`                                                                                               | IDE bridge                      |
| Browser extension          | `apps/browser-extension`                                                                                              |                                 |
| Telegram MCP               | `apps/telegram-mcp`                                                                                                   |                                 |
| Relay MCPTransport         | `packages/relay-core/src/transports/MCPTransport.ts`                                                                  | Transport adapter               |
| CLI                        | `tnf mcp *`                                                                                                           | generate/sync/health            |

---

## 8. Cloud / deploy entrypoints

| Artifact                                          | Role                                                                      |
| ------------------------------------------------- | ------------------------------------------------------------------------- |
| `Dockerfile.api`                                  | API container image                                                       |
| `cloudbuild-api.yaml`                             | Build/push `api-server` to Artifact Registry                              |
| `deployment/`                                     | `a2a-services.yaml`, k8s, network-policy, phase2/3 GCR/k8s scripts        |
| `.github/workflows/deploy.yml`, `gcp-rollout.yml` | CI deploy                                                                 |
| `docker-compose.yml`                              | Local multi-service                                                       |
| Cloudflare dirs                                   | `cloudflare-api-proxy`, `cloudflare-openclaw-*`, `cloudflare-sharedstate` |
| `CLOUD_MIGRATION_BLUEPRINT.md`                    | Migration doc (not runtime)                                               |

---

## Pathway catalogue (structured)

### P01 — Redis A2A inbound (critical)

- **Entry:** `RedisAgentClient.handleIncomingMessage`
- **Hops:** authenticateEnvelope → normalize → [authority gate] → handlers
- **Branches:** message auth mode; authority consumer; own-message skip;
  task-only gate
- **Exit:** handler side effects (LLM prompt, Redis reply); elevation hold files
- **Depends:** wrappers, message-auth, identity, optional authority stack

### P02 — Redis A2A outbound

- **Entry:** `RedisAgentClient.send` / `broadcast` / `command`
- **Hops:** build message → `signMessage` → publish channel
- **Exit:** Redis pub
- **Depends:** identity key / bus secret for signing

### P03 — Authority elevation (opt-in)

- **Entry:** `gateAndDispatch` → `wrapper-authority.gateTask` →
  `authority-client.withElevation`
- **Hops:** submit pending → operator `tnf authority approve/deny` → grant →
  dispatch / refuse
- **Branches:** flag off; no caps; agent context block on decide; trust-root
  degraded warnings
- **Exit:** grant attach `message.authorityGrant` or refusal response + audit

### P04 — Credential broker spend

- **Entry:** `authority-client.useCredential` / `cred-broker.invoke`
- **Gates:** action registry → grant verify → read-only/phase4a → trust-root
  policy
- **Exit:** scrubbed action result; never returns secret; audit JSONL

### P05 — Trust root selection

- **Entry:** `tnf-trust-root` probe/select; CLI
  `authority status|confirm-isolation`
- **Exit:** operator key material; isolation marker; degraded flag for brokers

### P06 — Relay WS plane

- **Entry:** `standalone-relay` / `tnf-relay`
- **Hops:** WS → agents/channels → RedisRelayBridge ingress/egress
- **Depends:** P01 consumers on bus; master-clock relay URL

### P07 — Master Clock orchestration

- **Entry:** `MasterClock.start`
- **Hops:** heartbeat loop → stall detect → task poll → channel broadcast →
  ledger API
- **Exit:** Redis master keys; relay WS messages; metrics

### P08 — Broker-agent dispatch

- **Entry:** `BrokerAgent.start`
- **Hops:** registry read → policy gate → task envelope → worker channels
- **Note:** separate from TNF authority grants

### P09 — HTTP API (apps/api)

- **Entry:** `main.bootstrap` → controllers
- **Gates:** SecurityGuard + SecureAuthGuard (PUBLIC default) + selective
  JwtAuthGuard/RequireAuthLevel
- **Exit:** DB/HTTP/LLM

### P10 — API Gateway edge

- **Entry:** `api-gateway/main` → gateway controllers
- **Exit:** proxied upstream responses

### P11 — Frontend SPA

- **Entry:** `ComprehensiveRouter` + `RequireAuth`
- **Exit:** client navigations; API/relay fetches

### P12 — TNF CLI orchestration

- **Entry:** `packages/tnf-cli/src/cli.ts` commands
- **Exit:** child processes (authority script, wrappers, relay, master-clock)

### P13 — MCP / extensions

- **Entry:** mcp packages/apps; native hosts; gateway `/api/mcp`
- **Exit:** tool invocations; Redis/HTTP bridges

### P14 — Deploy / cloud build

- **Entry:** Cloud Build / GH Actions / Dockerfiles
- **Exit:** container images, k8s manifests

---

## Dead / decorative / fail-closed-by-default

| Item                                     | Status                                                                                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `TNF_AUTHORITY_CONSUMER`                 | **Fail-closed only when enabled**; default **off** → authority path inert in production unless opted in                            |
| Cred broker mutating actions             | **Fail-closed** (phase 4a + weak-root policy) even when stack used                                                                 |
| Elevation `decide()` from agent context  | **Fail-closed** (env/TTY/uid checks; weak under `file` root)                                                                       |
| `TNF_MESSAGE_AUTH_MODE=warn`             | **Not fail-closed** — unsigned traffic allowed with audit                                                                          |
| `scripts/lib/redis-agent-client.cjs`     | **Closed 2026-07-24** — shim delegates to full `RedisAgentClient` (sign outbound A2A; inbound via auth chokepoint)                 |
| SecureAuthGuard default USER             | **Closed 2026-07-24** — fail-closed; PUBLIC is explicit opt-in (`TNF_SECURE_AUTH_DEFAULT=public` emergency only)                   |
| docs `AUTHORITY_INTEGRATION_MAP.md` note | Partially stale: chokepoint **is** wired; still accurate that default-off means grants are not load-bearing until flag + caps used |

---

## Gaps (routes/systems exist without matching enforcement)

1. **Authority not load-bearing until** `TNF_AUTHORITY_CONSUMER=1` **and** tasks
   declare authority-shaped `requiredCapabilities` (`{ with, can }`).
2. **Message auth soft mode** (`warn`) — forge/unsigned still dispatch until
   keypairs exist (`tnf authority provision-keys`) and enforce is flipped.
3. ~~Thin Redis clients bypass A2A auth~~ — **closed** (shim).
4. **Broker skill-string caps vs authority `{with,can}`** — partially aligned:
   broker hoists authority-shaped caps onto task envelope payload; skill strings
   remain routing-only. Full shared policy engine still deferred.
5. ~~HTTP SecureAuthGuard PUBLIC default~~ — **closed** (USER default + PUBLIC
   allowlist on health/auth/public-info/bridges/webhook-incoming).
6. **Dual API surfaces** (apps/api vs apps/backend vs gateway) — gateway still
   uses **opt-in** `GatewayAuthGuard` (no global fail-closed APP_GUARD); parity
   drift risk remains on routes that omit `@UseGuards`.
7. ~~Relay/broker unsigned TNF envelope publishes~~ — **closed** for
   broker-agent dispatch + redis-relay-bridge ingress/egress (via
   `sign-bus-message.ts` → `tnf-message-auth.cjs`). Other publishers
   (master-clock heartbeats, director-agent telemetry) may still be unsigned.

---

## Top 10 critical pathways (ranked)

1. **P01** Redis A2A inbound + auth/authority chokepoint
   (`tnf-agent-cli.handleIncomingMessage`)
2. **P03** Authority elevation hold/approve (when consumer enabled)
3. **P06** Relay WS ↔ Redis bridge (data plane)
4. **P07** Master Clock heartbeat/stall/task orchestration
5. **P09** apps/api Nest HTTP + global security guards
6. **P02** Signed Redis outbound from agents
7. **P08** Broker-agent task dispatch
8. **P11** Frontend SPA + RequireAuth + `/api/v1` clients
9. **P10** api-gateway edge aggregation
10. **P04/P05** Credential broker + trust root (high severity when used; dormant
    until consumer + actions registry)

---

## Artifact paths

- Markdown: `docs/protocols/reports/CODEBASE_PATHWAY_MAP_2026-07-24.md`
- JSON graph: `docs/protocols/reports/CODEBASE_PATHWAY_MAP_2026-07-24.json`

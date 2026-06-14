# The-New-Fuse

AI agent orchestration platform for coordinating multi-agent workflows across
web, mobile, and messaging channels.

Stack: TypeScript/Node.js, React/Vite, PostgreSQL, Redis, Cloud Run (GCP),
Cloudflare, Supabase.

## What this codebase does

Multi-agent swarming platform with bidirectional relay bus, handoff protocol,
and security-envelope validation. TNF coordinates specialist agents (research,
devops, creative, data-science) through a deterministic governance layer — the
Gauntlet of Filters.

Public: thenewfuse.com | App: app.thenewfuse.com | Docs: thenewfuse.com/docs

## Auth shape

- JWT-based session tokens (compact nested JWTs for federation scopes)
- `withAuthentication` HOC for route protection
- `auth.can()` capability checks
- `isTeamAdmin` / `isTenantAdmin` primitives
- HmacSHA256 request signing with `X-Signature` + `X-Session` headers

## Threat model

Highest impact: unauthorized tenant/namespace access, handoff envelope
tampering, AI5 directive injection, agent impersonation via forged federation
scopes. Attackers would target: auth bypass in relay, directive state
manipulation, cross-tenant data leakage.

## Project-specific patterns to flag

- Handoff matrix (`~/.tnf/handoff-current.json`) — governs agent task dispatch
- Envelope validation (Rust-backed, 9500+ env/sec) — security contract for AI
  directives
- AI5 directive conversion pipeline — state machine
  (ready→claimed→running→verified→landed)
- Synaptic Bus (Redis pub/sub) — agent communication channel
- `tnf-cli` commands — entrypoint for all agent operations

## Known false-positives

- `packages/tnf-cli/src/commands/openclaw.ts` — stubs for OAuth device flow
  (intentional no-op in dev)
- `apps/api/src/middleware/backCompatMiddleware.ts` — legacy auth shim
  (deprecated, being removed)
- `data/ingestion-runs/` — test fixtures with mock tokens (non-production)
- `scripts/test-*.sh` — dev scripts with placeholder credentials
- `.env.example` — template only, no secrets

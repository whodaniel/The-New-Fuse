# @the-new-fuse/mcp-cloud-redis-bridge

**MCP server scaffold for the TNF Cloud Redis / Super Director Trust Protocol.**

A stdio-transport MCP server that exposes the Cloud Redis synaptic bus as named
tools (broadcast, verify, read-state, identity bootstrap, terminal access). This
package is the bridge between an MCP client (Hermes, Claude, etc.) and the
TNF Super Director command chain.

## Status

| Layer | State |
|-------|-------|
| Source (`src/`) | present, 4 files |
| Build (`dist/`) | current (2026-06-21) |
| Tools registered | 6 |
| Tests | placeholder (`echo`) |
| Wired into `hermes.mcp.json` | **NO** (manual wire required) |
| Documentation | THIS FILE (previously None) |

## Architecture

```
┌─────────────────────┐    stdio JSON-RPC    ┌──────────────────────────────┐
│  MCP client         │ ◄──────────────────► │  mcp-cloud-redis-bridge      │
│  (Hermes / Claude)  │                      │  (StdioServerTransport)      │
└─────────────────────┘                      │                              │
                                             │  • set_director_identity     │
                                             │  • broadcast_super_director  │
                                             │  • verify_master_clock       │
                                             │  • read_super_cycle_state    │
                                             │  • bootstrap_identity        │
                                             │  • get_terminal_access       │
                                             └─────────────┬────────────────┘
                                                           │ pub/sub
                                                           ▼
                                          ┌────────────────────────────────┐
                                          │  Cloud Redis                   │
                                          │  tnf:bus:ingress               │
                                          │  tnf:master:super-cycle        │
                                          └────────────────────────────────┘
```

## Tools

### set_director_identity
Set the Local Director's NFT identity + keys for signed bus writes.
Inputs: `wallet_address` (req), `nft_id` (req), `signing_private_key_pem` (opt), `encryption_private_key_pem` (opt)

### broadcast_super_director_prompt
Inject a prompt into the Cloud Redis ingress bus as Super Director.
Inputs: `prompt` (req), `targetChannel` (default `global-orchestration`), `priority` (low/medium/high/critical), `invokerAgentId` (req — must be sub-director or orchestration-agent)

### verify_master_clock_signal
Verify + decrypt an envelope received from the Master Clock.
Inputs: `envelope` (req, signed TNFEnvelope)

### read_super_cycle_state
Read `tnf:master:super-cycle` hash from Redis. Inputs: none.

### bootstrap_identity
Generate a fresh NFT-compatible identity (Ed25519 + X25519 keys + placeholder NFT ID).
Inputs: none. Outputs wallet address, nft_id, both PEM keys.

### get_terminal_access
Return the WebSocket URL for the interactive cloud terminal (PTY).
Inputs: none.

## Authorization model

> **⚠️ TNF-P0 CONTAINMENT (2026-08-25).** `set_director_identity` and
> `broadcast_super_director_prompt` are **disabled fail-closed** — both now
> return an `UNAVAILABLE` error unconditionally. See the incident note below
> and the comments at their call sites in `src/index.ts`.
>
> The prior model let any MCP client call `set_director_identity` with a
> self-declared `wallet_address`/`nft_id` (no verification of any kind),
> then use that self-asserted identity to authorize
> `broadcast_super_director_prompt` — gated only by a caller-supplied
> `invokerAgentId` string and a non-cryptographic "signature"
> (`` `nft-authorized:${nft_id}` ``, a template literal, never verified by
> anything downstream). Any caller could therefore manufacture a
> `SUPER_DIRECTOR_INJECTION` envelope on the shared ingress bus. Confirmed at
> the source level 2026-08-25; not found wired into any deployed MCP client
> config in this repo or on the auditing machine at the time of discovery —
> see the incident receipt for the full reachability finding. Re-enabling
> either tool requires real proof-of-possession or an operator-issued
> `CapabilityGrant` (`packages/control-plane-contracts/src/authority.ts`),
> never a request field, env var, or claimed role/NFT id.

- `set_director_identity` — **disabled.** Previously: any client may call (no auth required, just sets in-memory identity).
- `broadcast_super_director_prompt` — **disabled.** Previously: required prior `set_director_identity` AND `invokerAgentId` ∈ {sub-director, orchestration-agent} — both caller-controlled.
- `verify_master_clock_signal` — REQUIRES encryption private key set on the active identity (only reachable via the operator's boot-time `LOCAL_SUBDIRECTOR_*` env vars now that `set_director_identity` is disabled).
- All other tools — read-only / self-bootstrap (no authorization check).

The in-memory `authorizedIdentity` object is the only gate. This is single-process,
single-client. Multi-tenant auth is **not** in scope of this scaffold.

## Build

```bash
pnpm --filter @the-new-fuse/mcp-cloud-redis-bridge build
```

Produces `dist/index.js` (ESM, type: module).

## Run (standalone smoke test)

```bash
# uses stdin JSON-RPC; prints to stdout
node ./dist/index.js
```

## Wire into Hermes MCP registry

Add this entry to `data/mcp_config.json` and regenerate `hermes.mcp.json`:

```json
{
  "mcpServers": {
    "tnf-cloud-redis-bridge": {
      "command": "pnpm",
      "args": [
        "exec",
        "tsx",
        "packages/mcp-cloud-redis-bridge/src/index.ts"
      ]
    }
  }
}
```

Then run:
```bash
node scripts/tnf-generate-mcp-clients.cjs
```

The bridge will register as `name: "mcp-cloud-redis-bridge"` with `version: "1.0.0"`.

## Environment

| Var | Default | Required by |
|-----|---------|-------------|
| `CLOUD_REDIS_URL` | `redis://localhost:6379` | All tools |
| `LOCAL_SUBDIRECTOR_NFT_ID` | unset | Auto-bootstrap identity on startup |
| `LOCAL_SUBDIRECTOR_WALLET_ADDRESS` | unset | Auto-bootstrap identity on startup |
| `LOCAL_SUBDIRECTOR_SIGNING_KEY_PEM` | unset | Auto-bootstrap identity on startup |
| `LOCAL_SUBDIRECTOR_ENCRYPTION_KEY_PEM` | unset | Auto-bootstrap identity on startup |
| `CLOUD_RUNTIME_PUBLIC_DOMAIN` | `tnf-cloud-sandbox-production.thenewfuse.com` | `get_terminal_access` |

If the four `LOCAL_SUBDIRECTOR_*` vars are present at startup, the server
auto-loads them into `authorizedIdentity`. Otherwise the server boots with no
identity and only the unauthenticated tools function until `set_director_identity`
is called.

## Source map

```
src/
├── index.ts         # MCP server bootstrap, 6 tools, schema, transport
├── RedisClient.ts   # mysql/redis pub/sub + hgetall wrapper
├── crypto.ts        # SecurityService.generateNodeKeys / verifyAndDecryptSignal
└── types.ts         # TNFEnvelope, MasterClockSignalEnvelope
```

## Pitfalls / known gaps

- **Single-process state.** `authorizedIdentity` lives in memory only. Restart = re-authorize.
- **No narration logging.** Bus publishes go straight to Redis with NO audit trail in this server.
- **Ed25519 sign/verify is stubbed.** `crypto.ts` produces/verifies PKCS8 PEM keys but the broadcast path only set `sig = 'nft-authorized:<nft_id>'` rather than a real cryptographic signature — this is *why* `broadcast_super_director_prompt` is now disabled (see Authorization model above).
- **No retry / no backoff.** If Redis is down at connect time, the server exits.
- **Stdio blocking on SIGPIPE.** A misbehaving MCP client that closes stdin ends the server.

## Related packages

- `@the-new-fuse/mcp-core` — core MCP utilities (different package).
- `packages/relay-core/src/broker-agent.ts` — consumes from `tnf:master:tasks:realtime` (NOT from this server).
- `scripts/agents/hermes-tnf-a2a-bridge.py` — Python sibling bridge (Hermes → TNF).

## License

Internal — The New Fuse.

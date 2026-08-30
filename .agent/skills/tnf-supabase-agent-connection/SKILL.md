---
name: tnf-supabase-agent-connection
category: tnf-platform
department: tech
description:
  Use when an agent needs to understand, verify, repair, or claim Supabase
  access through TNF. Covers Codex Supabase MCP OAuth, TNF Supabase client
  environment, connection assurance levels, and safe verification boundaries.
---

# TNF Supabase Agent Connection

Use this skill before an agent claims it can use Supabase, before repairing a
Supabase MCP OAuth failure, or before routing Supabase-dependent work to another
agent.

## Connection Planes

Keep these separate:

- Codex MCP plane: `codex mcp` owns OAuth credentials for the remote Supabase
  MCP server. TNF may launch the OAuth callback, but must not parse or print
  Codex token files.
- TNF data plane: app and script access through `SUPABASE_URL` plus
  `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `SUPABASE_KEY`.
- Database safety plane: migrations, SQL, RLS, and destructive database actions
  require explicit operator authorization and the normal Supabase RLS/security
  gates.

## Assurance Ladder

1. Inspect without mutating:

   ```bash
   tnf mcp supabase-agent-check --json --write
   ```

2. If the report says `codex-mcp-oauth-configured`, the server is configured and
   OAuth-capable, but the current agent still needs a live tool proof before
   claiming query access.

3. If OAuth refresh or callback is broken, run the operator-authorized repair:

   ```bash
   tnf mcp supabase-agent-check --login --write
   ```

   This delegates to `tnf mcp codex-login supabase`, opens the OAuth URL, and
   waits for Codex to exit.

4. If the agent runtime exposes Supabase MCP tools, perform one harmless
   read-only proof after login, such as a docs/account/list-style tool call.
   Record the command/tool name and result in the handoff. Do not use writes as
   a connection proof.

5. For app/data-plane work, require `dataPlaneReady=true` in the report or
   verify the specific service command that will run. Do not print key values.

## Required Evidence Before Claiming Success

The agent may say "Supabase MCP is configured" when:

- `tnf mcp supabase-agent-check --json` reports
  `assurance=codex-mcp-oauth-configured`, or
- the written report at
  `docs/protocols/reports/SUPABASE_AGENT_CONNECTION_LATEST.json` shows the same.

The agent may say "OAuth callback completed this session" only when:

- `tnf mcp supabase-agent-check --login --write` reports
  `assurance=oauth-flow-completed`.

The agent may say "this agent has working Supabase tool access" only after a
harmless read-only Supabase MCP tool call succeeds in the same agent runtime.

## Commands

```bash
tnf mcp supabase-agent-check --json
tnf mcp supabase-agent-check --write
tnf mcp supabase-agent-check --login --write
tnf mcp codex-login supabase
codex mcp get supabase
codex mcp list
```

For Codex startup with opt-in OAuth callback handling:

```bash
TNF_CODEX_MCP_AUTO_LOGIN=supabase pnpm run tnf:start:codex
```

## Safety Rules

- Do not read, parse, print, copy, or commit Codex OAuth token files.
- Do not logout/login, rotate credentials, or change Supabase config unless the
  operator explicitly authorized credential handling.
- Do not claim success from `codex mcp get` alone; it proves configuration, not
  usable agent access.
- Do not run SQL writes, migrations, storage writes, or edge-function writes as
  a connection proof.
- If Supabase-sensitive paths changed, run the strict RLS gate before handoff:

  ```bash
  pnpm run supabase:rls:audit:strict
  ```

## Handoff Format

When Supabase connection is relevant, include:

- assurance value from `tnf mcp supabase-agent-check`
- report path if `--write` was used
- whether OAuth login was attempted
- name of any read-only Supabase MCP tool proof
- remaining boundary, for example "configured but not live-tool-proven"

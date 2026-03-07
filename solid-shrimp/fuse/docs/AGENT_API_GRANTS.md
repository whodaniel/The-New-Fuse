# Agent API Grants (Delegated API Access)

This system allows a user to grant limited API usage to an agent without
exposing raw provider keys.

## Overview

- User stores provider keys via `POST /api/provider-keys`.
- User creates scoped grants via `POST /api/agent-grants`.
- System returns a short-lived grant bearer token.
- Agent uses grant token with `POST /api/agent-proxy/:provider`.
- Backend injects real provider key server-side and enforces limits.

## How to use (UI)

User can manage these in **Settings > API & Integrations**:

1.  **Add a Provider Key**: Enter the provider name (e.g. `openai`) and your
    secret key. This is encrypted at rest using AES-256-GCM.
2.  **Configure a Grant**:
    - **Agent ID**: The unique identifier for the agent.
    - **Usage Controls**:
      - **Max Req/Min**: Throttles requests if the agent exceeds this rate.
      - **Daily Token Limit**: Hard cap on total tokens used per 24h.
      - **Monthly Budget ($)**: Financial cap for the current calendar month.
    - **Allowed Models**: (Optional) Comma-separated list of model strings to
      restrict access to.
    - **Expiry**: Set when the delegated token should automatically invalidate.
3.  **Deploy**: Copy the generated token and provide it to the agent. The agent
    should put this in the `Authorization: Bearer <token>` header when calling
    the proxy.

## Grant Controls (Technical)

Each grant supports:

- `agentId`
- `provider`
- `allowedModels[]`
- `maxRequestsPerMinute` (Enforced via Redis/Memory sliding window)
- `dailyTokenBudget` (Checked before each proxied request)
- `monthlyUsdCap` (Stored in cents, checked against estimated costs)
- `expiresAt` (JWT expiration + database check)
- revoke (`/api/agent-grants/:id/revoke`)
- rotate token (`/api/agent-grants/:id/rotate`)

## Endpoints

- `GET /api/agent-grants`: List all active/revoked grants.
- `POST /api/agent-grants`: Create a new grant.
- `POST /api/agent-grants/:id/revoke`: Immediate cancellation.
- `POST /api/agent-grants/:id/rotate`: Issue new token, invalidate old ones.
- `POST /api/agent-proxy/:provider`: The actual proxy endpoint for agents.

## Token Format

Grant tokens are JWTs signed with `JWT_SECRET` and include:

- `typ = "agent-grant"`
- `sub` (user id)
- `gid` (grant id)
- `aid` (agent id)
- `prv` (provider)
- `tv` (token version)

On rotation, `tokenVersion` increments and old tokens are rejected.

## Logging

Usage is recorded in:

- `agent_api_grant_usage`: Detailed line-item logging of every request, tokens
  used, and estimated cost.
- `api_logs`: Standard request metadata.

## Migration

Apply:

- `packages/database/migrations/add_provider_api_keys_table.sql`
- `packages/database/migrations/add_agent_api_grants.sql`

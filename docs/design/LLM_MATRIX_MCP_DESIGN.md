# LLM Matrix MCP Server (API Provider & Credential Distribution)

## Overview

A centralized MCP Server designed to manage, distribute, and optimize the
utilization of LLM API resources (Providers, Models, Credentials, Rate Limits,
Costs) across all deployed agents in The New Fuse (TNF), OpenClaw, and Hermes.

## Goals

- **Unified Credential Access:** Ensure authorized agents automatically retrieve
  necessary authentication credentials (API keys, OAuth tokens) without
  hardcoded values or manual crawling.
- **Dynamic Model Distribution:** Provide an intelligent matrix that routes
  requests based on agent task requirements, provider cost, rate limits, and
  model capabilities.
- **Proactive Resource Seeking:** Automatically alert the human operator (via
  Telegram, WhatsApp, CLI, and browser tabs) when new or expired API keys are
  needed.
- **Cost & Quota Tracking:** Monitor token usage and costs across the entire
  swarm to prevent budget overruns and optimize the use of free/high-tier
  resources (e.g., Perplexity Pro, Cerebras, SambaNova).

## Architecture

### Components

1. **Credential Vault (Upstash/Postgres):** Securely stores encrypted API keys.
   Integrates with the existing `providerApiKeys` schema.
2. **Provider Health & Rate Limit Monitor:** Tracks the real-time status of APIs
   (e.g., OpenAI, Anthropic, OpenRouter, Kilo, Perplexity, Cerebras).
3. **Task-to-Model Router:** An intelligent router that matches an agent's
   intent (e.g., "fast coding", "deep reasoning", "web research") to the best
   available model in the matrix.
4. **Proactive Alerting Module:** Scans for missing credentials and uses the TNF
   Envelope Protocol to push multi-channel notifications to the user, including
   opening browser tabs to the exact billing/API key pages.

### MCP Interface

The server exposes the following MCP tools and resources to authorized agents:

- **Tools:**
  - `request_model_allocation(task_type: string, required_context: number)` ->
    Returns optimal provider/model ID and temporary access token.
  - `report_rate_limit(provider: string)` -> Flags a provider as temporarily
    unavailable.
  - `request_credential(service: string)` -> Retrieves the encrypted credential
    for authorized agents.
  - `trigger_proactive_key_hunt(service: string)` -> Notifies the user to
    provide a missing key.

- **Resources:**
  - `llm://matrix/status` -> Real-time JSON of all healthy providers and
    available models.
  - `llm://matrix/costs` -> Current usage costs mapped by agent persona.

## Perplexity Pro Integration

As part of the matrix, the `perplexity/sonar-pro` model is tagged as a
"High-Priority Daily Asset."

- A dedicated cron scheduler invokes Perplexity Pro multiple times daily for
  deep research tasks, environmental scans, and market intelligence gathering.
- The Matrix ensures this quota is fully utilized before the end of the year.

## Implementation Steps

1. **Scaffold MCP Server:** Create `@the-new-fuse/mcp-llm-matrix` package.
2. **Database Integration:** Connect to the `providerApiKeys` table.
3. **Router Logic:** Implement the selection algorithm based on OpenClaw's
   existing fallback chain structure.
4. **Alerting Hooks:** Integrate with the `telegram` and `whatsapp` plugins for
   missing key notifications.

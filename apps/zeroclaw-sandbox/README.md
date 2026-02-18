# ZeroClaw Sandbox (Anthropic OAuth + TNF Protocol)

This service provides an **AIEOS-compliant** agent sandbox within the TNF
network, powered by **Anthropic Opus 4.0** and **Claude 3.7 Sonnet** using
interactive OAuth authentication.

## 🚀 Live Agent Details

- **Agent ID:** `zeroclaw-railway-01`
- **Role:** `zeroclaw-sandbox`
- **Protocol:** AIEOS (Standard TNF)
- **Primary LLM:** `claude-4-opus-20250514` (Opus 4)
- **Fallback LLM:** `claude-3-7-sonnet-20250219`
- **Auth Method:** Anthropic OAuth (via Antigravity/Claude Code)
- **Status Endpoint:**
  `https://zeroclaw-sandbox-production.up.railway.app/health`

## 🔐 Authentication Setup

This service uses **interactive OAuth tokens** extracted from your local macOS
keychain. This eliminates the need for manual API key management and uses your
existing **Anthropic Pro** subscription.

### How it works:

1. The deployment script extracts the `accessToken` and `refreshToken` from the
   `Claude Code-credentials` keychain entry.
2. These are set as `ANTHROPIC_ACCESS_TOKEN` on Railway.
3. The entrypoint script injects these into a virtual `auth-profiles.json` and
   exports `ANTHROPIC_OAUTH_TOKEN` for the Anthropic provider.

### Refreshing Tokens:

If the agent reports `authentication_error` or `401`, the OAuth token may have
expired. To refresh:

1. Run any command in your local `claude` (Claude Code) CLI to trigger a silent
   refresh.
2. Run the following command to update Railway:
   ```bash
   # Re-run the variables update
   AnthropicOAuth=$(security find-generic-password -s "Claude Code-credentials" -a "danielgoldberg" -w)
   ACCESS_TOKEN=$(echo $AnthropicOAuth | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['claudeAiOauth']['accessToken'])")
   railway variable set "ANTHROPIC_ACCESS_TOKEN=$ACCESS_TOKEN" "ANTHROPIC_OAUTH_TOKEN=$ACCESS_TOKEN"
   ```

## 🛠 Usage

### Webhook Interaction

Send prompts to the agent via the public webhook:

```bash
curl -X POST https://zeroclaw-sandbox-production.up.railway.app/webhook \
  -H "Content-Type: application/json" \
  -d '{"message": "Identify yourself and your role in the TNF network."}'
```

### Heartbeat Tracking

The agent automatically sends heartbeats to the TNF Orchestration worker:  
`https://tnf-agent-orchestration.bizsynth.workers.dev/agent/heartbeat`

## 🏗 Infrastructure Details

- **Provider:** `anthropic`
- **Beta Header:** `oauth-2025-04-20`, `adaptive-thinking-2026-01-28`
- **Railway Port Binding:** Dynamically bound to `$PORT` (internal 3000)
- **Runtime:** Native execution with supervised autonomy

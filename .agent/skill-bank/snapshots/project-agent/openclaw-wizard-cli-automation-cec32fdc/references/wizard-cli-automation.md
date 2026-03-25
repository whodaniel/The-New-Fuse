# OpenClaw Wizard CLI Automation Reference

Source page: `https://docs.openclaw.ai/start/wizard-cli-automation`

## Core Rule

Use `--non-interactive` for automation.  
`--json` does not imply non-interactive mode.

## Baseline Automation Template

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills \
  --json
```

## Secret Input Modes

- `plaintext`: stores raw keys.
- `ref`: stores env-backed key refs in auth profiles.

`ref` mode notes:
- matching provider env var must exist in process environment.
- inline key flags without matching env vars should fail fast.

## Provider Auth Choice Matrix

Supported examples from docs:
- `gemini-api-key`
- `zai-api-key`
- `ai-gateway-api-key`
- `cloudflare-ai-gateway-api-key`
- `moonshot-api-key`
- `mistral-api-key`
- `synthetic-api-key`
- `opencode-zen`
- `custom-api-key`

## Custom Provider Non-Interactive Template

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-provider-id "my-custom" \
  --custom-compatibility anthropic \
  --custom-api-key "$CUSTOM_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback
```

Ref mode variant:

```bash
export CUSTOM_API_KEY="your-key"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-provider-id "my-custom" \
  --custom-compatibility anthropic \
  --secret-input-mode ref \
  --gateway-port 18789 \
  --gateway-bind loopback
```

## Additional Agent Automation

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.2 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

This writes agent identity/workspace metadata and can add inbound bindings.

What it sets:
- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Section notes:
- Running without `--workspace` launches the wizard.
- Default workspaces follow `~/.openclaw/workspace-<agentId>`.
- Non-interactive flags include `--model`, `--agent-dir`, `--bind`, and `--non-interactive`.

## Validation Checklist

Run:

```bash
openclaw health
openclaw status --deep
```

Verify:
- command exited successfully
- expected JSON summary fields present
- expected `~/.openclaw/openclaw.json` keys updated
- expected agent/auth/session files exist

## Related Docs

- Wizard hub: `https://docs.openclaw.ai/start/wizard`
- Wizard full reference: `https://docs.openclaw.ai/start/wizard-cli-reference`
- Command reference: `https://docs.openclaw.ai/cli/onboard`

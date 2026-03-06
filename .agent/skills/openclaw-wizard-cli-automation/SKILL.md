---
name: openclaw-wizard-cli-automation
description: Automate OpenClaw onboarding and agent creation with non-interactive CLI flows from the wizard automation guide, including provider-specific auth flags, secret input modes, gateway settings, JSON output, and add-another-agent setup. Use when users ask for scripts or commands around `openclaw onboard --non-interactive`, `openclaw agents add`, CI/bootstrap automation, or safe secrets handling from https://docs.openclaw.ai/start/wizard-cli-automation.
---

# OpenClaw Wizard CLI Automation

## Overview

Generate repeatable, machine-safe onboarding commands for OpenClaw. Focus on deterministic non-interactive flags, explicit credential source handling, and post-run verification.

## Workflow

1. Choose automation target: local onboarding, remote attach, or additional agent setup.
2. Build non-interactive command with explicit required flags.
3. Select secret mode (`plaintext` vs `ref`) and validate prerequisites.
4. Apply provider-specific auth flag set.
5. Add optional runtime and daemon flags.
6. Run with `--json` when machine-readable output is needed.
7. Validate resulting config and runtime health.

## Step 1: Build the Base Command

Always include:
- `openclaw onboard --non-interactive`
- `--mode <local|remote>`
- Auth choice and required provider flags
- Gateway bind/port where applicable

Add `--json` when script pipelines consume output.

## Step 2: Select Secret Input Mode

- `--secret-input-mode plaintext`: stores raw key values.
- `--secret-input-mode ref`: stores env-backed references in auth profiles.

Rules for `ref` mode:
- Ensure matching provider env vars are set before execution.
- Inline key flags without matching env vars should be treated as failure-prone.
- Use `--accept-risk` only when user explicitly accepts reduced safeguards.

## Step 3: Apply Provider Branch

Map auth choices to required flags exactly as documented:
- `openai-api-key`
- `gemini-api-key`
- `zai-api-key`
- `ai-gateway-api-key`
- `cloudflare-ai-gateway-api-key`
- `moonshot-api-key`
- `mistral-api-key`
- `synthetic-api-key`
- `opencode-zen`
- `custom-api-key`

For custom provider automation, include:
- `--custom-base-url`
- `--custom-model-id`
- `--custom-provider-id` (optional but recommended)
- `--custom-compatibility <openai|anthropic>`

## Step 4: Add Optional Runtime Controls

Common flags:
- `--install-daemon`
- `--daemon-runtime node`
- `--skip-skills`

Prefer `node` runtime in onboarding automation unless user explicitly requests otherwise.

## Step 5: Automate Multi-Agent Setup

Use `openclaw agents add <name>` with explicit flags for non-interactive creation:
- `--workspace`
- `--model`
- `--bind`
- `--non-interactive`
- `--json`

Provide this baseline template:

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.2 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Call out that each added agent gets its own workspace, sessions, and auth profiles.
Call out that running without `--workspace` launches the wizard.
Call out that default workspaces follow `~/.openclaw/workspace-<agentId>`.
Call out that non-interactive flags include `--model`, `--agent-dir`, `--bind`, and `--non-interactive`.
Call out that adding `bindings` routes inbound messages.
Call out that this operation sets:
- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

## Step 6: Verify Results

After automation run, check:
- onboarding command exit status
- machine-readable summary when `--json` used
- expected config/auth files updated
- `openclaw health` and optionally `openclaw status --deep`

## Reference Loading

- Load [references/wizard-cli-automation.md](references/wizard-cli-automation.md) for canonical command templates and provider matrix.
- Reload `https://docs.openclaw.ai/start/wizard-cli-automation` when user asks for latest flags.

## Output Requirements

When helping users, always provide:
1. Runnable command block (copy/paste safe).
2. Required environment variables list.
3. Expected files/keys changed by the run.
4. Validation commands and rollback option.

---
name: openclaw-wizard-cli-reference
description: Execute and troubleshoot OpenClaw CLI onboarding from the official wizard reference, including local vs remote flows, reset scopes, auth/model selection, daemon choices, channel setup, and onboarding outputs. Use when users ask about `openclaw onboard`, onboarding flags, recovery from bad onboarding state, or interpreting wizard behavior from https://docs.openclaw.ai/start/wizard-cli-reference.
---

# OpenClaw Wizard CLI Reference

## Overview

Provide a deterministic playbook for `openclaw onboard` and related onboarding decisions. Prioritize safe reset handling, explicit auth/provider configuration, and post-onboarding verification.

## Workflow

1. Determine target mode: local onboarding or remote gateway attach.
2. Assess existing config and select reset scope safely.
3. Configure auth/provider and default model.
4. Configure workspace, gateway, channels, daemon.
5. Run health checks and confirm saved outputs.
6. Apply troubleshooting branch if onboarding fails.

## Step 1: Select Onboarding Mode

- Use local mode when onboarding this machine end-to-end.
- Use remote mode when this machine should connect to a gateway hosted elsewhere.
- In remote mode, never claim remote host changes were performed.

## Step 2: Handle Existing Config Safely

- If `~/.openclaw/openclaw.json` exists, choose Keep, Modify, or Reset explicitly.
- Use reset only with stated scope:
  - `config`
  - `config+creds+sessions` (default CLI reset behavior)
  - `full` (also workspace removal)
- If config is invalid or legacy, run `openclaw doctor` before continuing.

## Step 3: Configure Auth and Model

- Guide user through provider choice and required credentials.
- Preserve clear mapping between chosen auth method and resulting model default.
- For API key reference mode, validate env refs before claiming success.
- If user is headless, advise OAuth completion on a browser-capable machine and credential copy.

## Step 4: Configure Runtime and Channels

- Workspace: use default or explicit path.
- Gateway: confirm bind/auth/tailscale and keep auth enabled unless user explicitly accepts risk.
- Channels: configure requested channel tokens/credentials and call out pairing approval flow where relevant.
- Daemon: choose LaunchAgent (macOS) or systemd user unit (Linux/WSL2).

## Step 5: Verify Onboarding Results

Run and interpret:
- `openclaw health`
- `openclaw status --deep`

Confirm key outputs:
- `~/.openclaw/openclaw.json` updates
- credential/profile files
- wizard metadata fields
- session and channel credential paths when configured

## Troubleshooting Branches

- Invalid/legacy config blocks onboarding: run `openclaw doctor`, fix, rerun onboarding.
- GUI unavailable: provide SSH port-forward instructions instead of browser-open expectation.
- Missing Control UI assets: build fallback path and continue onboarding.
- Auth succeeds but model fails check: verify provider/model pair and auth source.

## Reference Loading

- Start with [references/wizard-cli-reference.md](references/wizard-cli-reference.md) for command, flow, and path details.
- Reload `https://docs.openclaw.ai/start/wizard-cli-reference.md` when user asks for latest or exact wording.

## Output Requirements

When assisting users, always include:
1. Exact onboarding commands/flags to run next.
2. Expected files or config keys that should change.
3. Verification commands and success criteria.
4. Lowest-risk rollback/reset option.

---
name: openclaw-assistant-setup
description: Set up and harden an OpenClaw personal assistant using the official two-phone WhatsApp flow, safe allowlist defaults, workspace bootstrap, session behavior, and heartbeat controls. Use when users ask to install, configure, verify, or troubleshoot OpenClaw as a personal assistant (especially from https://docs.openclaw.ai/start/openclaw), including edits to ~/.openclaw/openclaw.json and operational checks.
---

# OpenClaw Assistant Setup

## Overview

Configure OpenClaw as a personal assistant with secure defaults and a reproducible workflow. Keep setup conservative first, then enable proactive features after baseline behavior is verified.

## Workflow

1. Confirm intent and environment.
2. Apply safe baseline config (allowlist + no proactive heartbeat).
3. Run pairing and gateway startup.
4. Validate message flow and dashboard/auth.
5. Tune persona, session lifecycle, and heartbeat.
6. Perform operations checks and summarize next actions.

## Step 1: Confirm Setup Constraints

Require:
- OpenClaw installed and onboarded.
- Dedicated assistant phone number (do not link the user's personal number).
- Explicit WhatsApp sender allowlist in config before testing.

If prerequisites are missing, stop and guide the user to complete them first.

## Step 2: Apply Safe Baseline Config

Edit `~/.openclaw/openclaw.json` with conservative defaults:
- Set `channels.whatsapp.allowFrom` to known user numbers only.
- Set `agent.heartbeat.every` to `"0m"` until behavior is trusted.
- Keep workspace explicit (`agent.workspace`) when user wants non-default location.

Prefer this minimum:

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"]
    }
  },
  agent: {
    heartbeat: { every: "0m" }
  }
}
```

## Step 3: Pair and Start OpenClaw

Run:
- `openclaw channels login` (scan QR with assistant phone)
- `openclaw gateway --port 18789` (keep running)

If onboarding indicates dashboard auth is required, use `gateway.auth.token` in Control UI settings.

## Step 4: Verify End-to-End Behavior

Validate:
- Allowlisted sender can reach assistant.
- Non-allowlisted sender is rejected.
- `/new` and `/reset` start a fresh session.
- Session files and metadata exist in expected `.openclaw` session paths.

## Step 5: Tune Assistant Behavior

Apply user-specific tuning:
- Persona and policy in `SOUL.md`.
- Group mention behavior (`channels.whatsapp.groups` + `routing.groupChat.mentionPatterns`).
- Session reset cadence (`session.reset` fields).
- Re-enable heartbeat (`"30m"` or user-selected interval) only after baseline confidence.

## Step 6: Run Operational Checks

Run:
- `openclaw status`
- `openclaw status --all`
- `openclaw status --deep`
- `openclaw health --json`

Use results to identify gateway, auth, or channel issues before changing core config again.

## Troubleshooting Rules

- Do not proceed with open inbound access if `allowFrom` is absent.
- If user linked personal WhatsApp by mistake, stop and re-pair with dedicated assistant number.
- If heartbeat causes noisy/expensive behavior, set `agent.heartbeat.every: "0m"` and retest manually.
- If session history appears stale/confused, issue `/reset` and test with a fresh message.

## Reference Loading

- Load [references/openclaw-personal-assistant.md](references/openclaw-personal-assistant.md) at start for command snippets and known-safe defaults.
- Load `https://docs.openclaw.ai/start/openclaw.md` if the user asks for strict parity with latest docs wording.

## Output Requirements

When helping a user, always return:
1. Exact commands to run next.
2. Config diff or full snippet for `~/.openclaw/openclaw.json`.
3. Validation checklist with expected results.
4. Rollback/safety step (usually disable heartbeat and keep allowlist).

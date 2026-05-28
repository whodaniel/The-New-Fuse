---
name: openclaw-onboarding-wizard
description: Guide OpenClaw onboarding via `openclaw onboard` with QuickStart vs Advanced decisions, local vs remote mode, secure defaults, reconfiguration flows, and post-onboarding checks. Use when users ask to set up OpenClaw from scratch, choose onboarding defaults, re-run or reset onboarding safely, or configure additional agents from the wizard docs at https://docs.openclaw.ai/start/wizard.
---

# OpenClaw Onboarding Wizard

## Overview

Run the onboarding wizard with clear decision points and safe defaults. Keep setup deterministic by stating mode, auth flow, gateway exposure, and verification commands.

## Workflow

1. Choose onboarding path: QuickStart or Advanced.
2. Choose mode: local gateway setup or remote gateway connection.
3. Confirm auth/model and workspace choices.
4. Configure gateway, channels, daemon, and skills.
5. Validate health and runtime behavior.
6. Provide reconfiguration and reset-safe follow-up steps.

## Step 1: Start Wizard

Run:
- `openclaw onboard`

For quick browser-first testing without channels:
- `openclaw dashboard`

## Step 2: Select Setup Branch

- QuickStart: prefer documented defaults (loopback bind, token auth, port `18789`).
- Advanced: expose full controls for mode, workspace, gateway, channels, daemon, skills.

Explicitly call out:
- `--json` alone does not make onboarding non-interactive.
- For scripts, use `--non-interactive`.

## Step 3: Apply Safe Defaults

Default posture:
- Keep gateway auth token enabled.
- Keep loopback bind unless user explicitly needs network exposure.
- Use DM isolation defaults and allowlist-first behavior for messaging channels.
- Use stronger modern models for tool-executing agents when possible.

## Step 4: Handle Re-runs and Reset

Re-running wizard is non-destructive unless reset is chosen.

If reset is needed, state scope before execution:
- default reset behavior: config + credentials + sessions
- full reset includes workspace

If invalid or legacy config blocks onboarding:
- run `openclaw doctor` before continuing.

## Step 5: Support Additional Agents

Use:
- `openclaw agents add <name>`

Explain that each agent has separate workspace, sessions, and auth profiles.

## Step 6: Validate

Run:
- `openclaw health`
- `openclaw status --deep`

Confirm:
- gateway reachable and authenticated
- expected config keys written
- channel/auth setup behaves as intended

## Reference Loading

- Load [references/onboarding-wizard.md](references/onboarding-wizard.md) first for documented defaults and command set.
- Load `https://docs.openclaw.ai/start/wizard.md` when user requests latest behavior or exact wording.

## Output Requirements

When helping users, always include:
1. Next commands to run.
2. Chosen branch and key assumptions (QuickStart/Advanced, local/remote).
3. Expected config or files changed.
4. Validation and rollback/reset-safe option.

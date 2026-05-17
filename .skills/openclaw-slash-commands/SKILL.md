---
name: openclaw-slash-commands
description: Reference for OpenClaw gateway commands and OAuth interactive slash commands. Use this when managing multi-channel routing or authenticating agents with third-party providers.
---

# OpenClaw & OAuth Slash Commands

OpenClaw manages agent identities and cross-channel communication.

## CLI Commands
- `openclaw agents bind`: Link an agent to a specific channel (e.g., WhatsApp).
- `openclaw message send`: Manually route a message through the gateway.
- `openclaw --dev gateway`: Start a development instance of the OpenClaw gateway.

## OAuth Interactive Slash Commands
- `/oauth-login`: Initiates OAuth authentication for a provider.
- `/oauth-order`: Manages the priority/order of OAuth credentials.
- `/oauth-paste-token`: Manages pasting of long-lived session tokens.
- `/oauth-provider-matrix`: Displays the status and health of all configured OAuth providers.

## OpenClaw Interactions
- `/agent`: Switch or reconfigure the active OpenClaw persona.
- `/channel`: View or manage connected messaging channels.

# OpenClaw Wizard CLI Reference

Source page: `https://docs.openclaw.ai/start/wizard-cli-reference.md`

## Primary Command

```bash
openclaw onboard
```

This is the full CLI onboarding flow. It supports local mode (default) and remote mode.

## Modes

- Local mode configures this machine: model/auth, workspace, gateway, channels, daemon, health, skills.
- Remote mode configures this machine to connect to a remote gateway and does not modify the remote host.

## Existing Config and Reset

- If `~/.openclaw/openclaw.json` exists, wizard supports Keep, Modify, Reset.
- Re-run is non-destructive unless user chooses Reset or passes `--reset`.
- Reset scopes:
  - `config`
  - `config+creds+sessions` (default reset scope)
  - `full` (includes workspace)
- If config is invalid/legacy, run `openclaw doctor` first.

## Auth and Model Highlights

- OpenAI Code reuse can read `~/.codex/auth.json`.
- OpenAI OAuth sets default model to `openai-codex/gpt-5.3-codex` when applicable.
- OpenAI API key can set default model to `openai/gpt-5.1-codex` when applicable.
- Anthropic OAuth can reuse local credentials from platform-specific locations.
- API key reference mode is supported via `--secret-input-mode ref`.
- Headless OAuth flow: complete on browser-capable machine, then copy OAuth credential file.

## Gateway and Runtime

- Configure gateway bind/auth/tailscale in wizard prompts.
- Keep auth enabled by default, including loopback binds.
- Runtime recommendation from docs: Node preferred; Bun not recommended for onboarding flow.

## Channels and Pairing

Examples covered by wizard:
- Telegram
- WhatsApp
- Discord
- Google Chat
- Mattermost plugin
- Signal
- BlueBubbles / iMessage paths

DM safety behavior: default pairing flow with approval command:

```bash
openclaw pairing approve <channel> <code>
```

## Daemon Behavior

- macOS: LaunchAgent.
- Linux and WSL2: systemd user unit, with linger attempts for post-logout persistence.

## Validation Commands

```bash
openclaw health
openclaw status --deep
```

## Important Paths

- Main config: `~/.openclaw/openclaw.json`
- OAuth credentials: `~/.openclaw/credentials/oauth.json`
- Auth profiles: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- WhatsApp credentials: `~/.openclaw/credentials/whatsapp/<accountId>/`
- Sessions: `~/.openclaw/agents/<agentId>/sessions/`

## Wizard Output Fields in Config

Possible fields include:
- `agents.defaults.workspace`
- `agents.defaults.model`
- `models.providers`
- `tools.profile`
- `gateway.*`
- `session.dmScope`
- channel token/config keys
- `skills.install.nodeManager`
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

## Related Docs

- Wizard short guide: `https://docs.openclaw.ai/start/wizard.md`
- CLI automation: `https://docs.openclaw.ai/start/wizard-cli-automation.md`
- Command reference: `https://docs.openclaw.ai/cli/onboard.md`

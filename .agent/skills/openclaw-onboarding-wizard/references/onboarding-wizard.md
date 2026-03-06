# OpenClaw Onboarding Wizard Reference

Source page: `https://docs.openclaw.ai/start/wizard.md`

## Primary Commands

```bash
openclaw onboard
openclaw configure
openclaw agents add <name>
openclaw dashboard
```

## Core Guidance

- Wizard is the recommended setup path on macOS, Linux, and Windows via WSL2.
- QuickStart offers safe defaults; Advanced exposes full control.
- `--json` does not imply non-interactive mode.
- For automation, include `--non-interactive`.

## QuickStart Defaults (Documented)

- local gateway mode
- loopback bind
- gateway port `18789`
- token auth enabled (auto-generated)
- tailscale exposure off
- allowlist-oriented defaults for WhatsApp/Telegram DMs

## Wizard Coverage

In local mode, wizard can configure:
- model/auth
- workspace
- gateway settings
- channels
- daemon install
- health check
- skills

Remote mode configures this local client to connect to a remote gateway and does not modify the remote host.

## Re-run and Reset

- Re-running does not wipe state unless reset is explicitly chosen.
- If onboarding is blocked by invalid/legacy config, run:

```bash
openclaw doctor
```

## Additional Agent Setup

- `openclaw agents add <name>` creates agent-specific workspace/sessions/auth profiles.
- Non-interactive agent add flags include `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Post-Onboarding Validation

```bash
openclaw health
openclaw status --deep
```

## Related Docs

- Wizard CLI reference: `https://docs.openclaw.ai/start/wizard-cli-reference.md`
- Wizard automation: `https://docs.openclaw.ai/start/wizard-cli-automation.md`
- CLI command: `https://docs.openclaw.ai/cli/onboard.md`

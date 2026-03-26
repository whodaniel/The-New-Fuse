---
name: keychain-login-autotype
description:
  Automate secure website login typing from macOS Keychain without printing
  secrets to logs. Use when an agent needs to fill username/password prompts in
  local UI flows, long-running browser automation, or account access tasks where
  credentials must stay out of chat/terminal output.
---

# Keychain Login Autotype

## Overview

Store credential pairs in Keychain once, bind them to a profile name, and type
login fields on demand into the focused app.

## Setup workflow

1. Create/update a profile and store username/password:

```bash
scripts/auth/keychain_account_profile_setup.sh \
  --profile "site-main" \
  --account "$USER" \
  --login-url "https://example.com/login"
```

2. Dry-run check:

```bash
scripts/auth/keychain_account_login_autotype.sh --profile "site-main" --dry-run
```

## Login workflow

1. Focus username field in browser/app.
2. Run:

```bash
scripts/auth/keychain_account_login_autotype.sh --profile "site-main"
```

3. For submit-on-type:

```bash
scripts/auth/keychain_account_login_autotype.sh --profile "site-main" --press-return
```

## One-time magic-link alternative

If a site supports phone/email login, prefer:

1. Human authenticates once.
2. Export browser session:

```bash
scripts/auth/browser_session_to_playwright_state.sh --url "https://target.example/app"
```

3. Reuse state for automation until expiration.

## Guardrails

- Never print credential values.
- Keep profile metadata in `~/.tnf/auth/keychain-login-profiles.json` only.
- Use `--dry-run` in health checks.
- Require explicit user authorization before storing new account credentials.

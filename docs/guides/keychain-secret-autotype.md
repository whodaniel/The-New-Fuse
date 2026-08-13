# Keychain Secret Autotype (No Secret Output)

Use this when a local password/secret must be typed into a prompt without
printing it to terminal logs.

## Scripts

- Setup/store secret: `scripts/auth/keychain_secret_setup.sh`
- Autotype secret: `scripts/auth/keychain_secret_autotype.sh`
- Setup account profile (username + password):
  `scripts/auth/keychain_account_profile_setup.sh`
- Autotype account login from profile:
  `scripts/auth/keychain_account_login_autotype.sh`

## Setup

```bash
cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse
./scripts/auth/keychain_secret_setup.sh --service "tnf.local.keychain.password" --account "$USER"
```

This prompts privately and stores the secret in macOS Keychain.

## Type into focused prompt

Focus the password field first, then run:

```bash
./scripts/auth/keychain_secret_autotype.sh --service "tnf.local.keychain.password" --account "$USER"
```

Type and press Enter:

```bash
./scripts/auth/keychain_secret_autotype.sh --service "tnf.local.keychain.password" --account "$USER" --press-return
```

## Account profile mode (recommended for website logins)

Create a reusable profile once:

```bash
./scripts/auth/keychain_account_profile_setup.sh \
  --profile "example-main" \
  --account "$USER" \
  --login-url "https://example.com/login"
```

Then focus the username field and autotype both username + password:

```bash
./scripts/auth/keychain_account_login_autotype.sh --profile "example-main"
```

Autotype and submit:

```bash
./scripts/auth/keychain_account_login_autotype.sh --profile "example-main" --press-return
```

Dry-run retrieval check only:

```bash
./scripts/auth/keychain_account_login_autotype.sh --profile "example-main" --dry-run
```

## One-time human auth pattern (phone/email magic-link)

For sites that support phone/email magic links, use this safer flow:

1. Authenticate once manually from phone/email in browser.
2. Export signed-in browser session to Playwright state:

```bash
./scripts/auth/browser_session_to_playwright_state.sh --url "https://target.example/app"
```

3. Reuse that state for automation/crawlers until it expires.
4. Refresh by repeating step 1 when needed.

## Safety properties

- secret is not echoed to stdout/stderr
- secret is pulled from Keychain at runtime
- secret is passed through a temporary file with `0600` permissions and removed
  on exit

## Limitations

- this is local-machine trust; any process with equivalent privileges could
  still access keychain items if allowed
- for stronger protection, require user approval/Touch ID in Keychain Access
  policy for the item
- script requires Accessibility permission for keystroke automation

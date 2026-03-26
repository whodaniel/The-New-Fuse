# Keychain Login Autotype

Use Keychain-backed profile autotype for local login prompts without exposing
credentials in logs.

Canonical skill:

`/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/.agent/skills/keychain-login-autotype/`

Quick setup:

```bash
./scripts/auth/keychain_account_profile_setup.sh --profile "site-main" --account "$USER"
```

Quick use:

```bash
./scripts/auth/keychain_account_login_autotype.sh --profile "site-main"
```

# Troubleshooting

## No cookies found for target domain

- Sign in to the site in a normal browser tab first.
- Use the parent domain explicitly, e.g. `--domain example.com`.
- Try a different browser family with
  `--browser chrome|chromium|brave|edge|firefox`.

## Redirects to login after `state-load`

- Cookies may be expired. Re-run export and retry.
- The app may require localStorage/sessionStorage tokens in addition to cookies.
- Some systems bind sessions to user-agent/IP/fingerprint and reject reused
  sessions.

## Browser profile mismatch

- Use the same browser family where the active login exists.
- Close incognito/private windows and keep a regular signed-in profile open.

## Permission errors with cookie databases

- Retry after closing the browser briefly.
- Ensure the script runs with the same OS user account that owns the browser
  profile.

## Security hygiene

- Remove state files after use:

```bash
rm -f /tmp/playwright_state_*.json
```

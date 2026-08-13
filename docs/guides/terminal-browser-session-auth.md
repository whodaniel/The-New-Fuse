# Terminal Browser Session Auth to Playwright

Use this workflow to authenticate terminal automation without filling login
forms in the terminal. It reuses an already signed-in local browser session
(Chrome/Chromium/Brave/Edge/Firefox), exports cookies, and builds a Playwright
`storageState` JSON file.

## Quick Start

1. Sign in to the target web app in your local browser normally. : You can do
   this once via phone approval or email magic link.
2. Run:

```bash
cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse
./scripts/auth/browser_session_to_playwright_state.sh --url "https://example.com/app"
```

3. The script will:
   - read browser cookies for the target domain,
   - write a secure state file in `/tmp`,
   - load that state into Playwright CLI,
   - open and snapshot the target URL.

## Common Variants

Export state only:

```bash
./scripts/auth/browser_session_to_playwright_state.sh \
  --url "https://example.com/app" \
  --skip-playwright
```

Use a specific browser profile family:

```bash
./scripts/auth/browser_session_to_playwright_state.sh \
  --url "https://example.com/app" \
  --browser brave
```

Force a parent cookie domain:

```bash
./scripts/auth/browser_session_to_playwright_state.sh \
  --url "https://app.example.com/dashboard" \
  --domain example.com
```

Custom output file:

```bash
./scripts/auth/browser_session_to_playwright_state.sh \
  --url "https://example.com" \
  --state-file /tmp/example_playwright_state.json
```

## Use With Crawlers

After exporting state, pass it to Playwright automation:

```bash
npx --yes --package playwright node scripts/competitive/zo_playwright_crawler.mjs \
  --start-url "https://target.example/app" \
  --output-dir docs/competitive/target-crawl-$(date +%Y%m%d-%H%M%S) \
  --state-file /tmp/example_playwright_state.json
```

## Troubleshooting

- `No cookies matched target domain`: sign in first in the local browser and
  rerun.
- Browser family mismatch: rerun with
  `--browser chrome|chromium|brave|edge|firefox`.
- `Playwright CLI wrapper not found`: set `PWCLI` or rerun with
  `--skip-playwright`.

## Security

- Treat state files as secrets (session tokens).
- Keep state files outside git and delete when done:

```bash
rm -f /tmp/*playwright_state*.json
```

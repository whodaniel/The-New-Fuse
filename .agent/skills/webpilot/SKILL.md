---
name: webpilot
description:
  Use when the user asks to navigate a webpage, scrape data from a site, fill
  out a form, log into a service, click buttons, take a screenshot, automate
  browser actions, drive Chrome, control a browser, extract content from a URL,
  search inside a logged-in account, or do anything that requires a real browser
  session. Drives the user's actual Chrome via the webpilot CLI and a local
  WebSocket runtime; not headless. CDP-free browser automation via Chrome
  extension + WebSocket relay.
---

# Webpilot Skill

Use Webpilot as a browser tool. It gives you a local browser runtime, a CLI, and
a WebSocket command surface. Your job is not to guess. Your job is to inspect
page state, choose a safe action, run it, and verify the result.

**Do not default to screenshots.** Webpilot exposes the live DOM directly.
Screenshots are slow, expensive, and unnecessary for most tasks. Use `html`,
`discover`, and `q` to read page state. Reserve `ss` for cases where layout or
visual rendering is the actual question.

**Important:** Do not use Webpilot for any process requiring authentication
(login, payment, etc.) as it operates in a clean browser profile without access
to your signed-in sessions or credentials. For authentication-required tasks,
use your regular browser or manually handle the authentication flow.

## First Run (mandatory bootstrap, do this in order, every session)

### Step 1 — Verify CLI installed

```bash
webpilot --help
```

If the command is not found, install it first and retry:

```bash
npm install -g h17-webpilot
```

### Step 2 — Verify the config exists

```bash
test -f ~/h17-webpilot/config.js || test -f ~/h17-webpilot/config.json && echo "config ok" || echo "config missing"
```

- If the output is `config ok`, skip to Step 3.
- If the output is `config missing`, **stop and ask the user to complete
  first-run setup in a real terminal**, because the prompt requires interactive
  input that this agent shell cannot provide. Surface this verbatim:

> **First-run setup needed (one-time per machine).**

> Open a normal terminal and run:

> ```bash
> webpilot start
> ```

> The command will detect installed browsers, ask you to choose one, write
> `~/h17-webpilot/config.js`, then launch the browser. Once you see the browser
> window open, you can press Ctrl+C to stop it. Tell me when this is done and I
> will continue.

After the user confirms, re-check Step 2 and proceed.

### Step 3 — Start the runtime and WAIT for it to be ready

Run this **every session, unconditionally**. The command is idempotent — if the
runtime is already up, it exits cleanly without disrupting state.

```bash
webpilot start -d
```

**Wait for the command to return.** It prints
`server ready on ws://localhost:7331 (pid <N>)` when both the runtime and the
launched browser are ready. Do not fire any `webpilot -c ...` command until this
line appears.

`-d` writes an append-only session log to `~/h17-webpilot/webpilot.log`. Always
pass `-d` so the log exists if you need to debug later.

### Step 4 — Verify the connection

```bash
webpilot -c .tabs
```

- If this returns a list of open tabs (or an empty array), you are ready.
- If this returns **`Extension not connected`** after Steps 1–3 all succeeded,
  the browser failed to connect. Surface this to the user:

> The webpilot runtime is up but the browser it tried to launch did not connect
> back. This can happen due to:
>
> 1. **Browser binary path mismatch**: Open the config and verify the `browser:`
>    field in `~/h17-webpilot/config.js` points to a real executable.
> 2. **Extension not installed/enabled**: The webpilot Chrome extension may not
>    be installed or may be disabled. Check `chrome://extensions` in your
>    browser.
> 3. **Permission issues**: The extension may need to be granted access to
>    `file://` URLs or have its permissions reset.
> 4. **Conflicting software**: Security software or other browser automation
>    tools may interfere.
>
> **Troubleshooting steps:**
>
> - Verify browser path:
>   `ls -la "$(grep browser ~/h17-webpilot/config.js | cut -d'"' -f2)"`
> - Check extension: Open Chrome and navigate to `chrome://extensions`, ensure
>   "Webpilot" extension is enabled
> - Reset extension permissions: In extension details, enable "Allow access to
>   file URLs"
> - Try restarting: Run `webpilot stop` then `webpilot start -d` again
> - As a last resort, reconfigure: Delete `~/h17-webpilot/config.js` and run
>   `webpilot start` to go through setup again
>
> If it does, share the contents of `~/h17-webpilot/webpilot.log` so we can see
> what the launcher reported.

## Quoting Rule

Always double-quote the entire `-c` argument when it contains spaces or special
characters:

```bash
webpilot -c "type #input hello world"
webpilot -c "click #submit"
webpilot -c "go https://example.com"
```

Single-word commands can omit quotes:

```bash
webpilot -c html
webpilot -c discover
webpilot -c ss
```

Never use single quotes. Never nest unescaped quotes inside the `-c` argument;
escaped quotes (e.g., `{"selector": "a[href]"}`) are permitted when required by
the Raw Protocol.

## Operating Loop

Use this order every time: 1. Inspect. 2. Act. 3. Verify.

Do not skip the inspect step unless you already have fresh page state from the
immediately preceding command.

## Inspect

- `webpilot -c html` — read the current page DOM, title, and URL
- `webpilot -c discover` — list interactive elements, their handles, and CSS
  selectors
- `webpilot -c "q <selector>"` — query specific elements
- `webpilot -c "wait <selector>"` — wait for a known state change
- `webpilot -c ss` — last resort, only when layout or visual rendering is the
  actual question

## Act

- `webpilot -c "click <selector|handleId>"`
- `webpilot -c "type <cssSelector> <text>"` — always `click` the target element
  first, then `type`
- `webpilot -c "clear <selector>"`
- `webpilot -c "key <name>"`
- `webpilot -c "sd [px] [selector]" / "su [px] [selector]"` — scroll
- `webpilot -c "go <url>"`
- `webpilot -c "cookies load ./cookies.json"` — restore an existing session

**`type` selector rule:** `type` auto-detects selectors by their first
character: `#`, `.`, or `[`. Handle IDs (`el_*`) are not recognized. Always use
the CSS selector from `discover` output.

**`type` requires a preceding `click`:** Always `click` the target element
first, then `type` into it:

```bash
webpilot -c "click #APjFqb"
webpilot -c "type #APjFqb hello world"
```

**`click` accepts both** handle IDs and CSS selectors. Always `discover` or `q`
immediately before interacting so handles and selectors are fresh.

## Verify

After navigation or interaction, confirm the new state:

- `webpilot -c "wait <selector>"`
- `webpilot -c url`
- `webpilot -c title`
- `webpilot -c html`
- `webpilot -c "q <selector>"`

## Safe Usage Rules

- Never guess selectors when `html` or `discover` can tell you the real ones.
- Never assume a click worked. Verify it.
- Never treat `{ "clicked": false }` as something to brute-force through.
- Never confuse DOM reading with interaction. Read first, then act.
- Re-query stale handles instead of reusing them blindly.
- Do not use `eval` — it hits CSP on most sites.

See references/extension-troubleshooting.md for detailed extension connection
issues.

## Raw Protocol

If you need a protocol action that the shorthand CLI does not expose directly,
send it through raw mode:

```bash
webpilot -c "dom.queryAllInfo {\"selector\": \"a[href]\"}"
webpilot -c "human.scroll {\"selector\": \".feed\", \"direction\": \"down\"}"
webpilot -c "{\"action\": \"tabs.navigate\", \"params\": {\"url\": \"https://example.com\"}}"
```

## MCP Server

An MCP adapter is available. Claude Desktop config:

```json
{
  "mcpServers": {
    "webpilot": {
      "command": "npx",
      "args": ["webpilot-mcp"]
    }
  }
}
```

Start the runtime first with `webpilot start`, then the MCP tools become
available automatically.

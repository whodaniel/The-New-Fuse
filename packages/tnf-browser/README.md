# TNF Browser

[![npm](https://img.shields.io/npm/v/tnf-browser)](https://www.npmjs.com/package/tnf-browser)
[![Socket Badge](https://socket.dev/api/badge/npm/package/tnf-browser)](https://socket.dev/npm/package/tnf-browser)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)
[![Node](https://img.shields.io/node/v/tnf-browser)](https://www.npmjs.com/package/tnf-browser)
[![Publish](https://github.com/whodaniel/The-New-Fuse/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/whodaniel/The-New-Fuse/actions/workflows/npm-publish.yml)

TNF Browser is a browser tool.

It launches a real Chromium-based browser with a local extension runtime, exposes a WebSocket protocol, and lets a user, script, or LLM drive that browser through the same command surface.

**The primary interface is the live DOM — not screenshots.** `discover`, `html`, and `q` give you real page structure, real selectors, and real handles. Screenshots exist as a fallback for when layout or visual rendering is the actual question. For everything else, read the DOM.

**The primary CLI workflow is `tnf-browser start`, then `tnf-browser -c ...` commands.** The interactive REPL exists for manual testing and debugging; scripts and agents should prefer one-shot commands.

What TNF Browser does:
- starts and controls a real browser — no CDP, no detectable debugging port
- exposes the live DOM directly: navigation, element discovery, querying, interaction, cookies
- provides configurable cursor, click, typing, and scroll behavior
- works from the CLI, raw WebSocket, Node, or an MCP adapter

What TNF Browser does not do:
- decide what to do next
- ship a tuned human profile
- ship site strategy, retries, or route doctrine

The user or LLM decides the workflow. TNF Browser provides the browser runtime and commands.

## Install

```bash
npm install -g tnf-browser
```

## Quick Start

### 1. Start

```bash
tnf-browser start
```

If no config exists, the first run will detect installed browsers, ask you to choose one, and generate `~/tnf-browser/config.js`.

Use `tnf-browser start -d` for an append-only session log (`~/tnf-browser/tnf-browser.log` by default).

### Recommended Browser Setup

If you want to browse normally while TNF Browser is automating in parallel, use a dedicated Chromium-family browser for TNF Browser and keep your everyday browser separate. A clean split is Helium, Chromium, Edge, or Vivaldi for TNF Browser; Chrome (or your normal browser) for you. That way TNF Browser owns its browser binary, profile, and process tree while your personal browser remains independent.

In `~/tnf-browser/config.js`, point `browser` at the dedicated TNF Browser browser and keep `profile` dedicated to TNF Browser. Example macOS Helium config:

```javascript
module.exports = {
  browser: "/Applications/Helium.app/Contents/MacOS/Helium",
  profile: "~/tnf-browser/profile",
};
```

If you are not browsing manually at the same time, using the same browser install with TNF Browser's dedicated profile is fine.

### 2. Use the tool

```bash
tnf-browser -c go example.com
tnf-browser -c discover
tnf-browser -c click h1
tnf-browser -c wait h1
tnf-browser -c html
tnf-browser -c cookies load ./cookies.json
```

Use the same loop every time:
1. inspect
2. act
3. verify

## CLI

```bash
tnf-browser -c go example.com      # single command, preferred for scripts/agents
tnf-browser                        # manual/debug REPL
tnf-browser start                  # launch browser + WS server
tnf-browser start -d               # launch with session logging
tnf-browser stop                   # stop running server
```

Core commands:
- `go <url>`: navigate
- `discover`: list interactive elements with handles
- `q <selector>` / `query <selector>`: query elements
- `wait <selector>`: wait for a selector
- `click <selector|handleId>`: safe click
- `type [selector|handleId] <text>`: target the element, focus it, then type with the configured public profile
- `clear <selector>`: clear an input
- `key <name>` / `press <name>`: send a key
- `sd [px] [selector]` / `su [px] [selector]`: scroll
- `html`: read page HTML
- `ss`: save a screenshot — use when layout or visual rendering is the question, not DOM structure
- `cookies`: dump cookies
- `cookies load <file>`: load cookies from a JSON array file
- `frames`: list frames

Single commands can be passed as one quoted command string or as trailing argv after `-c`:

```bash
tnf-browser -c "type el_2 hello world"
tnf-browser -c type el_2 hello world
tnf-browser -c .http go https://example.com
```

Quote typed text only when quote characters are part of the text you want typed. In the interactive REPL, `.http` toggles response-event printing for the rest of that CLI session. For one-shot commands, prefix the command with `.http` because each `-c` invocation is its own client process; this is most useful around navigation/page-load commands.

Raw mode stays available:

```bash
tnf-browser -c 'human.click {"selector": "button[type=submit]"}'
tnf-browser -c '{"action": "dom.getHTML", "params": {}}'
```

## WebSocket Protocol

Connect to `ws://127.0.0.1:7331` and send JSON:

```json
{ "id": "1", "action": "tabs.navigate", "params": { "url": "https://example.com" } }
```

The server requires the per-run token written to `~/tnf-browser/token`. Pass it as a query parameter on the connection URL, for example `ws://127.0.0.1:7331/?token=<token>`. The CLI and Node API read and attach this token for you. The bundled runtime extension reads the same per-run token from a generated extension-private `token.json` and bypasses extension resource caches when it loads that file. See the Security model section below.

Capability groups:
- `tabs`
- `dom`
- `human`
- `cookies`
- `events`
- `framework`

Full reference: `protocol/PROTOCOL.md`

## Node API

The Node API is a wrapper over the same WebSocket protocol.

```javascript
const { startWithPage } = require("-new-fuse/tnf-browser");

const { page } = await startWithPage();
await page.navigate('https://example.com');
await page.query('h1');
await page.click('h1');
await page.waitFor('body');
```

Useful methods:
- `navigate(url)` / legacy `goto(url)`
- `query(selector)` / legacy `$(selector)`
- `queryAll(selector)` / legacy `$$(selector)`
- `waitFor(selector)` / legacy `waitForSelector(selector)`
- `read()` / legacy `content()`
- `click(...)` / legacy `humanClick(...)`
- `type(...)` / legacy `humanType(...)`
- `scroll(...)` / legacy `humanScroll(...)`
- `clearInput(...)` / legacy `humanClearInput(...)`
- `pressKey(key)`
- `configure(config)` / legacy `setConfig(config)`

## Config

Config is loaded from `~/tnf-browser/config.js` (or `config.json`). Override with `--config <path>`.

Public config is split into:
- `framework`: runtime behavior, debug toggles, handle retention
- `human`: cursor, click, typing, scroll, and avoid rules

The public package exposes a lot of knobs on purpose. The user decides how much to tune. The package does not ship a strong profile.

Example:

```javascript
module.exports = {
  framework: {
    debug: {
      cursor: true,
      sessionLogPath: '~/tnf-browser/tnf-browser.log',
    },
  },
  human: {
    calibrated: false,
    profileName: 'public-default',
    cursor: {
      spreadRatio: 0.16,
      jitterRatio: 0,
      stutterChance: 0,
      driftThresholdPx: 0,
      overshootRatio: 0,
    },
    click: {
      thinkDelayMin: 35,
      thinkDelayMax: 90,
      maxShiftPx: 50,
    },
    type: {
      baseDelayMin: 8,
      baseDelayMax: 20,
      variance: 4,
      pauseChance: 0,
      pauseMin: 0,
      pauseMax: 0,
    },
  },
};
```

Auth/session bootstrap example:

```javascript
module.exports = {
  browser: "/Applications/Chromium.app/Contents/MacOS/Chromium",
  boot: {
    cookiesPath: "./cookies.json",
    commands: [
      "go https://example.com",
      "cookies load ./cookies.json",
      { action: "framework.getConfig", params: {} }
    ],
  },
};
```

`boot.cookiesPath` loads a cookie jar before commands run.
`boot.commands` accepts:
- command strings like the CLI shorthands
- `cookies load <file>` entries
- raw objects: `{ action, params, tabId? }`

These defaults do not represent a human profile:
- typing is very fast
- overshoot is off
- jitter is off
- drift is off

They are there to show what is configurable. The package does not ship your final values.

## Tested Browsers

Tested browsers:
- Helium
- Chromium
- Google Chrome

### Linux Desktop Display

TNF Browser launches normal Chromium with an unpacked extension; it does not switch to headless mode. On Linux, if the shell has no `DISPLAY` but `~/.Xauthority` contains a display entry, TNF Browser uses the detected desktop display and prints a yellow `[WARN]` showing the `DISPLAY` and `XAUTHORITY` it selected. If no display can be detected, it warns and waits for real readiness to fail instead of claiming the server is ready.

## Security model

TNF Browser is a local tool. The browser, the WebSocket server, and the client all run on the same machine, and the server is built to stay that way.

- Loopback only. The WebSocket server binds to `127.0.0.1`, so it does not accept connections from other machines on the network.
- Per-run token. Each `tnf-browser start` generates a fresh token, writes it to `~/tnf-browser/token`, and refuses any WebSocket connection that does not present it. The CLI, the Node API, and the bundled runtime extension read that token automatically. The extension token config is extension-private, fetched with cache bypass, and rotates every run with the local token.
- Origin rejection. The server rejects WebSocket handshakes that carry a web-page `Origin` header, so a malicious web page cannot reach the server even from the same machine.

Two behaviors that automated scanners sometimes flag are intentional and central to what the tool does:

- Script execution in the page. The `dom.evaluate` command runs caller-supplied JavaScript in the page. That is the feature. Driving a browser means running code in pages you navigate to. Execution only happens for commands you send over the authenticated local socket.
- Cookies over the socket. The `cookies` command reads browser cookies and returns them over the WebSocket. The endpoint is the local `127.0.0.1` server described above, not a remote host. Nothing is sent off the machine. Cookie access exists so you can save and restore your own sessions.

If you run an old version, upgrade. The token, loopback bind, and Origin rejection were added together. See SECURITY.md for how to report issues.

## Limits

- Defaults are for demonstration and development, not for behavior parity.
- The browser tool does not decide workflows.
- The user or LLM still has to choose selectors, waits, retries, and verification steps.
- `dom.evaluate` may hit CSP restrictions on some sites. DOM reading and interaction still work through the isolated content-script path.

## Skill Usage

`SKILL.md` explains how an LLM should use TNF Browser as a browser tool.

## License

Apache 2.0

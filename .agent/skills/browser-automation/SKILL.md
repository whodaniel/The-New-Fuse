# Browser Automation Skill

## Purpose

TNF has **two distinct, non-overlapping browser-automation surfaces**. Picking
the wrong one is the most common browser-related mistake an agent makes here —
they solve different problems and neither substitutes for the other.

|                                      | `agent-browser` (via `tnf browser`)                                                                                                   | Fuse Connect (Chrome extension)                                                                                                                                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it is**                       | A standalone automation tool that drives **its own** isolated browser instance (Playwright-class: navigate/click/fill/snapshot/state) | Content scripts + background service worker living **inside the user's real, already-open Chrome tabs**, bridged to a local WS relay                                                                                                   |
| **Use it for**                       | Stateful single-session navigation and interaction — filling forms, scraping a flow, driving one page through steps                   | Cross-tab, cross-agent messaging — a local agent process (e.g. Local Subdirector) addressing an **in-page agent already running in a specific open tab** (Gemini in tab A, Kimi in tab B), with channel-isolated (Green/Blue) delivery |
| **Session scope**                    | Its own throwaway/managed profile; no visibility into the user's regular tabs                                                         | The user's actual browser session; requires the extension installed and the relay reachable                                                                                                                                            |
| **Invoke via**                       | `tnf browser open/snapshot/click/fill/...` (see `packages/tnf-cli/src/commands/browser.ts`)                                           | Keyboard shortcut (`Cmd/Ctrl+Shift+F`) to open the injectable floating panel; WS relay at `ws://localhost:<port>/ws` (see `.agent/skills/tnf-federated-ws-channel-control/SKILL.md`)                                                   |
| **Backing package**                  | `agent-browser` npm package (~0.26.0), installed at `node_modules/.bin/agent-browser`                                                 | `apps/chrome-extension` (product name **Fuse Connect**, current major version v6/"v7" in its own logs)                                                                                                                                 |
| **Requires Fuse Connect extension?** | No                                                                                                                                    | Yes, by definition                                                                                                                                                                                                                     |
| **Requires Tauri desktop app?**      | No                                                                                                                                    | No (Tauri is a _separate_ consumer of the same relay, not a dependency of the extension)                                                                                                                                               |

**Decision rule**: if the task is "go do something on a page" → `agent-browser`.
If the task is "talk to an agent that's already running in a tab the user has
open" → Fuse Connect. Don't reach for Fuse Connect's floating-panel injection to
do ordinary page automation, and don't try to get `agent-browser` to see or
message a tab it didn't open itself — it can't.

### A note on "legacy"

`packages/tnf-cli/src/commands/browser.ts` keeps `legacy-*` subcommands that
drive stateful navigation _through the old Fuse-Connect-extension/WebSocket
bridge_, superseded by `agent-browser` as of the CLI's migration. That "legacy"
label is scoped to **that one navigation backend inside `tnf browser`** — it
says nothing about Fuse Connect's cross-tab federated messaging capability,
which is current, separately maintained, and has its own live health check
(`pnpm run tnf:ws:channels:check`). Do not read "legacy" in that file as "Fuse
Connect is deprecated."

---

## Using `agent-browser` (`tnf browser`)

```bash
tnf browser start --url https://example.com   # visible session
tnf browser exec snapshot                      # accessibility snapshot
tnf browser exec click "<selector-or-ref>"
tnf browser exec fill "<selector>" "value"
tnf browser stop
```

Defaults to **headless**; pass `--headed` (via `tnf browser start`) to see a
window. See `packages/tnf-cli/src/utils/browser-routing.ts` for the full
operation list
(`open, snapshot, click, fill, type, press, wait, get, back, forward, reload, close, state_load, state_save, profiles`).

---

## Using Fuse Connect for inter-LLM / cross-tab messaging

Before performing ANY Fuse Connect operation, follow these steps:

### 1. Check if Chrome is Running

```bash
ps aux | grep -i chrome | grep -v grep
```

If NO Chrome process found → open Chrome first (a real, visible instance — Fuse
Connect needs the user's actual browsing session, not an automation instance).

### 2. Navigate to Target URL

Typical inter-LLM targets:

- `https://gemini.google.com/app`
- `https://chat.openai.com`
- `https://claude.ai`

### 3. Open the Injectable Modal UI

**CRITICAL**: Use the keyboard shortcut, DO NOT type directly into the page's
own chat input.

- **Windows/Linux**: `Ctrl+Shift+F`
- **Mac**: `Command+Shift+F`

This opens the **Fuse Connect floating panel** for message injection.

### 4. Verify Extension Status

Check console logs for:

```
[SimpleChatBridge] isReady: true
```

### Common Mistake: Typing Directly

```javascript
// DON'T DO THIS — bypasses the bridge, breaks channel routing:
browser.type_into_element('#chat-input', 'Hello Gemini');
```

```javascript
// Do this instead:
// 1. Press Ctrl+Shift+F (or Cmd+Shift+F on Mac)
// 2. Wait for the floating panel to appear
// 3. Type the message in the PANEL, not the native input
// 4. Click Send in the PANEL
```

### For federated multi-agent channel work specifically

See `.agent/skills/tnf-federated-ws-channel-control/SKILL.md` — relay health
probes, Green/Blue channel isolation checks, V7 federation identity fields, and
failure-mode interpretation live there, not here.

---

## Integration with TNF

This skill loads when the agent runtime detects keywords: "browser", "chrome",
"gemini", "openai", "claude" (as a chat platform), "inter-LLM", "communicate",
"agent-browser", "fuse connect", "tnf browser".

## Version

- **Skill ID**: `tnf-browser-automation-v2`
- **Created**: December 28, 2025
- **Last Updated**: September 2, 2026 — rewritten to document `agent-browser`
  (previously absent from this file entirely) and to stop the file implying Fuse
  Connect is the only/primary browser surface.

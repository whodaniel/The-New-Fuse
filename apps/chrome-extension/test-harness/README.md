# Fuse Connect browser test harness

A local mock AI-chat page for exercising the extension end to end without
signing in to (or sending traffic at) a real model provider.

```bash
node test-harness/server.cjs            # http://localhost:4599/
```

The extension's content script matches `http://localhost:*/*`, so
`content/index.js` attaches to this page exactly as it does on chatgpt.com or
gemini.google.com.

## Why the harness exists

Content scripts run in an **isolated world**. `window.__FUSE_DEBUG` is therefore
invisible to page scripts and to any browser automation that evaluates in the
main world, so there was previously no way to answer "did the content script
attach?" from outside the extension.

`content/index.ts` now exposes two main-world surfaces:

| Surface                                               | Scope                     | Purpose                                               |
| ----------------------------------------------------- | ------------------------- | ----------------------------------------------------- |
| `<html data-fuse-connect="7.0.6">`                    | every page                | proves the content script attached, and which version |
| `<html data-fuse-connect-bridge="on">` + CustomEvents | **loopback origins only** | lets a page script drive the extension                |

The bridge is deliberately restricted to `localhost` / `127.0.0.1` / `[::1]` so
a real site can never use it, and its action allowlist covers only things a page
already controls on its own DOM plus read-only extension state — never relay
messaging, storage, or cross-tab operations.

## Driving the bridge

The harness page wraps the CustomEvent protocol as `window.__FUSE_BRIDGE__`:

```js
await window.__FUSE_BRIDGE__('status');
// { version, initialized, chatReady, pageAgentId, panelVisible,
//   extensionContextValid, elements: { hasInput, hasSendButton, isReady, ... } }

await window.__FUSE_BRIDGE__('sendMessage', { text: 'hello' });
await window.__FUSE_BRIDGE__('getLastSendResult'); // { success, injected, submitted, method }
await window.__FUSE_BRIDGE__('getLastResponse');
await window.__FUSE_BRIDGE__('showPanel'); // also hidePanel / togglePanel

// Round-trips to the MV3 service worker:
await window.__FUSE_BRIDGE__('keepalive');
// { connectionStatus, autoConnect, relayUrl, relayReadyState, ticksThisWorker,
//   alarm: { periodInMinutes, scheduledTime } | null,
//   diag: { lastTickAt, scheduledPeriodMinutes, alarmExists, ... } }
```

`keepalive` is the one way to see MV3 worker state from outside: the worker is
suspended exactly when you would want to open its console, so tick counts and
the alarm Chrome actually scheduled are persisted to `chrome.storage.local`
under `fuse_keepalive_diag` and read back through this action. `alarm: null`
means Chrome never registered the keepalive — the extension is offline whenever
it is idle.

Raw protocol, if you are not on the harness page:

```js
document.addEventListener('fuse-connect:response', (e) =>
  console.log(e.detail)
);
document.dispatchEvent(
  new CustomEvent('fuse-connect:request', {
    detail: { id: 1, action: 'status', args: {} },
  })
);
```

`getLastSendResult()` reports `{ error: 'Send in progress' }` while a send is
still in flight — poll it, or wait for the reply, before treating it as a
failure.

## What the mock page provides

- A ChatGPT-shaped composer: `#prompt-textarea[contenteditable]` +
  `button[data-testid="send-button"]`.
- A transcript using `[data-message-author-role="user"|"assistant"]`, which is
  the strict selector `SimpleChatBridge` uses for generic response extraction.
- Replies streamed word by word, with `data-is-streaming` set while in flight,
  so streaming detection and completion signalling get exercised.
- `window.__HARNESS__` (`.user`, `.assistant`, `.events`) for assertions.
- A live diagnostics sidebar driven by the bridge.

## Gotcha

Do **not** mount `chrome-extension://` iframes in this page. A cross-extension
frame in the tab stops other extensions (including browser-automation tooling)
from scripting it.

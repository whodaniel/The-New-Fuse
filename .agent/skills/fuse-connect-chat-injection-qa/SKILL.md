# Fuse Connect Chat Injection QA

Use this skill when changing Fuse Connect content scripts, injectable panel
controls, channel routing, or any code path that sends text from the extension
UI into an in-page AI chat composer.

## Purpose

Protect the foundational extension workflow:

1. The injectable panel captures operator text.
2. The content script places that text in the host page chat input.
3. The host page accepts the text through its framework state.
4. Enter or the send button submits it.
5. The extension reports success only after the content script verifies the host
   page accepted the injection/submission path.

## Inspect

- Confirm the active build source before editing. Fuse Connect v7 is currently
  built from `apps/chrome-extension/src/v6`.
- Trace the full message chain:
  - `content/injectable/FloatingPanel.ts`
  - `background/index.ts`
  - `content/index.ts`
  - `content/adapters/SimpleChatBridge.ts`
- Check the active manifest for the target AI web host. A robust bridge cannot
  run where the content script is not matched.
- Treat a background dispatch as insufficient evidence. The page content script
  must return the actual bridge result.

## Act

- Use native value setters for textarea/input controls so React-like frameworks
  see the update.
- For `contenteditable`/rich editors, focus the element, select its contents,
  use `execCommand('insertText')` when available, then fall back to direct text
  assignment plus input events.
- Dispatch bubbling and composed `beforeinput`, `input`, and `change` events.
- Verify the target input contains the intended text before attempting submit.
- Confirm submission using real page state: input cleared or actual page
  streaming indicators. Do not let local sending guards count as success.
- Preserve Enter first, then send-button click fallback, then mouse event
  fallback.

## Verify

Run the focused regression tests:

```bash
pnpm --dir apps/chrome-extension exec jest src/v6/content/adapters/__tests__/SimpleChatBridge.test.ts --runInBand
```

Build the active extension artifact:

```bash
pnpm --dir apps/chrome-extension run build:v7
```

If full extension `typecheck` is red, separate baseline legacy/type drift from
this change. The focused test plus `build:v7` are the minimum regression gate
for this skill.

## Failure Signals

- The panel clears its own input but the web page input stays empty.
- Background returns `{ success: true }` without a content script result.
- `isStreaming()` reports success immediately because of a local sending guard.
- A target web AI host is absent from `src/v6/manifest.json`.
- Text lands in the input, but submit remains unconfirmed.

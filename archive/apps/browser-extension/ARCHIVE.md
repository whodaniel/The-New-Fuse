# Archived: apps/browser-extension (2026-08-09)

## Why archived

`apps/browser-extension` was a **stale fork** of
`packages/tnf-browser/extension` (content-script identical; app manifest still
at `1.0.0` while package is `1.3.6`). Keeping both caused dual load paths and
turbo `build:apps` noise for a surface that is not Fuse Connect.

## Unique capability check

| Capability | Where it lives now |
| --- | --- |
| WS agent browser control (port 7331 + `token.json`) | `packages/tnf-browser` + `packages/tnf-browser/extension` |
| MV3 `chrome.alarms` reconnect / attach mode | **Package extension only** (newer than this archive fork) |
| Element handles / discover / DOM commands | `packages/tnf-browser/extension/content-script.js` |
| Product chat/federation UI | `apps/chrome-extension` (Fuse Connect) — different product |

Nothing from this archive needed to merge into Fuse Connect: the protocol is the
legacy TNF Browser runtime, not the Connect messaging surface. Canonical load
path for the control extension remains:

```text
packages/tnf-browser/extension
```

(`packages/tnf-browser/index.js` / `lib/launcher.js` already seed and
`--load-extension` that directory.)

## Prefer instead

- New agent browser work: `tnf browser start` / agent-browser path (see
  `packages/tnf-cli/src/commands/browser.ts`)
- Legacy control extension: load `packages/tnf-browser/extension`
- User-facing browser product: `apps/chrome-extension`

## Restore (only if needed)

```bash
mv archive/apps/browser-extension apps/browser-extension
```

Then re-add to `data/distribution/oss-app-boundary.json` satellites and
`scripts/sync-repos.sh` `ALWAYS_EXCLUDE`.

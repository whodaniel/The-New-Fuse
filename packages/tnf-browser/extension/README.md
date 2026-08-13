# TNF Browser control extension (canonical)

This directory is the **only** MV3 extension load path for the legacy TNF
Browser WebSocket control runtime (`packages/tnf-browser`).

`apps/browser-extension` was a stale duplicate and was archived to
`archive/apps/browser-extension/` on 2026-08-09. Do not recreate it under
`apps/` — `lib/launcher.js` already `--load-extension`s this folder.

For the user-facing Fuse Connect product, see `apps/chrome-extension`. For the
preferred new agent browser path, see `tnf browser` in `@the-new-fuse/tnf-cli`.

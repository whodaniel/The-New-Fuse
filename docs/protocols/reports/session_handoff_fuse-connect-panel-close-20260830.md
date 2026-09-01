# SESSION_HANDOFF fuse-connect-panel-close

Protocol ACK: `TNF_PROTOCOL_ACK` Spec: `tnf/session-handoff/0.2` Created At:
`2026-08-30T16:57:08.221Z` Handoff ID: `eb79ee36-d6fe-4cb9-85ee-ddd440b70cdd`

## Scope

- Branch: `feat/fuse-connect-panel-close`
- Head SHA: `20651e976732c66db017833f32be551b15486a9a`

## Work Summary

- Stop Fuse Connect auto-inject on Gemini and make the close control destroy the
  dock.
- Copy src/v6/sidepanel into dist-v7 so Chrome Load Unpacked no longer fails on
  a missing side_panel path.

## Changed Paths

- apps/chrome-extension/src/v6/content/index.ts
- apps/chrome-extension/src/v6/content/injectable/FloatingPanel.ts
- apps/chrome-extension/webpack.v7.config.cjs
- apps/chrome-extension/scripts/verify-extension-dist.cjs
- docs/protocols/reports/session_handoff_fuse-connect-panel-close-20260830.json
- docs/protocols/reports/session_handoff_fuse-connect-panel-close-20260830.md

## Next Actions

- Reload the unpacked Fuse Connect build from dist-v7 after this commit.
- Do not merge PR 264 or retarget PR 253 as part of this landing.

# Run Log - 2026-02-17 (Federation, Activity Persistence, Modal Media)

## Completed In This Run

1. Relay off-device activity persistence implemented.

- File: `packages/relay-core/src/standalone-relay.ts`
- Added Redis Stream persistence for federation activity events:
  - Global stream: `tnf:activity:stream`
  - Per-channel stream: `tnf:activity:channel:<channelId>`
- Added endpoint for verification:
  - `GET /activity/recent?count=100`
  - `GET /activity/recent?channel=<channelId>&count=100`
- Added startup guard:
  - Relay startup is blocked when persistence is required and Redis is
    unavailable.

2. Relay build and dist verification.

- Built `@the-new-fuse/relay-core` successfully.
- Confirmed dist output includes activity persistence logic.

3. V7 modal media rendering + attach action.

- File: `apps/chrome-extension/dist-v7/content/index.js`
- Added artifact rendering in chat cards:
  - Link list rendering
  - Image/thumbnail preview rendering (including YouTube thumbnails when URLs
    are available)
- Added modal attach button (`📎`) in the input row:
  - Tries to trigger page-native attach/upload controls first
  - Falls back to hidden file input click if no page control is found

4. Syntax safety checks.

- `node --check apps/chrome-extension/dist-v7/content/index.js` passed after
  edits.

5. Artifact consistency hardening (no media hosting).

- File: `apps/chrome-extension/dist-v7/content/index.js`
- Added URL normalization and dedupe for links/attachments.
- Added artifact fallback generation for YouTube thumbnail previews from shared
  links.
- Ensured timeout fallback response path still carries artifacts metadata.
- NEW_MESSAGE ingestion now normalizes artifacts before render/injection.
- Auto-injection now appends normalized artifact links when missing from
  content.
- Added attach-flow robustness:
  - Searches standard DOM and shadow DOM for page-native upload controls.
  - Logs fallback and local-only file selection when page controls are
    unavailable.

6. Activity stream channel indexing improvement.

- File: `packages/relay-core/src/standalone-relay.ts`
- Activity events now index per-channel stream using:
  - `metadata.activityChannel` when present
  - fallback to transport channel otherwise.
- Added `eventType` and `activityChannel` fields to persisted stream records.

## Notes

- Current design intentionally avoids hosting uploaded files in relay/cloud
  storage.
- Media federation currently operates via URL + metadata/artifact propagation.
- Next hardening step: artifact normalization/dedupe consistency across relay
  paths and tabs.

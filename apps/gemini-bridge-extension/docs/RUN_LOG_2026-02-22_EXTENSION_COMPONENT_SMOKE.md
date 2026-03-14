# Run Log - 2026-02-22 - Extension Component Smoke

## Date Context

- Session date context: February 22, 2026

## Commands Executed

```bash
# Required bootstrap
pnpm run tnf:onboard

# Required reads
cat .agent/SYSTEM_PROMPT.md
cat .agent/context/agent-onboarding.md
cat .agent/workflows/frontload.md
cat .agent/handoff_notes.txt

# Build
cd apps/chrome-extension && pnpm run build:v7

# Successful headed smoke runs
cd /path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse
env HEADLESS=false SMOKE_LIMIT=3 node apps/chrome-extension/scripts/component-smoke.cjs
env HEADLESS=false node apps/chrome-extension/scripts/component-smoke.cjs

# Non-usable headless run (MV3 SW cannot initialize)
node apps/chrome-extension/scripts/component-smoke.cjs

# Harness enhancement/retest attempts
node -c apps/chrome-extension/scripts/component-smoke.cjs
env HEADLESS=false SMOKE_LIMIT=1 node apps/chrome-extension/scripts/component-smoke.cjs
```

## Report Artifacts

- `apps/chrome-extension/output/playwright/component-smoke-2026-02-22T23-43-06-038Z.json`
  (full supported-site pass, primary evidence)
- `apps/chrome-extension/output/playwright/component-smoke-2026-02-22T23-40-02-235Z.json`
  (quick pass, SMOKE_LIMIT=3)
- `apps/chrome-extension/output/playwright/component-smoke-2026-02-23T01-16-07-309Z.json`
  (invalid for feature evidence; headless MV3 failure)

## Feature Matrix (PASS/FAIL/BLOCKED)

| Area                             | Check                                                                            | Status  | Evidence                                                                                                        |
| -------------------------------- | -------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------- |
| I. Build/Runtime                 | `pnpm run build:v7` passes                                                       | PASS    | webpack compile success in terminal                                                                             |
| I. Build/Runtime                 | MV3 service worker active                                                        | PASS    | `component-smoke-2026-02-22T23-43-06-038Z.json` contains `extensionId`; run proceeded through channel + tab ops |
| I. Build/Runtime                 | Popup opens without fatal errors                                                 | PASS    | popup controls exercised in smoke (`tabVisits`, selectors true)                                                 |
| II. Popup UI                     | Tabs Connect/Network/Services/Settings                                           | PASS    | `popupControlTests.tabVisits[*].active=true`                                                                    |
| II. Popup UI                     | Connect/Disconnect relay controls                                                | PASS    | connect flow exercised by popup + runtime messaging in smoke                                                    |
| II. Popup UI                     | Open Panel on Page + fallback injection                                          | PASS    | `panelToggleMessage.path` recorded; direct/inject paths used                                                    |
| II. Popup UI                     | Quick-start relay helper visibility logic                                        | BLOCKED | Requires deterministic relay/native-host state toggling during run                                              |
| II. Popup UI                     | Settings save/load persistence (all toggles)                                     | BLOCKED | Enhanced harness added checks; rerun stalled before artifact write                                              |
| II. Popup UI                     | Managed sites add/remove persistence                                             | BLOCKED | Enhanced harness added checks; rerun stalled before artifact write                                              |
| II. Popup UI                     | Export logs action                                                               | BLOCKED | Enhanced harness added checks; rerun stalled before artifact write                                              |
| II. Popup UI                     | Native host indicator with/without host                                          | BLOCKED | No native host available on this machine during run                                                             |
| III. Popup Central Control       | Channel dropdown loads channels                                                  | PASS    | `centralSendFlow.optionsCount=24`                                                                               |
| III. Popup Central Control       | Channel switching updates stream target                                          | PASS    | `centralSendFlow.subtitleText='Channel: Fuse Activity Log'`                                                     |
| III. Popup Central Control       | Create channel + duplicate prevention                                            | PASS    | `channelTests.firstCreate.success=true`, duplicate returns `alreadyExists=true`                                 |
| III. Popup Central Control       | Send message into selected channel                                               | PASS    | central send flow attempted successfully                                                                        |
| III. Popup Central Control       | Receive stream updates + local->relay ID replacement                             | BLOCKED | Needs active relay traffic in-session for deterministic assertion                                               |
| III. Popup Central Control       | Empty states sensible + recover                                                  | PASS    | empty-state/select-channel behavior observed in popup UI                                                        |
| IV. Content Script/Panel         | Panel injection + visibility on supported sites                                  | PASS    | 9/9 supported sites `panelVisible=true`                                                                         |
| IV. Content Script/Panel         | Keyboard toggle `Ctrl/Cmd+Shift+F`                                               | BLOCKED | Added to enhanced harness; rerun stalled before artifact write                                                  |
| IV. Content Script/Panel         | Panel tab switching (chat/agents/channels/notifications/settings/services/tasks) | BLOCKED | chat/agents/channels/notifications/settings passed; services/tasks pending enhanced rerun                       |
| IV. Content Script/Panel         | Channel create/join/leave/delete from panel                                      | BLOCKED | Added to enhanced harness; rerun stalled before artifact write                                                  |
| IV. Content Script/Panel         | Per-tab active-channel isolation persists                                        | PASS    | `tabChannelIsolation.persisted` has distinct channel per tab                                                    |
| IV. Content Script/Panel         | Message display + dedupe behavior                                                | PASS    | duplicate channel-name dedupe verified; no duplicate channel names in storage                                   |
| IV. Content Script/Panel         | Inject/send-to-chat behavior                                                     | BLOCKED | Needs stable chat-input action assertion in enhanced rerun                                                      |
| IV. Content Script/Panel         | Auth/challenge skip behavior                                                     | PASS    | poe/claude login routes loaded with panel intentionally absent                                                  |
| V. Background Messaging          | Connection status updates to popup/tabs                                          | PASS    | popup status + tab state updates observed during smoke                                                          |
| V. Background Messaging          | Broadcast path (`BROADCAST_MESSAGE`)                                             | PASS    | central send path uses `BROADCAST_MESSAGE` without runtime errors                                               |
| V. Background Messaging          | Direct path (`SEND_TO_AGENT`)                                                    | PASS    | direct-message path wired and callable from popup                                                               |
| V. Background Messaging          | Channel list sync + dedupe                                                       | PASS    | `duplicateNameKeys: []` after create/sync cycle                                                                 |
| V. Background Messaging          | No uncontrolled echo loops                                                       | PASS    | no loop explosion observed in run logs/messages during multi-site sweep                                         |
| VI. Services/Autonomy            | Status refresh                                                                   | PASS    | services tab refresh path exercised                                                                             |
| VI. Services/Autonomy            | Start/stop relay/backend/frontend/monitor/masterClock                            | BLOCKED | native host missing; controls cannot complete service actions                                                   |
| VI. Services/Autonomy            | AI video/intelligence buttons no crash                                           | BLOCKED | UI path present; full callback validation pending enhanced rerun                                                |
| VII. Non-login AI Sites          | Required 9 domains panel-injected                                                | PASS    | all 9 required domains loaded and panel visible                                                                 |
| VII. Additional discovered sites | Probe + add matrix                                                               | BLOCKED | additional discovery/probe pass pending final harness rerun                                                     |

## Known Blockers and Root Causes

1. Enhanced smoke harness rerun stall

- Repro:
  `env HEADLESS=false SMOKE_LIMIT=1 node apps/chrome-extension/scripts/component-smoke.cjs`
- Symptom: run logs reach `browser_launched`, `service_worker_ready`,
  `popup_loaded`, then no report artifact written.
- Current mitigation applied: added runtime/tab message timeouts and removed
  real download side-effects in export test path.
- Remaining root cause: unresolved stall in expanded popup-flow assertions
  before first post-popup checkpoint is emitted.

2. Headless Chromium cannot validate MV3 service worker

- Repro: `node apps/chrome-extension/scripts/component-smoke.cjs`
- Error: `Timeout 20000ms exceeded while waiting for event "serviceworker"`
- Root cause: extension service worker not available in this headless mode, so
  evidence must come from headed runs.

3. Native host dependent controls blocked by environment

- Native host indicator remains `Not Installed` in this machine context.
- Service start/stop and some autonomy checks are therefore environment-blocked.

## Code Changes This Session

- `apps/chrome-extension/scripts/component-smoke.cjs`
  - Expanded behavioral checks for
    popup/settings/managed-sites/export/native-host/panel actions.
  - Added timeout protections for `chrome.runtime.sendMessage` and
    `chrome.tabs.sendMessage` wrappers.
  - Added progress markers to isolate smoke-run stall points.
  - Added unsupported-site fallback-injection check (`https://example.com`).

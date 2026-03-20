# TNF Rclone Provider Extension Protocol

Last reviewed: March 20, 2026

## Scope

This protocol defines how TNF admin runtime integrates cloud providers beyond
native rclone backends without violating platform terms.

## Provider Modes

- `native_rclone`: provider is handled directly by rclone in managed workflow
  runs.
- `bridge_workflow`: provider is accessed only through official/documented
  interfaces and staged into approved remotes.
- `custom_connector`: provider requires transaction-aware or API-specific
  workflow that is not rclone-native.

## Current Mapping

- `pcloud`: `native_rclone`
- `degoo`: `bridge_workflow`
- `ardrive`: `custom_connector`

## Guardrails

- Degoo remotes are blocked from direct TNF managed rclone execution.
  - Reason: Degoo ToS and product constraints require avoiding reverse
    engineering/private API emulation.
- ArDrive/Turbo remotes are blocked from direct TNF managed rclone execution.
  - Reason: ArDrive storage flows are transaction-aware and should use Turbo
    APIs/SDK with pricing preflight.

## Research Notes

- Degoo ToS contains restrictions against reverse engineering and bypassing
  technical limitations.
- Degoo Help Center states no native desktop app and documents account/session
  limits in web upload workflows.
- ArDrive Turbo docs describe payment/upload APIs and subsidy behavior for small
  payloads.
- Rclone official docs provide native pCloud backend documentation.

## Runtime API

- `GET /admin/rclone/runtime/providers`
- `GET /admin/rclone/runtime/providers/:providerId/blueprint`
- `POST /admin/rclone/runtime/providers/ardrive/turbo/preflight`
- `POST /admin/rclone/runtime/providers/ardrive/turbo/queue`
- `GET /admin/rclone/runtime/providers/ardrive/turbo/queue`
- `POST /admin/rclone/runtime/providers/ardrive/turbo/queue/:queueId/transition`
- `GET /admin/rclone/runtime/providers/ardrive/turbo/worker`
- `POST /admin/rclone/runtime/providers/ardrive/turbo/worker/tick`
- `POST /admin/rclone/runtime/providers/ardrive/turbo/worker/process-one`
  - `submitted` transition is blocked unless a live Turbo payment quote is
    present on the queue item.
- `POST /admin/rclone/runtime/workflows/run`
  - Enforces provider guardrails for Degoo and ArDrive/Turbo aliases.
  - Direct ArDrive/Turbo and Degoo remotes remain blocked; use connector/bridge
    modes.

# TNF CLI Reconciliation Report

Date: 2026-05-13 UTC

## Scope

Audit and reconcile TNF CLI command behavior after control-plane migration away from CloudRuntime-by-default, while preserving legacy compatibility and restoring workflow-critical command paths.

## Evidence Artifacts

- Command surface inventory: `docs/protocols/reports/tnf-cli-command-paths-2026-05-13.json`
- CLI parity audit vs OpenClaw: `docs/protocols/reports/tnf-cli-parity-vs-openclaw-2026-05-13.json`
- Updated source: `packages/tnf-cli/src/cli.ts`
- Updated docs: `packages/tnf-cli/README.md`, `docs/reference/command-map.md`

## Findings

1. Control-plane commands were CloudRuntime-coupled in source:
- `master-clock start|logs|status`
- `super-cycle event|status`

2. Orchestration command drift existed:
- `tnf orchestrate` and `tnf agents orchestrate` were referenced in traits/menu but command handlers were missing.

3. No first-class deterministic self-improvement command namespace existed in TNF CLI.

## Reconciliation Changes

1. Provider-routed control-plane behavior implemented (local default):
- Added provider resolution with env fallback:
  - `TNF_CONTROL_PLANE_PROVIDER`
  - `TNF_MASTER_CLOCK_PROVIDER`
  - `TNF_SUPER_CYCLE_PROVIDER`
- Added explicit provider options:
  - `--provider local|cloud_runtime`
  - Legacy `--local` retained as shortcut.
- CloudRuntime adapter retained as explicit fallback, with runtime guard when `cloud_runtime` binary is unavailable.

2. `master-clock` command family updated:
- `tnf master-clock start` now local-by-default.
- `tnf master-clock logs` supports local log tail (`--lines`, `--no-follow`) and CloudRuntime fallback.
- `tnf master-clock status` now provider-routed and returns local status info.

3. `super-cycle` command family updated:
- `tnf super-cycle event` now provider-routed with local default.
- `tnf super-cycle status` now provider-routed with local default.

4. First-class self-improvement namespace added:
- `tnf self-improvement run`
- `tnf self-improvement status`
- `tnf self-improvement scorecard`
- `tnf self-improvement mermaid`
- `tnf self-improvement log`

`tnf self-improvement run` executes deterministic stages and then verifies expected artifacts and timestamp freshness before reporting success.

5. Orchestration workflow paths restored:
- Added root command `tnf orchestrate <workflow>`.
- Added alias `tnf agents orchestrate <workflow>`.

6. Trait vocabulary reconciled:
- Replaced `cloud_first` trait group with `provider_routed`.

## Validation

- Type-check passed:
  - `pnpm --filter @the-new-fuse/tnf-cli type-check`
- Build passed:
  - `pnpm --filter @the-new-fuse/tnf-cli build`
- Help surface checks (compiled CLI):
  - `node packages/tnf-cli/dist/cli.js self-improvement --help`
  - `node packages/tnf-cli/dist/cli.js master-clock start --help`
  - `node packages/tnf-cli/dist/cli.js super-cycle status --help`
  - `node packages/tnf-cli/dist/cli.js orchestrate --help`
  - `node packages/tnf-cli/dist/cli.js agents orchestrate --help`

## Notes

- In this sandbox, `./tnf` (tsx path) hit an IPC permission error (`EPERM` on temp pipe), so runtime help validation used the compiled CLI entrypoint (`dist/cli.js`).
- OpenClaw parity output includes environment/plugin warnings from the reference CLI; those were captured as evidence rather than treated as TNF regressions.


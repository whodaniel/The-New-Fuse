---
name: tnf-full-auto-network-autopilot
description:
  Provision TNF full-auto command+skill artifacts across agent runtimes and
  execute autonomous self-improvement loops without per-run human prompting.
---

# TNF Full-Auto Network Autopilot

Use this skill when Codex or any agent must self-bootstrap full-auto execution
across the TNF agent network.

## Objective

1. Install shared full-auto slash-command artifacts into available agent
   runtimes.
2. Install shared full-auto skill artifacts into available agent skill roots.
3. Execute deterministic TNF full-auto loop commands.
4. Verify status from persisted state/log artifacts.

## Command Contract

- Provision command+skill artifacts:
  - `tnf full-auto provision`
- Single unattended cycle:
  - `tnf full-auto once --base-url https://thenewfuse.com --api-url https://api.thenewfuse.com`
- Continuous unattended loop:
  - `tnf full-auto start --interval-minutes 30 --max-cycles 0 --broadcast`
- State inspection:
  - `tnf full-auto status`

## Required Environment

- `TNF_SUPER_ADMIN_TOKEN` configured in runtime.
- `TNF_SUPER_ADMIN_INPUT_TOKEN` available to the invoking process for protected
  commands.

## Verification

After any `once` or `start` action:

1. Run `tnf full-auto status`.
2. Confirm state file exists:
   - `docs/operations/tnf-full-auto-state.json`
3. Confirm run log exists:
   - `docs/operations/tnf-full-auto-runs.jsonl`

## Helper Script

Use script wrapper for deterministic sequencing:

```bash
bash .skills/tnf-full-auto-network-autopilot/scripts/bootstrap_full_auto_network.sh --repo /abs/path/to/The-New-Fuse --mode all --interval-minutes 30
```

## Failure Handling

- If provisioning fails for a specific target root, continue processing
  remaining targets and report skipped roots.
- If `full-auto once` fails, stop and inspect `tnf full-auto status` before
  moving to `start`.
- If `full-auto start --strict` fails, treat as blocking reliability event and
  remediate before resuming.

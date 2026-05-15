---
description: 'Run/install OpenClaw OAuth provider sync + cloud health autopilot'
subagent: 'custom-slash-command-agent'
category: 'operations'
---

Execute OpenClaw OAuth provider autopilot operations for TNF.

**Arguments**:

- Mode: `$1` (`run-once` | `install` | `status` | `uninstall`)

**Default mode**: `status` when `$1` is empty.

**Commands**:

- `run-once`
  - `bash scripts/runtime/openclaw-oauth-provider-cron.sh run-once`
- `install`
  - `bash scripts/runtime/openclaw-oauth-provider-cron.sh install`
- `status`
  - `bash scripts/runtime/openclaw-oauth-provider-cron.sh status`
- `uninstall`
  - `bash scripts/runtime/openclaw-oauth-provider-cron.sh uninstall`

**Example usage**:

```bash
/openclaw-oauth-autopilot install
/openclaw-oauth-autopilot run-once
/openclaw-oauth-autopilot status
```

Use repository root:
`/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse`.

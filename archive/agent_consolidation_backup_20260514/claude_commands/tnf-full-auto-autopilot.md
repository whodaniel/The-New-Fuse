---
description: "Provision full-auto command+skill across agent runtimes, then execute autonomous TNF loop"
subagent: "custom-slash-command-agent"
category: "self-improvement"
---

Run TNF full-auto autopilot in a protocol-safe, repeatable way.

**Arguments**:

- Mode: `$1` (`provision` | `once` | `start` | `status` | `all`)
- Interval minutes: `$2` (optional, defaults to `30` for `start`/`all`)

**Default mode**: `all` when `$1` is empty.

**Commands**:

- `provision`
  - `tnf full-auto provision`
- `once`
  - `tnf full-auto once --base-url https://thenewfuse.com --api-url https://api.thenewfuse.com`
- `start`
  - `tnf full-auto start --interval-minutes <interval> --max-cycles 0 --broadcast`
- `status`
  - `tnf full-auto status`
- `all`
  - run `provision`, then `once`, then `start`

**Example usage**:

```bash
/tnf-full-auto-autopilot provision
/tnf-full-auto-autopilot once
/tnf-full-auto-autopilot start 20
/tnf-full-auto-autopilot status
/tnf-full-auto-autopilot all 30
```

**Notes**:

- `tnf full-auto once|start` require Super Admin auth for self-improvement loop execution.
- Set `TNF_SUPER_ADMIN_INPUT_TOKEN` in environment before running unattended loops.
- Provisioning writes command + skill artifacts into detected agent homes (`~/.codex`, `~/.claude`, `~/.gemini`, `~/.opencode`, `~/.kilo`, `~/.augment`, `~/.tnf`, `~/.hermes`) and project runtime mirrors.

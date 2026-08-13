---
description:
  'Repair TNF launchd swarm jobs and run the TNF self-improvement loop audits'
subagent: 'custom-slash-command-agent'
category: 'self-improvement'
---

Run TNF "Don't Die" reliability operations end-to-end.

**Arguments**:

- Mode: `$1` (`repair-services` | `run-loop` | `all`)

**Default mode**: `all` when `$1` is empty.

**Commands**:

- `repair-services`
  - `bash scripts/runtime/repair-tnf-failing-services.sh`
- `run-loop`
  - `bash /Users/<owner>/.codex/skills/tnf-stack-self-improvement-loop/scripts/run_loop.sh --repo /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse --base-url https://thenewfuse.com --api-url https://api.thenewfuse.com`
- `all`
  - run `repair-services` then `run-loop`

**Example usage**:

```bash
/tnf-dont-die-loop all
/tnf-dont-die-loop repair-services
/tnf-dont-die-loop run-loop
```

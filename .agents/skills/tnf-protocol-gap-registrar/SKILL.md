---
name: tnf-protocol-gap-registrar
description: >-
  Systematically registers newly identified protocol gaps and vocabulary drift into the TNF Gap Checks surface, preserving protocols and emitting session handoffs.
---

# TNF Protocol Gap Registrar

## Overview
TNF relies heavily on strict vocabulary alignment and federated identity. When new gaps or drift risks are found, this skill allows an agent to systematically format them and inject them into the active `FULL_VOCABULARY_ALIGNMENT_AUDIT` or `AGENT_STATUS_LEDGER` files, ensuring that future sweeps check for these exact regressions.

## Dependencies
None.

## Quick Start
Create a JSON file containing the gaps (e.g., `gaps.json`):
```json
[
  {
    "area": "MCP server vocabulary",
    "location": "cli.ts",
    "risk": "Kind filter inconsistency"
  }
]
```

Run the registrar to append these to the latest audit report and emit the handoff:
```bash
uv run .agents/skills/tnf-protocol-gap-registrar/scripts/register_gaps.py --gaps gaps.json --target docs/protocols/reports/FULL_VOCABULARY_ALIGNMENT_AUDIT_2026-08-13.md
```

## Utility Scripts

### `register_gaps.py`
Reads a JSON array of gaps and safely appends them to the specified markdown file's "Gap Checks for Future Sweeps" section. Then it automatically runs `pnpm -w run handoff:emit` to synchronize the control plane.

**Arguments:**
- `--gaps`: Path to the JSON file containing the array of gaps to register.
- `--target`: Path to the markdown file to inject the gaps into.

## Rate Limiting
N/A - local file operations only.

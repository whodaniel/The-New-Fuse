---
name: tnf-hallucination-archeology
description: >-
  Automatically detects and recovers from agent hallucinations (massive unexpected code deletions or mangled files) by analyzing git history and performing surgical restores.
---

# TNF Hallucination Archeology

## Overview
This skill provides a systematic workflow for detecting when an agent has hallucinated a massive deletion or mangling of a file, and rolling back that file to the commit just before the hallucination occurred. It uses a helper script (`tnf_hallucination_hunter.py`) to safely analyze `git log --numstat` without messy bash parsing, allowing you to quickly spot anomalies where a file lost a huge percentage of its logic.

## Dependencies
None. Uses standard local `git` operations.

## Quick Start
If a build suddenly fails with missing imports, or a file seems mysteriously empty, scan it for hallucinations:

```bash
uv run .agents/skills/tnf-hallucination-archeology/scripts/tnf_hallucination_hunter.py scan src/v6/background/index.ts --limit 20 --output /tmp/scan_results.json
```

Then read `/tmp/scan_results.json` to find the commit hash where the hallucination occurred. 

Restore the file to its state *before* the hallucination:
```bash
uv run .agents/skills/tnf-hallucination-archeology/scripts/tnf_hallucination_hunter.py restore src/v6/background/index.ts <COMMIT_HASH> --output /tmp/restore_results.json
```

## Utility Scripts

### `tnf_hallucination_hunter.py scan`
Scans the recent git history of a file to detect commits where deletions vastly outnumbered additions (>100 lines deleted AND deletions > 3x additions).

**Arguments:**
- `file`: The path to the file to scan.
- `--limit`: (Required) The number of recent commits to check (e.g. 10 or 20).
- `--output`: (Required) JSON file to write results to.

### `tnf_hallucination_hunter.py restore`
Restores a file to the state `HEAD^1` of the specified commit hash. This safely checks out the file as it was *before* the agent mangled it.

**Arguments:**
- `file`: The path to the file to restore.
- `commit`: The hash of the commit where the hallucination occurred.
- `--output`: (Required) JSON file to write results to.

## Rate Limiting
N/A - purely local git operations.

## Common Mistakes
1. **Restoring the hallucination commit itself:** Make sure you pass the hash of the *bad* commit to `restore`. The script automatically uses `<commit>^1` to get the parent state.
2. **Not verifying the hallucination:** Before restoring, verify the JSON output from `scan` to ensure it's actually an agent hallucination and not a legitimate refactor where code was moved.

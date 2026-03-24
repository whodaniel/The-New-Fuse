---
name: tnf-frontload-protocols
description: TNF frontloading system design and operations. Use when Codex must build, verify, repair, or explain the frontload banner and context refresh for terminal shells (zsh) and OpenClaw, including cache regeneration, hook placement, and reproducible verification of what the user sees at session start.
---

# TNF Frontload Protocols

## Overview
Define, install, and verify the TNF frontload behavior so every new session renders the expected status banner and has fresh handoff context. Keep hooks minimal and reliable, avoid hard failures on missing cache, and provide fast verification scripts.

## Workflow
1. Identify the frontload surface.
Terminal shell (zsh) hook and OpenClaw handoff cache are primary.
2. Validate artifacts.
Confirm presence and freshness of `~/.tnf/handoff-current.json` and `~/.openclaw/workspace/handoff/LATEST.md`.
3. Repair or install.
Ensure the `~/.zshrc` block exists and `~/.tnf/tnf-status` can auto-regenerate the cache.
4. Verify output.
Run the verification script to confirm markers, executables, and cache status.

## Quick Commands
- Verify frontload state: `scripts/verify_frontload_state.sh`
- Install or repair hooks: `scripts/install_frontload_hooks.sh`
- Manually refresh cache: `~/.tnf/update-from-latest.sh`
- Show banner now: `~/.tnf/tnf-status`

## Files and Contracts
- `~/.zshrc` contains the frontload hook block.
- `~/.tnf/tnf-status` prints the banner and attempts cache regeneration.
- `~/.tnf/update-from-latest.sh` generates `~/.tnf/handoff-current.json` from OpenClaw’s `LATEST.md`.
- `~/.openclaw/workspace/handoff/LATEST.md` is the source of truth for handoff content.

## References
- `references/frontload-contract.md`
- `references/frontload-terminal.md`
- `references/frontload-openclaw.md`

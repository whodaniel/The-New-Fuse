---
name: tnf-frontload-protocols
category: tnf-platform
department: tech
description:
  TNF frontloading system design and operations. Use when an agent must build,
  verify, repair, or explain the frontload banner and context refresh for
  terminal shells (zsh), including cache regeneration, hook placement, and
  reproducible verification. OpenClaw handoff LATEST.md is an optional host
  feed, not required SoT.
---

# TNF Frontload Protocols

## Overview

Define, install, and verify the TNF frontload behavior so every new session
renders the expected status banner and has fresh handoff context. Keep hooks
minimal and reliable, avoid hard failures on missing cache, and provide fast
verification scripts.

Canonical handoff is TNF-native (`SESSION_HANDOFF_LATEST` →
`~/.tnf/handoff-current.json`). OpenClaw is optional; see
`docs/protocols/ADAPTABLE_HOST_VERIFICATION.md`.

**Work planes (always frontload):** (1) Core OSS / Super Admin harness — shared
`main`. (2) Deployer config — local/private env. (3) Tenant/personal — Supabase
or local-only; never public `main`. Turn Zero must restate this before agents
propose commits.

## Workflow

1. Identify the frontload surface. Terminal shell (zsh) hook is primary;
   OpenClaw LATEST.md is optional when that host is enlisted.
2. Validate artifacts. Confirm presence and freshness of
   `~/.tnf/handoff-current.json`. Check OpenClaw LATEST only when enlisted.
3. Repair or install. Ensure the `~/.zshrc` block exists and `~/.tnf/tnf-status`
   can auto-regenerate the cache.
4. Verify output. Run the verification script to confirm markers, executables,
   and cache status.

## Quick Commands

- Verify frontload state: `scripts/verify_frontload_state.sh`
- Install or repair hooks: `scripts/install_frontload_hooks.sh`
- Manually refresh cache: `~/.tnf/update-from-latest.sh`
- Show banner now: `~/.tnf/tnf-status`

## Files and Contracts

- `~/.zshrc` contains the frontload hook block.
- `~/.tnf/tnf-status` prints the banner and attempts cache regeneration.
- `~/.tnf/update-from-latest.sh` generates `~/.tnf/handoff-current.json`
  (OpenClaw LATEST is optional input).
- TNF `SESSION_HANDOFF_LATEST` is the canonical handoff content path.

## References

- `references/frontload-contract.md`
- `references/frontload-terminal.md`
- `references/frontload-openclaw.md`
- `docs/protocols/ADAPTABLE_HOST_VERIFICATION.md`

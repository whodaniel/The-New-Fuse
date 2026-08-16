# Executable Intelligence Artifact

**Artifact ID:** eia-c3f3ee12ceedeb7c **Spec:** tnf/executable-intelligence/0.2
**Generated:** 2026-08-16T19:45:17+00:00 **Class/Status:** [INTEL] [PENDING]

## Ownership & Release

- Owner Principal: danielgoldberg
- Visibility: private
- Release State: sealed
- Agent Allowlist: (none)
- Release Approved By: (not released)
- Released At: (not released)
- Release Note: (none)

## Source Attribution

- Source ID: apple-notes-new-may-2026-6366
- Type: note
- URI: apple-notes://on-my-mac/NEW-%20May-2026/6366
- Title: To-do All done
- Author:
- Publisher:
- Published At:
- Retrieved At: 2026-08-16T19:45:17+00:00

## Taxonomy of Actionability

### Procedural

- Execute safe disk recovery (git tmp, logs, caches, build artifacts)
- Add swarm log retention + heartbeat prune script
- $ cd /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse && node
- Orphaned git tmp*pack*\*
- Rebuilds on next desktop build
- npm/pnpm cache prune
- run weekly or cron it
- Library/pnpm store
- Gemini CLI sandbox home
- Plus cursor-agent ~527MB, Hermes ~224MB, gateway ~207MB
- Sourced from factory-boot.sh on next boot
- Recommended next steps
- Want me to wire the retention script into the super-cycle cron and restart
- Finished Desktop, heartbeat history, pnpm store sizes
- /Users/danielgoldberg/Library/pnpm 2>/dev/null 30s in
- ~20GB (mostly The-New-Fuse repo + apps)
- Repo tree: ~15GB (down ~5GB from git tmp packs, Tauri target, mirror
- pnpm store: ~8.4GB (pruned; still large but mostly active packages)
- the pulse script, and scripts/operations/swarm-disk-retention.sh is ready
- Gap: Heartbeat history hit 600MB+, Hermes cron output 15k files, git

### Strategic

- $ cd /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse && node
- /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com
- Desktop/A1-Inter-LLM-Com/The-New-Fuse
- Desktop/A1-Inter-LLM-Com

### Governance

- heap caps + audit
- bash scripts/operations/swarm-ram-profile.sh # audit
- (weekly) and add a disk floor gate to factory-boot:
- Same pattern for RAM: run swarm-ram-profile.sh audit on a schedule; alert
- Log retention is write-heavy, not policy-driven
- Full-auto needs failure taxonomy in ops:
- fleet recovery lives in scattered dated incident reports (March
- Full-auto failure modes + flag alignment

## Utility Metrics

- Freshness Decay: Medium
- Implementation Density: 0.083
- Verification Difficulty: Hard

## Synthesis

Artifact captures 20 procedural, 4 strategic, and 8 governance units. Use
procedural units for immediate execution, then vet strategic and governance
units through TNF gates before protocol adoption.

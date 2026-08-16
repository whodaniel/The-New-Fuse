# Executable Intelligence Artifact

**Artifact ID:** eia-5fd97ce2d1fe1742 **Spec:** tnf/executable-intelligence/0.2
**Generated:** 2026-08-16T19:45:31+00:00 **Class/Status:** [INTEL] [PENDING]

## Ownership & Release

- Owner Principal: danielgoldberg
- Visibility: private
- Release State: sealed
- Agent Allowlist: (none)
- Release Approved By: (not released)
- Released At: (not released)
- Release Note: (none)

## Source Attribution

- Source ID: apple-notes-new-may-2026-6383
- Type: note
- URI: apple-notes://on-my-mac/NEW-%20May-2026/6383
- Title: are slash commands and skills up to date? Is tnf cli up to date? Is…
- Author:
- Publisher:
- Published At:
- Retrieved At: 2026-08-16T19:45:30+00:00

## Taxonomy of Actionability

### Procedural

- Is tnf cli up to date?
- Is tnf cli agent up to date?
- Thought: The user wants me to verify if the slash commands, skills, TNF CLI,
  and TNF CLI agent are all up to date.
- First, let me check what slash commands exist in the CLI:
- # Verify TNF CLI TypeScript compiles
- $ cd /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse && pnpm exec
  tsc --noEmit -p packages/tnf-cli/tsconfig.json 2>&1 | head -20
- [WARN] The "pnpm" field in package.json is no longer read by pnpm.
- The following keys were ignored: "pnpm.overrides".
- See https://pnpm.io/settings for the new home of each setting.
- # Check git status for uncommitted changes
- $ cd /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse && git status
  --short 2>&1 | head -20
- M .agent/SYSTEM_PROMPT.md
- M .agent/agents/continuous-improver.md
- D .agent/agents/picoclaw-perplexity.md
- D .agent/agents/picoclaw-subject.md
- D .agent/agents/picoclaw-tester-benchmark.md
- D .agent/agents/picoclaw-tester-viability.md
- D .agent/agents/picoclaw-tester.md
- M .agent/agents/tnf-cli.md
- D .agent/fleet/users/agents/picoclaw-perplexity.md

### Strategic

- $ cd /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse && pnpm exec
  tsc --noEmit -p packages/tnf-cli/tsconfig.json 2>&1 | head -20
- $ cd /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse && git status
  --short 2>&1 | head -20
- Read Desktop/A1-Inter-LLM-Com/The-New-Fuse/.agent/agents/tnf-cli.md [limit=20,
  offset=195]
- Grep "slashCommands\.set\(|command\.name._=._'" in
  Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli/src/cli.ts (16 matches)
- Grep "command\.name ===" in
  Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli/src/cli.ts (15 matches)
- Read Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli/src/cli.ts
  [offset=4375, limit=150]
- Grep "slashCommands\.set\(" in
  Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli/src/cli.ts
- Grep "slashCommands.*set|slashCommands.*push|registerSlash" in
  Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli/src
- Grep "loadSlashCommands|getSlashCommands|slashCommand" in
  Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli/src/cli.ts (1 match)
- Read
  Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli/src/slashCommands.ts
  [limit=150]
- Read
  Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli/src/slashCommands.ts
  [limit=240, offset=150]
- Grep "skill| Skill" in Desktop/A1-Inter-LLM-Com/The-New-Fuse/.agent (10
  matches)
- Read Desktop/A1-Inter-LLM-Com/The-New-Fuse/.agent/agents/tnf-cli.md [limit=80]
- $ ls -la
  /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/.agent/skills/
  2>&1 | head -30
- $ ls -d
  /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/.agent/skills/\*/
  2>&1 | xargs -I{} basename {} | sort
- senior-architect - DOES NOT EXIST
- Read
  Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli/src/slashCommands.ts
  [limit=40, offset=181]
- - senior-architect
- Don't exist: behavioral-modes, clean-code, ui-ux-pro-max, senior-architect,
  systematic-debugging, trait-antigravity
- Edit
  Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli/src/slashCommands.ts

### Governance

- drwxr-xr-x 3 danielgoldberg staff 96 May 28 02:01 agent-discovery-protocol
- agent-discovery-protocol
- > node scripts/security/privacy-guard.cjs --mode=staged
- > node scripts/security/secret-sweep.cjs --mode=staged
- OPERATOR POLICY:
- TNF Protocol Pre-Flight Checks
- Protocol: Turn Zero Mandate
- Status: ACTIVE Protocol ID: TNF_TURN_ZERO_CANONICAL
- Step 2: Reading frontload policy files...
- Step 4: Verifying integrity...
- Protocol references validated
- Protocol: Living State Sync
- Protocol: Procedural Disclosure
- [Procedural Disclosure] Checking protocol alignment...
- Protocol: Session Handoff
- Protocol: Knowledge Tree Integrity
- Protocol: Integration Verification
- Protocol Check Summary
- Core Protocols: 48 protocol files
- - agent-discovery-protocol

## Utility Metrics

- Freshness Decay: Medium
- Implementation Density: 0.018
- Verification Difficulty: Hard

## Synthesis

Artifact captures 20 procedural, 20 strategic, and 20 governance units. Use
procedural units for immediate execution, then vet strategic and governance
units through TNF gates before protocol adoption.

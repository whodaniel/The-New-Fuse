# Executable Intelligence Artifact

**Artifact ID:** eia-9e5293e4bf14fda4 **Spec:** tnf/executable-intelligence/0.2
**Generated:** 2026-08-16T19:47:21+00:00 **Class/Status:** [INTEL] [PENDING]

## Ownership & Release

- Owner Principal: danielgoldberg
- Visibility: private
- Release State: sealed
- Agent Allowlist: (none)
- Release Approved By: (not released)
- Released At: (not released)
- Release Note: (none)

## Source Attribution

- Source ID: apple-notes-new-may-2026-6521
- Type: note
- URI: apple-notes://on-my-mac/NEW-%20May-2026/6521
- Title: Last login: Wed Aug 12 19:50:32 on console
- Author:
- Publisher:
- Published At:
- Retrieved At: 2026-08-16T19:47:21+00:00

## Taxonomy of Actionability

### Procedural

- Continue priority queue from SESSION_HANDOFF_LATEST.json
  continuation.resume_checklist.
- Emit a fresh handoff artifact immediately after completing the next critical
  work unit.
- Use 'tnf' as the entrypoint for OpenClaw and other Claw-type agent operations.
- Prefer native 'tnf <command>' routes first, then 'tnf openclaw ...' or 'tnf
  claw ...'.
- TURN ZERO ONBOARDING PROMPT (Copy/Paste for new agent sessions):
- Launch raw AI CLIs from the TNF repository root so ./docs/...
- or 'cat ~/.tnf/handoff-current.json' for raw JSON
- Step 1: Reading state files...
- Step 2: Reading frontload policy files...
- .agent/SYSTEM_PROMPT.md
- .agent/context/resource-map.md
- .agent/context/agent-onboarding.md
- Step 3: Reading session handoff...
- docs/protocols/reports/SESSION_HANDOFF_LATEST.json
- Step 3b: Session freshness...
- Step 4: Codebase structure...
- codebase_map.json
- Step 5: Integrity...
- KNOWLEDGE_TREE.json parsed, root=ec520d63532b9d5d
- Step 6: Repository synchronization...

### Strategic

- Workspace: /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse
- docs/protocols/mcp-nestjs-integration.md: [CLASS:INTEL] [STATUS:PENDING]
- docs/protocols/twip-orchestration-extension-v0.1.md: [CLASS:INTEL]
  [STATUS:PENDING]
- Protocol: Integration Verification
- creative: architecture-diagram, +21
- model-watchdog, +1 more
- tnf: TNF Free LLM Fleet, +51 more
- $ ls -la
  /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse/tools/ 0.1s
- $ pnpm tnf convo create --name "TNF FUSE Development Agents" --agents all
  --platform whatsapp 7.9s [exit 1]
- $ find
  /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse/apps/chrome-extension
  -name "manifest\*" -type f 0.1s
- $ ls -la
  /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse/apps/chrome-extension/dist-v6/
  0.1s
- $ ls -la
  /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse/apps/chrome-extension/dist-v6/native-host/
  0.1s
- $ ls -la
  /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse/apps/chrome-extension/dist-v7/native-host/
  0.1s
- $ cat
  "/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse/apps/chrome-extension/dist-v7/native-host/tnf-native-host.sh"
  0.1s [exit 1]
- $ find
  /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse/apps/chrome-extension
  -name "_.sh" -path "_/native-host/\*" 0.1s
- $ ls -la
  /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse/apps/chrome-extension/dist-v7/background/
  0.1s
- $ grep -n "chrome.commands.onCommand"
  /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse/apps/chrome-extension/dist-v7/background/index.js
  0.1s
- $ grep -n "chrome.commands.onCommand"
  /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse/apps/chrome-extension/src/v6/background/index.ts
  0.1s
- $ cat << 'EOF' { "name": "com.thenewfuse.native_host", "description": "Fuse
  Connect v7 - Controls TNF services from Chrome Extension", "path":
  "/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse/apps/chrome-extension/dist-v7/native-host/tnf-native-host.cjs",
  "type": "stdio", "allowed_origins": [
  "chrome-extension://fkbcklmcikdhpggaimfhomgncneppkbj/" ] } EOF 0.1s
- $ echo '{"action": "ping"}' | /Users/danielgoldberg/.local/bin/node
  /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse/apps/chrome-extension/dist-v7/native-host/tnf-native-host.cjs
  0.2s

### Governance

- Protocol enforcement layer implemented for mandatory session handoff
  continuity.
- OPERATOR POLICY:
- TNF Protocol Pre-Flight Checks
- Protocol: Turn Zero Mandate
- Step 2: Reading frontload policy files...
- Step 5: Integrity...
- Protocol references validated
- ~ failure-log scan [SKIPPED]
- Protocol: Living State Sync
- Protocol: Procedural Disclosure
- [Procedural Disclosure] Checking protocol alignment...
- docs/protocols/HANDOFF_PACKET_LIFECYCLE.md: [CLASS:PROTOCOL] [STATUS:ACTIVE]
- docs/protocols/HARNESS_CONFIG.md: [CLASS:PROTOCOL] [STATUS:ACTIVE]
- docs/protocols/HARNESS_HOST_COMPACTION.md: [CLASS:PROTOCOL] [STATUS:ACTIVE]
- docs/protocols/HARNESS_MEMORY_LAYER.md: [CLASS:PROTOCOL] [STATUS:ACTIVE]
- docs/protocols/HARNESS_PERMISSION_BERM.md: [CLASS:PROTOCOL] [STATUS:ACTIVE]
- docs/protocols/HARNESS_TRAJECTORY.md: [CLASS:PROTOCOL] [STATUS:ACTIVE]
- docs/protocols/agent-self-edit-protocol-v0.1.md: [CLASS:INTEL]
  [STATUS:PENDING]
- docs/protocols/resource-search-protocol-bridge.md: [CLASS:INTEL]
  [STATUS:PENDING]
- docs/protocols/tnf-cron-governance-protocol-v0.1.md: [CLASS:INTEL]
  [STATUS:PENDING]

## Utility Metrics

- Freshness Decay: Medium
- Implementation Density: 0.018
- Verification Difficulty: Hard

## Synthesis

Artifact captures 20 procedural, 20 strategic, and 20 governance units. Use
procedural units for immediate execution, then vet strategic and governance
units through TNF gates before protocol adoption.

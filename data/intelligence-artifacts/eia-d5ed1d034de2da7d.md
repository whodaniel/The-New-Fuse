# Executable Intelligence Artifact

**Artifact ID:** eia-d5ed1d034de2da7d **Spec:** tnf/executable-intelligence/0.2
**Generated:** 2026-05-17T14:17:14+00:00 **Class/Status:** [INTEL] [PENDING]

## Ownership & Release

- Owner Principal: danielgoldberg
- Visibility: private
- Release State: sealed
- Agent Allowlist: (none)
- Release Approved By: (not released)
- Released At: (not released)
- Release Note: (none)

## Source Attribution

- Source ID: apple-notes-new-may-2026-6220
- Type: note
- URI: apple-notes://on-my-mac/NEW-%20May-2026/6220
- Title: Core package now passes too. Let me do a final comprehensive check…
- Author:
- Publisher:
- Published At:
- Retrieved At: 2026-05-17T14:17:14+00:00

## Taxonomy of Actionability

### Procedural

- # Final tnf-cli type check
- $ cd
  /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli
  && npx tsc --noEmit 2>&1 | grep -v "npm warn" | grep "error TS" | wc -l
- $ cd
  /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-core
  && npx tsc --noEmit 2>&1 | grep -v "npm warn" | grep "error TS" | wc -l
- Fix curl|sh RCE in UpgradeService.ts (line 246)
- Re-verify tnf-cli after UpgradeService fix
- Fix api-client missing .js extensions on 13 integration files + index
- Replaced curl URL | sh (pipe-to-shell remote code execution) with safe fetch()
- 22 api-client missing .js extensions
- Added .js to 13 integration files importing ../../core/ApiClient and
  ../../config/ApiConfig + fixed services/index.ts and root index.ts
- tnf-cli tsc --noEmit
- api-client tsc --noEmit
- api-types tsc --noEmit
- Created src/index.ts (TNFCore class), src/chat/ChatManager.ts (full
  ChatManager), tsconfig.json, updated package.json to point to dist/
- Removed process.env[SUPER_ADMIN_ENV_KEY] from auth check in cli.ts:76
- 4 ProjectConfigService default config
- Converted readVoiceBridgeJson, postVoiceSend, postVoiceActivate,
  waitForVoiceServer from spawnSync('curl') to async fetch() with timeouts
- Converted 3 more spawnSync('curl') calls to async fetch()
- Changed ^6.0.2 to ^5.8.3 in tnf-cli/package.json
- Added missing isDefault: false to 3 model config objects
- "default deny" in cli.ts

### Strategic

- $ cd
  /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli
  && npx tsc --noEmit 2>&1 | grep -v "npm warn" | grep "error TS" | wc -l
- $ cd
  /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-orchestrator-go
  && go vet ./...
- $ cd
  /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-core
  && npx tsc --noEmit 2>&1 | grep -v "npm warn" | grep "error TS" | wc -l
- Fix api-client missing .js extensions on 13 integration files + index
- Added .js to 13 integration files importing ../../core/ApiClient and
  ../../config/ApiConfig + fixed services/index.ts and root index.ts
- ./types.js in 4 files (ContextAwareOrchestrator, provider-registry,
  vector-store, pinecone-provider)
- Added missing isDefault: false to 3 model config objects
- Added .js to 13 integration files importing ../../core/ApiClient and
  ../../config/ApiConfig + fixed services/index.ts and root index.ts kebab-case
  imports
- - packages/core/src/agents/orchestration/ContextAwareOrchestrator.ts
- - packages/core/src/vectordb/provider-registry.ts
- - packages/core/src/vectordb/providers/pinecone-provider.ts
- - LLM client llm-client.ts exposes Gemini API key in URL query parameter
    (Gemini's API design requirement)

### Governance

- Verify infrastructure package import safety in RedisAgentClient

## Utility Metrics

- Freshness Decay: High
- Implementation Density: 0.114
- Verification Difficulty: Hard

## Synthesis

Artifact captures 20 procedural, 12 strategic, and 1 governance units. Use
procedural units for immediate execution, then vet strategic and governance
units through TNF gates before protocol adoption.

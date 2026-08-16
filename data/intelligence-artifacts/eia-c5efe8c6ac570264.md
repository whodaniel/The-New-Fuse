# Executable Intelligence Artifact

**Artifact ID:** eia-c5efe8c6ac570264 **Spec:** tnf/executable-intelligence/0.2
**Generated:** 2026-08-16T19:45:19+00:00 **Class/Status:** [INTEL] [PENDING]

## Ownership & Release

- Owner Principal: danielgoldberg
- Visibility: private
- Release State: sealed
- Agent Allowlist: (none)
- Release Approved By: (not released)
- Released At: (not released)
- Release Note: (none)

## Source Attribution

- Source ID: apple-notes-new-may-2026-6367
- Type: note
- URI: apple-notes://on-my-mac/NEW-%20May-2026/6367
- Title: Deep audit complete. Here is how the heartbeat/stall defensive stack
- Author:
- Publisher:
- Published At:
- Retrieved At: 2026-08-16T19:45:19+00:00

## Taxonomy of Actionability

### Procedural

- The docs define three federated namespaces (.agent/ROLE_DEFINITIONS.md
- in the content script
- Session handoff JSON had no mcid block
- Turn Zero / handoff / frontload / self-prompt alignment
- Refreshed JSON + MD +
- ~/.tnf/handoff-current.json
- Step 48 added for this
- FUSE_ONBOARDING_CONTEXT handler in content script (frontload was a
- Frontload packet enriched with federation axes + agent idNumber roster
- Page-agent heartbeats carry idNumber / canonicalEntityId
- SESSION_HANDOFF_LATEST.json
- curl http://127.0.0.1:3007/health
- node scripts/gemini-redis-wrapper.cjs
- Test targeted chat: @GLM one sentence reply with [GLM] prefix

### Strategic

- (none)

### Governance

- Title: Deep audit complete.
- QDeep audit complete.
- Attribution sequence for messages/content
- That aligns with Handoff v1.1 (cumulativeId + gate
- Stall recovery frames used from: stall-detector with audit trace only
- points to audit doc
- frontload policy.autonomous
- The audit doc is the single place to pick up the ID#/heartbeat/stall

## Utility Metrics

- Freshness Decay: Low
- Implementation Density: 0.144
- Verification Difficulty: Hard

## Synthesis

Artifact captures 14 procedural, 0 strategic, and 8 governance units. Use
procedural units for immediate execution, then vet strategic and governance
units through TNF gates before protocol adoption.

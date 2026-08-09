# Executable Intelligence Artifact

**Artifact ID:** eia-abde70369e2aef6d **Spec:** tnf/executable-intelligence/0.2
**Generated:** 2026-08-09T04:36:30+00:00 **Class/Status:** [INTEL] [PENDING]

## Ownership & Release

- Owner Principal: danielgoldberg
- Visibility: private
- Release State: sealed
- Agent Allowlist: (none)
- Release Approved By: (not released)
- Released At: (not released)
- Release Note: (none)

## Source Attribution

- Source ID: apple-notes-new-may-2026-6403
- Type: note
- URI: apple-notes://on-my-mac/NEW-%20May-2026/6403
- Title: Now the picture is clear. Three critical notes:
- Author:
- Publisher:
- Published At:
- Retrieved At: 2026-08-09T04:36:30+00:00

## Taxonomy of Actionability

### Procedural

- The real Hermes-TNF interface is Redis pub/sub via the bridge script.
- EADDRINUSE on 3007 means a third attempted startup crashed.
- Now let me build the federation
- I'll write a small script that:
- - probes Redis PING + agent count + bus queue sizes
- sequence-checker script:I'll write the federation sequence-checker

### Strategic

- Final architecture picture:
- backup model is mistralai/mistral-large-3-675b-instruct-2512 (per hermes
  status).

### Governance

- - The redis-ws-bridge.log you've been staring at is the older, broken,
    swapping WS protocol that's been error-spamming on every tick.

## Utility Metrics

- Freshness Decay: Medium
- Implementation Density: 0.158
- Verification Difficulty: Hard

## Synthesis

Artifact captures 6 procedural, 2 strategic, and 1 governance units. Use
procedural units for immediate execution, then vet strategic and governance
units through TNF gates before protocol adoption.

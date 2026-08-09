# Executable Intelligence Artifact

**Artifact ID:** eia-bcc87eda6bd3049e **Spec:** tnf/executable-intelligence/0.2
**Generated:** 2026-08-09T04:36:31+00:00 **Class/Status:** [INTEL] [PENDING]

## Ownership & Release

- Owner Principal: danielgoldberg
- Visibility: private
- Release State: sealed
- Agent Allowlist: (none)
- Release Approved By: (not released)
- Released At: (not released)
- Release Note: (none)

## Source Attribution

- Source ID: apple-notes-new-may-2026-6402
- Type: note
- URI: apple-notes://on-my-mac/NEW-%20May-2026/6402
- Title: Procedural note before I start — I caught the exact instruction
  earlier…
- Author:
- Publisher:
- Published At:
- Retrieved At: 2026-08-09T04:36:31+00:00

## Taxonomy of Actionability

### Procedural

- I'll lock in what I think you want: every fix I ship here must be sequenced
  (probe
- re-probe), trigger the existing automations the system already knows about
  (Turn End, handoff, broker/director wake), and prompt the next checkpoint
  rather than terminate silently.
- Per ~/.tnf/gateway-bridge.json, the Hermes bridge is Redis pub/sub (via
  hermes-tnf-a2a-bridge.py), NOT a WebSocket bridge on :7788/:4000.

### Strategic

- (none)

### Governance

- (none)

## Utility Metrics

- Freshness Decay: Medium
- Implementation Density: 0.188
- Verification Difficulty: Hard

## Synthesis

Artifact captures 3 procedural, 0 strategic, and 0 governance units. Use
procedural units for immediate execution, then vet strategic and governance
units through TNF gates before protocol adoption.

# Executable Intelligence Artifact

**Artifact ID:** eia-bf486eb8bb6f71ac **Spec:** tnf/executable-intelligence/0.2
**Generated:** 2026-08-16T19:47:13+00:00 **Class/Status:** [INTEL] [PENDING]

## Ownership & Release

- Owner Principal: danielgoldberg
- Visibility: private
- Release State: sealed
- Agent Allowlist: (none)
- Release Approved By: (not released)
- Released At: (not released)
- Release Note: (none)

## Source Attribution

- Source ID: apple-notes-new-may-2026-6514
- Type: note
- URI: apple-notes://on-my-mac/NEW-%20May-2026/6514
- Title: To-do All done
- Author:
- Publisher:
- Published At:
- Retrieved At: 2026-08-16T19:47:12+00:00

## Taxonomy of Actionability

### Procedural

- Fix tnf-cli test suite (whatsapp.test.ts chain)
- Run verification tests for all fixes
- New: packages/tnf-cli/src/services/WorkerEnvelope.ts
- Tests: WorkerEnvelope.test.ts added to suite
- WS channel check uses discoverRelayUrl() (3007 first)
- live-agent-work-check.cjs: listener check includes :3007; WS check
- tnf-cli test suite
- whatsapp.test.ts was already removed from package.json; added
- WorkerEnvelope.test.ts.
- Full pnpm test in packages/tnf-cli: pass
- (including command-surface snapshot).
- pnpm test (tnf-cli)
- node scripts/protocols/check-federated-ws-channels.cjs
- model-policy.yaml allow_cloud / local
- What you can run now
- pnpm run tnf:ws:channels:check
- pnpm run tnf:live:agents:write
- I did not create a git commit.
- the next repair lane (extension lifecycle, model-policy, full-auto
- procedures, then committing.

### Strategic

- Codify three-transport-lane model in protocols/docs
- model-policy.yaml allow_cloud / local
- Cost/prelaunch policy
- cd /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse
- the next repair lane (extension lifecycle, model-policy, full-auto
- $ cd "/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse" &&
- ...1-Inter-LLM-Com/TNF/The-New-Fuse/docs/protocols
- Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse/scripts
- P0: ~/.tnf/sub-director/model-policy.yaml
- I can push the commit, tackle model-policy wiring, or run pnpm run

### Governance

- model-policy.yaml allow_cloud / local
- Cost/prelaunch policy
- the next repair lane (extension lifecycle, model-policy, full-auto
- guidelines need to be hardened in the harness protocol standard
- Updating protocol docs and handoff artifacts, hardening harness
- Protocol & log updates (pre-commit)
- P0: ~/.tnf/sub-director/model-policy.yaml
- I can push the commit, tackle model-policy wiring, or run pnpm run

## Utility Metrics

- Freshness Decay: Medium
- Implementation Density: 0.152
- Verification Difficulty: Hard

## Synthesis

Artifact captures 20 procedural, 10 strategic, and 8 governance units. Use
procedural units for immediate execution, then vet strategic and governance
units through TNF gates before protocol adoption.

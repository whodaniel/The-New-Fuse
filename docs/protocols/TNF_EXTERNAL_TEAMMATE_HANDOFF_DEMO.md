# External Teammate Handoff Demo (TNF ↔ Grok Bot-class peers)

**Date:** 2026-08-13  
**Protocol:** `TNF_EXTERNAL_TEAMMATE_RUNTIME_INTEROP.md`  
**Script:** `scripts/protocols/demo-external-teammate-handoff.cjs`  
**Intent:** Prove the *nervous system* claim with a concrete cross-vendor span —
not a screenshot of chatting with one vendor bot.

---

## Scenario

Simulate (or later live-drive) this topology:

```
TNF Orchestrator
  ├─ Worker A: local / Claude lane (planning)
  ├─ Worker B: Grok 4.6 lane (long-running research/code)   ← model inside TNF
  └─ Peer ETR: etr:spacexai:grok-bot (inbox/ops specialty) ← runtime outside TNF
         ↑ assign envelope + lineage
         ↓ callback completed | needs_approval | failed
```

**Claim under test:** TNF keeps ownership, policy, and lineage coherent while
work crosses a vendor teammate boundary.

---

## Steps

1. Load Turn Zero artifacts (`runtime-state.json`, `swarm-context.md`,
   `handoff-current.json`, `lessons-learned.md`).
2. Run:
   ```bash
   node scripts/protocols/demo-external-teammate-handoff.cjs
   ```
3. Confirm stdout shows:
   - validated `tnf.etr.assign.v1` envelope
   - lineage parent → child span IDs
   - simulated ETR callback `completed`
   - append to `~/.tnf/logs/etr-handoff.jsonl`
4. Optional live follow-up (operator-gated): point adapter at a real Grok Bot
   session once API/automation surface is available; do **not** paste credentials
   into the demo script.

---

## Success criteria

| Check | Pass |
| --- | --- |
| Envelope validates | required fields present |
| Lineage written | jsonl row with parent/child |
| Policy respected | `credential_grant=none` in default demo |
| No vendor lock-in in narrative | demo labels ETR as peer, Grok 4.6 as fleet model |

---

## Recording

After a green run, append a one-line result to:

- `docs/protocols/bridges/reports/tnf-to-external-teammate-runtime.md`
- `~/.tnf/lessons-learned.md` only if a failure/correction occurred

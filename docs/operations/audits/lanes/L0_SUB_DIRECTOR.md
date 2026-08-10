# L0 — Local Sub-Director Coordination Receipt
**Lane**: L0 Sub-Director  
**Identity**: `tnf-local-subdirector` / NFT `local-oss-5cf0356cd5d96efe`  
**Wallet**: `0x5cf0356cd5d96efe33394821ffacd84789299a74`  
**Mandate**: `docs/operations/audits/FULL_ENCHILADA_HARNESS_PLATFORM_AUDIT_MANDATE_2026-08-09.md`  
**Issued**: 2026-08-09T21:26:00-04:00  
**Mode**: REPORT ONLY  
**Synthesis**: `docs/operations/audits/FULL_ENCHILADA_AUDIT_REPORT_2026-08-09.md`

---

## Role performed

1. Confirmed identity (`~/.tnf/agent.yaml`).
2. Ran live CLI evidence: `tnf fleet core-status`, `alive status`, `harness inspect`, `harness fleet-status`, `list`, `state show`, `protocol gate` (exit 1), `paths`, `menu --help`, plus interop/UX help probes.
3. Inspected runtime: core-fleet-latest, autopilot-latest, local-subdirector stdout, launchctl `com.tnf.*` / `com.thenewfuse.*`, `~/.tnf` entry flood (~77k).
4. Incorporated lane receipts L1–L7; **downgraded early L2 greenwash** in favor of corrected L2 + L4/L5/L7 + autopilot.
5. Wrote full synthesis report + this receipt. **No refactors.**

---

## Autopilot (authoritative local health)

Parsed from `~/.tnf/subdirector-autopilot/state/subdirector-autopilot-latest.json`:

| Field | Value |
|-------|-------|
| status | `degraded` |
| localSubdirectorStatus | `critical` |
| masterHeartbeatStatus | `cycle-running` |
| frontloadStatus | `healthy` |
| OpenClaw handoff | stale &gt;24h |
| Actions | restart master-heartbeat, restart local-subdirector, terminal heartbeat pulse, refresh OpenClaw handoff |

**Rule**: core-fleet `ok` = bootstrap endowment only. Autopilot `degraded`/`critical` = not healthy for autonomy claims.

---

## Lane map status

| Lane | Receipt | Quality / note |
|------|---------|----------------|
| L0 | this file | synthesis owner |
| L1 | `L1_PROTOCOL_AUTHORITY.md` | excellent — P0 gate dual-verdict, Living State sludge, SHA drift |
| L2 | `L2_HARNESS_RUNTIME.md` | corrected later receipt trusted; early “healthy / no spam” **rejected** |
| L3 | `L3_CLI_UX_SURFACE.md` | excellent — menu omits fleet/alive |
| L4 | `L4_INTEROP_MCP.md` | excellent — MCP 3-way SOT, bridge false ONLINE |
| L5 | `L5_AGENT_SWARM.md` | **authoritative** — ~933/954 zombies, PEM-in-heartbeat flag, thin-client root cause, orchestrate false SUCCESS |
| L6 | `L6_PLATFORM_PRODUCT_UX.md` | excellent — forefront = cockpit |
| L7 | `L7_STATE_GROWTH_OPS.md` | excellent — swarm-context flood, disk near-full |

---

## Top 10 findings (L0 collapse)

1. **P0** Disk near-full + unbounded `swarm-context-*.md` (~77k) + fat autopilot history — ENOSPC class.
2. **P0** Protocol gate prints ALL PASSED then CI blocks (exit 1).
3. **P0** Living State “SYNCHRONIZED” append-sludge + handoff SHA ≠ HEAD.
4. **P0** Harness inspect PASS while autopilot critical / zombies / disk fail.
5. **P0** MCP three-way SOT (home vs config vs client exports).
6. **P0** A2A bridge ONLINE from June-stale Redis; process absent.
7. **P0** Thin-client zombie flood (~933/954) + PEM material in heartbeat JSON (scrub).
8. **P1** Worker crons fail with `exit 0`; curated menu omits Fleet/Alive/growth-audit Day-1 spine.
9. **P1** Authority hierarchy split (DACC / crypto seats / Sub-Director / handoff.owner).
10. **P1** `assimilate link` stub sold as onboard; growth-audit severity `ok` at 96% full.

---

## Best User Flow (L0 canonical)

```text
tnf onboard
tnf fleet establish && cat ~/.tnf/core-fleet-latest.json   # bootstrap ok
tnf alive up && tnf alive status
# ALSO read: ~/.tnf/subdirector-autopilot/state/subdirector-autopilot-latest.json
tnf growth-audit                                          # action if ≥95% full
tnf forefront && tnf forefront status
tnf harness inspect && tnf harness cycle                  # distrust PASS if above red
tnf state show && tnf protocol gate                       # expect tip/change-set truth
# interop optional: tnf mcp sync/generate; prefer tnf cursor|claude|pi over assimilate link
tnf doctor
# act with one owner → verify → tnf turn-end
```

---

## Conflicts enforced

- Prefer **process + TTL + autopilot + df** over any single PASS/ok/ONLINE/SYNCHRONIZED badge.
- Prefer **L1/L4/L7** over early optimistic L2.
- Prefer **Sub-Director** as live audit commander; Orchestrator = master-clock, not silent commander of this host.
- Orchestrate goal routing marked **unsafe** for report-only audits (false SUCCESS baseline).

---

## Next gated acts (operator approval required)

1. Disk reclaim + stop/cap swarm-context history writers.  
2. Living State Current Directive rewrite + tip-align handoff emit.  
3. MCP SOT unify + absolute cwd.  
4. Honest bridge status (+ start or mark OFFLINE).  
5. Menu Day-1 Fleet & Alive strip.  

**Lane complete.** Report-only.

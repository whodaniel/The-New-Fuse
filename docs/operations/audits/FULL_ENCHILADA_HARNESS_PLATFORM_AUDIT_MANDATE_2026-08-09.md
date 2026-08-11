# FULL ENCHILADA — Federated Harness & Platform Multi-Expert Audit Mandate
**Issued**: 2026-08-09T21:15:00-04:00
**Authority**: Local Sub-Director (`tnf-local-subdirector`, NFT `local-oss-5cf0356cd5d96efe`)
**Scope**: TNF harness + platform (CLI, protocols, fleet, orchestration, UX, agent registry, MCP/interop, state)
**Mode**: LIVE federated multi-expert audit — report only (no silent code changes unless explicitly gated)
**Output**: `docs/operations/audits/FULL_ENCHILADA_AUDIT_REPORT_2026-08-09.md` (+ per-lane receipts under `docs/operations/audits/lanes/`)

## Mission Questions (answer all)
1. What makes sense? (keep / double-down)
2. What is missing? (gaps that block coherence or operator success)
3. What is confusing? (overlaps, naming, dual SOTs, contradictory docs)
4. What could/should be refactored? (structure, CLI surface, agent roles, protocols)
5. What is the best User flow? (onboarding → forefront → fleet → audit → act → verify)

## Expert Lanes (lane owners stay in role)
| Lane | Role | Primary surfaces |
|------|------|------------------|
| L0 Sub-Director | Coordinate, dedupe, synthesize, enforce lane map | `tnf fleet`, register, Redis bus, launchd, autopilot |
| L1 Protocol/Authority | Turn Zero, Living State, handoff, protocol gate contradictions | `docs/protocols/*`, `tnf protocol`, `tnf state` |
| L2 Harness/Runtime | alive/daemon, heartbeat, harness cycle/loop/inspect, thin-client spam | `tnf harness`, `tnf alive`, launch agents |
| L3 CLI/UX Surface | Command discoverability, foremost operator path, menu/paths/traits | `tnf menu`, `tnf paths`, TUI, splash, docs |
| L4 Interop/MCP/Assimilate | Cursor/Claude/Hermes/Pi/Codex routing parity | `tnf assimilate`, `tnf mcp`, `tnf parity` |
| L5 Agent Swarm/Registry | Agent duplication, embodiment/roles, thin-client zombies | `tnf list`, registry, subdirector workers |
| L6 Platform/Product UX | Local UI, forefront, browser-control, journeys | `tnf local-ui`, `tnf forefront`, journey audits |
| L7 State/Growth/Ops Hygiene | Growth audit, locks/pids, report rot, audit backlog residue | `tnf growth-audit`, state-governor, ops docs |

## Required method per lane
1. INSPECT with live `tnf` commands + files (cite paths)
2. ACT only to collect evidence / write lane receipt (no drive-by refactors)
3. VERIFY claims with command output or file evidence
4. Emit structured findings: severity (P0–P3), evidence, impact, recommended fix, owner

## Sub-Director synthesis contract
- Collapse lane receipts into one report with: Executive Verdict, Keep, Missing, Confusing, Refactor, Best User Flow (step-by-step), Prioritized Backlog (P0→P3)
- Call out conflicts between experts explicitly
- Prefer operator clarity over architecture religion

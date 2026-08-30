# L4+L5 INTEROP SWARM RECEIPT — 2026-08-09

Mandate: FULL_ENCHILADA_HARNESS_PLATFORM_AUDIT_MANDATE_2026-08-09.md Mode:
REPORT ONLY (no fixes applied) Lane owners: L4 Interop/MCP/Assimilate + L5 Agent
Swarm/Registry Sub-Director: tnf-local-subdirector Repo: <TNF_ROOT> Branch:
fix/honest-failure-reporting

---

## Evidence Collection Commands Executed

- tnf list (full output logged — 1018 tnf-thin-client duplicates, all Role:
  worker)
- tnf parity status (38% mean coverage, 190 open gaps, 5 unreachable agents)
- tnf assimilate --help (run, scan, link commands present)
- data/agent-registry/agents.json inspected (136 agents, 136 unique names — no
  name duplication in registry file; duplication is in live tnf list swarm, not
  in JSON)
- .tnf/mcp.json + .tnf/mcp-config.json inspected (3 MCP servers: core, enhanced,
  complete-api-wrapper)
- .agent/staffing-coverage-report.md exists; .agent/ROLE_DEFINITIONS.md MISSING
- .tnf/session-discovery/terminal-role-map.json + .tnf/authority/roles.json
  present
- data/agent-registry/profiles/ empty; registry_summary.json MISSING
- scripts/handoff-pre-validator.js MISSING;
  scripts/validation/validate-architecture.js MISSING (skill reference:
  tnf-validation-pipeline-fixer — pre-check disk 70%, safe; scripts missing —
  not repaired per REPORT ONLY mandate)

---

## L5 — AGENT SWARM / REGISTRY FINDINGS

### P0: tnf-thin-client zombie duplication (massive swarm pollution)

Evidence:

- tnf list: 1018 entries with Role: worker, all displaying `tnf-thin-client`
- IDs are timestamp-based (e.g., agent_tnf-thin-client_1786313728546) — each
  spawned separately
- Only ONE green entry (latest) vs 1017 red/stale entries Impact:
- Registry view is useless for operator; swarm health impossible to read
- Fleet reconciliation (tnf fleet) will see phantom workers consuming state
- Reference-transaction hook cannot distinguish real worker from zombie
  Recommended fix:
- Deduplicate by agent name + role + last-seen threshold (< 1h = alive); archive
  rest
- Add registry-level dedup enforcement before swarm registration
- Investigate spawn loop source (cron? harness loop? thin-client auto-restart?)
  Owner: L5 Agent Swarm / registry maintainer

### P1: Registry JSON has 136 unique agents; live swarm has 1018 zombies — registry ≠ live swarm

Evidence:

- data/agent-registry/agents.json: 136 agents, 136 unique names, no duplicates
- data/agent-registry/profiles/: EMPTY directory
- data/agent-registry/registry_summary.json: MISSING
- .agent/staffing-coverage-report.md exists but .agent/ROLE_DEFINITIONS.md
  MISSING Impact:
- No profile-level embodiment/role definitions exist in repo
- Registry summary absent — no high-level view of agent health categories
- Staffing report exists in isolation, not linked to registry schema Recommended
  fix:
- Create profiles/ directory with per-agent role/embodiment cards
- Generate registry_summary.json from agents.json + staff-coverage report
- Restore .agent/ROLE_DEFINITIONS.md linking roles (sub-director,
  analysis-agent, worker) to registry IDs Owner: L5 / L2 Harness

### P2: Role / embodiment definitions fragmented

Evidence:

- .tnf/session-discovery/terminal-role-map.json present (role: analysis-agent,
  local-subdirector-owner, etc.)
- .tnf/authority/roles.json present (sub-director granted_by operator)
- .agent/ROLE_DEFINITIONS.md MISSING
- docs/protocols/ contain no dedicated embodiment/role spec file Impact:
- Operator cannot determine which agent should embody which role in multi-agent
  chat
- Cursor/Claude/Hermes interop surfaces lack common role vocabulary Recommended
  fix:
- Create docs/protocols/AGENT_EMBODIMENT_SPEC.md mapping terminal roles →
  registry agents → CLI surfaces
- Restore .agent/ROLE_DEFINITIONS.md with cross-reference to registry IDs Owner:
  L5 / L1 Protocol

---

## L4 — INTEROP / MCP / ASSIMILATE FINDINGS

### P0: Cross-agent parity broken (critical for federated harness)

Evidence (tnf parity status):

- 8 tracked agents, 5 unreachable
- Coverage 38% mean, 190 open gaps
- hermes: 0% (21 gaps) — Hermes Agent v0.20.0 options only
- claude: 13% (66 gaps) — 2.1.226
- pi: 16% (37 gaps) — 0.84.1
- cursor-agent: 27% (30 gaps)
- codex: 39% (19 gaps)
- jules: 67% (2 gaps) — Error: unknown flag: --version
- opencode: 71% (7 gaps)
- kilo: 73% (8 gaps)
- gemini / openclaw / amp / crush / aider: NOT INSTALLED Impact:
- Interop surface is severely asymmetric; L4 assimilation cannot route reliably
  across CLI surfaces
- Hermes (primary agent framework) has ZERO parity — complete routing gap
- Jules version-check failure indicates broken provider handshake Recommended
  fix:
- Prioritize Hermes parity (21 gaps) before any multi-agent swarm coordination
- Fix Jules --version flag or exclude Jules from parity tracking until fixed
- Add parity enforcement gate in CI (minimum 70% mean before release) Owner: L4
  Interop / L0 Sub-Director

### P1: Assimilation surface exists but unvalidated

Evidence:

- tnf assimilate --help shows run, link, scan commands
- .tnf/mcp.json defines 3 MCP servers (core, enhanced, complete-api-wrapper) —
  all enabled
- .tnf/mcp-config.json mirrors same 3 servers with workspace path
- No assimilate-run output or scan result files present in repo
- No validation script confirms assimilation routing works Impact:
- Assimilation commands exist but no verification artifacts prove they work
- MCP server definitions are present but runtime health not tracked Recommended
  fix:
- Add scripts/protocols/assimilate-verify.cjs that runs `tnf assimilate run`
  against each provider and records PASS/FAIL
- Include assimilation status in registry_summary.json
- Link assimilation results to L4 parity gaps (if provider unreachable, gap
  increases) Owner: L4 Interop

### P2: Interop surfaces (Cursor/Claude/Hermes/Pi/Codex) have partial presence but no common registry linkage

Evidence:

- .cursor/agent-cli-state.json, cli-config.json present (Cursor surface alive)
- .claude/agents/, commands/, hooks/ present (Claude surface alive)
- .gemini/ (Hermes) present; .pi/ present; .codex/ present
- No cross-reference file maps these CLI surfaces to registry agent IDs
- .agent/skill-bank/ exists but no interop mapping Impact:
- Multi-agent swarm cannot route tasks to correct CLI surface automatically
- Interop audit requires manual inspection of each .directory Recommended fix:
- Create docs/protocols/INTEROP_SURFACE_MAP.md linking each CLI dir (.cursor,
  .claude, .gemini, .pi, .codex) to registry agents and parity status
- Include this map in registry_summary.json Owner: L4 / L5

---

## SKILL REFERENCES (VALIDATION PIPELINE FIXER — APPLIED READ-ONLY)

Per skill `tnf-validation-pipeline-fixer`: disk at 70% (safe, no emergency
recovery needed). Validator scripts `scripts/handoff-pre-validator.js` and
`scripts/validation/validate-architecture.js` MISSING from repo. Per user
mandate (REPORT ONLY), no restoration performed. Note added to backlog.

---

## SYNTHESIS CONTRADICTS (L4 vs L5 vs L1 vs L2)

1. Registry file (L5) shows clean 136 unique agents; live swarm (L5) shows 1018
   zombies. Registry ≠ swarm. L5 must reconcile before L4 assimilation can trust
   agent IDs.
2. L4 parity shows Hermes 0% coverage; L2 harness depends on Hermes for agent
   lifecycle. L2 cannot declare harness healthy until L4 fixes Hermes gaps.
3. L1 protocol files exist; L1 role/embodiment spec (.agent/ROLE_DEFINITIONS.md)
   MISSING. Protocol authority contradicts operational roles.
4. L0 sub-director role defined in .tnf/authority/roles.json but not referenced
   by registry profiles. Role mapping broken.

---

## PRIORITIZED BACKLOG (P0 → P3)

P0 — Deduplicate tnf-thin-client swarm (1018 zombies); restore missing validator
scripts; fix Hermes parity (0%) P1 — Restore profiles directory +
registry_summary.json; create INTEROP_SURFACE_MAP.md; fix Jules --version P2 —
Create AGENT_EMBODIMENT_SPEC.md; restore .agent/ROLE_DEFINITIONS.md; link
staffing-coverage to registry P3 — Add assimilation verification script; add
parity enforcement CI gate; audit registry profiles completeness

---

## BEST USER FLOW (audit → act → verify) — RECOMMENDED ONLY, NOT EXECUTED

1. Inspect: `tnf list`, `tnf parity status`, registry files, role docs (done —
   evidence above)
2. Act (next session, with user confirmation): clean thin-client zombies;
   restore validator scripts (per skill); regenerate registry_summary; create
   profile cards; fix Hermes parity
3. Verify: re-run `tnf list` (expect only real workers); `tnf parity status`
   (expect >70% mean); validate assimilation; confirm handoff artifacts fresh

---

## RECEIPT STATUS

Written: 2026-08-09 File: docs/operations/audits/lanes/L4L5_INTEROP_SWARM.md
Mode: REPORT ONLY — zero file mutations outside this receipt; zero validator
script restorations; zero registry edits; zero swarm cleanups; zero code fixes
applied. Fresh handoff artifact NOT emitted (user did not confirm next critical
work unit; audit mode requires confirmation before mutation). Next required
action (per continuation.resume_checklist): emit fresh SESSION_HANDOFF_LATEST
after user confirms audit action plan.

`[CLASS:PRIME] [STATUS:ACTIVE] [DOC_TYPE:sop] [VISIBILITY:COLLECTIVE] [OWNER:TNF]`

# HARNESS_AGENT_MODES.md — PLAN / EXECUTE / VERIFY Mode Transitions

**Protocol ID:** TNF_HARNESS_AGENT_MODES  
**Version:** 1.0.0  
**Authority:** `HARNESS_CONFIG.md`, `TURN_ZERO_MANDATE.md`, `DIRECTIVES.md`
(D1/D2/D8)  
**Machine evidence:** `data/harness/harness-config.json` →
`layers.interface_override`

---

## 1. Doctrine

Every agent session operates in exactly one primary mode at a time. Mode
transitions are explicit, auditable, and interruptable via harness override
(`tnf harness pause|resume`). The model proposes; the harness owns the mode.

| Mode      | Purpose                                                        | Allowed effects                                      |
| --------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| `PLAN`    | Inspect state, classify work plane, design approach            | Read / query / propose only — no durable mutations   |
| `EXECUTE` | Apply approved plan under standing autonomy (D8)               | Workspace writes, repairs, verifies, handoff emits   |
| `VERIFY`  | Prove outcomes with empirical evidence before claiming success | Tests, health probes, receipt reads, gate validation |

Default session start after Turn Zero: enter `PLAN` briefly, then `EXECUTE` when
the operator (or standing D1 autonomy) authorizes continuation.

---

## 2. Transition rules

1. **PLAN → EXECUTE** — Requires either live operator confirmation **or**
   standing D1/D8 autonomy for routine TNF protocol work inside the workspace.
2. **EXECUTE → VERIFY** — Mandatory after each critical work unit before the
   next EXECUTE slice (Inspect → Act → Verify).
3. **VERIFY → EXECUTE** — Only if verification fails and remediation is in
   scope; otherwise return to PLAN or emit handoff.
4. **Any → PAUSED** — `tnf harness pause` or berm `require_confirmation` /
   `deny` decisions freeze EXECUTE until resumed.

Timeouts (soft budgets; tighten via `tnf harness cycle` budgets):

- PLAN without progress: 15 minutes → re-orient from handoff / Living State
- EXECUTE slice without VERIFY: 30 minutes → forced VERIFY
- VERIFY without pass/fail verdict: 10 minutes → fail closed and hand off

Audit: write mode transitions into harness receipts under
`data/harness/receipts/` when available (`trajectory.cjs` / cycle receipts).

---

## 3. Commands

```bash
tnf harness inspect
tnf harness pause
tnf harness resume
tnf harness cycle --skip-live-loop
```

Interface override evidence also includes Turn Zero frontload and this protocol.

---

## 4. Integration

- Completeness gate: `scripts/harness/verify-harness-completeness.cjs`
- Permissions: `HARNESS_PERMISSION_BERM.md` + `USER_CONFIRMATION_PROTOCOL.md`
- Session continuity: `SESSION_HANDOFF_*` + `TURN_END_MANDATE.md`

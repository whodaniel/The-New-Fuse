[CLASS:PROTOCOL] [STATUS:ACTIVE] [DOC_TYPE:sop] [DOMAIN:orchestration]

# HARNESS_CONFIG.md — First-Class TNF Harness Runtime Configuration

**Protocol ID:** TNF*HARNESS_CONFIG  
**Version:** 1.0.0  
**Authority:** UNU \_Engineering and Governing the Agent Harness* (2026) + TNF
DIRECTIVES  
**Machine config:** `data/harness/harness-config.json`

---

## 1. Definition (do not collapse)

> **Harness** = runtime around the model that turns proposals into tool calls,
> observations, memory updates, approvals, interruptions, resumptions, and
> external effects.  
> **Agent = Model + Harness.** Evaluate the pair.

TNF is the **control plane**. Cursor / Claude Code / Codex / Hermes / OpenClaw
are optional **host harness surfaces**. Docs in `docs/core/` are artefacts;
**injection into a host surface** is a separate, verifiable requirement.

---

## 2. Eight layers (UNU anatomy → TNF evidence)

| Layer                           | TNF mapping                                                          | Verify                                               |
| ------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------- | ------------- |
| Interface / override            | Turn Zero, harness pause/resume, agent modes                         | `tnf harness inspect`                                |
| Provider routing                | Assimilation routes + failover policy + harness context              | `provider-failover.cjs` / harness-config             |
| Context + compaction            | FRONTLOAD Stages A–C + compaction records                            | `scripts/harness/compaction-record.cjs`              |
| Sandbox / isolation             | D11 + materialized seatbelt + `sandbox-run`                          | `scripts/harness/sandbox-run.cjs`                    |
| Permissions / approvals / hooks | Permission berm + USER_CONFIRMATION + self-edit gate                 | `scripts/harness/permission-berm.cjs`                |
| Orchestration + budgets         | harness cycle/loop, full-auto, D10                                   | `tnf harness cycle`                                  |
| Memory / session / trajectories | MEMORY.md (static) + memory-layer (dynamic) + trajectories + handoff | `scripts/harness/memory-layer.cjs`, `trajectory.cjs` |
| Tools / MCP / skills            | mcp_config + entrypoint hash lock + supply-chain attest              | `mcp-supply-chain-attest.cjs --write-lock            | --check-lock` |

Machine-readable status + evidence paths live in
`data/harness/harness-config.json`. Update that file when a layer’s evidence or
gap changes.

---

## 3. Three non-confused onboarding meanings

| Meaning                        | What it is                                                                     | Not                                   |
| ------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------- |
| OpenClaw-family workspace pack | Injected bootstrap md (`SOUL`, `AGENTS`, …)                                    | UNU sandbox/permissions               |
| Industry always-on             | `AGENTS.md` / `CLAUDE.md` / Cursor rules / skills progressive disclosure       | Automatic retain/recall memory        |
| UNU harness completeness       | Loop, permissions, sandbox, compaction records, trajectories, provider routing | Mere file existence under `docs/core` |

---

## 4. Convergent patterns TNF must retain

Bounded iteration · controlled writes · two-stage compaction **records** ·
persist large tool outputs · resumable sessions · trajectory retention · scoped
permissions · lifecycle hooks · provider abstraction · progressive disclosure
(skills/MCP on demand — do not stuffing Stage B into every interactive reply).

---

## 5. Commands

```bash
# Inventory + layer status (also runs inside `tnf onboard`)
tnf harness completeness --provision
# or: node scripts/harness/verify-harness-completeness.cjs --provision

# Per-runtime injection surfaces
tnf harness provision --repair

# Working operators
tnf harness memory recall --query "redis" --limit 5
tnf harness berm evaluate --action-class git_push --json
tnf harness supply-chain
tnf harness host-compaction record --host cursor
tnf harness cycle --skip-live-loop

# Global host frontload pointers (Codex/Gemini/Hermes/…)
node scripts/install-agent-frontload.cjs --verify
```

---

## 6. Governance note

Harness documentation that lists tools, approvals, credential scope, session
retention, compaction, interruptions, trajectories, and provider substitution is
both an **ops** decision and a **governance** decision (UNU). Gaps in
`harness-config.json` must stay honest (`partial` / explicit `gap` fields) —
never claim `implemented` without runnable evidence.

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

| Layer                           | TNF mapping                                                          | Verify                                                 |
| ------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------ | ------- |
| Interface / override            | Turn Zero, harness pause/resume, agent modes                         | `tnf harness inspect`                                  |
| Provider routing                | Assimilation routes + failover policy + harness context              | `provider-failover.cjs` / harness-config               |
| Context + compaction            | FRONTLOAD + compaction records + host-compaction adapter             | `host-compaction-adapter.cjs status                    | verify` |
| Sandbox / isolation             | D11 + materialized seatbelt + `sandbox-run`                          | `scripts/harness/sandbox-run.cjs`                      |
| Permissions / approvals / hooks | Permission berm + USER_CONFIRMATION + self-edit gate                 | `scripts/harness/permission-berm.cjs`                  |
| Orchestration + budgets         | harness cycle/loop, full-auto, D10                                   | `tnf harness cycle`                                    |
| Memory / session / trajectories | MEMORY.md (static) + memory-layer (dynamic) + trajectories + handoff | `scripts/harness/memory-layer.cjs`, `trajectory.cjs`   |
| Tools / MCP / skills            | mcp lock + skill publisher registry/lock + optional cosign           | `skill-publisher-attest.cjs` / `supply-chain --skills` |

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

---

## 7. Work Completion Closure (mandatory — no silent finishes)

Any harness session that changes code, protocols, fleet behavior, or operator
surfaces MUST close with this sequence **before** `git commit`. Skipping it is a
failed handoff (see `TURN_END_MANDATE.md`).

### Inspect → Act → Verify → Propagate → Commit

| Step                | Action                                                                                     | Artifact / command                                                                |
| ------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| 1. Verify           | Run tests and probes that cover the change                                                 | e.g. `pnpm --filter @the-new-fuse/tnf-cli test`, `pnpm run tnf:ws:channels:check` |
| 2. Living State     | Mark completed work `[✅]` at top of `LIVING_STATE.md` Active Steps; demote stale blockers | `docs/protocols/LIVING_STATE.md`                                                  |
| 3. Ledger           | Update Protocol Gaps / Next Agent Focus when gaps close or new ones open                   | `docs/protocols/AGENT_STATUS_LEDGER.md`                                           |
| 4. Handoff          | Emit fresh session handoff with `TNF_PROTOCOL_ACK`                                         | `pnpm run handoff:emit:verified` or `node scripts/turn-end.cjs`                   |
| 5. Resume checklist | `continuation.resume_checklist` must list concrete next steps — not "continue queue" alone | `SESSION_HANDOFF_LATEST.json`                                                     |
| 6. Commit           | Stage **only** intentional paths (no daemon noise, vitest caches, auto macro boards)       | `git add` scoped paths; then commit                                               |

### Staging order matters (hardened 2026-08-12)

The handoff gate computes `changed_paths` from what is staged **at the moment
the emit runs**. Following steps 1–6 in the order listed above therefore fails:
the handoff is emitted before the code is staged, so it cannot cover it, and the
pre-commit gate blocks with

```
[session-handoff-gate] BLOCKED (staged): Handoff changed_paths does not cover
critical changed files: <your files>
```

The gate is correct both times; the ordering was simply undocumented. Use:

```bash
git add <intentional code paths>          # 1. stage the work FIRST
tnf handoff generate                      # 2. emit, now seeing those paths
git add docs/protocols/reports/SESSION_HANDOFF_LATEST.json \
        docs/protocols/reports/SESSION_HANDOFF_LATEST.md \
        docs/protocols/AGENT_STATUS_LEDGER.md \
        docs/protocols/LIVING_STATE.md    # 3. stage what the emit rewrote
git commit                                # 4. pre-commit re-validates
```

Use `handoff generate` (emit only) at step 2, **not** `handoff refresh`.
`refresh` is emit **+ validate**, and the validate runs against staged state —
so on the first pass it necessarily fails its own check, because the artifacts
it just rewrote are not staged yet. It exits non-zero and will abort any script
running under `set -e`, even though the emit succeeded. `refresh` is for
confirming a already-staged change set, not for producing one.

If you add further code after the emit, re-run steps 2–3 — the emit is
idempotent, and a stale `changed_paths` is exactly what the gate exists to
catch.

### Non-negotiable rules

- **Docs/logs move with code.** New transport lanes, gates, or CLI behavior
  require a protocol doc or explicit cross-reference
  (`TNF_TRANSPORT_LANE_SPEC.md` is the pattern).
- **Handoff is not optional for critical paths** — see
  `SESSION_HANDOFF_ENFORCEMENT.md` (`apps/`, `packages/`, `scripts/`,
  `docs/protocols/`).
- **Never commit without updating handoff** when the change set touches critical
  paths; CI and pre-push gates expect `SESSION_HANDOFF_LATEST.*` + ledger sync.
- **Turn End idempotent** — re-run `turn-end.cjs` or `handoff:emit` before
  commit if additional edits land after the first emit.

### Mode integration (`HARNESS_AGENT_MODES.md`)

- **EXECUTE** mode ends with Verify + Propagate (steps 1–4), not merely "code
  applied."
- **VERIFY** mode must cite probe output (pass/fail JSON paths), not narrative
  success.

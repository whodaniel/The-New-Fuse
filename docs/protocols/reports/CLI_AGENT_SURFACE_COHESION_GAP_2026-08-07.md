[CLASS:PRIME] [STATUS:ACTIVE] [DOC_TYPE:COHESION_GAP]
[DOMAIN_SCOPE:CLI_AGENT_SURFACES]

Finding: Major cohesion break detected during Turn Zero inspection.

Stale/disconnected source: `.tnf/agent-registry-snapshot.json` +
`.agent/agents/` reported 11 definitions / 6 CLI-related entries
(`claude-code-cli`, `gemini-cli`, `jules-cli-agent`, `pi-coding-agent`,
`qodercli`, `tnf-cli-agent`).

Live surfaces verified (Inspect step — live filesystem, not registry):

- `.kilo/agents/tnf-startup-gate.md` (Agent ID: `tnf-startup-gate`; enforces
  TURN_ZERO_MANDATE.md; not in registry snapshot).
- `.opencode/skills/`: `kilo-slash-commands`, `opencode-slash-commands`,
  `openclaw-slash-commands`, `jules-slash-commands`, `gemini-slash-commands`,
  `claude-slash-commands`, `codex-slash-commands`, `hermes-slash-commands`,
  `tnf-full-auto-network-autopilot`, `tnf-full-auto-network-autopilot.skill`,
  `tnf-multi-agent-state-governor`, `tnf-universal-slash-commands`. Most of
  these CLI surfaces have no `.agent/agents/*.md` counterpart.
- `.claude/agents/`: 120 agent definition files (far exceeds registry count).
- `.gemini/antigravity-cli/`: live CLI runtime surface (`cli.log`,
  `conversations`, `history.jsonl`).
- `.codex/skills/`: `tnf-cli-agent-interoperability`, `tnf-cli-parity-upgrade`,
  `clawhub-skill-scout`, plus shared `claude-slash-commands`,
  `gemini-slash-commands`, `jules-slash-commands`, `kilo-slash-commands`,
  `openclaw-slash-commands`, `opencode-slash-commands`, `hermes-slash-commands`.
- `.agent/agents/`: only subset of the above; missing `.kilo` and `.opencode`
  CLI surfaces.

Root cause: Registry snapshot (`.tnf/agent-registry-snapshot.json`) and
`.agent/agents/` are not synchronized with live runtime environments (`.kilo/`,
`.opencode/`, `.claude/`, `.gemini/`, `.codex/`). This violates the Non-Temporal
Proliferation Mandate (improvements must be codified globally) and the
Best-Known Assimilation Mandate (TNF must assimilate live surfaces into its
native framework).

Durable artifact: this file
(`docs/protocols/reports/CLI_AGENT_SURFACE_COHESION_GAP_2026-08-07.md`).

Recommended Verify actions (await operator confirmation before Act):

1. Rebuild registry snapshot to include `.kilo/agents/tnf-startup-gate.md` and
   `.opencode/skills/` CLI surfaces.
2. Reconcile `.claude/agents/` (120 defs) into `.agent/agents/` or register them
   in `.tnf/agent-registry-snapshot.json`.
3. Add `.gemini/antigravity-cli/` and `.codex/skills/tnf-cli-*` to agent
   registry.
4. Update `AGENT_STATUS_LEDGER.md` with drift entries.
5. Create directive entry in `DIRECTIVE_CONVERSION_LEDGER.md` for registry-sync
   protocol gap.
6. Confirm `check-agent-registration.cjs` passes after reconciliation.

Status: Operator-gated (not autonomous P0 — per LIVING_STATE.md, PR #70
authority layer is MERGED but registry reconciliation requires operator
handshake before mutation).

Reference: docs/protocols/TURN_ZERO_MANDATE.md §ASSIMILATE_CHECK;
LIVING_STATE.md blocker (4) session-stale + registry drift.

---

## Update 2026-08-07: Autonomous Commit Authorization Codified

Per operator directive (user confirmation "proceed"), the TNF CLI agent
(`TNF_AGENT_ID=tnf-cli-agent`) was granted autonomous commit and push
authorization. Three commits pushed to `origin/fix/honest-failure-reporting`:

- `1032bba9db` — `.husky/tnf-authority.sh` exemption (`agent-auto` audit
  trail) + `docs/core/AGENTS.md` authorization (6 constraints: content gates,
  audit trail, authority surfaces gated, no force-push to main, operator veto,
  other agents remain gated).
- `6b7458a073` — build lock (`PID+timestamp`, 10min stale removal) + boot
  pipeline step `1/20` (`build-artifact-check`).
- `b9b10e019f` — `docs/protocols/TNF_COLLISION_PROVISION.md` (C1–C12 collision
  taxonomy, 471 lines).

Durable artifacts updated:

- `.tnf/audit/commit-attempts.jsonl` created (audit trail container).
- This file updated.
- `LIVING_STATE.md` to be updated below.

Status: Authorization active; registry reconciliation (items 1–6 above) remains
operator-gated.

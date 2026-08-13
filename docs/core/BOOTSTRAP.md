# BOOTSTRAP.md — First-Run Harness Ritual (TNF)

_One-time (or re-entry) checklist for bringing a new agent/runtime into the TNF
harness. Keep this file; stamp completion instead of deleting (TNF prefers
durable rituals over OpenClaw-style delete-on-complete)._

`[BOOTSTRAP_STATUS:COMPLETE]`

## When To Run

- First session for a new CLI/runtime (Cursor, Claude, Hermes, Gemini, …)
- After wiping `~/.tnf` or frontload caches
- When `tnf onboard` reports missing baseline artifacts
- Operator says “onboard this agent into TNF”

## Ritual (in order)

1. **Repo root** — `cd` to The-New-Fuse workspace (not a worktree orphan).
2. **Authority pack** — Read:
   - `docs/protocols/TURN_ZERO_MANDATE.md`
   - `docs/protocols/LIVING_STATE.md`
   - `docs/protocols/AGENT_STATUS_LEDGER.md` (if present)
   - `docs/protocols/reports/SESSION_HANDOFF_LATEST.json`
3. **Persona / constraints pack** — Skim:
   - `docs/core/SOUL.md`, `IDENTITY.md`, `USER.md`, `TOOLS.md`, `HEARTBEAT.md`,
     `SECURITY.md`, `MEMORY.md`
4. **Onboard** — `tnf onboard` (add `--repair` if artifacts missing).
5. **Manifest verify** — `node scripts/verify-repo-frontload.cjs`
6. **Runtime pulse** — Confirm Redis (`redis-cli ping` / `redis-service.sh`),
   relay `:3007`, gateway `:3001` as required by the task.
7. **Orientation report** — Active directive, handoff next actions, missing
   artifacts, endpoint sources, planned verify command.
8. **Stamp** — Flip the header to `[BOOTSTRAP_STATUS:COMPLETE]` and append a
   dated line under **Completions** below. Do **not** delete this file.

## Completions

- 2026-08-10 — cursor-operator — Added MEMORY/BOOTSTRAP/FRONTLOAD_MANIFEST;
  wired Turn Zero + onboard checklist; `verify-repo-frontload.cjs` green.

## Alias Reminder

Informal `brain.md` / `agent.md` names resolve per `docs/core/MEMORY.md` alias
map. Canonical frontload order: `docs/core/FRONTLOAD_MANIFEST.md`.

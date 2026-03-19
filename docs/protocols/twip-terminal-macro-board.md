# TWIP Terminal Macro Board

Status: Active  
Audience: TNF operators, orchestrator maintainers, protocol integrators

## Objective

Provide a rolling, sanitized macro view of open terminal work so agents can
route, schedule, and prioritize work with stronger situational awareness.

## Script

`scripts/protocols/twip-macro-board.cjs`

What it does:

1. Runs `twip_scan_terminals` via the relay MCP implementation.
2. Reads `data/protocols/twip-inventory.snapshot.json`.
3. Produces a macro summary and active-session set.
4. Computes deltas against prior run state.
5. Writes:
   - latest report: `docs/protocols/reports/twip-terminal-macro-board-latest.md`
   - state: `data/protocols/twip-macro-board.state.json`
   - optional history report with timestamp.
6. Mirrors latest state/report for static UI fallback:
   - `apps/frontend/public/visualizations/terminals/data/twip-terminal-macro-board.state.json`
   - `apps/frontend/public/visualizations/terminals/data/twip-terminal-macro-board-latest.md`

## Usage

```bash
node scripts/protocols/twip-macro-board.cjs --tenant tnf-local --limit 1000 --include-commands --include-content --history
```

Options:

1. `--tenant` / `--tenant-id`
2. `--limit` (max `1000`)
3. `--include-commands` or `--no-include-commands`
4. `--include-content` or `--no-include-content` (sanitized excerpt capture from
   tmux panes or Terminal.app history fallback)
5. `--content-lines` (default `80`, max `400`)
6. `--content-max-chars` (default `8000`, max `24000`)
7. `--no-scan` (reuse existing snapshot)
8. `--history` (write timestamped report copy)
9. `--json` (machine-readable stdout)

## Rolling Operation

Recommended local cron for 5-minute cadence:

```cron
*/5 * * * * cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse && /usr/bin/env node scripts/protocols/twip-macro-board.cjs --tenant tnf-local --limit 1000 --include-commands --include-content --content-lines 80 --content-max-chars 8000 --history >> logs/twip-macro-board.log 2>&1
```

For networked TNF environments, route scheduler writes through cron governance:

1. `docs/protocols/schemas/tnf-cron-governance.schema.json`
2. `docs/protocols/bridges/tnf-cron-federation-gates.yml`
3. `scripts/protocols/cron-governance-gate.cjs`

## UI Endpoints

1. React route (when SPA routing is enabled):
   - `/visualizations/terminals`
2. Static fallback (works without SPA rewrite):
   - `/visualizations/terminals/`
   - backed by `apps/frontend/public/visualizations/terminals/index.html`

## Safety Defaults

1. Reports are sanitized to executable fingerprints and redacted terminal
   excerpts (when enabled), not raw secret-bearing payloads.
2. Terminal-level risk counters are explicit:
   - approval-bypass flag usage
   - remote MCP client usage
   - excerpt redaction counts
3. Intended as read-only orchestration telemetry, not command execution.

## Protocol Hooks

Use this macro output to feed:

1. `docs/protocols/schemas/twip-workstream-signal.schema.json`
2. `docs/protocols/schemas/twip-terminal-context.schema.json`
3. `docs/protocols/bridges/twip-to-orchestrator-loop.yml`
4. `docs/protocols/bridges/twip-federation-orchestration-gates.yml`
5. `docs/protocols/schemas/tnf-master-cumulative-id.schema.json`

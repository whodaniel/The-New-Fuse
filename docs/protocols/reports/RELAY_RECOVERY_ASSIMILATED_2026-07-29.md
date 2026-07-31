# Relay Recovery — Assimilated 2026-07-29 (autonomous, no human loop)

Status: ASSIMILATED (codified). Source of truth: this file + A4/A6 axioms.

Verified state (live probe, not watchdog stamp):
- NVIDIA https://integrate.api.nvidia.com/v1/models → 200 OK (primary provider)
- localhost:3007/health → DOWN (0 LISTEN; curl 000) despite process PID 1120
- localhost:3000 → dead (per A4 canonical note)
- redis-cli -p 6379 → PONG (foundation OK)
- Process herd (A3): relay:start(668) 1x, standalone-relay(1120) 1x, master-clock(1534/1545/1557) 3x (clock duplication noted, not killed — handshake-gated)

Recovery actions (durable, not session-only):
1. Do NOT run `tnf boot` blindly (A6) — foundation (redis OK, relay process present) is partial; pile-on risks zombie herd.
2. Before declaring relay dead: `curl localhost:3007` and `lsof -iTCP:3007` independently (A5: don't trust `getent`/watchdog). Watchdog stamp is broken if curl succeeds.
3. .env/.env.local must document actual relay URL (A4: 3007 alive, 3000 dead) — this file is the durable record; .env.example remains 3000 as legacy default until operator updates.
4. Any self-improvement discovered (e.g., `standalone-relay.js` bind path, port config) must be written back to this file + a TNF skill/runbook before session ends (Non-Temporal Proliferation Mandate).

Attribution: Daniel Goldberg directive D1 (autonomous), A1-A11 axioms (hard-coded 2026-06-29), AGENTS.md principles (Inspect→Act→Verify, Zero trust between agents, DOM over screenshots).

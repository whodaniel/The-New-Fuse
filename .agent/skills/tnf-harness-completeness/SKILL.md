---
name: tnf-harness-completeness
description: >-
  Verify and provision UNU-aligned TNF harness completeness (8 layers, host
  injection proof, permission berm, dynamic memory, trajectories, MCP
  supply-chain, host-compaction adapter). Use when onboarding a runtime, after
  harness/docs changes, when red-teaming "docs/core exists ⇒ ready," or when
  running tnf harness completeness / provision / memory / berm / supply-chain.
---

# TNF Harness Completeness

TNF is the **control plane**. Hosts (Cursor/Claude/Hermes/OpenClaw) are optional
surfaces. **File presence under `docs/core` ≠ injection.**

Authority:

1. `docs/protocols/HARNESS_CONFIG.md`
2. `data/harness/harness-config.json`
3. `docs/protocols/TURN_ZERO_MANDATE.md`

## Do This First

```bash
tnf harness completeness --provision
# or: node scripts/harness/verify-harness-completeness.cjs --provision
```

Expect `HARNESS COMPLETENESS PASS`. On fail, repair surfaces then re-run:

```bash
tnf harness provision --repair
node scripts/install-agent-frontload.cjs --repair
```

`tnf onboard` already prints the completeness section + a light dynamic-memory
recall; do not dump Stage B frontload into interactive replies.

## Operating Surfaces (one skill, many tools)

| Need                                  | Command                                                       |
| ------------------------------------- | ------------------------------------------------------------- |
| Layer inventory                       | `tnf harness completeness`                                    |
| Host injection proof                  | `tnf harness provision --verify` / `--repair`                 |
| Permissions outside the model         | `tnf harness berm evaluate --action-class <class> --json`     |
| Dynamic retain/recall (≠ `MEMORY.md`) | `tnf harness memory retain\|recall\|pin\|status`              |
| Trajectories                          | `tnf harness trajectory start\|append\|end\|list`             |
| MCP/skills inventory                  | `tnf harness supply-chain` (`--strict` only when fail-closed) |
| Host compaction boundary              | `tnf harness host-compaction record --host cursor`            |
| D11 sandbox profile                   | `tnf harness sandbox`                                         |
| Cycle with trajectory receipts        | `tnf harness cycle --skip-live-loop`                          |

Dispatcher: `node scripts/harness/tnf-harness.cjs <cmd>`.

## Three meanings (do not collapse)

1. **OpenClaw workspace pack** — SOUL/AGENTS/… injected by OpenClaw
2. **Industry always-on** — `AGENTS.md` / `CLAUDE.md` / `.cursor/rules`
3. **UNU harness completeness** — loop, berm, sandbox, compaction records,
   trajectories, provider routing, tools/MCP

`brain.md` → disambiguate static `docs/core/MEMORY.md` vs dynamic
`tnf harness memory`.

## Honest partial gaps

Recorded in `harness-config.json`: host compaction opacity, default sessions not
seatbelt-enclosed, soft MCP publisher attestation, incomplete provider failover.
Do not claim `implemented` without runnable evidence.

## MCP memory (optional)

Tracked config: `data/harness/mcp.memory.server.json`  
Server: `node scripts/harness/memory-mcp-server.cjs`

## Verify Done

```bash
tnf harness completeness
tnf harness berm evaluate --action-class read --json
tnf harness memory status
node scripts/install-agent-frontload.cjs --verify
```

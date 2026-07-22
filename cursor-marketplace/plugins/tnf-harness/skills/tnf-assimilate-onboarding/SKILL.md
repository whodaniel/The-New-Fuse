---
name: tnf-assimilate-onboarding
description:
  Route a Cursor (or other) agent CLI through the TNF control plane so MCP
  config and harness receipts stay attached. Use when linking or launching an
  agent runtime under TNF.
---

# TNF Assimilate & Onboard

TNF "assimilation" links an external agent CLI (Cursor, Claude, Gemini, Pi,
Antigravity, etc.) into the TNF control plane so protocol context, MCP routing,
and audit receipts follow the agent automatically.

## When to use

- Connecting Cursor into TNF for the first time.
- The operator asks to "assimilate", "link", or "route through TNF".
- You need MCP config + harness receipts attached to an agent session.

## Link Cursor into routing

```bash
tnf assimilate link cursor
```

## Run an agent through the harness

```bash
# Generic passthrough with MCP routing + receipts:
tnf cursor <args...>

# Or via assimilation runner:
tnf assimilate run cursor -- agent --help
```

## Full start pipeline

```bash
pnpm run tnf:start:cursor
```

## Health & protocol checks

```bash
tnf protocol gate     # protocol health
tnf mcp health        # MCP server health
tnf onboard           # frontload onboarding
```

## Notes

- Prefer `tnf cursor ...` over raw `cursor ...` so config and receipts persist.
- Deep TNF capabilities (living state, relay, federation, continuity) require a
  local TNF runtime. Without it, this plugin still provides rules, skills, and
  commands; the `tnf-skills` MCP server needs the `tnf-skills-mcp` binary.
- Provisioning writes command + skill artifacts into detected agent homes
  (`~/.cursor`, `~/.claude`, `~/.codex`, `~/.gemini`, `~/.tnf`, `~/.hermes`,
  ...).

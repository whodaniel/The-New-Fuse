# The New Fuse — Cursor Marketplace

**Cursor writes. TNF remembers, routes, and verifies.**

This repository is a
[Cursor plugin marketplace](https://cursor.com/docs/plugins) for **The New Fuse
(TNF)** — a protocol-neutral control plane for serious multi-agent development.
These plugins make Cursor agents **oriented, disciplined, and safe**: they boot
from shared state, verify their work, hand off cleanly, and never take
irreversible actions without an operator's say-so.

TNF is the control plane; Cursor is the surface it routes through.

## Plugins

| Plugin                                               | What it adds                                                                                                                                                                  |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[`tnf-harness`](plugins/tnf-harness)**             | Turn Zero orientation, Inspect-Act-Verify rules, session-handoff continuity, operator safety gates (hooks), a skeptical verifier subagent, and the **TNF skills MCP server**. |
| **[`tnf-orchestration`](plugins/tnf-orchestration)** | The TNF Orchestrator plus a focused roster of specialist subagents (planner, implementer, researcher) using the plan → implement → verify pattern.                            |

## Why

Agentic coding fails in predictable ways: agents start cold with no context,
mark work "done" that isn't, lose everything on a context reset, and
occasionally take destructive actions no one approved. TNF encodes the fixes as
installable Cursor primitives:

- **Orientation** — every session starts with a Turn Zero briefing from living
  state + the last handoff, not a blank slate.
- **Verification** — Inspect → Act → Verify is enforced by rules and a dedicated
  verifier subagent; nothing is "done" without a concrete signal.
- **Continuity** — session handoffs persist context across resets and agent
  swaps.
- **Safety** — a `beforeShellExecution` hook gates commits, pushes, deletes, and
  process kills behind an explicit operator confirmation. No fabricated
  handshakes.
- **Orchestration** — decompose big goals and delegate to specialist subagents.

## Install

### From the Cursor Marketplace (recommended)

Browse **Customize → Plugins** in Cursor and search for _The New Fuse_, or open
[cursor.com/marketplace](https://cursor.com/marketplace).

### Local development / early access

```bash
# symlink a plugin into Cursor's local plugin folder, then reload Cursor
ln -s "$(pwd)/plugins/tnf-harness" ~/.cursor/plugins/local/tnf-harness
ln -s "$(pwd)/plugins/tnf-orchestration" ~/.cursor/plugins/local/tnf-orchestration
```

Then run **Developer: Reload Window** and confirm the rules, skills, commands,
subagents, and MCP server appear in **Customize**.

## Requirements

- **Rules, skills, commands, and subagents** work standalone — no backend
  needed.
- **The `tnf-skills` MCP server** requires the `tnf-skills-mcp` binary, shipped
  with a local [The New Fuse](https://thenewfuse.com) install. Without it, the
  rest of the plugin still functions; the MCP server simply won't connect.
- **Deep TNF capabilities** (living state automation, relay, federation,
  autonomous continuity) come from the local `tnf` CLI. The plugins detect and
  use it when present and degrade gracefully when it's absent.

## License

MIT © The New Fuse. See [LICENSE](LICENSE).

# Marketplace Listing Copy

Ready-to-paste copy for the Cursor Marketplace submission at
`cursor.com/marketplace/publish` and for the TNF site.

---

## Marketplace: The New Fuse

**Tagline:** Cursor writes. TNF remembers, routes, and verifies.

**Short description (≤ 160 chars):** Governance, continuity, and multi-agent
orchestration for Cursor. Orient from shared state, verify every change, hand
off cleanly, gate risky actions.

**Categories:** Productivity, Agents, Governance

---

## Plugin: `tnf-harness` — The New Fuse — Harness

**One-liner:** Make your Cursor agent oriented, disciplined, and safe.

**Description:** The New Fuse Harness adds the operating discipline that agentic
coding is missing. Every session starts with a **Turn Zero** briefing from your
living state and last handoff — no more cold starts. Work follows **Inspect →
Act → Verify**, enforced by rules and a skeptical **verifier subagent**, so
nothing is marked "done" without a concrete signal. A **session-handoff** flow
preserves context across resets and agent swaps. And an operator **safety gate**
intercepts commits, pushes, deletes, and process kills — requiring your explicit
confirmation, with no fabricated approvals. Includes an MCP server exposing the
TNF skills library.

**Highlights:**

- Turn Zero orientation from Living State + Ledger + Handoff
- Inspect → Act → Verify rules + a read-only verifier subagent
- Durable session handoffs for true continuity
- `beforeShellExecution` safety gate for risky commands
- `tnf-skills` MCP server (skills discovery + loading)

**Best for:** Teams running Cursor Agent/CLI on real codebases who care about
auditability, continuity, and not shipping unverified work.

---

## Plugin: `tnf-orchestration` — The New Fuse — Orchestration

**One-liner:** Break down big goals and delegate to specialist subagents.

**Description:** The TNF Orchestrator decomposes complex goals into ordered
threads and delegates them to focused specialists — planner, researcher, and
implementer — using TNF's plan → implement → verify pattern. Independent threads
run in parallel; dependent ones are sequenced. Pairs with the Harness verifier
for independent confirmation and respects the same operator safety gates.

**Highlights:**

- `tnf-orchestrator` coordinator agent
- `tnf-planner` (read-only) — concrete, MECE technical plans
- `tnf-researcher` (read-only) — sourced, distilled findings
- `tnf-implementer` — smallest-correct-change execution + verify

**Best for:** Multi-file features, migrations, and investigations that benefit
from decomposition and parallelism.

---

## Suggested keywords

agent, orchestration, governance, continuity, handoff, verification, mcp,
multi-agent, subagents, protocol, the-new-fuse, tnf

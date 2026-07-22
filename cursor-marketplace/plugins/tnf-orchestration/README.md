# The New Fuse — Orchestration

**Decompose big goals. Delegate to specialists. Verify before "done".**

`tnf-orchestration` brings TNF's multi-agent coordination to Cursor as a set of
custom subagents built around the plan → implement → verify pattern.

## Subagents

- **`tnf-orchestrator`** — turns a high-level goal into ordered, delegated
  threads and coordinates the specialists. Runs Turn Zero first in TNF-governed
  repos.
- **`tnf-planner`** _(read-only)_ — converts an ambiguous goal into a concrete,
  MECE, verifiable technical plan.
- **`tnf-researcher`** _(read-only)_ — context-heavy codebase exploration that
  returns distilled, sourced findings.
- **`tnf-implementer`** — executes one well-specified task with the smallest
  correct change, then verifies it.

Pairs naturally with the **`tnf-harness`** plugin's `tnf-verifier` subagent for
independent verification.

## Usage

Invoke explicitly with `/name`:

```text
> /tnf-orchestrator ship the new export endpoint end to end
> /tnf-planner design the migration from the legacy auth guard
> /tnf-researcher find every call site of capability-matcher
```

Or let Cursor delegate automatically based on each subagent's description.

## Safety

All subagents respect TNF operator safety gates: commits, pushes, and process
kills require explicit operator confirmation. Read-only subagents never modify
state. Install alongside `tnf-harness` to get the enforcing hooks.

## License

MIT © The New Fuse.

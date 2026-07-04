---
name: new-tnf-agent-scaffold
description: "Project-scoped TNF agent definition scaffold. Edit this file's Purpose, Tools, Capabilities, and Instructions sections to define a new agent. Keep frontmatter keys aligned with .claude/agents/ conventions."
tools: [Read, Write, Edit, Glob, Grep, Bash]
domain: [tnf, scaffolding]
capabilities:
  - scaffold-authoring
  - tool-bridging
  - capability-routing
complexity: standard
color: Cyan
agent_type: internal
---

# Purpose

Replace this section with a 2–4 sentence statement of the agent's role. State who this agent is, what it owns, and the boundary between it and sibling agents. Be specific enough that an orchestrator can decide whether to dispatch a task here without ambiguity.

## When to dispatch to this agent

- scenario A
- scenario B
- scenario C

## When NOT to dispatch

- competing owner (agent X already owns this)
- out-of-scope domain

# Tools

Edit the `tools:` list in frontmatter to match what this agent actually requires. Start from the minimum set and add only when a tool has a concrete use. Removes are usually better than adds.

- Read — view files (no edits)
- Glob — discover files by pattern
- Grep — search file contents
- Write — create or overwrite files
- Edit — modify files in place
- Bash — run shell commands

If the agent needs network access, add `WebFetch` and/or `WebSearch`. If it needs delegation, add `Task`. External CLI access uses `Bash` with the CLI command.

# Capabilities

Edit the `capabilities:` list in frontmatter to match the agent's actual capabilities. Capabilities drive dispatch matching. Be specific and declarative.

- capability-name (kebab-case, action-oriented)
- another-capability
- a-third-capability

# Inputs

Document every input the agent accepts. Inputs make the contract explicit and prevent silent assumptions.

| Input        | Type        | Required | Source                        |
|--------------|-------------|----------|-------------------------------|
| example.in   | string/path | yes      | caller-provided               |
| example.flag | boolean     | no       | default false                 |

# Outputs

Document every output the agent emits.

| Output       | Type   | Destination                  |
|--------------|--------|------------------------------|
| example.out  | object | returns to caller            |
| example.log  | string | appended to agent run log    |

# Instructions

Replace the steps below with concrete behavior for this agent. Number the steps so an LLM reading them can execute without re-deriving the order.

1. Read inputs and confirm scope with the caller if ambiguous.
2. Perform the agent's primary responsibility.
3. Validate before returning: confirm the side-effect actually happened (read back, status code, exit code).
4. Return outputs in the documented shape.
5. Log the run with enough detail that an audit can reconstruct what happened.

# Pitfalls

List things this agent must avoid. Pitfalls previously hit belong here with the specific failure mode.

- Do not assume the target artifact exists; verify before writing.
- Do not skip verification — the run is not "done" until the output is observed.
- Do not use fallbacks silently; if a fallback fires, log it.

# Verification

Before declaring the run successful, check:

- the documented output was produced
- any external side-effect was verified (URL fetched, file read back, command exit code)
- the run log is complete enough to audit

# Notes

Free-form notes. Anything that helps a future maintainer (or a future version of this agent) understand decisions that aren't obvious from the code or docs above.

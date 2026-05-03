# Interoperability Contract Template

Use this before any TNF CLI assimilation work.

## Contract

```text
Use $tnf-cli-agent-interoperability to integrate <reference-agent-cli> into TNF CLI.

Primary Outcome:
- <single measurable outcome>

Scope:
- In scope: <commands/options/behaviors>
- Out of scope: <surfaces to leave untouched>

Constraints:
- TNF remains protocol-neutral
- Preserve TNF-native startup behavior for <entrypoint>
- No destructive git operations
- No unrelated refactors

Acceptance Checks:
1. <root help surface check>
2. <subcommand parity checks>
3. <type-check/tests/smoke checks>
4. <TNF-native regression checks>

Deliverables:
- Files changed
- Command evidence
- Remaining backlog
```

## Follow-Up Constraint Prompt

```text
Continue with $tnf-cli-agent-interoperability.
Only address: <remaining items>.
Do not change: <protected TNF behavior>.
Done = <exact command checks>.
```

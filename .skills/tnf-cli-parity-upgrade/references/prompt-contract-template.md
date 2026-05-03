# Prompt Contract Template

Use this template to reduce ambiguity before any parity implementation.

## Primary Directive

```text
Use $tnf-cli-parity-upgrade to close TNF CLI parity gaps with <reference-cli> while keeping TNF protocol-neutral.

Goal:
- <single outcome statement>

Scope:
- In-scope: <explicit command families/options>
- Out-of-scope: <what must not be touched>

Hard Constraints:
- Keep TNF native default behavior for <entrypoint/flow>
- Do not lock TNF to <reference protocol>
- No destructive git or unrelated refactors

Acceptance Criteria:
1. <command/option parity check #1>
2. <command/option parity check #2>
3. <type-check/tests/smoke checks>
4. <regression guardrail>

Deliverables:
- Files changed
- Test/smoke evidence
- Remaining backlog
```

## Tight Follow-Up Prompt

Use this when output is close but still misses intent.

```text
Continue with $tnf-cli-parity-upgrade.
Only fix: <specific gaps>.
Do not change: <protected behavior>.
Success = <exact checks>.
```

## Escalation Prompt

Use this when repeated attempts drift from scope.

```text
Reset to the accepted directive contract.
Re-list goal, constraints, and acceptance criteria before making more edits.
Then implement only the unchecked items.
```

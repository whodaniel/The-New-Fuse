# Bridge Report: TNF CLI Multi-Slash Skill Chain

Date: 2026-09-02  
Status: VERIFIED WITH UNRELATED SUITE GATE

## Contract

Ordered slash input is normalized to `tnf.slash-chain/v1`. Prompt skills run in
the listed order, each validated output becomes the next step's `upstream`
input, and the final step supplies the chain result. The same model serializes
back to slash syntax and can be reversed without losing arguments.

## Failure Handling

The CLI resolves all commands before executing the first step. An unresolved
command aborts the complete chain. The prompt-chain contract stops at the first
failed handoff validation and reports the failed step.

## Verification

- Focused parser, round-trip, reverse, quoting, and handoff-contract tests:
  PASS.
- Package type-check and build: PASS.
- Source and built-CLI smoke with two real repository skills: PASS.
- Fail-closed built-CLI smoke (`/help` followed by an unknown step): PASS; help
  did not execute.
- CLI suites before and after the command-surface oracle: PASS.
- Full suite is blocked only by pre-existing snapshot drift for four unrelated
  `tnf video*` commands. The snapshot was not updated by this change.

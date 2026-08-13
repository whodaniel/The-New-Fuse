---
name: tnf-cli-sdk-interoperability
description: Integrate development SDK workflows into TNF CLI agent surfaces without protocol lock-in. Use when work involves mapping SDK capabilities (for example OpenAI/Anthropic/Google/GitHub/MCP SDKs) to TNF commands, designing adapter flags, or validating SDK-driven command parity and execution contracts.
---

# TNF CLI SDK Interoperability

## Overview

Turn SDK capabilities into stable TNF CLI command surfaces with explicit contracts, compatibility tests, and TNF-native safety rules.

## Workflow

1. Build an SDK capability map.
Use `scripts/sdk_capability_mapper.py` to declare SDK features, auth model, streaming/tooling semantics, and TNF command targets.
2. Define the integration contract.
Use `references/sdk-integration-contract-template.md` to lock scope, constraints, acceptance checks, and non-goals.
3. Design TNF adapter surfaces.
Use `references/sdk-routing-and-adapter-patterns.md` to choose wrapper, alias, or provider-routing patterns.
4. Implement incremental CLI changes.
Add root/subcommand options and wrappers as additive compatibility layers.
5. Validate behavior.
Use `references/sdk-interop-acceptance-checklist.md` and command-level evidence.
6. Document rollout.
Record supported SDK features, partial coverage, and known limitations.

## Implementation Rules

- Keep TNF as the control plane, not an SDK-specific shell.
- Preserve TNF-native defaults unless the contract explicitly authorizes change.
- Keep adapter logic explicit and debuggable.
- Avoid hidden behavior drift between SDK providers.
- Every new SDK mapping must include a measurable command check.

## Quick Commands

- Generate SDK capability matrix:
  `python3 scripts/sdk_capability_mapper.py --sdk openai-agents --sdk anthropic-sdk --sdk google-genai --json`
- Include TNF target commands in report:
  `python3 scripts/sdk_capability_mapper.py --sdk openai-agents --tnf-command run --tnf-command auth --json`
- Save integration plan artifact:
  `python3 scripts/sdk_capability_mapper.py --sdk openai-agents --out sdk-matrix.json --json`

## References

- `references/sdk-integration-contract-template.md`
- `references/sdk-routing-and-adapter-patterns.md`
- `references/sdk-interop-acceptance-checklist.md`

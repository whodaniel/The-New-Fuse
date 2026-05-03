# SDK Integration Contract Template

Use this template before integrating any SDK-driven behavior into TNF CLI.

## Contract

```text
Use $tnf-cli-sdk-interoperability to map <sdk-name> capabilities into TNF CLI.

Primary Outcome:
- <single measurable delivery goal>

Scope:
- In scope: <commands/options/adapters>
- Out of scope: <surfaces to avoid>

Constraints:
- TNF remains protocol-neutral
- Preserve TNF-native default startup behavior
- No destructive git operations
- No unrelated refactors

Acceptance Criteria:
1. <capability-to-command mapping verified>
2. <help surface / option checks>
3. <execution smoke tests>
4. <regression checks for TNF-native behavior>

Deliverables:
- Mapping artifact
- Files changed
- Validation evidence
- Remaining backlog
```

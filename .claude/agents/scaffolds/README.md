# TNF Scaffold Templates

Project-scoped scaffold files for new TNF primitives. These follow the conventions already in use across this repo:

- Agent scaffolds → `.claude/agents/<name>.md` (frontmatter: `name`, `description`, `tools`, `domain`, `capabilities`, `complexity`, `color`, `agent_type`). See `scaffolds/new-tnf-agent.md`.
- n8n workflow scaffolds → JSON files importable into n8n, kept here at `workflows/scaffolds/*.json`. See `../workflows/scaffolds/new-tnf-workflow.json`.

## How to use

1. Copy the scaffold to its final location.
2. Edit in place. Do not scaffold over a real file.
3. Keep frontmatter keys aligned with the conventions above. New keys are fine; renames break dispatch.

## Conventions

- File names: `kebab-case`. Agent files must match the `name:` frontmatter field.
- Capabilities are verbs or action-noun phrases, never domains.
- Colors: pick from the existing palette so the agent registry stays visually scannable.
- Complexity: `simple` | `standard` | `expert` | `complex`. Pick the lowest that fits.
- agent_type: `internal` for repo-local agents, `external` for CLI/3rd-party bridges.

## Verification

Before declaring a new scaffold ready:

- agent: frontmatter parses as YAML, `tools:` list references real tool names, body does not contain placeholder lorem.
- workflow: JSON parses, all `connections` reference existing `nodes[].id`, all node types and `typeVersion` pairs are valid for the target n8n version.

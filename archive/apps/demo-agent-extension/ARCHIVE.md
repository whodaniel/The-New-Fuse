# Archived: apps/demo-agent-extension (2026-08-09)

## Why archived

Three-file VS Code demo (`package.json`, `README.md`, `src/extension.ts`) that
demonstrated an "Agentic Plugin" handoff to TNF. It was never a supported
default form factor (`oss-app-boundary.json` classified it as a satellite demo).

## Unique capability check

| Capability | Where it lives now |
| --- | --- |
| Supported IDE form factor | `apps/vscode-extension` |
| Agentic plugin / MCP bridge patterns | `apps/vscode-extension`, `apps/mcp-servers` |

Nothing unique needed to merge: the demo stubs connection messaging that the
real VS Code extension already owns.

## Prefer instead

- `apps/vscode-extension` for IDE product work
- `apps/mcp-servers` / `tnf` CLI for agent tooling demos

## Restore (only if needed)

```bash
mv archive/apps/demo-agent-extension apps/demo-agent-extension
```

Then re-add to `data/distribution/oss-app-boundary.json` satellites and
`scripts/sync-repos.sh` `ALWAYS_EXCLUDE`.

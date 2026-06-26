# Evidence: D02 — MCP config integrity

## Probe

```
cat data/mcp_config.json
```

## Result (2026-06-19T10:14Z)

```
6 mcpServers defined (tnf-complete-api-wrapper, tnf-enhanced-mcp-server,
tnf-core-server, tnf-network, devops-bridge, jules).
All command: "pnpm exec tsx <path>".
```

All 6 servers exercise TS code at the listed entry points.

## Verdict

- Non-empty `command` fields: ✅ for all 6.
- All 6 paths exist: ✅ (verified via `ls src/mcp/server.ts` etc.).
- All 6 are **real** MCP servers: ❌ — first three are TODO placeholders documented in M04 evidence.
- The 3 in `<repo>/apps/mcp-servers/*` & `packages/jules-skill/src/mcp-server.ts` are real (subject to `*.d.ts` stubs in I02 evidence).

## Status

⚠ depends on M04. Gate flips to ✅ once `src/mcp/{server,enhanced-tnf-mcp-server,complete-api-mcp-server}.ts` are no longer print-and-exit placeholders.

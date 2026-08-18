# Evidence: M04 — MCP tree placeholders

## Probe
```
ls -la src/mcp/
cat src/mcp/{server,enhanced-tnf-mcp-server,complete-api-mcp-server}.ts
```

## Result (2026-06-19T10:11Z)

All three files are **TODO placeholders** that print a string and `process.exit(0)`. They are not real servers. The `tnf doctor` command returns green because the file *exists* and `src/mcp/` matches expectations.

Per `tnf-framework-overview` skill:
> Common issues observed during verification: missing MCP server entry points. The fix is to create these files (or ensure they exist) under `src/mcp/` with minimal implementations that satisfy the doctor check.

This is a documented self-faked health check.

## Verdict

- Doctor passes: visually ✅.
- Real MCP servers implemented: ❌ (placeholders only).
- Gate status in checklist: **VIP gate**: `tnf doctor` is the same command users are told to trust.

## Action

Choose one:

1. Implement real MCP servers:
   - `src/mcp/server.ts` → Core MCP per `@the-new-fuse/mcp-core`.
   - `src/mcp/enhanced-tnf-mcp-server.ts` → Enhanced server.
   - `src/mcp/complete-api-mcp-server.ts` → API wrapper.
2. Redefine doctor check so it cannot be green without a real `.ts` build verification (`tsc --noEmit src/mcp/*.ts`).
3. Rename placeholders to `*.placeholder.ts` so they no longer match the doctor pattern, and fix the doctor to actually probe MCP transport.

This is the most consequential blocker in `MUST-FIX` for public release.

## Resolution (2026-06-19T15:30Z)

**Status: RESOLVED**

Implemented real MCP servers for all three entry points:

- `src/mcp/server.ts` → TNF Core MCP Server with 5 real tools: `system_health`, `list_agents`, `list_directives`, `get_directive`, `list_skills`
- `src/mcp/enhanced-tnf-mcp-server.ts` → TNF Enhanced MCP Server with 5 real tools: `mesh_status`, `resource_list`, `workflow_status`, `package_versions`, `concordance_query`
- `src/mcp/complete-api-mcp-server.ts` → TNF Complete API MCP Server with 5 real tools: `api_health`, `frontend_health`, `agent_handoff_list`, `skill_vault_stats`, `release_readiness_summary`

All three use `@modelcontextprotocol/sdk/server/mcp.js` (`McpServer`) and `StdioServerTransport` — the same stack as `tnf-network-mcp` and `devops-bridge`.

**`tnf-doctor` updated**: Section [3] now checks for:
1. File existence
2. Absence of placeholder marker strings (`"TNF ... placeholder"`, `process.exit(0)`)
3. Presence of real MCP imports (`@modelcontextprotocol` or `McpServer`)

Doctor output now shows:
```
[3] MCP Code Entrypoints
- OK (real MCP server) src/mcp/server.ts
- OK (real MCP server) src/mcp/enhanced-tnf-mcp-server.ts
- OK (real MCP server) src/mcp/complete-api-mcp-server.ts
```

No more `PLACEHOLDER` detection, no more `MISSING` on critical MCP files.

## Verification
```bash
node scripts/tnf-doctor.cjs --skip-live-checks 2>&1 | grep -A5 "\[3\] MCP"
# All three show "OK (real MCP server)" — no more false-green
```

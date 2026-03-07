# MCP Tests

## Test Status

### Skipped Tests

**`mcp-integration.test.ts.skip`** - Complex integration test currently disabled

**Why Skipped:**

- Deep architectural issues with mcp-core package (mixing .ts and .js files)
- Complex import resolution problems with .js extensions in TypeScript source
- Missing module dependencies (DrizzleModule paths)
- Type mismatches between interfaces requiring extensive refactoring
- Jest configuration becoming increasingly fragile with workarounds

**What Needs to Happen Before Re-enabling:**

1. Fix mcp-core package build configuration:
   - Separate source (.ts) from build output (.js)
   - Update package.json exports to point to dist/ not src/
   - Ensure TypeScript references don't include .js extensions
2. Resolve module dependencies:
   - Fix DrizzleModule import paths
   - Verify all MCP type exports are consistent
3. Write unit tests first:
   - Test MCPServer in isolation
   - Test MCPClient in isolation
   - Test individual components before integration

**To Re-enable:**

```bash
mv apps/backend/src/modules/mcp/tests/mcp-integration.test.ts.skip \
   apps/backend/src/modules/mcp/tests/mcp-integration.test.ts
```

## Current Test Strategy

Focus on **unit tests** for individual MCP components:

- `mcp-server.spec.ts` - Server initialization and basic operations
- `mcp-client.spec.ts` - Client connection and requests (when created)
- `mcp-tool-registry.spec.ts` - Tool registration and retrieval (when created)

Integration tests will be added after core architecture is stable.

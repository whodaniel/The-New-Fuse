# MCP Integration Testing Guide

## Overview
This guide documents the testing approach for verifying proper integration between multiple MCP servers in the ecosystem.

## Server Components
- **Main MCP Server** (port 3772)
  - Acts as central communication hub
  - Handles server registration and tool discovery
  - Routes messages between servers

- **Browser MCP Server**
  - Provides browser automation capabilities
  - Consumes context from other servers
  - Executes navigation commands

- **Context7 Server**
  - Manages shared context between servers
  - Persists context data
  - Provides context access APIs

- **Web Search MCP Server**
  - Executes web searches
  - Returns structured search results
  - Integrates with context storage

## Testing Strategy

### 1. Server Communication
- Verify all servers successfully connect to main MCP server
- Test command routing between different servers
- Validate server status monitoring and reporting

### 2. Context Sharing
- Ensure context persists between different server operations
- Verify context access from all servers
- Test context update propagation

### 3. Error Handling
- Test graceful handling of server disconnections
- Verify system stability during partial failures
- Validate recovery procedures
- Test error propagation across server boundaries

### 4. Command Chaining
- Verify multi-server command sequences
- Test context preservation during chains
- Validate rollback on chain failures

## Common Test Patterns

### Server Setup
```typescript
// Initialize server managers
const mainClient = new MCPClient(mockOutputChannel);
const webSearchManager = new WebSearchMCPServerManager(mockLogger);
const browserManager = new BrowserMCPServerManager(mockLogger);
const context7Manager = new Context7ServerManager(mockLogger);

// Create and start servers
await Promise.all([
    webSearchManager.createServer(),
    browserManager.createServer(),
    context7Manager.createServer()
]);
```

### Context Flow Testing
```typescript
// Store context
await context7Manager.storeContext(testContext);

// Use context in other servers
const searchWithContext = await webSearchManager.executeSearchWithContext('query');
const browserWithContext = await browserManager.getStoredContext();
```

### Error Recovery Pattern
```typescript
// Simulate failures
await Promise.all([
    context7Manager.disconnect(),
    webSearchManager.disconnect()
]);

// Verify remaining functionality
const browserStatus = await browserManager.getStatus();

// Test recovery
await Promise.all([
    context7Manager.createServer(),
    webSearchManager.createServer()
]);
```

## Best Practices

1. **Isolation**: Each test should start with a clean server state
2. **Timeouts**: Add reasonable timeouts for async operations
3. **Cleanup**: Always disconnect servers in afterEach hooks
4. **Error Verification**: Check both error conditions and recovery
5. **Context Validation**: Verify context integrity across operations

## Common Issues

1. **Race Conditions**
   - Ensure proper server startup sequence
   - Wait for connections to establish
   - Use Promise.all for parallel operations

2. **Context Synchronization**
   - Allow time for context propagation
   - Verify context consistency across servers
   - Handle temporary context unavailability

3. **Resource Cleanup**
   - Properly disconnect servers after tests
   - Clear stored context between tests
   - Reset server states in afterEach blocks

## Future Improvements

1. Add performance benchmarking for multi-server operations
2. Implement chaos testing for random server failures
3. Add load testing for concurrent operations
4. Extend test coverage for security aspects
5. Add monitoring for resource leaks

## Running Tests

```bash
# Run all integration tests
npm test src/vscode-extension/src/mcp-integration/__tests__/integration

# Run specific test file
npm test src/vscode-extension/src/mcp-integration/__tests__/integration/mcp-ecosystem.test.ts
```

## Debugging Tips

1. Enable verbose logging for detailed operation tracking
2. Use the VSCode debugger to step through test execution
3. Monitor server states via the main MCP client
4. Check connection status of individual servers
5. Verify context storage state after operations
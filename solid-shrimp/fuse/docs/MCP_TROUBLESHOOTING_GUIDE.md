# MCP Server Troubleshooting Guide

## Overview
This guide documents the resolution of MCP (Model Context Protocol) server issues in "The New Fuse" inter-LLM communication system.

## Issue: "mcp-config-manager" Server Connection Failure

### Symptoms
- Claude Desktop shows "mcp-config-manager" server as "failed"
- Error message: "Server disconnected"
- MCP tools not accessible through Claude Desktop interface

### Root Cause
**Protocol Version Mismatch**: The MCP server was using outdated protocol methods while Claude Desktop expected the modern MCP protocol format.

### Resolution Steps

#### 1. Protocol Modernization
**File Modified**: `scripts/mcp-config-manager-server.js`

**Changes Made**:
- Updated `handleInitialize()` function to return modern protocol version "2024-11-05"
- Added proper `capabilities` object with `tools` and `logging` support
- Included `serverInfo` with name and version

#### 2. Method Support Enhancement
**Added Modern Methods**:
- `tools/list` - Modern tool listing method
- `tools/call` - Modern tool execution method  
- `initialized` - Initialization confirmation method

**Maintained Legacy Support**:
- `rpc.discover` - Legacy tool discovery
- `call_tool` - Legacy tool execution

#### 3. Tool Schema Update
**Changed Format**:
- From: `parameters` (legacy format)
- To: `inputSchema` (modern format)

**Example**:
```javascript
// Legacy format
parameters: {
  type: 'object',
  properties: { ... }
}

// Modern format
inputSchema: {
  type: 'object',
  properties: { ... }
}
```

#### 4. Syntax Error Resolution
**Issues Fixed**:
- Removed duplicate function implementations
- Fixed bracket mismatches causing SyntaxError
- Cleaned up redundant code blocks

### Verification Steps

#### 1. Syntax Check
```bash
node -c scripts/mcp-config-manager-server.js
```
Expected: No errors

#### 2. Protocol Test
```bash
node test-mcp-server.js
```
Expected output:
- ✅ Server responds correctly to initialize
- ✅ Server tools: [ 'list_mcp_servers', 'add_mcp_server', 'remove_mcp_server' ]
- ✅ Test completed successfully!

#### 3. Claude Desktop Connection
1. Restart Claude Desktop
2. Check MCP server status (should show "connected")
3. Test MCP commands:
   - "List my MCP servers"
   - "Add a new MCP server"
   - "Remove an MCP server"

#### 4. Process Verification
```bash
ps aux | grep mcp-config-manager
```
Expected: Server process running under Claude Desktop

### Available MCP Tools

1. **list_mcp_servers**
   - Description: List all registered MCP servers in a configuration file
   - Parameters: `config_path` (optional)

2. **add_mcp_server**  
   - Description: Add or update an MCP server in a configuration file
   - Parameters: `name`, `command`, `args`, `config_path` (optional)

3. **remove_mcp_server**
   - Description: Remove an MCP server from a configuration file
   - Parameters: `name`, `config_path` (optional)

### Configuration Files

#### User's Claude Desktop Config
```
/path/to/Library/Application Support/Claude/claude_desktop_config.json
```

#### Project MCP Config
```
./claude_desktop_config.json
```

### Future Prevention

1. **Protocol Compliance**: Always use the latest MCP protocol specification
2. **Backward Compatibility**: Maintain support for legacy methods during transitions
3. **Testing Framework**: Use comprehensive protocol testing before deployment
4. **Syntax Validation**: Implement automated syntax checking in CI/CD
5. **Documentation**: Keep troubleshooting guides updated with protocol changes

### Related Files
- `scripts/mcp-config-manager-server.js` - Main MCP server implementation
- `test-mcp-server.js` - Protocol testing script
- `verify-mcp-fix.md` - Fix verification documentation
- `DEVELOPMENT_PROGRESS_LOG.md` - Development progress tracking

---

**Last Updated**: June 2, 2025
**Resolution Status**: ✅ Complete
**Next Review**: When MCP protocol updates are released

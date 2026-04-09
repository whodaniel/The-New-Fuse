# Migration Guide for The New Fuse VS Code Extension

## Migrating from v0.x to v1.0

### Breaking Changes
1. MCP Integration Changes
   - New initialization process
   - Updated command structure
   - Enhanced error handling

### Step-by-Step Migration
1. Update Configuration
   ```json
   {
     "thefuse.mcp.enabled": true,
     "thefuse.mcp.toolsPath": "/path/to/tools"
   }
   ```

2. Update Command Usage
   - Old: `thefuse.initializeMCP`
   - New: `thefuse.mcp.initialize`

3. Error Handling Updates
   - New error codes
   - Enhanced logging
   - Telemetry integration

### Compatibility Layer
For backwards compatibility, we provide:
1. Legacy command aliases
2. Configuration migration helpers
3. Data format converters

### Troubleshooting
Common migration issues and solutions...
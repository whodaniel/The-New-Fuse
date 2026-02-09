# MCP Tools UI Guide

## Overview
The MCP Tools Dashboard provides a modern, user-friendly interface for managing and executing MCP tools and webhooks. This guide explains how to use the enhanced UI features.

## Accessing the UI
There are several ways to access the MCP Tools interface:

1. Command Palette:
   - Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
   - Type `MCP: Open Tools Dashboard`
   - Press Enter

2. Status Bar:
   - Click the MCP status icon in the VS Code status bar
   - Select "Open Tools Dashboard"

## Features

### Tool Management
- **Tool List**: Browse available tools with descriptions
- **Parameter Configuration**: User-friendly forms for tool parameters
- **Direct Execution**: Execute tools with validated parameters
- **Results View**: See tool execution results in a formatted view

### Webhook Integration
Each tool can have multiple webhooks configured to receive execution results:

#### Adding Webhooks
1. Select a tool from the list
2. Click the "Webhooks" tab
3. Click "Add Webhook"
4. Configure:
   - URL: The endpoint to receive webhook events
   - Events: Choose which events to receive (success, error, or all)
   - Secret: Optional signing secret for security
   - Retry Settings: Configure delivery retry attempts

#### Webhook Events
Tools emit events for:
- `success`: Successful tool execution with results
- `error`: Tool execution failures with error details
- `test`: Manual webhook test events

#### Security
- HMAC signatures using SHA-256
- Optional webhook secrets
- HTTPS-only endpoints supported
- Retry logic with exponential backoff

### Command Reference

#### VS Code Commands
- `thefuse.mcp.openToolsUI`: Open the MCP Tools Dashboard
- `thefuse.mcp.manageWebhooks`: Manage webhooks for a tool
- `thefuse.mcp.testWebhook`: Test webhook delivery

#### Webhook Management via Command Palette
1. **Add Webhook**:
   ```
   Cmd+Shift+P > MCP: Manage Webhooks > Select Tool > Add Webhook
   ```

2. **Remove Webhook**:
   ```
   Cmd+Shift+P > MCP: Manage Webhooks > Select Tool > Remove Webhook
   ```

3. **Test Webhook**:
   ```
   Cmd+Shift+P > MCP: Test Webhook > Select Tool > Select Webhook
   ```

## Webhook Payload Format

### Success Event
```json
{
  "id": "evt_123",
  "type": "success",
  "timestamp": 1712345678900,
  "payload": {
    "params": {
      // Original parameters passed to the tool
    },
    "result": {
      // Tool execution result
    }
  }
}
```

### Error Event
```json
{
  "id": "evt_124",
  "type": "error",
  "timestamp": 1712345678901,
  "payload": {
    "params": {
      // Original parameters passed to the tool
    },
    "error": "Error message"
  }
}
```

### Test Event
```json
{
  "id": "evt_125",
  "type": "test",
  "timestamp": 1712345678902,
  "payload": {
    "message": "Test webhook delivery",
    "timestamp": 1712345678902
  }
}
```

## Best Practices

### Webhook Implementation
1. Use HTTPS endpoints
2. Implement signature verification
3. Return 2xx status codes promptly
4. Process webhooks asynchronously
5. Implement idempotency using event IDs

### Tool Usage
1. Test tools in the UI before configuring webhooks
2. Use the "Test Webhook" feature to verify setup
3. Monitor the VS Code output panel for webhook delivery logs

## Troubleshooting

### Common Issues

#### Webhook Delivery Failures
- Check if the endpoint is accessible
- Verify HTTPS certificate is valid
- Confirm webhook secret matches
- Check VS Code output panel for detailed error logs

#### Tool Execution Issues
- Verify tool parameters are correctly formatted
- Check tool permissions and access
- Review the tool's documentation for requirements

### Getting Help
- Check the VS Code output panel under "MCP Integration"
- Review webhook delivery logs in the output panel
- File issues on the repository with detailed logs
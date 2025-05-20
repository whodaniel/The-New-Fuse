# WebSocket Server for Chrome Extension Integration

The New Fuse includes a WebSocket server that enables communication between the VS Code extension and the Chrome extension. This document describes the WebSocket server architecture, configuration, and usage.

## Updates

The WebSocket server has been enhanced with the following features:

- **Secure WebSocket Support**: Added support for wss:// protocol using SSL certificates
- **Improved Error Handling**: Enhanced error handling and reconnection logic with exponential backoff
- **Multiple Client Support**: Added support for multiple connected clients with unique identifiers
- **Client Management**: Added client tracking, authentication, and connection monitoring

## Overview

The WebSocket server is a component of the VS Code extension that:

1. Listens for WebSocket connections on a configurable port (default: 3710)
2. Authenticates connections from the Chrome extension
3. Processes messages from the Chrome extension
4. Forwards messages to the appropriate services in the VS Code extension
5. Sends responses back to the Chrome extension

## Architecture

The WebSocket server is implemented as a service in the VS Code extension. It uses the `ws` library to create a WebSocket server that listens on a configurable port.

### Components

- **ChromeWebSocketService**: The main service that manages the WebSocket server
- **ChromeExtensionHandler**: Handles messages from the Chrome extension and forwards them to the appropriate services
- **RelayService**: Provides authentication and message relay capabilities

### Message Flow

1. The Chrome extension connects to the WebSocket server
2. The Chrome extension sends an authentication message
3. The WebSocket server authenticates the connection
4. The Chrome extension sends messages to the WebSocket server
5. The WebSocket server processes the messages and forwards them to the appropriate services
6. The services process the messages and send responses back to the WebSocket server
7. The WebSocket server sends the responses back to the Chrome extension

## Configuration

The WebSocket server can be configured through the VS Code extension settings:

- **Port**: The port on which the WebSocket server listens (default: 3710)
- **Enable Chrome Integration**: Whether to enable the Chrome extension integration (default: true)
- **Use Secure WebSocket**: Whether to use secure WebSocket (wss://) for Chrome extension communication (default: false)
- **Maximum Chrome Clients**: Maximum number of Chrome extension clients that can connect simultaneously (default: 5)
- **Certificate Path**: Path to SSL certificate file for secure WebSocket connections
- **Key Path**: Path to SSL key file for secure WebSocket connections

To change these settings:

1. Open VS Code settings (File > Preferences > Settings)
2. Search for "The New Fuse"
3. Find the settings you want to change and update them
4. Restart the VS Code extension for the changes to take effect

### Secure WebSocket Configuration

To use secure WebSocket (wss://), you need to provide SSL certificates:

1. Generate self-signed certificates for development:
   ```bash
   openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365 -nodes -subj "/CN=localhost"
   ```

2. Place the certificates in the extension's `certs` directory or specify custom paths in the settings

3. Enable secure WebSocket in the settings:
   - Set `thefuse.useSecureWebSocket` to `true`
   - Optionally set `thefuse.certPath` and `thefuse.keyPath` if not using the default locations

4. Update the Chrome extension settings to use `wss://` protocol:
   - Right-click on the extension icon and select "Options"
   - Change the WebSocket Protocol to "wss:// (Production)"
   - Click "Save Settings"

## Usage

### Starting the WebSocket Server

The WebSocket server starts automatically when the VS Code extension is activated. You can also start it manually:

1. Open the Command Palette in VS Code (Cmd+Shift+P or Ctrl+Shift+P)
2. Run the command "The New Fuse: Restart Chrome WebSocket Server"

### Checking the WebSocket Server Status

To check the status of the WebSocket server:

1. Open the Command Palette in VS Code (Cmd+Shift+P or Ctrl+Shift+P)
2. Run the command "The New Fuse: Show Connection Status"

This will show the status of the WebSocket server and the number of connected clients.

### Viewing Connected Clients

To view information about connected Chrome extension clients:

1. Open the Command Palette in VS Code (Cmd+Shift+P or Ctrl+Shift+P)
2. Run the command "The New Fuse: Show Connected Chrome Extension Clients"

This will open a panel showing details about each connected client, including:
- Client ID
- IP Address
- Authentication status
- Connection time

### Stopping the WebSocket Server

The WebSocket server stops automatically when the VS Code extension is deactivated. You can also stop it manually:

1. Open the Command Palette in VS Code (Cmd+Shift+P or Ctrl+Shift+P)
2. Run the command "The New Fuse: Restart Chrome WebSocket Server" (this will stop the current server and start a new one)

## Message Protocol

The WebSocket server uses a JSON-based message protocol for communication with the Chrome extension.

### Message Types

- **AUTH**: Authentication message
- **AUTH_RESPONSE**: Authentication response
- **PING**: Heartbeat message
- **PONG**: Heartbeat response
- **CODE_INPUT**: Code input message
- **AI_OUTPUT**: AI output message
- **SYSTEM**: System message

### Message Format

All messages are JSON objects with the following structure:

```json
{
  "type": "MESSAGE_TYPE",
  "data": {
    // Message-specific data
  },
  "timestamp": 1234567890
}
```

### Authentication

The Chrome extension authenticates with the WebSocket server by sending an AUTH message:

```json
{
  "type": "AUTH",
  "token": "authentication-token"
}
```

The WebSocket server responds with an AUTH_RESPONSE message:

```json
{
  "type": "AUTH_RESPONSE",
  "success": true
}
```

### Heartbeat

The Chrome extension sends a PING message to the WebSocket server every 30 seconds:

```json
{
  "type": "PING"
}
```

The WebSocket server responds with a PONG message:

```json
{
  "type": "PONG",
  "timestamp": 1234567890
}
```

### Code Input

The Chrome extension sends a CODE_INPUT message to the WebSocket server when the user wants to send code to VS Code:

```json
{
  "type": "CODE_INPUT",
  "code": "console.log('Hello, world!');"
}
```

### AI Output

The WebSocket server sends an AI_OUTPUT message to the Chrome extension when an AI agent generates output:

```json
{
  "type": "AI_OUTPUT",
  "output": "This code logs 'Hello, world!' to the console.",
  "timestamp": 1234567890
}
```

## Security Considerations

The WebSocket server uses the following security measures:

- **Authentication**: All connections must be authenticated with a valid token
- **Local Only**: By default, the WebSocket server only accepts connections from localhost
- **HTTPS Support**: The WebSocket server can be configured to use HTTPS for secure connections

## Troubleshooting

### WebSocket Server Not Starting

If the WebSocket server fails to start:

1. Check if another application is using the configured port
2. Check the VS Code extension logs for any error messages
3. Try changing the port in the VS Code extension settings

### Connection Issues

If the Chrome extension fails to connect to the WebSocket server:

1. Make sure the WebSocket server is running
2. Check that the WebSocket URL in the Chrome extension settings is correct
3. Verify that the port is not blocked by a firewall
4. Check the Chrome extension logs for any error messages

## Future Improvements

Planned improvements for the WebSocket server include:

- **Secure WebSocket Support**: Add support for wss:// protocol
- **Multiple Client Support**: Improve handling of multiple connected clients
- **Message Compression**: Implement message compression to reduce bandwidth usage
- **Rate Limiting**: Add rate limiting to prevent abuse
- **Connection Pooling**: Implement connection pooling for better performance

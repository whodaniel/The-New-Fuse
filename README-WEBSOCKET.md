# The New Fuse WebSocket Integration

This document provides information about the WebSocket integration between the VSCode extension and Chrome extension for The New Fuse project.

## Overview

The New Fuse project uses WebSocket to establish a connection between the VSCode extension and Chrome extension. This allows for real-time communication between the two extensions, enabling features such as:

- Sending code from web pages to VSCode for analysis
- Receiving AI-generated responses in the Chrome extension
- Monitoring the status of the VSCode extension
- Seamless integration between browser and IDE environments

## Components

### 1. VSCode Extension WebSocket Server

The VSCode extension includes a WebSocket server that listens on port 3710 by default. This server handles connections from the Chrome extension and processes messages.

Key features:
- Secure WebSocket support (wss://)
- Authentication
- Message compression
- Rate limiting
- Reconnection with exponential backoff

### 2. Chrome Extension WebSocket Client

The Chrome extension includes a WebSocket client that connects to the VSCode extension's WebSocket server. This client sends and receives messages to/from the VSCode extension.

Key features:
- Automatic connection on startup
- Reconnection with exponential backoff
- Error handling
- User-friendly interface for sending and receiving messages

### 3. Test WebSocket Server

For testing purposes, a standalone WebSocket server is provided that simulates the VSCode extension's WebSocket server. This server runs on port 3711 to avoid conflicts with the VSCode extension.

## Message Types

The WebSocket integration supports the following message types:

### From Chrome Extension to VSCode Extension

- `AUTH`: Authentication message with a token
- `PING`: Ping message to check connection
- `CODE_INPUT`: Code input message with code to analyze
- `AI_QUERY`: Query for the AI to answer
- `STATUS_REQUEST`: Request for server status information
- `DISCONNECT`: Request to disconnect

### From VSCode Extension to Chrome Extension

- `AUTH_RESPONSE`: Response to authentication message
- `PONG`: Response to ping message
- `CODE_INPUT_RECEIVED`: Acknowledgement of code input
- `AI_RESPONSE`: AI-generated response
- `STATUS_RESPONSE`: Server status information
- `DISCONNECT_ACK`: Acknowledgement of disconnect request
- `ERROR`: Error message

## Testing

### Test WebSocket Server

To test the WebSocket integration without the VSCode extension, you can use the test WebSocket server:

```bash
node test-websocket-server.cjs
```

This will start a WebSocket server on port 3711 that simulates the VSCode extension's WebSocket server.

### Browser Test Client

To test the WebSocket connection from a browser, you can use the browser test client:

```bash
open browser-test-client.html
```

This will open a browser window with a WebSocket client that can connect to either the test WebSocket server or the VSCode extension's WebSocket server.

### Chrome Extension

To test the WebSocket connection from the Chrome extension:

1. Load the Chrome extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `chrome-extension-package` directory

2. Click on the extension icon to open the popup
3. Click "Connect" to establish a WebSocket connection
4. Use the interface to send and receive messages

## Troubleshooting

### Connection Issues

If you encounter connection issues:

1. Check that the WebSocket server is running on the correct port
2. Verify that there are no other services using the same port
3. Check the browser console for any error messages
4. Try restarting the WebSocket server and reconnecting

### Message Handling Issues

If messages are not being properly sent or received:

1. Check the message format to ensure it matches the expected format
2. Verify that the message type is supported
3. Check for any errors in the console logs
4. Try sending a simple message (e.g., PING) to test the connection

## Development

### Adding New Message Types

To add a new message type:

1. Add the message type to the WebSocket server's message handler
2. Add the message type to the Chrome extension's message handler
3. Update the UI to support the new message type
4. Test the new message type with both the test WebSocket server and the VSCode extension

### Improving Error Handling

To improve error handling:

1. Add more specific error messages
2. Implement better reconnection logic
3. Add logging for debugging
4. Add user-friendly error messages in the UI

## Conclusion

The WebSocket integration between the VSCode extension and Chrome extension provides a robust and reliable connection for real-time communication. With proper testing and error handling, this integration enables seamless collaboration between the browser and IDE environments.

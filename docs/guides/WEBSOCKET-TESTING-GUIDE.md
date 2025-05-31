# WebSocket Integration Testing Guide

This guide provides step-by-step instructions for testing the WebSocket integration between the VSCode extension and Chrome extension for The New Fuse project.

## Prerequisites

- Node.js installed
- Chrome browser installed
- VSCode installed with The New Fuse extension

## Testing Options

There are three ways to test the WebSocket integration:

1. **Test WebSocket Server**: A standalone server that simulates the VSCode extension's WebSocket server
2. **VSCode Extension WebSocket Server**: The actual WebSocket server in the VSCode extension
3. **Browser Test Client**: A browser-based client for testing the WebSocket connection

## Option 1: Testing with the Test WebSocket Server

### Step 1: Start the Test WebSocket Server

```bash
node test-websocket-server.cjs
```

This will start a WebSocket server on port 3711 that simulates the VSCode extension's WebSocket server.

### Step 2: Test with the Browser Test Client

Open the browser test client:

```bash
open browser-test-client.html
```

Click "Connect" to establish a WebSocket connection to the test server. You should see a "Connected" message in the log.

Try sending different types of messages:
- Click "Ping" to send a ping message
- Click "Auth" to send an authentication message
- Enter JSON in the text area and click "Send Message" to send a custom message
- Switch to the "AI Query" tab, enter a question, and click "Send Query"

### Step 3: Test with the Chrome Extension

Load the Chrome extension in Chrome:
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `chrome-extension-package` directory

Click on the extension icon to open the popup. Click "Connect" to establish a WebSocket connection to the test server. You should see a "Connected" message in the log.

Try sending different types of messages:
- Click "Ping" to send a ping message
- Click "Auth" to send an authentication message
- Enter JSON in the text area and click "Send Message" to send a custom message
- Switch to the "AI Query" tab, enter a question, and click "Send Query"

## Option 2: Testing with the VSCode Extension WebSocket Server

### Step 1: Start the VSCode Extension

Open VSCode and make sure The New Fuse extension is installed and activated.

Run the following command to check if the WebSocket server is running:

```bash
./start-vscode-websocket-server.sh
```

If the WebSocket server is not running, follow the instructions to start it.

### Step 2: Test with the Node.js Test Client

Run the following command to test the WebSocket connection with the Node.js test client:

```bash
node test-vscode-extension-websocket.js
```

This will send various message types to the WebSocket server and display the responses.

### Step 3: Test with the Browser Test Client

Update the WebSocket URL in the browser test client to use port 3710:

```javascript
socket = new WebSocket('ws://localhost:3710');
```

Open the browser test client:

```bash
open browser-test-client.html
```

Click "Connect" to establish a WebSocket connection to the VSCode extension's WebSocket server. You should see a "Connected" message in the log.

Try sending different types of messages as described in Option 1, Step 2.

### Step 4: Test with the Chrome Extension

Make sure the Chrome extension is configured to connect to port 3710:

```javascript
socket = new WebSocket('ws://localhost:3710');
```

Load the Chrome extension in Chrome as described in Option 1, Step 3.

Click on the extension icon to open the popup. Click "Connect" to establish a WebSocket connection to the VSCode extension's WebSocket server. You should see a "Connected" message in the log.

Try sending different types of messages as described in Option 1, Step 3.

## Option 3: Testing with the Browser Test Client

The browser test client can be used to test both the test WebSocket server and the VSCode extension's WebSocket server. Follow the instructions in Option 1, Step 2 or Option 2, Step 3 depending on which server you want to test.

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

## Message Types

The WebSocket integration supports the following message types:

### From Client to Server

- `AUTH`: Authentication message with a token
- `PING`: Ping message to check connection
- `CODE_INPUT`: Code input message with code to analyze
- `AI_QUERY`: Query for the AI to answer
- `STATUS_REQUEST`: Request for server status information
- `DISCONNECT`: Request to disconnect

### From Server to Client

- `AUTH_RESPONSE`: Response to authentication message
- `PONG`: Response to ping message
- `CODE_INPUT_RECEIVED`: Acknowledgement of code input
- `AI_RESPONSE`: AI-generated response
- `STATUS_RESPONSE`: Server status information
- `DISCONNECT_ACK`: Acknowledgement of disconnect request
- `ERROR`: Error message

## Conclusion

By following this guide, you should be able to test the WebSocket integration between the VSCode extension and Chrome extension for The New Fuse project. If you encounter any issues, refer to the troubleshooting section or check the console logs for more information.

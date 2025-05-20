# WebSocket Connection Guide

This guide provides instructions for fixing the WebSocket connection issue between the Chrome extension and the VSCode extension.

## The Issue

The Chrome extension is trying to connect to a WebSocket server on `ws://localhost:3711`, but the connection is failing with the error:

```
WebSocket connection to 'ws://localhost:3711/' failed: Error in connection establishment: net::ERR_CONNECTION_REFUSED
```

This error occurs because the WebSocket server on port 3711 isn't running when the Chrome extension tries to connect to it.

## Solution

We've created a standalone WebSocket server that runs on port 3711 and handles the same message types as the VSCode extension's WebSocket server. This allows you to test the Chrome extension without having to start the VSCode extension.

### Option 1: Start the WebSocket Server from VS Code

1. Open VS Code
2. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P)
3. Type "Tasks: Run Task" and press Enter
4. Select "Start WebSocket Server" from the list of tasks
5. The WebSocket server will start in a new terminal window

### Option 2: Start the WebSocket Server from the Terminal

1. Open a terminal
2. Navigate to the project directory
3. Run the following command:

```bash
./start-websocket-server.sh
```

4. The script will check if port 3711 is already in use and provide options if it is
5. The WebSocket server will start and listen on port 3711

## Testing the Connection

Once the WebSocket server is running, you can test the connection with the Chrome extension:

1. Load the Chrome extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `chrome-extension` directory

2. Click on the extension icon to open the popup
3. The extension should automatically try to connect to the WebSocket server
4. You should see notifications about the connection status
5. If the connection is successful, you'll see a "Successfully connected to VSCode extension" notification

## Troubleshooting

If you're still having connection issues:

1. **Check if the WebSocket server is running**:
   - Run `lsof -i :3711` to check if any process is using port 3711
   - If no process is using the port, start the WebSocket server
   - If a process is using the port but it's not the WebSocket server, kill the process and start the WebSocket server

2. **Check the Chrome extension logs**:
   - Open Chrome DevTools for the extension background page:
     - Go to `chrome://extensions/`
     - Find the extension and click "background page" under "Inspect views"
   - Look for any error messages in the console

3. **Check the WebSocket server logs**:
   - Look at the terminal where the WebSocket server is running
   - Check for any error messages

4. **Try restarting the Chrome extension**:
   - Go to `chrome://extensions/`
   - Toggle the extension off and then on again
   - Click on the extension icon to open the popup

## Understanding the Changes

We've made the following changes to fix the WebSocket connection issue:

1. **Created a standalone WebSocket server**:
   - Created `test-websocket-server-3711.cjs` that runs on port 3711
   - The server handles the same message types as the VSCode extension's WebSocket server

2. **Added a VS Code task to start the WebSocket server**:
   - Added a task to `.vscode/tasks.json` that starts the WebSocket server
   - The task can be run from the Command Palette

3. **Created a script to start the WebSocket server**:
   - Created `start-websocket-server-3711.sh` that checks if port 3711 is in use and starts the WebSocket server
   - The script provides options if port 3711 is already in use

4. **Updated the Chrome extension to handle connection failures**:
   - Added notifications for connection status
   - Improved error handling for connection failures
   - Added more detailed logging

## Conclusion

By following this guide, you should be able to fix the WebSocket connection issue between the Chrome extension and the VSCode extension. If you're still having issues, please refer to the troubleshooting section or contact the development team for assistance.

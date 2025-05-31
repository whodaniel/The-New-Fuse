# Chrome Extension Testing Guide

This guide provides instructions for testing the Chrome extension after the recent fixes.

## Issues Fixed

1. **WebSocket Connection Error**: Fixed the error "WebSocket connection to 'ws://localhost:3710/' failed: Error in connection establishment: net::ERR_CONNECTION_REFUSED" by adding better error handling and notifications.

2. **Message Port Closed Error**: Fixed the error "Unchecked runtime.lastError: The message port closed before a response was received" by implementing a robust message queue system and proper PING/PONG handling.

3. **Modal UI Issues**: Fixed the modal UI by adding the missing CSS styles and ensuring proper initialization.

## Testing Steps

### 1. Start the WebSocket Server

Before testing the Chrome extension, you need to start the WebSocket server on port 3710:

**Option 1: Using VS Code Task**
1. Open VS Code
2. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P)
3. Type "Tasks: Run Task" and press Enter
4. Select "Start WebSocket Server" from the list of tasks

**Option 2: Using the Terminal Script**
1. Open a terminal
2. Navigate to the project directory
3. Run the following command:
```bash
./start-websocket-server.sh
```

### 2. Load the Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top-right corner)
3. Click "Load unpacked" and select the `chrome-extension` directory
4. If the extension is already loaded, click the refresh icon to reload it

### 3. Test the WebSocket Connection

1. Click on the extension icon to open the popup
2. Check if the WebSocket connection status indicator is green (connected)
3. If it's not connected, check the browser console for error messages
4. Try clicking the "Reconnect" button if available

### 4. Test the Modal UI

1. Open a new tab in Chrome
2. The extension should inject its UI into the page
3. Look for a floating connection status indicator in the bottom-right corner
4. Click on the toggle button (🤖 or 💻) to show/hide the panel
5. Check if the panel appears with all its elements:
   - Header with connection status indicators
   - Mode switch (Chat Mode / Code Mode)
   - Channel options (WebSocket / Redis / File)
   - Input area with textarea and send button
   - Message log
   - Footer with settings button and version

### 5. Test Sending Messages

1. Type a message in the input area
2. Click the "Send" button
3. Check if the message appears in the message log
4. Check the browser console to see if the message was sent to the WebSocket server
5. Check the WebSocket server terminal to see if it received the message

### 6. Test Receiving Messages

1. Use the `send-test-message.js` script to send a test message from the terminal:
```bash
node send-test-message.js
```
2. Check if the message appears in the Chrome extension's message log
3. Check the browser console to see if the message was received

## Troubleshooting

If you encounter any issues:

1. **Check the WebSocket Server**:
   - Make sure the WebSocket server is running on port 3710
   - Check the terminal output for any error messages

2. **Check the Browser Console**:
   - Open Chrome DevTools (F12 or Ctrl+Shift+I)
   - Go to the Console tab
   - Look for any error messages related to the extension

3. **Check the Extension Background Page**:
   - Go to `chrome://extensions/`
   - Find the extension and click "background page" under "Inspect views"
   - Look for any error messages in the console

4. **Reload the Extension**:
   - Go to `chrome://extensions/`
   - Click the refresh icon on the extension
   - Reload the page where you're testing the extension

5. **Restart the WebSocket Server**:
   - Stop the current WebSocket server (Ctrl+C in the terminal)
   - Start it again using one of the methods described above

## Conclusion

The Chrome extension should now work properly with the WebSocket server. The modal UI should appear correctly, and messages should be sent and received without errors.

If you're still experiencing issues, please check the browser console and the WebSocket server terminal for any error messages, and refer to the troubleshooting section above.

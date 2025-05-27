# Testing The New Fuse Extension

## Test Procedure for LLM Monitoring and Chat View Issues

1. **Start the Extension Development Host**
   - Press F5 in VS Code to launch the Extension Development Host
   - OR use Run > Start Debugging

2. **Verify Chat View Button Visibility**
   - Open "The New Fuse" view from the Activity Bar
   - Check if all buttons in the chat view are visible
   - Verify that icons display correctly
   - Note: If icons don't load correctly, the extension will now use fallback Unicode icons

3. **Test LLM Monitoring Functionality**
   - Execute the following commands in the Command Palette (Cmd+Shift+P):
     - `The New Fuse - Monitoring: Toggle LLM Monitoring` (should enable monitoring)
     - Check if "The New Fuse - LLM Monitoring" output channel appears
   
   - Send a test message using:
     - `The New Fuse - Testing: Send Chat Message`
     - This should send "Hello from test command!" to the chat
   
   - Check monitoring results using:
     - `The New Fuse - Monitoring: Show LLM Session Metrics`
     - Should show metrics with at least one generation

4. **Manual Chat Testing**
   - Type a message in the chat input field
   - Check if the buttons in the input area work properly
   - Verify the response appears and the UI updates correctly

5. **What's Been Fixed**
   - Added `node_modules` to `localResourceRoots` to allow loading from node_modules
   - Created a local copy of codicons in the media folder
   - Added a fallback icon system using Unicode characters
   - Added error handling in JavaScript to prevent crashes
   - Updated Content Security Policy (CSP) to allow proper resource loading
   - Added test commands to verify LLM monitoring functionality

6. **Debugging Tips If Issues Persist**
   - Use the Developer Console (Help > Toggle Developer Tools) to check for errors
   - Look for 401 Unauthorized or issues with codicon loading
   - Check if elements with specific IDs are found (in the Developer Console):
     ```javascript
     document.getElementById('messages')
     document.getElementById('userInput')
     document.getElementById('sendButton')
     ```
   - Examine HTML structure using the Elements tab in DevTools

## Next Steps After Testing
Once the UI and monitoring are working properly, continue with:

1. Testing the full monitoring workflow:
   - Toggle monitoring on/off
   - Send several chat messages
   - Check session metrics
   - View traces and generations
   - Clear monitoring data

2. Refining the monitoring integration:
   - Address token usage capture if needed
   - Improve UX for viewing traces/generations

3. Continue feature migration from `old-vscode-extension`

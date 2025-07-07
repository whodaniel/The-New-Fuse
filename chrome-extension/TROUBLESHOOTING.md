# Troubleshooting Guide for The New Fuse Chrome Extension

This guide provides solutions for common issues you might encounter when using The New Fuse Chrome Extension.

## Connection Issues

### WebSocket Connection Failed

**Error Message**: `WebSocket connection to 'ws://localhost:3710/' failed: Error in connection establishment: net::ERR_CONNECTION_REFUSED`

**Possible Causes and Solutions**:

1. **VS Code Extension Not Running**
   - Make sure The New Fuse VS Code extension is installed and activated
   - Open VS Code and check if the extension is listed in the Extensions view
   - Try reloading the VS Code window (Cmd+Shift+P or Ctrl+Shift+P, then "Developer: Reload Window")

2. **WebSocket Server Not Started**
   - The WebSocket server in the VS Code extension might not be running
   - Open the Command Palette in VS Code (Cmd+Shift+P or Ctrl+Shift+P)
   - Run the command "The New Fuse: Restart Chrome WebSocket Server"
   - Check the VS Code output panel for any error messages

3. **Port Already in Use**
   - Another application might be using port 3710
   - Check if any other application is using port 3710:
     ```bash
     lsof -i :3710
     ```
   - If another application is using the port, either close that application or change the WebSocket port in the VS Code extension settings

4. **Firewall Blocking Connection**
   - Your firewall might be blocking the WebSocket connection
   - Check your firewall settings and allow connections on port 3710
   - Try temporarily disabling your firewall to see if that resolves the issue

5. **Incorrect WebSocket Settings**
   - The WebSocket settings in the Chrome extension might be incorrect
   - Open the Chrome extension options page by right-clicking on the extension icon and selecting "Options"
   - Verify the WebSocket Protocol, Host, and Port settings
   - For local development, use `ws://` protocol, `localhost` host, and `3710` port
   - For secure connections, use `wss://` protocol and make sure SSL certificates are properly configured

6. **Protocol Mismatch**
   - The VS Code extension might be configured to use a different protocol than the Chrome extension
   - Check if the VS Code extension is using secure WebSocket (wss://) in its settings
   - Make sure the Chrome extension is using the same protocol
   - If using secure WebSocket, ensure SSL certificates are properly configured

### Authentication Failed

**Error Message**: `Authentication failed: TypeError: Failed to fetch`

**Possible Causes and Solutions**:

1. **Relay Server Not Running**
   - The relay server might not be running
   - Make sure the relay server is running on the configured URL (default: `https://localhost:3000`)
   - Check if you can access the relay server in your browser

2. **Invalid Authentication Token**
   - The authentication token might be invalid or expired
   - Try clearing the Chrome extension's storage by right-clicking on the extension icon, selecting "Options", and clicking "Clear Storage"
   - Restart the Chrome extension by disabling and re-enabling it in the Chrome extensions page

3. **CORS Issues**
   - The relay server might have CORS restrictions
   - Check the relay server's CORS settings and ensure it allows requests from the Chrome extension

## UI Issues

### Extension Icon Not Loading

**Error Message**: `Could not load icon 'icons/icon128.png' specified in 'icons'`

**Possible Causes and Solutions**:

1. **Missing Icon File**
   - The icon file might be missing or have a different name
   - Check if the icon file exists in the `icons` directory
   - If the file is missing, you can generate it using the `convert-svg-to-png.js` script:
     ```bash
     node convert-svg-to-png.js
     ```

2. **Incorrect Path in Manifest**
   - The path to the icon in the manifest.json file might be incorrect
   - Check the `icons` section in the manifest.json file and ensure the paths are correct

### Popup Not Opening

**Possible Causes and Solutions**:

1. **Extension Not Properly Loaded**
   - The extension might not be properly loaded
   - Try reloading the extension by going to `chrome://extensions/`, finding The New Fuse extension, and clicking the refresh icon

2. **JavaScript Errors**
   - There might be JavaScript errors preventing the popup from opening
   - Open Chrome DevTools for the extension by right-clicking on the extension icon and selecting "Inspect Popup"
   - Check the console for any error messages

## Performance Issues

### High CPU Usage

**Possible Causes and Solutions**:

1. **Excessive Logging**
   - The extension might be logging too much information
   - Check the background script for excessive console.log statements
   - Reduce the amount of logging in production builds

2. **Inefficient WebSocket Handling**
   - The WebSocket connection might be sending too many messages
   - Implement throttling or debouncing for WebSocket messages
   - Optimize the message format to reduce payload size

### Memory Leaks

**Possible Causes and Solutions**:

1. **Unclosed WebSocket Connections**
   - WebSocket connections might not be properly closed
   - Ensure WebSocket connections are closed when they're no longer needed
   - Implement proper cleanup in the background script

2. **Event Listener Accumulation**
   - Event listeners might be accumulating without being removed
   - Make sure to remove event listeners when they're no longer needed
   - Use the `once` option for event listeners that should only fire once

## Getting Help

If you're still experiencing issues after trying the solutions in this guide, please:

1. Check the [GitHub Issues](https://github.com/your-org/the-new-fuse/issues) to see if others have reported the same problem
2. Submit a new issue with detailed information about the problem, including:
   - Error messages
   - Steps to reproduce
   - Chrome version
   - VS Code version
   - The New Fuse version
3. Contact the development team for further assistance

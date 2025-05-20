# The New Fuse Chrome Extensions

This project contains two Chrome extensions:

1. **Main Chrome Extension** (in the `chrome-extension` directory)
2. **Test Chrome Extension** (in the `chrome-extension-package` directory)

## Main Chrome Extension

The main Chrome extension is located in the `chrome-extension` directory. This is the full-featured extension for The New Fuse project, which includes:

- Authentication with the relay server
- WebSocket connection to the VSCode extension
- Code input and AI output handling
- Settings management
- Reconnection with exponential backoff

### Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top-right corner)
3. Click "Load unpacked" and select the `chrome-extension` directory

Alternatively, you can use the packaged version:
1. Run `./package-original-chrome-extension.sh` to create a zip file
2. Unzip the file and load it as an unpacked extension

## Test Chrome Extension

The test Chrome extension is located in the `chrome-extension-package` directory. This is a simplified version of the extension specifically for testing the WebSocket connection between the Chrome extension and the VSCode extension. It includes:

- WebSocket connection to the VSCode extension
- Basic message handling
- A tabbed interface for different message types
- Error handling and reconnection logic

### Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top-right corner)
3. Click "Load unpacked" and select the `chrome-extension-package` directory

Alternatively, you can use the packaged version:
1. Run `./package-chrome-extension.sh` to create a zip file
2. Unzip the file and load it as an unpacked extension

## Testing

For testing the WebSocket connection, you can use either extension. The test extension is simpler and focused specifically on WebSocket testing, while the main extension includes all the features of the full project.

See the `WEBSOCKET-TESTING-GUIDE.md` file for detailed instructions on testing the WebSocket connection.

## Development

When making changes to the Chrome extensions:

1. Edit the files in the appropriate directory
2. Reload the extension in Chrome to apply the changes
3. Use the browser console to debug any issues
4. Package the extension for distribution when ready

## Troubleshooting

If you encounter any issues with the Chrome extensions:

1. Check the browser console for error messages
2. Verify that the WebSocket server is running
3. Check the connection settings in the extension
4. Try reloading the extension or reconnecting to the WebSocket server

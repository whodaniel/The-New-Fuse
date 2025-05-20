# The New Fuse - Qwen Integration

This project enables bidirectional communication between The New Fuse VSCode extension and Qwen chat interface, allowing for seamless integration between your local development environment and AI assistance.

## Components

The integration consists of three main components:
1. **VSCode Extension Enhancements** - Adds relay capabilities to The New Fuse VSCode extension
2. **Relay Server** - Node.js server that facilitates communication between VSCode and web browsers
3. **Chrome Extension** - Injects UI into Qwen chat pages and enables bidirectional communication

## Setup Instructions

### 1. VSCode Extension
The VSCode extension enhancements have been integrated into your existing The New Fuse extension. To use them:

1. Install dependencies:
```bash
cd src/vscode-extension
npm install
npm install socket.io-client langfuse
```

2. Build and compile the extension:
```bash
npm run compile
```

3. (Optional) Package as `.vsix` for installation:
```bash
npm install --save-dev vsce         # if not installed already
npx vsce package                   # generates the VSIX in this directory
```

4. Launch or install the extension:
```bash
# For development:
code --extensionDevelopmentPath="$(pwd)"

# To install the packaged VSIX:
code --install-extension the-new-fuse-0.1.0.vsix  # replace with actual filename
```

5. In VSCode, open the The New Fuse sidebar and look for the "External Communication" panel.

### 2. Relay Server
The relay server acts as a bridge between VSCode and web browsers:

1. Install dependencies:
```bash
cd relay-server
npm install
```

2. Start the server:
```bash
npm start
```

The server will run on http://localhost:3000 by default.

### 3. Chrome Extension
The Chrome extension injects UI into Qwen chat pages:

1. Create icon files:
   - Place 16x16, 48x48, and 128x128 pixel icons in the `chrome-extension/icons` directory

2. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `chrome-extension` directory

3. Configure the extension:
   - Click the extension icon in Chrome's toolbar
   - Set the relay server URL (default: http://localhost:3000)
   - Choose your preferred panel position and communication channels

## Usage

### Sending Text from VSCode to Qwen

1. Select text in VSCode
2. Right-click and select "Send Selection to Web"
3. The text will appear in the Qwen chat input field

### Sending Text from Qwen to VSCode

1. Click the VSCode toggle button in the Qwen chat interface
2. Type your message in the panel
3. Click "Send"
4. The message will be received in VSCode and can be inserted into the editor

### Communication Channels

The integration supports multiple communication channels:

- **WebSocket** - Real-time bidirectional communication (recommended)
- **Redis** - Message queue-based communication (optional)
- **File IPC** - File-based communication as a fallback

## Troubleshooting

If you encounter issues:

1. Check that the relay server is running
2. Verify that VSCode and Chrome are both connected to the relay server
3. Check the browser console and VSCode output panel for error messages
4. Restart the relay server and reload the extensions if necessary

## Development

To modify or extend the integration:

- VSCode Extension: Edit files in `src/vscode-extension/src`
- Relay Server: Edit `relay-server/index.js`
- Chrome Extension: Edit files in the `chrome-extension` directory

## License

This project is part of The New Fuse and is subject to the same licensing terms.

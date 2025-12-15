# The New Fuse - Native Messaging Extension

## Local AI Connector

This Chrome extension enables communication between the browser and local AI
applications through Chrome's Native Messaging API.

## Features

- **Native Messaging** - Secure communication with local applications
- **Text Injection** - Inject AI-generated text into web pages
- **Local AI Integration** - Connect to locally running AI models
- **No Server Required** - Direct browser-to-application communication

## Installation

### 1. Install the Extension

```bash
# Build the extension
npm run build

# Load in Chrome
# 1. Go to chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the `dist` folder
```

### 2. Install the Native Host

#### macOS

```bash
# Run the installation script
npm run install-native-host

# Or manually:
# 1. Copy native host manifest to ~/Library/Application Support/Google/Chrome/NativeMessagingHosts/
# 2. Update the path in the manifest to point to your native host executable
```

#### Windows

```bash
# Register the native host in the Windows registry
# See scripts/install-native-host.js for details
```

#### Linux

```bash
# Copy manifest to ~/.config/google-chrome/NativeMessagingHosts/
```

### Native Host Manifest

Create `com.thenewfuse.local_ai.json`:

```json
{
  "name": "com.thenewfuse.local_ai",
  "description": "The New Fuse Local AI Connector",
  "path": "/path/to/your/native-host",
  "type": "stdio",
  "allowed_origins": ["chrome-extension://YOUR_EXTENSION_ID/"]
}
```

## Architecture

```
chrome-extension-native-messaging/
├── manifest.json       # Extension manifest (v3)
├── background.js       # Service worker - native messaging host
├── content_script.js   # Content script - page interaction
├── popup.html/js       # Extension popup UI
└── images/             # Extension icons
```

## Development

### Scripts

- `npm run build` - Build the extension
- `npm run lint` - Lint JavaScript files
- `npm run format` - Format with Prettier
- `npm run package` - Create distributable ZIP
- `npm run install-native-host` - Install native host (platform-specific)

### Native Messaging Protocol

#### Messages from Extension → Native Host

```javascript
{
  "type": "inject_text",
  "text": "Hello from AI",
  "targetSelector": "#input-field"
}
```

#### Messages from Native Host → Extension

```javascript
{
  "type": "ai_response",
  "content": "Generated text from local AI",
  "model": "local-llama"
}
```

## Integration with The New Fuse

This extension can work alongside the main TNF Chrome Extension:

- Use Native Messaging for local AI models
- Use the main extension for cloud AI (Gemini, ChatGPT, Claude)
- Both can communicate through the TNF relay system

## License

MIT License - The New Fuse Team

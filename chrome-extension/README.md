# The New Fuse - Chrome Extension

A Chrome extension that bridges VS Code and browser functionality for enhanced AI-powered development. This extension works in conjunction with The New Fuse VS Code extension to provide seamless integration between your browser and development environment.

## Features

- Real-time connection with VS Code
- AI-powered code suggestions and analysis
- WebSocket-based communication with compression
- Secure data transmission
- Customizable settings and configurations
- Rate limiting and error handling
- Light/dark theme support
- File transfer between Chrome and VS Code
- Code snippets library
- Multiple AI model integration
- Comprehensive debug tools
- TypeScript for improved type safety and code quality

## Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0
- Chrome/Chromium >= 90

## Installation

1. Clone the repository
2. Navigate to the chrome-extension directory:
   ```bash
   cd chrome-extension
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Generate extension icons:
   ```bash
   npm run generate-icons
   ```
5. Build the extension:
   ```bash
   npm run build
   ```

## Development

### Local Setup

1. Enable Chrome Developer Mode in chrome://extensions/
2. Click "Load unpacked" and select the `dist` directory
3. Start development server:
   ```bash
   npm run dev
   ```

### Development Scripts

- `npm run dev` - Watch mode for development
- `npm run build` - Production build
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run generate-icons` - Generate extension icons
- `npm run package` - Create distribution package
- `npm run typecheck` - Type check TypeScript files
- `npm run build:ts` - Build TypeScript files
- `npm run dev:ts` - Watch mode for TypeScript development
- `./build.sh` - Build script for TypeScript
- `./dev.sh` - Development script for TypeScript

### Project Structure

```text
chrome-extension/
├── src/
│   ├── popup/         # Popup UI components (TypeScript)
│   ├── background/    # Background script components (TypeScript)
│   ├── content/       # Content script components (TypeScript)
│   ├── utils/         # Utility functions (TypeScript)
│   │   ├── websocket-manager.ts  # WebSocket connection manager
│   │   ├── file-transfer.ts      # File transfer utility
│   │   ├── code-snippets.ts      # Code snippets manager
│   │   ├── ai-models.ts          # AI models integration
│   │   ├── logger.ts             # Logging utility
│   │   ├── compression.ts        # Compression utilities
│   │   └── security.ts           # Security utilities
│   └── debug/         # Debug tools components (TypeScript)
├── popup.html         # Popup UI HTML
├── popup.css          # Popup UI styles
├── dark-theme.css     # Dark theme styles
├── options.html       # Options page HTML
├── debug-tools.html   # Debug tools HTML
├── content.css        # Content script styles
├── scripts/           # Build and utility scripts
├── dist/              # Compiled extension
├── icons/             # Extension icons
├── releases/          # Packaged releases
├── tsconfig.json      # TypeScript configuration
└── webpack.config.js  # Webpack configuration
```

## Configuration

### WebSocket Connection

The extension connects to the VS Code extension via WebSocket. Default configuration:

```json
{
  "wsProtocol": "ws",
  "wsHost": "localhost",
  "wsPort": 3712
}
```

You can modify these settings in the extension options page.

### Security Settings

- SSL certificate validation (recommended)
- Token-based authentication
- Rate limiting configuration
- WebSocket compression

## Building for Production

1. Update version number:
   ```bash
   npm version patch|minor|major
   ```

2. Build and package:
   ```bash
   npm run package
   ```

The packaged extension will be available in the `releases` directory.

## Debug Tools

The extension includes a comprehensive set of debug tools to help diagnose and troubleshoot issues:

1. **WebSocket Tester**: Test WebSocket connections with custom messages
   - Connect to any WebSocket server
   - Send custom JSON messages
   - View received messages in real-time
   - Monitor connection status

2. **Logs Viewer**: View and filter extension logs
   - Filter by log level (debug, info, warn, error)
   - Search logs by content
   - Export logs for sharing
   - Clear logs when needed

3. **Debug Settings**: Configure debug behavior
   - Enable/disable debug mode
   - Configure verbose logging
   - Set maximum log size
   - Control log storage behavior

To access the debug tools, click the "Debug Tools" button in the Tools tab of the extension popup.

## Troubleshooting

### Common Issues

1. WebSocket Connection Failed
   - Ensure VS Code extension is running
   - Check port configuration (default is now 3712)
   - Use the WebSocket Tester in Debug Tools to test the connection
   - Verify firewall settings

2. Authentication Issues
   - Clear extension storage
   - Re-authenticate with VS Code
   - Check token expiration
   - Use Debug Tools to view authentication logs

3. Performance Issues
   - Enable compression in settings
   - Check rate limiting configuration
   - Monitor logs in Debug Tools
   - Check for high message volume

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Create a pull request

Please ensure:

- Tests pass (`npm test`)
- Code is linted (`npm run lint`)
- Documentation is updated

## Testing

Run unit tests:

```bash
npm test
```

Run integration tests:

```bash
npm run test:integration
```

## Security

Report security issues to [security@thenewfuse.com](mailto:security@thenewfuse.com)

## License

MIT License - see LICENSE file for details

## Related Projects

- [The New Fuse VS Code Extension](https://marketplace.visualstudio.com/items?itemName=thenewfuse.vscode)
- [The New Fuse Core](https://github.com/thenewfuse/core)

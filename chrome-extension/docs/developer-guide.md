# The New Fuse Chrome Extension - Developer Guide

## Introduction

This guide is intended for developers who want to contribute to The New Fuse Chrome Extension or understand its architecture for customization. The extension is built with TypeScript and follows modern web development practices.

## Project Structure

```text
chrome-extension/
├── src/                  # TypeScript source files
│   ├── popup/            # Popup UI components (TypeScript)
│   ├── background/       # Background script components (TypeScript)
│   ├── content/          # Content script components (TypeScript)
│   ├── utils/            # Utility functions (TypeScript)
│   │   ├── websocket-manager.ts  # WebSocket connection manager
│   │   ├── file-transfer.ts      # File transfer utility
│   │   ├── code-snippets.ts      # Code snippets manager
│   │   ├── ai-models.ts          # AI models integration
│   │   ├── logger.ts             # Logging utility
│   │   ├── compression.ts        # Compression utilities
│   │   └── security.ts           # Security utilities
│   ├── debug/            # Debug tools components (TypeScript)
│   └── __tests__/        # Test files
├── popup.html            # Popup UI HTML
├── popup.css             # Popup UI styles
├── dark-theme.css        # Dark theme styles
├── options.html          # Options page HTML
├── debug-tools.html      # Debug tools HTML
├── content.css           # Content script styles
├── scripts/              # Build and utility scripts
├── dist/                 # Compiled extension
├── icons/                # Extension icons
├── docs/                 # Documentation
├── tsconfig.json         # TypeScript configuration
├── webpack.config.js     # Webpack configuration
├── jest.config.js        # Jest configuration
└── package.json          # Package configuration
```

## Development Setup

### Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0
- Chrome/Chromium >= 90

### Installation

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

### Development Scripts

- `npm run dev` - Watch mode for development
- `npm run build` - Production build
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Lint code
- `npm run clean` - Clean build artifacts
- `npm run typecheck` - Type check TypeScript files
- `npm run build:ts` - Build TypeScript files
- `npm run dev:ts` - Watch mode for TypeScript development

### Local Development

1. Enable Chrome Developer Mode in chrome://extensions/
2. Click "Load unpacked" and select the `dist` directory
3. Start development server:
   ```bash
   npm run dev
   ```

## Architecture

The extension follows a modular architecture with clear separation of concerns:

### Core Components

1. **WebSocketManager** (`src/utils/websocket-manager.ts`)
   - Handles WebSocket connections to VS Code
   - Manages reconnection logic and message queuing
   - Provides event-based API for other components

2. **FileTransferManager** (`src/utils/file-transfer.ts`)
   - Manages file transfers between browser and VS Code
   - Handles chunking for large files
   - Provides progress tracking and error handling

3. **CodeSnippetsManager** (`src/utils/code-snippets.ts`)
   - Manages code snippets storage and retrieval
   - Provides search and filtering capabilities
   - Handles import/export functionality

4. **AIModelsManager** (`src/utils/ai-models.ts`)
   - Integrates with multiple AI models
   - Manages AI queries and responses
   - Handles streaming responses and cancellation

5. **Logger** (`src/utils/logger.ts`)
   - Provides logging functionality with different levels
   - Supports storage and export of logs
   - Configurable verbosity

### UI Components

1. **ThemeManager** (`src/popup/theme-manager.ts`)
   - Manages theme switching between light and dark modes
   - Persists theme preference
   - Handles system theme detection

2. **ConnectionStatusManager** (`src/popup/connection-status.ts`)
   - Displays and manages connection status
   - Provides visual feedback for connection state
   - Handles reconnection UI

3. **TabManager** (`src/popup/tab-manager.ts`)
   - Manages tab switching in the popup
   - Handles tab state and persistence
   - Provides tab navigation API

4. **ChatManager** (`src/popup/chat-manager.ts`)
   - Manages chat UI and interactions
   - Handles message sending and receiving
   - Provides chat history functionality

5. **AccessibilityManager** (`src/popup/accessibility.ts`)
   - Manages accessibility features
   - Handles keyboard navigation
   - Provides high contrast, large text, and reduced motion modes

### Background and Content Scripts

1. **Background Script** (`src/background/index.ts`)
   - Runs in the background
   - Manages WebSocket connection
   - Handles messages between popup and content scripts

2. **Content Script** (`src/content/index.ts`)
   - Runs in the context of web pages
   - Interacts with page content
   - Handles code extraction and insertion

## TypeScript Integration

The project uses TypeScript for type safety and better developer experience:

### Type Definitions

1. **WebSocket Types** (`src/utils/websocket-manager.ts`)
   - `WebSocketMessage`: Interface for WebSocket messages
   - `WebSocketOptions`: Interface for WebSocket connection options
   - `WebSocketState`: Type for WebSocket connection states

2. **File Transfer Types** (`src/utils/file-transfer.ts`)
   - `FileTransferOptions`: Interface for file transfer options
   - `FileChunk`: Interface for file chunks
   - `FileTransfer`: Interface for file transfer metadata

3. **Code Snippet Types** (`src/utils/code-snippets.ts`)
   - `CodeSnippet`: Interface for code snippets
   - `CodeSnippetFilter`: Interface for filtering options

4. **AI Model Types** (`src/utils/ai-models.ts`)
   - `AIModel`: Interface for AI model metadata
   - `AIQueryOptions`: Interface for AI query options
   - `AIResponse`: Interface for AI responses

### Type Safety

- All function parameters and return values are typed
- Interfaces are used for complex objects
- Generics are used where appropriate
- Strict null checks are enabled
- Type assertions are minimized

## Testing

The project uses Jest for testing:

### Test Structure

- Tests are located in `src/__tests__/`
- Each module has its own test file
- Tests follow the pattern `*.test.ts`

### Running Tests

```bash
npm test
```

For watch mode:

```bash
npm run test:watch
```

For coverage report:

```bash
npm run test:coverage
```

### Test Examples

1. **WebSocketManager Tests** (`src/__tests__/utils/websocket-manager.test.ts`)
   - Tests connection, disconnection, and reconnection
   - Tests message sending and receiving
   - Tests error handling

2. **FileTransferManager Tests** (`src/__tests__/utils/file-transfer.test.ts`)
   - Tests file upload and download
   - Tests chunking and reassembly
   - Tests progress tracking

3. **CodeSnippetsManager Tests** (`src/__tests__/utils/code-snippets.test.ts`)
   - Tests snippet creation, update, and deletion
   - Tests search and filtering
   - Tests import and export

4. **AIModelsManager Tests** (`src/__tests__/utils/ai-models.test.ts`)
   - Tests model listing and selection
   - Tests query sending and response handling
   - Tests streaming responses

## UI Customization

### Themes

The extension supports light and dark themes:

1. **Light Theme** (default)
   - Defined in `:root` CSS variables

2. **Dark Theme**
   - Defined in `.dark-theme` CSS class
   - Applied by adding the class to the document element

### Accessibility

The extension includes several accessibility features:

1. **High Contrast Mode**
   - Applied with `.high-contrast` CSS class
   - Increases contrast for better visibility

2. **Large Text Mode**
   - Applied with `.large-text` CSS class
   - Increases font sizes throughout the UI

3. **Reduced Motion**
   - Applied with `.reduced-motion` CSS class
   - Disables or reduces animations

4. **Keyboard Navigation**
   - Applied with `.keyboard-navigation` CSS class
   - Enhances focus indicators
   - Adds keyboard shortcuts

5. **Screen Reader Optimization**
   - Applied with `.screen-reader` CSS class
   - Adds ARIA attributes
   - Improves screen reader compatibility

## WebSocket Protocol

The extension communicates with VS Code using a custom WebSocket protocol:

### Message Format

```typescript
interface WebSocketMessage {
  type: string;
  [key: string]: any;
}
```

### Common Message Types

1. **Connection Messages**
   - `CONNECT`: Request connection
   - `CONNECTED`: Connection established
   - `DISCONNECT`: Request disconnection
   - `DISCONNECTED`: Connection closed

2. **File Transfer Messages**
   - `FILE_TRANSFER_START`: Start file transfer
   - `FILE_CHUNK`: Send file chunk
   - `FILE_CHUNK_ACK`: Acknowledge file chunk
   - `FILE_TRANSFER_COMPLETE`: File transfer completed
   - `FILE_TRANSFER_ERROR`: File transfer error
   - `FILE_TRANSFER_CANCEL`: Cancel file transfer

3. **Code Snippet Messages**
   - `CODE_SNIPPET_SAVE`: Save code snippet
   - `CODE_SNIPPET_GET`: Get code snippet
   - `CODE_SNIPPET_DELETE`: Delete code snippet
   - `CODE_SNIPPET_LIST`: List code snippets

4. **AI Messages**
   - `AI_QUERY`: Send AI query
   - `AI_RESPONSE`: Receive AI response
   - `AI_QUERY_CANCEL`: Cancel AI query
   - `AI_ERROR`: AI error

## Contributing

### Code Style

- Follow the TypeScript style guide
- Use ESLint for linting
- Use Prettier for formatting
- Write JSDoc comments for public APIs

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for your changes
5. Run the test suite
6. Submit a pull request

### Commit Message Format

Follow the conventional commits format:

```
type(scope): subject

body

footer
```

Types:
- feat: A new feature
- fix: A bug fix
- docs: Documentation changes
- style: Code style changes (formatting, etc.)
- refactor: Code changes that neither fix bugs nor add features
- perf: Performance improvements
- test: Adding or updating tests
- chore: Changes to the build process or tools

## Deployment

### Building for Production

```bash
npm run build
```

### Packaging

```bash
npm run package
```

This will create a ZIP file in the `releases` directory.

### Chrome Web Store

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
2. Click "Add new item"
3. Upload the ZIP file
4. Fill in the required information
5. Submit for review

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failures**
   - Check that VS Code is running
   - Verify the WebSocket port is correct
   - Check for firewall blocking

2. **Build Errors**
   - Clear the `dist` directory
   - Delete `node_modules` and reinstall
   - Check TypeScript version compatibility

3. **Test Failures**
   - Check for environment-specific issues
   - Verify mocks are properly set up
   - Check for async timing issues

### Debugging

1. **Extension Debugging**
   - Use the Chrome DevTools for the extension popup
   - Check the background page console
   - Use the Debug Tools page

2. **WebSocket Debugging**
   - Enable debug mode in settings
   - Check the logs for WebSocket traffic
   - Use the WebSocket tester in Debug Tools

## Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Webpack Documentation](https://webpack.js.org/concepts/)

---

Thank you for contributing to The New Fuse Chrome Extension! Your efforts help make this tool better for everyone.

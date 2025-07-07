# The New Fuse Chrome Extension - API Reference

## Introduction

This document provides a comprehensive reference for the APIs available in The New Fuse Chrome Extension. It covers the core utilities, managers, and interfaces that developers can use to extend or customize the extension.

## Core Utilities

### WebSocketManager

The `WebSocketManager` class handles WebSocket connections to VS Code.

```typescript
import { WebSocketManager } from '../utils/websocket-manager';

// Create a new WebSocketManager
const wsManager = new WebSocketManager('ws://localhost:3712', {
  debug: true,
  reconnectAttempts: 5,
  reconnectDelay: 1000,
  useCompression: true
});

// Connect to the WebSocket server
await wsManager.connect();

// Send a message
wsManager.send({
  type: 'HELLO',
  message: 'Hello, VS Code!'
});

// Add event listeners
wsManager.addEventListener('message', (message) => {
  console.log('Received message:', message);
});

// Disconnect
wsManager.disconnect();
```

#### Constructor

```typescript
constructor(url: string, options?: WebSocketOptions)
```

- `url`: WebSocket server URL
- `options`: Connection options
  - `debug`: Enable debug logging
  - `reconnectAttempts`: Number of reconnection attempts
  - `reconnectDelay`: Delay between reconnection attempts in milliseconds
  - `useCompression`: Enable WebSocket compression

#### Methods

- `connect(): Promise<boolean>`: Connect to the WebSocket server
- `disconnect(): void`: Disconnect from the WebSocket server
- `send(message: any): boolean`: Send a message to the server
- `isConnected(): boolean`: Check if connected to the server
- `getState(): WebSocketState`: Get the current connection state
- `addEventListener(event: string, callback: Function, options?: EventListenerOptions): void`: Add an event listener
- `removeEventListener(event: string, callback: Function): void`: Remove an event listener

#### Events

- `open`: Fired when the connection is established
- `close`: Fired when the connection is closed
- `error`: Fired when an error occurs
- `message`: Fired when a message is received
- `reconnect`: Fired when a reconnection attempt is made
- `reconnect_success`: Fired when a reconnection is successful
- `reconnect_failure`: Fired when all reconnection attempts fail

### FileTransferManager

The `FileTransferManager` class handles file transfers between browser and VS Code.

```typescript
import { FileTransferManager } from '../utils/file-transfer';
import { WebSocketManager } from '../utils/websocket-manager';

// Create a WebSocketManager
const wsManager = new WebSocketManager('ws://localhost:3712');

// Create a FileTransferManager
const fileTransferManager = new FileTransferManager(wsManager, {
  chunkSize: 1024 * 64, // 64KB chunks
  maxRetries: 3,
  retryDelay: 1000
});

// Upload a file
const file = new File(['file content'], 'example.txt', { type: 'text/plain' });
const fileId = fileTransferManager.uploadFile(file, {
  onProgress: (progress) => {
    console.log(`Upload progress: ${progress}%`);
  },
  onComplete: () => {
    console.log('Upload complete');
  },
  onError: (error) => {
    console.error('Upload error:', error);
  }
});

// Cancel a transfer
fileTransferManager.cancelTransfer(fileId);

// Get active transfers
const activeTransfers = fileTransferManager.getActiveTransfers();
```

#### Constructor

```typescript
constructor(wsManager: WebSocketManager, options?: FileTransferOptions)
```

- `wsManager`: WebSocket manager instance
- `options`: File transfer options
  - `chunkSize`: Size of file chunks in bytes
  - `maxRetries`: Maximum number of retry attempts for failed chunks
  - `retryDelay`: Delay between retry attempts in milliseconds

#### Methods

- `uploadFile(file: File, callbacks?: FileTransferCallbacks): string`: Upload a file to VS Code
- `downloadFile(fileId: string, fileName: string, fileSize: number, callbacks?: FileTransferCallbacks): void`: Download a file from VS Code
- `cancelTransfer(fileId: string): boolean`: Cancel a file transfer
- `getActiveTransfers(): FileTransfer[]`: Get all active transfers
- `getTransfer(fileId: string): FileTransfer | null`: Get a specific transfer

### CodeSnippetsManager

The `CodeSnippetsManager` class manages code snippets.

```typescript
import { CodeSnippetsManager } from '../utils/code-snippets';

// Create a CodeSnippetsManager
const codeSnippetsManager = new CodeSnippetsManager();

// Add a snippet
const snippetId = codeSnippetsManager.addSnippet({
  name: 'Hello World',
  language: 'javascript',
  code: 'console.log("Hello, world!");',
  description: 'A simple hello world example',
  tags: ['example', 'javascript']
});

// Get a snippet
const snippet = codeSnippetsManager.getSnippet(snippetId);

// Update a snippet
codeSnippetsManager.updateSnippet(snippetId, {
  name: 'Updated Hello World'
});

// Delete a snippet
codeSnippetsManager.deleteSnippet(snippetId);

// Search snippets
const results = codeSnippetsManager.searchSnippets('hello');

// Filter by language
const jsSnippets = codeSnippetsManager.filterByLanguage('javascript');

// Filter by tag
const exampleSnippets = codeSnippetsManager.filterByTag('example');

// Export snippets
const exportData = codeSnippetsManager.exportSnippets();

// Import snippets
codeSnippetsManager.importSnippets(exportData);
```

#### Constructor

```typescript
constructor()
```

#### Methods

- `addSnippet(snippet: Partial<CodeSnippet>): string`: Add a new snippet
- `getSnippet(id: string): CodeSnippet | null`: Get a snippet by ID
- `updateSnippet(id: string, updates: Partial<CodeSnippet>): boolean`: Update a snippet
- `deleteSnippet(id: string): boolean`: Delete a snippet
- `getAllSnippets(): CodeSnippet[]`: Get all snippets
- `searchSnippets(query: string): CodeSnippet[]`: Search snippets by query
- `filterByLanguage(language: string): CodeSnippet[]`: Filter snippets by language
- `filterByTag(tag: string): CodeSnippet[]`: Filter snippets by tag
- `exportSnippets(): string`: Export snippets as JSON
- `importSnippets(data: any): number`: Import snippets from JSON
- `clearSnippets(): void`: Clear all snippets

### AIModelsManager

The `AIModelsManager` class integrates with AI models.

```typescript
import { AIModelsManager } from '../utils/ai-models';
import { WebSocketManager } from '../utils/websocket-manager';

// Create a WebSocketManager
const wsManager = new WebSocketManager('ws://localhost:3712');

// Create an AIModelsManager
const aiModelsManager = new AIModelsManager(wsManager);

// Get available models
const models = aiModelsManager.getAvailableModels();

// Set default model
aiModelsManager.setDefaultModel('gpt-4');

// Send a query
const response = await aiModelsManager.query('What is TypeScript?', {
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 500,
  onPartialResponse: (text) => {
    console.log('Partial response:', text);
  }
});

// Cancel a query
aiModelsManager.cancelQuery(queryId);
```

#### Constructor

```typescript
constructor(wsManager: WebSocketManager)
```

- `wsManager`: WebSocket manager instance

#### Methods

- `getAllModels(): AIModel[]`: Get all AI models
- `getAvailableModels(): AIModel[]`: Get available AI models
- `getModel(id: string): AIModel | null`: Get a model by ID
- `getDefaultModel(): string`: Get the default model ID
- `setDefaultModel(id: string): boolean`: Set the default model
- `query(query: string, options?: AIQueryOptions): Promise<string>`: Send a query to an AI model
- `cancelQuery(queryId: string): boolean`: Cancel a query

### Logger

The `Logger` class provides logging functionality.

```typescript
import { Logger } from '../utils/logger';

// Create a logger
const logger = new Logger({
  name: 'MyComponent',
  level: 'info',
  saveToStorage: true
});

// Log messages
logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');

// Log with additional data
logger.info('User action', { userId: 123, action: 'click' });

// Export logs
const logs = logger.exportLogs();
```

#### Constructor

```typescript
constructor(options?: LoggerOptions)
```

- `options`: Logger options
  - `name`: Logger name
  - `level`: Minimum log level
  - `saveToStorage`: Save logs to storage
  - `maxLogSize`: Maximum number of log entries

#### Methods

- `debug(message: string, ...data: any[]): void`: Log a debug message
- `info(message: string, ...data: any[]): void`: Log an info message
- `warn(message: string, ...data: any[]): void`: Log a warning message
- `error(message: string, ...data: any[]): void`: Log an error message
- `setLevel(level: LogLevel): void`: Set the minimum log level
- `clearLogs(): void`: Clear all logs
- `exportLogs(): string`: Export logs as JSON

## UI Components

### ThemeManager

The `ThemeManager` class manages theme switching.

```typescript
import { ThemeManager } from '../popup/theme-manager';

// Create a ThemeManager
const themeManager = new ThemeManager();

// Get current theme
const theme = themeManager.getTheme();

// Set theme
themeManager.setTheme('dark');

// Toggle theme
themeManager.toggleTheme();

// Add theme change listener
themeManager.addThemeChangeListener((theme) => {
  console.log('Theme changed to:', theme);
});
```

#### Constructor

```typescript
constructor()
```

#### Methods

- `getTheme(): 'light' | 'dark'`: Get the current theme
- `setTheme(theme: 'light' | 'dark'): void`: Set the theme
- `toggleTheme(): void`: Toggle between light and dark themes
- `addThemeChangeListener(listener: (theme: 'light' | 'dark') => void): void`: Add a theme change listener
- `removeThemeChangeListener(listener: (theme: 'light' | 'dark') => void): void`: Remove a theme change listener

### ConnectionStatusManager

The `ConnectionStatusManager` class manages connection status display.

```typescript
import { ConnectionStatusManager } from '../popup/connection-status';

// Create a ConnectionStatusManager
const connectionManager = new ConnectionStatusManager();

// Update connection status
connectionManager.updateStatus('connected');

// Add status change listener
connectionManager.addStatusChangeListener((status) => {
  console.log('Connection status changed to:', status);
});
```

#### Constructor

```typescript
constructor()
```

#### Methods

- `updateStatus(status: ConnectionStatus): void`: Update the connection status
- `getStatus(): ConnectionStatus`: Get the current connection status
- `addStatusChangeListener(listener: (status: ConnectionStatus) => void): void`: Add a status change listener
- `removeStatusChangeListener(listener: (status: ConnectionStatus) => void): void`: Remove a status change listener

### TabManager

The `TabManager` class manages tab switching.

```typescript
import { TabManager } from '../popup/tab-manager';

// Create a TabManager
const tabManager = new TabManager();

// Initialize tabs
tabManager.initialize();

// Switch to a tab
tabManager.switchTab('tools');

// Add tab change listener
tabManager.addTabChangeListener((tabId) => {
  console.log('Tab changed to:', tabId);
});
```

#### Constructor

```typescript
constructor()
```

#### Methods

- `initialize(): void`: Initialize tabs
- `switchTab(tabId: string): void`: Switch to a tab
- `getCurrentTab(): string`: Get the current tab ID
- `addTabChangeListener(listener: (tabId: string) => void): void`: Add a tab change listener
- `removeTabChangeListener(listener: (tabId: string) => void): void`: Remove a tab change listener

### ChatManager

The `ChatManager` class manages chat functionality.

```typescript
import { ChatManager } from '../popup/chat-manager';
import { ConnectionStatusManager } from '../popup/connection-status';

// Create a ConnectionStatusManager
const connectionManager = new ConnectionStatusManager();

// Create a ChatManager
const chatManager = new ChatManager(connectionManager);

// Initialize chat
chatManager.initialize();

// Send a message
chatManager.sendMessage('Hello, VS Code!');

// Clear chat
chatManager.clearChat();
```

#### Constructor

```typescript
constructor(connectionManager: ConnectionStatusManager)
```

- `connectionManager`: Connection status manager instance

#### Methods

- `initialize(): void`: Initialize chat
- `sendMessage(message: string): void`: Send a message
- `addMessage(message: ChatMessage): void`: Add a message to the chat
- `clearChat(): void`: Clear the chat history
- `loadChatHistory(): void`: Load chat history from storage
- `saveChatHistory(): void`: Save chat history to storage

### AccessibilityManager

The `AccessibilityManager` class manages accessibility features.

```typescript
import { AccessibilityManager } from '../popup/accessibility';

// Create an AccessibilityManager
const accessibilityManager = new AccessibilityManager();

// Get current settings
const settings = accessibilityManager.getSettings();

// Update settings
accessibilityManager.updateSettings({
  highContrast: true,
  largeText: true
});

// Set up keyboard navigation
accessibilityManager.setupKeyboardNavigation();

// Add ARIA attributes
accessibilityManager.addAriaAttributes();
```

#### Constructor

```typescript
constructor()
```

#### Methods

- `getSettings(): AccessibilitySettings`: Get current accessibility settings
- `updateSettings(settings: Partial<AccessibilitySettings>): void`: Update accessibility settings
- `setupKeyboardNavigation(): void`: Set up keyboard navigation
- `addAriaAttributes(): void`: Add ARIA attributes to elements
- `addChangeListener(listener: Function): void`: Add a change listener
- `removeChangeListener(listener: Function): void`: Remove a change listener

## Interfaces

### WebSocketOptions

```typescript
interface WebSocketOptions {
  debug?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  useCompression?: boolean;
}
```

### FileTransferOptions

```typescript
interface FileTransferOptions {
  chunkSize?: number;
  maxRetries?: number;
  retryDelay?: number;
}
```

### FileTransferCallbacks

```typescript
interface FileTransferCallbacks {
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}
```

### CodeSnippet

```typescript
interface CodeSnippet {
  id: string;
  name: string;
  language: string;
  code: string;
  description?: string;
  tags?: string[];
  created: number;
  modified: number;
}
```

### AIModel

```typescript
interface AIModel {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
  available: boolean;
}
```

### AIQueryOptions

```typescript
interface AIQueryOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  onPartialResponse?: (text: string) => void;
}
```

### LoggerOptions

```typescript
interface LoggerOptions {
  name?: string;
  level?: LogLevel;
  saveToStorage?: boolean;
  maxLogSize?: number;
}
```

### AccessibilitySettings

```typescript
interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  keyboardNavigation: boolean;
  screenReader: boolean;
}
```

## Message Types

### WebSocket Messages

```typescript
// Connection messages
interface ConnectMessage {
  type: 'CONNECT';
  clientId?: string;
  timestamp: number;
}

interface ConnectedMessage {
  type: 'CONNECTED';
  clientId: string;
  timestamp: number;
}

// File transfer messages
interface FileTransferStartMessage {
  type: 'FILE_TRANSFER_START';
  fileId: string;
  fileName: string;
  fileSize: number;
  totalChunks: number;
  timestamp: number;
}

interface FileChunkMessage {
  type: 'FILE_CHUNK';
  fileId: string;
  chunkIndex: number;
  chunk: string; // Base64 encoded
  timestamp: number;
}

// Code snippet messages
interface CodeSnippetSaveMessage {
  type: 'CODE_SNIPPET_SAVE';
  snippet: CodeSnippet;
  timestamp: number;
}

interface CodeSnippetGetMessage {
  type: 'CODE_SNIPPET_GET';
  id: string;
  timestamp: number;
}

// AI messages
interface AIQueryMessage {
  type: 'AI_QUERY';
  queryId: string;
  query: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  timestamp: number;
}

interface AIResponseMessage {
  type: 'AI_RESPONSE';
  queryId: string;
  result: string;
  isPartial: boolean;
  timestamp: number;
}
```

## Chrome API Integration

### Background Script

```typescript
// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'CONNECT':
      // Handle connection request
      break;
    case 'SEND_MESSAGE':
      // Handle message sending
      break;
    // ...
  }
  return true; // Keep the message channel open for async responses
});

// Send messages to popup or content scripts
chrome.runtime.sendMessage({
  type: 'CONNECTION_STATUS',
  status: 'connected'
});

// Send messages to content scripts
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]?.id) {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: 'INSERT_CODE',
      code: 'console.log("Hello, world!");'
    });
  }
});
```

### Content Script

```typescript
// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'INSERT_CODE':
      // Handle code insertion
      break;
    case 'EXTRACT_CONTENT':
      // Handle content extraction
      break;
    // ...
  }
  return true; // Keep the message channel open for async responses
});

// Send messages to background script
chrome.runtime.sendMessage({
  type: 'CODE_EXTRACTED',
  code: 'function example() { return true; }'
});
```

### Storage

```typescript
// Save data to storage
chrome.storage.local.set({ key: 'value' }, () => {
  console.log('Data saved');
});

// Load data from storage
chrome.storage.local.get(['key'], (result) => {
  console.log('Data loaded:', result.key);
});

// Remove data from storage
chrome.storage.local.remove(['key'], () => {
  console.log('Data removed');
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.key) {
    console.log('Data changed:', changes.key.newValue);
  }
});
```

## Error Handling

```typescript
try {
  // Risky operation
} catch (error) {
  // Log the error
  logger.error('Operation failed', error);
  
  // Show error to user
  showError('Operation failed: ' + (error as Error).message);
  
  // Report error to background script
  chrome.runtime.sendMessage({
    type: 'ERROR',
    error: (error as Error).message,
    stack: (error as Error).stack
  });
}
```

## Event Handling

```typescript
// Add event listener
element.addEventListener('click', handleClick);

// Remove event listener
element.removeEventListener('click', handleClick);

// Custom event handling
const eventTarget = new EventTarget();
eventTarget.addEventListener('custom-event', (event) => {
  console.log('Custom event:', event);
});
eventTarget.dispatchEvent(new CustomEvent('custom-event', { detail: { data: 'value' } }));
```

## Debugging

```typescript
// Enable debug mode
const debug = true;

// Debug logging
if (debug) {
  console.log('Debug info:', data);
}

// Performance measurement
console.time('operation');
// Perform operation
console.timeEnd('operation');

// Inspect objects
console.dir(object);

// Group logs
console.group('Operation');
console.log('Step 1');
console.log('Step 2');
console.groupEnd();
```

---

This API reference is intended to help developers understand and use the APIs available in The New Fuse Chrome Extension. For more detailed information, refer to the source code and developer guide.

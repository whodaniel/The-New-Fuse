/**
 * Type definitions for The New Fuse Chrome extension
 */

/**
 * WebSocket connection settings
 */
interface WebSocketSettings {
  wsProtocol: string;
  wsHost: string;
  wsPort: number;
  useCompression: boolean;
}

/**
 * Extension settings
 */
interface ExtensionSettings extends WebSocketSettings {
  autoConnect: boolean;
  showNotifications: boolean;
  saveChatHistory: boolean;
  debugMode: boolean;
  autoDetectCode: boolean;
  relayUrl?: string;
  maxRetryAttempts?: number;
  retryDelay?: number;
}

/**
 * Debug settings
 */
interface DebugSettings {
  debugMode: boolean;
  verboseLogging: boolean;
  logToConsole: boolean;
  logToStorage: boolean;
  maxLogSize: number;
}

/**
 * Connection state
 */
interface ConnectionState {
  vscode: boolean;
  relay: boolean;
  auth?: string;
}

/**
 * WebSocket message
 */
interface WebSocketMessage {
  type: string;
  timestamp: number;
  [key: string]: any;
}

/**
 * Chat message
 */
interface ChatMessage {
  type: string;
  content: string;
  timestamp: string;
  sender: string;
}

/**
 * Code message
 */
interface CodeMessage {
  type: string;
  code: string;
  language?: string;
  timestamp: string;
  source?: string;
}

/**
 * AI query message
 */
interface AIQueryMessage {
  type: string;
  query: string;
  timestamp: number;
  source?: string;
}

/**
 * AI response message
 */
interface AIResponseMessage {
  type: string;
  result: string;
  timestamp: number;
  source?: string;
}

/**
 * Status message
 */
interface StatusMessage {
  type: string;
  status: {
    server: string;
    clients: number;
    uptime: number;
    memory: any;
  };
  timestamp: number;
}

/**
 * Error message
 */
interface ErrorMessage {
  type: string;
  message: string;
  timestamp: number;
}

/**
 * WebSocket manager options
 */
interface WebSocketManagerOptions {
  useCompression?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
  connectionTimeout?: number;
  debug?: boolean;
}

/**
 * Logger options
 */
interface LoggerOptions {
  name?: string;
  level?: string;
  saveToStorage?: boolean;
  maxStoredLogs?: number;
}

/**
 * Log entry
 */
interface LogEntry {
  timestamp: string;
  level: string;
  name: string;
  message: string | object;
  data?: any;
}

/**
 * WebSocket event listener
 */
interface WebSocketEventListener {
  callback: Function;
  once: boolean;
}

/**
 * WebSocket event listeners
 */
interface WebSocketEventListeners {
  [event: string]: WebSocketEventListener[];
}

/**
 * Rate limiter options
 */
interface RateLimiterOptions {
  maxRequests: number;
  interval: number;
}

/**
 * Compression utilities
 */
interface CompressionUtils {
  compressMessage(message: string): string | ArrayBuffer | null;
  decompressMessage(data: string | ArrayBuffer | Uint8Array): string | object;
}

/**
 * WebSocket tester
 */
interface WebSocketTester {
  connect(url: string): Promise<boolean>;
  disconnect(): void;
  send(message: any): boolean;
  logMessage(type: string, message: any): void;
  updateUI(): void;
  updateMessageLog(): void;
  clearLog(): void;
}

/**
 * Global declarations
 */
declare global {
  interface Window {
    Logger: any;
    logger: any;
    WebSocketManager: any;
    WebSocketTester: any;
    webSocketTester: any;
  }
}

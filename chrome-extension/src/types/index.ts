// Common types
export interface LogEntry {
    timestamp: number;
    level: 'info' | 'warn' | 'error';
    message: string;
    details?: any;
    name?: string;
    data?: any;
}

export interface DebugSettings {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    enableVerboseLogging: boolean;
    saveLogsToFile: boolean;
    debugMode: boolean;
    verboseLogging: boolean;
    logToConsole: boolean;
    logToStorage: boolean;
    maxLogSize: number;
}

export interface WebSocketServerStatus {
    isRunning: boolean;
    port: number;
    connectedClients: number;
    error?: string;
    message?: string;
    uptime?: number;
}

export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    env?: 'development' | 'production' | 'custom';
    username?: string;
    tls?: boolean;
}

export type WebSocketEventType = 
    | 'connect'
    | 'disconnect'
    | 'message'
    | 'error';

export interface WebSocketEventListener {
    (event: any): void;
}

export interface WebSocketEventListenerOptions {
    once?: boolean;
    reconnectDelay?: number;
}

// File Transfer Types
export interface FileTransferMessage {
    type: string;
    fileId: string;
    error?: string;
}

export interface FileTransferManager {
    getActiveTransfers(): Map<string, any>;
}

// Add any additional types needed by the application

// Enhanced AI and Chat Integration Types

export interface AIDetectionResult {
  element: Element;
  confidence: number;
  type: 'chat-input' | 'chat-output' | 'send-button' | 'message-container';
  platform: ChatPlatform;
  selector: string;
  xpath: string;
  metadata: {
    isVisible: boolean;
    isInteractable: boolean;
    hasPlaceholder?: string;
    textContent?: string;
    attributes: Record<string, string>;
  };
}

export type ChatPlatform = 'chatgpt' | 'claude' | 'gemini' | 'discord' | 'slack' | 'unknown';

export interface PlatformConfig {
  name: ChatPlatform;
  domain: string;
  selectors: {
    chatInput: string[];
    chatOutput: string[];
    sendButton: string[];
    messageContainer: string[];
  };
  features: {
    supportsMarkdown: boolean;
    supportsFiles: boolean;
    supportsVoice: boolean;
    hasThreads: boolean;
  };
}

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  sender: 'user' | 'ai' | 'system';
  platform: ChatPlatform;
  metadata: {
    confidence?: number;
    tokens?: number;
    model?: string;
    threadId?: string;
  };
}

export interface ChatSession {
  id: string;
  platform: ChatPlatform;
  startTime: Date;
  lastActivity: Date;
  messageCount: number;
  messages: ChatMessage[];
  isActive: boolean;
}

export interface WebSocketMetrics {
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  latency: number;
  reconnectCount: number;
  messagesPerSecond: number;
  lastHeartbeat: Date | null;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'critical';
  totalBytes: {
    sent: number;
    received: number;
  };
}

export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  networkLatency: number;
  domOperations: number;
  renderTime: number;
  scriptExecutionTime: number;
  pageLoadTime?: number;
}

export interface FeatureConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'ai' | 'performance' | 'ui' | 'connectivity';
  impact: 'low' | 'medium' | 'high';
  dependencies?: string[];
  settings?: Record<string, any>;
}

export interface OptimizationSettings {
  autoDetectChatElements: boolean;
  enablePerformanceMonitoring: boolean;
  adaptiveWebSocketRetry: boolean;
  intelligentCaching: boolean;
  prioritizeActiveTabs: boolean;
  batchDOMOperations: boolean;
  limitBackgroundProcessing: boolean;
  compressionLevel: 'none' | 'low' | 'medium' | 'high';
}

export interface ExtensionSettings {
  darkMode: boolean;
  notifications: boolean;
  autoConnect: boolean;
  debugMode: boolean;
  telemetry: boolean;
  optimization: OptimizationSettings;
  features: Record<string, FeatureConfig>;
}

export interface TNFMessage {
  type: 'CHAT_MESSAGE' | 'PERFORMANCE_UPDATE' | 'FEATURE_TOGGLE' | 'ERROR_REPORT' | 'STATUS_UPDATE';
  payload: any;
  timestamp: Date;
  source: 'extension' | 'vscode' | 'relay';
  id: string;
}

export interface ElementAnalysis {
  score: number;
  reasons: string[];
  element: Element;
  context: {
    parentElements: string[];
    siblings: string[];
    childElements: string[];
    computedStyle: Partial<CSSStyleDeclaration>;
  };
}

export interface ChatDetectionConfig {
  minConfidence: number;
  maxRetries: number;
  scanInterval: number;
  enableDeepScan: boolean;
  excludeHiddenElements: boolean;
  cacheResults: boolean;
}

export interface AutomationCapabilities {
  canSendMessages: boolean;
  canReceiveMessages: boolean;
  canDetectContext: boolean;
  canExtractHistory: boolean;
  canMonitorTyping: boolean;
  canDetectUsers: boolean;
}

export interface PlatformCapabilities {
  platform: ChatPlatform;
  features: AutomationCapabilities;
  reliability: number;
  lastTested: Date;
  errors: string[];
}

// Message types for Chrome extension communication
export interface ChromeMessage {
  action: 'TOGGLE_FEATURE' | 'OPTIMIZE_PERFORMANCE' | 'NEW_CHAT_MESSAGE' | 'GET_METRICS' | 'UPDATE_SETTINGS';
  data?: any;
  tabId?: number;
  timestamp?: number;
}

export interface ChromeResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

// Storage interfaces
export interface StorageData {
  settings: ExtensionSettings;
  metrics: PerformanceMetrics;
  sessions: ChatSession[];
  cache: Record<string, any>;
  lastSync: Date;
}

export interface CacheEntry {
  key: string;
  value: any;
  timestamp: Date;
  expiry: Date;
  size: number;
  hits: number;
}

// Event interfaces
export interface ExtensionEvent {
  type: string;
  target: string;
  data: any;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details?: any;
  timestamp: Date;
}

// Advanced AI detection interfaces
export interface MLFeatures {
  textMetrics: {
    length: number;
    wordCount: number;
    hasPlaceholder: boolean;
    placeholderRelevance: number;
  };
  visualMetrics: {
    size: { width: number; height: number };
    position: { x: number; y: number };
    visibility: number;
    zIndex: number;
  };
  contextMetrics: {
    siblingScore: number;
    parentScore: number;
    childScore: number;
    semanticScore: number;
  };
  interactionMetrics: {
    focusable: boolean;
    clickable: boolean;
    editable: boolean;
    hasEvents: boolean;
  };
}

export interface AIModelConfig {
  name: string;
  weights: Record<string, number>;
  threshold: number;
  version: string;
  lastUpdated: Date;
}

/**
 * @the-new-fuse/extension-core - Shared Type Definitions
 */

export type AgentStatus = 'active' | 'idle' | 'busy' | 'offline' | 'connected' | 'disconnected';
export type AgentPlatform =
  | 'chrome-extension'
  | 'vscode'
  | 'antigravity'
  | 'electron-desktop'
  | 'theia-ide'
  | 'api-gateway'
  | 'backend-service'
  | 'saas'
  | 'browser-page'
  | 'unknown';

export interface Agent {
  id: string;
  name: string;
  platform: AgentPlatform;
  status: AgentStatus;
  capabilities: string[];
  lastSeen: number;
  metadata?: Record<string, unknown>;
  channels?: string[];
}

export interface AgentMessage {
  id: string;
  from: string;
  to: string | 'broadcast';
  channel?: string;
  content: string;
  timestamp: number;
  type: 'text' | 'command' | 'response' | 'notification' | 'stream' | 'system';
  metadata?: Record<string, unknown>;
  isStreaming?: boolean;
  streamComplete?: boolean;
}

export interface ChatElements {
  input: HTMLElement | null;
  sendButton: HTMLElement | null;
  isReady: boolean;
}

export interface ChatBridgeCallbacks {
  onResponse?: (content: string) => void;
  onError?: (error: string) => void;
  onTranscriptEntry?: (entry: {
    role: string;
    content: string;
    ts: number;
    seq?: number;
    id?: string;
  }) => void;
}

export interface ChatDetectionConfig {
  inputSelectors: string[];
  contentEditableCheck: boolean;
  textareaCheck: boolean;
  sendButtonSelectors: string[];
  buttonTextPatterns: RegExp[];
  ariaLabelPatterns: RegExp[];
  messageContainerSelectors: string[];
  streamingIndicatorSelectors: string[];
  retryInterval: number;
  maxRetries: number;
  inputDebounce: number;
}

export type ConnectionStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'error'
  | 'reconnecting';

export interface ExtensionSettings {
  nodes: {
    endpoints: {
      relay: string;
      apiGateway: string;
      backend: string;
      saas: string;
      tnfWorker: string;
    };
    autoDiscover: boolean;
    healthCheckInterval: number;
  };
  autoConnect: boolean;
  chatDetection: ChatDetectionConfig;
  autoInject: boolean;
  panel: {
    defaultPosition: { x: number; y: number };
    defaultSize: { width: number; height: number };
    defaultMode: 'expanded' | 'collapsed' | 'minimized' | 'hidden';
    opacity: number;
    theme: 'dark' | 'light' | 'auto' | 'neon';
  };
  notifications: any;
  federation: {
    autoJoinChannels: string[];
    defaultChannel: string;
  };
  debug: {
    enabled: boolean;
    logLevel: string;
    logToConsole: boolean;
    logToStorage: boolean;
    recordNetworkTraffic: boolean;
  };
  shortcuts: {
    togglePanel: string;
    quickMessage: string;
    focusInput: string;
  };
}

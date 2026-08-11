/**
 * Fuse Connect v7 - Ultimate Chrome Extension
 * Comprehensive Type Definitions
 */

// ============================================
// AGENT & NETWORK TYPES
// ============================================

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

// ============================================
// FEDERATION & CHANNELS
// ============================================

export interface FederationChannel {
  id: string;
  name: string;
  description?: string;
  members: string[];
  createdAt: number;
  createdBy?: string;
  isPrivate: boolean;
  topic?: string;
  metadata?: Record<string, unknown>;
}

export interface ChannelMessage extends AgentMessage {
  channel: string;
  reactions?: { emoji: string; agentIds: string[] }[];
  thread?: string;
  pinned?: boolean;
}

// ============================================
// UNIVERSAL CHAT DETECTION
// ============================================

export interface DetectedChatElements {
  input: HTMLElement | null;
  sendButton: HTMLElement | null;
  messageContainer: HTMLElement | null;
  lastMessage: HTMLElement | null;
  isStreaming: boolean;
  confidence: number;
  detectedAt: number;
}

export interface ChatDetectionConfig {
  // Input detection
  inputSelectors: string[];
  contentEditableCheck: boolean;
  textareaCheck: boolean;

  // Send button detection
  sendButtonSelectors: string[];
  buttonTextPatterns: RegExp[];
  ariaLabelPatterns: RegExp[];

  // Output detection
  messageContainerSelectors: string[];
  streamingIndicatorSelectors: string[];

  // Timing
  retryInterval: number;
  maxRetries: number;
  inputDebounce: number;
}

export interface StreamingState {
  isStreaming: boolean;
  content: string;
  startedAt: number;
  lastUpdate: number;
  observer: MutationObserver | null;
}

// ============================================
// CONNECTION TYPES
// ============================================

export type ConnectionStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'error'
  | 'reconnecting';
export type NodeType = 'relay' | 'api-gateway' | 'backend' | 'saas' | 'redis' | 'websocket';

export interface TNFNode {
  id: string;
  type: NodeType;
  url: string;
  status: ConnectionStatus;
  lastConnected: number | null;
  latency: number | null;
  features: string[];
}

export interface ConnectionState {
  nodes: Map<string, TNFNode>;
  primaryNode: string | null;
  isOnline: boolean;
  lastHealthCheck: number;
}

export interface NodeDiscoveryConfig {
  endpoints: {
    relay: string;
    apiGateway: string;
    backend: string;
    saas: string;
  };
  autoDiscover: boolean;
  healthCheckInterval: number;
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================

export type NotificationType =
  | 'message'
  | 'agent_joined'
  | 'agent_left'
  | 'channel_update'
  | 'system'
  | 'error'
  | 'success'
  | 'warning'
  | 'info';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  timestamp: number;
  read: boolean;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  action: string;
  data?: Record<string, unknown>;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  badge: boolean;

  // Filtering
  showMessages: boolean;
  showAgentEvents: boolean;
  showSystemEvents: boolean;
  muteChannels: string[];

  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "08:00"
}

// ============================================
// INJECTABLE PANEL
// ============================================

export type PanelMode = 'expanded' | 'collapsed' | 'minimized' | 'hidden';
export type PanelTab =
  | 'chat'
  | 'agents'
  | 'channels'
  | 'notifications'
  | 'services'
  | 'settings'
  | 'tasks'
  | 'poker';

// ============================================
// AI STUDIO TYPES
// ============================================

export type ProcessingTier = 'metadata' | 'transcript' | 'flash' | 'pro' | 'vision' | 'ai-studio';

export interface AIStudioState {
  isAuthenticated: boolean;
  userEmail: string | null;
  currentPlaylist: YouTubePlaylist | null;
  videoQueue: VideoQueueItem[];
  processingTier: ProcessingTier;
  isProcessing: boolean;
  isPaused: boolean;
  currentVideoIndex: number;
  sessionCost: number;
  totalCost: number;
  knowledgeBase: KnowledgeBase;
  settings: AIStudioSettings;
}

export interface AIStudioSettings {
  autoDownloadReports: boolean;
  autoConsolidateKB: boolean;
  segmentDuration: number; // seconds
  defaultTier: ProcessingTier;
}

export interface VideoQueueItem {
  id: string;
  title: string;
  url: string;
  duration: number;
  thumbnail: string;
  processed: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  tier?: ProcessingTier;
  report?: string;
  cost?: number;
  error?: string;
  processedAt?: number;
}

export interface YouTubePlaylist {
  id: string;
  title: string;
  description: string;
  videoCount: number;
  videos: VideoQueueItem[];
}

export interface KnowledgeBase {
  concepts: Concept[];
  totalVideos: number;
  lastUpdated: number;
  totalConcepts: number;
}

export interface Concept {
  id: string;
  name: string;
  description: string;
  sources: string[]; // video IDs
  count: number;
  category?: string;
  tags?: string[];
}

export interface PanelPosition {
  x: number;
  y: number;
}

export interface PanelSize {
  width: number;
  height: number;
}

export interface PanelState {
  mode: PanelMode;
  position: PanelPosition;
  size: PanelSize;
  activeTab: PanelTab;
  isDragging: boolean;
  isResizing: boolean;
  isPinned: boolean;
  opacity: number;
}

// ============================================
// SETTINGS & CONFIGURATION
// ============================================

export interface ExtensionSettings {
  // Connection
  nodes: NodeDiscoveryConfig;
  autoConnect: boolean;

  // Chat Detection
  chatDetection: ChatDetectionConfig;
  autoInject: boolean;

  // UI
  panel: {
    defaultPosition: PanelPosition;
    defaultSize: PanelSize;
    defaultMode: PanelMode;
    opacity: number;
    theme: 'dark' | 'light' | 'auto' | 'neon';
  };

  // Notifications
  notifications: NotificationSettings;

  // Federation
  federation: {
    autoJoinChannels: string[];
    defaultChannel: string;
  };

  // Debug
  debug: {
    enabled: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug' | 'trace';
    logToConsole: boolean;
    logToStorage: boolean;
    recordNetworkTraffic: boolean;
  };

  // Keyboard shortcuts
  shortcuts: {
    togglePanel: string;
    quickMessage: string;
    focusInput: string;
  };
}

// ============================================
// MESSAGE PROTOCOL
// ============================================

export type MessageType =
  // Agent lifecycle
  | 'AGENT_REGISTER'
  | 'AGENT_UNREGISTER'
  | 'AGENT_LIST'
  | 'AGENT_STATUS'
  | 'AGENT_HEARTBEAT'

  // Messaging
  | 'MESSAGE_SEND'
  | 'MESSAGE_RECEIVE'
  | 'MESSAGE_STREAM_START'
  | 'MESSAGE_STREAM_CHUNK'
  | 'MESSAGE_STREAM_END'

  // Channels
  | 'CHANNEL_CREATE'
  | 'CHANNEL_JOIN'
  | 'CHANNEL_LEAVE'
  | 'CHANNEL_LIST'
  | 'CHANNEL_MESSAGE'

  // Chat injection
  | 'INJECT_MESSAGE'
  | 'INJECT_RESULT'
  | 'RESPONSE_DETECTED'
  | 'RESPONSE_STREAMING'
  | 'RESPONSE_COMPLETE'

  // System
  | 'HEARTBEAT'
  | 'ERROR'
  | 'WELCOME'
  | 'NODE_STATUS'
  | 'SYNC_REQUEST'
  | 'SYNC_RESPONSE'
  | 'TASK_ASSIGN';

// ============================================
// ORCHESTRATION TYPES
// ============================================

export interface OrchestrationTask {
  id: string;
  type: 'question' | 'generation' | 'analysis' | 'review' | 'continuation';
  priority: 'low' | 'medium' | 'high' | 'critical';

  // Task definition
  title: string;
  description: string;
  instructions: string[];

  // Targeting
  targetAgents?: string[];
  requiredCapabilities?: string[];

  // Response handling
  requiresResponse: boolean;
  responseTimeout: number;
  maxRetries: number;

  // Chaining
  dependencies?: string[];
  nextTasks?: string[];

  // Metadata
  correlationId: string;
  parentTaskId?: string;
  createdAt: number;
  createdBy: string;
}

export interface ProtocolMessage<T = unknown> {
  id: string;
  type: MessageType;
  timestamp: number;
  source: string;
  target?: string;
  channel?: string;
  payload: T;
  metadata?: Record<string, unknown>;
}

// ============================================
// SERVER CONTROL (Native Messaging)
// ============================================

export interface ServerControlMessage {
  action: 'start' | 'stop' | 'restart' | 'status';
  service: 'relay' | 'api' | 'all';
}

export interface ServerStatus {
  relay: { running: boolean; port: number; pid?: number };
  api: { running: boolean; port: number; pid?: number };
  lastChecked: number;
}

// ============================================
// STORAGE SCHEMA
// ============================================

export interface StorageSchema {
  settings: ExtensionSettings;
  agentId: string;
  panelState: PanelState;
  channels: FederationChannel[];
  joinedChannels: string[];
  notifications: Notification[];
  recentMessages: AgentMessage[];
  knownNodes: TNFNode[];
  serverStatus: ServerStatus;
}

export type StorageKey = keyof StorageSchema;

// ============================================
// EVENT SYSTEM
// ============================================

export type ExtensionEvent =
  | { type: 'CONNECTION_CHANGE'; node: TNFNode }
  | { type: 'AGENT_UPDATE'; agents: Agent[] }
  | { type: 'MESSAGE_RECEIVED'; message: AgentMessage }
  | { type: 'CHANNEL_UPDATE'; channel: FederationChannel }
  | { type: 'CHAT_DETECTED'; elements: DetectedChatElements }
  | { type: 'STREAMING_UPDATE'; state: StreamingState }
  | { type: 'NOTIFICATION'; notification: Notification }
  | { type: 'SETTINGS_CHANGE'; settings: Partial<ExtensionSettings> }
  | { type: 'PANEL_STATE_CHANGE'; state: PanelState }
  | { type: 'ERROR'; error: string; context?: string };

// ============================================
// UTILITY TYPES
// ============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface Disposable {
  dispose(): void;
}

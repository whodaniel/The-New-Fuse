/**
 * Fuse Connect v6 - Constants and Configuration
 */

import type { ChatDetectionConfig, ExtensionSettings, NotificationSettings } from './types';

// ============================================
// EXTENSION METADATA
// ============================================

export const EXTENSION_NAME = 'Fuse Connect';
export const EXTENSION_VERSION = '6.0.0';
export const EXTENSION_ID = 'fuse-connect-v6';

// ============================================
// NODE ENDPOINTS
// ============================================

export const DEFAULT_NODES = {
  relay: 'ws://localhost:3001/ws',
  apiGateway: 'http://localhost:3001',
  backend: 'http://localhost:3000',
  saas: 'https://app.thenewfuse.com',
};

// ============================================
// CHAT DETECTION CONFIG
// ============================================

export const DEFAULT_CHAT_DETECTION: ChatDetectionConfig = {
  inputSelectors: [
    // Contenteditable (modern AI UIs)
    'div[contenteditable="true"][role="textbox"]',
    'div[contenteditable="true"][data-placeholder]',
    'div.ProseMirror[contenteditable="true"]',
    'div[contenteditable="true"]',

    // Textareas
    'textarea[placeholder*="message" i]',
    'textarea[placeholder*="ask" i]',
    'textarea[placeholder*="type" i]',
    'textarea[data-testid*="input" i]',
    'textarea#prompt-textarea',
    'form textarea',
    'textarea',
  ],
  contentEditableCheck: true,
  textareaCheck: true,

  sendButtonSelectors: [
    'button[data-testid*="send" i]',
    'button[aria-label*="send" i]',
    'button[type="submit"]',
    'button.send-button',
    'form button:last-of-type',
  ],
  buttonTextPatterns: [/send/i, /submit/i, /ask/i, /→/, /➤/, /▶/],
  ariaLabelPatterns: [/send/i, /submit/i],

  messageContainerSelectors: [
    'div[class*="message-list"]',
    'div[class*="conversation"]',
    'main div[class*="scroll"]',
    'div[role="log"]',
  ],
  streamingIndicatorSelectors: [
    'div[data-is-streaming="true"]',
    'div[class*="streaming"]',
    '.generating',
  ],

  retryInterval: 500,
  maxRetries: 20,
  inputDebounce: 100,
};

// ============================================
// NOTIFICATION DEFAULTS
// ============================================

export const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  enabled: true,
  sound: false,
  desktop: true,
  badge: true,
  showMessages: true,
  showAgentEvents: true,
  showSystemEvents: false,
  muteChannels: [],
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

// ============================================
// DEFAULT SETTINGS
// ============================================

export const DEFAULT_SETTINGS: ExtensionSettings = {
  nodes: {
    endpoints: DEFAULT_NODES,
    autoDiscover: true,
    healthCheckInterval: 30000,
  },
  autoConnect: true,
  chatDetection: DEFAULT_CHAT_DETECTION,
  autoInject: true,
  panel: {
    defaultPosition: { x: 20, y: 20 },
    defaultSize: { width: 360, height: 480 },
    defaultMode: 'collapsed',
    opacity: 1,
    theme: 'neon',
  },
  notifications: DEFAULT_NOTIFICATIONS,
  federation: {
    autoJoinChannels: ['general'],
    defaultChannel: 'general',
  },
  debug: {
    enabled: false,
    logLevel: 'warn',
    logToConsole: true,
    logToStorage: false,
    recordNetworkTraffic: false,
  },
  shortcuts: {
    togglePanel: 'Ctrl+Shift+F',
    quickMessage: 'Ctrl+Shift+M',
    focusInput: 'Ctrl+Shift+I',
  },
};

// ============================================
// STORAGE KEYS
// ============================================

export const STORAGE_KEYS = {
  settings: 'fuse_settings',
  agentId: 'fuse_agent_id',
  panelState: 'fuse_panel_state',
  channels: 'fuse_channels',
  joinedChannels: 'fuse_joined_channels',
  notifications: 'fuse_notifications',
  knownNodes: 'fuse_known_nodes',
  recentMessages: 'fuse_recent_messages',
};

// ============================================
// UI CONSTANTS
// ============================================

export const PANEL_DIMENSIONS = {
  minWidth: 300,
  minHeight: 200,
  maxWidth: 600,
  maxHeight: 800,
  collapsedHeight: 48,
  defaultWidth: 360,
  defaultHeight: 480,
};

export const Z_INDEX = {
  panel: 2147483647,
  overlay: 2147483646,
  notification: 2147483645,
};

// ============================================
// TIMING CONSTANTS
// ============================================

export const TIMINGS = {
  debounceDelay: 300,
  retryInterval: 1000,
  heartbeatInterval: 30000,
  healthCheckInterval: 10000,
  reconnectDelay: 5000,
  streamingTimeout: 2000,
  responsePollingInterval: 500,
  maxResponseWait: 60000,
};

// ============================================
// MESSAGE TYPES
// ============================================

export const MESSAGE_TYPES = {
  // Agent lifecycle
  AGENT_REGISTER: 'AGENT_REGISTER',
  AGENT_UNREGISTER: 'AGENT_UNREGISTER',
  AGENT_LIST: 'AGENT_LIST',
  AGENT_STATUS: 'AGENT_STATUS',
  AGENT_HEARTBEAT: 'AGENT_HEARTBEAT',

  // Messaging
  MESSAGE_SEND: 'MESSAGE_SEND',
  MESSAGE_RECEIVE: 'MESSAGE_RECEIVE',
  BROADCAST_MESSAGE: 'BROADCAST_MESSAGE',

  // Streaming
  MESSAGE_STREAM_START: 'MESSAGE_STREAM_START',
  MESSAGE_STREAM_CHUNK: 'MESSAGE_STREAM_CHUNK',
  MESSAGE_STREAM_END: 'MESSAGE_STREAM_END',

  // Channels
  CHANNEL_CREATE: 'CHANNEL_CREATE',
  CHANNEL_JOIN: 'CHANNEL_JOIN',
  CHANNEL_LEAVE: 'CHANNEL_LEAVE',
  CHANNEL_LIST: 'CHANNEL_LIST',
  CHANNEL_MESSAGE: 'CHANNEL_MESSAGE',

  // Chat injection
  INJECT_MESSAGE: 'INJECT_MESSAGE',
  INJECT_RESULT: 'INJECT_RESULT',
  CHAT_DETECTED: 'CHAT_DETECTED',
  RESPONSE_DETECTED: 'RESPONSE_DETECTED',
  RESPONSE_COMPLETE: 'RESPONSE_COMPLETE',
  STREAMING_UPDATE: 'STREAMING_UPDATE',

  // System
  HEARTBEAT: 'HEARTBEAT',
  WELCOME: 'WELCOME',
  ERROR: 'ERROR',
  CONNECTION_STATUS: 'CONNECTION_STATUS',
  CONTENT_SCRIPT_READY: 'CONTENT_SCRIPT_READY',
  TOGGLE_PANEL: 'TOGGLE_PANEL',
  REQUEST_SYNC: 'REQUEST_SYNC',
} as const;

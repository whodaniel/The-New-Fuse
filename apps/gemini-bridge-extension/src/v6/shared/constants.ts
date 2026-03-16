/**
 * Gemini Bridge v7 - Constants and Configuration
 *
 * Note: This extension is designed to work alongside Fuse Connect
 * without conflict. All storage keys use 'gemini_bridge_' prefix.
 */

import type { ChatDetectionConfig, ExtensionSettings, NotificationSettings } from './types';

// ============================================
// EXTENSION METADATA
// ============================================

export const EXTENSION_NAME = 'Gemini Bridge';
export const EXTENSION_VERSION = '7.2.0';
export const EXTENSION_ID = 'gemini-bridge-v7';

// ============================================
// NODE ENDPOINTS
// ============================================

export const DEFAULT_NODES = {
  relay: 'ws://localhost:3000/ws',
  apiGateway: 'http://localhost:8080',
  backend: 'http://localhost:3001',
  saas: 'http://localhost:3002',

  // Cloudflare TNF agent orchestration (canonical edge state)
  tnfWorker: 'https://tnf-agent-orchestration.bizsynth.workers.dev',
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
    togglePanel: 'Ctrl+Shift+G',
    quickMessage: 'Ctrl+Shift+M',
    focusInput: 'Ctrl+Shift+I',
  },
};

// ============================================
// STORAGE KEYS
// ============================================
// IMPORTANT: These keys use 'gemini_bridge_' prefix to avoid
// conflicts with Fuse Connect extension storage

export const STORAGE_KEYS = {
  settings: 'gemini_bridge_settings',
  agentId: 'gemini_bridge_agent_id',
  panelState: 'gemini_bridge_panel_state',
  channels: 'gemini_bridge_channels',
  joinedChannels: 'gemini_bridge_joined_channels',
  notifications: 'gemini_bridge_notifications',
  knownNodes: 'gemini_bridge_known_nodes',
  recentMessages: 'gemini_bridge_recent_messages',
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
  reconnectBaseDelay: 1000,
  reconnectMaxDelay: 30000,
  messageDedupWindow: 5000,
};

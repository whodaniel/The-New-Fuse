/**
 * Fuse Connect v7 - Constants and Configuration
 */

import type { ChatDetectionConfig, ExtensionSettings, NotificationSettings } from './types';

// ============================================
// EXTENSION METADATA
// ============================================

export const EXTENSION_NAME = 'Fuse Connect';
export const EXTENSION_VERSION = '7.0.0';
export const EXTENSION_ID = 'fuse-connect-v7';

// ============================================
// NATIVE MESSAGING
// ============================================

export const NATIVE_HOST_NAME = 'com.thenewfuse.native_host';

// ============================================
// NODE ENDPOINTS
// ============================================

export const DEFAULT_NODES = {
  relay: 'ws://127.0.0.1:3000/ws',
  apiGateway: 'http://localhost:8080',
  backend: 'http://localhost:3001',
  saas: 'http://localhost:3002',

  // Cloudflare TNF agent orchestration (canonical edge state)
  tnfWorker: 'https://tnf-agent-orchestration.bizsynth.workers.dev',
};

// ============================================
// EXTERNAL API URLs
// ============================================

export const API_URLS = {
  youtube: 'https://www.googleapis.com/youtube/v3',
  youtubeTranscript: 'https://www.youtube.com/api/timedtext',
  youtubeWatch: 'https://www.youtube.com/watch',
  googleOAuth: 'https://accounts.google.com/o/oauth2/auth',
  googleUserInfo: 'https://www.googleapis.com/oauth2/v3/userinfo',
  googleSearch: 'https://www.google.com/search',
  geminiApi: 'https://generativelanguage.googleapis.com/v1beta',
  aiStudio: 'https://aistudio.google.com',
  notebookLM: 'https://notebooklm.google.com',
  aiVideoIntelligence: 'https://api.aivideointelligence.com',
  tnfDashboard: 'https://connect.thenewfuse.com',
};

// ============================================
// GOOGLE OAUTH
// ============================================

export const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

// ============================================
// FEDERATION
// ============================================

export const ACTIVITY_CHANNEL = 'fuse-activity-log';

// ============================================
// AI MODELS
// ============================================

export const AI_MODELS = {
  geminiFlash: 'gemini-1.5-flash',
  geminiPro: 'gemini-1.5-pro',
  gemini3Flash: 'gemini-3-flash-preview',
  aiStudioDefault: 'gemini-3-flash-preview',
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
  messageDedupWindow: 10000,
  eventLogLimit: 4000,
  transcriptPollInterval: 1500,
  sendingGuardTimeout: 3000,
  inactivityTimeout: 180000,
  hardTimeout: 600000,
  pendingRequestCleanup: 300000,
  injectionQueueDelay: 3500,
  cliAgentTimeout: 60000,
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
  AGENT_DISCOVER: 'DISCOVER_AGENTS',

  // Messaging
  MESSAGE_SEND: 'MESSAGE_SEND',
  MESSAGE_RECEIVE: 'MESSAGE_RECEIVE',
  BROADCAST_MESSAGE: 'BROADCAST_MESSAGE',
  SEND_TO_AGENT: 'SEND_TO_AGENT',

  // Streaming
  MESSAGE_STREAM_START: 'MESSAGE_STREAM_START',
  MESSAGE_STREAM_CHUNK: 'MESSAGE_STREAM_CHUNK',
  MESSAGE_STREAM_END: 'MESSAGE_STREAM_END',
  STREAMING_START: 'STREAMING_START',
  STREAMING_CHUNK: 'STREAMING_CHUNK',
  STREAMING_END: 'STREAMING_END',

  // Channels
  CHANNEL_CREATE: 'CHANNEL_CREATE',
  CHANNEL_JOIN: 'CHANNEL_JOIN',
  CHANNEL_LEAVE: 'CHANNEL_LEAVE',
  CHANNEL_LIST: 'CHANNEL_LIST',
  CHANNEL_MESSAGE: 'CHANNEL_MESSAGE',
  CHANNEL_PAUSE_UPDATE: 'CHANNEL_PAUSE_UPDATE',
  CHANNEL_SELECTED: 'CHANNEL_SELECTED',
  JOINED_CHANNELS_UPDATE: 'JOINED_CHANNELS_UPDATE',

  // Chat injection
  INJECT_MESSAGE: 'INJECT_MESSAGE',
  INJECT_RESULT: 'INJECT_RESULT',
  CHAT_DETECTED: 'CHAT_DETECTED',
  RESPONSE_DETECTED: 'RESPONSE_DETECTED',
  RESPONSE_COMPLETE: 'RESPONSE_COMPLETE',
  STREAMING_UPDATE: 'STREAMING_UPDATE',

  // Task orchestration
  TASK_ASSIGN: 'TASK_ASSIGN',
  TASK_COMPLETE: 'TASK_COMPLETE',
  TASK_ERROR: 'TASK_ERROR',
  ORCHESTRATION_START: 'AUTOMATION_START',
  ORCHESTRATION_PAUSE: 'AUTOMATION_PAUSE',
  ORCHESTRATION_RESUME: 'AUTOMATION_RESUME',
  ORCHESTRATION_STOP: 'AUTOMATION_STOP',

  // AI Studio / Video
  AI_VIDEO_PROCESSING_UPDATE: 'AI_VIDEO_PROCESSING_UPDATE',
  AI_STUDIO_AUTH: 'AI_STUDIO_AUTH',
  YOUTUBE_AUTHENTICATE: 'YOUTUBE_AUTHENTICATE',
  CAPTCHA_DETECTED: 'CAPTCHA_DETECTED',

  // Federation
  FEDERATION_MEMBER_JOIN: 'FEDERATION_MEMBER_JOIN',
  FEDERATION_MEMBER_LEAVE: 'FEDERATION_MEMBER_LEAVE',
  FEDERATION_CHANNEL_MESSAGE: 'FEDERATION_CHANNEL_MESSAGE',
  FUSE_ONBOARDING_CONTEXT: 'FUSE_ONBOARDING_CONTEXT',
  ACTIVITY_EVENT: 'ACTIVITY_EVENT',

  // System
  HEARTBEAT: 'HEARTBEAT',
  WELCOME: 'WELCOME',
  ERROR: 'ERROR',
  CONNECTION_STATUS: 'CONNECTION_STATUS',
  CONTENT_SCRIPT_READY: 'CONTENT_SCRIPT_READY',
  TOGGLE_PANEL: 'TOGGLE_PANEL',
  REQUEST_SYNC: 'REQUEST_SYNC',
  DISCOVER_AGENTS: 'DISCOVER_AGENTS',
  NAVIGATE: 'NAVIGATE',
  TAKE_SCREENSHOT: 'TAKE_SCREENSHOT',
} as const;

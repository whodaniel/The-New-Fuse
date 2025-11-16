/**
 * TNF Chrome Extension - Global Constants
 * Centralized configuration and magic number elimination
 */

export const AI_PLATFORMS = {
  CHATGPT: 'chatgpt',
  CLAUDE: 'claude', 
  GEMINI: 'gemini',
  PERPLEXITY: 'perplexity',
  POE: 'poe',
  CHARACTER: 'character'
};

export const MESSAGE_TYPES = {
  INJECT: 'INJECT',
  AI_RESPONSE: 'AI_RESPONSE',
  AI_RESPONSE_ENHANCED: 'AI_RESPONSE_ENHANCED',
  INJECTION_RESULT: 'INJECTION_RESULT',
  START_RESPONSE_MONITORING: 'START_RESPONSE_MONITORING',
  STOP_RESPONSE_MONITORING: 'STOP_RESPONSE_MONITORING',
  CONVERSATION_UPDATED: 'CONVERSATION_UPDATED',
  TNF_STATUS_UPDATE: 'TNF_STATUS_UPDATE',
  ERROR_REPORT: 'ERROR_REPORT'
};

export const QUALITY_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.6,
  LOW: 0.0
};

export const TIMEOUTS = {
  INJECTION_TIMEOUT: 5000,
  RESPONSE_MONITORING_TIMEOUT: 60000,
  SEND_BUTTON_WAIT: 3000,
  TEXT_STABILIZATION: 2000,
  RENDER_THROTTLE: 16, // ~60fps
  PERFORMANCE_REPORT_INTERVAL: 30000,
  HEALTH_CHECK_INTERVAL: 300000 // 5 minutes
};

export const LIMITS = {
  MAX_CONVERSATION_HISTORY: 100,
  MAX_PENDING_MESSAGES: 100,
  MAX_ANALYTICS_ENTRIES: 1000,
  MAX_TELEMETRY_ENTRIES: 500,
  MAX_RECONNECT_ATTEMPTS: 5,
  MAX_INJECTION_RETRIES: 3,
  MAX_RESPONSE_POLLS: 20
};

export const POLLING_INTERVALS = {
  RESPONSE_SCAN: 2000,
  PORT_CHECK: 5000,
  KEEP_ALIVE: 60000,
  TNF_HEALTH_CHECK: 300000
};

export const TNF_PORTS = {
  MAIN: 8765,
  COMPREHENSIVE: 3001,
  WEBSOCKET: 3001,
  BACKUP: 3000,
  UI: 3002
};

export const UI_CONFIG = {
  MODAL_WIDTH: 400,
  MODAL_MIN_HEIGHT: 300,
  CHAT_LOG_HEIGHT: 180,
  TOGGLE_BUTTON_SIZE: 50,
  ANIMATION_DURATION: 300
};

export const SELECTORS = {
  GEMINI: {
    INPUT: [
      'div[contenteditable="true"]',
      'div[role="textbox"]',
      'div[aria-label*="Enter a prompt here"]',
      'div[aria-label*="prompt"]',
      'div.ql-editor[contenteditable="true"]'
    ],
    SEND: [
      'button[aria-label*="Send"]',
      'button[data-testid="send-button"]',
      'button[aria-label*="Send message"]',
      'button:has(svg[viewBox="0 0 24 24"])'
    ],
    RESPONSE: [
      '[data-message-author-role="model"]',
      '[data-testid*="conversation-turn"][data-message-author-role="model"]'
    ]
  },
  CHATGPT: {
    INPUT: [
      '#prompt-textarea',
      'textarea[data-id]',
      'div[contenteditable="true"]',
      'textarea[placeholder*="message"]'
    ],
    SEND: [
      'button[data-testid="send-button"]',
      'button[aria-label*="Send"]',
      'button[data-testid="fruitjuice-send-button"]'
    ],
    RESPONSE: [
      '[data-message-author-role="assistant"]',
      '.markdown.prose:not([data-message-author-role="user"])'
    ]
  },
  CLAUDE: {
    INPUT: [
      'div[contenteditable="true"]',
      '.ProseMirror',
      'div[role="textbox"]',
      'textarea'
    ],
    SEND: [
      'button[aria-label*="Send"]',
      'button[type="submit"]',
      'button:has(svg)',
      '.send-button'
    ],
    RESPONSE: [
      '[data-message-author-role="assistant"]',
      '.font-claude-message:not([data-message-author-role="user"])'
    ]
  }
};

export const ERROR_TYPES = {
  INJECTION_FAILED: 'INJECTION_FAILED',
  RESPONSE_MONITORING_FAILED: 'RESPONSE_MONITORING_FAILED',
  AI_PLATFORM_NOT_SUPPORTED: 'AI_PLATFORM_NOT_SUPPORTED',
  INPUT_ELEMENT_NOT_FOUND: 'INPUT_ELEMENT_NOT_FOUND',
  SEND_BUTTON_NOT_FOUND: 'SEND_BUTTON_NOT_FOUND',
  TEXT_INJECTION_FAILED: 'TEXT_INJECTION_FAILED',
  RESPONSE_EXTRACTION_FAILED: 'RESPONSE_EXTRACTION_FAILED',
  EXTENSION_CONTEXT_INVALID: 'EXTENSION_CONTEXT_INVALID',
  TNF_CONNECTION_FAILED: 'TNF_CONNECTION_FAILED',
  MEMORY_LEAK_DETECTED: 'MEMORY_LEAK_DETECTED'
};

export const PERFORMANCE_MODES = {
  FAST: 'fast',
  BALANCED: 'balanced',
  QUALITY: 'quality'
};

export const PERFORMANCE_CONFIG = {
  [PERFORMANCE_MODES.FAST]: {
    responseConfidenceThreshold: 0.5,
    maxPolls: 10,
    pollInterval: 3000,
    enableAdvancedMonitoring: false
  },
  [PERFORMANCE_MODES.BALANCED]: {
    responseConfidenceThreshold: 0.7,
    maxPolls: 20,
    pollInterval: 2000,
    enableAdvancedMonitoring: true
  },
  [PERFORMANCE_MODES.QUALITY]: {
    responseConfidenceThreshold: 0.8,
    maxPolls: 30,
    pollInterval: 1000,
    enableAdvancedMonitoring: true
  }
};

export const ANALYTICS_EVENTS = {
  INJECTION_SUCCESS: 'injection_success',
  INJECTION_FAILURE: 'injection_failure',
  RESPONSE_CAPTURED: 'response_captured',
  RESPONSE_MISSED: 'response_missed',
  PERFORMANCE_DEGRADED: 'performance_degraded',
  MEMORY_WARNING: 'memory_warning',
  USER_INTERACTION: 'user_interaction'
};

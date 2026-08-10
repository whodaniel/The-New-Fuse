/**
 * Fuse Connect v6 - Site-Specific AI Response Configurations
 *
 * Each AI platform has unique DOM structures and streaming indicators.
 * These configurations map selectors and detection logic for each platform.
 */

export interface SiteConfig {
  // CSS selector for AI response messages
  msgSelector: string;
  // CSS selector for the container to observe
  containerSelector: string;
  // Function to check if AI is done responding
  isFinal: (el: HTMLElement | null, doc: Document) => boolean;
  // Selectors for finding the input element
  inputSelectors: string[];
  // Selectors for finding the send button
  sendButtonSelectors: string[];
  // How long to wait after content stops changing before considering it "done"
  debounceMs: number;
}

export const SITE_CONFIGS: Record<string, SiteConfig> = {
  // Google Gemini
  'gemini.google.com': {
    msgSelector: [
      'div[data-message-author-role="model"]',
      '.model-response-text',
      'model-response',
      // Safe fallback that excludes user explicitly
      '[class*="model-response"]:not([data-message-author-role="user"])',
    ].join(', '),
    containerSelector: 'main',
    isFinal: (el, doc) => {
      // Gemini shows a blinking cursor while streaming
      const streamingCursor = doc.querySelector('span[class*="cursor"][class*="blink"]');
      const showThinking = doc.querySelector('[class*="thinking-indicator"]');
      const loadingSpinner = doc.querySelector('[class*="loading-spinner"]');
      return !streamingCursor && !showThinking && !loadingSpinner;
    },
    inputSelectors: [
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"][data-placeholder]',
      'rich-textarea div[contenteditable="true"]',
    ],
    sendButtonSelectors: [
      'button[aria-label*="Send message"]',
      'button[aria-label*="send" i]',
      'button[data-testid*="send"]',
    ],
    debounceMs: 1500, // Gemini can have pauses in streaming
  },

  // ChatGPT
  'chatgpt.com': {
    msgSelector:
      '[data-testid^="conversation-turn-"] .markdown, [data-message-author-role="assistant"] .markdown',
    containerSelector: 'main',
    isFinal: (el, doc) => {
      // ChatGPT adds .result-streaming class while typing
      const isStreaming = el?.closest('.result-streaming') !== null;
      const stopButton = doc.querySelector('button[aria-label="Stop generating"]');
      return !isStreaming && !stopButton;
    },
    inputSelectors: [
      'textarea#prompt-textarea',
      'textarea[placeholder*="Send a message"]',
      'div[contenteditable="true"]#prompt-textarea',
    ],
    sendButtonSelectors: ['button[data-testid="send-button"]', 'button[aria-label="Send prompt"]'],
    debounceMs: 1000,
  },

  // Chat.OpenAI.com (older domain)
  'chat.openai.com': {
    msgSelector:
      '[data-testid^="conversation-turn-"] .markdown, [data-message-author-role="assistant"] .markdown',
    containerSelector: 'main',
    isFinal: (el, doc) => {
      const isStreaming = el?.closest('.result-streaming') !== null;
      const stopButton = doc.querySelector('button[aria-label="Stop generating"]');
      return !isStreaming && !stopButton;
    },
    inputSelectors: ['textarea#prompt-textarea', 'textarea[placeholder*="Send a message"]'],
    sendButtonSelectors: ['button[data-testid="send-button"]'],
    debounceMs: 1000,
  },

  // Claude AI
  'claude.ai': {
    msgSelector:
      '.font-claude-message, [aria-label="Claude\'s response"], [data-testid="message-content"]',
    containerSelector: 'div[role="main"], main',
    isFinal: (el, doc) => {
      const isStreaming = doc.querySelector('.is-streaming, [data-is-streaming="true"]');
      const stopButton = doc.querySelector('button[aria-label="Stop response"]');
      return !isStreaming && !stopButton;
    },
    inputSelectors: [
      'div[contenteditable="true"][data-placeholder]',
      'div.ProseMirror[contenteditable="true"]',
    ],
    sendButtonSelectors: [
      'button[aria-label*="Send Message"]',
      'button[data-testid="send-button"]',
    ],
    debounceMs: 1200,
  },

  // Perplexity AI
  'perplexity.ai': {
    msgSelector: '.prose.dark\\:prose-invert, [class*="markdown-content"]',
    containerSelector: 'main',
    isFinal: (el, doc) => {
      const isStreaming = doc.querySelector('.p-streaming, [data-streaming="true"]');
      return !isStreaming;
    },
    inputSelectors: ['textarea[placeholder*="Ask"]', 'div[contenteditable="true"]'],
    sendButtonSelectors: ['button[aria-label*="Submit"]', 'button[type="submit"]'],
    debounceMs: 1000,
  },

  // Poe
  'poe.com': {
    msgSelector: '[class*="Message_botMessageBubble"]',
    containerSelector: '[class*="ChatMessagesView"]',
    isFinal: (el, doc) => {
      const isStreaming = doc.querySelector('[class*="ChatMessageActionBar_isStreaming"]');
      return !isStreaming;
    },
    inputSelectors: ['textarea[class*="TextInput"]'],
    sendButtonSelectors: ['button[class*="SendButton"]'],
    debounceMs: 1000,
  },
};

/**
 * Get the configuration for the current site
 */
export function getSiteConfig(): SiteConfig | null {
  const hostname = window.location.hostname;

  for (const [domain, config] of Object.entries(SITE_CONFIGS)) {
    if (hostname.includes(domain) || hostname.endsWith(domain)) {
      console.log('[FuseConnect] Using site-specific config for:', domain);
      return config;
    }
  }

  console.log(
    '[FuseConnect] No site-specific config found for:',
    hostname,
    '- using universal detection'
  );
  return null;
}

/**
 * Default fallback config for unknown sites
 */
export const DEFAULT_SITE_CONFIG: SiteConfig = {
  msgSelector: '.markdown-content, [class*="response"], [class*="message"], [class*="content"]',
  containerSelector: 'main, [role="main"], body',
  isFinal: (el, doc) => {
    // Generic check - no common streaming indicators
    const genericStreamingIndicators = doc.querySelectorAll(
      '.loading, .streaming, .typing, [class*="loading"], [class*="streaming"], [class*="typing"]'
    );
    return genericStreamingIndicators.length === 0;
  },
  inputSelectors: ['div[contenteditable="true"]', 'textarea'],
  sendButtonSelectors: ['button[type="submit"]', 'button'],
  debounceMs: 2000,
};

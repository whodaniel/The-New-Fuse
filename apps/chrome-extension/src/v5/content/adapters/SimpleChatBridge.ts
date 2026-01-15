/**
 * Fuse Connect v5 - Simple Chat Bridge
 *
 * RESTORED FROM BACKUP: Using simple selector approach that actually works.
 */

export interface ChatElements {
  input: HTMLElement | null;
  sendButton: HTMLElement | null;
  isReady: boolean;
}

export interface ChatBridgeCallbacks {
  onResponse?: (content: string) => void;
  onError?: (error: string) => void;
}

class SimpleChatBridge {
  private lastResponseText = '';
  private responseObserver: MutationObserver | null = null;
  private callbacks: ChatBridgeCallbacks = {};
  private isWaitingForResponse = false;
  private responseCheckInterval: number | null = null;

  // ORCHESTRATOR IMPROVEMENT: Element caching to reduce DOM scanning
  private cachedElements: ChatElements | null = null;
  private cacheValidUntil: number = 0;
  private readonly CACHE_DURATION = 10000; // 10 seconds

  /**
   * Initialize the bridge with callbacks
   */
  init(callbacks: ChatBridgeCallbacks): void {
    this.callbacks = callbacks;
    console.log('[SimpleChatBridge] Initialized');
  }

  /**
   * Find chat elements on the page - Enhanced with platform-specific selectors
   * ORCHESTRATOR IMPROVEMENT: Added caching to reduce DOM scanning overhead
   */
  findElements(): ChatElements {
    // Check cache first
    const now = Date.now();
    if (this.cachedElements?.isReady && now < this.cacheValidUntil) {
      return this.cachedElements;
    }

    // Enable debug mode via console: window.__FUSE_DEBUG_SELECTORS = true
    const DEBUG = (window as any).__FUSE_DEBUG_SELECTORS || false;

    // Platform-specific selectors (most reliable first)
    const inputSelectors = [
      // Gemini-specific (high priority) - EXPANDED for 2024+ Gemini updates
      '.ql-editor.textarea[contenteditable="true"]',
      'rich-textarea .ql-editor[contenteditable="true"]',
      'rich-textarea [contenteditable="true"]',
      'div.ql-editor.textarea',
      'div.ql-editor[contenteditable="true"]',
      // Gemini 2024+ patterns
      'textarea.ql-editor[contenteditable="true"]',
      '[data-placeholder*="Ask Gemini" i][contenteditable="true"]',
      '[data-placeholder*="Enter a prompt" i][contenteditable="true"]',
      'div[aria-label*="Enter a prompt" i][contenteditable="true"]',
      'div[aria-label*="Type your message" i][contenteditable="true"]',
      // Gemini with data attributes
      'div[contenteditable="true"][data-placeholder*="Enter"]',
      'div[contenteditable="true"][aria-label*="prompt" i]',
      // ChatGPT-specific
      '#prompt-textarea',
      'textarea[data-id="root"]',
      'textarea[placeholder*="Message" i]',
      // Claude-specific
      'div[contenteditable="true"][aria-label*="Message" i]',
      // Generic fallbacks
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"][data-placeholder]',
      'div[contenteditable="true"]:not([role="button"])',
      'textarea[placeholder*="Ask" i]',
      // Ultra-broad fallback (use with caution)
      'textarea[contenteditable="true"]',
      'div.textarea[contenteditable="true"]',
    ];

    const sendButtonSelectors = [
      // Gemini-specific - EXPANDED
      'button[aria-label*="Send" i]',
      'button[aria-label*="submit" i]',
      'button[data-testid*="send" i]',
      'button.send-button-container button',
      'button[aria-label*="Send message" i]',
      'button[title*="Send" i]',
      // Look for SVG send icons
      'button:has(svg[aria-label*="Send" i])',
      'button:has(path[d*="M2.01"])', // Common send icon path
      // ChatGPT-specific
      'button[data-testid="send-button"]',
      // Generic
      'button.send-button',
      'button[type="submit"]',
      // Fallback: buttons near textarea
      'form button[type="submit"]',
    ];

    if (DEBUG) {
      console.log('[SimpleChatBridge DEBUG] Starting element search...');
      console.log(
        '[SimpleChatBridge DEBUG] All contenteditable elements:',
        Array.from(document.querySelectorAll('[contenteditable="true"]')).map((el) => ({
          tag: el.tagName,
          classes: el.className,
          ariaLabel: el.getAttribute('aria-label'),
          placeholder: el.getAttribute('data-placeholder'),
          visible: this.isVisible(el as HTMLElement),
        }))
      );
      console.log(
        '[SimpleChatBridge DEBUG] All buttons with aria-label:',
        Array.from(document.querySelectorAll('button[aria-label]')).map((el) => ({
          ariaLabel: el.getAttribute('aria-label'),
          visible: this.isVisible(el as HTMLElement),
        }))
      );
    }

    // Try each input selector - first pass with visibility, second pass without
    let input: HTMLElement | null = null;

    // First try: visible elements only
    for (const selector of inputSelectors) {
      try {
        const el = document.querySelector(selector) as HTMLElement | null;
        if (el && this.isVisible(el)) {
          input = el;
          break;
        }
      } catch (e) {
        // Invalid selector, skip
      }
    }

    // Fallback: any matching element (visibility check may have failed)
    if (!input) {
      for (const selector of inputSelectors) {
        try {
          const el = document.querySelector(selector) as HTMLElement | null;
          if (el) {
            input = el;
            console.log('[SimpleChatBridge] Using fallback input (no visibility check):', selector);
            break;
          }
        } catch (e) {
          // Invalid selector, skip
        }
      }
    }

    // Try each button selector with same fallback logic
    let sendButton: HTMLElement | null = null;

    for (const selector of sendButtonSelectors) {
      try {
        const el = document.querySelector(selector) as HTMLElement | null;
        if (el && this.isVisible(el)) {
          sendButton = el;
          break;
        }
      } catch (e) {
        // Invalid selector, skip
      }
    }

    // Fallback for button
    if (!sendButton) {
      for (const selector of sendButtonSelectors) {
        try {
          const el = document.querySelector(selector) as HTMLElement | null;
          if (el) {
            sendButton = el;
            console.log(
              '[SimpleChatBridge] Using fallback button (no visibility check):',
              selector
            );
            break;
          }
        } catch (e) {
          // Invalid selector, skip
        }
      }
    }

    const isReady = !!(input && sendButton);

    // Enhanced logging with selector diagnostics
    if (!isReady || DEBUG) {
      const logData: any = {
        hasInput: !!input,
        hasSendButton: !!sendButton,
        isReady,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      };

      // Add which selector matched (if any)
      if (input) {
        for (const selector of inputSelectors) {
          try {
            if (document.querySelector(selector) === input) {
              logData.matchedInputSelector = selector;
              break;
            }
          } catch (e) {
            // Invalid selector
          }
        }
      }

      if (sendButton) {
        for (const selector of sendButtonSelectors) {
          try {
            if (document.querySelector(selector) === sendButton) {
              logData.matchedButtonSelector = selector;
              break;
            }
          } catch (e) {
            // Invalid selector
          }
        }
      }

      if (!isReady) {
        console.warn('[SimpleChatBridge] Elements NOT ready:', logData);

        // Provide hints for debugging
        if (!input) {
          console.warn(
            '[SimpleChatBridge] 💡 Enable debug mode: window.__FUSE_DEBUG_SELECTORS = true'
          );
          console.warn(
            '[SimpleChatBridge] 💡 Then reload the page to see all contenteditable elements'
          );
        }
      } else {
        console.log('[SimpleChatBridge] ✅ Elements ready:', logData);
      }
    }

    const result = { input, sendButton, isReady };

    // Update cache if elements are ready
    if (result.isReady) {
      this.cachedElements = result;
      this.cacheValidUntil = Date.now() + this.CACHE_DURATION;
    }

    return result;
  }

  /**
   * Check if element is visible (relaxed check with multiple strategies)
   */
  private isVisible(el: HTMLElement): boolean {
    // Strategy 1: Check if element is connected to DOM and has offsetParent
    // (offsetParent is null for display:none or detached elements)
    if (el.offsetParent !== null) {
      return true;
    }

    // Strategy 2: Try getBoundingClientRect
    try {
      const rect = el.getBoundingClientRect();
      // Element has some dimensions
      if (rect.width > 0 && rect.height > 0) {
        const style = window.getComputedStyle(el);
        // Not explicitly hidden
        if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
          return true;
        }
      }
    } catch (e) {
      // getBoundingClientRect failed - not necessarily invisible
    }

    // Strategy 3: Check if element is in viewport but with zero dimensions
    // (some chat inputs are positioned off-screen or have min-height only)
    try {
      const style = window.getComputedStyle(el);
      if (style.display !== 'none' && style.visibility !== 'hidden') {
        // Element exists in layout tree
        return true;
      }
    } catch (e) {
      // Style check failed
    }

    return false;
  }

  /**
   * Count model responses (for detecting new responses)
   */
  countModelResponses(): number {
    return document.querySelectorAll('model-response').length;
  }

  /**
   * Get latest response text
   */
  getLatestResponse(): string | null {
    const responses = document.querySelectorAll('model-response');
    if (responses.length === 0) return null;

    const lastResponse = responses[responses.length - 1];
    const markdown = lastResponse.querySelector('.markdown');

    if (!markdown) {
      return (lastResponse.textContent || '').trim() || null;
    }

    // Clone and clean up the markdown content
    const clone = markdown.cloneNode(true) as HTMLElement;
    clone
      .querySelectorAll('button, [role="button"], .chip, [class*="action"]')
      .forEach((el) => el.remove());

    const text = (clone.textContent || '').trim();
    return text.length > 0 ? text : null;
  }

  /**
   * Check if AI is currently streaming a response
   */
  isStreaming(): boolean {
    const streamingIndicators = [
      'span[class*="cursor"][class*="blink"]',
      '[class*="thinking"]',
      '[class*="loading-spinner"]',
      '[class*="generating"]',
    ];

    for (const selector of streamingIndicators) {
      if (document.querySelector(selector)) return true;
    }
    return false;
  }

  /**
   * Send a message to the AI - RESTORED FROM BACKUP
   */
  async sendMessage(text: string): Promise<boolean> {
    const { input, sendButton, isReady } = this.findElements();

    if (!isReady || !input || !sendButton) {
      console.error('[SimpleChatBridge] Chat elements not ready');
      this.callbacks.onError?.('Chat elements not found');
      return false;
    }

    try {
      input.focus();
      await this.delay(100);

      // Input simulation
      if (input.getAttribute('contenteditable') === 'true') {
        input.innerHTML = '';
        input.textContent = text;
        input.dispatchEvent(
          new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            inputType: 'insertText',
            data: text,
          })
        );
      } else {
        (input as HTMLTextAreaElement).value = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }

      await this.delay(200);

      // Count responses before sending
      const responsesBefore = this.countModelResponses();
      console.log('[SimpleChatBridge] Responses before send:', responsesBefore);

      // Click send button
      sendButton.click();
      console.log('[SimpleChatBridge] Message sent:', text.substring(0, 50));

      // Start watching for response
      this.startWatchingForResponse(responsesBefore);

      return true;
    } catch (error) {
      console.error('[SimpleChatBridge] Error sending message:', error);
      this.callbacks.onError?.(`Send failed: ${error}`);
      return false;
    }
  }

  /**
   * Inject message (alias for sendMessage)
   */
  async injectMessage(text: string): Promise<boolean> {
    return this.sendMessage(text);
  }

  /**
   * Start watching for AI response
   */
  startWatchingForResponse(responsesBefore: number): void {
    this.isWaitingForResponse = true;
    let stableCount = 0;
    let lastContent = '';

    this.responseCheckInterval = window.setInterval(() => {
      // Check if new response appeared
      if (this.countModelResponses() > responsesBefore) {
        const content = this.getLatestResponse();
        const streaming = this.isStreaming();

        console.log('[SimpleChatBridge] Checking response...', {
          newContent: !!content,
          streaming,
          contentLength: content?.length || 0,
        });

        if (content) {
          if (content !== lastContent || streaming) {
            // Still streaming or content changed
            stableCount = 0;
            lastContent = content;
          } else {
            // Content is stable
            stableCount++;
            if (stableCount >= 2) {
              this.stopWatching();
              if (content !== this.lastResponseText) {
                this.lastResponseText = content;
                console.log('[SimpleChatBridge] Response complete!', content.substring(0, 100));
                this.callbacks.onResponse?.(content);
              }
            }
          }
        }
      }
    }, 1000);

    // Timeout after 60 seconds
    setTimeout(() => {
      if (this.isWaitingForResponse) {
        console.warn('[SimpleChatBridge] Response timeout');
        this.stopWatching();
        this.callbacks.onError?.('Response timeout');
      }
    }, 60000);
  }

  /**
   * Stop watching for response
   */
  stopWatching(): void {
    this.isWaitingForResponse = false;
    if (this.responseCheckInterval) {
      clearInterval(this.responseCheckInterval);
      this.responseCheckInterval = null;
    }
  }

  /**
   * Get last response
   */
  getLastResponse(): string | null {
    return this.getLatestResponse();
  }

  /**
   * Destroy/cleanup
   */
  destroy(): void {
    this.stopWatching();
    if (this.responseObserver) {
      this.responseObserver.disconnect();
      this.responseObserver = null;
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const simpleChatBridge = new SimpleChatBridge();
export default simpleChatBridge;

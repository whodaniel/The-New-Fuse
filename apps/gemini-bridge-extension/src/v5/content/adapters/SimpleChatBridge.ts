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
  private _sendingGuard = false; // Safety guard for UI lag between click and streaming state
  private hasLoggedNotReady = false; // Spam prevention flag

  // ORCHESTRATOR IMPROVEMENT: Element caching to reduce DOM scanning
  private cachedElements: ChatElements | null = null;
  private cacheValidUntil: number = 0;
  private readonly CACHE_DURATION = 10000; // 10 seconds

  // Supported AI chat platforms for element detection logging
  // NOTE: Only include actual AI chat interfaces - thenewfuse.com is NOT a chat interface
  private readonly SUPPORTED_CHAT_PLATFORMS = [
    'gemini.google.com',
    'bard.google.com',
    'chatgpt.com',
    'chat.openai.com',
    'claude.ai',
    'perplexity.ai',
    'poe.com',
    'aistudio.google.com',
    'openclaw-cloud-production-934c.up.railway.app', // OpenClaw cloud control UI
    'localhost:3000', // Local dev with chat
    'localhost:3001', // Local backend
  ];

  /**
   * Check if current page is a supported chat platform
   * Used to suppress noisy logging on non-chat sites
   */
  private isSupportedPlatform(): boolean {
    const hostname = window.location.hostname.toLowerCase();
    return this.SUPPORTED_CHAT_PLATFORMS.some(
      (platform) => hostname === platform || hostname.endsWith('.' + platform)
    );
  }

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
      // The New Fuse (Custom App) - High Priority
      'input[placeholder="Type a message..."]',
      'input[placeholder="Type a message..."][type="text"]',

      // OpenClaw Chat UI
      '.chat-compose textarea',
      'textarea[placeholder*="Message" i]',
      'textarea[placeholder*="start chatting" i]',

      // Gemini 2025+ patterns (highest priority - latest interface)
      'rich-textarea p[contenteditable="true"]',
      'rich-textarea p[data-placeholder]',
      'rich-textarea div[contenteditable="true"]',
      'rich-textarea [contenteditable="true"]',
      // Gemini-specific (high priority) - EXPANDED for 2024+ Gemini updates
      '.ql-editor.textarea[contenteditable="true"]',
      'rich-textarea .ql-editor[contenteditable="true"]',
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
      'p[contenteditable="true"][data-placeholder]',
      // ChatGPT-specific
      '#prompt-textarea',
      'textarea[data-id="root"]',
      'textarea[placeholder*="Message" i]',
      // Claude-specific
      'div[contenteditable="true"][aria-label*="Message" i]',
      // Generic fallbacks
      'div[contenteditable="true"][role="textbox"]',
      'p[contenteditable="true"]',
      'div[contenteditable="true"][data-placeholder]',
      'div[contenteditable="true"]:not([role="button"])',
      'textarea[placeholder*="Ask" i]',
      // Ultra-broad fallback (use with caution)
      'textarea[contenteditable="true"]',
      'div.textarea[contenteditable="true"]',
    ];

    const sendButtonSelectors = [
      // The New Fuse (Custom App) - High Priority
      'button:has(svg path[d="M5 12h14M12 5l7 7-7 7"])', // Exact path match
      'button:has(svg[stroke="currentColor"])', // Generic SVG button match for our app

      // OpenClaw Chat UI
      '.chat-compose button.primary',
      '.chat-compose .btn.primary',
      '.chat-compose button[type="submit"]',

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
      const allContentEditable = Array.from(document.querySelectorAll('[contenteditable="true"]'));
      const allButtons = Array.from(document.querySelectorAll('button[aria-label]'));

      console.log(
        '[SimpleChatBridge DEBUG] All contenteditable elements:',
        allContentEditable.length
      );
      allContentEditable.forEach((el, i) => {
        console.log(`  [${i}]`, {
          tag: el.tagName,
          classes: el.className,
          ariaLabel: el.getAttribute('aria-label'),
          placeholder: el.getAttribute('data-placeholder'),
          parent: el.parentElement?.tagName,
          parentClass: el.parentElement?.className,
          visible: this.isVisible(el as HTMLElement),
        });
      });

      console.log('[SimpleChatBridge DEBUG] All buttons with aria-label:', allButtons.length);
      allButtons.forEach((el, i) => {
        console.log(`  [${i}]`, {
          ariaLabel: el.getAttribute('aria-label'),
          title: el.getAttribute('title'),
          visible: this.isVisible(el as HTMLElement),
        });
      });
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

    // ULTRA FALLBACK: If we still don't have elements, try to find the FIRST visible contenteditable
    // and the FIRST visible button (in desperation mode)
    if (!input && DEBUG) {
      console.warn('[SimpleChatBridge] Ultra fallback: Looking for ANY contenteditable element...');
      const allEditable = Array.from(document.querySelectorAll('[contenteditable="true"]'));
      for (const el of allEditable) {
        if (this.isVisible(el as HTMLElement)) {
          input = el as HTMLElement;
          console.warn('[SimpleChatBridge] Ultra fallback input found:', {
            tag: el.tagName,
            classes: el.className,
            parent: el.parentElement?.tagName,
          });
          break;
        }
      }
    }

    if (!sendButton && DEBUG) {
      console.warn('[SimpleChatBridge] Ultra fallback: Looking for ANY button...');
      const allButtons = Array.from(document.querySelectorAll('button'));
      for (const btn of allButtons) {
        const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
        const title = btn.getAttribute('title')?.toLowerCase() || '';
        if ((ariaLabel.includes('send') || title.includes('send')) && this.isVisible(btn)) {
          sendButton = btn;
          console.warn('[SimpleChatBridge] Ultra fallback button found:', {
            ariaLabel: btn.getAttribute('aria-label'),
            title: btn.getAttribute('title'),
          });
          break;
        }
      }
    }

    const isReady = !!(input && sendButton);
    const result = { input, sendButton, isReady };

    // Enhanced logging with selector diagnostics
    // ONLY log if state changed or debug mode is on to preventing spamming
    const prevStateReady = this.cachedElements ? this.cachedElements.isReady : null;
    const stateChanged = prevStateReady === null || result.isReady !== prevStateReady;

    if (stateChanged || DEBUG) {
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
        // Only log on supported AI chat platforms to avoid noise on non-chat sites
        const isSupportedSite = this.isSupportedPlatform();

        // SPAM PREVENTION: Only log "NOT ready" once per session unless DEBUG is on
        // or state actually changed from ready->not ready
        const shouldLog = (stateChanged && !this.hasLoggedNotReady) || DEBUG;

        // Only log if this is a supported chat platform AND debug mode is on
        // This prevents confusing users on non-chat sites
        if (shouldLog && isSupportedSite && DEBUG) {
          // Add platform info to help debugging on unknown sites
          logData.isKnownPlatform = isSupportedSite;
          this.hasLoggedNotReady = true;

          console.log('[SimpleChatBridge] Elements NOT ready:', logData);

          // Provide hints for debugging
          if (!input) {
            console.log(
              '[SimpleChatBridge] 💡 Enable debug mode: window.__FUSE_DEBUG_SELECTORS = true'
            );
            console.log(
              '[SimpleChatBridge] 💡 Available elements:',
              'contenteditable count:',
              document.querySelectorAll('[contenteditable="true"]').length,
              'buttons with aria-label:',
              document.querySelectorAll('button[aria-label]').length
            );
          }
        } else if (shouldLog && isSupportedSite) {
          // On supported sites without DEBUG, still mark as logged but don't spam console
          this.hasLoggedNotReady = true;
        }
      } else {
        console.log('[SimpleChatBridge] ✅ Elements ready:', logData);
        this.hasLoggedNotReady = false; // Reset so next failure logs again
      }
    }

    // Update cache - ALWAYS update to maintain state tracking, but only set expiry if ready
    this.cachedElements = result;
    if (result.isReady) {
      this.cacheValidUntil = Date.now() + this.CACHE_DURATION;
    } else {
      this.cacheValidUntil = 0; // Force re-scan next time if not ready
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
    // Primary path for Gemini-style UIs
    const modelResponses = document.querySelectorAll('model-response').length;
    if (modelResponses > 0) return modelResponses;

    // OpenClaw chat UI fallback
    const openClawThread = document.querySelector('.chat-thread');
    if (openClawThread) {
      const entries = Array.from(openClawThread.querySelectorAll(':scope > *')).filter((el) => {
        const text = (el.textContent || '').trim();
        return text.length > 0;
      });
      return entries.length;
    }

    // Generic assistant-like message fallback
    const generic = document.querySelectorAll(
      '[data-message-author-role="assistant"], [class*="assistant-message"], [class*="model-response"]'
    ).length;
    return generic;
  }

  /**
   * Get latest response text
   */
  getLatestResponse(): string | null {
    const cleanText = (node: Element | null): string | null => {
      if (!node) return null;
      const clone = node.cloneNode(true) as HTMLElement;
      clone
        .querySelectorAll('button, [role="button"], .chip, [class*="action"], .chat-compose')
        .forEach((el) => el.remove());
      const text = (clone.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return null;
      // Avoid false positives like lone branding emoji or tiny fragments
      if (text.length < 8) return null;
      return text;
    };

    // Primary path for Gemini-style UIs
    const responses = document.querySelectorAll('model-response');
    if (responses.length > 0) {
      const lastResponse = responses[responses.length - 1];
      const markdown = lastResponse.querySelector('.markdown');
      const txt = cleanText(markdown || lastResponse);
      if (txt) return txt;
    }

    // OpenClaw chat UI fallback: only inspect chat-thread scoped entries
    const openClawThread = document.querySelector('.chat-thread');
    if (openClawThread) {
      const candidates = Array.from(openClawThread.querySelectorAll(':scope > *'));
      for (let i = candidates.length - 1; i >= 0; i--) {
        const text = cleanText(candidates[i]);
        if (!text) continue;
        // Skip obvious non-reply/system status text
        const low = text.toLowerCase();
        if (low.includes('disconnected from gateway')) continue;
        if (low === 'openclaw' || low === '🦞') continue;
        return text;
      }
    }

    // Narrow generic fallback to assistant-role only
    const generic = document.querySelectorAll('[data-message-author-role="assistant"]');
    if (generic.length > 0) {
      return cleanText(generic[generic.length - 1]);
    }

    return null;
  }

  /**
   * Check if AI is currently streaming a response
   */
  isStreaming(): boolean {
    if (this._sendingGuard) return true; // Force streaming state if we recently sent a message

    const streamingIndicators = [
      'span[class*="cursor"][class*="blink"]',
      '[class*="thinking"]',
      '[class*="loading-spinner"]',
      '[class*="generating"]',
      'button[aria-label*="Stop response"]',
      'button[aria-label*="Stop generating"]',
      '[data-testid*="stop-button"]',
    ];

    for (const selector of streamingIndicators) {
      const el = document.querySelector(selector);
      if (el && this.isVisible(el as HTMLElement)) return true;
    }
    return false;
  }

  /**
   * Send a message to the AI - Enhanced with button re-fetch and robust clicking
   */
  async sendMessage(text: string): Promise<boolean> {
    const initialElements = this.findElements();

    if (!initialElements.isReady || !initialElements.input) {
      console.error('[SimpleChatBridge] Chat elements not ready');
      this.callbacks.onError?.('Chat elements not found');
      return false;
    }

    // Activate Sending Guard (reduced from 10s to 3s for faster federation)
    // This prevents queue processing during the gap between click and AI streaming start
    this._sendingGuard = true;
    setTimeout(() => {
      this._sendingGuard = false;
    }, 3000); // 3s protection window - balanced for federation speed vs streaming protection

    const input = initialElements.input;

    try {
      // Focus and clear the input
      input.focus();
      await this.delay(100);

      // Input simulation
      if (input.isContentEditable || input.getAttribute('contenteditable') === 'true') {
        // Use document.execCommand for reliable Rich Text Editor interaction
        // This simulates actual user typing events better than setting textContent

        // 1. Clear existing content
        // Try native clear first if safe, otherwise select-all-delete
        if (input.textContent && input.textContent.length > 0) {
          document.execCommand('selectAll', false);
          document.execCommand('delete', false);
        }

        // 2. Insert new text
        const success = document.execCommand('insertText', false, text);

        // Fallback if execCommand failed (or was blocked)
        if (!success || (input.textContent || '').trim() !== text.trim()) {
          console.warn(
            '[SimpleChatBridge] execCommand insertText failed, falling back to direct manipulation'
          );
          input.textContent = text;
          input.dispatchEvent(
            new InputEvent('input', {
              bubbles: true,
              cancelable: true,
              inputType: 'insertText',
              data: text,
            })
          );
        }
      } else {
        (input as HTMLTextAreaElement).value = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Wait for UI to react to the text input
      await this.delay(300);

      // RE-FIND the send button AFTER text input - it may have become enabled
      // Gemini and other chat UIs often disable the send button until there's text
      const updatedElements = this.findElements();
      let sendButton = updatedElements.sendButton;

      if (!sendButton) {
        console.warn('[SimpleChatBridge] Send button not found after text input, retrying...');
        await this.delay(200);
        sendButton = this.findElements().sendButton;
      }

      if (!sendButton) {
        console.error('[SimpleChatBridge] Send button still not found');
        this.callbacks.onError?.('Send button not found');
        return false;
      }

      // Wait for button to be enabled (check disabled attribute)
      let attempts = 0;
      while (sendButton.hasAttribute('disabled') && attempts < 10) {
        await this.delay(100);
        sendButton = this.findElements().sendButton;
        if (!sendButton) break;
        attempts++;
      }

      if (!sendButton || sendButton.hasAttribute('disabled')) {
        console.error('[SimpleChatBridge] Send button is disabled');
        this.callbacks.onError?.('Send button is disabled');
        return false;
      }

      // Count responses before sending
      const responsesBefore = this.countModelResponses();
      console.log('[SimpleChatBridge] Responses before send:', responsesBefore);

      // FIXED: Try send methods ONE AT A TIME, checking for success after each
      // Previously all methods executed causing multiple sends!
      console.log('[SimpleChatBridge] Sending message...');

      // Helper to check if input was cleared (message was sent)
      const inputWasCleared = (): boolean => {
        if (input.isContentEditable || input.getAttribute('contenteditable') === 'true') {
          return !input.textContent || input.textContent.trim().length === 0;
        }
        return (
          !(input as HTMLTextAreaElement).value ||
          (input as HTMLTextAreaElement).value.trim().length === 0
        );
      };

      // Method 1: Simulate Enter key press on the input (most reliable for Gemini)
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true,
      });
      input.dispatchEvent(enterEvent);
      console.log('[SimpleChatBridge] Dispatched Enter keydown on input');

      // Wait and check if it worked
      await this.delay(150);
      if (inputWasCleared()) {
        console.log('[SimpleChatBridge] Message sent via Enter key');
        this.startWatchingForResponse(responsesBefore);
        return true;
      }

      // Method 2: Direct button click (if Enter didn't work)
      if (sendButton) {
        sendButton.click();
        console.log('[SimpleChatBridge] Clicked send button directly');
        await this.delay(150);
        if (inputWasCleared()) {
          console.log('[SimpleChatBridge] Message sent via button click');
          this.startWatchingForResponse(responsesBefore);
          return true;
        }
      }

      // Method 3: Dispatch synthetic MouseEvent on button
      if (sendButton) {
        sendButton.dispatchEvent(
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
          })
        );
        console.log('[SimpleChatBridge] Dispatched MouseEvent click on button');
        await this.delay(150);
        if (inputWasCleared()) {
          console.log('[SimpleChatBridge] Message sent via MouseEvent');
          this.startWatchingForResponse(responsesBefore);
          return true;
        }
      }

      // If we get here, none of the methods worked but we'll start watching anyway
      console.warn('[SimpleChatBridge] All send methods attempted, input may not have cleared');
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
   * ENHANCED: Longer timeout for image/video generation, better content detection
   */
  startWatchingForResponse(responsesBefore: number): void {
    this.isWaitingForResponse = true;
    let stableCount = 0;
    let lastContent = '';
    const initialContent = this.getLatestResponse() || '';

    this.responseCheckInterval = window.setInterval(() => {
      const currentResponseCount = this.countModelResponses();
      const content = this.getLatestResponse();

      // Check if a new response appeared OR existing latest response content changed
      const hasNewResponse = currentResponseCount > responsesBefore;
      const hasUpdatedLatest = !!content && content !== initialContent;

      if (hasNewResponse || hasUpdatedLatest) {
        const streaming = this.isStreaming();

        // Also check for image/media content in the latest response
        const hasMedia = this.checkForMediaContent();

        console.log('[SimpleChatBridge] Checking response...', {
          newContent: !!content,
          streaming,
          contentLength: content?.length || 0,
          hasMedia,
          responseCount: currentResponseCount,
        });

        if (content || hasMedia) {
          const currentContentSignature = `${content || ''}-${hasMedia}`;

          if (currentContentSignature !== lastContent || streaming) {
            // Still streaming or content changed
            stableCount = 0;
            lastContent = currentContentSignature;
          } else {
            // Content is stable
            stableCount++;
            if (stableCount >= 3) {
              // Increased from 2 to 3 for more stability
              this.stopWatching();

              // For media responses, create a placeholder message
              const finalContent = content || (hasMedia ? '[AI generated media content]' : null);

              if (finalContent && finalContent !== this.lastResponseText) {
                this.lastResponseText = finalContent;
                console.log(
                  '[SimpleChatBridge] Response complete!',
                  finalContent.substring(0, 100)
                );
                this.callbacks.onResponse?.(finalContent);
              }
            }
          }
        }
      }
    }, 1000);

    // Timeout after 180 seconds (3 minutes) - enough for image/video generation
    setTimeout(() => {
      if (this.isWaitingForResponse) {
        console.warn('[SimpleChatBridge] Response timeout (after 180s)');
        this.stopWatching();

        // Even on timeout, try to get whatever response is there
        const finalContent = this.getLatestResponse();
        if (finalContent && finalContent !== this.lastResponseText) {
          console.log(
            '[SimpleChatBridge] Captured response on timeout:',
            finalContent.substring(0, 100)
          );
          this.lastResponseText = finalContent;
          this.callbacks.onResponse?.(finalContent);
        } else {
          this.callbacks.onError?.('Response timeout');
        }
      }
    }, 180000); // 3 minutes
  }

  /**
   * Check if the latest response contains media (images, videos)
   */
  private checkForMediaContent(): boolean {
    const responses = document.querySelectorAll('model-response');
    if (responses.length === 0) return false;

    const lastResponse = responses[responses.length - 1];

    // Check for various media elements
    const hasImage = lastResponse.querySelector('img') !== null;
    const hasVideo = lastResponse.querySelector('video') !== null;
    const hasCanvas = lastResponse.querySelector('canvas') !== null;
    const hasIframe = lastResponse.querySelector('iframe') !== null;

    // Check for Gemini-specific image generation indicators
    const hasGeneratedImage =
      lastResponse.querySelector('[data-generated-image]') !== null ||
      lastResponse.querySelector('.generated-image') !== null ||
      lastResponse.querySelector('[class*="image-output"]') !== null;

    return hasImage || hasVideo || hasCanvas || hasIframe || hasGeneratedImage;
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

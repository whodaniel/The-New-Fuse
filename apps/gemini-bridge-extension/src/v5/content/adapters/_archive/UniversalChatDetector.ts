/**
 * Fuse Connect v6 - Universal Chat Detector
 *
 * Finds chat inputs and send buttons on ANY website.
 * Uses site-specific configurations for known AI platforms (Gemini, ChatGPT, Claude, etc.)
 * Falls back to universal detection for unknown sites.
 */

import type { ChatDetectionConfig, DetectedChatElements, StreamingState } from '../../shared/types';
import { getSiteConfig, type SiteConfig } from './SiteConfigs.js';

// Default configuration for universal detection
const DEFAULT_CONFIG: ChatDetectionConfig = {
  // Input detection - ordered by specificity
  inputSelectors: [
    // Contenteditable divs (Claude, Gemini, modern UIs)
    'div[contenteditable="true"][role="textbox"]',
    'div[contenteditable="true"][data-placeholder]',
    'div.ProseMirror[contenteditable="true"]',
    'div[contenteditable="true"]',

    // Textareas (ChatGPT, most sites)
    'textarea[placeholder*="message" i]',
    'textarea[placeholder*="ask" i]',
    'textarea[placeholder*="type" i]',
    'textarea[placeholder*="chat" i]',
    'textarea[placeholder*="write" i]',
    'textarea[placeholder*="send" i]',
    'textarea[aria-label*="message" i]',
    'textarea[aria-label*="chat" i]',
    'textarea[data-testid*="input" i]',
    'textarea[data-testid*="prompt" i]',
    'textarea#prompt-textarea',
    'form textarea',
    'textarea',

    // Input fields
    'input[type="text"][placeholder*="message" i]',
    'input[type="text"][placeholder*="chat" i]',
  ],
  contentEditableCheck: true,
  textareaCheck: true,

  // Send button detection
  sendButtonSelectors: [
    // Explicit send buttons
    'button[data-testid*="send" i]',
    'button[aria-label*="send" i]',
    'button[aria-label*="submit" i]',
    'button[type="submit"]',
    'button.send-button',
    'button.submit-button',

    // Icon buttons (SVG inside)
    'button:has(svg[data-icon="send"])',
    'button:has(svg path[d*="M2.01 21L23 12"])', // Common send arrow
    'button:has(svg path[d*="M15.192"])', // ChatGPT style

    // Form submit buttons
    'form button[type="submit"]',
    'form button:last-of-type',
  ],
  buttonTextPatterns: [/send/i, /submit/i, /ask/i, /go/i, /→/, /➤/, /▶/],
  ariaLabelPatterns: [/send/i, /submit/i, /post/i],

  // Output detection
  messageContainerSelectors: [
    // Gemini 2.0 specific - target the actual conversation scroll area
    'div[class*="conversation-container"]',
    'div[class*="chat-history"]',
    'section[role="log"]',
    '[data-test-id="conversation-turn"]',

    // Gemini response bubbles
    'div[data-message-author-role="model"]',
    'div[class*="model-response"]',
    'div[class*="response-container"]',

    // Generic AI platforms
    'main[role="main"]',
    'div[class*="message-list"]',
    'div[class*="chat-messages"]',
    'div[class*="conversation"]',
    'div[class*="response"]',
    'main div[class*="scroll"]',
    'div[role="log"]',
    'div[aria-live="polite"]',

    // Fallback - main content area
    'main',
  ],
  streamingIndicatorSelectors: [
    // Gemini 2.0 specific - watch for typing/thinking indicators
    'div[class*="thinking"]',
    'div[class*="typing"]',
    'div[class*="streaming"]',
    'span[class*="cursor"][class*="blink"]',
    '[data-is-streaming="true"]',

    // Generic loading indicators
    'div[class*="loading"]',
    'span[class*="loading"]',
    'span[class*="dots"]',
    '.generating',
    '.loading',
  ],

  // Timing
  retryInterval: 500,
  maxRetries: 20,
  inputDebounce: 100,
};

export class UniversalChatDetector {
  private config: ChatDetectionConfig;
  private siteConfig: SiteConfig | null = null;
  private detectedElements: DetectedChatElements | null = null;
  private streamingState: StreamingState = {
    isStreaming: false,
    content: '',
    startedAt: 0,
    lastUpdate: 0,
    observer: null,
  };
  private inputObserver: MutationObserver | null = null;
  private detectionAttempts = 0;
  private lastResponseText = ''; // Track last response to detect changes
  private _lastContentLog = 0; // For debug throttling
  private currentObserverContainer: HTMLElement | null = null; // Track observed container
  private callbacks: {
    onDetected: ((elements: DetectedChatElements) => void)[];
    onStreamingChange: ((state: StreamingState) => void)[];
    onResponse: ((content: string) => void)[];
  } = {
    onDetected: [],
    onStreamingChange: [],
    onResponse: [],
  };

  constructor(config: Partial<ChatDetectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    // Get site-specific config if available
    this.siteConfig = getSiteConfig();

    if (this.siteConfig) {
      // Override default selectors with site-specific ones
      this.config.inputSelectors = [
        ...this.siteConfig.inputSelectors,
        ...this.config.inputSelectors,
      ];
      this.config.sendButtonSelectors = [
        ...this.siteConfig.sendButtonSelectors,
        ...this.config.sendButtonSelectors,
      ];
    }
  }

  /**
   * Start detecting chat elements
   */
  startDetection(): void {
    console.log('[FuseConnect] Starting universal chat detection...');
    this.detectElements();
    this.setupMutationObserver();
  }

  /**
   * Stop detection
   */
  stopDetection(): void {
    if (this.inputObserver) {
      this.inputObserver.disconnect();
      this.inputObserver = null;
    }
    if (this.streamingState.observer) {
      this.streamingState.observer.disconnect();
      this.streamingState.observer = null;
    }
  }

  /**
   * Get current detected elements
   */
  getElements(): DetectedChatElements | null {
    return this.detectedElements;
  }

  /**
   * Register callback for detection events
   */
  onDetected(callback: (elements: DetectedChatElements) => void): () => void {
    this.callbacks.onDetected.push(callback);
    return () => {
      const idx = this.callbacks.onDetected.indexOf(callback);
      if (idx > -1) this.callbacks.onDetected.splice(idx, 1);
    };
  }

  /**
   * Register callback for streaming state changes
   */
  onStreamingChange(callback: (state: StreamingState) => void): () => void {
    this.callbacks.onStreamingChange.push(callback);
    return () => {
      const idx = this.callbacks.onStreamingChange.indexOf(callback);
      if (idx > -1) this.callbacks.onStreamingChange.splice(idx, 1);
    };
  }

  /**
   * Register callback for complete responses
   */
  onResponse(callback: (content: string) => void): () => void {
    this.callbacks.onResponse.push(callback);
    return () => {
      const idx = this.callbacks.onResponse.indexOf(callback);
      if (idx > -1) this.callbacks.onResponse.splice(idx, 1);
    };
  }

  /**
   * Main detection logic
   */
  private detectElements(): void {
    const input = this.findInputElement();
    const sendButton = this.findSendButton(input);
    const messageContainer = this.findMessageContainer();
    const lastMessage = this.findLastMessage(messageContainer);
    const isStreaming = this.checkIfStreaming();

    const confidence = this.calculateConfidence(input, sendButton, messageContainer);

    if (input || sendButton) {
      this.detectedElements = {
        input,
        sendButton,
        messageContainer,
        lastMessage,
        isStreaming,
        confidence,
        detectedAt: Date.now(),
      };

      console.log('[FuseConnect] Chat elements detected:', {
        input: !!input,
        sendButton: !!sendButton,
        confidence,
      });

      // Notify callbacks
      this.callbacks.onDetected.forEach((cb) => cb(this.detectedElements!));

      // Setup streaming observer
      if (messageContainer) {
        this.setupStreamingObserver(messageContainer);
      }
    } else if (this.detectionAttempts < this.config.maxRetries) {
      // Retry detection
      this.detectionAttempts++;
      setTimeout(() => this.detectElements(), this.config.retryInterval);
    }
  }

  /**
   * Find the chat input element
   */
  private findInputElement(): HTMLElement | null {
    for (const selector of this.config.inputSelectors) {
      try {
        const elements = document.querySelectorAll<HTMLElement>(selector);
        for (const el of elements) {
          if (this.isValidInput(el)) {
            return el;
          }
        }
      } catch (e) {
        // Invalid selector
        continue;
      }
    }
    return null;
  }

  /**
   * Validate that an element is a valid chat input
   */
  private isValidInput(el: HTMLElement): boolean {
    // Must be visible
    if (!this.isVisible(el)) return false;

    // Must be editable
    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
      if (el.disabled || el.readOnly) return false;
    } else if (el.getAttribute('contenteditable') !== 'true') {
      return false;
    }

    // Must be large enough (not a search box)
    const rect = el.getBoundingClientRect();
    if (rect.width < 100 || rect.height < 20) return false;

    // Exclude common non-chat inputs
    const excludePatterns = [/search/i, /login/i, /password/i, /email/i, /username/i, /subscribe/i];

    const placeholder = el.getAttribute('placeholder') || '';
    const ariaLabel = el.getAttribute('aria-label') || '';
    const name = el.getAttribute('name') || '';

    for (const pattern of excludePatterns) {
      if (pattern.test(placeholder) || pattern.test(ariaLabel) || pattern.test(name)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Find the send button
   */
  private findSendButton(input: HTMLElement | null): HTMLElement | null {
    // Strategy 1: Look for explicit send buttons
    for (const selector of this.config.sendButtonSelectors) {
      try {
        const elements = document.querySelectorAll<HTMLElement>(selector);
        for (const el of elements) {
          if (this.isValidSendButton(el)) {
            return el;
          }
        }
      } catch (e) {
        continue;
      }
    }

    // Strategy 2: Look near the input
    if (input) {
      const nearby = this.findNearbyButton(input);
      if (nearby) return nearby;
    }

    // Strategy 3: Look for buttons with send-like text/icons
    const allButtons = document.querySelectorAll<HTMLElement>('button');
    for (const btn of allButtons) {
      if (this.isSendButton(btn)) {
        return btn;
      }
    }

    return null;
  }

  /**
   * Check if button is a valid send button
   */
  private isValidSendButton(el: HTMLElement): boolean {
    if (!this.isVisible(el)) return false;
    if (el.hasAttribute('disabled')) return false;

    return this.isSendButton(el);
  }

  /**
   * Check button text/aria-label for send patterns
   */
  private isSendButton(el: HTMLElement): boolean {
    const text = el.textContent?.toLowerCase() || '';
    const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
    const title = el.getAttribute('title')?.toLowerCase() || '';

    // Check text patterns
    for (const pattern of this.config.buttonTextPatterns) {
      if (pattern.test(text) || pattern.test(ariaLabel) || pattern.test(title)) {
        return true;
      }
    }

    // Check for arrow/send icons (SVG)
    if (el.querySelector('svg')) {
      // Look for common send icon patterns
      const svg = el.querySelector('svg');
      const paths = svg?.querySelectorAll('path');
      if (paths && paths.length > 0) {
        // Common send arrow paths contain specific d attributes
        for (const path of paths) {
          const d = path.getAttribute('d') || '';
          if (d.includes('M2.01') || d.includes('M15.192') || d.includes('M3.478')) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Find button near the input element
   */
  private findNearbyButton(input: HTMLElement): HTMLElement | null {
    // Check parent elements for nearby buttons
    let parent = input.parentElement;
    let depth = 0;

    while (parent && depth < 5) {
      const buttons = parent.querySelectorAll<HTMLElement>('button');
      for (const btn of buttons) {
        if (this.isVisible(btn) && !btn.hasAttribute('disabled')) {
          // Prefer buttons after the input
          const inputRect = input.getBoundingClientRect();
          const btnRect = btn.getBoundingClientRect();

          // Button should be on the right or below input
          if (btnRect.left >= inputRect.right - 100 || btnRect.top >= inputRect.top) {
            return btn;
          }
        }
      }

      parent = parent.parentElement;
      depth++;
    }

    return null;
  }

  /**
   * Find message container
   */
  private findMessageContainer(): HTMLElement | null {
    for (const selector of this.config.messageContainerSelectors) {
      try {
        const el = document.querySelector<HTMLElement>(selector);
        if (el && this.isVisible(el)) {
          return el;
        }
      } catch (e) {
        continue;
      }
    }
    return null;
  }

  /**
   * Find last message in container
   */
  private findLastMessage(container: HTMLElement | null): HTMLElement | null {
    if (!container) return null;

    // Look for message-like elements
    const messageSelectors = [
      'div[data-message-author-role]',
      'div[class*="message"]',
      'div[class*="response"]',
      'article',
    ];

    for (const selector of messageSelectors) {
      try {
        const messages = container.querySelectorAll<HTMLElement>(selector);
        if (messages.length > 0) {
          return messages[messages.length - 1];
        }
      } catch (e) {
        continue;
      }
    }

    return (container.lastElementChild as HTMLElement) || null;
  }

  /**
   * Check if AI is currently streaming a response
   */
  private checkIfStreaming(): boolean {
    // Priority: Use SiteConfig specific logic if available
    if (this.siteConfig?.isFinal) {
      try {
        const doc = document;
        // Pass a relevant element if we have one, otherwise null
        const contextEl =
          this.detectedElements?.messageContainer || this.detectedElements?.lastMessage || null;
        // If isFinal returns true, then we are NOT streaming
        return !this.siteConfig.isFinal(contextEl, doc);
      } catch (e) {
        console.warn('[FuseConnect] Error in site-specific isFinal check:', e);
      }
    }

    // Fallback: Use selector-based detection
    for (const selector of this.config.streamingIndicatorSelectors) {
      try {
        if (document.querySelector(selector)) {
          return true;
        }
      } catch (e) {
        continue;
      }
    }
    return false;
  }

  /**
   * Calculate detection confidence
   */
  private calculateConfidence(
    input: HTMLElement | null,
    sendButton: HTMLElement | null,
    container: HTMLElement | null
  ): number {
    let confidence = 0;

    if (input) {
      confidence += 0.4;
      // Bonus for contenteditable (modern AI UIs)
      if (input.getAttribute('contenteditable') === 'true') {
        confidence += 0.1;
      }
    }

    if (sendButton) {
      confidence += 0.3;
    }

    if (container) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1);
  }

  /**
   * Check element visibility
   */
  private isVisible(el: HTMLElement): boolean {
    if (!el) return false;

    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }

    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  /**
   * Setup observer for DOM changes
   * Guards against infinite loops with debouncing
   */
  private setupMutationObserver(): void {
    if (this.inputObserver) return;

    let debounceTimer: number | null = null;
    let lastCheck = 0;

    this.inputObserver = new MutationObserver(() => {
      // Only check every 2 seconds max to prevent infinite loops
      const now = Date.now();
      if (now - lastCheck < 2000) return;

      if (debounceTimer) return;

      debounceTimer = setTimeout(() => {
        lastCheck = Date.now();
        debounceTimer = null;

        // Re-detect only if current elements are really gone
        if (this.detectedElements) {
          const inputGone =
            this.detectedElements.input && !document.body.contains(this.detectedElements.input);
          const buttonGone =
            this.detectedElements.sendButton &&
            !document.body.contains(this.detectedElements.sendButton);

          if (inputGone || buttonGone) {
            console.log('[FuseConnect] Elements removed from DOM, re-detecting...');
            this.detectionAttempts = 0;
            this.detectElements();
          }
        }
      }, 500) as unknown as number;
    });

    this.inputObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Setup observer for streaming responses
   * Simple, resilient approach - detect content changes and fire when stable
   */
  private setupStreamingObserver(container: HTMLElement): void {
    // Guard: Don't re-create if already observing same container
    if (this.streamingState.observer && this.currentObserverContainer === container) {
      return; // Already watching this container
    }

    if (this.streamingState.observer) {
      this.streamingState.observer.disconnect();
    }

    this.currentObserverContainer = container;

    let lastContent = '';
    let idleTimer: number | null = null;
    // Use site config debounce or default
    const debounceMs = this.siteConfig?.debounceMs || 2000;

    console.log('[FuseConnect] Streaming observer started on new container');

    this.streamingState.observer = new MutationObserver(() => {
      // Get the latest response using unified logic
      const currentContent = this.getLastResponse() || '';

      // Check if streaming indicators are present
      const isStreaming = this.checkIfStreaming();
      const isFinal = !isStreaming; // If not streaming, we consider it potentially final

      if (currentContent && currentContent !== lastContent) {
        lastContent = currentContent;
        this.streamingState.lastUpdate = Date.now();
        this.streamingState.content = currentContent;

        if (!this.streamingState.isStreaming) {
          // Streaming started
          this.streamingState.isStreaming = true;
          this.streamingState.startedAt = Date.now();
          this.callbacks.onStreamingChange.forEach((cb) => cb(this.streamingState));
          console.log('[FuseConnect] Response streaming started, length:', currentContent.length);
        }

        // Reset idle timer
        if (idleTimer) {
          clearTimeout(idleTimer);
        }

        // Consider streaming complete after debounce time or if explicitly final
        if (isFinal && this.streamingState.isStreaming) {
          // Site explicitly says we're done - fire immediately
          this.completeResponse();
        } else {
          // Wait for idle period before considering complete
          idleTimer = setTimeout(() => {
            if (this.streamingState.isStreaming) {
              this.completeResponse();
            }
          }, debounceMs) as unknown as number;
        }
      } else if (this.streamingState.isStreaming && isFinal) {
        // Content stopped changing and site says we're done
        this.completeResponse();
      }
    });

    this.streamingState.observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  /**
   * Complete the current response and fire callbacks
   */
  private completeResponse(): void {
    if (!this.streamingState.isStreaming) return;

    this.streamingState.isStreaming = false;
    console.log('[FuseConnect] Response complete, length:', this.streamingState.content.length);

    // Only fire if content is different from last response
    if (
      this.streamingState.content !== this.lastResponseText &&
      this.streamingState.content.length > 10
    ) {
      this.lastResponseText = this.streamingState.content;
      this.callbacks.onStreamingChange.forEach((cb) => cb(this.streamingState));
      this.callbacks.onResponse.forEach((cb) => cb(this.streamingState.content));
    }
  }

  /**
   * Send a message using detected elements
   */
  async sendMessage(text: string): Promise<boolean> {
    if (!this.detectedElements?.input) {
      console.warn('[FuseConnect] No input element detected');
      return false;
    }

    const { input } = this.detectedElements;

    try {
      console.log('[FuseConnect] Starting message injection...');

      // Focus input
      input.focus();
      await this.delay(100);

      // Set value with proper event simulation
      await this.setInputValue(input, text);

      // Wait longer for contenteditable elements (Gemini, Claude)
      const isContentEditable = input.getAttribute('contenteditable') === 'true';
      await this.delay(isContentEditable ? 500 : 200);

      // Re-detect send button after content is set (it may have changed state)
      const sendButton = await this.findSendButtonNow();

      console.log('[FuseConnect] Send button found:', !!sendButton, sendButton?.tagName);

      // Try to click send button
      if (sendButton && this.isVisible(sendButton) && !sendButton.hasAttribute('disabled')) {
        console.log('[FuseConnect] Clicking send button...');

        // Simulate mouse events for better compatibility
        sendButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        await this.delay(50);
        sendButton.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        sendButton.click();

        console.log('[FuseConnect] Message sent via button click');
        return true;
      }

      // Fallback: Try Enter key on the input element
      console.log('[FuseConnect] Send button not available, trying Enter key...');

      input.focus();
      await this.delay(100);

      // For contenteditable, simulate a more complete keyboard event sequence
      if (isContentEditable) {
        const enterKeyInit = {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true,
        };

        input.dispatchEvent(new KeyboardEvent('keydown', enterKeyInit));
        await this.delay(50);
        input.dispatchEvent(new KeyboardEvent('keypress', enterKeyInit));
        await this.delay(50);
        input.dispatchEvent(new KeyboardEvent('keyup', enterKeyInit));
      } else {
        // For textarea/input, also try submitting the parent form
        const form = input.closest('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }

        input.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            bubbles: true,
          })
        );
      }

      console.log('[FuseConnect] Message sent via Enter key');
      return true;
    } catch (error) {
      console.error('[FuseConnect] Error sending message:', error);
      return false;
    }
  }

  /**
   * Find send button at current moment (re-detection)
   */
  private async findSendButtonNow(): Promise<HTMLElement | null> {
    // Try specific selectors first
    const specificSelectors = [
      // Gemini-specific
      'button[aria-label*="Send message"]',
      'button[aria-label*="send" i]',
      'button[data-testid*="send" i]',
      // Generic
      'button[type="submit"]:not([disabled])',
      'button.send-button:not([disabled])',
    ];

    for (const selector of specificSelectors) {
      try {
        const btn = document.querySelector<HTMLElement>(selector);
        if (btn && this.isVisible(btn) && !btn.hasAttribute('disabled')) {
          return btn;
        }
      } catch (e) {
        continue;
      }
    }

    // Look for buttons with send icon (arrow pointing right/up)
    const allButtons = document.querySelectorAll<HTMLElement>('button');
    for (const btn of allButtons) {
      if (!this.isVisible(btn) || btn.hasAttribute('disabled')) continue;

      const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
      const title = btn.getAttribute('title')?.toLowerCase() || '';

      if (ariaLabel.includes('send') || title.includes('send')) {
        return btn;
      }

      // Check for SVG arrow icons
      const svg = btn.querySelector('svg');
      if (svg) {
        const paths = svg.querySelectorAll('path');
        for (const path of paths) {
          const d = path.getAttribute('d') || '';
          // Common send arrow path patterns
          if (d.includes('M2') || d.includes('M3') || d.includes('M1.946')) {
            return btn;
          }
        }
      }
    }

    return this.detectedElements?.sendButton || null;
  }

  /**
   * Set input value - handles both textarea/input elements and contenteditable divs
   */
  private async setInputValue(input: HTMLElement, text: string): Promise<void> {
    if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
      // Standard textarea/input
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (input.getAttribute('contenteditable') === 'true') {
      // ContentEditable (Gemini, Claude, etc.)
      input.focus();

      // Use execCommand to simulate user typing which triggers all native events
      // Do NOT directly set innerHTML because that often breaks Framework bindings (React, Angular, Quill)
      try {
        // Select all existing text first so we replace it
        document.execCommand('selectAll', false, undefined);

        // Insert the new text - this simulates a paste/type action perfectly
        const success = document.execCommand('insertText', false, text);

        // If execCommand failed or didn't work, try fallback
        if (!success) {
          throw new Error('execCommand returned false');
        }
      } catch (e) {
        // Fallback: Manually set textContent but this is risky for rich editors
        console.warn('[FuseConnect] execCommand failed, using fallback', e);
        input.textContent = text;
      }

      // Dispatch comprehensive set of events to ensure frameworks detect the change
      const events = [
        new InputEvent('beforeinput', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: text,
        }),
        new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: text,
        }),
        new Event('change', { bubbles: true }),
      ];

      events.forEach((event) => input.dispatchEvent(event));

      console.log('[FuseConnect] Set contenteditable value:', text.substring(0, 50) + '...');
    }
  }

  /**
   * Wait for send button to become enabled
   */
  private async waitForSendButton(button: HTMLElement | null, timeout: number): Promise<void> {
    if (!button) return;

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (!button.hasAttribute('disabled') && this.isVisible(button)) {
        return;
      }
      await this.delay(100);
    }
  }

  /**
   * Get last response content - improved for Gemini and other platforms
   */
  /**
   * Helper: Clean response text
   */
  private cleanResponseText(text: string | null | undefined): string | null {
    if (!text) return null;
    let cleaned = text.trim();

    // Remove relay prefixes
    cleaned = cleaned.replace(/\[User → AI\]\s*/g, '');
    cleaned = cleaned.replace(/\[AI → User\]\s*/g, '');
    cleaned = cleaned.replace(/\[AI Response\]\s*/g, '');

    // UI text filter list
    const uiTextToFilter = [
      'Show thinking',
      'Hide thinking',
      'Show code',
      'Hide code',
      'Copy',
      'Copy code',
      'Edit',
      'Share',
      'Good response',
      'Bad response',
      'Regenerate',
      'More',
      'Code output',
      'Run',
      'Python',
      'JavaScript',
    ];

    // Remove common UI button text from start and end
    for (const uiText of uiTextToFilter) {
      const startRegex = new RegExp(`^${uiText}\\s*`, 'i');
      cleaned = cleaned.replace(startRegex, '');
      const endRegex = new RegExp(`\\s*${uiText}$`, 'i');
      cleaned = cleaned.replace(endRegex, '');
    }

    // Remove code block patterns
    cleaned = cleaned.replace(/Python\s*\n?print\s*\([^)]+\)\s*\n?/gi, '');
    cleaned = cleaned.replace(/Code output\s*\n?\d+\s*\n?/gi, '');
    cleaned = cleaned.replace(/JavaScript\s*\n?console\.log\s*\([^)]+\)\s*\n?/gi, '');

    // Remove "Show thinking" / "Hide thinking" anywhere
    cleaned = cleaned.replace(/(Show|Hide)\s*(thinking|code)/gi, '');

    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Skip echo messages
    if (
      cleaned.includes('[User → AI]') ||
      cleaned.includes('[AI → User]') ||
      cleaned.includes('[AI Response]')
    ) {
      return null;
    }

    return cleaned.length > 5 ? cleaned : null;
  }

  /**
   * Get the latest response content - Config-aware, Unified Strategy
   * Replaces both old getLastResponse and getLatestResponseContent
   */
  getLastResponse(): string | null {
    // Strategy 0: Site-specific configuration (Highest Priority)
    if (this.siteConfig?.msgSelector) {
      try {
        const elements = document.querySelectorAll<HTMLElement>(this.siteConfig.msgSelector);
        if (elements.length > 0) {
          // Assume last element is the latest response
          const lastEl = elements[elements.length - 1];
          const clone = lastEl.cloneNode(true) as HTMLElement;
          // Strip interaction elements
          clone
            .querySelectorAll(
              'button, [role="button"], .chip, [class*="action"], [class*="toolbar"]'
            )
            .forEach((el) => el.remove());

          const text = this.cleanResponseText(clone.textContent);
          if (text) return text;
        }
      } catch (e) {
        // Fallback to other strategies
      }
    }

    // Strategy 1: Google Accessible Text (div[dir="ltr"]) - Very reliable for many sites
    // We scan BACKWARDS to find the LATEST valid response.
    const elements = document.querySelectorAll<HTMLElement>('div[dir="ltr"]');
    const startIdx = elements.length - 1;
    const endIdx = Math.max(0, startIdx - 5);

    for (let i = startIdx; i >= endIdx; i--) {
      const el = elements[i];
      // Skip user inputs and explicit user messages
      if (
        el.isContentEditable ||
        el.closest('[contenteditable="true"]') ||
        el.getAttribute('data-message-author-role') === 'user' ||
        el.closest('[data-message-author-role="user"]')
      )
        continue;

      const clone = el.cloneNode(true) as HTMLElement;
      clone
        .querySelectorAll('button, [role="button"], [aria-hidden="true"], .action-area, .tooltip')
        .forEach((e) => e.remove());

      const text = this.cleanResponseText(clone.innerText);
      if (text && text.length > 20) {
        return text;
      }
    }

    // Strategy 2: Gemini 2.0 / Standard Model Response Containers
    // This section is updated based on the provided instruction, assuming the instruction
    // intended to update the selectors used for Gemini/Standard Model responses.
    // The `msgSelector` and `containerSelector` syntax looks like it belongs in a site config,
    // but given the instruction to apply the "Code Edit" here, it's interpreted as
    // replacing the `geminiSelectors` array with these new selectors.
    const geminiSelectors = [
      'div[data-message-author-role="model"]',
      '.model-response-text',
      'model-response',
      // Safe fallback that excludes user explicitly
      '[class*="model-response"]:not([data-message-author-role="user"])',
      // Generic AI
      '[data-message-author-role="assistant"]',
      '[class*="assistant-message"]',
    ];

    for (const selector of geminiSelectors) {
      const els = document.querySelectorAll<HTMLElement>(selector);
      if (els.length > 0) {
        const lastEl = els[els.length - 1];
        const clone = lastEl.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('button, [role="button"], .chip').forEach((el) => el.remove());
        const text = this.cleanResponseText(clone.textContent);
        if (text) return text;
      }
    }

    // Strategies 3 & 4 (Fallbacks) are disabled if we have a site-specific config.
    // This prevents falling back to "dumb" detection (like capturing the whole container)
    // when we are on a known site but the specific selectors temporarily failed.
    if (this.siteConfig) {
      return null;
    }

    // Strategy 3: Detected Last Message Fallback
    if (this.detectedElements?.lastMessage) {
      const clone = this.detectedElements.lastMessage.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('button, [role="button"]').forEach((el) => el.remove());
      const text = this.cleanResponseText(clone.textContent);
      if (text) return text;
    }

    // Strategy 4: Container Text Fallback
    if (this.detectedElements?.messageContainer) {
      const container = this.detectedElements.messageContainer;
      // Direct children check
      const children = container.querySelectorAll(':scope > *');
      if (children.length > 0) {
        const lastChild = children[children.length - 1] as HTMLElement;
        const clone = lastChild.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('button, [role="button"]').forEach((el) => el.remove());
        const text = this.cleanResponseText(clone.textContent);
        if (text) return text;
      }
    }

    return null;
  }

  /**
   * Wait for a new response to appear (polling-based detection)
   */
  async waitForResponse(timeout: number = 30000): Promise<string | null> {
    const startTime = Date.now();
    const initialContent = this.getLastResponse() || '';

    console.log(
      '[FuseConnect] Waiting for response... Initial content length:',
      initialContent.length
    );
    console.log('[FuseConnect] Initial content preview:', initialContent.substring(0, 100));

    let lastSeenContent = initialContent;
    let stableCount = 0;

    while (Date.now() - startTime < timeout) {
      await this.delay(1000); // Poll every second

      const currentContent = this.getLastResponse();

      console.log('[FuseConnect] Polling... Current content length:', currentContent?.length || 0);

      // Check if we got new content that's different from initial
      if (currentContent && currentContent !== initialContent) {
        // Check if content is stable (same for 2 consecutive checks)
        if (currentContent === lastSeenContent) {
          stableCount++;
          console.log('[FuseConnect] Content stable, count:', stableCount);

          if (stableCount >= 2) {
            // Content has been stable for 2+ seconds, response is complete
            console.log('[FuseConnect] Response detected! Length:', currentContent.length);
            return currentContent;
          }
        } else {
          // Content changed, reset stable counter
          stableCount = 0;
          lastSeenContent = currentContent;
          console.log('[FuseConnect] Content still changing...');
        }
      }

      // Check if streaming state indicates completion
      if (this.streamingState.content && !this.streamingState.isStreaming) {
        if (
          this.streamingState.content !== initialContent &&
          this.streamingState.content.length > 50
        ) {
          console.log('[FuseConnect] Response from streaming state');
          return this.streamingState.content;
        }
      }
    }

    console.log('[FuseConnect] Response timeout after', timeout, 'ms');
    return null;
  }

  /**
   * Utility delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton
export const universalChatDetector = new UniversalChatDetector();

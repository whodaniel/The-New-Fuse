/**
 * Fuse Connect v7 - Simple Chat Bridge
 *
 * NOTE: This file still contains legacy v5 comments, but it is used by the current extension build.
 *
 * Cloudflare upgrade (2026-02): when a target UI is unreliable (e.g. OpenClaw cloud
 * transcript rendering issues), we can use the TNF Agent Orchestration worker as a
 * canonical transcript store and poll it from the content script.
 */

export interface ChatElements {
  input: HTMLElement | null;
  sendButton: HTMLElement | null;
  isReady: boolean;
}

export interface ChatBridgeCallbacks {
  // Called when we detect assistant output (DOM scrape or TNF transcript poll)
  onResponse?: (content: string) => void;
  onError?: (error: string) => void;

  // Optional: raw transcript events (edge DO)
  onTranscriptEntry?: (entry: { role: string; content: string; ts: number; seq?: number }) => void;
}

import { DEFAULT_NODES } from '../../shared/constants';
import { TnfTranscriptClient } from '../utils/TnfTranscriptClient';

class SimpleChatBridge {
  private lastResponseText = '';
  private responseObserver: MutationObserver | null = null;
  private callbacks: ChatBridgeCallbacks = {};
  private isWaitingForResponse = false;
  private responseCheckInterval: number | null = null;
  private responseTimeoutTimer: number | null = null;
  private _sendingGuard = false; // Safety guard for UI lag between click and streaming state

  // TNF Transcript polling (Cloudflare DO)
  private transcriptClient: TnfTranscriptClient | null = null;
  private transcriptPollTimer: number | null = null;
  private transcriptLastSeq: number = 0;

  // ORCHESTRATOR IMPROVEMENT: Element caching to reduce DOM scanning
  private cachedElements: ChatElements | null = null;
  private cacheValidUntil: number = 0;
  private readonly CACHE_DURATION = 10000; // 10 seconds
  private lastSentText = '';

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
    'localhost:3000', // Local dev with chat
    'localhost:3001', // Local backend
  ];

  private customSites: string[] = [];

  /**
   * Guard against matching Fuse extension UI elements while scanning the page.
   * We only want host-page chat inputs/buttons, not our own floating panel controls.
   */
  private isExtensionUiElement(el: Element | null): boolean {
    if (!el) return false;
    return !!el.closest(
      [
        '#fuse-connect-panel-v7',
        '#fuse-connect-panel',
        '#fuse-panel-minimized',
        '[data-testid="fuse-connect-panel"]',
        '[data-testid="fuse-panel-content"]',
        '.fcp6-panel',
        '.fcp6-input-row',
      ].join(', ')
    );
  }

  /**
   * Check if current page is a supported chat platform
   * Used to suppress noisy logging on non-chat sites
   */
  private isSupportedPlatform(): boolean {
    return true; // Gemini Bridge extension supports all platforms it is injected into
  }

  /**
   * Initialize the bridge with callbacks
   */
  init(callbacks: ChatBridgeCallbacks): void {
    this.callbacks = callbacks;
    // Suppress initialization log unless explicitly debugging or first time
    if ((window as any).__FUSE_DEBUG_SELECTORS) {
      console.log('[SimpleChatBridge] Initialized');
    }

    // Load custom sites from storage
    this.loadCustomSites();

    // Always enable transcript polling on OpenClaw cloud UI (DOM rendering is currently unreliable there).
    // This will power the TNF injectable modal with canonical state from Cloudflare.
    try {
      const host = window.location.hostname.toLowerCase();
      if (host.includes('openclaw-cloud') || host.endsWith('up.railway.app')) {
        const workerUrl = DEFAULT_NODES.tnfWorker;
        const sessionKey = this.deriveSessionKey();
        this.enableTranscriptPolling(workerUrl, sessionKey);
      }
    } catch (e) {
      // non-fatal
    }
  }

  /**
   * Load custom allowed sites from storage
   */
  private loadCustomSites(): void {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['fuse_settings'], (result) => {
        if (result.fuse_settings && result.fuse_settings.allowedSites) {
          this.customSites = result.fuse_settings.allowedSites;
          if ((window as any).__FUSE_DEBUG_SELECTORS) {
            console.log('[SimpleChatBridge] Loaded custom sites:', this.customSites);
          }
        }
      });
    }
  }

  /**
   * Derive a stable sessionKey for Cloudflare transcript storage.
   * Best effort: host + OpenClaw session query param (if present).
   */
  private deriveSessionKey(): string {
    const host = window.location.hostname.toLowerCase();
    const url = new URL(window.location.href);
    const session = url.searchParams.get('session') || 'main';
    return `openclaw-ui:${host}:session:${session}`;
  }

  private enableTranscriptPolling(workerUrl: string, sessionKey: string): void {
    // Avoid double-start
    if (this.transcriptPollTimer) return;

    this.transcriptClient = new TnfTranscriptClient(workerUrl, sessionKey);

    const poll = async () => {
      if (!this.transcriptClient) return;
      try {
        // First pull: load latest and set cursor.
        if (this.transcriptLastSeq === 0) {
          const { lastSeq, entries } = await this.transcriptClient.latest(50);
          this.transcriptLastSeq = lastSeq || 0;
          for (const e of entries) {
            this.callbacks.onTranscriptEntry?.({
              role: e.role,
              content: e.content,
              ts: e.ts,
              seq: e.seq,
              id: e.id,
            });
            // CRITICAL FIX: Polled transcript entries from Cloudflare are for DISPLAY ONLY.
            // We must NEVER call onResponse() here, because onResponse() triggers the "Response Complete"
            // flow which broadcasts back to the relay, creating an infinite loop.
            // Scraped responses from the actual page DOM are still handled by the MutationObserver.
          }
          return;
        }

        const { lastSeq, entries } = await this.transcriptClient.since(this.transcriptLastSeq, 200);
        for (const e of entries) {
          this.transcriptLastSeq = Math.max(
            this.transcriptLastSeq,
            e.seq || this.transcriptLastSeq
          );
          this.callbacks.onTranscriptEntry?.({
            role: e.role,
            content: e.content,
            ts: e.ts,
            seq: e.seq,
            id: e.id,
          });
          // CRITICAL FIX: Same as above. Polled entries are for UI rendering only.
        }
        this.transcriptLastSeq = Math.max(this.transcriptLastSeq, lastSeq || 0);
      } catch (err: any) {
        this.callbacks.onError?.(String(err?.message || err));
      }
    };

    // Kick off now, then poll.
    poll();
    this.transcriptPollTimer = window.setInterval(poll, 1500);
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

    // IMPORTANT: Always attempt generic detection, including unknown sites.
    // We only use support status to tune logging verbosity, not to disable detection.
    const isSupportedSite = this.isSupportedPlatform();

    const hostname = window.location.hostname.toLowerCase();
    const isQwenHost = hostname === 'chat.qwen.ai' || hostname.endsWith('.qwen.ai');

    // Platform-specific selectors (most reliable first)
    const inputSelectors = [
      // Qwen-specific (activate when on qwen host)
      ...(isQwenHost
        ? [
            'textarea[data-testid*="chat" i]',
            'textarea[data-testid*="input" i]',
            'textarea[data-testid*="compose" i]',
            'textarea[data-testid*="prompt" i]',
            'textarea[placeholder*="Send" i]',
            'textarea[placeholder*="message" i]',
            'textarea[aria-label*="chat" i]',
            'textarea[aria-label*="message" i]',
            'form textarea',
            'main textarea',
            'textarea',
            'div[contenteditable="true"][role="textbox"]',
            'div[contenteditable="true"][data-testid*="input" i]',
            'div[role="textbox"][contenteditable="true"]',
          ]
        : []),

      // The New Fuse (Custom App) - High Priority
      'input[placeholder="Type a message..."]',
      'input[placeholder="Type a message..."][type="text"]',

      // OpenClaw Chat UI
      '.chat-compose textarea',
      'textarea[placeholder*="Message" i]',
      'textarea[placeholder*="start chatting" i]',

      // Perplexity (New 2025)
      'textarea[placeholder*="Ask" i]',
      'textarea[placeholder*="follow-up" i]',
      'div[class*="search-bar-input"] textarea',

      // Gemini 2025+ patterns (highest priority - latest interface)
      'side-panel-chat textarea',
      'side-panel-chat [contenteditable="true"]',
      'gemini-sidebar-input textarea',
      '#gemini-chat-input',
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
      'form textarea',
      'main textarea',
      'textarea',
      // Ultra-broad fallback (use with caution)
      'textarea[contenteditable="true"]',
      'div.textarea[contenteditable="true"]',
    ];

    const sendButtonSelectors = [
      // Qwen-specific (activate when on qwen host)
      ...(isQwenHost
        ? [
            'button[data-testid*="send" i]',
            'button[aria-label*="Send" i]',
            'button[title*="Send" i]',
            'form button[type="submit"]',
          ]
        : []),

      // The New Fuse (Custom App) - High Priority
      'button:has(svg path[d="M5 12h14M12 5l7 7-7 7"])', // Exact path match
      'button:has(svg[stroke="currentColor"])', // Generic SVG button match for our app

      // OpenClaw Chat UI
      '.chat-compose button.primary',
      '.chat-compose .btn.primary',
      '.chat-compose button[type="submit"]',

      // Perplexity (New 2025)
      'button[aria-label="Submit"]',
      'button[aria-label="Send"]',
      'div[class*="search-bar"] button:not([disabled])',

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
        const candidates = this.queryAllIncludingShadow(selector);
        for (const el of candidates) {
          if (this.isExtensionUiElement(el)) continue;
          if (this.isVisible(el)) {
            input = el;
            break;
          }
        }
        if (input) break;
      } catch (e) {
        // Invalid selector, skip
      }
    }

    // Fallback: any matching element (visibility check may have failed)
    if (!input) {
      for (const selector of inputSelectors) {
        try {
          const candidates = this.queryAllIncludingShadow(selector);
          for (const el of candidates) {
            if (this.isExtensionUiElement(el)) continue;
            input = el;
            if (DEBUG) {
              console.log(
                '[SimpleChatBridge] Using fallback input (no visibility check):',
                selector
              );
            }
            break;
          }
          if (input) break;
        } catch (e) {
          // Invalid selector, skip
        }
      }
    }

    // Try each button selector with same fallback logic
    let sendButton: HTMLElement | null = null;

    for (const selector of sendButtonSelectors) {
      try {
        const candidates = this.queryAllIncludingShadow(selector);
        for (const el of candidates) {
          if (this.isExtensionUiElement(el)) continue;
          if (this.isVisible(el)) {
            sendButton = el;
            break;
          }
        }
        if (sendButton) break;
      } catch (e) {
        // Invalid selector, skip
      }
    }

    // Fallback for button
    if (!sendButton) {
      for (const selector of sendButtonSelectors) {
        try {
          const candidates = this.queryAllIncludingShadow(selector);
          for (const el of candidates) {
            if (this.isExtensionUiElement(el)) continue;
            sendButton = el;
            if (DEBUG) {
              console.log(
                '[SimpleChatBridge] Using fallback button (no visibility check):',
                selector
              );
            }
            break;
          }
          if (sendButton) break;
        } catch (e) {
          // Invalid selector, skip
        }
      }
    }

    // Non-debug fallback: accept any visible textarea outside extension UI.
    if (!input) {
      const allTextareas = this.queryAllIncludingShadow('textarea');
      for (const el of allTextareas) {
        if (this.isExtensionUiElement(el)) continue;
        if (this.isVisible(el) && !(el as HTMLTextAreaElement).disabled) {
          input = el;
          break;
        }
      }
    }

    // ULTRA FALLBACK: If we still don't have elements, try to find the FIRST visible contenteditable
    // and the FIRST visible button (in desperation mode)
    if (!input && DEBUG) {
      console.warn('[SimpleChatBridge] Ultra fallback: Looking for ANY contenteditable element...');
      const allEditable = Array.from(document.querySelectorAll('[contenteditable="true"]'));
      for (const el of allEditable) {
        if (this.isExtensionUiElement(el)) continue;
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

      if (!input) {
        console.warn('[SimpleChatBridge] Ultra fallback: Looking for ANY visible textarea...');
        const allTextareas = Array.from(document.querySelectorAll('textarea'));
        for (const el of allTextareas) {
          if (this.isExtensionUiElement(el)) continue;
          if (this.isVisible(el as HTMLElement) && !(el as HTMLTextAreaElement).disabled) {
            input = el as HTMLElement;
            console.warn('[SimpleChatBridge] Ultra fallback textarea found');
            break;
          }
        }
      }
    }

    if (!sendButton && DEBUG) {
      console.warn('[SimpleChatBridge] Ultra fallback: Looking for ANY button...');
      const allButtons = Array.from(document.querySelectorAll('button'));
      for (const btn of allButtons) {
        if (this.isExtensionUiElement(btn)) continue;
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
        // Only log on supported AI chat platforms AND when DEBUG is enabled
        // This prevents confusing users on non-chat sites
        if (stateChanged && isSupportedSite && DEBUG) {
          // Add platform info to help debugging
          logData.isKnownPlatform = isSupportedSite;

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
        }
      } else if (stateChanged) {
        // Only log ready state when it actually changes (not on every scan)
        console.log('[SimpleChatBridge] ✅ Elements ready:', logData);
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

  private queryAllIncludingShadow(selector: string): HTMLElement[] {
    const results: HTMLElement[] = [];
    const seen = new Set<Element>();

    const collect = (root: ParentNode): void => {
      const matches = root.querySelectorAll(selector);
      for (const node of matches) {
        if (seen.has(node)) continue;
        seen.add(node);
        if (node instanceof HTMLElement) {
          results.push(node);
        }
      }

      const allInRoot = root.querySelectorAll('*');
      for (const node of allInRoot) {
        if (node instanceof HTMLElement && node.shadowRoot) {
          collect(node.shadowRoot);
        }
      }
    };

    try {
      collect(document);
    } catch {
      // Ignore invalid selector/root traversal issues and return partial results.
    }
    return results;
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
    // Qwen-specific assistant message count
    if (this.isQwenHost()) {
      const strictNodes = this.getQwenResponseNodes(false);
      if (strictNodes.length > 0) return strictNodes.length;

      // If strict assistant-role matching fails on current Qwen DOM, use relaxed candidates.
      const relaxedNodes = this.getQwenResponseNodes(true);
      if (relaxedNodes.length > 0) return relaxedNodes.length;
    }

    // Primary path for Gemini-style UIs
    const modelResponses = this.queryAllIncludingShadow('model-response').length;
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

    // Perplexity Fallback (Expanded)
    const perplexity = document.querySelectorAll(
      'div.prose, div[class*="prose"], div[data-testid*="answer"], div.font-sans.text-base.text-text-main'
    ).length;
    if (perplexity > 0) return perplexity;

    // Generic assistant-like message fallback
    const generic = this.getGenericAssistantResponseNodes(true).length;
    return generic;
  }

  /**
   * Get latest response text
   */
  getLatestResponse(): string | null {
    // Primary path for Gemini-style UIs
    const responses = this.queryAllIncludingShadow(
      'model-response, side-panel-response, gemini-sidebar-output, .gemini-response-content'
    );
    if (responses.length > 0) {
      const lastResponse = responses[responses.length - 1];
      const markdown = lastResponse.querySelector(
        '.markdown, .message-content, side-panel-chat-message'
      );
      const txt = this.extractCleanText(markdown || lastResponse);
      if (txt) return txt;
    }

    // Qwen fallback: assistant-tagged message nodes.
    if (this.isQwenHost()) {
      const strict = this.getLatestQwenResponse(false);
      if (strict) return strict;

      // Relaxed fallback for guest/new Qwen layouts where assistant role attrs are absent.
      const relaxed = this.getLatestQwenResponse(true);
      if (relaxed) return relaxed;
    }

    // OpenClaw chat UI fallback: only inspect chat-thread scoped entries
    const openClawThread = document.querySelector('.chat-thread');
    if (openClawThread) {
      const candidates = Array.from(openClawThread.querySelectorAll(':scope > *'));
      for (let i = candidates.length - 1; i >= 0; i--) {
        const text = this.extractCleanText(candidates[i]);
        if (!text) continue;
        // Skip obvious non-reply/system status text
        const low = text.toLowerCase();
        if (low.includes('disconnected from gateway')) continue;
        if (low === 'openclaw' || low === '🦞') continue;
        // CRITICAL: Block user message scrapes to prevent doubling in OpenClaw
        if (
          low.startsWith('u ') ||
          low.startsWith('you ') ||
          low.includes(' you ') ||
          (low.startsWith('u') && low.length < 5)
        )
          continue;
        return text;
      }
    }

    // Perplexity Fallback (Expanded)
    const perplexityResponses = document.querySelectorAll(
      'div.prose, div[class*="prose"], div[data-testid*="answer"], div.font-sans.text-base.text-text-main'
    );
    if (perplexityResponses.length > 0) {
      // Get the last one
      const last = perplexityResponses[perplexityResponses.length - 1];
      const text = this.extractCleanText(last);
      // Perplexity often has "Sources" or "Related" sections at the bottom, we might need to be careful
      // But usually 'prose' contains the main answer.
      if (text) return text;
    }

    // Generic assistant fallback across regular + shadow DOM.
    const generic = this.getGenericAssistantResponseNodes(true);
    for (let i = generic.length - 1; i >= 0; i--) {
      const text = this.extractCleanText(generic[i]);
      if (!text) continue;
      if (this.lastSentText && text.trim() === this.lastSentText.trim()) continue;
      return text;
    }

    return null;
  }

  /**
   * Check if AI is currently streaming a response
   */
  isStreaming(): boolean {
    if (this._sendingGuard) return true; // Force streaming state if we recently sent a message

    // Qwen can keep generic "loading/thinking" classes mounted even after completion.
    // Use stricter indicators there to avoid permanent streaming=true.
    if (this.isQwenHost()) {
      const qwenStreamingIndicators = [
        '[data-testid*="stop" i]',
        'button[aria-label*="Stop generating" i]',
        'button[aria-label*="Stop response" i]',
        'button[aria-label*="Stop" i]',
        'button[title*="Stop" i]',
      ];

      for (const selector of qwenStreamingIndicators) {
        const matches = this.queryAllIncludingShadow(selector);
        for (const el of matches) {
          if (this.isExtensionUiElement(el)) continue;
          if (this.isVisible(el)) return true;
        }
      }
      return false;
    }

    const streamingIndicators = [
      'span[class*="cursor"][class*="blink"]',
      '[class*="thinking"]',
      '[class*="loading-spinner"]',
      '[class*="generating"]',
      '[data-testid*="generat" i]',
      '[data-testid*="typing" i]',
      'button[aria-label*="Stop response"]',
      'button[aria-label*="Stop generating"]',
      '[data-testid*="stop-button"]',
      'button[aria-label*="Stop" i]',
      'button[title*="Stop" i]',
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
    this.lastSentText = text.trim();
    let initialElements = this.findElements();

    if (!initialElements.input) {
      const maxWaitMs = 4000;
      const intervalMs = 250;
      const start = Date.now();
      while (!initialElements.input && Date.now() - start < maxWaitMs) {
        await this.delay(intervalMs);
        initialElements = this.findElements();
      }
    }

    if (!initialElements.input) {
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

    // React Scheduler Hack: Get the native setter to bypass React's virtual DOM blocking
    // This is required for Perplexity, ChatGPT, and other React-heavy apps
    const setNativeValue = (element: HTMLElement, value: string) => {
      const { set: valueSetter } =
        Object.getOwnPropertyDescriptor(element, 'value') ||
        Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value') ||
        {};
      const prototype = Object.getPrototypeOf(element);
      const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

      if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(element, value);
      } else if (valueSetter) {
        valueSetter.call(element, value);
      } else {
        (element as any).value = value;
      }

      element.dispatchEvent(new Event('input', { bubbles: true }));
    };

    try {
      // Focus and clear the input
      input.focus();
      await this.delay(100);

      const isContentEditable =
        input.isContentEditable || input.getAttribute('contenteditable') === 'true';

      // Input simulation
      if (isContentEditable) {
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
        // Textarea/Input handling
        // Use native setter for React-controlled inputs (ChatGPT, Perplexity, etc.)
        setNativeValue(input, text);
        input.dispatchEvent(
          new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            inputType: 'insertText',
            data: text,
          })
        );
        // Also dispatch change for form listeners
        input.dispatchEvent(new Event('change', { bubbles: true }));
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

      if (sendButton) {
        // Wait for button to be enabled (check disabled attribute)
        let attempts = 0;
        while (sendButton.hasAttribute('disabled') && attempts < 10) {
          await this.delay(100);
          sendButton = this.findElements().sendButton;
          if (!sendButton) break;
          attempts++;
        }
      } else {
        console.warn('[SimpleChatBridge] Send button not found; attempting Enter-only submission');
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
      const enterKeyInit = {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true,
      };
      input.dispatchEvent(new KeyboardEvent('keydown', enterKeyInit));
      input.dispatchEvent(new KeyboardEvent('keypress', enterKeyInit));
      input.dispatchEvent(new KeyboardEvent('keyup', enterKeyInit));
      console.log('[SimpleChatBridge] Dispatched Enter key sequence on input');

      // Some textarea-based UIs submit only on form submit handlers.
      if (!isContentEditable) {
        const form = input.closest('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          console.log('[SimpleChatBridge] Dispatched form submit fallback');
        }
      }

      // Wait and check if it worked - INCREASED DELAY to prevent double-sending
      await this.delay(500);

      const wasCleared = inputWasCleared();
      const isNowStreaming = this.isStreaming();

      if (wasCleared || isNowStreaming) {
        console.log('[SimpleChatBridge] Message sent via Enter key', {
          wasCleared,
          isNowStreaming,
        });
        this.startWatchingForResponse(responsesBefore);
        return true;
      }

      // Method 2: Direct button click (if Enter didn't work)
      if (sendButton) {
        sendButton.click();
        console.log('[SimpleChatBridge] Clicked send button directly');
        // Check again with increased delay
        await this.delay(500);
        if (inputWasCleared() || this.isStreaming()) {
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
    this.stopWatching();
    this.isWaitingForResponse = true;
    let stableCount = 0;
    let lastContent = '';
    let lastChangeAt = Date.now();
    const startAt = Date.now();
    const initialContent = this.getLatestResponse() || '';
    const INACTIVITY_TIMEOUT_MS = 180000;
    const HARD_TIMEOUT_MS = 600000;

    this.responseCheckInterval = window.setInterval(() => {
      const currentResponseCount = this.countModelResponses();
      let content = this.getLatestResponse();
      if (!content && this.isQwenHost()) {
        content = this.getLatestQwenResponse(true);
      }

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

          if (currentContentSignature !== lastContent) {
            // Content changed
            stableCount = 0;
            lastContent = currentContentSignature;
            lastChangeAt = Date.now();
          } else {
            // Content is stable
            stableCount++;
            const streamStalled = streaming && Date.now() - lastChangeAt > 12000;
            if (stableCount >= 3 && (!streaming || streamStalled)) {
              // If streaming appears stuck but content has been stable for long enough,
              // finalize anyway (Qwen occasionally leaves stop indicators mounted).
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

    this.responseTimeoutTimer = window.setInterval(() => {
      if (this.isWaitingForResponse) {
        const elapsedMs = Date.now() - startAt;
        const inactiveMs = Date.now() - lastChangeAt;

        if (elapsedMs < HARD_TIMEOUT_MS && inactiveMs < INACTIVITY_TIMEOUT_MS) {
          return;
        }

        const timeoutReason =
          elapsedMs >= HARD_TIMEOUT_MS
            ? `hard timeout after ${Math.round(elapsedMs / 1000)}s`
            : `inactivity timeout after ${Math.round(inactiveMs / 1000)}s`;
        console.warn(`[SimpleChatBridge] Response timeout (${timeoutReason})`);
        this.stopWatching();

        // Even on timeout, try to get whatever response is there
        const finalContent = this.getLatestResponse() || this.getLatestQwenResponse(true);
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
    }, 1000);
  }

  /**
   * Check if the latest response contains media (images, videos)
   */
  private checkForMediaContent(): boolean {
    const modelResponses = this.queryAllIncludingShadow('model-response');
    let lastResponse: Element | null = modelResponses.length
      ? modelResponses[modelResponses.length - 1]
      : null;

    if (!lastResponse) {
      const assistantNodes = this.getGenericAssistantResponseNodes(true);
      if (assistantNodes.length > 0) {
        lastResponse = assistantNodes[assistantNodes.length - 1];
      }
    }

    if (!lastResponse) return false;

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
    if (this.responseTimeoutTimer) {
      clearInterval(this.responseTimeoutTimer);
      this.responseTimeoutTimer = null;
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

  private extractCleanText(node: Element | null): string | null {
    if (!node) return null;
    const clone = node.cloneNode(true) as HTMLElement;
    clone
      .querySelectorAll(
        'button, [role="button"], .chip, [class*="action"], .chat-compose, textarea, input'
      )
      .forEach((el) => el.remove());
    const text = (clone.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) return null;
    if (text.length < 8) return null;
    return text;
  }

  private getQwenResponseNodes(relaxed: boolean): HTMLElement[] {
    const strictSelectors = [
      '[data-message-author-role="assistant"]',
      '[data-role="assistant"]',
      '[data-author-role="assistant"]',
      '[data-testid*="assistant" i]',
      '[class*="assistant-message" i]',
      '[class*="assistant" i]',
      '[class*="bot" i]',
    ];

    const relaxedSelectors = [
      '[data-testid*="message" i]',
      '[data-testid*="chat-message" i]',
      '[class*="message-content" i]',
      '[class*="markdown" i]',
      '[class*="chat-message" i]',
      '[role="article"]',
      'article',
      'main p',
    ];

    const selectors = relaxed ? [...strictSelectors, ...relaxedSelectors] : strictSelectors;
    const candidates: HTMLElement[] = [];
    const seen = new Set<HTMLElement>();
    for (const selector of selectors) {
      for (const node of this.queryAllIncludingShadow(selector)) {
        if (seen.has(node)) continue;
        seen.add(node);
        candidates.push(node);
      }
    }

    const filtered: HTMLElement[] = [];
    for (const node of candidates) {
      if (this.isExtensionUiElement(node)) continue;
      if (!this.isVisible(node)) continue;
      if (this.isLikelyUserMessageNode(node)) continue;
      if (this.isLikelyNonConversationNode(node)) continue;

      const text = this.extractCleanText(node);
      if (!text) continue;
      filtered.push(node);
    }

    // Deduplicate identical text blocks, keeping the last DOM occurrence.
    const bySignature = new Map<string, HTMLElement>();
    for (const node of filtered) {
      const text = this.extractCleanText(node) || '';
      const signature = `${text.slice(0, 240)}|${text.length}`;
      bySignature.set(signature, node);
    }

    return Array.from(bySignature.values());
  }

  private getGenericAssistantResponseNodes(relaxed: boolean): HTMLElement[] {
    const strictSelectors = [
      '[data-message-author-role="assistant"]',
      '[data-role="assistant"]',
      '[data-author-role="assistant"]',
      '[data-testid*="assistant" i]',
      '[class*="assistant-message" i]',
      '[class*="assistant-response" i]',
      '[class*="assistant" i]',
      '[class*="bot-message" i]',
      '[class*="bot-response" i]',
    ];

    const relaxedSelectors = [
      '[data-testid*="message" i]',
      '[data-testid*="chat-message" i]',
      '[class*="message-content" i]',
      '[class*="message-body" i]',
      '[class*="markdown" i]',
      '[role="article"]',
      'article',
      'main p',
    ];

    const selectors = relaxed ? [...strictSelectors, ...relaxedSelectors] : strictSelectors;
    const candidates: HTMLElement[] = [];
    const seen = new Set<HTMLElement>();

    for (const selector of selectors) {
      for (const node of this.queryAllIncludingShadow(selector)) {
        if (seen.has(node)) continue;
        seen.add(node);
        candidates.push(node);
      }
    }

    const filtered: HTMLElement[] = [];
    const bySignature = new Map<string, HTMLElement>();
    for (const node of candidates) {
      if (this.isExtensionUiElement(node)) continue;
      if (!this.isVisible(node)) continue;
      if (this.isLikelyUserMessageNode(node)) continue;
      if (this.isLikelyNonConversationNode(node)) continue;
      const text = this.extractCleanText(node);
      const hasMedia =
        node.querySelector(
          'img, video, canvas, iframe, [data-generated-image], .generated-image'
        ) !== null;
      if (!text && !hasMedia) continue;
      filtered.push(node);
      const signature = text ? `${text.slice(0, 240)}|${text.length}` : `media:${filtered.length}`;
      bySignature.set(signature, node);
    }

    return Array.from(bySignature.values());
  }

  private getLatestQwenResponse(relaxed: boolean): string | null {
    const nodes = this.getQwenResponseNodes(relaxed);
    for (let i = nodes.length - 1; i >= 0; i--) {
      const text = this.extractCleanText(nodes[i]);
      if (!text) continue;
      if (this.lastSentText && text.trim() === this.lastSentText.trim()) continue;
      return text;
    }
    return null;
  }

  private isQwenHost(): boolean {
    const host = window.location.hostname.toLowerCase();
    return host === 'chat.qwen.ai' || host.endsWith('.qwen.ai');
  }

  private isLikelyUserMessageNode(node: HTMLElement): boolean {
    const role =
      node.getAttribute('data-message-author-role') ||
      node.getAttribute('data-role') ||
      node.getAttribute('data-author-role') ||
      '';
    if (role.toLowerCase() === 'user') return true;

    const cls = `${node.className || ''}`.toLowerCase();
    if (cls.includes('user') || cls.includes('human') || cls.includes('me-message')) return true;

    if (node.matches('textarea, input, [contenteditable="true"]')) return true;
    if (node.closest('form')) return true;

    return false;
  }

  private isLikelyNonConversationNode(node: HTMLElement): boolean {
    if (node.closest('header, nav, aside, footer, [role="navigation"], [role="complementary"]')) {
      return true;
    }

    if (node.matches('button, [role="button"], a, label')) {
      return true;
    }

    if (node.querySelector('textarea, input, [contenteditable="true"]')) {
      return true;
    }

    const aria = `${node.getAttribute('aria-label') || ''}`.toLowerCase();
    if (
      aria.includes('send') ||
      aria.includes('new chat') ||
      aria.includes('search') ||
      aria.includes('history')
    ) {
      return true;
    }

    return false;
  }
}

// Export singleton instance
export const simpleChatBridge = new SimpleChatBridge();
export default simpleChatBridge;

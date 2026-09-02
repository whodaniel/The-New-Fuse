/**
 * Fuse Connect v7 - Content Script Entry Point
 *
 * SIMPLIFIED VERSION - Uses SimpleChatBridge for direct Gemini interaction.
 *
 * The floating panel opens only on explicit user action:
 * 1. User clicks "Open Panel" in the popup
 * 2. User presses Ctrl+Shift+F
 * 3. Session restore if the user already opened it in this browser session
 *
 * Federated messages inject into the page chat without opening the overlay.
 */

import { EXTENSION_VERSION as FUSE_VERSION } from '../shared/constants';
import { buildPageAgentIdentity } from '../shared/federation-identity';
import {
  isExtensionContextInvalidated,
  isExtensionRuntimeAlive,
  isTransientRuntimeDisconnect,
  runtimeErrorMessage,
} from '../shared/extension-context';
import { isControlPlaneRelayMessage, isTnfSaaSChatHost } from '../shared/utils';
import { simpleChatBridge } from './adapters/SimpleChatBridge';
import './guard'; // MUST BE FIRST - Patches customElements.define
import { createEnhancedFloatingPanel, EnhancedFloatingPanel } from './injectable/FloatingPanel';
import { SelfPrompter } from './self-prompting';
import { accessibilityTree } from './utils/AccessibilityTree';
import { captchaHandler } from './utils/CaptchaHandler';
import { consoleCapture } from './utils/ConsoleCapture';
import { humanSimulator } from './utils/HumanBehaviorSimulator';

// Install as early as possible so console activity from this page's own
// scripts is captured from the start, not just from whenever a caller first
// asks for logs.
consoleCapture.install();

/** Page-world <-> content-script test bridge event names (loopback origins only). */
const FUSE_BRIDGE_REQUEST = 'fuse-connect:request';
const FUSE_BRIDGE_RESPONSE = 'fuse-connect:response';

function getSessionStore(): chrome.storage.StorageArea | null {
  const session = (chrome.storage as { session?: chrome.storage.StorageArea }).session;
  return session ?? null;
}

const shouldSkipForPage = (): boolean => {
  const host = window.location.hostname;
  const path = window.location.pathname;

  // Skip initialization on SkIDEancer IDE pages to prevent editor collisions.
  if (host === 'skideancer.thenewfuse.com') return true;

  // Skip auth and Cloudflare challenge routes so login/register are not disrupted.
  if (
    path === '/login' ||
    path === '/register' ||
    path.startsWith('/auth/') ||
    path.startsWith('/cdn-cgi/challenge-platform/')
  ) {
    return true;
  }

  return false;
};

// Guard against multiple initialization (can happen in iframes or with hot reload)
declare global {
  interface Window {
    __FUSE_CONNECT_INITIALIZED__?: boolean;
    __FUSE_DEBUG?: {
      getLastResponse: () => string | null;
      sendTestMessage: (msg: string) => void;
      checkExtensionContext: () => boolean;
      findElements: () => object;
      enableSelfPrompter: () => object;
      disableSelfPrompter: () => object;
      getSelfPrompterStatus: () => object;
    };
  }
}

class FuseConnectContentScript {
  private panel: EnhancedFloatingPanel | null = null;
  private isInitialized = false;
  private panelVisible = false;
  private chatReady = false;
  private pageAgentId: string | null = null;
  private currentChannel: string | null = null;
  private pausedChannels: Set<string> = new Set();
  private selfPrompter = new SelfPrompter();
  private selfPrompterInterval: number | null = null;

  // DEDUPE GUARD: Track message IDs we have already processed (injected or shown)
  // to prevent infinite loops from the relay-Cloudflare-Extension circle.
  private processedMessageIds: Set<string> = new Set();

  // FEDERATION IMPROVEMENT: Track pending requests for response correlation
  private pendingRequests: Map<
    string,
    {
      correlationId: string;
      taskId?: string;
      from: string;
      timestamp: number;
    }
  > = new Map();

  // FEDERATION IMPROVEMENT: Message Queue for delayed injection
  private injectionQueue: Array<{
    content: string;
    metadata?: any;
    timestamp: number;
    attempts: number;
  }> = [];
  private isProcessingQueue = false;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  private setup(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    console.debug('[FuseConnect v7] Content script initialized');

    document.getElementById('fuse-connect-panel-v7')?.remove();
    document.getElementById('fuse-connect-styles-v7')?.remove();
    document.documentElement.style.marginRight = '';
    try {
      void chrome.storage.local.remove('fuse_connect_panel_open');
    } catch {
      // ignore
    }

    // Initialize the simple chat bridge with callbacks
    simpleChatBridge.init({
      onResponse: (content) => {
        const safeContent = typeof content === 'string' ? content : String(content || '');
        console.log('[FuseConnect v7] AI Response received, length:', safeContent.length);
        this.selfPrompter.updateActivity();

        // Forward to panel
        if (this.panel) {
          this.panel.handleMessage({
            type: 'RESPONSE_COMPLETE',
            content: safeContent,
          });
        }

        // FEDERATION IMPROVEMENT: Check for pending request to correlate response
        const pendingRequest = this.getOldestPendingRequest();
        if (!this.pageAgentId) {
          console.warn(
            '[FuseConnect v7] ⚠️ Page Agent ID missing during response! This may cause message drop.'
          );
        }

        // Get current channel from panel for proper routing
        const currentChannel = this.panel?.getCurrentChannel() || null;

        const responseMetadata: any = {
          agentId: this.pageAgentId,
          responseType: 'ai-response',
          timestamp: Date.now(),
          channel: currentChannel, // Include channel for per-tab routing
        };

        if (pendingRequest) {
          // Correlate this response with the original request
          responseMetadata.correlationId = pendingRequest.correlationId;
          responseMetadata.taskId = pendingRequest.taskId;
          responseMetadata.inResponseTo = pendingRequest.from;
          console.log(
            '[FuseConnect v7] 🔗 Correlating response to request:',
            pendingRequest.correlationId
          );
          this.pendingRequests.delete(pendingRequest.correlationId);
        }

        // Forward to background for relay with correlation info
        this.safeSendMessage({
          type: 'RESPONSE_COMPLETE',
          content: safeContent.length > 50000 ? safeContent.substring(0, 50000) : safeContent,
          channel: currentChannel, // Also pass at top level for easier access
          metadata: responseMetadata,
        });

        // Trigger queue processing after response
        this.processInjectionQueue();
      },
      onTranscriptEntry: (entry) => {
        // Track the ID in our dedupe guard
        if (entry.id) this.processedMessageIds.add(entry.id);

        // Forward canonical transcript updates from Cloudflare DO to panel
        if (this.panel) {
          this.panel.handleMessage({
            type: 'TRANSCRIPT_UPDATE',
            entry: entry,
          });
        }
      },
      onError: (error) => {
        console.error('[FuseConnect v7] Chat bridge error:', error);
      },
    });

    // Check for chat elements periodically
    this.startChatDetection();

    // Auto-detect CAPTCHA on page load (after short delay for iframes to load)
    setTimeout(() => {
      this.checkForCaptcha();
    }, 2000);

    // Setup debug utilities for console diagnostics
    this.setupDebugUtils();

    // Setup message handlers
    this.setupMessageHandlers();

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Auto-open disabled: panel should NOT automatically open on page load
    // unless the user explicitly requested it in this browser session.
    void this.maybeRestorePanel();

    // Notify background that content script is ready
    this.safeSendMessage({
      type: 'CONTENT_SCRIPT_READY',
      url: window.location.href,
      hostname: window.location.hostname,
    });
  }

  /**
   * Re-open panel only if previously opened during this browser session.
   * Site permission resets do not clear chrome.storage.session; a new browser
   * session does. Never fall back to chrome.storage.local.
   */
  private async maybeRestorePanel(): Promise<void> {
    if (window.self !== window.top) return;
    try {
      const store = getSessionStore();
      if (!store) return;
      const result = await store.get('fuse_connect_panel_open');
      if (result.fuse_connect_panel_open === true) {
        console.debug('[FuseConnect v7] Restoring panel (was open in this session)');
        this.showPanel();
      }
    } catch (e) {
      // ignore
    }
  }

  /**
   * Periodically check for chat elements
   */
  private startChatDetection(): void {
    const checkElements = () => {
      const elements = simpleChatBridge.findElements();

      if (elements.isReady && !this.chatReady) {
        this.chatReady = true;
        console.log('[FuseConnect v7] Chat is ready!');

        // Notify background
        this.safeSendMessage(
          {
            type: 'CHAT_DETECTED',
            elements: {
              hasInput: !!elements.input,
              hasSendButton: !!elements.sendButton,
              confidence: 1,
              isStreaming: false,
            },
          },
          (response) => {
            if (response?.pageAgentId || response?.agentId) {
              this.pageAgentId = response.pageAgentId || response.agentId;
              console.log('[FuseConnect v7] Assigned Page Agent ID:', this.pageAgentId);
              if (this.panel) {
                this.panel.setAgentId(this.pageAgentId);
              }
            }
          }
        );

        // Update panel if exists
        if (this.panel) {
          this.panel.updateChatElements({
            input: elements.input,
            sendButton: elements.sendButton,
            messageContainer: null,
            lastMessage: null,
            isStreaming: false,
            confidence: 1,
            detectedAt: Date.now(),
          });
        }

        // Pass agent ID to panel if available
        if (this.panel && this.pageAgentId) {
          this.panel.setAgentId(this.pageAgentId);
        }
      }
    };

    // Check immediately and every 2 seconds
    checkElements();
    setInterval(checkElements, 2000);
  }

  /**
   * Setup debug utilities accessible from browser console
   */
  private setupDebugUtils(): void {
    window.__FUSE_DEBUG = {
      getLastResponse: () => {
        const response = simpleChatBridge.getLastResponse();
        console.log('[FuseConnect Debug] Last response:', response);
        return response;
      },

      sendTestMessage: (msg: string) => {
        console.log('[FuseConnect Debug] Sending test message:', msg);
        simpleChatBridge.sendMessage(msg);
      },

      checkExtensionContext: () => {
        try {
          const isValid = !!chrome.runtime?.id;
          console.log('[FuseConnect Debug] Extension context valid:', isValid);
          return isValid;
        } catch (e) {
          console.error('[FuseConnect Debug] Extension context check failed:', e);
          return false;
        }
      },

      findElements: () => {
        const elements = simpleChatBridge.findElements();
        console.log('[FuseConnect Debug] Found elements:', elements);
        return elements;
      },

      enableSelfPrompter: () => {
        this.enableSelfPrompter();
        return this.selfPrompter.getStatus();
      },

      disableSelfPrompter: () => {
        this.disableSelfPrompter();
        return this.selfPrompter.getStatus();
      },

      getSelfPrompterStatus: () => {
        const status = this.selfPrompter.getStatus();
        console.log('[FuseConnect Debug] SelfPrompter status:', status);
        return status;
      },
    };

    console.debug('[FuseConnect v7] Debug utils available at window.__FUSE_DEBUG');
    this.setupPageWorldBridge();
  }

  /**
   * `window.__FUSE_DEBUG` lives in the content script's isolated world, so page
   * scripts (and any browser-driven test harness, which evaluates in the main
   * world) cannot see it — there was previously NO way to tell from the page
   * whether this content script had attached.
   *
   * Two things fix that:
   *  - a `data-fuse-connect` attribute on <html>, readable anywhere;
   *  - a CustomEvent request/response bridge, enabled only on loopback origins
   *    so real sites can never drive the composer through it.
   */
  private setupPageWorldBridge(): void {
    try {
      document.documentElement.setAttribute('data-fuse-connect', FUSE_VERSION);
    } catch (e) {
      console.warn('[FuseConnect v7] Could not set page marker:', e);
    }

    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1' && host !== '[::1]') return;

    document.addEventListener(FUSE_BRIDGE_REQUEST, (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      const respond = (payload: Record<string, unknown>) => {
        document.dispatchEvent(
          new CustomEvent(FUSE_BRIDGE_RESPONSE, { detail: { id: detail.id, ...payload } })
        );
      };

      // Async actions round-trip to the background worker.
      if (detail.action === 'keepalive' || detail.action === 'connection') {
        try {
          chrome.runtime.sendMessage({ type: 'GET_KEEPALIVE_STATUS' }, (response) => {
            if (chrome.runtime.lastError) {
              respond({ ok: false, error: chrome.runtime.lastError.message });
              return;
            }
            respond({ ok: true, result: response });
          });
        } catch (e: any) {
          respond({ ok: false, error: e?.message || String(e) });
        }
        return;
      }

      // Generic forward of any internal runtime message — the same
      // chrome.runtime.sendMessage path setupMessageHandlers() itself
      // listens on, reached from the loopback test bridge for whichever
      // message type needs live verification (CHANNEL_JOIN, etc.), not
      // just the browserAction case below. args = { message: {...} }.
      if (detail.action === 'runtimeMessage') {
        try {
          chrome.runtime.sendMessage(detail.args?.message ?? {}, (response) => {
            if (chrome.runtime.lastError) {
              respond({ ok: false, error: chrome.runtime.lastError.message });
              return;
            }
            respond({ ok: true, result: response });
          });
        } catch (e: any) {
          respond({ ok: false, error: e?.message || String(e) });
        }
        return;
      }

      // Forwards to the real BROWSER_ACTION handler in background/index.ts
      // (browser-automation.ts) — same real message path a relay-connected
      // TNF agent uses, just reached from the page-world test bridge since
      // loopback-only automation can't reach chrome-extension:// pages
      // directly. args = { browserAction, tabId?, params? }.
      if (detail.action === 'browserAction') {
        try {
          chrome.runtime.sendMessage(
            {
              type: 'BROWSER_ACTION',
              browserAction: detail.args?.browserAction,
              tabId: detail.args?.tabId,
              params: detail.args?.params,
            },
            (response) => {
              if (chrome.runtime.lastError) {
                respond({ ok: false, error: chrome.runtime.lastError.message });
                return;
              }
              respond({ ok: true, result: response });
            }
          );
        } catch (e: any) {
          respond({ ok: false, error: e?.message || String(e) });
        }
        return;
      }

      try {
        respond({ ok: true, result: this.runBridgeAction(detail.action, detail.args || {}) });
      } catch (e: any) {
        respond({ ok: false, error: e?.message || String(e) });
      }
    });

    document.documentElement.setAttribute('data-fuse-connect-bridge', 'on');
    console.warn('[FuseConnect v7] Page-world test bridge enabled (loopback origin)');
  }

  /**
   * Allowlisted bridge actions. Deliberately limited to things a page script
   * could already do to its own DOM, plus read-only extension state — never
   * relay messaging, storage, or cross-tab operations.
   */
  private runBridgeAction(action: string, args: Record<string, any>): unknown {
    switch (action) {
      case 'status': {
        const elements = simpleChatBridge.findElements();
        return {
          version: FUSE_VERSION,
          initialized: this.isInitialized,
          chatReady: this.chatReady,
          pageAgentId: this.pageAgentId,
          panelVisible: this.panelVisible,
          extensionContextValid: !!chrome.runtime?.id,
          elements: {
            hasInput: !!elements.input,
            hasSendButton: !!elements.sendButton,
            isReady: elements.isReady,
            inputTag: elements.input?.tagName || null,
            inputId: (elements.input as HTMLElement | null)?.id || null,
            sendButtonTestId: elements.sendButton?.getAttribute('data-testid') || null,
          },
        };
      }
      case 'findElements': {
        const elements = simpleChatBridge.findElements();
        return {
          isReady: elements.isReady,
          inputTag: elements.input?.tagName || null,
          inputId: (elements.input as HTMLElement | null)?.id || null,
          sendButtonTag: elements.sendButton?.tagName || null,
        };
      }
      case 'sendMessage':
        void simpleChatBridge.sendMessage(String(args.text || ''));
        return { queued: true };
      case 'getLastResponse':
        return { response: simpleChatBridge.getLastResponse() };
      case 'getLastSendResult':
        return simpleChatBridge.getLastSendResult();
      case 'showPanel':
        this.showPanel();
        return { panelVisible: this.panelVisible };
      case 'hidePanel':
        this.hidePanel();
        return { panelVisible: this.panelVisible };
      case 'togglePanel':
        this.togglePanel();
        return { panelVisible: this.panelVisible };
      default:
        throw new Error(`Unknown bridge action: ${action}`);
    }
  }

  private savePanelOpenState(isOpen: boolean): void {
    const store = getSessionStore();
    if (!store) return;
    store.set({ fuse_connect_panel_open: isOpen }).catch(() => {});
  }

  /**
   * Show or create the floating panel
   */
  private showPanel(): void {
    // SECURITY/UX: Never show floating panel in iframes (like YouTube embeds or ads)
    if (window.self !== window.top) {
      return;
    }

    if (!this.panel) {
      this.panel = createEnhancedFloatingPanel({
        onDismiss: () => {
          this.panel = null;
          this.panelVisible = false;
          this.savePanelOpenState(false);
        },
      });

      // Update with current detection state
      const elements = simpleChatBridge.findElements();
      if (elements.isReady) {
        this.panel.updateChatElements({
          input: elements.input,
          sendButton: elements.sendButton,
          messageContainer: null,
          lastMessage: null,
          isStreaming: false,
          confidence: 1,
          detectedAt: Date.now(),
        });
      }

      // Pass agent ID if we already have it
      if (this.pageAgentId) {
        this.panel.setAgentId(this.pageAgentId);
      }
    }

    this.panel.show();
    this.panelVisible = true;
    this.savePanelOpenState(true);
    console.log('[FuseConnect v7] Panel shown');
  }

  /**
   * Hide the floating panel
   */
  private hidePanel(): void {
    if (this.panel) {
      this.panel.hide();
      this.panel = null;
    }
    this.panelVisible = false;
    this.savePanelOpenState(false);
    console.log('[FuseConnect v7] Panel hidden');
  }

  /**
   * Toggle panel visibility
   */
  private togglePanel(): void {
    if (this.panelVisible) {
      this.hidePanel();
    } else {
      this.showPanel();
    }
  }

  private setupMessageHandlers(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // CRITICAL: Check if extension context is still valid
      if (!chrome.runtime?.id) {
        return false;
      }

      // Safe wrapper for sendResponse to prevent "Extension context invalidated" errors
      const safeSendResponse = (response: any) => {
        try {
          if (chrome.runtime?.id) {
            sendResponse(response);
          }
        } catch (e) {
          // Ignore context invalidation errors - expected during reloads
          console.debug('[FuseConnect] Context invalidated during response sending');
        }
      };

      try {
        switch (message.type) {
          case 'PING':
            // Used to check if content script is already injected
            safeSendResponse({ pong: true, initialized: this.isInitialized });
            return true;

          case 'TOGGLE_PANEL':
            this.togglePanel();
            safeSendResponse({ success: true, visible: this.panelVisible });
            return true;

          case 'SHOW_PANEL':
            try {
              this.showPanel();
              safeSendResponse({ success: true });
            } catch (e: any) {
              console.error('[FuseConnect] Failed to show panel:', e);
              safeSendResponse({ success: false, error: e.message });
            }
            return true;

          case 'HIDE_PANEL':
            this.hidePanel();
            safeSendResponse({ success: true });
            return true;

          case 'GET_PANEL_STATUS':
            safeSendResponse({ visible: this.panelVisible, exists: !!this.panel });
            return true;

          case 'INJECT_MESSAGE':
            this.injectMessage(message.content, message.metadata, {
              preserveUserFocus: true,
            }).then((success) => {
              safeSendResponse({
                success,
                result: simpleChatBridge.getLastSendResult(),
              });
            });
            return true;

          case 'GET_LAST_RESPONSE': {
            const response = simpleChatBridge.getLastResponse();
            safeSendResponse({ response });
            return true;
          }

          case 'GET_CHAT_STATUS': {
            const elements = simpleChatBridge.findElements();
            safeSendResponse({
              detected: elements.isReady,
              confidence: elements.isReady ? 1 : 0,
              isStreaming: false,
            });
            return true;
          }

          case 'ENABLE_SELF_PROMPTER':
            this.enableSelfPrompter();
            safeSendResponse({ success: true, status: this.selfPrompter.getStatus() });
            return true;

          case 'DISABLE_SELF_PROMPTER':
            this.disableSelfPrompter();
            safeSendResponse({ success: true, status: this.selfPrompter.getStatus() });
            return true;

          case 'RESET_SELF_PROMPTER':
            this.selfPrompter.resetConversation();
            safeSendResponse({ success: true, status: this.selfPrompter.getStatus() });
            return true;

          case 'SET_SELF_PROMPTER_STEPS':
            if (!Array.isArray(message.steps) || message.steps.length === 0) {
              safeSendResponse({ success: false, error: 'steps must be a non-empty array' });
              return true;
            }
            this.selfPrompter.setWorkflowSteps(message.steps);
            safeSendResponse({ success: true, status: this.selfPrompter.getStatus() });
            return true;

          case 'GET_SELF_PROMPTER_STATUS':
            safeSendResponse({ success: true, status: this.selfPrompter.getStatus() });
            return true;

          // Accessibility tree commands
          case 'GET_ACCESSIBILITY_TREE': {
            const treeResult = accessibilityTree.generateTree({
              filter: message.filter,
              maxDepth: message.maxDepth,
              refId: message.refId,
            });
            safeSendResponse(treeResult);
            return true;
          }

          case 'CLICK_ELEMENT':
            accessibilityTree.clickElement(message.refId).then((success) => {
              safeSendResponse({ success });
            });
            return true;

          case 'TYPE_INTO_ELEMENT':
            accessibilityTree
              .typeIntoElement(message.refId, message.text, {
                clear: message.clear,
              })
              .then((success) => {
                safeSendResponse({ success });
              });
            return true;

          case 'GET_ELEMENT_BY_REF': {
            const el = accessibilityTree.getElementByRefId(message.refId);
            safeSendResponse({
              found: !!el,
              tagName: el?.tagName,
              textContent: el?.textContent?.substring(0, 200),
            });
            return true;
          }

          // Human simulation commands
          case 'HUMAN_TYPE': {
            const typeElements = simpleChatBridge.findElements();
            const typeTarget = message.refId
              ? accessibilityTree.getElementByRefId(message.refId)
              : typeElements.input;
            if (typeTarget) {
              humanSimulator
                .humanType(typeTarget, message.text, {
                  minDelay: message.minDelay || 50,
                  maxDelay: message.maxDelay || 150,
                  typoChance: message.typoChance || 0.02,
                })
                .then(() => safeSendResponse({ success: true }));
            } else {
              safeSendResponse({ success: false, error: 'No target element' });
            }
            return true;
          }

          case 'HUMAN_CLICK': {
            const clickTarget = message.refId
              ? accessibilityTree.getElementByRefId(message.refId)
              : null;
            if (clickTarget) {
              humanSimulator
                .humanClick(clickTarget)
                .then(() => safeSendResponse({ success: true }));
            } else {
              safeSendResponse({ success: false, error: 'No target element' });
            }
            return true;
          }

          case 'HUMAN_SCROLL':
            humanSimulator.humanScroll(message.target || message.y || 500).then(() => {
              safeSendResponse({ success: true });
            });
            return true;

          // CAPTCHA handling commands
          case 'DETECT_CAPTCHA': {
            const detection = captchaHandler.detectCaptcha();
            safeSendResponse(detection);
            return true;
          }

          case 'BYPASS_CAPTCHA':
            captchaHandler.attemptBypass().then((result) => {
              safeSendResponse(result);
            });
            return true;

          case 'WAIT_FOR_CAPTCHA':
            captchaHandler.waitForCaptchaSolved(message.timeout || 60000).then((solved) => {
              safeSendResponse({ solved });
            });
            return true;

          // Browser-automation parity commands (see background/browser-automation.ts)
          case 'GET_CONSOLE_LOGS':
            safeSendResponse({
              success: true,
              messages: consoleCapture.query({
                pattern: message.pattern,
                onlyErrors: message.onlyErrors,
                limit: message.limit,
              }),
            });
            return true;

          case 'GET_PAGE_TEXT': {
            // Prefer <article>/<main> when present — matches claude-in-chrome's
            // get_page_text preference for article content over full-page
            // chrome (nav bars, footers, ads).
            const container =
              document.querySelector('article') || document.querySelector('main') || document.body;
            const text = (container as HTMLElement)?.innerText?.trim() ?? '';
            safeSendResponse({ success: true, text, length: text.length });
            return true;
          }

          // Forward state updates to panel if it exists
          case 'CONNECTION_STATUS':
          case 'AGENTS_UPDATE':
          case 'CHANNELS_UPDATE':
          case 'JOINED_CHANNELS_UPDATE':
          case 'CHANNEL_PAUSE_UPDATE':
          case 'CHANNEL_SELECTED':
          case 'NOTIFICATION':
          case 'TASK_ASSIGN':
          case 'AI_VIDEO_PROCESSING_UPDATE':
          case 'FUSE_ONBOARDING_CONTEXT':
          case 'TASK_COMPLETE':
          case 'TASK_ERROR':
          // The background fans RESPONSE_COMPLETE out to every tab so that all
          // tabs bound to the same channel share one conversation. These two
          // were missing from this list, so the fan-out hit `default:` and was
          // silently dropped — only the tab that produced the response ever saw
          // it, because its own onResponse callback hands it to the panel
          // directly. The panel de-dupes RESPONSE_COMPLETE by content, so the
          // originating tab does not render it twice.
          case 'RESPONSE_COMPLETE':
          case 'STREAMING_UPDATE':
            if (message.type === 'CHANNEL_SELECTED') {
              this.currentChannel = message.channelId || null;
            }
            if (message.type === 'CHANNEL_PAUSE_UPDATE') {
              const paused = Array.isArray(message.pausedChannels)
                ? message.pausedChannels.map((id: unknown) => String(id))
                : [];
              this.pausedChannels = new Set(paused);
            }
            if (message.type === 'FUSE_ONBOARDING_CONTEXT' && message.payload) {
              // Background front-loads channel/agent context for page agents.
              if (this.panel) {
                this.panel.handleMessage(message);
              }
              safeSendResponse({ success: true });
              return true;
            }
            if (this.panel) {
              this.panel.handleMessage(message);
            }
            safeSendResponse({ success: true });
            return true;

          case 'NEW_MESSAGE': {
            if (message.message) {
              const msg = message.message;

              // DEDUPE GUARD: Never process the same message ID twice.
              // This is vital for stopping feedback loops between Relay and Cloudflare.
              if (msg.id && this.processedMessageIds.has(msg.id)) {
                safeSendResponse({ success: true, reason: 'deduped' });
                return true;
              }
              if (msg.id) this.processedMessageIds.add(msg.id);

              const myChannel = this.panel?.getCurrentChannel();
              const effectiveChannel = myChannel || this.currentChannel;
              const messageChannel = msg.channel || msg.metadata?.channel;
              const messageChannelId = messageChannel ? String(messageChannel) : '';

              // Hard mute for paused channels on this tab:
              // do not render into panel and do not auto-inject while paused.
              if (
                msg.to === 'broadcast' &&
                messageChannelId &&
                this.isChannelPaused(messageChannelId) &&
                msg.metadata?.forceInject !== true
              ) {
                console.log('[FuseConnect v7] ⏸️ Skipping paused-channel message', {
                  messageChannel: messageChannelId,
                  pausedChannels: Array.from(this.pausedChannels),
                });
                safeSendResponse({ success: true, reason: 'paused_channel' });
                return true;
              }

              // CHANNEL FILTERING:
              // Only process messages for OUR channel (or if no channel filtering needed)
              // Direct messages (to specific agentId) always bypass channel filtering.
              const isBroadcast = msg.to === 'broadcast';
              const isForMyChannel =
                !isBroadcast ||
                !messageChannel ||
                !effectiveChannel ||
                messageChannel === effectiveChannel;

              if (!isForMyChannel) {
                console.log('[FuseConnect v7] ⏭️ Skipping message for different channel:', {
                  messageChannel,
                  myChannel: effectiveChannel,
                  contentPreview: msg.content?.substring(0, 30),
                });
                safeSendResponse({ success: true });
                return true;
              }

              // Forward to panel for display if it exists
              if (this.panel) {
                this.panel.handleMessage(message);
              }

              // Handle message injection (works even if panel isn't open)
              // TARGETED INJECTION: If addressed specifically to this page agent
              if (this.pageAgentId && msg.to === this.pageAgentId && msg.content) {
                if (!this.canAutoInjectRelayMessage(msg)) {
                  console.log(
                    '[FuseConnect v7] ⏭️ Skipping targeted auto-injection (panel hidden on this tab)'
                  );
                  safeSendResponse({ success: true, reason: 'panel_hidden' });
                  return true;
                }
                if (!this.shouldInjectRelayMessage(msg)) {
                  console.log(
                    '[FuseConnect v7] ⏭️ Skipping non-conversational targeted message',
                    msg.metadata?.eventType || msg.messageType || 'unknown'
                  );
                  safeSendResponse({ success: true, reason: 'filtered_system_message' });
                  return true;
                }
                console.log('[FuseConnect v7] Injecting targeted message:', msg.content);
                this.injectMessage(msg.content, msg.metadata, { preserveUserFocus: true }).then(
                  (success) => {
                    if (success) console.log('[FuseConnect v7] Injection successful');
                    else console.warn('[FuseConnect v7] Injection failed');
                  }
                );
              }
              // CHANNEL BROADCAST INJECTION: If from external agent on same channel
              else if (msg.to === 'broadcast' && msg.content && msg.from) {
                if (!this.canAutoInjectRelayMessage(msg)) {
                  console.log(
                    '[FuseConnect v7] ⏭️ Skipping broadcast auto-injection (panel hidden on this tab)'
                  );
                  safeSendResponse({ success: true, reason: 'panel_hidden' });
                  return true;
                }
                if (!this.shouldInjectRelayMessage(msg)) {
                  console.log(
                    '[FuseConnect v7] ⏭️ Skipping non-conversational broadcast message',
                    msg.metadata?.eventType || msg.messageType || 'unknown'
                  );
                  safeSendResponse({ success: true, reason: 'filtered_system_message' });
                  return true;
                }
                // CRITICAL FIX: Check both msg.from AND metadata.senderId for self-identification
                // The senderId in metadata is more reliable as it's set when the message originates
                const senderFromMetadata = msg.metadata?.senderId;
                const isStreaming = simpleChatBridge.isStreaming();

                // NORMALIZE IDs for comparison (strip common prefixes)
                const normalizeId = (id: string) =>
                  id ? id.replace(/^(page-agent-|browser-|agent-)/, '') : '';

                const myNormalizedId = normalizeId(this.pageAgentId || '');
                const fromNormalizedId = normalizeId(msg.from || '');
                const metaSenderNormalizedId = normalizeId(senderFromMetadata || '');

                const isFromSelf =
                  (myNormalizedId &&
                    fromNormalizedId &&
                    myNormalizedId.startsWith(fromNormalizedId) &&
                    fromNormalizedId.length > 5) ||
                  (myNormalizedId &&
                    metaSenderNormalizedId &&
                    myNormalizedId.startsWith(metaSenderNormalizedId) &&
                    metaSenderNormalizedId.length > 5) ||
                  msg.from === 'You';

                const isFromYou = msg.from === 'You';

                // Also check browser agent ID if we can get it from storage or background
                // This is a safety margin against late pageAgentId assignment
                const isExternalAgent = !isFromSelf;

                // Debug logging to trace agent identification
                console.log('[FuseConnect v7] 📨 Message received:', {
                  from: msg.from,
                  senderId: senderFromMetadata,
                  myAgentId: this.pageAgentId,
                  isFromSelf,
                  isExternalAgent,
                  messageType: msg.messageType,
                  channel: messageChannel,
                });

                // FIXED LOGIC:
                // - Skip ONLY self-messages (already handled by isExternalAgent check)
                // - AI responses from OTHER agents SHOULD be injected so our AI can see/respond to them
                // - This enables true multi-AI conversation
                if (!isExternalAgent) {
                  console.log('[FuseConnect v7] ⏭️ Skipping message:', {
                    from: msg.from,
                    senderId: senderFromMetadata,
                    myAgentId: this.pageAgentId,
                    reason: isFromYou ? 'from-you' : isFromSelf ? 'same-agent' : 'unknown',
                  });
                } else {
                  // SAFETY CHECK: If AI is actively streaming, DO NOT INJECT IMMEDIATELY.
                  // Instead, add to queue.
                  if (isStreaming) {
                    console.log(
                      '[FuseConnect v7] ⏳ AI is streaming, QUEUING message for later injection:',
                      msg.content.substring(0, 50)
                    );
                    this.queueMessage(msg.content, msg.metadata);
                    safeSendResponse({ success: true, reason: 'queued_while_streaming' });
                    return true;
                  }

                  // This is from an external agent - inject it!
                  // (Even if it's an AI response - we WANT to inject other AIs' responses)
                  console.log('[FuseConnect v7] ✅ Injecting message from external agent:', {
                    from: msg.from,
                    isAIResponse: msg.messageType === 'ai-response' || msg.metadata?.isAIResponse,
                    contentPreview: msg.content.substring(0, 50),
                    channel: messageChannel,
                  });

                  // FEDERATION IMPROVEMENT: Track orchestrator tasks for response correlation
                  const isOrchestratorTask =
                    msg.metadata?.source === 'orchestrator' ||
                    msg.metadata?.taskId ||
                    msg.metadata?.requiresResponse;

                  if (isOrchestratorTask) {
                    console.log(
                      '[FuseConnect v7] 🎯 Orchestrator task detected:',
                      msg.metadata?.taskId
                    );
                    // Register this as a pending request so we can correlate the AI response
                    this.trackPendingRequest({
                      correlationId: msg.metadata?.correlationId || msg.id || `req-${Date.now()}`,
                      taskId: msg.metadata?.taskId,
                      from: msg.from,
                    });
                  }

                  this.injectMessage(msg.content, msg.metadata, { preserveUserFocus: true }).then(
                    (success) => {
                      if (success) console.log('[FuseConnect v7] ✅ Injection successful');
                      else console.warn('[FuseConnect v7] ⚠️ Injection failed');
                    }
                  );
                }
              }
            }

            safeSendResponse({ success: true });
            return true;
          }

          default:
            // Always ack unknown broadcasts so background fire-and-forget stays quiet.
            safeSendResponse({ success: true, ignored: true, type: message?.type || null });
            return false;
        }
      } catch (e: any) {
        console.error('[FuseConnect] Content script message handler error:', e);
        // Don't call sendResponse here for async cases as it might be too late,
        // but for sync cases it prevents the "closed prematurely" error.
        try {
          safeSendResponse({ success: false, error: e.message || 'Unknown error' });
        } catch (ignore) {
          // ignore if response sent already
        }
      }
      return false;
    });
  }

  /**
   * Safely send message to background
   */
  private safeSendMessage(message: any, callback?: (response: any) => void): void {
    if (!chrome.runtime?.id) return;
    try {
      chrome.runtime.sendMessage(message, (response) => {
        // Access lastError to suppress "Unchecked runtime.lastError" warnings
        const error = chrome.runtime.lastError;
        if (error) {
          const errorMessage = error.message || '';
          callback?.({
            success: false,
            transient: errorMessage.includes('Receiving end does not exist'),
            error: errorMessage,
          });
          return;
        }
        if (callback && !error) {
          callback(response);
        }
      });
    } catch (e) {
      // Ignore context invalidated errors
    }
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Shift + F to toggle panel
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        this.togglePanel();
      }

      // Ctrl/Cmd + Shift + I to inject last clipboard as message
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        navigator.clipboard.readText().then((text) => {
          if (text) this.injectMessage(text);
        });
      }
    });

    window.addEventListener('fuse:inject-message', (e: any) => {
      const { content, metadata } = e.detail || {};
      if (content) {
        this.injectMessage(content, metadata);
      }
    });
  }

  /**
   * Only conversational payloads should be auto-injected into page chat.
   * Control-plane events (activity/wake/heartbeat) stay in the injectable panel
   * and must not be submitted into the host model input.
   */
  private shouldInjectRelayMessage(msg: any): boolean {
    const content = String(msg?.content || '').trim();
    if (!content) return false;
    if (isControlPlaneRelayMessage(msg)) return false;
    return true;
  }

  private async injectMessage(
    content: string,
    metadata?: any,
    options?: { preserveUserFocus?: boolean }
  ): Promise<boolean> {
    console.log('[FuseConnect v7] Injecting message:', content.substring(0, 50));

    let finalContent = content;

    // FEDERATION IMPROVEMENT: Prepend full federated ID#ing logic if it's missing
    if (!finalContent.includes('[Sender:')) {
      const senderId = metadata?.senderId || this.pageAgentId || 'Human';
      const channel = metadata?.channel || this.currentChannel || 'global';

      // Compute full UFTE / Phase 9 Federated Identity
      let handle = senderId;
      let idNumber = 'UNKNOWN';
      try {
        const identity = buildPageAgentIdentity(senderId, 'FUSE_BROWSER');
        handle = identity.operationalHandle;
        idNumber = identity.idNumber;
      } catch (e) {
        // Fallback if senderId is malformed
      }

      // Format: [Sender: XXX (@ID#:YYY)][Channel: ZZZ] text
      // Follows Phase 9 DACC formatting + UFTE identity requirements
      finalContent = `[Sender: ${handle} (@${idNumber})][Channel: ${channel}]\n${finalContent}`;
    }

    const preserveUserFocus =
      options?.preserveUserFocus === true || isControlPlaneRelayMessage({ content, metadata });
    const success = await simpleChatBridge.sendMessage(finalContent, { preserveUserFocus });

    if (success) {
      this.selfPrompter.updateActivity();
      console.log('[FuseConnect v7] Message sent successfully');
    } else {
      console.error('[FuseConnect v7] Message send failed');
    }

    return success;
  }

  private enableSelfPrompter(): void {
    this.selfPrompter.enable();
    if (this.selfPrompterInterval !== null) return;

    this.selfPrompterInterval = window.setInterval(() => {
      this.selfPrompter.checkAndPrompt();
    }, 5000);
  }

  private disableSelfPrompter(): void {
    this.selfPrompter.disable();
    if (this.selfPrompterInterval === null) return;

    window.clearInterval(this.selfPrompterInterval);
    this.selfPrompterInterval = null;
  }

  /**
   * FEDERATION IMPROVEMENT: Track a pending request for response correlation
   */
  private trackPendingRequest(request: {
    correlationId: string;
    taskId?: string;
    from: string;
  }): void {
    this.pendingRequests.set(request.correlationId, {
      ...request,
      timestamp: Date.now(),
    });
    console.log('[FuseConnect v7] 📝 Tracking pending request:', request.correlationId);

    // Clean up old requests (older than 5 minutes)
    const now = Date.now();
    for (const [id, req] of this.pendingRequests) {
      if (now - req.timestamp > 300000) {
        this.pendingRequests.delete(id);
      }
    }
  }

  /**
   * FEDERATION IMPROVEMENT: Get the oldest pending request for response matching
   */
  private getOldestPendingRequest(): {
    correlationId: string;
    taskId?: string;
    from: string;
    timestamp: number;
  } | null {
    let oldest: { correlationId: string; taskId?: string; from: string; timestamp: number } | null =
      null;

    for (const req of this.pendingRequests.values()) {
      if (!oldest || req.timestamp < oldest.timestamp) {
        oldest = req;
      }
    }

    return oldest;
  }

  /**
   * Check for CAPTCHA on page load and notify if found
   */
  private checkForCaptcha(): void {
    const detection = captchaHandler.detectCaptcha();

    if (detection.detected) {
      console.log(
        `[FuseConnect v7] CAPTCHA detected: ${detection.type} (confidence: ${detection.confidence})`
      );

      this.safeSendMessage({
        type: 'CAPTCHA_DETECTED',
        captcha: {
          type: detection.type,
          confidence: detection.confidence,
          url: window.location.href,
        },
      });
    }
  }

  /**
   * Queue a message for injection
   */
  private queueMessage(content: string, metadata?: any): void {
    this.injectionQueue.push({
      content,
      metadata,
      timestamp: Date.now(),
      attempts: 0,
    });
    // Try to process immediately (will fail if still streaming, but sets up interval)
    this.processInjectionQueue();
  }

  /**
   * Process the injection queue
   */
  private processInjectionQueue(): void {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    const process = async () => {
      if (this.injectionQueue.length === 0) {
        this.isProcessingQueue = false;
        return;
      }

      if (simpleChatBridge.isStreaming()) {
        // Still streaming, wait and retry
        console.debug('[FuseConnect v7] Queue paused (AI streaming)...');
        setTimeout(process, 1000);
        return;
      }

      // Ready to inject
      const item = this.injectionQueue.shift();
      if (item) {
        console.log(
          '[FuseConnect v7] 🚀 Processing queued message:',
          item.content.substring(0, 30)
        );

        // If it's an orchestrator task, track it again (timestamp refresh)
        const isOrchestratorTask =
          item.metadata?.source === 'orchestrator' ||
          item.metadata?.taskId ||
          item.metadata?.requiresResponse;

        if (isOrchestratorTask) {
          this.trackPendingRequest({
            correlationId: item.metadata?.correlationId || `queued-${Date.now()}`,
            taskId: item.metadata?.taskId,
            from: item.metadata?.senderId || 'unknown',
          });
        }

        await this.injectMessage(item.content, item.metadata, { preserveUserFocus: true });

        // Wait a bit before next injection to allow UI to update
        // (Wait longer than the _sendingGuard in SimpleChatBridge to avoid self-blocking)
        setTimeout(process, 3500);
      } else {
        this.isProcessingQueue = false;
      }
    };

    process();
  }

  /**
   * Auto relay injection does not open the overlay. Page-chat injection can
   * proceed while the panel is closed; forceInject still bypasses pause.
   */
  private canAutoInjectRelayMessage(msg: any): boolean {
    if (msg?.metadata?.forceInject === true) return true;
    const channelId = msg?.channel || msg?.metadata?.channel || this.currentChannel;
    if (channelId && this.isChannelPaused(String(channelId))) return false;
    return true;
  }

  private isChannelPaused(channelId: string): boolean {
    if (!channelId) return false;
    if (this.pausedChannels.has(channelId)) return true;
    const normalized = channelId.trim().toLowerCase();
    if (!normalized) return false;
    for (const pausedId of this.pausedChannels) {
      if (String(pausedId).trim().toLowerCase() === normalized) return true;
    }
    return false;
  }
}

// Initialize with guard to prevent multiple instances
if (shouldSkipForPage()) {
  console.log('[FuseConnect v7] Skipping content script on auth/challenge/IDE page');
} else if (!window.__FUSE_CONNECT_INITIALIZED__) {
  window.__FUSE_CONNECT_INITIALIZED__ = true;
  new FuseConnectContentScript();
} else {
  console.log('[FuseConnect v7] Content script already initialized, skipping duplicate');
}

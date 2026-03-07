/**
 * Fuse Connect v6 - Content Script Entry Point
 *
 * SIMPLIFIED VERSION - Uses SimpleChatBridge for direct Gemini interaction.
 *
 * The floating panel is NOT auto-injected. It only appears when:
 * 1. User clicks "Open Panel" button in popup
 * 2. User presses Ctrl+Shift+F keyboard shortcut
 */

import { simpleChatBridge } from './adapters/SimpleChatBridge';
import './guard'; // MUST BE FIRST - Patches customElements.define
import { createEnhancedFloatingPanel, EnhancedFloatingPanel } from './injectable/FloatingPanel';
import { accessibilityTree } from './utils/AccessibilityTree';
import { captchaHandler } from './utils/CaptchaHandler';
import { humanSimulator } from './utils/HumanBehaviorSimulator';

// Guard against multiple initialization (can happen in iframes or with hot reload)
declare global {
  interface Window {
    __FUSE_CONNECT_INITIALIZED__?: boolean;
    __FUSE_DEBUG?: {
      getLastResponse: () => string | null;
      sendTestMessage: (msg: string) => void;
      checkExtensionContext: () => boolean;
      findElements: () => object;
    };
  }
}

class FuseConnectContentScript {
  private panel: EnhancedFloatingPanel | null = null;
  private isInitialized = false;
  private panelVisible = false;
  private chatReady = false;
  private pageAgentId: string | null = null;

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

    console.log('[FuseConnect v6] Content script initialized (panel AUTO-OPEN disabled)');

    // Auto-open panel disabled by default per user request
    // try {
    //   this.showPanel();
    // } catch (e) {
    //   console.error('[FuseConnect v6] Failed to auto-open panel:', e);
    // }

    // Initialize the simple chat bridge with callbacks
    simpleChatBridge.init({
      onResponse: (content) => {
        console.log('[FuseConnect v6] AI Response received, length:', content.length);

        // Forward to panel
        if (this.panel) {
          this.panel.handleMessage({
            type: 'RESPONSE_COMPLETE',
            content: content,
          });
        }

        // FEDERATION IMPROVEMENT: Check for pending request to correlate response
        const pendingRequest = this.getOldestPendingRequest();
        if (!this.pageAgentId) {
          console.warn(
            '[FuseConnect v6] ⚠️ Page Agent ID missing during response! This may cause message drop.'
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
            '[FuseConnect v6] 🔗 Correlating response to request:',
            pendingRequest.correlationId
          );
          this.pendingRequests.delete(pendingRequest.correlationId);
        }

        // Forward to background for relay with correlation info
        this.safeSendMessage({
          type: 'RESPONSE_COMPLETE',
          content: content.length > 50000 ? content.substring(0, 50000) : content,
          channel: currentChannel, // Also pass at top level for easier access
          metadata: responseMetadata,
        });

        // Trigger queue processing after response
        this.processInjectionQueue();
      },
      onError: (error) => {
        console.error('[FuseConnect v6] Chat bridge error:', error);
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

    // Notify background that content script is ready
    this.safeSendMessage({
      type: 'CONTENT_SCRIPT_READY',
      url: window.location.href,
      hostname: window.location.hostname,
    });
  }

  /**
   * Periodically check for chat elements
   */
  private startChatDetection(): void {
    const checkElements = () => {
      const elements = simpleChatBridge.findElements();

      if (elements.isReady && !this.chatReady) {
        this.chatReady = true;
        console.log('[FuseConnect v6] Chat is ready!');

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
            if (response?.agentId) {
              this.pageAgentId = response.agentId;
              console.log('[FuseConnect v6] Assigned Page Agent ID:', this.pageAgentId);
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
    };

    console.log('[FuseConnect v6] Debug utils available at window.__FUSE_DEBUG');
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
      this.panel = createEnhancedFloatingPanel();

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
    console.log('[FuseConnect v6] Panel shown');
  }

  /**
   * Hide the floating panel
   */
  private hidePanel(): void {
    if (this.panel) {
      this.panel.hide();
      this.panelVisible = false;
      console.log('[FuseConnect v6] Panel hidden');
    }
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
            this.injectMessage(message.content).then((success) => {
              safeSendResponse({ success });
            });
            return true;

          case 'GET_LAST_RESPONSE':
            const response = simpleChatBridge.getLastResponse();
            safeSendResponse({ response });
            return true;

          case 'GET_CHAT_STATUS':
            const elements = simpleChatBridge.findElements();
            safeSendResponse({
              detected: elements.isReady,
              confidence: elements.isReady ? 1 : 0,
              isStreaming: false,
            });
            return true;

          // Accessibility tree commands
          case 'GET_ACCESSIBILITY_TREE':
            const treeResult = accessibilityTree.generateTree({
              filter: message.filter,
              maxDepth: message.maxDepth,
              refId: message.refId,
            });
            safeSendResponse(treeResult);
            return true;

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

          case 'GET_ELEMENT_BY_REF':
            const el = accessibilityTree.getElementByRefId(message.refId);
            safeSendResponse({
              found: !!el,
              tagName: el?.tagName,
              textContent: el?.textContent?.substring(0, 200),
            });
            return true;

          // Human simulation commands
          case 'HUMAN_TYPE':
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

          case 'HUMAN_CLICK':
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

          case 'HUMAN_SCROLL':
            humanSimulator.humanScroll(message.target || message.y || 500).then(() => {
              safeSendResponse({ success: true });
            });
            return true;

          // CAPTCHA handling commands
          case 'DETECT_CAPTCHA':
            const detection = captchaHandler.detectCaptcha();
            safeSendResponse(detection);
            return true;

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

          // Forward state updates to panel if it exists
          case 'CONNECTION_STATUS':
          case 'AGENTS_UPDATE':
          case 'CHANNELS_UPDATE':
          case 'JOINED_CHANNELS_UPDATE':
          case 'NOTIFICATION':
          case 'TASK_ASSIGN':
            if (this.panel) {
              this.panel.handleMessage(message);
            }
            safeSendResponse({ success: true });
            return true;

          case 'NEW_MESSAGE':
            // Forward to panel for display if it exists
            if (this.panel) {
              this.panel.handleMessage(message);
            }

            // Handle message injection (works even if panel isn't open)
            if (message.message) {
              const msg = message.message;

              // TARGETED INJECTION: If addressed specifically to this page agent
              if (this.pageAgentId && msg.to === this.pageAgentId && msg.content) {
                console.log('[FuseConnect v6] Injecting targeted message:', msg.content);
                this.injectMessage(msg.content).then((success) => {
                  if (success) console.log('[FuseConnect v6] Injection successful');
                  else console.warn('[FuseConnect v6] Injection failed');
                });
              }
              // CHANNEL BROADCAST INJECTION: If from external agent on same channel
              else if (msg.to === 'broadcast' && msg.content && msg.from) {
                // CRITICAL FIX: Check both msg.from AND metadata.senderId for self-identification
                // The senderId in metadata is more reliable as it's set when the message originates
                const senderFromMetadata = msg.metadata?.senderId;
                const isStreaming = simpleChatBridge.isStreaming();

                console.log('[FuseConnect v6] 🔍 Msg Check:', {
                  from: msg.from,
                  metaSender: senderFromMetadata,
                  myId: this.pageAgentId,
                  streaming: isStreaming,
                });

                // FIXED: Only exact matches count as self-messages
                // Check BOTH msg.from AND senderId metadata
                // The senderId in metadata is the ORIGINAL sender (the tab/agent that initiated the message)
                const isSelfMessage =
                  msg.from === this.pageAgentId || senderFromMetadata === this.pageAgentId;

                // CRITICAL FIX: Messages come from Browser Agent but the REAL sender is in metadata
                // We want to BLOCK messages if:
                // 1. They came from 'You' (user typing in panel)
                // 2. The senderId matches THIS tab's page agent (our own messages)
                // We want to ALLOW messages if:
                // - They came from a DIFFERENT page agent (another tab) or external CLI agent
                // - Even if msg.from is 'Browser Agent' - that's just the relay!
                const isFromSelf = isSelfMessage || senderFromMetadata === this.pageAgentId;
                const isFromYou = msg.from === 'You';

                // An external message is anything NOT from us and NOT from 'You'
                const isExternalAgent = !isFromYou && !isFromSelf;

                // Debug logging to trace agent identification
                console.log('[FuseConnect v6] 📨 Message received:', {
                  from: msg.from,
                  senderId: senderFromMetadata,
                  myAgentId: this.pageAgentId,
                  isSelfMessage,
                  isFromSelf,
                  isExternalAgent,
                  messageType: msg.messageType,
                });

                // FIXED LOGIC:
                // - Skip ONLY self-messages (already handled by isExternalAgent check)
                // - AI responses from OTHER agents SHOULD be injected so our AI can see/respond to them
                // - This enables true multi-AI conversation
                if (!isExternalAgent) {
                  console.log('[FuseConnect v6] ⏭️ Skipping message:', {
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
                      '[FuseConnect v6] ⏳ AI is streaming, QUEUING message for later injection:',
                      msg.content.substring(0, 50)
                    );
                    this.queueMessage(msg.content, msg.metadata);
                    return;
                  }

                  // This is from an external agent - inject it!
                  // (Even if it's an AI response - we WANT to inject other AIs' responses)
                  console.log('[FuseConnect v6] ✅ Injecting message from external agent:', {
                    from: msg.from,
                    isAIResponse: msg.messageType === 'ai-response' || msg.metadata?.isAIResponse,
                    contentPreview: msg.content.substring(0, 50),
                  });

                  // FEDERATION IMPROVEMENT: Track orchestrator tasks for response correlation
                  const isOrchestratorTask =
                    msg.metadata?.source === 'orchestrator' ||
                    msg.metadata?.taskId ||
                    msg.metadata?.requiresResponse;

                  if (isOrchestratorTask) {
                    console.log(
                      '[FuseConnect v6] 🎯 Orchestrator task detected:',
                      msg.metadata?.taskId
                    );
                    // Register this as a pending request so we can correlate the AI response
                    this.trackPendingRequest({
                      correlationId: msg.metadata?.correlationId || msg.id || `req-${Date.now()}`,
                      taskId: msg.metadata?.taskId,
                      from: msg.from,
                    });
                  }

                  this.injectMessage(msg.content).then((success) => {
                    if (success) console.log('[FuseConnect v6] ✅ Injection successful');
                    else console.warn('[FuseConnect v6] ⚠️ Injection failed');
                  });
                }
              }
            }

            safeSendResponse({ success: true });
            return true;
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
  }

  private async injectMessage(content: string, metadata?: any): Promise<boolean> {
    console.log('[FuseConnect v6] Injecting message:', content.substring(0, 50));

    const success = await simpleChatBridge.sendMessage(content);

    if (success) {
      console.log('[FuseConnect v6] Message sent successfully');
    } else {
      console.error('[FuseConnect v6] Message send failed');
    }

    return success;
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
    console.log('[FuseConnect v6] 📝 Tracking pending request:', request.correlationId);

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
        `[FuseConnect v6] CAPTCHA detected: ${detection.type} (confidence: ${detection.confidence})`
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
        console.debug('[FuseConnect v6] Queue paused (AI streaming)...');
        setTimeout(process, 1000);
        return;
      }

      // Ready to inject
      const item = this.injectionQueue.shift();
      if (item) {
        console.log(
          '[FuseConnect v6] 🚀 Processing queued message:',
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

        await this.injectMessage(item.content, item.metadata);

        // Wait a bit before next injection to allow UI to update
        // (Wait longer than the _sendingGuard in SimpleChatBridge to avoid self-blocking)
        setTimeout(process, 3500);
      } else {
        this.isProcessingQueue = false;
      }
    };

    process();
  }
}

// Initialize with guard to prevent multiple instances
if (!window.__FUSE_CONNECT_INITIALIZED__) {
  window.__FUSE_CONNECT_INITIALIZED__ = true;
  new FuseConnectContentScript();
} else {
  console.log('[FuseConnect v6] Content script already initialized, skipping duplicate');
}

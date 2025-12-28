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

    console.log('[FuseConnect v6] Content script initialized (panel hidden by default)');

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

        // Forward to background for relay
        chrome.runtime.sendMessage({
          type: 'RESPONSE_COMPLETE',
          content: content.length > 50000 ? content.substring(0, 50000) : content,
        });
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
    chrome.runtime.sendMessage({
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
        chrome.runtime.sendMessage({
          type: 'CHAT_DETECTED',
          elements: {
            hasInput: !!elements.input,
            hasSendButton: !!elements.sendButton,
            confidence: 1,
            isStreaming: false,
          },
        });

        // Update panel if exists
        if (this.panel) {
          this.panel.updateChatElements({
            input: elements.input,
            sendButton: elements.sendButton,
            messageContainer: null,
            lastMessage: null,
            isStreaming: false,
            confidence: 1,
          });
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
        });
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
      switch (message.type) {
        case 'TOGGLE_PANEL':
          this.togglePanel();
          sendResponse({ success: true, visible: this.panelVisible });
          return true;

        case 'SHOW_PANEL':
          this.showPanel();
          sendResponse({ success: true });
          return true;

        case 'HIDE_PANEL':
          this.hidePanel();
          sendResponse({ success: true });
          return true;

        case 'GET_PANEL_STATUS':
          sendResponse({ visible: this.panelVisible, exists: !!this.panel });
          return true;

        case 'INJECT_MESSAGE':
          this.injectMessage(message.content).then((success) => {
            sendResponse({ success });
          });
          return true;

        case 'GET_LAST_RESPONSE':
          const response = simpleChatBridge.getLastResponse();
          sendResponse({ response });
          return true;

        case 'GET_CHAT_STATUS':
          const elements = simpleChatBridge.findElements();
          sendResponse({
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
          sendResponse(treeResult);
          return true;

        case 'CLICK_ELEMENT':
          accessibilityTree.clickElement(message.refId).then((success) => {
            sendResponse({ success });
          });
          return true;

        case 'TYPE_INTO_ELEMENT':
          accessibilityTree
            .typeIntoElement(message.refId, message.text, {
              clear: message.clear,
            })
            .then((success) => {
              sendResponse({ success });
            });
          return true;

        case 'GET_ELEMENT_BY_REF':
          const el = accessibilityTree.getElementByRefId(message.refId);
          sendResponse({
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
              .then(() => sendResponse({ success: true }));
          } else {
            sendResponse({ success: false, error: 'No target element' });
          }
          return true;

        case 'HUMAN_CLICK':
          const clickTarget = message.refId
            ? accessibilityTree.getElementByRefId(message.refId)
            : null;
          if (clickTarget) {
            humanSimulator.humanClick(clickTarget).then(() => sendResponse({ success: true }));
          } else {
            sendResponse({ success: false, error: 'No target element' });
          }
          return true;

        case 'HUMAN_SCROLL':
          humanSimulator.humanScroll(message.target || message.y || 500).then(() => {
            sendResponse({ success: true });
          });
          return true;

        // CAPTCHA handling commands
        case 'DETECT_CAPTCHA':
          const detection = captchaHandler.detectCaptcha();
          sendResponse(detection);
          return true;

        case 'BYPASS_CAPTCHA':
          captchaHandler.attemptBypass().then((result) => {
            sendResponse(result);
          });
          return true;

        case 'WAIT_FOR_CAPTCHA':
          captchaHandler.waitForCaptchaSolved(message.timeout || 60000).then((solved) => {
            sendResponse({ solved });
          });
          return true;

        // Forward state updates to panel if it exists
        case 'CONNECTION_STATUS':
        case 'AGENTS_UPDATE':
        case 'CHANNELS_UPDATE':
        case 'NOTIFICATION':
          if (this.panel) {
            this.panel.handleMessage(message);
          }
          sendResponse({ success: true });
          return true;

        case 'NEW_MESSAGE':
          // Forward to panel for display
          if (this.panel) {
            this.panel.handleMessage(message);
          }

          // AUTO-INJECT: If message is from an external agent, inject it into the page chat
          if (message.message) {
            const msg = message.message;
            const isFromExternalAgent =
              msg.from &&
              !msg.from.includes('You') &&
              !msg.from.includes('AI (Page)') &&
              !msg.from.includes('Browser Agent');

            const isAIResponseEcho =
              msg.content?.startsWith('[AI Response]') ||
              msg.content?.startsWith('[AI → User]') ||
              msg.content?.startsWith('[User → AI]') ||
              msg.messageType === 'ai-response';

            console.log('[FuseConnect v6] NEW_MESSAGE auto-inject check:', {
              from: msg.from,
              isFromExternalAgent,
              isAIResponseEcho,
              hasContent: !!msg.content,
            });

            if (isFromExternalAgent && msg.content && !isAIResponseEcho) {
              console.log('[FuseConnect v6] Auto-injecting external message from:', msg.from);
              // Use the same method as manual send - directly call simpleChatBridge
              this.injectMessage(msg.content).then((success) => {
                if (success) {
                  console.log('[FuseConnect v6] External message injected successfully');
                } else {
                  console.warn('[FuseConnect v6] Failed to inject external message');
                }
              });
            }
          }

          sendResponse({ success: true });
          return true;
      }
    });
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

  private async injectMessage(content: string): Promise<boolean> {
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
   * Check for CAPTCHA on page load and notify if found
   */
  private checkForCaptcha(): void {
    const detection = captchaHandler.detectCaptcha();

    if (detection.detected) {
      console.log(
        `[FuseConnect v6] CAPTCHA detected: ${detection.type} (confidence: ${detection.confidence})`
      );

      chrome.runtime.sendMessage({
        type: 'CAPTCHA_DETECTED',
        captcha: {
          type: detection.type,
          confidence: detection.confidence,
          url: window.location.href,
        },
      });
    }
  }
}

// Initialize with guard to prevent multiple instances
if (!window.__FUSE_CONNECT_INITIALIZED__) {
  window.__FUSE_CONNECT_INITIALIZED__ = true;
  new FuseConnectContentScript();
} else {
  console.log('[FuseConnect v6] Content script already initialized, skipping duplicate');
}

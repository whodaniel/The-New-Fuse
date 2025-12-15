/**
 * The New Fuse Chrome Extension - Content Script
 *
 * Injected into web pages to:
 * - Detect AI chat platforms (Gemini, ChatGPT, Claude, etc.)
 * - Inject floating panel UI
 * - Handle text injection into chat inputs
 * - Capture AI responses
 * - Bridge communication between page and extension
 *
 * @version 1.0.0
 */

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__tnfContentScriptLoaded) {
    console.log('[TNF] Content script already loaded');
    return;
  }
  window.__tnfContentScriptLoaded = true;

  console.log('[TNF] Content script initializing...');

  // ============================================
  // Configuration
  // ============================================

  const CONFIG = {
    // AI Platform selectors
    platforms: {
      gemini: {
        name: 'Google Gemini',
        hostname: ['gemini.google.com', 'bard.google.com'],
        inputSelector: [
          'div[contenteditable="true"][aria-label*="prompt"]',
          'textarea[aria-label*="prompt"]',
          'div.ql-editor[contenteditable="true"]',
          'rich-textarea div[contenteditable="true"]',
          '.input-area textarea',
          'div[role="textbox"]',
        ],
        outputSelector: [
          '.response-content',
          '.model-response',
          'message-content',
          '.markdown-content',
          '[data-message-id] .message-body',
        ],
        sendButtonSelector: [
          'button[aria-label*="Send"]',
          'button[aria-label*="submit"]',
          'button.send-button',
          'mat-icon[data-mat-icon-name="send"]',
          'button:has(mat-icon)',
        ],
      },
      chatgpt: {
        name: 'ChatGPT',
        hostname: ['chat.openai.com', 'chatgpt.com'],
        inputSelector: [
          'textarea[data-id="root"]',
          '#prompt-textarea',
          'textarea[placeholder*="Message"]',
          'div[contenteditable="true"][data-placeholder]',
        ],
        outputSelector: [
          '.markdown',
          '.message-content',
          '[data-message-author-role="assistant"]',
          '.agent-turn .message-body',
        ],
        sendButtonSelector: [
          'button[data-testid="send-button"]',
          'button[aria-label="Send message"]',
          'form button[type="submit"]',
        ],
      },
      claude: {
        name: 'Claude',
        hostname: ['claude.ai'],
        inputSelector: [
          'div[contenteditable="true"]',
          'textarea[placeholder*="Message"]',
          '.ProseMirror[contenteditable="true"]',
          'div[data-placeholder]',
        ],
        outputSelector: [
          '.prose',
          '.message-content',
          '[data-testid="message-content"]',
          '.chat-message-content',
        ],
        sendButtonSelector: [
          'button[aria-label="Send Message"]',
          'button:has(svg[viewBox="0 0 24 24"])',
          'button[type="submit"]',
        ],
      },
      perplexity: {
        name: 'Perplexity',
        hostname: ['perplexity.ai'],
        inputSelector: ['textarea', 'div[contenteditable="true"]'],
        outputSelector: ['.prose', '.answer-content'],
        sendButtonSelector: ['button[aria-label*="Submit"]', 'button[type="submit"]'],
      },
    },

    // Floating panel settings
    panelId: 'tnf-floating-panel',
    panelWidth: 320,
    panelHeight: 400,
  };

  // ============================================
  // State
  // ============================================

  let state = {
    platform: null,
    isMonitoring: false,
    lastResponse: null,
    floatingPanel: null,
    observer: null,
  };

  // ============================================
  // Platform Detection
  // ============================================

  function detectPlatform() {
    const hostname = window.location.hostname;

    for (const [key, platform] of Object.entries(CONFIG.platforms)) {
      if (platform.hostname.some((h) => hostname.includes(h))) {
        state.platform = { key, ...platform };
        console.log(`[TNF] Detected platform: ${platform.name}`);
        return state.platform;
      }
    }

    console.log('[TNF] No supported AI platform detected');
    return null;
  }

  // ============================================
  // Element Finding
  // ============================================

  function findElement(selectors) {
    if (!Array.isArray(selectors)) selectors = [selectors];

    for (const selector of selectors) {
      try {
        const el = document.querySelector(selector);
        if (el && isVisible(el)) {
          return el;
        }
      } catch (e) {
        // Invalid selector, continue
      }
    }
    return null;
  }

  function findAllElements(selectors) {
    if (!Array.isArray(selectors)) selectors = [selectors];

    const elements = [];
    for (const selector of selectors) {
      try {
        const found = document.querySelectorAll(selector);
        found.forEach((el) => {
          if (isVisible(el) && !elements.includes(el)) {
            elements.push(el);
          }
        });
      } catch (e) {
        // Invalid selector, continue
      }
    }
    return elements;
  }

  function isVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0'
    );
  }

  function findInput() {
    if (state.platform) {
      return findElement(state.platform.inputSelector);
    }
    // Generic fallback
    return findElement(['textarea', 'div[contenteditable="true"]', 'input[type="text"]']);
  }

  function findSendButton() {
    if (state.platform) {
      return findElement(state.platform.sendButtonSelector);
    }
    return findElement(['button[type="submit"]', 'button:has(svg)', 'button.send']);
  }

  function findLatestResponse() {
    if (state.platform) {
      const elements = findAllElements(state.platform.outputSelector);
      return elements[elements.length - 1] || null;
    }
    return null;
  }

  // ============================================
  // Text Injection
  // ============================================

  async function injectText(text, submit = false) {
    const input = findInput();

    if (!input) {
      console.warn('[TNF] No input element found');
      return { success: false, error: 'Input element not found' };
    }

    try {
      // Try multiple injection methods
      const success = await tryInjectionMethods(input, text);

      if (!success) {
        return { success: false, error: 'All injection methods failed' };
      }

      // Optionally click send button
      if (submit) {
        await sleep(100);
        const sendButton = findSendButton();
        if (sendButton) {
          sendButton.click();
          console.log('[TNF] Send button clicked');
        } else {
          // Try Enter key
          input.dispatchEvent(
            new KeyboardEvent('keydown', {
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              bubbles: true,
            })
          );
        }
      }

      return { success: true };
    } catch (error) {
      console.error('[TNF] Injection error:', error);
      return { success: false, error: error.message };
    }
  }

  async function tryInjectionMethods(input, text) {
    // Method 1: ContentEditable
    if (input.contentEditable === 'true') {
      input.focus();
      input.innerHTML = '';

      // Use execCommand for compatibility
      document.execCommand('insertText', false, text);

      // Dispatch events
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      if (input.textContent.includes(text.substring(0, 20))) {
        console.log('[TNF] ContentEditable injection successful');
        return true;
      }
    }

    // Method 2: Textarea/Input value
    if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
      input.focus();
      input.value = text;

      // React needs special handling
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        input.tagName === 'TEXTAREA'
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype,
        'value'
      )?.set;

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, text);
      }

      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      if (input.value === text) {
        console.log('[TNF] Value setter injection successful');
        return true;
      }
    }

    // Method 3: Clipboard API
    try {
      input.focus();
      await navigator.clipboard.writeText(text);
      document.execCommand('paste');
      console.log('[TNF] Clipboard injection attempted');
      return true;
    } catch (e) {
      console.warn('[TNF] Clipboard method failed:', e);
    }

    // Method 4: Simulated typing
    input.focus();
    for (const char of text) {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keypress', { key: char, bubbles: true }));

      if (input.contentEditable === 'true') {
        document.execCommand('insertText', false, char);
      } else {
        input.value += char;
      }

      input.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    console.log('[TNF] Simulated typing injection attempted');
    return true;
  }

  // ============================================
  // Response Capture
  // ============================================

  function captureLatestResponse() {
    const responseEl = findLatestResponse();

    if (!responseEl) {
      return { success: false, error: 'No response element found' };
    }

    const content = extractTextContent(responseEl);
    state.lastResponse = content;

    return {
      success: true,
      content,
      timestamp: Date.now(),
      platform: state.platform?.name || 'unknown',
    };
  }

  function extractTextContent(element) {
    // Clone to avoid modifying the original
    const clone = element.cloneNode(true);

    // Remove scripts and styles
    clone.querySelectorAll('script, style, button, [role="button"]').forEach((el) => el.remove());

    // Get text content
    let text = clone.textContent || clone.innerText || '';

    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  // ============================================
  // Response Monitoring
  // ============================================

  function startMonitoring() {
    if (state.isMonitoring) {
      console.log('[TNF] Already monitoring');
      return { success: true, message: 'Already monitoring' };
    }

    console.log('[TNF] Starting response monitoring...');
    state.isMonitoring = true;

    // Create MutationObserver
    state.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          checkForNewResponse(mutation.addedNodes);
        }
      }
    });

    // Observe the main content area
    const target = document.body;
    state.observer.observe(target, {
      childList: true,
      subtree: true,
    });

    return { success: true, message: 'Monitoring started' };
  }

  function stopMonitoring() {
    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }
    state.isMonitoring = false;
    console.log('[TNF] Monitoring stopped');
    return { success: true };
  }

  function checkForNewResponse(nodes) {
    if (!state.platform) return;

    for (const node of nodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      // Check if this node matches output selectors
      const outputSelectors = state.platform.outputSelector;
      for (const selector of outputSelectors) {
        if (node.matches?.(selector) || node.querySelector?.(selector)) {
          const content = extractTextContent(node.querySelector?.(selector) || node);

          if (content && content.length > 20 && content !== state.lastResponse) {
            state.lastResponse = content;

            // Notify background script
            chrome.runtime.sendMessage({
              type: 'AI_RESPONSE_CAPTURED',
              payload: {
                content,
                platform: state.platform.name,
                timestamp: Date.now(),
              },
            });

            console.log('[TNF] New response captured:', content.substring(0, 100) + '...');
            return;
          }
        }
      }
    }
  }

  // ============================================
  // Floating Panel
  // ============================================

  function injectFloatingPanel() {
    // Remove existing panel
    removeFloatingPanel();

    const panel = document.createElement('div');
    panel.id = CONFIG.panelId;
    panel.innerHTML = `
      <style>
        #${CONFIG.panelId} {
          position: fixed;
          top: 20px;
          right: 20px;
          width: ${CONFIG.panelWidth}px;
          height: ${CONFIG.panelHeight}px;
          background: linear-gradient(135deg, rgba(2, 6, 23, 0.95), rgba(15, 23, 42, 0.95));
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          z-index: 2147483647;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #f8fafc;
          overflow: hidden;
          transition: opacity 0.2s, transform 0.2s;
        }

        #${CONFIG.panelId}.minimized {
          height: 48px;
        }

        .tnf-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          cursor: move;
          user-select: none;
        }

        .tnf-header-logo {
          font-size: 18px;
        }

        .tnf-header-title {
          flex: 1;
          font-weight: 600;
          font-size: 14px;
        }

        .tnf-header-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 4px;
          width: 24px;
          height: 24px;
          cursor: pointer;
          color: white;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }

        .tnf-header-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .tnf-content {
          padding: 12px;
          overflow-y: auto;
          height: calc(100% - 48px);
        }

        .tnf-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          margin-bottom: 12px;
          font-size: 12px;
        }

        .tnf-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }

        .tnf-status-dot.inactive {
          background: #64748b;
          box-shadow: none;
        }

        .tnf-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tnf-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #e2e8f0;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }

        .tnf-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: #7c3aed;
        }

        .tnf-btn.primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-color: transparent;
        }

        .tnf-btn.primary:hover {
          box-shadow: 0 0 20px rgba(124, 58, 237, 0.4);
        }

        .tnf-input {
          width: 100%;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #f8fafc;
          font-size: 12px;
          margin-bottom: 8px;
          resize: none;
        }

        .tnf-input:focus {
          outline: none;
          border-color: #7c3aed;
        }

        .tnf-input::placeholder {
          color: #64748b;
        }

        .tnf-log {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          padding: 8px;
          margin-top: 12px;
          max-height: 120px;
          overflow-y: auto;
          font-family: monospace;
          font-size: 10px;
        }

        .tnf-log-item {
          padding: 4px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: #94a3b8;
        }

        .tnf-log-item:last-child {
          border-bottom: none;
        }
      </style>

      <div class="tnf-header" id="tnf-drag-handle">
        <span class="tnf-header-logo">🚀</span>
        <span class="tnf-header-title">The New Fuse</span>
        <button class="tnf-header-btn" id="tnf-minimize-btn" title="Minimize">−</button>
        <button class="tnf-header-btn" id="tnf-close-btn" title="Close">×</button>
      </div>

      <div class="tnf-content">
        <div class="tnf-status">
          <span class="tnf-status-dot ${state.platform ? '' : 'inactive'}"></span>
          <span>${state.platform?.name || 'No AI platform detected'}</span>
        </div>

        <textarea class="tnf-input" id="tnf-message-input" rows="3" placeholder="Enter message to inject..."></textarea>

        <div class="tnf-actions">
          <button class="tnf-btn primary" id="tnf-inject-btn">
            <span>💉</span> Inject Text
          </button>
          <button class="tnf-btn" id="tnf-inject-submit-btn">
            <span>📤</span> Inject & Submit
          </button>
          <button class="tnf-btn" id="tnf-capture-btn">
            <span>📸</span> Capture Response
          </button>
          <button class="tnf-btn" id="tnf-monitor-btn">
            <span>👁️</span> ${state.isMonitoring ? 'Stop' : 'Start'} Monitoring
          </button>
        </div>

        <div class="tnf-log" id="tnf-panel-log">
          <div class="tnf-log-item">[Ready] Floating panel active</div>
        </div>
      </div>
    `;

    document.body.appendChild(panel);
    state.floatingPanel = panel;

    // Set up event listeners
    setupPanelEventListeners(panel);
    setupDragging(panel);

    console.log('[TNF] Floating panel injected');
    return { success: true };
  }

  function setupPanelEventListeners(panel) {
    // Close button
    panel.querySelector('#tnf-close-btn')?.addEventListener('click', () => {
      removeFloatingPanel();
    });

    // Minimize button
    panel.querySelector('#tnf-minimize-btn')?.addEventListener('click', () => {
      panel.classList.toggle('minimized');
    });

    // Inject button
    panel.querySelector('#tnf-inject-btn')?.addEventListener('click', async () => {
      const text = panel.querySelector('#tnf-message-input')?.value;
      if (text) {
        const result = await injectText(text, false);
        addPanelLog(result.success ? 'Text injected' : `Failed: ${result.error}`);
      }
    });

    // Inject & Submit button
    panel.querySelector('#tnf-inject-submit-btn')?.addEventListener('click', async () => {
      const text = panel.querySelector('#tnf-message-input')?.value;
      if (text) {
        const result = await injectText(text, true);
        addPanelLog(result.success ? 'Text injected & submitted' : `Failed: ${result.error}`);
        if (result.success) {
          panel.querySelector('#tnf-message-input').value = '';
        }
      }
    });

    // Capture button
    panel.querySelector('#tnf-capture-btn')?.addEventListener('click', () => {
      const result = captureLatestResponse();
      if (result.success) {
        addPanelLog(`Captured: ${result.content.substring(0, 50)}...`);
        chrome.runtime.sendMessage({
          type: 'AI_RESPONSE_CAPTURED',
          payload: result,
        });
      } else {
        addPanelLog(`Capture failed: ${result.error}`);
      }
    });

    // Monitor button
    panel.querySelector('#tnf-monitor-btn')?.addEventListener('click', () => {
      if (state.isMonitoring) {
        stopMonitoring();
        panel.querySelector('#tnf-monitor-btn').innerHTML = '<span>👁️</span> Start Monitoring';
        addPanelLog('Monitoring stopped');
      } else {
        startMonitoring();
        panel.querySelector('#tnf-monitor-btn').innerHTML = '<span>👁️</span> Stop Monitoring';
        addPanelLog('Monitoring started');
      }
    });
  }

  function setupDragging(panel) {
    const handle = panel.querySelector('#tnf-drag-handle');
    let isDragging = false;
    let offsetX, offsetY;

    handle.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('tnf-header-btn')) return;
      isDragging = true;
      offsetX = e.clientX - panel.offsetLeft;
      offsetY = e.clientY - panel.offsetTop;
      panel.style.transition = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      let newX = e.clientX - offsetX;
      let newY = e.clientY - offsetY;

      // Keep within viewport
      newX = Math.max(0, Math.min(newX, window.innerWidth - panel.offsetWidth));
      newY = Math.max(0, Math.min(newY, window.innerHeight - panel.offsetHeight));

      panel.style.left = newX + 'px';
      panel.style.top = newY + 'px';
      panel.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      panel.style.transition = '';
    });
  }

  function removeFloatingPanel() {
    if (state.floatingPanel) {
      state.floatingPanel.remove();
      state.floatingPanel = null;
    }
    const existing = document.getElementById(CONFIG.panelId);
    if (existing) existing.remove();
  }

  function addPanelLog(message) {
    const log = document.getElementById('tnf-panel-log');
    if (!log) return;

    const time = new Date().toLocaleTimeString();
    const item = document.createElement('div');
    item.className = 'tnf-log-item';
    item.textContent = `[${time}] ${message}`;

    log.insertBefore(item, log.firstChild);

    // Keep only last 20 items
    while (log.children.length > 20) {
      log.removeChild(log.lastChild);
    }
  }

  // ============================================
  // Message Handlers
  // ============================================

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[TNF] Received message:', request.type);

    switch (request.type) {
      case 'PING':
        sendResponse({ success: true, platform: state.platform?.name });
        break;

      case 'INJECT_FLOATING_PANEL':
        const panelResult = injectFloatingPanel();
        sendResponse(panelResult);
        break;

      case 'REMOVE_FLOATING_PANEL':
        removeFloatingPanel();
        sendResponse({ success: true });
        break;

      case 'INJECT_TEXT':
        injectText(request.payload?.text, request.payload?.submit).then(sendResponse);
        return true; // Keep channel open for async response

      case 'CAPTURE_RESPONSE':
        sendResponse(captureLatestResponse());
        break;

      case 'START_MONITORING':
        sendResponse(startMonitoring());
        break;

      case 'STOP_MONITORING':
        sendResponse(stopMonitoring());
        break;

      case 'DETECT_PLATFORM':
        sendResponse({
          success: true,
          platform: detectPlatform(),
        });
        break;

      case 'GET_STATUS':
        sendResponse({
          success: true,
          platform: state.platform,
          isMonitoring: state.isMonitoring,
          hasFloatingPanel: !!state.floatingPanel,
        });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  });

  // ============================================
  // Utilities
  // ============================================

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============================================
  // Initialize
  // ============================================

  // Detect platform on load
  detectPlatform();

  // Notify background script that content script is ready
  chrome.runtime.sendMessage({
    type: 'CONTENT_SCRIPT_READY',
    payload: {
      url: window.location.href,
      platform: state.platform?.name || null,
    },
  });

  console.log('[TNF] Content script ready');
})();

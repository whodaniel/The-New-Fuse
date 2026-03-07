/**
 * Browser Control Content Script Handlers
 *
 * Executes browser control commands within the page context.
 * These handlers perform actual DOM manipulation, typing, clicking,
 * and page analysis.
 */

// ============================================================================
// CHAT PLATFORM DETECTION
// ============================================================================

interface ChatPlatformConfig {
  name: string;
  urlPatterns: RegExp[];
  selectors: {
    chatInput: string[];
    sendButton: string[];
    messageContainer: string[];
    messageItem: string[];
    userMessage: string[];
    assistantMessage: string[];
  };
}

const CHAT_PLATFORMS: ChatPlatformConfig[] = [
  {
    name: 'chatgpt',
    urlPatterns: [/chat\.openai\.com/, /chatgpt\.com/],
    selectors: {
      chatInput: ['#prompt-textarea', 'textarea[data-id="root"]', 'div[contenteditable="true"]'],
      sendButton: [
        'button[data-testid="send-button"]',
        'button[aria-label*="Send"]',
        'button[type="submit"]',
      ],
      messageContainer: ['[class*="conversation"]', 'main'],
      messageItem: ['[data-message-id]', '[class*="message"]'],
      userMessage: ['[data-message-author-role="user"]', '.user-message'],
      assistantMessage: ['[data-message-author-role="assistant"]', '.assistant-message'],
    },
  },
  {
    name: 'claude',
    urlPatterns: [/claude\.ai/],
    selectors: {
      chatInput: ['[contenteditable="true"]', 'div[class*="ProseMirror"]', 'textarea'],
      sendButton: [
        'button[aria-label="Send Message"]',
        'button[aria-label*="Send"]',
        'button:has(svg)',
      ],
      messageContainer: ['[class*="conversation"]', 'main'],
      messageItem: ['[class*="message"]'],
      userMessage: ['[class*="human"]', '.user-message'],
      assistantMessage: ['[class*="assistant"]', '.assistant-message'],
    },
  },
  {
    name: 'gemini',
    urlPatterns: [/gemini\.google\.com/],
    selectors: {
      chatInput: ['textarea', '[contenteditable="true"]', 'div[role="textbox"]'],
      sendButton: [
        'button[aria-label*="Submit"]',
        'button[aria-label*="Send"]',
        'button[type="submit"]',
      ],
      messageContainer: ['[class*="conversation"]', 'main'],
      messageItem: ['[class*="message"]'],
      userMessage: ['[class*="user"]'],
      assistantMessage: ['[class*="model"]'],
    },
  },
];

// ============================================================================
// BROWSER CONTROL MESSAGE HANDLERS
// ============================================================================

export class BrowserControlContentHandlers {
  /**
   * Get the current platform configuration based on URL
   */
  static detectPlatform(): ChatPlatformConfig | null {
    const url = window.location.href;
    return CHAT_PLATFORMS.find((p) => p.urlPatterns.some((r) => r.test(url))) || null;
  }

  /**
   * Find element using multiple selectors
   */
  static findElement(selectors: string[]): Element | null {
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element && this.isVisible(element)) {
          return element;
        }
      } catch (e) {
        // Invalid selector, continue
      }
    }
    return null;
  }

  /**
   * Check if element is visible
   */
  static isVisible(element: Element): boolean {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  /**
   * Generate XPath for element
   */
  static getXPath(element: Element): string {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }

    const parts: string[] = [];
    let current: Element | null = element;

    while (current && current !== document.body) {
      let index = 1;
      let sibling = current.previousElementSibling;

      while (sibling) {
        if (sibling.tagName === current.tagName) {
          index++;
        }
        sibling = sibling.previousElementSibling;
      }

      parts.unshift(`${current.tagName.toLowerCase()}[${index}]`);
      current = current.parentElement;
    }

    return '//' + parts.join('/');
  }

  /**
   * Generate unique CSS selector for element
   */
  static generateSelector(element: Element): string {
    if (element.id) {
      return `#${CSS.escape(element.id)}`;
    }

    const path: string[] = [];
    let current: Element | null = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      if (current.className) {
        const classes = Array.from(current.classList)
          .filter((c) => !c.includes(':') && !c.includes('['))
          .slice(0, 2);
        if (classes.length) {
          selector += '.' + classes.map((c) => CSS.escape(c)).join('.');
        }
      }

      // Add nth-child if needed for uniqueness
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter((c) => c.tagName === current!.tagName);
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-child(${index})`;
        }
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  // ============================================================================
  // AUTO-DETECT CHAT ELEMENTS
  // ============================================================================

  static autoDetectElements(): any {
    const platform = this.detectPlatform();
    const generic = platform === null;
    const platformName = platform?.name || 'generic';

    const selectors = platform?.selectors || {
      chatInput: [
        'textarea',
        '[contenteditable="true"]',
        'input[type="text"]',
        'div[role="textbox"]',
      ],
      sendButton: [
        'button[type="submit"]',
        'button:has(svg)',
        'button[aria-label*="Send"]',
        'button[aria-label*="Submit"]',
      ],
      messageContainer: ['main', '[role="main"]', '.messages'],
      messageItem: ['[class*="message"]', 'div[data-message-id]'],
      userMessage: ['[class*="user"]', '[class*="human"]'],
      assistantMessage: ['[class*="assistant"]', '[class*="ai"]', '[class*="bot"]'],
    };

    const chatInput = this.findElement(selectors.chatInput);
    const sendButton = this.findElement(selectors.sendButton);
    const outputContainer = this.findElement(selectors.messageContainer);

    if (!chatInput) {
      return { success: false, error: 'Could not detect chat input element' };
    }

    return {
      success: true,
      mapping: {
        inputSelector: chatInput ? this.generateSelector(chatInput) : null,
        inputXPath: chatInput ? this.getXPath(chatInput) : null,
        sendButtonSelector: sendButton ? this.generateSelector(sendButton) : null,
        sendButtonXPath: sendButton ? this.getXPath(sendButton) : null,
        outputContainerSelector: outputContainer ? this.generateSelector(outputContainer) : null,
        outputContainerXPath: outputContainer ? this.getXPath(outputContainer) : null,
        messageItemSelector: selectors.messageItem[0],
        confidence: (chatInput ? 0.4 : 0) + (sendButton ? 0.3 : 0) + (outputContainer ? 0.3 : 0),
        platform: platformName,
      },
    };
  }

  // ============================================================================
  // CLICK ELEMENT
  // ============================================================================

  static clickElement(payload: { selector: string; clickType?: string }): any {
    const { selector, clickType = 'single' } = payload;

    try {
      const element = document.querySelector(selector) as HTMLElement;
      if (!element) {
        return { success: false, error: `Element not found: ${selector}` };
      }

      // Scroll into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Dispatch mouse events for realistic simulation
      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      const eventInit: MouseEventInit = {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y,
        button: clickType === 'right' ? 2 : 0,
      };

      element.dispatchEvent(new MouseEvent('mouseenter', eventInit));
      element.dispatchEvent(new MouseEvent('mouseover', eventInit));
      element.dispatchEvent(new MouseEvent('mousedown', eventInit));
      element.dispatchEvent(new MouseEvent('mouseup', eventInit));
      element.dispatchEvent(new MouseEvent('click', eventInit));

      if (clickType === 'double') {
        element.dispatchEvent(new MouseEvent('dblclick', eventInit));
      }

      // Also try native click for buttons/links
      if ('click' in element) {
        element.click();
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // ============================================================================
  // TYPE TEXT
  // ============================================================================

  static async typeText(payload: {
    selector: string;
    text: string;
    clearFirst?: boolean;
    pressEnter?: boolean;
    typeDelay?: number;
  }): Promise<any> {
    const { selector, text, clearFirst = false, pressEnter = false, typeDelay = 10 } = payload;

    try {
      const element = document.querySelector(selector) as HTMLElement;
      if (!element) {
        return { success: false, error: `Element not found: ${selector}` };
      }

      // Focus the element
      element.focus();
      element.dispatchEvent(new FocusEvent('focus', { bubbles: true }));

      // Clear existing content if requested
      if (clearFirst) {
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
          element.value = '';
        } else if (element.isContentEditable) {
          element.innerHTML = '';
        }
        element.dispatchEvent(new InputEvent('input', { bubbles: true }));
      }

      // Type character by character for realistic simulation
      for (const char of text) {
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
          element.value += char;
        } else if (element.isContentEditable) {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            selection.getRangeAt(0).insertNode(document.createTextNode(char));
            selection.collapseToEnd();
          } else {
            element.textContent += char;
          }
        }

        element.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
        element.dispatchEvent(new InputEvent('input', { bubbles: true, data: char }));
        element.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));

        if (typeDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, typeDelay));
        }
      }

      // Press Enter if requested
      if (pressEnter) {
        element.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true })
        );
        element.dispatchEvent(
          new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', bubbles: true })
        );
        element.dispatchEvent(
          new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true })
        );

        // Also trigger form submission if in a form
        const form = element.closest('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true }));
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // ============================================================================
  // SCROLL PAGE
  // ============================================================================

  static scrollPage(payload: {
    target?: string;
    deltaX?: number;
    deltaY?: number;
    smooth?: boolean;
  }): any {
    const { target, deltaX = 0, deltaY = 0, smooth = true } = payload;

    try {
      const behavior = smooth ? 'smooth' : 'auto';

      if (target === 'top') {
        window.scrollTo({ top: 0, behavior });
      } else if (target === 'bottom') {
        window.scrollTo({ top: document.body.scrollHeight, behavior });
      } else if (target) {
        const element = document.querySelector(target);
        if (element) {
          element.scrollIntoView({ behavior, block: 'center' });
        }
      } else {
        window.scrollBy({ top: deltaY, left: deltaX, behavior });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // ============================================================================
  // GET PAGE CONTENT
  // ============================================================================

  static getPageContent(): any {
    try {
      // Get text content, removing scripts and styles
      const clonedBody = document.body.cloneNode(true) as HTMLElement;
      clonedBody.querySelectorAll('script, style, noscript').forEach((el) => el.remove());

      const text = clonedBody.textContent || '';
      const cleanText = text.replace(/\s+/g, ' ').trim();
      const words = cleanText.split(/\s+/).filter((w) => w.length > 0);

      return {
        success: true,
        content: cleanText,
        wordCount: words.length,
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // ============================================================================
  // ANALYZE PAGE
  // ============================================================================

  static analyzePage(payload: { analysisTypes: string[] }): any {
    const { analysisTypes = ['structure', 'interactive', 'chat'] } = payload;
    const result: any = {
      success: true,
      url: window.location.href,
      title: document.title,
      analysis: {},
    };

    try {
      if (analysisTypes.includes('structure')) {
        result.analysis.structure = {
          nodeCount: document.querySelectorAll('*').length,
          depth: this.getMaxDepth(document.body),
          headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((h) => ({
            level: parseInt(h.tagName.charAt(1)),
            text: h.textContent?.trim().slice(0, 100) || '',
          })),
          links: Array.from(document.querySelectorAll('a[href]'))
            .slice(0, 50)
            .map((a) => ({
              href: (a as HTMLAnchorElement).href,
              text: a.textContent?.trim().slice(0, 50) || '',
            })),
          images: Array.from(document.querySelectorAll('img'))
            .slice(0, 20)
            .map((img) => ({
              src: (img as HTMLImageElement).src,
              alt: (img as HTMLImageElement).alt,
            })),
          iframes: document.querySelectorAll('iframe').length,
        };
      }

      if (analysisTypes.includes('interactive')) {
        result.analysis.interactive = Array.from(
          document.querySelectorAll(
            'button, input, textarea, select, a[href], [role="button"], [onclick]'
          )
        )
          .filter((el) => this.isVisible(el))
          .slice(0, 50)
          .map((el) => ({
            selector: this.generateSelector(el),
            xpath: this.getXPath(el),
            tag: el.tagName.toLowerCase(),
            type: (el as HTMLInputElement).type,
            text: el.textContent?.trim().slice(0, 50) || '',
            placeholder: (el as HTMLInputElement).placeholder,
            ariaLabel: el.getAttribute('aria-label'),
            role: el.getAttribute('role'),
            boundingBox: el.getBoundingClientRect(),
            isVisible: this.isVisible(el),
            isEnabled: !(el as HTMLInputElement).disabled,
          }));
      }

      if (analysisTypes.includes('chat')) {
        const chatResult = this.autoDetectElements();
        result.analysis.chatElements = chatResult.mapping || null;
      }

      if (analysisTypes.includes('forms')) {
        result.analysis.forms = Array.from(document.querySelectorAll('form')).map((form) => ({
          id: form.id,
          name: form.name,
          action: form.action,
          method: form.method,
          fields: Array.from(form.querySelectorAll('input, textarea, select')).map((field) => ({
            name: (field as HTMLInputElement).name,
            type: (field as HTMLInputElement).type || field.tagName.toLowerCase(),
            value: (field as HTMLInputElement).value,
            required: (field as HTMLInputElement).required,
            selector: this.generateSelector(field),
          })),
        }));
      }

      if (analysisTypes.includes('content')) {
        const contentResult = this.getPageContent();
        result.analysis.content = {
          text: contentResult.content?.slice(0, 5000),
          wordCount: contentResult.wordCount,
        };
      }

      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static getMaxDepth(element: Element, depth = 0): number {
    let maxDepth = depth;
    for (const child of Array.from(element.children)) {
      maxDepth = Math.max(maxDepth, this.getMaxDepth(child, depth + 1));
    }
    return maxDepth;
  }

  // ============================================================================
  // SEND CHAT MESSAGE
  // ============================================================================

  static async sendChatMessage(payload: {
    message: string;
    inputSelector?: string;
    sendButtonSelector?: string;
    waitForResponse?: boolean;
    responseTimeout?: number;
  }): Promise<any> {
    const {
      message,
      inputSelector,
      sendButtonSelector,
      waitForResponse = false,
      responseTimeout = 30000,
    } = payload;

    try {
      // Auto-detect if selectors not provided
      let input: string;
      let button: string | null;

      if (inputSelector) {
        input = inputSelector;
        button = sendButtonSelector || null;
      } else {
        const detected = this.autoDetectElements();
        if (!detected.success) {
          return detected;
        }
        input = detected.mapping.inputSelector;
        button = detected.mapping.sendButtonSelector;
      }

      // Type the message
      const typeResult = await this.typeText({
        selector: input,
        text: message,
        clearFirst: true,
      });

      if (!typeResult.success) {
        return typeResult;
      }

      // Small delay before clicking send
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Click send button or press Enter
      if (button) {
        const clickResult = this.clickElement({ selector: button });
        if (!clickResult.success) {
          // Fallback to Enter key
          const inputEl = document.querySelector(input) as HTMLElement;
          inputEl?.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true })
          );
        }
      } else {
        // No button found, try Enter
        const inputEl = document.querySelector(input) as HTMLElement;
        inputEl?.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true })
        );
      }

      // Wait for response if requested
      if (waitForResponse) {
        // This is a simplified version - real implementation would monitor for new messages
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // ============================================================================
  // OVERLAY HANDLERS
  // ============================================================================

  private static overlayElement: HTMLElement | null = null;

  static showOverlay(payload: {
    message: string;
    status: string;
    progress?: number;
    showCancel?: boolean;
  }): any {
    try {
      // Remove existing overlay
      this.hideOverlay();

      // Create overlay
      const overlay = document.createElement('div');
      overlay.id = 'tnf-browser-control-overlay';
      overlay.innerHTML = `
        <div class="tnf-overlay-content">
          <div class="tnf-overlay-icon">🤖</div>
          <div class="tnf-overlay-message">${payload.message}</div>
          <div class="tnf-overlay-status ${payload.status}">${payload.status}</div>
          ${payload.progress !== undefined ? `<div class="tnf-overlay-progress"><div style="width: ${payload.progress}%"></div></div>` : ''}
          ${payload.showCancel ? '<button class="tnf-overlay-cancel">Cancel</button>' : ''}
        </div>
        <style>
          #tnf-browser-control-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2147483647;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .tnf-overlay-content {
            background: linear-gradient(135deg, #1a1b26, #24253a);
            border: 1px solid rgba(138, 43, 226, 0.4);
            border-radius: 16px;
            padding: 32px 48px;
            text-align: center;
            box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
          }
          .tnf-overlay-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
          .tnf-overlay-message {
            color: #fff;
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 12px;
          }
          .tnf-overlay-status {
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
            text-transform: capitalize;
          }
          .tnf-overlay-status.running { color: #60a5fa; }
          .tnf-overlay-status.success { color: #34d399; }
          .tnf-overlay-status.error { color: #f87171; }
          .tnf-overlay-status.waiting { color: #fbbf24; }
          .tnf-overlay-progress {
            width: 200px;
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            margin: 16px auto 0;
            overflow: hidden;
          }
          .tnf-overlay-progress > div {
            height: 100%;
            background: linear-gradient(90deg, #8b5cf6, #6366f1);
            transition: width 0.3s ease;
          }
          .tnf-overlay-cancel {
            margin-top: 20px;
            padding: 8px 24px;
            background: rgba(239, 68, 68, 0.2);
            border: 1px solid rgba(239, 68, 68, 0.4);
            color: #f87171;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
          }
          .tnf-overlay-cancel:hover {
            background: rgba(239, 68, 68, 0.3);
          }
        </style>
      `;

      document.body.appendChild(overlay);
      this.overlayElement = overlay;

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static hideOverlay(): any {
    try {
      const existing = document.getElementById('tnf-browser-control-overlay');
      if (existing) {
        existing.remove();
      }
      this.overlayElement = null;
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static updateOverlay(
    payload: Partial<{
      message: string;
      status: string;
      progress: number;
    }>
  ): any {
    try {
      if (!this.overlayElement) {
        return { success: false, error: 'No overlay visible' };
      }

      if (payload.message) {
        const msgEl = this.overlayElement.querySelector('.tnf-overlay-message');
        if (msgEl) msgEl.textContent = payload.message;
      }

      if (payload.status) {
        const statusEl = this.overlayElement.querySelector('.tnf-overlay-status');
        if (statusEl) {
          statusEl.className = `tnf-overlay-status ${payload.status}`;
          statusEl.textContent = payload.status;
        }
      }

      if (payload.progress !== undefined) {
        const progressEl = this.overlayElement.querySelector(
          '.tnf-overlay-progress > div'
        ) as HTMLElement;
        if (progressEl) progressEl.style.width = `${payload.progress}%`;
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

// ============================================================================
// MESSAGE HANDLER SETUP
// ============================================================================

export function setupBrowserControlHandlers(): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { type, payload } = message;

    // Handle browser control messages
    switch (type) {
      case 'AUTO_DETECT_ELEMENTS':
        sendResponse(BrowserControlContentHandlers.autoDetectElements());
        break;
      case 'CLICK_ELEMENT':
        sendResponse(BrowserControlContentHandlers.clickElement(payload));
        break;
      case 'TYPE_TEXT':
        BrowserControlContentHandlers.typeText(payload).then(sendResponse);
        return true; // Async
      case 'SCROLL_PAGE':
        sendResponse(BrowserControlContentHandlers.scrollPage(payload));
        break;
      case 'GET_PAGE_CONTENT':
        sendResponse(BrowserControlContentHandlers.getPageContent());
        break;
      case 'ANALYZE_PAGE':
        sendResponse(BrowserControlContentHandlers.analyzePage(payload));
        break;
      case 'SEND_CHAT_MESSAGE':
        BrowserControlContentHandlers.sendChatMessage(payload).then(sendResponse);
        return true; // Async
      case 'SHOW_OVERLAY':
        sendResponse(BrowserControlContentHandlers.showOverlay(payload));
        break;
      case 'HIDE_OVERLAY':
        sendResponse(BrowserControlContentHandlers.hideOverlay());
        break;
      case 'UPDATE_OVERLAY':
        sendResponse(BrowserControlContentHandlers.updateOverlay(payload));
        break;
      case 'HOVER_ELEMENT':
        // Implement hover
        const hoverEl = document.querySelector(payload.selector) as HTMLElement;
        if (hoverEl) {
          hoverEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
          hoverEl.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Element not found' });
        }
        break;
      case 'FOCUS_ELEMENT':
        const focusEl = document.querySelector(payload.selector) as HTMLElement;
        if (focusEl) {
          focusEl.focus();
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Element not found' });
        }
        break;
      case 'FIND_ELEMENTS':
        const elements = Array.from(document.querySelectorAll(payload.selector));
        sendResponse({
          elements: elements.slice(0, 50).map((el) => ({
            selector: BrowserControlContentHandlers.generateSelector(el),
            text: el.textContent?.trim().slice(0, 100) || '',
            visible: BrowserControlContentHandlers.isVisible(el),
          })),
        });
        break;
      case 'GET_DOM_SNAPSHOT':
        sendResponse({
          html: document.documentElement.outerHTML,
          snapshot: {
            url: window.location.href,
            title: document.title,
            timestamp: new Date().toISOString(),
          },
        });
        break;
    }

    return false;
  });
}

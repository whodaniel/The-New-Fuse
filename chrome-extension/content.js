/**
 * TNF AI Bridge - Content Script
 * Multi-platform AI communication support
 */

console.log('🚀 TNF AI Bridge content script loading...');

// Prevent duplicate loading
if (window.tnfAIContentScript) {
  console.log('⚠️ TNF AI Bridge content script already loaded');
} else {
  window.tnfAIContentScript = true;
  
  class AIInterface {
    constructor() {
      this.isInjecting = false;
      this.conversationId = null;
      this.aiType = this.detectAIType();
      this.responseMonitor = null;
      this.processedResponses = new Set();
      this.isMonitoring = false;
      console.log(`✅ ${this.aiType} interface initialized`);
      this.setupMessageListener();
      this.setupKeyboardShortcuts();
    }

    detectAIType() {
      const hostname = window.location.hostname;
      const url = window.location.href;
      
      if (hostname.includes('chatgpt.com') || url.includes('chatgpt')) {
        return 'chatgpt';
      } else if (hostname.includes('claude.ai') || url.includes('claude')) {
        return 'claude';
      } else if (hostname.includes('gemini.google.com') || url.includes('gemini')) {
        return 'gemini';
      } else if (hostname.includes('perplexity.ai') || url.includes('perplexity')) {
        return 'perplexity';
      } else if (hostname.includes('poe.com') || url.includes('poe')) {
        return 'poe';
      } else if (hostname.includes('character.ai') || url.includes('character')) {
        return 'character';
      } else {
        return 'unknown';
      }
    }

    setupMessageListener() {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'INJECT') {
          console.log('📩 Content script received INJECT message');
          // Check if this injection is for our AI type
          const targetAI = message.targetAI || 'gemini';
          if (targetAI === this.aiType || targetAI === 'all') {
            this.handleInject(message).then((result) => {
              sendResponse({ success: true, result });
            }).catch((error) => {
              sendResponse({ success: false, error: error.message });
            });
          } else {
            sendResponse({ success: false, error: `Wrong AI type. Expected ${targetAI}, but this is ${this.aiType}` });
          }
          return true; // Keep message channel open for async response
        }

        if (message.type === 'GET_STATUS') {
          sendResponse({
            aiType: this.aiType,
            ready: this.isPageReady(),
            url: window.location.href
          });
          return false;
        }
        
        if (message.type === 'START_RESPONSE_MONITORING') {
          console.log('📩 Starting unified response monitoring for conversation:', message.conversationId);
          this.startUnifiedResponseMonitoring(message.conversationId);
          sendResponse({ success: true });
          return false;
        }
        
        if (message.type === 'STOP_RESPONSE_MONITORING') {
          console.log('📩 Stopping unified response monitoring');
          this.stopUnifiedResponseMonitoring();
          sendResponse({ success: true });
          return false;
        }
        
        if (message.type === 'CONVERSATION_UPDATED') {
          console.log('📩 Content script forwarding conversation update to injectable UI');
          // Forward to injectable UI
          window.postMessage({
            type: 'TNF_CONVERSATION_UPDATE',
            history: message.history
          }, '*');
          
          // Also trigger UI update if exists
          if (window.tnfInjectableUI) {
            window.tnfInjectableUI.conversationHistory = message.history || [];
            window.tnfInjectableUI.renderChatTab();
          }
        }
        
        return false;
      });
    }

    isPageReady() {
      // Basic check if the page has loaded and has the expected elements
      return document.readyState === 'complete' && 
             (this.findTextInput() !== null || this.findSubmitButton() !== null);
    }

    async handleInject(message) {
      console.log('💬 Handling inject:', message.content.substring(0, 50) + '...');
      
      if (this.isInjecting) {
        console.log('⚠️ Already injecting, skipping');
        throw new Error('Already injecting');
      }
      
      this.isInjecting = true;
      this.conversationId = message.conversationId;
      
      try {
        // Step 1: Find and fill input
        const success = await this.injectText(message.content);
        if (!success) {
          throw new Error('Failed to inject text');
        }
        
        // Step 2: Send message
        await this.sendMessage();
        
        // Step 3: Response monitoring is now handled by unified system
        console.log('📡 Response monitoring delegated to unified system');
        
        // Report success
        chrome.runtime.sendMessage({
          type: 'INJECTION_RESULT',
          conversationId: message.conversationId,
          success: true
        });
        
        console.log('✅ Injection completed successfully');
        return { success: true };
        
      } catch (error) {
        console.error('❌ Injection failed:', error);
        chrome.runtime.sendMessage({
          type: 'INJECTION_RESULT',
          conversationId: message.conversationId,
          success: false,
          error: error.message
        });
        throw error;
      } finally {
        this.isInjecting = false;
      }
    }

    async injectText(text) {
      console.log(`📝 Looking for ${this.aiType} input field...`);
      
      const inputElement = this.findTextInput();
      if (!inputElement) {
        console.error('❌ No input element found');
        // Log what elements we do have on the page for debugging
        const allTextboxes = document.querySelectorAll('div[contenteditable="true"], div[role="textbox"], textarea, input[type="text"]');
        console.log('🔍 Available text input elements:', allTextboxes);
        return false;
      }
      
      console.log('✅ Found input element:', inputElement);
      return await this.typeIntoElement(inputElement, text);
    }

    findTextInput() {
      // AI-specific selectors
      const selectorsByAI = {
        gemini: [
          'div[contenteditable="true"]',
          'div[role="textbox"]',
          'div[aria-label*="Enter a prompt here"]',
          'div[aria-label*="prompt"]',
          'div[aria-label*="Enter"]',
          'div.ql-editor[contenteditable="true"]',
          'div[data-placeholder*="Enter a prompt"]'
        ],
        chatgpt: [
          '#prompt-textarea',
          'textarea[data-id]',
          'div[contenteditable="true"]',
          'textarea[placeholder*="message"]'
        ],
        claude: [
          'div[contenteditable="true"]',
          '.ProseMirror',
          'div[role="textbox"]',
          'textarea'
        ],
        perplexity: [
          'textarea[placeholder*="Ask"]',
          'div[contenteditable="true"]',
          'input[type="text"]'
        ],
        poe: [
          'textarea[class*="ChatInput"]',
          'div[contenteditable="true"]',
          'textarea'
        ],
        character: [
          'div[contenteditable="true"]',
          'textarea',
          'input[type="text"]'
        ]
      };
      
      const selectors = selectorsByAI[this.aiType] || selectorsByAI.gemini;
      
      let inputElement = null;
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        console.log(`🔍 Found ${elements.length} elements for selector: ${selector}`);
        
        for (const element of elements) {
          // Check if this looks like the main input
          const rect = element.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0;
          const isReasonableSize = rect.width > 100 && rect.height > 15;
          
          if (isVisible && isReasonableSize) {
            inputElement = element;
            console.log('✅ Found input element:', selector);
            break;
          }
        }
        
        if (inputElement) break;
      }
      
      return inputElement;
    }

    async typeIntoElement(inputElement, text) {
      
      // Focus on the input element
      inputElement.focus();
      await this.sleep(200);
      
      // Clear existing content and set new text based on element type
      if (inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
        // For regular input/textarea elements
        inputElement.value = '';
        inputElement.value = text;
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        inputElement.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        // For contenteditable divs (used by many modern AI interfaces)
        if (inputElement.querySelector('p')) {
          inputElement.querySelector('p').textContent = '';
        } else {
          inputElement.textContent = '';
        }
        
        // Simulate typing character by character for contenteditable
        for (let i = 0; i < text.length; i++) {
          const char = text.charAt(i);
          
          // Update content
          if (inputElement.querySelector('p')) {
            inputElement.querySelector('p').textContent += char;
          } else {
            inputElement.textContent += char;
          }

          // Simulate input event
          inputElement.dispatchEvent(new Event('input', { bubbles: true }));
          
          // Small delay between characters to simulate typing
          await this.sleep(5); 
        }
      }

      // After typing, simulate an 'Enter' keydown to ensure Gemini processes the input
      inputElement.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        bubbles: true
      }));
      
      console.log('✅ Text injected successfully');
      return true;
    }

    async sendMessage() {
      console.log(`📤 Looking for ${this.aiType} send button...`);
      
      const sendButton = this.findSubmitButton();
      if (sendButton) {
        sendButton.click();
        console.log('✅ Send button clicked');
        return true;
      } else {
        console.error('❌ Send button not found');
        // Log what buttons we do have on the page for debugging
        const allButtons = document.querySelectorAll('button');
        console.log('🔍 Available buttons:', Array.from(allButtons).map(btn => ({
          text: btn.textContent?.trim(),
          ariaLabel: btn.getAttribute('aria-label'),
          className: btn.className
        })));
        return false;
      }
    }

    findSubmitButton() {
      // AI-specific send button selectors
      const selectorsByAI = {
        gemini: [
          'button[aria-label="Send message"]',
          'button[aria-label="Send prompt"]',
          'button[data-testid="send-button"]',
          'button[aria-label*="Send"]',
          'button:has(svg[viewBox="0 0 24 24"])',
          'button:has(svg)',
          'button[type="submit"]'
        ],
        chatgpt: [
          'button[data-testid="send-button"]',
          'button[aria-label*="Send"]',
          'button[data-testid="fruitjuice-send-button"]',
          'button:has(svg)'
        ],
        claude: [
          'button[aria-label*="Send"]',
          'button[type="submit"]',
          'button:has(svg)',
          '.send-button'
        ],
        perplexity: [
          'button[aria-label*="Search"]',
          'button[aria-label*="Submit"]',
          'button[type="submit"]',
          'button:has(svg)'
        ],
        poe: [
          'button[class*="send"]',
          'button[class*="Send"]',
          'button[aria-label*="Send"]',
          'button:has(svg)'
        ],
        character: [
          'button[aria-label*="Send"]',
          'button[type="submit"]',
          'button:has(svg)'
        ]
      };
      
      const selectors = selectorsByAI[this.aiType] || selectorsByAI.gemini;
      
      for (const selector of selectors) {
        const buttons = document.querySelectorAll(selector);
        console.log(`🔍 Found ${buttons.length} buttons for selector: ${selector}`);
        
        for (const btn of buttons) {
          // Ensure the button is visible and not disabled
          const rect = btn.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0;
          const isEnabled = !btn.disabled && !btn.hasAttribute('disabled');
          
          if (isVisible && isEnabled) {
            console.log('✅ Found send button:', selector);
            return btn;
          }
        }
      }
      
      return null;
    }

    async waitForSendButton() {
      // Wait for send button to appear (it appears after text input)
      let sendButton = null;
      let attempts = 0;
      
      while (attempts < 20 && !sendButton) {
        sendButton = this.findSubmitButton();
        
        if (!sendButton) {
          console.log(`⏳ Waiting for send button (attempt ${attempts + 1})`);
          await this.sleep(500);
          attempts++;
        }
      }
      
      if (!sendButton) {
        throw new Error('Send button not found after multiple attempts');
      }
      
      // Click send button
      sendButton.focus();
      await this.sleep(100);
      sendButton.click();
      console.log('✅ Send button clicked');
      await this.sleep(1000); // Give time for the UI to react after clicking
    }

    startUnifiedResponseMonitoring(conversationId) {
      if (this.isMonitoring) {
        console.log('⚠️ Already monitoring responses, stopping previous monitor');
        this.stopUnifiedResponseMonitoring();
      }
      
      this.conversationId = conversationId;
      this.isMonitoring = true;
      this.processedResponses.clear();
      
      console.log('👁️ Starting unified response monitoring for conversation:', conversationId);
      
      // Set up mutation observer with precise selectors
      this.responseMonitor = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                this.checkForUnifiedResponse(node);
              }
            }
          }
        }
      });
      
      this.responseMonitor.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // Set timeout to automatically stop monitoring
      setTimeout(() => {
        if (this.isMonitoring) {
          console.log('⏰ Response monitoring timeout reached');
          this.stopUnifiedResponseMonitoring();
        }
      }, 60000); // 60 second timeout
    }

    stopUnifiedResponseMonitoring() {
      if (!this.isMonitoring) return;
      
      console.log('🛑 Stopping unified response monitoring');
      this.isMonitoring = false;
      
      if (this.responseMonitor) {
        this.responseMonitor.disconnect();
        this.responseMonitor = null;
      }
      
      this.conversationId = null;
    }

    checkForUnifiedResponse(element) {
      // Precise AI-specific response selectors - exclude user input and UI elements
      const responseSelectorsByAI = {
        gemini: [
          '[data-message-author-role="model"]', // Most precise - only AI responses
          '[data-testid*="conversation-turn"][data-message-author-role="model"]'
        ],
        chatgpt: [
          '[data-message-author-role="assistant"]', // Only assistant responses
          '.markdown.prose:not([data-message-author-role="user"])'
        ],
        claude: [
          '[data-message-author-role="assistant"]', // Only assistant responses
          '.font-claude-message:not([data-message-author-role="user"])'
        ],
        perplexity: [
          '.model-response',
          '.answer-content'
        ],
        poe: [
          '.Message_response',
          '.ChatMessage_messageBody'
        ],
        character: [
          '.character-msg',
          '.response-text'
        ]
      };
      
      const responseSelectors = responseSelectorsByAI[this.aiType] || responseSelectorsByAI.gemini;
      
      let responseElement = null;
      
      for (const selector of responseSelectors) {
        responseElement = element.querySelector(selector);
        if (responseElement) {
          console.log('🎯 Found response element with selector:', selector);
          break;
        }
        
        if (element.matches && element.matches(selector)) {
          responseElement = element;
          console.log('🎯 Element matches selector:', selector);
          break;
        }
      }
      
      if (responseElement) {
        // Skip if already processed
        if (responseElement.dataset.tnfProcessed) {
          return;
        }
        
        // Validate it's actually an AI response
        if (this.isValidAIResponse(responseElement)) {
          responseElement.dataset.tnfProcessed = 'true';
          console.log('🎯 Found valid AI response element');
          
          // Wait for streaming to complete
          setTimeout(() => {
            this.extractUnifiedResponse(responseElement);
          }, 2000);
        }
      }
    }

    isValidAIResponse(element) {
      const text = element.textContent || element.innerText || '';
      
      // Must have substantial content
      if (text.length < 20) return false;
      
      // Must not be user input
      if (element.closest('[data-message-author-role="user"]')) return false;
      
      // Must not be UI elements
      if (text.includes('Show thinking') || 
          text.includes('Copy') || 
          text.includes('Share') ||
          text.includes('New chat') ||
          text.includes('Settings') ||
          element.tagName === 'BUTTON' ||
          element.tagName === 'NAV') return false;
      
      return true;
    }

    extractUnifiedResponse(element) {
      const text = this.cleanResponseText(element);
      
      if (!text || text.length < 10) {
        console.log('⚠️ No valid response text found');
        return;
      }
      
      // Prevent duplicates using content hash
      const contentHash = this.hashContent(text.substring(0, 100));
      if (this.processedResponses.has(contentHash)) {
        console.log('⚠️ Response already processed, skipping duplicate');
        return;
      }
      
      this.processedResponses.add(contentHash);
      console.log('✅ Unified response extracted:', text.substring(0, 100) + '...');
      
      // Send to background script
      chrome.runtime.sendMessage({
        type: 'AI_RESPONSE',
        source: this.aiType,
        response: text,
        conversationId: this.conversationId,
        timestamp: new Date().toISOString()
      });
      
      // Stop monitoring after successful extraction
      this.stopUnifiedResponseMonitoring();
    }

    cleanResponseText(element) {
      let text = element.textContent || element.innerText || '';
      
      // Remove common UI elements
      text = text
        .replace(/Show thinking/g, '')
        .replace(/Copy/g, '')
        .replace(/Share/g, '')
        .replace(/Good response/g, '')
        .replace(/Bad response/g, '')
        .replace(/Listen/g, '')
        .replace(/Redo/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      return text;
    }

    hashContent(text) {
      let hash = 0;
      if (text.length === 0) return hash.toString();
      for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return hash.toString();
    }

    // Legacy method for compatibility
    extractResponse(element) {
      const responseContainer = element.querySelector('.markdown') ||
                                element.querySelector('.model-response-text') ||
                                element.querySelector('.message-content') ||
                                element;

      text = responseContainer.innerText || responseContainer.textContent || '';

      // Aggressive cleaning for common UI elements and unwanted text
      text = text
        .replace(/Show thinking/g, '')
        .replace(/Copy/g, '')
        .replace(/Share/g, '')
        .replace(/Good response/g, '')
        .replace(/Bad response/g, '')
        .replace(/Redo/g, '')
        .replace(/Listen/g, '')
        .replace(/Just a sec\.\.\./g, '')
        .replace(/Gemini is typing/g, '')
        .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
        .trim();

      // Only send substantial responses, not UI elements or empty strings
      if (text.length > 5 && !text.includes('Show thinking')) { // Reduced minimum length for flexibility
        console.log('✅ Response extracted:', text.substring(0, 100) + '...');

        // Check if extension context is still valid before sending message
        try {
          if (chrome.runtime && chrome.runtime.id) {
            chrome.runtime.sendMessage({
              type: 'AI_RESPONSE',
              source: this.aiType,
              conversationId: this.conversationId,
              response: text
            });
          } else {
            console.warn('⚠️ Extension context invalidated, cannot send message');
          }
        } catch (error) {
          console.warn('⚠️ Extension context error:', error.message);
        }

        // Reset conversationId after a short delay to allow for potential follow-up parts
        setTimeout(() => {
          this.conversationId = null;
        }, 1000); // Reset after 1 second
      } else {
        console.log('⚠️ Skipping non-substantial response element:', text.substring(0, 50));
      }
    }

    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    setupKeyboardShortcuts() {
      document.addEventListener('keydown', (e) => {
        // Ctrl+Shift+T to toggle TNF UI
        if (e.ctrlKey && e.shiftKey && e.key === 'T') {
          e.preventDefault();
          if (window.tnfInjectableUI) {
            window.tnfInjectableUI.toggle();
          }
        }
      });
    }
  }

  // Initialize
  new AIInterface();
}
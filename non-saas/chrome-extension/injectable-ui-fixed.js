      return;
    }

    console.log(`📤 Sending message to ${targetAI}:`, message);

    // Add to local conversation history immediately
    this.addToLocalHistory({
      source: 'human-popup',
      content: message,
      timestamp: new Date().toISOString()
    });
    
    // Clear input
    messageInput.value = '';

    // Use direct DOM injection with better error handling
    try {
      const success = await this.directInject(message, targetAI);
      if (success) {
        console.log('✅ Direct injection successful');
      } else {
        console.log('❌ Direct injection failed');
        this.handleInjectionFailure('INJECTION_FAILED', { targetAI, messageLength: message.length });
      }
    } catch (error) {
      console.error('❌ Direct injection error:', error);
      this.handleInjectionFailure('INJECTION_ERROR', { error: error.message, targetAI });
    }
  }

  // FIX: Improved direct injection with timeout and better error handling
  async directInject(text, targetAI, retryCount = 0) {
    console.log(`🎯 Direct injection attempt into ${targetAI}`);
    
    try {
      // Find input element with timeout
      const inputElement = await Promise.race([
        this.findInputElementAdvanced(targetAI),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Input search timeout')), 5000))
      ]);
      
      if (!inputElement) {
        throw new Error('No input element found');
      }
      
      console.log('✅ Found input element:', inputElement);
      
      // Inject text with timeout
      const injectionSuccess = await Promise.race([
        this.injectTextAdvanced(inputElement, text),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Text injection timeout')), 3000))
      ]);
      
      if (!injectionSuccess) {
        throw new Error('Text injection failed');
      }
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate conversation ID for response tracking
      const conversationId = `injectable-ui-${Date.now()}`;
      
      // Send with timeout
      const sendSuccess = await Promise.race([
        this.activateSendAdvanced(inputElement, conversationId),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Send activation timeout')), 5000))
      ]);
      
      if (!sendSuccess) {
        throw new Error('Send activation failed');
      }
      
      console.log('✅ Injection completed successfully');
      this.recordInjectionSuccess(targetAI, text.length, retryCount);
      return true;
      
    } catch (error) {
      console.error(`❌ Direct injection error:`, error);
      this.handleInjectionFailure('DIRECT_INJECTION_ERROR', { 
        error: error.message, 
        targetAI, 
        retryCount,
        textLength: text.length 
      });
      return false;
    }
  }

  // Rest of the methods with continuation from the artifact...
  
  // FIX: Enhanced input finding with better validation
  async findInputElementAdvanced(targetAI) {
    const strategies = [
      () => this.findGeminiInput(),
      () => this.findByAriaLabels(targetAI),
      () => this.findByPlaceholderText(targetAI),
      () => this.findByContentEditable(),
      () => this.findByContextualClues(targetAI)
    ];
    
    for (const strategy of strategies) {
      try {
        const element = await strategy();
        if (element && this.validateInputElement(element)) {
          console.log('✅ Found valid input element');
          return element;
        }
      } catch (error) {
        console.warn('Input strategy failed:', error.message);
      }
    }
    
    console.error('❌ No valid input element found');
    return null;
  }

  findGeminiInput() {
    const selectors = [
      'div[contenteditable="true"]:not([aria-label*="Stop"])',
      'div[role="textbox"]',
      'textarea[placeholder*="prompt"]',
      'textarea[aria-label*="Enter a prompt"]',
      'div[aria-label*="Enter a prompt here"]'
    ];
    
    let bestCandidate = null;
    let bestScore = 0;
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      console.log(`🔍 Found ${elements.length} elements for selector: ${selector}`);
      
      for (const element of elements) {
        if (element.closest('#tnf-injectable-ui')) continue; // Skip our UI
        
        const rect = element.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        const isReasonableSize = rect.width > 200 && rect.height > 20;
        
        if (isVisible && isReasonableSize) {
          let score = 0;
          
          // Prefer larger elements (main input is usually bigger)
          score += Math.min(rect.width / 100, 10);
          score += Math.min(rect.height / 10, 5);
          
          // Prefer elements with prompt-related attributes
          if (element.getAttribute('aria-label')?.includes('prompt')) score += 10;
          if (element.placeholder?.includes('prompt')) score += 10;
          
          console.log(`📊 Element score: ${score}`, selector, element);
          
          if (score > bestScore) {
            bestScore = score;
            bestCandidate = element;
          }
        }
      }
    }
    
    if (bestCandidate) {
      console.log('✅ Found best input element with score:', bestScore, bestCandidate);
    }
    return bestCandidate;
  }

  // Add all the other methods from the artifact...
  async findByAriaLabels(targetAI) {
    const ariaLabels = {
      gemini: ['Enter a prompt here', 'Ask Gemini', 'prompt', 'message'],
      chatgpt: ['Send a message', 'message', 'prompt'],
      claude: ['Message Claude', 'Type a message', 'message'],
      perplexity: ['Ask anything', 'Search', 'question'],
      poe: ['Message', 'Talk to'],
      character: ['Type a message', 'message']
    };
    
    const labels = ariaLabels[targetAI] || ariaLabels.gemini;
    for (const label of labels) {
      const element = document.querySelector(`[aria-label*="${label}" i]`);
      if (element && !element.closest('#tnf-injectable-ui')) return element;
    }
    return null;
  }

  validateInputElement(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0;
    const isReasonableSize = rect.width > 50 && rect.height > 10;
    const isNotDisabled = !element.disabled && !element.hasAttribute('readonly');
    const isNotTNF = !element.closest('#tnf-injectable-ui');
    
    return isVisible && isReasonableSize && isNotDisabled && isNotTNF;
  }

  async injectTextAdvanced(inputElement, text) {
    try {
      // Clear any existing content first
      await this.clearInputElement(inputElement);
      
      // Try multiple injection methods in order of reliability
      const methods = [
        () => this.injectViaDirectSet(inputElement, text),
        () => this.injectViaEvents(inputElement, text),
        () => this.injectViaClipboard(inputElement, text)
      ];
      
      for (const method of methods) {
        try {
          await method();
          // Verify injection success
          const verification = await this.verifyTextInjection(inputElement, text);
          if (verification.success) {
            console.log(`✅ Text injection successful`);
            return true;
          }
        } catch (error) {
          console.warn('Injection method failed:', error.message);
        }
      }
      
      return false;
    } catch (error) {
      console.error('Advanced text injection failed:', error);
      return false;
    }
  }

  async injectViaDirectSet(element, text) {
    try {
      if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        element.value = text;
      } else if (element.contentEditable === 'true') {
        element.textContent = text;
        element.innerHTML = text; // Some frameworks need both
      }
      
      // Trigger change events
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      
      return true;
    } catch (error) {
      throw new Error('Direct set injection failed: ' + error.message);
    }
  }

  async verifyTextInjection(element, expectedText) {
    const actualText = element.value || element.textContent || '';
    const success = actualText.trim().includes(expectedText.trim());
    
    return {
      success,
      actualText,
      expectedText,
      method: 'verification'
    };
  }

  async clearInputElement(element) {
    try {
      if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        element.value = '';
      } else {
        element.textContent = '';
        element.innerHTML = '';
      }
      
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.focus();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return true;
    } catch (error) {
      console.warn('Failed to clear input element:', error);
      return false;
    }
  }

  // Utility methods
  addToLocalHistory(messageData) {
    try {
      this.state.conversationHistory.push({
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: messageData.timestamp || new Date().toISOString(),
        source: messageData.source || 'unknown',
        content: messageData.content,
        type: messageData.type || 'USER_MESSAGE'
      });
      
      // Keep only last 100 messages
      if (this.state.conversationHistory.length > 100) {
        this.state.conversationHistory = this.state.conversationHistory.slice(-100);
      }
      
      this.renderChatTab();
    } catch (error) {
      console.error('Failed to add to local history:', error);
    }
  }

  clearMessage() {
    try {
      const input = this.container.querySelector('#tnf-message-input');
      if (input) input.value = '';
    } catch (error) {
      console.error('Failed to clear message:', error);
    }
  }

  toggleUI() {
    try {
      this.setState({ isVisible: !this.state.isVisible });
      this.updateUIVisibility();
    } catch (error) {
      console.error('Failed to toggle UI:', error);
    }
  }

  updateUIVisibility() {
    try {
      if (!this.container || !this.toggleButton) return;
      
      if (this.state.isVisible) {
        this.container.style.display = 'block';
        this.container.classList.add('visible');
        this.toggleButton.classList.add('ui-visible');
        this.toggleButton.innerHTML = '×';
        this.toggleButton.title = 'Hide TNF AI Bridge (Ctrl+Shift+T)';
      } else {
        this.container.style.display = 'none';
        this.container.classList.remove('visible');
        this.toggleButton.classList.remove('ui-visible');
        this.toggleButton.innerHTML = 'TNF';
        this.toggleButton.title = 'Show TNF AI Bridge (Ctrl+Shift+T)';
      }
    } catch (error) {
      console.error('Failed to update UI visibility:', error);
    }
  }

  renderTabs() {
    try {
      const tabs = this.container.querySelector('.tabs');
      const contents = this.container.querySelectorAll('.tab-content');
      if (!tabs) return;
      
      tabs.innerHTML = '';
      contents.forEach(c => c.remove());

      ['Chat', 'Agents', 'TNF', 'Server', 'Ports'].forEach(tabName => {
        const lowerTabName = tabName.toLowerCase();
        const button = document.createElement('button');
        button.className = `tab-button ${this.state.activeTab === lowerTabName ? 'active' : ''}`;
        button.dataset.tab = lowerTabName;
        button.textContent = tabName;
        tabs.appendChild(button);

        const content = document.createElement('div');
        content.id = `${lowerTabName}-tab`;
        content.className = `tab-content ${this.state.activeTab === lowerTabName ? 'active' : ''}`;
        content.innerHTML = this.getTabContent(lowerTabName);
        this.container.querySelector('.tnf-ui-content').appendChild(content);
      });

      this.populateAISelects();
    } catch (error) {
      console.error('Failed to render tabs:', error);
    }
  }

  populateAISelects() {
    try {
      const aiOptions = [
        { value: 'chatgpt', text: 'ChatGPT' },
        { value: 'claude', text: 'Claude' },
        { value: 'gemini', text: 'Gemini' },
        { value: 'perplexity', text: 'Perplexity' },
        { value: 'poe', text: 'Poe' },
        { value: 'character', text: 'Character.AI' }
      ];

      const selects = this.container.querySelectorAll('#tnf-target-ai, .ai-select');
      selects.forEach(select => {
        if (select.id === 'tnf-target-ai') {
          select.innerHTML = '<option value="">Select AI Platform...</option>';
          aiOptions.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option.value;
            optionEl.textContent = option.text;
            if (option.value === this.state.currentAI) {
              optionEl.selected = true;
            }
            select.appendChild(optionEl);
          });
        }
      });
    } catch (error) {
      console.error('Failed to populate AI selects:', error);
    }
  }

  getTabContent(tabName) {
    switch (tabName) {
      case 'chat': return `
        <div class="conversation-section">
          <div class="section-title">Conversation History</div>
          <div class="chat-log" id="tnf-chat-log">
            <!-- Content rendered by renderChatTab -->
          </div>
          <div class="button-group">
            <button class="button button-secondary" id="tnf-clear-history-btn">Clear History</button>
            <button class="button button-secondary" id="tnf-refresh-btn">Refresh</button>
          </div>
        </div>
        <div class="conversation-section">
          <div class="section-title">Send Message to AI</div>
          <select class="ai-select" id="tnf-target-ai"></select>
          <textarea class="message-input" id="tnf-message-input" placeholder="Type your message here..."></textarea>
          <div class="button-group">
            <button class="button button-secondary" id="tnf-clear-btn">Clear</button>
            <button class="button button-primary" id="tnf-send-btn">Send</button>
          </div>
        </div>
      `;
      default: return '<div>Tab content placeholder</div>';
    }
  }

  switchTab(tabName) {
    try {
      this.setState({ activeTab: tabName });
    } catch (error) {
      console.error('Failed to switch tab:', error);
    }
  }

  renderChatTab() {
    try {
      const chatLog = this.container.querySelector('#tnf-chat-log');
      if (!chatLog) return;

      if (this.state.conversationHistory.length === 0) {
        chatLog.innerHTML = '<div class="no-messages">No conversation yet.</div>';
        return;
      }

      chatLog.innerHTML = this.state.conversationHistory.map(msg => {
        const timestamp = new Date(msg.timestamp).toLocaleTimeString();
        let content = msg.content || '';
        
        if (typeof content === 'object') {
          content = JSON.stringify(content, null, 2);
        }
        
        content = content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;')
          .replace(/\n/g, '<br>')
          .trim();
        
        const messageType = msg.source === 'human-popup' || msg.source === 'You' ? 'user-message' : 'ai-message';
        const senderName = msg.source === 'human-popup' ? 'You' : (msg.source || 'AI').charAt(0).toUpperCase() + (msg.source || 'AI').slice(1);
        
        return `
          <div class="chat-message ${messageType}">
            <div class="message-header">
              <span class="message-sender">${senderName}</span>
              <span class="message-timestamp">${timestamp}</span>
            </div>
            <div class="message-content">${content}</div>
          </div>
        `;
      }).join('');
      
      chatLog.scrollTop = chatLog.scrollHeight;
    } catch (error) {
      console.error('Failed to render chat tab:', error);
    }
  }

  // Error handling methods
  handleInjectionFailure(errorType, context) {
    const errorData = {
      timestamp: new Date().toISOString(),
      errorType,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      extensionVersion: chrome.runtime?.getManifest?.()?.version || 'unknown'
    };
    
    console.error('🚨 Injection Failure:', errorData);
    
    try {
      if (chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({
          type: 'INJECTION_FAILURE_TELEMETRY',
          data: errorData
        });
      }
    } catch (e) {
      console.warn('Failed to send telemetry:', e);
    }
  }

  recordInjectionSuccess(targetAI, textLength, retryCount) {
    const successData = {
      timestamp: new Date().toISOString(),
      targetAI,
      textLength,
      retryCount,
      url: window.location.href
    };
    
    console.log('📊 Injection Success:', successData);
    
    try {
      if (chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({
          type: 'INJECTION_SUCCESS_TELEMETRY',
          data: successData
        });
      }
    } catch (e) {
      console.warn('Failed to send success telemetry:', e);
    }
  }

  // FIX: Add global access for browser automation testing
  setupGlobalAccess() {
    try {
      // Make TNF instance globally accessible for browser automation
      window.TNFInjectableUI = this;
      window.tnfSendMessage = () => this.sendMessage();
      window.tnfToggleUI = () => this.toggleUI();
      window.tnfClearMessage = () => this.clearMessage();
      
      console.log('🌐 TNF global access methods available');
    } catch (error) {
      console.error('Failed to setup global access:', error);
    }
  }

  // FIX: Enhanced initialization with better error handling
  async initializeWithRetry(maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.init();
        this.setupGlobalAccess();
        console.log('✅ TNF Injectable UI initialized successfully');
        return true;
      } catch (error) {
        console.error(`❌ Initialization attempt ${i + 1} failed:`, error);
        if (i === maxRetries - 1) {
          console.error('❌ All initialization attempts failed');
          return false;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
}

// FIX: Enhanced initialization with better error handling and retries
(function initializeTNFInjectableUI() {
  'use strict';
  
  try {
    // Prevent multiple initialization
    if (window.tnfInjectableUIInstance) {
      console.log('🔄 TNF Injectable UI already initialized, skipping...');
      return;
    }
    
    console.log('🚀 Initializing TNF Injectable UI...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeTNF);
    } else {
      initializeTNF();
    }
    
    function initializeTNF() {
      try {
        window.tnfInjectableUIInstance = new TNFInjectableUI();
        
        // Additional initialization for browser automation compatibility
        window.tnfInjectableUIInstance.initializeWithRetry().then(success => {
          if (success) {
            console.log('🎉 TNF Injectable UI fully loaded and ready');
            
            // Dispatch ready event for browser automation
            window.dispatchEvent(new CustomEvent('tnfReady', {
              detail: { instance: window.tnfInjectableUIInstance }
            }));
          } else {
            console.error('❌ TNF Injectable UI failed to initialize');
          }
        });
        
      } catch (error) {
        console.error('❌ Critical error during TNF initialization:', error);
        
        // Retry initialization after a delay
        setTimeout(() => {
          if (!window.tnfInjectableUIInstance) {
            console.log('🔄 Retrying TNF initialization...');
            initializeTNF();
          }
        }, 3000);
      }
    }
    
  } catch (error) {
    console.error('❌ Fatal error in TNF Injectable UI script:', error);
  }
})();

// FIX: Browser automation helper functions
window.tnfHelpers = {
  // Direct button click for browser automation
  clickSendButton: () => {
    try {
      const sendBtn = document.getElementById('tnf-send-btn');
      if (sendBtn) {
        sendBtn.click();
        return true;
      }
      
      // Fallback: call sendMessage directly
      if (window.tnfInjectableUIInstance) {
        window.tnfInjectableUIInstance.sendMessage();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error clicking send button:', error);
      return false;
    }
  },
  
  // Set message content for browser automation
  setMessage: (text) => {
    try {
      const input = document.getElementById('tnf-message-input');
      if (input) {
        input.value = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error setting message:', error);
      return false;
    }
  },
  
  // Set target AI for browser automation
  setTargetAI: (ai) => {
    try {
      const select = document.getElementById('tnf-target-ai');
      if (select) {
        select.value = ai;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error setting target AI:', error);
      return false;
    }
  },
  
  // Send complete message for browser automation
  sendCompleteMessage: (text, ai = 'gemini') => {
    try {
      if (window.tnfHelpers.setTargetAI(ai) && 
          window.tnfHelpers.setMessage(text)) {
        return window.tnfHelpers.clickSendButton();
      }
      return false;
    } catch (error) {
      console.error('Error sending complete message:', error);
      return false;
    }
  }
};

console.log('✅ TNF Injectable UI script loaded with browser automation support');

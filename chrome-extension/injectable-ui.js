/**
 * TNF Injectable UI - Enhanced Embedded Chat Interface
 * Injects a comprehensive floating UI directly into AI webpages
 */

class TNFInjectableUI {
  constructor() {
    this.state = {
      isVisible: false,
      isMinimized: false,
      isDragging: false,
      dragOffset: { x: 0, y: 0 },
      conversationHistory: [],
      currentAI: this.detectCurrentAI(),
      relayConnected: false,
      activeTab: 'chat',
      serverStatus: {},
      portStatuses: {},
      masterAgent: null,
      agentGroups: {
        'a': { name: 'Group A', color: '#ff6b6b', agents: [] },
        'b': { name: 'Group B', color: '#4ecdc4', agents: [] },
        'c': { name: 'Group C', color: '#45b7d1', agents: [] },
        'd': { name: 'Group D', color: '#f9ca24', agents: [] },
        'e': { name: 'Group E', color: '#6c5ce7', agents: [] }
      },
      tnf: {
        relayConnected: false,
        agentRegistered: false,
        mcpConfigLoaded: false,
        databaseConnected: false,
        taskEngineStatus: false,
        workflowEngineStatus: false,
        ports: {},
        coreApiStatus: false,
        webSocketStatus: false,
        databaseHealth: false,
        agentOrchestrator: false
      },
      features: {
        agentSwarmEnabled: false,
        workflowAutomation: false,
        realTimeMonitoring: false,
        advancedAnalytics: false
      },
      performance: {
        injectionLatency: 0,
        responseLatency: 0,
        successRate: 100,
        totalOperations: 0
      },
      analytics: {
        averageScore: 0,
        totalResponses: 0,
        qualityDistribution: { high: 0, medium: 0, low: 0 }
      }
    };
    
    // Performance optimization flags
    this.performanceMode = 'balanced'; // 'fast', 'balanced', 'quality'
    this.renderThrottle = null;
    this.updateBatch = [];
    
    // Initialize performance monitoring
    this.initPerformanceTracking();
    this.init();
  }

  detectCurrentAI() {
    const hostname = window.location.hostname;
    if (hostname.includes('chatgpt.com')) return 'chatgpt';
    if (hostname.includes('claude.ai')) return 'claude';
    if (hostname.includes('gemini.google.com')) return 'gemini';
    if (hostname.includes('perplexity.ai')) return 'perplexity';
    if (hostname.includes('poe.com')) return 'poe';
    if (hostname.includes('character.ai')) return 'character';
    return 'unknown';
  }

  async init() {
    this.createToggleButton();
    this.createUI();
    this.setupEventListeners();
    this.setupMessageListener();
    this.setupKeyboardShortcuts();
    this.loadInitialState();
    this.initializeTNFIntegration();
  }

  setState(newState) {
    Object.assign(this.state, newState);
    this.throttledRender();
  }

  // Performance optimizations
  initPerformanceTracking() {
    this.performanceStart = Date.now();
    this.operationTimes = [];
    
    // Monitor memory usage if available
    if (performance.memory) {
      this.memoryStart = performance.memory.usedJSHeapSize;
    }
    
    // Set up periodic performance reporting
    setInterval(() => {
      this.reportPerformanceMetrics();
    }, 30000); // Every 30 seconds
  }

  throttledRender() {
    if (this.renderThrottle) {
      clearTimeout(this.renderThrottle);
    }
    
    this.renderThrottle = setTimeout(() => {
      this.render();
      this.renderThrottle = null;
    }, 16); // ~60fps
  }

  reportPerformanceMetrics() {
    const metrics = {
      uptime: Date.now() - this.performanceStart,
      operationCount: this.operationTimes.length,
      averageLatency: this.operationTimes.length > 0 ? 
        this.operationTimes.reduce((a, b) => a + b, 0) / this.operationTimes.length : 0,
      memoryUsage: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null,
      conversationLength: this.state.conversationHistory.length,
      activeTab: this.state.activeTab,
      mode: this.performanceMode
    };
    
    console.log('📊 TNF Injectable UI Performance:', metrics);
    
    // Send to background for analytics
    try {
      chrome.runtime.sendMessage({
        type: 'PERFORMANCE_METRICS',
        metrics: metrics
      });
    } catch (e) {
      // Extension context might be invalid
    }
  }

  optimizeForPerformance(mode) {
    this.performanceMode = mode;
    
    switch (mode) {
      case 'fast':
        // Reduce monitoring frequency and quality thresholds
        this.responseConfidenceThreshold = 0.5;
        this.maxPolls = 10;
        this.pollInterval = 3000;
        break;
      case 'quality':
        // Increase monitoring and quality thresholds
        this.responseConfidenceThreshold = 0.8;
        this.maxPolls = 30;
        this.pollInterval = 1000;
        break;
      default: // balanced
        this.responseConfidenceThreshold = 0.7;
        this.maxPolls = 20;
        this.pollInterval = 2000;
    }
    
    console.log(`🚀 Performance mode set to: ${mode}`);
  }

  async loadInitialState() {
    // Load conversation history
    chrome.runtime.sendMessage({ type: 'GET_CONVERSATION_HISTORY' }, (response) => {
      if (response && response.history) {
        this.setState({ conversationHistory: response.history });
      }
    });
    
    // Comprehensive TNF health check
    chrome.runtime.sendMessage({ type: 'TNF_HEALTH_CHECK' }, (response) => {
      if (response) {
        this.setState({
          tnf: {
            relayConnected: response.relay_connected,
            agentRegistered: response.agent_registered,
            mcpConfigLoaded: response.mcp_config_loaded,
            databaseConnected: response.database_connected,
            taskEngineStatus: response.task_engine_status || false,
            workflowEngineStatus: response.workflow_engine_status || false,
            coreApiStatus: response.core_api_status || false,
            webSocketStatus: response.websocket_status || false,
            databaseHealth: response.database_health || false,
            agentOrchestrator: response.agent_orchestrator || false
          },
          portStatuses: {
            8765: response.port_8765,
            3001: response.port_3001,
            3000: response.port_3000,
            3002: response.port_3002,
          }
        });
      }
    });
    
    // Load server status
    chrome.runtime.sendMessage({ type: 'GET_SERVER_STATUS' }, (response) => {
      if (response && response.status) {
        this.setState({ serverStatus: response.status });
      }
    });
    
    // Load port monitoring
    chrome.runtime.sendMessage({ type: 'GET_PORT_STATUS' }, (response) => {
      if (response && response.status) {
        this.setState({ portStatuses: response.status });
      }
    });
    
    // Load TNF features and performance data
    chrome.storage.local.get(['tnfConfig', 'features', 'performance'], (result) => {
      if (result.features) {
        this.setState({ features: { ...this.state.features, ...result.features } });
      }
      if (result.performance) {
        this.setState({ performance: { ...this.state.performance, ...result.performance } });
      }
    });
    
    this.render();
  }

  createToggleButton() {
    console.log('🔨 Creating TNF toggle button...');
    const existing = document.getElementById('tnf-toggle-button');
    if (existing) {
      console.log('🗑️ Removing existing TNF button');
      existing.remove();
    }

    const toggleButton = document.createElement('button');
    toggleButton.id = 'tnf-toggle-button';
    toggleButton.innerHTML = 'TNF';
    toggleButton.title = 'Toggle TNF AI Bridge (Ctrl+Shift+T)';
    
    // Make it highly visible for debugging
    toggleButton.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      width: 60px !important;
      height: 60px !important;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      border: 3px solid #ff0000 !important;
      border-radius: 50% !important;
      color: white !important;
      font-size: 16px !important;
      font-weight: bold !important;
      cursor: pointer !important;
      z-index: 999999 !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5) !important;
    `;
    
    toggleButton.addEventListener('click', () => {
      console.log('🎯 TNF button clicked!');
      this.toggleUI();
    });
    
    document.body.appendChild(toggleButton);
    this.toggleButton = toggleButton;
    console.log('✅ TNF toggle button created and added to DOM');
  }

  createUI() {
    const existing = document.getElementById('tnf-injectable-ui');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'tnf-injectable-ui';
    container.innerHTML = `
      <div class="tnf-ui-header">
        <div class="tnf-ui-title">
          <div class="tnf-ui-logo">TNF</div>
          <span>AI Bridge</span>
          <div class="tnf-ai-badge">${this.state.currentAI.toUpperCase()}</div>
        </div>
        <div class="tnf-ui-controls">
          <button id="tnf-performance-btn" title="Performance Settings">⚡</button>
          <button id="tnf-minimize-btn" title="Minimize">−</button>
          <button id="tnf-close-btn" title="Close">×</button>
        </div>
      </div>
      <div class="tnf-ui-content">
        <div class="tnf-status-bar">
          <div class="tnf-status-item">
            <span class="tnf-indicator ${this.state.tnf.relayConnected ? 'connected' : 'disconnected'}"></span>
            <span class="tnf-status-text">${this.state.tnf.relayConnected ? 'TNF Connected' : 'TNF Offline'}</span>
          </div>
          <div class="tnf-performance-indicator">
            <span class="tnf-perf-text">Mode: ${this.performanceMode}</span>
            <span class="tnf-perf-score">${this.state.analytics.averageScore || 'N/A'}</span>
          </div>
        </div>
        <div class="tabs">
          <button class="tab-button active" data-tab="chat">
            <span>💬</span>Chat
            <span class="tab-badge">${this.state.conversationHistory.length}</span>
          </button>
          <button class="tab-button" data-tab="analytics">
            <span>📊</span>Analytics
          </button>
          <button class="tab-button" data-tab="agents">
            <span>🤖</span>Agents
          </button>
          <button class="tab-button" data-tab="tnf">
            <span>🔗</span>TNF
          </button>
          <button class="tab-button" data-tab="settings">
            <span>⚙️</span>Settings
          </button>
        </div>
        <div id="chat-tab" class="tab-content active">...</div>
        <div id="analytics-tab" class="tab-content">...</div>
        <div id="agents-tab" class="tab-content">...</div>
        <div id="tnf-tab" class="tab-content">...</div>
        <div id="settings-tab" class="tab-content">...</div>
      </div>
    `;
    document.body.appendChild(container);
    this.container = container;
    
    // Add drag functionality for improved UX
    this.makeDraggable();
    
    // Initially hide the UI
    this.updateUIVisibility();
  }

  makeDraggable() {
    const header = this.container.querySelector('.tnf-ui-header');
    let isDragging = false;
    let startX, startY, initialX, initialY;

    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = this.container.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      
      header.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      e.preventDefault();
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      const newX = Math.max(0, Math.min(window.innerWidth - this.container.offsetWidth, initialX + deltaX));
      const newY = Math.max(0, Math.min(window.innerHeight - this.container.offsetHeight, initialY + deltaY));
      
      this.container.style.left = newX + 'px';
      this.container.style.top = newY + 'px';
      this.container.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        header.style.cursor = 'move';
      }
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        this.toggleUI();
      }
      
      // Prevent accidental Escape key that might stop Gemini responses
      if (e.key === 'Escape' && this.conversationId) {
        console.log('🛡️ Intercepting Escape key during active conversation');
        e.stopPropagation();
        return false;
      }
    });
    
    // Add a global click interceptor to prevent accidental stops
    document.addEventListener('click', (e) => {
      if (this.conversationId && 
          (e.target.getAttribute('aria-label')?.includes('Stop') ||
           e.target.textContent?.includes('Stop generating') ||
           e.target.classList.contains('stop-button'))) {
        console.log('🛡️ Protecting Gemini response from accidental stop click');
        e.stopPropagation();
        e.preventDefault();
        return false;
      }
    }, true); // Use capture phase to intercept early
  }

  setupEventListeners() {
    this.container.addEventListener('click', (e) => {
      // Prevent accidental interaction with Gemini's stop buttons
      if (e.target.getAttribute('aria-label')?.includes('Stop') || 
          e.target.textContent?.includes('Stop generating')) {
        console.log('🛡️ Preventing accidental click on Gemini stop button');
        e.stopPropagation();
        e.preventDefault();
        return;
      }
      
      if (e.target.id === 'tnf-close-btn') this.toggleUI();
      if (e.target.id === 'tnf-minimize-btn') this.toggleMinimize();
      if (e.target.classList.contains('tab-button')) this.switchTab(e.target.dataset.tab);
      if (e.target.id === 'tnf-send-btn') this.sendMessage();
      if (e.target.id === 'tnf-clear-btn') this.clearMessage();
      if (e.target.id === 'tnf-clear-history-btn') this.clearHistory();
      if (e.target.id === 'tnf-refresh-btn') this.refreshHistory();
      if (e.target.id === 'tnf-export-btn') this.exportHistory();
      if (e.target.id === 'tnf-register-master-btn') this.registerMasterAgent();
      if (e.target.id === 'tnf-unregister-master-btn') this.unregisterMasterAgent();
      if (e.target.id === 'tnf-assign-sub-agents-btn') this.assignSubAgents();
      if (e.target.id === 'tnf-broadcast-to-group-btn') this.broadcastToGroup();
      if (e.target.id === 'tnf-register-btn') this.registerWithTNF();
      if (e.target.id === 'tnf-reload-config-btn') this.reloadTNFConfig();
      if (e.target.id === 'tnf-start-comprehensive-btn') this.startTNFComprehensive();
      if (e.target.id === 'tnf-health-check-btn') this.performTNFHealthCheck();
      if (e.target.id === 'tnf-start-server-btn') this.startServer();
      if (e.target.id === 'tnf-stop-server-btn') this.stopServer();
      if (e.target.id === 'tnf-update-config-btn') this.updateConfig();
      if (e.target.id === 'tnf-restart-vite-btn') this.restartVite();
      if (e.target.id === 'tnf-add-port-btn') this.addPort();
      if (e.target.id === 'tnf-refresh-ports-btn') this.loadPortStatus();
    });
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'CONVERSATION_UPDATED':
          this.setState({ conversationHistory: message.history });
          break;
        case 'TNF_STATUS_UPDATE':
          this.setState({ tnf: message.payload.integration_status, portStatuses: message.payload.port_statuses });
          break;
        case 'SERVER_STATUS_UPDATE':
          this.setState({ serverStatus: message.payload });
          break;
        case 'PORT_STATUS_UPDATE':
          this.setState({ portStatuses: message.payload });
          break;
      }
    });
  }

  render() {
    if (!this.container) return;
    this.renderTabs();
    this.updateUIVisibility();
    this.renderChatTab();
    this.renderTnfTab();
    this.renderServerTab();
    this.renderPortsTab();
  }

  async sendMessage() {
    const messageInput = this.container.querySelector('#tnf-message-input');
    const targetAISelect = this.container.querySelector('#tnf-target-ai');
    const message = messageInput.value.trim();
    const targetAI = targetAISelect.value;

    if (!message || !targetAI) {
      alert('Please enter a message and select an AI.');
      return;
    }

    // Add to local conversation history immediately
    this.addToLocalHistory({
      source: 'human-popup',
      content: message,
      type: 'USER_MESSAGE',
      timestamp: new Date().toISOString()
    });
    messageInput.value = '';

    // Use DIRECT DOM injection (restored functionality)
    console.log('🚀 Attempting direct injection:', message);
    try {
      const success = await this.directInject(message, targetAI);
      if (success) {
        console.log('✅ Direct injection successful');
      } else {
        console.log('❌ Direct injection failed');
      }
    } catch (error) {
      console.error('❌ Direct injection error:', error);
    }
  }

  async directInject(text, targetAI, retryCount = 0) {
    // SINGLE ATTEMPT ONLY - no retries to prevent duplicates
    console.log(`🎯 Single attempt direct injection into ${targetAI} textbox`);
    
    try {
      // Find input element
      const inputElement = await this.findInputElementAdvanced(targetAI);
      if (!inputElement) {
        console.error('❌ No input element found - stopping to prevent duplicates');
        return false;
      }
      
      console.log('✅ Found input element for direct injection:', inputElement);
      
      // Single text injection attempt
      const injectionSuccess = await this.injectTextAdvanced(inputElement, text);
      if (!injectionSuccess) {
        console.error('❌ Text injection failed - stopping to prevent duplicates');
        return false;
      }
      
      // Wait briefly for processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate conversation ID for response tracking
      const conversationId = `injectable-ui-${Date.now()}`;
      
      // Single send attempt
      const sendSuccess = await this.activateSendAdvanced(inputElement, conversationId);
      if (!sendSuccess) {
        console.error('❌ Send activation failed - stopping to prevent duplicates');
        return false;
      }
      
      console.log('✅ Single injection completed successfully');
      return true;
      
    } catch (error) {
      console.error(`❌ Direct injection error - no retry to prevent duplicates:`, error);
      return false;
    }
  }

  async findInputElementAdvanced(targetAI) {
    // Multi-strategy input detection with scoring system
    const strategies = [
      () => this.findGeminiInput(), // Original method
      () => this.findByAriaLabels(targetAI),
      () => this.findByPlaceholderText(targetAI),
      () => this.findByContentEditable(),
      () => this.findByContextualClues(targetAI)
    ];
    
    for (const strategy of strategies) {
      try {
        const element = await strategy();
        if (element && this.validateInputElement(element)) {
          return element;
        }
      } catch (error) {
        console.warn('Strategy failed:', error.message);
      }
    }
    
    return null;
  }

  async injectTextAdvanced(inputElement, text) {
    try {
      // Clear any existing content first
      await this.clearInputElement(inputElement);
      
      // Multi-method text injection
      const methods = [
        () => this.injectViaClipboard(inputElement, text),
        () => this.injectViaEvents(inputElement, text),
        () => this.injectViaDirectSet(inputElement, text)
      ];
      
      for (const method of methods) {
        try {
          await method();
          // Verify injection success
          const verification = await this.verifyTextInjection(inputElement, text);
          if (verification.success) {
            console.log(`✅ Text injection successful via ${verification.method}`);
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

  async activateSendAdvanced(inputElement, conversationId) {
    try {
      // Find send button with multiple strategies
      const sendButton = await this.findSendButtonAdvanced();
      
      if (sendButton) {
        // Ensure button is ready and enabled
        await this.waitForButtonReady(sendButton);
        
        // Click with proper event simulation - ONLY click, no keyboard fallback
        await this.clickButtonAdvanced(sendButton);
        console.log('📤 Send button clicked - NO keyboard fallback to prevent duplicates');
        
        // Clear the input field after sending to prevent echo in responses
        setTimeout(async () => {
          await this.clearInputElement(inputElement);
          console.log('🧹 Input field cleared after sending');
        }, 1000);
        
        // Start response monitoring after successful send
        this.startAdvancedResponseMonitoring(conversationId);
        return true;
      } else {
        // Only use keyboard if button truly not found
        console.log('🔄 No send button found, using keyboard activation');
        await this.activateViaKeyboard(inputElement);
        this.startAdvancedResponseMonitoring(conversationId);
        return true;
      }
    } catch (error) {
      console.error('Send activation failed:', error);
      return false;
    }
  }

  handleInjectionFailure(errorType, context) {
    const errorData = {
      timestamp: new Date().toISOString(),
      errorType,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      extensionVersion: chrome.runtime.getManifest().version
    };
    
    console.error('🚨 Injection Failure:', errorData);
    
    // Send telemetry to background script
    try {
      chrome.runtime.sendMessage({
        type: 'INJECTION_FAILURE_TELEMETRY',
        data: errorData
      });
    } catch (e) {
      console.warn('Failed to send telemetry:', e);
    }
    
    // Update UI with error status
    this.updateUIErrorState(errorType, context);
  }

  recordInjectionSuccess(targetAI, textLength, retryCount) {
    const successData = {
      timestamp: new Date().toISOString(),
      targetAI,
      textLength,
      retryCount,
      url: window.location.href,
      performanceMetrics: this.getPerformanceMetrics()
    };
    
    console.log('📊 Injection Success:', successData);
    
    try {
      chrome.runtime.sendMessage({
        type: 'INJECTION_SUCCESS_TELEMETRY',
        data: successData
      });
    } catch (e) {
      console.warn('Failed to send success telemetry:', e);
    }
  }

  // Advanced utility methods for enterprise-grade error handling
  getPerformanceMetrics() {
    const performance = window.performance;
    return {
      timing: performance.timing ? {
        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        pageLoad: performance.timing.loadEventEnd - performance.timing.navigationStart
      } : null,
      memory: performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      } : null,
      navigation: performance.navigation ? {
        type: performance.navigation.type,
        redirectCount: performance.navigation.redirectCount
      } : null
    };
  }

  getProcessingDelay(targetAI, textLength) {
    // Adaptive timing based on AI platform and content complexity
    const baseDelay = {
      'gemini': 300,
      'chatgpt': 400,
      'claude': 350,
      'perplexity': 250
    }[targetAI] || 300;
    
    // Adjust for text length
    const lengthMultiplier = Math.min(textLength / 100, 3);
    return Math.round(baseDelay * (1 + lengthMultiplier * 0.5));
  }

  validateInputElement(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0;
    const isReasonableSize = rect.width > 100 && rect.height > 15;
    const isNotOurUI = !element.closest('#tnf-injectable-ui');
    
    return isVisible && isReasonableSize && isNotOurUI;
  }

  async findByAriaLabels(targetAI) {
    const ariaLabels = {
      'gemini': ['Enter a prompt here', 'prompt', 'message'],
      'chatgpt': ['Send a message', 'message', 'chat'],
      'claude': ['Type a message', 'message', 'input']
    }[targetAI] || ['prompt', 'message', 'input'];
    
    for (const label of ariaLabels) {
      const element = document.querySelector(`[aria-label*="${label}"]`);
      if (element && this.validateInputElement(element)) {
        return element;
      }
    }
    return null;
  }

  async findByPlaceholderText(targetAI) {
    const placeholders = {
      'gemini': ['Enter a prompt', 'Ask anything'],
      'chatgpt': ['Send a message', 'Message'],
      'claude': ['Type a message', 'Ask Claude']
    }[targetAI] || ['prompt', 'message'];
    
    for (const placeholder of placeholders) {
      const element = document.querySelector(`[placeholder*="${placeholder}"]`);
      if (element && this.validateInputElement(element)) {
        return element;
      }
    }
    return null;
  }

  async findByContentEditable() {
    const elements = document.querySelectorAll('[contenteditable="true"]');
    for (const element of elements) {
      if (this.validateInputElement(element)) {
        return element;
      }
    }
    return null;
  }

  async findByContextualClues(targetAI) {
    // Look for elements in typical chat interface patterns
    const containers = document.querySelectorAll('[class*="chat"], [class*="input"], [class*="prompt"]');
    for (const container of containers) {
      const inputs = container.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]');
      for (const input of inputs) {
        if (this.validateInputElement(input)) {
          return input;
        }
      }
    }
    return null;
  }

  async clearInputElement(element) {
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      element.value = '';
      element.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (element.contentEditable === 'true') {
      element.textContent = '';
      element.innerHTML = '';
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  async injectViaClipboard(element, text) {
    // Modern clipboard API approach
    try {
      await navigator.clipboard.writeText(text);
      element.focus();
      document.execCommand('paste');
      return true;
    } catch (error) {
      throw new Error('Clipboard injection failed: ' + error.message);
    }
  }

  async injectViaEvents(element, text) {
    element.focus();
    
    // Simulate typing with proper events
    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i);
      
      element.dispatchEvent(new KeyboardEvent('keydown', {
        key: char,
        code: `Key${char.toUpperCase()}`,
        bubbles: true
      }));
      
      if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        element.value += char;
      } else {
        element.textContent += char;
      }
      
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new KeyboardEvent('keyup', {
        key: char,
        code: `Key${char.toUpperCase()}`,
        bubbles: true
      }));
      
      // Small delay for natural typing simulation
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    
    return true;
  }

  async injectViaDirectSet(element, text) {
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      element.value = text;
    } else if (element.contentEditable === 'true') {
      element.textContent = text;
    }
    
    // Trigger change events
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    return true;
  }

  async verifyTextInjection(element, expectedText) {
    const actualText = element.value || element.textContent || '';
    const success = actualText.includes(expectedText);
    
    return {
      success,
      actualText,
      expectedText,
      method: 'verification'
    };
  }

  async findSendButtonAdvanced() {
    const strategies = [
      () => this.findAndClickSendButton(), // Original method
      () => this.findByButtonText(),
      () => this.findByIconPattern(),
      () => this.findBySubmitType()
    ];
    
    for (const strategy of strategies) {
      try {
        const button = await strategy();
        if (button && this.validateSendButton(button)) {
          return button;
        }
      } catch (error) {
        console.warn('Send button strategy failed:', error.message);
      }
    }
    
    return null;
  }

  validateSendButton(button) {
    if (!button) return false;
    
    const rect = button.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0;
    const isEnabled = !button.disabled && !button.hasAttribute('disabled');
    const isNotOurUI = !button.closest('#tnf-injectable-ui');
    
    return isVisible && isEnabled && isNotOurUI;
  }

  async findByButtonText() {
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      const text = button.textContent?.toLowerCase() || '';
      if (text.includes('send') || text.includes('submit')) {
        return button;
      }
    }
    return null;
  }

  async findByIconPattern() {
    // Look for common send icon patterns
    const iconSelectors = [
      'button svg[viewBox="0 0 24 24"]',
      'button [data-icon="send"]',
      'button .icon-send',
      'button [class*="send"]'
    ];
    
    for (const selector of iconSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.closest('button');
      }
    }
    return null;
  }

  async findBySubmitType() {
    return document.querySelector('button[type="submit"]');
  }

  async waitForButtonReady(button, timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (!button.disabled && !button.hasAttribute('disabled')) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error('Button not ready within timeout');
  }

  async clickButtonAdvanced(button) {
    // Single-method button activation to prevent duplicates
    try {
      button.focus();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use ONLY native click - no event dispatch fallback
      button.click();
      console.log('🖱️ Single native click performed - no event dispatch');
      
      // Verify click was processed
      await new Promise(resolve => setTimeout(resolve, 200));
      return true;
    } catch (error) {
      console.error('❌ Click failed - no fallback to prevent duplicates:', error);
      return false;
    }
  }

  async activateViaKeyboard(element) {
    element.focus();
    
    // Send only keydown - keyup can cause duplicate sends
    console.log('🎹 Sending focused Enter key event');
    element.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      bubbles: true
    }));
    
    // Remove keyup to prevent duplicate sends
    return true;
  }

  updateUIErrorState(errorType, context) {
    // Update injectable UI to show error state
    const statusElement = this.container?.querySelector('.status-value');
    if (statusElement) {
      statusElement.textContent = `Error: ${errorType}`;
      statusElement.style.color = '#dc3545';
    }
  }

  findGeminiInput() {
    // More specific and targeted selectors for Gemini's actual input
    const selectors = [
      'div[contenteditable="true"]',  // Gemini uses contenteditable divs
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
        const rect = element.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        const isReasonableSize = rect.width > 200 && rect.height > 20; // More specific size requirements
        
        if (isVisible && isReasonableSize) {
          // Score elements based on likelihood of being the main input
          let score = 0;
          
          // Prefer larger elements (main input is usually bigger)
          score += Math.min(rect.width / 100, 10);
          score += Math.min(rect.height / 10, 5);
          
          // Prefer elements with prompt-related attributes
          if (element.getAttribute('aria-label')?.includes('prompt')) score += 10;
          if (element.placeholder?.includes('prompt')) score += 10;
          
          // Prefer elements that are not inside other input containers
          const parent = element.closest('.tnf-injectable-ui');
          if (parent) score -= 20; // Avoid our own UI elements
          
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

  findGeminiSendButton() {
    // Wait for any text to be in the input first, as send button might appear after typing
    setTimeout(() => {
      this.findAndClickSendButton();
    }, 100);
    
    return this.findAndClickSendButton();
  }
  
  findAndClickSendButton() {
    const selectors = [
      'button[aria-label*="Send"]',
      'button[data-testid="send-button"]', 
      'button[title*="Send"]',
      'button svg[viewBox="0 0 24 24"]', // SVG icon buttons
      'button:has(svg[data-name="send"])',
      'button[type="submit"]'
    ];
    
    let bestCandidate = null;
    let bestScore = 0;
    
    for (const selector of selectors) {
      try {
        const buttons = document.querySelectorAll(selector);
        console.log(`🔍 Found ${buttons.length} buttons for selector: ${selector}`);
        
        for (const btn of buttons) {
          const rect = btn.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0;
          const isEnabled = !btn.disabled && !btn.hasAttribute('disabled');
          
          if (isVisible && isEnabled) {
            let score = 0;
            
            // Prefer buttons with send-related attributes
            if (btn.getAttribute('aria-label')?.toLowerCase().includes('send')) score += 15;
            if (btn.title?.toLowerCase().includes('send')) score += 15;
            if (btn.textContent?.toLowerCase().includes('send')) score += 10;
            
            // Prefer buttons near the bottom right (typical send button location)
            const viewportHeight = window.innerHeight;
            const buttonBottom = rect.bottom;
            if (buttonBottom > viewportHeight * 0.7) score += 5; // Bottom half
            
            // Prefer smaller, icon-like buttons (typical for send)
            if (rect.width < 60 && rect.height < 60) score += 3;
            
            // Avoid buttons inside our TNF UI
            const parent = btn.closest('.tnf-injectable-ui, #tnf-injectable-ui');
            if (parent) score -= 30;
            
            console.log(`📊 Button score: ${score}`, selector, btn);
            
            if (score > bestScore) {
              bestScore = score;
              bestCandidate = btn;
            }
          }
        }
      } catch (error) {
        console.log(`⚠️ Error with selector ${selector}:`, error);
      }
    }
    
    if (bestCandidate) {
      console.log('✅ Found best send button with score:', bestScore, bestCandidate);
    }
    return bestCandidate;
  }

  typeIntoElement(inputElement, text) {
    console.log('🎯 Typing into element:', inputElement, 'Text:', text);
    
    // Focus on the input element
    inputElement.focus();
    inputElement.click(); // Sometimes click is needed to activate
    
    // Wait a bit for focus
    setTimeout(() => {
      // Clear existing content first
      if (inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
        // For regular input/textarea elements
        inputElement.value = '';
        inputElement.value = text;
        
        // Trigger multiple events for React/modern frameworks
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        inputElement.dispatchEvent(new Event('change', { bubbles: true }));
        inputElement.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      } else {
        // For contenteditable divs (Gemini uses these)
        // Clear existing content
        inputElement.innerHTML = '';
        
        // Try multiple approaches for contenteditable
        inputElement.textContent = text;
        inputElement.innerHTML = `<p>${text}</p>`;
        
        // Simulate typing events for modern JavaScript frameworks
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        inputElement.dispatchEvent(new Event('change', { bubbles: true }));
        inputElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
        inputElement.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', bubbles: true }));
        
        // Place cursor at end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(inputElement);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      
      console.log('✅ Text typed into element:', text);
      console.log('📝 Element content after typing:', inputElement.textContent || inputElement.value);
    }, 50);
  }

  addToLocalHistory(messageData) {
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
    
    // Update the UI immediately
    this.renderChatTab();
    
    // Send to background script
    try {
      chrome.runtime.sendMessage({
        type: 'CONVERSATION_UPDATED',
        history: this.state.conversationHistory,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Failed to send conversation update:', e);
    }
  }

  clearMessage() {
    this.container.querySelector('#tnf-message-input').value = '';
  }

  clearHistory() {
    this.setState({ conversationHistory: [] });
    chrome.runtime.sendMessage({ type: 'CLEAR_CONVERSATION_HISTORY' });
  }

  refreshHistory() {
    chrome.runtime.sendMessage({ type: 'REQUEST_HISTORY_FROM_RELAY' });
  }

  exportHistory() {
    const data = JSON.stringify(this.state.conversationHistory, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'conversation-history.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  registerMasterAgent() {
    const agentName = this.container.querySelector('#tnf-master-agent-name').value;
    const agentGroup = this.container.querySelector('#tnf-agent-group').value;
    if (!agentName || !agentGroup) {
      alert('Please provide an agent name and group.');
      return;
    }
    chrome.runtime.sendMessage({
      type: 'SEND_TO_RELAY',
      payload: {
        type: 'REGISTER',
        payload: { name: agentName, type: 'MASTER_AGENT', group: agentGroup }
      }
    });
  }

  unregisterMasterAgent() {
    chrome.runtime.sendMessage({
      type: 'SEND_TO_RELAY',
      payload: { type: 'UNREGISTER' }
    });
  }

  assignSubAgents() {
    const subAgentGroup = this.container.querySelector('#tnf-sub-agent-group').value;
    if (!subAgentGroup) {
      alert('Please select a group to assign.');
      return;
    }
    chrome.runtime.sendMessage({
      type: 'SEND_TO_RELAY',
      payload: { type: 'ASSIGN_SUB_AGENTS', group: subAgentGroup }
    });
  }

  broadcastToGroup() {
    const subAgentGroup = this.container.querySelector('#tnf-sub-agent-group').value;
    const message = prompt('Enter message to broadcast:');
    if (!subAgentGroup || !message) {
      alert('Please select a group and enter a message.');
      return;
    }
    chrome.runtime.sendMessage({
      type: 'SEND_TO_RELAY',
      payload: { type: 'BROADCAST_TO_GROUP', group: subAgentGroup, message }
    });
  }

  registerWithTNF() {
    chrome.runtime.sendMessage({ type: 'EXECUTE_TNF_COMMAND', command: 'register_with_tnf' });
  }

  reloadTNFConfig() {
    chrome.runtime.sendMessage({ type: 'RELOAD_TNF_CONFIG' });
  }

  startTNFComprehensive() {
    chrome.runtime.sendMessage({ type: 'EXECUTE_TNF_COMMAND', command: 'start_tnf_comprehensive' });
  }

  performTNFHealthCheck() {
    chrome.runtime.sendMessage({ type: 'TNF_HEALTH_CHECK' });
  }

  startServer() {
    const port = this.container.querySelector('#tnf-server-port-input').value;
    chrome.runtime.sendMessage({ type: 'START_WEBSOCKET_SERVER', port });
  }

  stopServer() {
    chrome.runtime.sendMessage({ type: 'STOP_WEBSOCKET_SERVER' });
  }

  updateConfig() {
    const url = this.container.querySelector('#tnf-relay-url-input').value;
    chrome.runtime.sendMessage({ type: 'UPDATE_RELAY_URL', url });
  }

  restartVite() {
    chrome.runtime.sendMessage({ type: 'RESTART_VITE' });
  }

  addPort() {
    const port = this.container.querySelector('#tnf-new-port-input').value;
    if (!port) return;
    chrome.runtime.sendMessage({ type: 'PORT_ADD', port });
  }

  loadPortStatus() {
    chrome.runtime.sendMessage({ type: 'GET_PORT_STATUS' });
  }

  renderTabs() {
    const tabs = this.container.querySelector('.tabs');
    const contents = this.container.querySelectorAll('.tab-content');
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
  }

  populateAISelects() {
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
      case 'agents': return `
        <div class="conversation-section">
          <div class="section-title">Master Agent Registration</div>
          <input type="text" class="config-input" id="tnf-master-agent-name" placeholder="Master Agent Name" value="TNF Master Agent">
          <select class="ai-select" id="tnf-agent-group">
            <option value="">Select Agent Group...</option>
            <option value="a">Group A (Red)</option>
            <option value="b">Group B (Teal)</option>
            <option value="c">Group C (Blue)</option>
            <option value="d">Group D (Yellow)</option>
            <option value="e">Group E (Purple)</option>
          </select>
          <div class="button-group">
            <button class="button button-primary" id="tnf-register-master-btn">Register as Master</button>
            <button class="button button-secondary" id="tnf-unregister-master-btn">Unregister</button>
          </div>
        </div>
        <div class="conversation-section">
          <div class="section-title">Agent Groups</div>
          <div class="agent-groups" id="tnf-agent-groups"></div>
        </div>
        <div class="conversation-section">
          <div class="section-title">Sub-Agent Assignment</div>
          <select class="ai-select" id="tnf-sub-agent-group">
            <option value="">No Group Assignment</option>
            <option value="a">Assign to Group A</option>
            <option value="b">Assign to Group B</option>
            <option value="c">Assign to Group C</option>
            <option value="d">Assign to Group D</option>
            <option value="e">Assign to Group E</option>
          </select>
          <div class="button-group">
            <button class="button button-primary" id="tnf-assign-sub-agents-btn">Assign Injectable UIs</button>
            <button class="button button-secondary" id="tnf-broadcast-to-group-btn">Broadcast to Group</button>
          </div>
        </div>
      `;
      case 'tnf': return `
        <div class="conversation-section">
          <div class="section-title">The New Fuse Integration Status</div>
          <div class="status-item">
            <span>Relay Connection</span>
            <span id="tnf-relay-connection"></span>
          </div>
          <div class="status-item">
            <span>Agent Registration</span>
            <span id="tnf-agent-registration"></span>
          </div>
          <div class="status-item">
            <span>MCP Configuration</span>
            <span id="tnf-mcp-config"></span>
          </div>
          <div class="status-item">
            <span>Database Connection</span>
            <span id="tnf-database-connection"></span>
          </div>
        </div>
        <div class="conversation-section">
          <div class="section-title">TNF System Actions</div>
          <div class="button-group">
            <button class="button button-primary" id="tnf-register-btn">Register with TNF</button>
            <button class="button button-secondary" id="tnf-reload-config-btn">Reload Config</button>
          </div>
          <div class="button-group">
            <button class="button button-secondary" id="tnf-start-comprehensive-btn">Start TNF Relay</button>
            <button class="button button-secondary" id="tnf-health-check-btn">Health Check</button>
          </div>
        </div>
      `;
      case 'server': return `
        <div class="conversation-section">
          <div class="section-title">TNF Relay Server</div>
          <div class="server-status">
            <span class="indicator" id="tnf-server-indicator"></span>
            <span id="tnf-server-status-text"></span>
            <span class="server-port" id="tnf-server-port"></span>
          </div>
          <div class="button-group">
            <button class="button button-primary" id="tnf-start-server-btn">Start Server</button>
            <button class="button button-secondary" id="tnf-stop-server-btn" disabled>Stop Server</button>
          </div>
          <div class="config-section">
            <div class="section-title">Configuration</div>
            <input type="text" class="config-input" id="tnf-relay-url-input" placeholder="ws://localhost:3001" value="ws://localhost:3001">
            <input type="number" class="config-input" id="tnf-server-port-input" placeholder="Server Port (3001)" value="3001">
            <div class="button-group">
              <button class="button button-secondary" id="tnf-update-config-btn">Update Config</button>
              <button class="button button-secondary" id="tnf-restart-vite-btn">Restart Vite</button>
            </div>
          </div>
        </div>
      `;
      case 'ports': return `
        <div class="conversation-section">
          <div class="section-title">Port Monitor</div>
          <div class="port-grid" id="tnf-port-grid">
            <!-- Content rendered by renderPortsTab -->
          </div>
          <div class="config-section">
            <input type="number" class="config-input" id="tnf-new-port-input" placeholder="Add port to monitor...">
            <div class="button-group">
              <button class="button button-secondary" id="tnf-add-port-btn">Add Port</button>
              <button class="button button-secondary" id="tnf-refresh-ports-btn">Refresh</button>
            </div>
          </div>
        </div>
      `;
      default: return '';
    }
  }

  switchTab(tabName) {
    this.setState({ activeTab: tabName });
  }

  toggleUI() {
    this.setState({ isVisible: !this.state.isVisible });
    this.updateUIVisibility();
  }

  updateUIVisibility() {
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
  }

  toggle(visible) {
    this.setState({ isVisible: visible });
    this.updateUIVisibility();
  }

  toggleMinimize() {
    this.setState({ isMinimized: !this.state.isMinimized });
    const content = this.container.querySelector('.tnf-ui-content');
    if (content) {
      content.style.display = this.state.isMinimized ? 'none' : 'block';
    }
    
    if (this.toggleButton) {
      if (this.state.isMinimized) {
        this.toggleButton.classList.add('minimized');
      } else {
        this.toggleButton.classList.remove('minimized');
      }
    }
  }

  renderChatTab() {
    const chatLog = this.container.querySelector('#tnf-chat-log');
    if (!chatLog) return;

    if (this.state.conversationHistory.length === 0) {
      chatLog.innerHTML = '<div class="no-messages">No conversation yet.</div>';
      return;
    }

    chatLog.innerHTML = this.state.conversationHistory.map(msg => {
      // Format timestamp properly
      const timestamp = new Date(msg.timestamp).toLocaleTimeString();
      
      // Clean and format the message content
      let content = msg.content || '';
      
      // Handle cases where content might be an object or stringified
      if (typeof content === 'object') {
        content = JSON.stringify(content, null, 2);
      }
      
      // Escape HTML and format line breaks
      content = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>')
        .trim();
      
      // Truncate very long messages for readability
      const maxLength = 500;
      let displayContent = content;
      let isCollapsed = false;
      
      if (content.length > maxLength) {
        displayContent = content.substring(0, maxLength) + '...';
        isCollapsed = true;
      }
      
      // Determine message type
      const messageType = msg.source === 'human-popup' || msg.source === 'You' ? 'user-message' : 'ai-message';
      const senderName = msg.source === 'human-popup' ? 'You' : (msg.source || 'AI').charAt(0).toUpperCase() + (msg.source || 'AI').slice(1);
      
      return `
        <div class="chat-message ${messageType}">
          <div class="message-header">
            <span class="message-sender">${senderName}</span>
            <span class="message-timestamp">${timestamp}</span>
          </div>
          <div class="message-content" ${isCollapsed ? `data-full-content="${content.replace(/"/g, '&quot;')}"` : ''}>
            ${displayContent}
            ${isCollapsed ? `<br><button class="expand-btn" onclick="this.parentElement.innerHTML = this.parentElement.getAttribute('data-full-content')" style="background: #667eea; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; margin-top: 4px;">Show More</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  renderTnfTab() {
    const tnfTab = this.container.querySelector('#tnf-tab');
    if (!tnfTab) return;

    const { tnf } = this.state;
    tnfTab.querySelector('#tnf-relay-connection').textContent = tnf.relayConnected ? 'Connected' : 'Unknown';
    tnfTab.querySelector('#tnf-relay-connection').className = tnf.relayConnected ? 'status-connected' : 'status-unknown';

    tnfTab.querySelector('#tnf-agent-registration').textContent = tnf.agentRegistered ? 'Registered' : 'Unknown';
    tnfTab.querySelector('#tnf-agent-registration').className = tnf.agentRegistered ? 'status-connected' : 'status-unknown';

    tnfTab.querySelector('#tnf-mcp-config').textContent = tnf.mcpConfigLoaded ? 'Loaded' : 'Unknown';
    tnfTab.querySelector('#tnf-mcp-config').className = tnf.mcpConfigLoaded ? 'status-connected' : 'status-unknown';

    tnfTab.querySelector('#tnf-database-connection').textContent = tnf.databaseConnected ? 'Connected' : 'Unknown';
    tnfTab.querySelector('#tnf-database-connection').className = tnf.databaseConnected ? 'status-connected' : 'status-unknown';
  }

  renderServerTab() {
    const serverTab = this.container.querySelector('#server-tab');
    if (!serverTab) return;

    const { serverStatus } = this.state;
    const indicator = serverTab.querySelector('#tnf-server-indicator');
    const statusText = serverTab.querySelector('#tnf-server-status-text');
    const portText = serverTab.querySelector('#tnf-server-port');
    const stopButton = serverTab.querySelector('#tnf-stop-server-btn');

    if (serverStatus.isRunning) {
      indicator.className = 'indicator status-connected';
      statusText.textContent = 'Running';
      portText.textContent = `on port ${serverStatus.port}`; 
      stopButton.disabled = false;
    } else {
      indicator.className = 'indicator status-unknown';
      statusText.textContent = serverStatus.message || 'Stopped';
      portText.textContent = '';
      stopButton.disabled = true;
    }
  }

  renderPortsTab() {
    const portGrid = this.container.querySelector('#tnf-port-grid');
    if (!portGrid) return;

    const { portStatuses } = this.state;
    if (Object.keys(portStatuses).length === 0) {
      portGrid.innerHTML = '<div class="no-messages">No ports monitored.</div>';
      return;
    }

    portGrid.innerHTML = Object.entries(portStatuses).map(([port, status]) => `
      <div class="port-item">
        <span>Port ${port}</span>
        <span class="${status ? 'status-connected' : 'status-unknown'}">${status ? 'Online' : 'Offline'}</span>
      </div>
    `).join('');
  }

  

  

  

  

  

  

  

  

  monitorCanvasElement(canvasElement, conversationId) {
    console.log('🔍 Monitoring Canvas element:', canvasElement);
    
    try {
      // If it's an iframe, try to access its content
      if (canvasElement.tagName === 'IFRAME') {
        canvasElement.addEventListener('load', () => {
          try {
            const iframeDoc = canvasElement.contentDocument || canvasElement.contentWindow.document;
            if (iframeDoc) {
              console.log('📄 Canvas iframe loaded, monitoring content...');
              this.monitorCanvasDocument(iframeDoc, conversationId);
            }
          } catch (error) {
            console.log('🔒 Canvas iframe cross-origin, monitoring externally...');
            // If we can't access iframe content, monitor changes to the iframe itself
            this.monitorExternalCanvas(canvasElement, conversationId);
          }
        });
      } else {
        // If it's a div or other container, monitor its content
        this.monitorCanvasContainer(canvasElement, conversationId);
      }
    } catch (error) {
      console.warn('Canvas monitoring setup failed:', error);
    }
  }

  monitorCanvasDocument(doc, conversationId) {
    const canvasObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.extractCanvasContent(node, conversationId);
            }
          });
        }
      });
    });
    
    canvasObserver.observe(doc.body, {
      childList: true,
      subtree: true
    });
  }

  monitorExternalCanvas(canvasElement, conversationId) {
    // Monitor changes to iframe attributes or surrounding elements
    const externalObserver = new MutationObserver(() => {
      // Try to extract any visible Canvas content
      this.scanForCanvasContent(conversationId);
    });
    
    if (canvasElement.parentNode) {
      externalObserver.observe(canvasElement.parentNode, {
        childList: true,
        subtree: true,
        attributes: true
      });
    }
  }

  monitorCanvasContainer(container, conversationId) {
    const containerObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.extractCanvasContent(node, conversationId);
            }
          });
        }
      });
    });
    
    containerObserver.observe(container, {
      childList: true,
      subtree: true
    });
  }

  scanForCanvasContent(conversationId) {
    // Look for any text content that might be from Canvas
    const canvasIndicators = [
      'text that looks like it came from canvas',
      'document content',
      'generated content',
      'created content'
    ];
    
    // Look for elements that might contain Canvas content
    const possibleCanvasContent = document.querySelectorAll('div, p, span, article');
    
    possibleCanvasContent.forEach(element => {
      if (!element.dataset.tnfCanvasChecked && 
          !element.closest('#tnf-injectable-ui') &&
          element.textContent?.trim().length > 50) {
        
        element.dataset.tnfCanvasChecked = 'true';
        
        // Check if this might be Canvas content
        const text = element.textContent.trim();
        if (this.looksLikeCanvasContent(text)) {
          console.log('🎨 Found potential Canvas content:', text.substring(0, 100));
          this.extractCanvasContent(element, conversationId);
        }
      }
    });
  }

  looksLikeCanvasContent(text) {
    // Heuristics to identify Canvas content
    const canvasKeywords = [
      'document',
      'outline',
      'created',
      'generated',
      'draft',
      'content',
      'section',
      'heading'
    ];
    
    const hasCanvasKeyword = canvasKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
    
    const isSubstantial = text.length > 100;
    const hasStructure = text.includes('\n') || text.includes('.');
    
    return hasCanvasKeyword && isSubstantial && hasStructure;
  }

  hashContent(text) {
    // Simple hash function for content deduplication
    let hash = 0;
    if (text.length === 0) return hash.toString();
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  isLikelyAIResponse(node, textContent) {
    // Check if this is clearly an AI response container
    if (node.matches && (
        node.matches('[data-message-author-role="model"]') ||
        node.closest('[data-message-author-role="model"]') ||
        node.matches('.model-turn-content') ||
        node.closest('.model-turn-content')
    )) {
      return true;
    }
    
    // Exclude common UI elements, user input patterns, and navigation content
    const excludePatterns = [
      'Show thinking', 'Copy', 'Share', 'Good response', 'Bad response',
      'Listen', 'Redo', 'Enter a prompt', 'Ask Gemini', 'Settings',
      'New chat', 'Explore Gems', 'Main menu', 'Upload file',
      'Microphone', 'Video', 'Deep Research', 'Canvas',
      'Account:', 'Google Account', 'Invite a friend', 'PRO',
      'Gemini can make mistakes', 'double-check',
      'Conversation with Gemini', 'Hello,',
      // Navigation and UI patterns
      'menu', 'button', 'toolbar', 'sidebar', 'navigation',
      // User prompt patterns (common starts)
      'Create a simple document', 'Evaluate the long-term',
      'Analyze consequences', 'Compare teachings', 'Use game theory'
    ];
    
    const hasExcludePattern = excludePatterns.some(pattern => 
      textContent.includes(pattern)
    );
    
    // Also exclude short "Create..." prompts that are likely user input
    const isShortCreatePrompt = textContent.startsWith('Create') && textContent.length < 100;
    
    if (hasExcludePattern || isShortCreatePrompt) {
      return false;
    }
    
    // Check for AI response patterns
    const aiResponsePatterns = [
      /^(Here|I'll|Let me|I can|Of course|Certainly|Sure)/i,
      /\b(analysis|explanation|information|details|overview)\b/i,
      /\.(.*\.){2,}/, // Multiple sentences
      /^\w+(\s+\w+){10,}/ // Substantial content (10+ words)
    ];
    
    const hasAIPattern = aiResponsePatterns.some(pattern => pattern.test(textContent));
    
    // Must have AI response patterns AND substantial content
    return hasAIPattern && textContent.length > 50;
  }

  extractCanvasContent(element, conversationId) {
    const text = element.textContent?.trim() || '';
    
    if (text.length > 20) {
      console.log('🎨 Extracting Canvas content:', text.substring(0, 100));
      
      // Use content-based deduplication instead of random IDs
      const contentHash = this.hashContent(text);
      
      if (!this.processedResponses.has(contentHash)) {
        this.processedResponses.add(contentHash);
        
        // Debounce to aggregate content instead of capturing fragments
        if (this.canvasContentTimeout) {
          clearTimeout(this.canvasContentTimeout);
        }
        
        // Store partial content temporarily
        this.pendingCanvasContent = (this.pendingCanvasContent || '') + '\n' + text;
        
        // Wait for content to stabilize before adding to history
        this.canvasContentTimeout = setTimeout(() => {
          const finalContent = this.pendingCanvasContent.trim();
          if (finalContent && finalContent.length > 50) {
            this.addToLocalHistory({
              source: 'gemini-canvas',
              content: finalContent,
              type: 'CANVAS_CONTENT',
              timestamp: new Date().toISOString()
            });
            console.log('🎉 Aggregated Canvas content captured:', finalContent.substring(0, 100) + '...');
          }
          this.pendingCanvasContent = '';
        }, 3000); // Wait 3 seconds for content to stabilize
      }
    }
  }

  checkForNewResponse(node, conversationId) {
    // Skip our own UI elements
    if (node.closest && node.closest('#tnf-injectable-ui')) {
      return;
    }
    
    // Skip if this is a user input area or UI control
    if (node.closest('button') || 
        node.closest('input') || 
        node.closest('textarea') ||
        node.closest('[data-message-author-role="user"]') ||
        node.closest('nav') ||
        node.closest('header') ||
        node.closest('[role="navigation"]') ||
        node.closest('[role="banner"]')) {
      return;
    }
    
    // Check if this node or its children contain response content
    const textContent = node.textContent?.trim() || '';
    
    // More specific filtering for AI responses vs user input/UI content
    if (textContent.length > 30 && // Increased minimum length to avoid capturing UI snippets
        this.isLikelyAIResponse(node, textContent)) {
      
      // Use content-based deduplication instead of timestamp
      const contentHash = this.hashContent(textContent.substring(0, 100));
      
      // Check if we've already processed this response
      if (!this.processedResponses.has(contentHash) && !node.dataset.tnfChecked) {
        node.dataset.tnfChecked = 'true';
        this.processedResponses.add(contentHash);
        
        // Debounce to wait for complete content instead of fragments
        if (this.responseDebounceTimeout) {
          clearTimeout(this.responseDebounceTimeout);
        }
        
        this.responseDebounceTimeout = setTimeout(() => {
          this.evaluateResponseCandidate(node, conversationId, contentHash);
        }, 2000); // Wait 2 seconds for content to stabilize
      }
    }
    
    // Also check children recursively but avoid deep traversal that causes fragmentation
    if (node.children && node.children.length < 10) { // Limit deep traversal
      const childrenToCheck = Array.from(node.children).slice(0, 5); // Limit to first 5 children
      for (const child of childrenToCheck) {
        this.checkForNewResponse(child, conversationId);
      }
    }
  }

  evaluateResponseCandidate(node, conversationId, responseId) {
    const textContent = node.textContent?.trim() || '';
    
    // Skip if it's too short or contains UI elements
    if (textContent.length < 10 || 
        textContent.includes('Show thinking') ||
        textContent.includes('Copy') ||
        textContent.includes('Share')) {
      return;
    }
    
    // Check if this might be a complete response
    const hasCompleteSentence = textContent.includes('.') || textContent.includes('!') || textContent.includes('?');
    const isReasonableLength = textContent.length > 5;
    
    if (hasCompleteSentence && isReasonableLength) {
      console.log(`🎯 Found response #${this.responseCount + 1}:`, textContent.substring(0, 100) + '...');
      
      // Extract and process the response (don't stop monitoring!)
      this.extractResponse(node, conversationId, responseId);
    }
  }

  extractResponse(node, conversationId, responseId) {
    console.log('📝 Extracting response from node:', node);
    
    let responseText = node.textContent?.trim() || '';
    
    // Clean the response text
    responseText = responseText
      .replace(/Show thinking/g, '')
      .replace(/Copy/g, '')
      .replace(/Share/g, '')
      .replace(/Good response/g, '')
      .replace(/Bad response/g, '')
      .replace(/Listen/g, '')
      .replace(/Redo/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (responseText.length > 5) {
      this.responseCount++;
      console.log(`✅ Valid response #${this.responseCount} extracted:`, responseText);
      
      // Add to conversation history (don't stop monitoring!)
      this.addToLocalHistory({
        source: 'gemini',
        content: responseText,
        type: 'AI_RESPONSE',
        timestamp: new Date().toISOString()
      });
      
      // Send to background script
      try {
        chrome.runtime.sendMessage({
          type: 'AI_RESPONSE',
          source: 'gemini',
          conversationId: conversationId,
          response: responseText
        });
      } catch (error) {
        console.warn('Failed to send to background script:', error);
      }
      
      console.log(`🎉 Response #${this.responseCount} successfully captured! Continuing to monitor for more...`);
    }
  }

  startAdvancedResponseMonitoring(conversationId) {
    console.log('👁️ SIMPLE: Starting basic response monitoring for conversation:', conversationId);
    
    // Clean up any existing monitoring first
    this.cleanupMonitoring();
    
    this.conversationId = conversationId;
    this.processedResponses = new Set();
    this.responseFound = false;
    this.responseCount = 0;
    this.isExtracting = false;
    this.monitoringStartTime = Date.now();
    
    // Simple mutation observer - just watch for any new content
    this.responseObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Much simpler - just check any new element
              this.checkForGeminiResponse(node);
            }
          }
        }
      }
    });
    
    this.responseObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    // Frequent scanning to catch anything we missed
    this.pollingInterval = setInterval(() => {
      this.scanForGeminiResponses();
    }, 2000);
    
    // Set timeout to automatically stop monitoring
    this.monitoringTimeout = setTimeout(() => {
      console.log('⏰ Response monitoring timeout reached');
      this.cleanupMonitoring();
    }, 60000);
    
    console.log('✅ SIMPLE response monitoring started successfully');
  }

  checkForGeminiResponse(element) {
    // Skip our own UI
    if (element.closest('#tnf-injectable-ui')) return;
    
    // Simple approach: Look for any new paragraphs that might be responses
    // We'll do the thinking content filtering AFTER we capture, not before
    if (element.tagName === 'P' || element.querySelector('p')) {
      const text = element.textContent || '';
      if (text.length > 30 && !element.dataset.tnfChecked) {
        element.dataset.tnfChecked = 'true';
        console.log('📝 SIMPLE: Found potential response paragraph:', text.substring(0, 50) + '...');
        
        // Process with a delay to let content stabilize
        setTimeout(() => {
          this.extractGeminiResponse(element);
        }, 2000);
      }
    }
    
    // Also look for traditional response containers (but simplified)
    const simpleSelectors = [
      '[data-message-author-role="model"]',
      '[role="article"]'
    ];
    
    for (const selector of simpleSelectors) {
      const responseElement = element.querySelector(selector) || 
                             (element.matches && element.matches(selector) ? element : null);
      if (responseElement && !responseElement.dataset.tnfProcessed) {
        responseElement.dataset.tnfProcessed = 'true';
        console.log('🎯 SIMPLE: Found response container with selector:', selector);
        
        setTimeout(() => {
          this.extractGeminiResponse(responseElement);
        }, 2000);
        break;
      }
    }
  }
  
  scanForGeminiResponses() {
    console.log('🔍 SIMPLE SCAN: Looking for any response elements...');
    
    // Much simpler selectors - just look for basic response patterns
    const basicSelectors = [
      '[data-message-author-role="model"]',
      '[role="article"]',
      'p' // Also check paragraphs directly
    ];
    
    basicSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (!element.dataset.tnfProcessed && !element.closest('#tnf-injectable-ui')) {
          const text = element.textContent || '';
          
          // Very simple check - just needs substantial content
          if (text.length > 50) {
            console.log(`🔍 SCAN FOUND: ${text.substring(0, 50)}...`);
            element.dataset.tnfProcessed = 'true';
            this.extractGeminiResponse(element);
          }
        }
      });
    });
  }
  
  looksLikeGeminiResponse(text) {
    // Enhanced detection for Gemini responses
    const hasSubstantialContent = text.length > 30;
    const hasCompleteSentences = text.includes('.') || text.includes('!') || text.includes('?');
    
    // Enhanced exclusion patterns
    const notUIContent = !text.includes('Copy') && !text.includes('Share') && 
                        !text.includes('Show thinking') && !text.includes('Good response') &&
                        !text.includes('Thinking...') && !text.includes('Let me think') &&
                        !text.includes('I need to think') && !text.includes('My thinking:');
    
    const notUserPrompt = !text.startsWith('Create a') && !text.startsWith('Analyze') && 
                         !text.startsWith('Compare') && !text.startsWith('Evaluate') &&
                         !text.startsWith('Show thinking') && !text.startsWith('Thinking');
    
    // Additional thinking content patterns
    const notThinkingContent = !text.match(/^(Show thinking|Thinking\.\.\.)/i) &&
                              !text.includes('chain of thought') &&
                              !text.includes('step by step thinking');
    
    return hasSubstantialContent && hasCompleteSentences && notUIContent && notUserPrompt && notThinkingContent;
  }

  extractGeminiResponse(element) {
    // Prevent multiple simultaneous extractions
    if (this.isExtracting) {
      console.log('⚠️ Already extracting a response, skipping to prevent duplicates');
      return;
    }
    
    this.isExtracting = true;
    
    try {
      const text = this.extractGeminiResponseText(element);
      if (!text || text.length < 20) {
        console.log('⚠️ Response too short or empty, skipping');
        return;
      }
      
      // CRITICAL: Final check to ensure NO thinking content
      if (text.includes('Show thinking') || text.includes('Thinking...')) {
        console.log('🚫 FINAL BLOCK: Response still contains thinking content, rejecting');
        return;
      }
      
      // ADDITIONAL FILTER: Try to extract only the main response content
      const cleanedText = this.extractMainResponseContent(text);
      if (!cleanedText || cleanedText.length < 20) {
        console.log('⚠️ No main response content found after cleaning');
        return;
      }
      
      // Check for duplicates using content hash
      const contentHash = this.hashContent(cleanedText.substring(0, 100));
      if (this.processedResponses.has(contentHash)) {
        console.log('⚠️ Duplicate response detected, skipping');
        return;
      }
      
      this.processedResponses.add(contentHash);
      this.responseCount = (this.responseCount || 0) + 1;
      
      console.log(`✅ CLEAN RESPONSE #${this.responseCount} extracted:`, cleanedText.substring(0, 100) + '...');
      
      // Add to conversation history with proper source
      this.addToLocalHistory({
        source: 'gemini',
        content: cleanedText,
        type: 'AI_RESPONSE',
        timestamp: new Date().toISOString()
      });
      
      // Send to background script
      try {
        chrome.runtime.sendMessage({
          type: 'AI_RESPONSE',
          source: 'gemini',
          conversationId: this.conversationId,
          response: cleanedText,
          responseNumber: this.responseCount
        });
      } catch (error) {
        console.warn('⚠️ Could not send to background:', error);
      }
      
      console.log(`🎉 CLEAN Response #${this.responseCount} successfully captured and displayed!`);
      
    } finally {
      // Always reset the extraction flag after a short delay
      setTimeout(() => {
        this.isExtracting = false;
      }, 1000);
    }
  }
  
  extractMainResponseContent(text) {
    // Split text into paragraphs/sections
    const sections = text.split(/\n\n+/);
    const validSections = [];
    
    for (const section of sections) {
      const trimmed = section.trim();
      
      // Skip empty sections
      if (!trimmed) continue;
      
      // Skip thinking-related sections (case insensitive)
      if (trimmed.match(/^(show thinking|thinking|let me think|my thinking)/i)) {
        console.log('🚫 Skipping thinking section:', trimmed.substring(0, 50));
        continue;
      }
      
      // Skip very short sections (likely UI elements)
      if (trimmed.length < 15) continue;
      
      // Skip sections that are mostly UI content
      if (trimmed.match(/^(copy|share|good|bad|listen|redo)$/i)) continue;
      
      // This looks like actual response content
      validSections.push(trimmed);
    }
    
    // Join valid sections back together
    const result = validSections.join('\n\n').trim();
    
    if (result.length > 0) {
      console.log(`✅ Extracted ${validSections.length} valid sections from response`);
    }
    
    return result;
  }

  extractResponse(element) {
    if (this.responseFound) return;
    
    const text = this.extractGeminiResponseText(element);
    if (!text || text.length < 10) return;
    
    // Check for duplicates
    const contentHash = text.substring(0, 50);
    if (this.processedResponses.has(contentHash)) return;
    
    this.processedResponses.add(contentHash);
    this.responseFound = true;
    
    console.log('✅ Response extracted:', text.substring(0, 100) + '...');
    
    // Add to conversation history
    this.addToLocalHistory({
      source: this.state.currentAI,
      content: text,
      type: 'AI_RESPONSE',
      timestamp: new Date().toISOString()
    });
    
    // Update the UI immediately
    this.renderChatTab();
    
    // Send to background script
    try {
      chrome.runtime.sendMessage({
        type: 'AI_RESPONSE',
        source: this.state.currentAI,
        conversationId: this.conversationId,
        response: text
      });
    } catch (error) {
      console.warn('⚠️ Could not send to background:', error);
    }
    
    // Stop monitoring after successful extraction
    this.cleanupMonitoring();
  }

  extractGeminiResponseText(element) {
    // Skip our own UI elements
    if (element.closest('#tnf-injectable-ui')) return null;
    
    let text = element.textContent || element.innerText || '';
    
    // AGGRESSIVE thinking content removal - do this FIRST
    text = text
      .replace(/Show thinking[\s\S]*?(?=\n\n|$)/gi, '') // Remove "Show thinking" sections
      .replace(/Thinking\.\.\.[\s\S]*?(?=\n\n|$)/gi, '') // Remove "Thinking..." sections
      .replace(/Let me think[\s\S]*?(?=\n\n|$)/gi, '') // Remove "Let me think" sections
      .replace(/My thinking:[\s\S]*?(?=\n\n|$)/gi, '') // Remove "My thinking:" sections
      .replace(/\*\*Thinking:\*\*[\s\S]*?(?=\n\n|$)/gi, '') // Remove "**Thinking:**" sections
      .replace(/\*thinking\*[\s\S]*?(?=\n\n|$)/gi, '') // Remove "*thinking*" sections
      .replace(/\(thinking[\s\S]*?\)/gi, '') // Remove (thinking...) sections
      .replace(/\[thinking[\s\S]*?\]/gi, '') // Remove [thinking...] sections
      .trim();
    
    // Enhanced text cleaning for Gemini UI elements
    text = text
      .replace(/Show thinking/g, '')
      .replace(/Copy code/g, '')
      .replace(/Copy/g, '')
      .replace(/Share/g, '')
      .replace(/Good response/g, '')
      .replace(/Bad response/g, '')
      .replace(/Listen/g, '')
      .replace(/Redo/g, '')
      .replace(/Sources?$/g, '')
      .replace(/Gemini can make mistakes/g, '')
      .replace(/Thinking\.\.\.$/g, '') // Remove trailing "Thinking..."
      .replace(/^Thinking\.\.\.\s*/g, '') // Remove leading "Thinking..."
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Return null if text is too short, empty, or contains only UI/thinking elements
    if (text.length < 20 || 
        text.match(/^(Copy|Share|Good|Bad|Listen|Redo|Show thinking|Thinking)$/i) ||
        text.match(/^\s*(Show thinking|Thinking\.\.\.)/i)) {
      console.log('🚫 Filtered out thinking/UI content:', text.substring(0, 50));
      return null;
    }
    
    // Final check - if more than 50% of content appears to be thinking-related, reject it
    const thinkingWords = ['thinking', 'think', 'thought', 'consider', 'reasoning', 'analysis'];
    const words = text.toLowerCase().split(/\s+/);
    const thinkingWordCount = words.filter(word => 
      thinkingWords.some(tw => word.includes(tw))
    ).length;
    
    if (thinkingWordCount > words.length * 0.5) {
      console.log('🚫 Text appears to be mostly thinking content, rejecting');
      return null;
    }
    
    return text;
  }

  stopResponseMonitoring() {
    console.log('🛑 Stopping response monitoring');
    this.cleanupMonitoring();
  }

  cleanupMonitoring() {
    if (this.responseObserver) {
      this.responseObserver.disconnect();
      this.responseObserver = null;
    }
    
    if (this.monitoringTimeout) {
      clearTimeout(this.monitoringTimeout);
      this.monitoringTimeout = null;
    }
    
    console.log('🧹 Response monitoring cleaned up');
  }

  setupMutationObserver(conversationId) {
    this.responseObserver = new MutationObserver((mutations) => {
      if (this.responseFound) return;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.analyzeResponseCandidate(node, conversationId);
            }
          }
        } else if (mutation.type === 'characterData' || mutation.type === 'attributes') {
          // Handle streaming text updates
          if (mutation.target && mutation.target.parentElement) {
            this.analyzeResponseCandidate(mutation.target.parentElement, conversationId);
          }
        }
      }
    });
    
    this.responseObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['data-message-id', 'data-author', 'data-role']
    });
  }

  setupPerformanceObserver(conversationId) {
    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource' && entry.name.includes('stream')) {
            console.log('🔍 Injectable UI: Detected streaming response via performance observer');
            setTimeout(() => this.scanForNewResponses(conversationId), 1000);
          }
        }
      });
      
      this.performanceObserver.observe({ 
        entryTypes: ['resource', 'navigation'] 
      });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }

  setupIntersectionObserver(conversationId) {
    try {
      this.intersectionObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target.textContent?.length > 50) {
            this.analyzeResponseCandidate(entry.target, conversationId);
          }
        }
      }, {
        threshold: 0.1,
        rootMargin: '50px'
      });
      
      // Observe potential response containers
      document.querySelectorAll('[role="article"], [data-testid*="conversation"], .message').forEach(el => {
        this.intersectionObserver.observe(el);
      });
    } catch (error) {
      console.warn('Intersection Observer setup failed:', error);
    }
  }

  setupPollingBackup(conversationId) {
    let pollCount = 0;
    const maxPolls = 20; // 40 seconds total
    
    this.pollingInterval = setInterval(() => {
      if (this.responseFound) {
        console.log('⏰ Injectable UI: Polling stopped - response found');
        this.cleanupMonitoring();
        return;
      }
      
      pollCount++;
      console.log(`🔄 Injectable UI: Advanced polling (${pollCount}/${maxPolls})`);
      
      this.scanForNewResponses(conversationId);
      
      if (pollCount >= maxPolls) {
        console.log('⏰ Injectable UI: Polling stopped - maximum attempts reached');
        this.cleanupMonitoring();
      }
    }, 2000);
  }

  setupSmartCleanup() {
    // Progressive timeout system
    const timeouts = [
      { delay: 30000, action: () => this.performanceObserver?.disconnect() },
      { delay: 45000, action: () => this.intersectionObserver?.disconnect() },
      { delay: 60000, action: () => this.cleanupMonitoring() }
    ];
    
    timeouts.forEach(({ delay, action }) => {
      setTimeout(action, delay);
    });
  }

  analyzeResponseCandidate(element, conversationId) {
    if (!element || this.responseFound) return;
    
    // Skip if already processed
    const elementId = this.getElementId(element);
    if (this.processedResponses.has(elementId)) return;
    
    // Calculate response confidence score
    const score = this.calculateResponseScore(element);
    this.responseScores.set(elementId, score);
    
    console.log(`🎯 Injectable UI: Response candidate score: ${score.toFixed(2)}`, element);
    
    // Process if score meets threshold
    if (score >= this.responseConfidenceThreshold) {
      this.processResponseCandidate(element, conversationId, score);
    }
  }

  calculateResponseScore(element) {
    let score = 0;
    const text = element.textContent || element.innerText || '';
    
    // Content-based scoring
    if (text.length > 50) score += 0.3;
    if (text.length > 200) score += 0.2;
    if (text.length > 500) score += 0.1;
    
    // Structure-based scoring
    if (element.matches('[data-message-author-role="model"]')) score += 0.8;
    if (element.matches('[data-testid*="conversation-turn"]')) score += 0.6;
    if (element.matches('[role="article"]')) score += 0.4;
    if (element.querySelector('p, div')) score += 0.2;
    
    // Location-based scoring
    const rect = element.getBoundingClientRect();
    if (rect.top > window.innerHeight * 0.3) score += 0.1; // Lower on page
    
    // Temporal scoring (newer elements more likely to be responses)
    const age = Date.now() - (this.monitoringStartTime || Date.now());
    if (age < 10000) score += 0.2; // Recent within 10 seconds
    
    // Negative scoring for unwanted elements
    if (text.includes('Show thinking')) score -= 0.5;
    if (text.includes('Copy')) score -= 0.3;
    if (text.includes('Share')) score -= 0.3;
    if (element.closest('#tnf-injectable-ui')) score -= 1.0;
    if (element.tagName === 'BUTTON') score -= 0.4;
    
    // Ensure score is within bounds
    return Math.max(0, Math.min(1, score));
  }

  processResponseCandidate(element, conversationId, score) {
    const elementId = this.getElementId(element);
    this.processedResponses.add(elementId);
    
    // Wait for streaming to complete
    setTimeout(() => {
      this.extractAndProcessResponse(element, conversationId, score);
    }, 2000);
  }

  extractAndProcessResponse(element, conversationId, score) {
    let text = element.innerText || element.textContent || '';
    
    // Advanced text cleaning
    text = this.cleanResponseText(text);
    
    // Validate response quality
    if (!this.validateResponseQuality(text)) {
      console.log('⚠️ Injectable UI: Response quality validation failed');
      return;
    }
    
    console.log(`✅ Injectable UI: High-quality response extracted (score: ${score.toFixed(2)}):`, text.substring(0, 100) + '...');
    
    // Mark element as processed
    element.dataset.tnfExtracted = 'true';
    this.responseFound = true;
    
    // Send to background script with metadata
    this.sendResponseWithMetadata(text, conversationId, score, element);
    
    // Update local conversation history
    this.addToLocalHistory({
      source: 'gemini',
      content: text,
      timestamp: new Date().toISOString(),
      metadata: {
        score,
        extractionMethod: 'advanced',
        elementType: element.tagName,
        confidence: score
      }
    });
    
    // Cleanup monitoring
    this.cleanupMonitoring();
  }

  cleanResponseText(text) {
    return text
      .replace(/Show thinking/g, '')
      .replace(/Copy/g, '')
      .replace(/Share/g, '')
      .replace(/Sources$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  validateResponseQuality(text) {
    if (!text || text.length < 20) return false;
    if (text.includes('Show thinking')) return false;
    if (text.includes('Just a sec')) return false;
    if (text.includes('Loading...')) return false;
    
    // Check for meaningful content
    const wordCount = text.split(/\s+/).length;
    return wordCount >= 5;
  }

  sendResponseWithMetadata(text, conversationId, score, element) {
    try {
      if (chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({
          type: 'AI_RESPONSE_ENHANCED',
          source: 'gemini',
          conversationId,
          response: text,
          metadata: {
            score,
            extractionTimestamp: new Date().toISOString(),
            elementSelector: this.getElementSelector(element),
            monitoringDuration: Date.now() - this.monitoringStartTime,
            textLength: text.length,
            confidence: score
          }
        });
      }
    } catch (error) {
      console.warn('⚠️ Extension context error:', error.message);
    }
  }

  getElementId(element) {
    return element.id || 
           element.dataset.messageId || 
           element.getAttribute('data-testid') || 
           `${element.tagName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getElementSelector(element) {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  scanForNewResponses(conversationId) {
    // Comprehensive scan using specific AI response selectors only
    const selectors = [
      '[data-message-author-role="model"]',
      '[data-testid*="conversation-turn"][data-message-author-role="model"]',
      '[role="article"]:not([data-message-author-role="user"])',
      '.model-response',
      '.model-turn-content',
      '.response-content',
      // Removed broad selectors that capture non-AI content
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        this.analyzeResponseCandidate(element, conversationId);
      });
    });
  }

  cleanupMonitoring() {
    console.log('🧹 Injectable UI: Cleaning up monitoring systems');
    
    // Clear all polling intervals
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    if (this.canvasInterval) {
      clearInterval(this.canvasInterval);
      this.canvasInterval = null;
    }
    
    // Clear all timeouts
    if (this.monitoringTimeout) {
      clearTimeout(this.monitoringTimeout);
      this.monitoringTimeout = null;
    }
    
    if (this.canvasContentTimeout) {
      clearTimeout(this.canvasContentTimeout);
      this.canvasContentTimeout = null;
    }
    
    if (this.responseDebounceTimeout) {
      clearTimeout(this.responseDebounceTimeout);
      this.responseDebounceTimeout = null;
    }
    
    if (this.renderThrottle) {
      clearTimeout(this.renderThrottle);
      this.renderThrottle = null;
    }
    
    // Disconnect all observers
    if (this.responseObserver) {
      this.responseObserver.disconnect();
      this.responseObserver = null;
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
    
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
    
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    
    // Reset monitoring state
    this.isMonitoring = false;
    this.pendingCanvasContent = '';
    
    console.log('🧹 Monitoring cleanup completed');
  }

  // ADVANCED UTILITY METHODS FOR STATE-OF-THE-ART FUNCTIONALITY

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
      if (element) return element;
    }
    return null;
  }

  async findByPlaceholderText(targetAI) {
    const placeholders = {
      gemini: ['Enter a prompt', 'Ask Gemini', 'prompt'],
      chatgpt: ['Send a message', 'Message ChatGPT'],
      claude: ['Message Claude', 'Type a message'],
      perplexity: ['Ask anything', 'Search'],
      poe: ['Message', 'Talk to'],
      character: ['Type a message']
    };
    
    const texts = placeholders[targetAI] || placeholders.gemini;
    for (const text of texts) {
      const element = document.querySelector(`[placeholder*="${text}" i]`);
      if (element) return element;
    }
    return null;
  }

  async findByContentEditable() {
    const editables = document.querySelectorAll('[contenteditable="true"]');
    for (const element of editables) {
      if (this.validateInputElement(element)) {
        return element;
      }
    }
    return null;
  }

  async findByContextualClues(targetAI) {
    // Look for elements in input-like containers
    const containers = document.querySelectorAll('form, .input-container, .chat-input, .message-input');
    for (const container of containers) {
      const input = container.querySelector('textarea, input[type="text"], [contenteditable="true"]');
      if (input && this.validateInputElement(input)) {
        return input;
      }
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

  async clearInputElement(element) {
    try {
      // Multiple clearing strategies
      if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        element.value = '';
        element.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        element.textContent = '';
        element.innerHTML = '';
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      // Ensure focus
      element.focus();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return true;
    } catch (error) {
      console.warn('Failed to clear input element:', error);
      return false;
    }
  }

  async injectViaClipboard(element, text) {
    try {
      // Use clipboard API for reliable text injection
      await navigator.clipboard.writeText(text);
      element.focus();
      
      // Simulate Ctrl+V
      element.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'v',
        code: 'KeyV',
        keyCode: 86,
        ctrlKey: true,
        bubbles: true
      }));
      
      await new Promise(resolve => setTimeout(resolve, 200));
      return true;
    } catch (error) {
      console.warn('Clipboard injection failed:', error);
      return false;
    }
  }

  async injectViaEvents(element, text) {
    try {
      element.focus();
      
      // Simulate typing character by character
      for (let i = 0; i < text.length; i++) {
        const char = text.charAt(i);
        
        // Input event
        element.dispatchEvent(new InputEvent('beforeinput', {
          inputType: 'insertText',
          data: char,
          bubbles: true
        }));
        
        // Update content
        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
          element.value += char;
        } else {
          element.textContent += char;
        }
        
        // Post-input events
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Small delay to simulate natural typing
        if (i % 10 === 0) await new Promise(resolve => setTimeout(resolve, 5));
      }
      
      return true;
    } catch (error) {
      console.warn('Event injection failed:', error);
      return false;
    }
  }

  async injectViaDirectSet(element, text) {
    try {
      element.focus();
      
      if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        element.value = text;
      } else {
        element.textContent = text;
        element.innerHTML = text;
      }
      
      // Trigger events
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      
      return true;
    } catch (error) {
      console.warn('Direct set injection failed:', error);
      return false;
    }
  }

  async verifyTextInjection(element, expectedText) {
    try {
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for DOM update
      
      const actualText = element.value || element.textContent || element.innerText || '';
      const trimmedExpected = expectedText.trim();
      const trimmedActual = actualText.trim();
      
      const exactMatch = trimmedActual === trimmedExpected;
      const partialMatch = trimmedActual.includes(trimmedExpected);
      const lengthMatch = Math.abs(trimmedActual.length - trimmedExpected.length) < 10;
      
      return {
        success: exactMatch || (partialMatch && lengthMatch),
        method: exactMatch ? 'exact' : partialMatch ? 'partial' : 'failed',
        expected: trimmedExpected.length,
        actual: trimmedActual.length
      };
    } catch (error) {
      return { success: false, method: 'error', error: error.message };
    }
  }

  async findSendButtonAdvanced() {
    // Multi-strategy send button detection
    const strategies = [
      () => this.findAndClickSendButton(), // Original method
      () => this.findByButtonText(),
      () => this.findByAriaRole(),
      () => this.findByIconContent(),
      () => this.findByPosition()
    ];
    
    for (const strategy of strategies) {
      try {
        const button = await strategy();
        if (button && this.validateSendButton(button)) {
          return button;
        }
      } catch (error) {
        console.warn('Send button strategy failed:', error.message);
      }
    }
    
    return null;
  }

  async findByButtonText() {
    const texts = ['Send', 'Submit', 'Post', '送信', 'Enviar', 'Envoyer'];
    for (const text of texts) {
      const button = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.trim().toLowerCase().includes(text.toLowerCase())
      );
      if (button) return button;
    }
    return null;
  }

  async findByAriaRole() {
    const buttons = document.querySelectorAll('button[type="submit"], [role="button"]');
    for (const button of buttons) {
      const ariaLabel = button.getAttribute('aria-label') || '';
      if (ariaLabel.toLowerCase().includes('send')) {
        return button;
      }
    }
    return null;
  }

  async findByIconContent() {
    // Look for send icons (arrow, paper plane, etc.)
    const iconSelectors = [
      'button svg[viewBox*="24"]',
      'button .icon-send',
      'button .fa-paper-plane',
      'button [data-icon="send"]'
    ];
    
    for (const selector of iconSelectors) {
      const iconElement = document.querySelector(selector);
      if (iconElement) {
        const button = iconElement.closest('button');
        if (button) return button;
      }
    }
    return null;
  }

  async findByPosition() {
    // Find buttons positioned near input fields
    const inputs = document.querySelectorAll('textarea, [contenteditable="true"]');
    for (const input of inputs) {
      const inputRect = input.getBoundingClientRect();
      const buttons = document.querySelectorAll('button');
      
      for (const button of buttons) {
        const buttonRect = button.getBoundingClientRect();
        const isNearby = Math.abs(buttonRect.top - inputRect.top) < 100 &&
                        buttonRect.left > inputRect.right - 100;
        if (isNearby && this.validateSendButton(button)) {
          return button;
        }
      }
    }
    return null;
  }

  validateSendButton(button) {
    if (!button) return false;
    
    const rect = button.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0;
    const isEnabled = !button.disabled && !button.hasAttribute('disabled');
    const isClickable = window.getComputedStyle(button).pointerEvents !== 'none';
    
    return isVisible && isEnabled && isClickable;
  }

  async waitForButtonReady(button, timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (this.validateSendButton(button)) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return false;
  }

  // Duplicate clickButtonAdvanced method removed to prevent multiple click events

  async activateViaKeyboard(inputElement) {
    try {
      inputElement.focus();
      
      // Send only ONE Enter key event to prevent duplicates
      console.log('🎹 Sending single Enter key event');
      inputElement.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter', 
        keyCode: 13,
        bubbles: true
      }));
      
      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error) {
      console.error('Keyboard activation failed:', error);
      return false;
    }
  }

  getProcessingDelay(targetAI, textLength) {
    // Adaptive delay based on AI platform and content length
    const baseDelays = {
      gemini: 300,
      chatgpt: 400,
      claude: 350,
      perplexity: 250,
      poe: 300,
      character: 400
    };
    
    const baseDelay = baseDelays[targetAI] || 300;
    const lengthMultiplier = Math.min(textLength / 100, 3); // Max 3x for very long text
    
    return Math.round(baseDelay + (lengthMultiplier * 100));
  }

  updateUIErrorState(errorType, context) {
    try {
      const errorContainer = this.container.querySelector('#tnf-error-display');
      if (errorContainer) {
        errorContainer.textContent = `Error: ${errorType}`;
        errorContainer.style.color = '#dc3545';
        errorContainer.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
          errorContainer.style.display = 'none';
        }, 5000);
      }
    } catch (error) {
      console.warn('Failed to update UI error state:', error);
    }
  }

  startAdvancedResponseMonitoring_OLD_DISABLED(conversationId) {
    // DISABLED: Enhanced response monitoring with ML-like pattern recognition
    console.log('⚠️ OLD response monitoring method called - DISABLED');
    return; // Do nothing - this method is disabled
    
    // Clear any previous processed responses for new monitoring session
    this.processedResponses = new Set();
    this.responseFound = false;
    this.monitoringStartTime = Date.now();
    
    // Multi-layered monitoring approach
    this.setupMutationObserver();
    this.setupPerformanceObserver();
    this.setupIntersectionObserver();
    this.setupPollingBackup();
  }

  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.analyzeElementForResponse(node);
            }
          }
        } else if (mutation.type === 'characterData') {
          this.analyzeElementForResponse(mutation.target.parentElement);
        }
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    // Store for cleanup
    this.mutationObserver = observer;
  }

  setupPerformanceObserver() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.entryType === 'navigation' || entry.entryType === 'resource') {
            // AI responses often trigger additional resource loads
            this.handlePerformanceEntry(entry);
          }
        }
      });
      
      observer.observe({ entryTypes: ['navigation', 'resource'] });
      this.performanceObserver = observer;
    } catch (error) {
      console.warn('Performance observer not supported:', error);
    }
  }

  setupIntersectionObserver() {
    try {
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.analyzeElementForResponse(entry.target);
          }
        }
      });
      
      // Observe potential response containers
      const containers = document.querySelectorAll('[role="main"], .chat-container, .conversation');
      containers.forEach(container => observer.observe(container));
      
      this.intersectionObserver = observer;
    } catch (error) {
      console.warn('Intersection observer not supported:', error);
    }
  }

  setupPollingBackup() {
    let pollCount = 0;
    const maxPolls = 30; // Extended for thorough monitoring
    const pollInterval = setInterval(() => {
      pollCount++;
      if (pollCount > maxPolls || this.responseFound) {
        clearInterval(pollInterval);
        this.cleanupMonitoring();
        console.log('⏰ Advanced monitoring stopped -', this.responseFound ? 'response found' : 'timeout');
        return;
      }
      this.intelligentResponseScan();
    }, 1000); // More frequent polling
    
    this.pollInterval = pollInterval;
  }

  analyzeElementForResponse(element) {
    if (!element || this.responseFound) return;
    
    try {
      // Advanced ML-like pattern recognition for AI responses
      const score = this.calculateResponseScore(element);
      
      if (score > 0.7) { // High confidence threshold
        console.log(`🧠 High-confidence response detected (score: ${score.toFixed(2)})`);
        this.extractResponse(element);
      } else if (score > 0.5) {
        console.log(`🤔 Potential response detected (score: ${score.toFixed(2)})`);
        // Schedule delayed analysis for streaming content
        setTimeout(() => this.analyzeElementForResponse(element), 1000);
      }
    } catch (error) {
      console.warn('Response analysis failed:', error);
    }
  }

  calculateResponseScore(element) {
    let score = 0;
    
    try {
      const text = element.innerText || element.textContent || '';
      const rect = element.getBoundingClientRect();
      
      // Content-based scoring
      if (text.length > 50) score += 0.3;
      if (text.length > 200) score += 0.2;
      if (text.includes('.') || text.includes('!') || text.includes('?')) score += 0.1;
      
      // Structure-based scoring
      if (element.querySelector('p, div, span')) score += 0.2;
      if (element.matches('[data-message-author-role="model"]')) score += 0.8;
      if (element.matches('[role="article"]')) score += 0.3;
      
      // Position-based scoring
      if (rect.width > 200 && rect.height > 50) score += 0.2;
      if (rect.top > window.innerHeight * 0.3) score += 0.1; // Lower on page
      
      // Temporal scoring (newer elements more likely to be responses)
      const age = Date.now() - (this.monitoringStartTime || Date.now());
      if (age < 10000) score += 0.2; // Within 10 seconds
      
      // Anti-patterns (reduce score for UI elements)
      if (text.includes('Copy') || text.includes('Share')) score -= 0.3;
      if (text.includes('Show thinking')) score -= 0.5;
      if (element.tagName === 'BUTTON') score -= 0.4;
      if (element.closest('#tnf-injectable-ui')) score -= 1.0;
      
      return Math.max(0, Math.min(1, score));
    } catch (error) {
      return 0;
    }
  }

  handlePerformanceEntry(entry) {
    // Detect patterns in resource loading that indicate AI response generation
    try {
      const url = entry.name || '';
      const duration = entry.duration || 0;
      
      // Look for API calls or resource loads typical of AI responses
      if (url.includes('/api/') || url.includes('/chat/') || url.includes('/stream')) {
        console.log('🔍 Detected potential AI API call:', url);
        
        // Trigger additional response scanning after API calls
        setTimeout(() => this.intelligentResponseScan(), 500);
      }
      
      // Long-duration requests often indicate AI processing
      if (duration > 1000) {
        console.log('🕐 Detected long-duration request, scanning for responses');
        setTimeout(() => this.intelligentResponseScan(), 200);
      }
    } catch (error) {
      console.warn('Performance entry analysis failed:', error);
    }
  }

  intelligentResponseScan() {
    if (this.responseFound) return;
    
    try {
      // Comprehensive scan with AI-specific heuristics
      const candidates = this.findResponseCandidates();
      
      for (const candidate of candidates) {
        const score = this.calculateResponseScore(candidate);
        
        if (score > 0.6 && !candidate.dataset.tnfProcessed) {
          console.log(`🎯 Intelligent scan found response candidate (score: ${score.toFixed(2)})`);
          this.analyzeElementForResponse(candidate);
          
          if (this.responseFound) break;
        }
      }
    } catch (error) {
      console.warn('Intelligent response scan failed:', error);
    }
  }

  findResponseCandidates() {
    const candidates = [];
    
    try {
      // Platform-specific response container patterns
      const selectors = [
        '[data-message-author-role="model"]',
        '[role="article"]:not([data-message-author-role="user"])',
        '.model-turn-content',
        '.response-container',
        '.chat-message',
        '.conversation-turn',
        'div[jscontroller][data-message-author-role="model"]',
        'div[data-test-id*="conversation"][data-message-author-role="model"]',
        // Removed broad selectors that capture user input and non-chat content
      ];
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        candidates.push(...Array.from(elements));
      }
      
      // Also scan for elements with substantial text content, but only in likely chat areas
      const chatContainers = document.querySelectorAll('main, [role="main"], .chat-container, .conversation-container');
      for (const container of chatContainers) {
        const textElements = container.querySelectorAll('div, p, article');
        for (const element of textElements) {
          const text = element.innerText || '';
          // Only consider elements that pass our AI response filter
          if (text.length > 100 && 
              !element.closest('#tnf-injectable-ui') &&
              !element.closest('[data-message-author-role="user"]') &&
              this.isLikelyAIResponse(element, text)) {
            candidates.push(element);
          }
        }
      }
      
      // Remove duplicates and sort by likelihood
      const uniqueCandidates = [...new Set(candidates)];
      return uniqueCandidates.sort((a, b) => 
        this.calculateResponseScore(b) - this.calculateResponseScore(a)
      );
    } catch (error) {
      console.warn('Response candidate search failed:', error);
      return [];
    }
  }

  cleanupMonitoring() {
    try {
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
        this.mutationObserver = null;
      }
      
      if (this.performanceObserver) {
        this.performanceObserver.disconnect();
        this.performanceObserver = null;
      }
      
      if (this.intersectionObserver) {
        this.intersectionObserver.disconnect();
        this.intersectionObserver = null;
      }
      
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
      
      console.log('🧹 Monitoring cleanup completed');
    } catch (error) {
      console.warn('Monitoring cleanup failed:', error);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Enhanced TNF Integration Methods

  async registerWithTNF() {
    try {
      const registrationData = {
        agentId: `injectable-ui-${Date.now()}`,
        agentType: 'browser_injection',
        capabilities: [
          'direct_injection',
          'ai_communication',
          'response_monitoring',
          'cross_platform_bridge'
        ],
        currentAI: this.state.currentAI,
        url: window.location.href,
        features: this.state.features
      };

      const response = await chrome.runtime.sendMessage({
        type: 'EXECUTE_TNF_COMMAND',
        command: 'register_with_tnf',
        data: registrationData
      });

      if (response?.success) {
        this.setState({
          tnf: {
            ...this.state.tnf,
            agentRegistered: true,
            agentId: response.agentId,
            registrationTime: new Date()
          }
        });
        
        await this.enableTNFFeatures();
        console.log('✅ Injectable UI registered with TNF system');
      } else {
        console.error('❌ Failed to register with TNF:', response?.error);
      }
    } catch (error) {
      console.error('Error registering injectable UI with TNF:', error);
    }
  }

  async enableTNFFeatures() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'ENABLE_TNF_FEATURES',
        features: ['agentSwarm', 'workflowAutomation', 'realTimeMonitoring', 'advancedAnalytics']
      });

      if (response?.success) {
        this.setState({
          features: {
            agentSwarmEnabled: true,
            workflowAutomation: true,
            realTimeMonitoring: true,
            advancedAnalytics: true
          }
        });
        console.log('✅ TNF features enabled for injectable UI');
      }
    } catch (error) {
      console.error('Error enabling TNF features:', error);
    }
  }

  async connectToTNFOrchestrator() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CONNECT_TNF_ORCHESTRATOR',
        config: {
          agentId: this.state.tnf.agentId,
          capabilities: ['direct_injection', 'ai_communication'],
          currentAI: this.state.currentAI,
          url: window.location.href
        }
      });

      if (response?.success) {
        this.setState({
          tnf: {
            ...this.state.tnf,
            agentOrchestrator: true
          }
        });
        console.log('🎯 Injectable UI connected to TNF Agent Orchestrator');
      }
    } catch (error) {
      console.error('Error connecting to TNF orchestrator:', error);
    }
  }

  async synchronizeWithTNFCore() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SYNC_WITH_TNF_CORE',
        syncData: {
          conversationHistory: this.state.conversationHistory,
          currentAI: this.state.currentAI,
          features: this.state.features,
          performance: this.state.performance,
          analytics: this.state.analytics,
          url: window.location.href
        }
      });

      if (response?.success) {
        console.log('🔄 Injectable UI synchronized with TNF Core');
        this.updatePerformanceMetrics();
      }
    } catch (error) {
      console.error('Error synchronizing with TNF Core:', error);
    }
  }

  async updatePerformanceMetrics() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_PERFORMANCE_METRICS'
      });

      if (response?.success) {
        this.setState({
          performance: {
            ...this.state.performance,
            responseTime: response.metrics.responseTime || 0,
            throughput: response.metrics.throughput || 0,
            errorRate: response.metrics.errorRate || 0,
            uptime: response.metrics.uptime || 0
          }
        });
      }
    } catch (error) {
      console.error('Error updating performance metrics:', error);
    }
  }

  async toggleFeature(featureName) {
    const currentState = this.state.features[`${featureName}Enabled`] || this.state.features[featureName];
    const newState = !currentState;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'TOGGLE_TNF_FEATURE',
        feature: featureName,
        enabled: newState
      });

      if (response?.success) {
        this.setState({
          features: {
            ...this.state.features,
            [`${featureName}Enabled`]: newState,
            [featureName]: newState
          }
        });
        console.log(`🔄 Feature ${featureName} ${newState ? 'enabled' : 'disabled'}`);
        this.render();
      }
    } catch (error) {
      console.error(`Error toggling feature ${featureName}:`, error);
    }
  }

  renderTNFAdvancedStatus() {
    const { tnf, performance, features } = this.state;
    
    return `
      <div class="tnf-advanced-status">
        <div class="status-grid">
          <div class="status-card">
            <h4>Core Services</h4>
            <div class="status-row">
              <span>Task Engine:</span>
              <span class="status-indicator ${tnf.taskEngineStatus ? 'online' : 'offline'}">
                ${tnf.taskEngineStatus ? 'Online' : 'Offline'}
              </span>
            </div>
            <div class="status-row">
              <span>Workflow Engine:</span>
              <span class="status-indicator ${tnf.workflowEngineStatus ? 'online' : 'offline'}">
                ${tnf.workflowEngineStatus ? 'Online' : 'Offline'}
              </span>
            </div>
            <div class="status-row">
              <span>Agent Orchestrator:</span>
              <span class="status-indicator ${tnf.agentOrchestrator ? 'online' : 'offline'}">
                ${tnf.agentOrchestrator ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div class="status-card">
            <h4>Performance</h4>
            <div class="metric-row">
              <span>Response Time:</span>
              <span class="metric-value">${performance.responseTime || 0}ms</span>
            </div>
            <div class="metric-row">
              <span>Success Rate:</span>
              <span class="metric-value">${performance.successRate || 0}%</span>
            </div>
            <div class="metric-row">
              <span>Operations:</span>
              <span class="metric-value">${performance.totalOperations || 0}</span>
            </div>
          </div>

          <div class="status-card">
            <h4>Features</h4>
            <div class="feature-row">
              <span>Agent Swarm:</span>
              <div class="feature-toggle ${features.agentSwarmEnabled ? 'active' : ''}" 
                   onclick="window.tnfInjectableUI.toggleFeature('agentSwarm')">
                <div class="toggle-slider"></div>
              </div>
            </div>
            <div class="feature-row">
              <span>Workflow Auto:</span>
              <div class="feature-toggle ${features.workflowAutomation ? 'active' : ''}" 
                   onclick="window.tnfInjectableUI.toggleFeature('workflowAutomation')">
                <div class="toggle-slider"></div>
              </div>
            </div>
            <div class="feature-row">
              <span>Real-time Monitor:</span>
              <div class="feature-toggle ${features.realTimeMonitoring ? 'active' : ''}" 
                   onclick="window.tnfInjectableUI.toggleFeature('realTimeMonitoring')">
                <div class="toggle-slider"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="action-buttons">
          <button onclick="window.tnfInjectableUI.registerWithTNF()" class="tnf-btn primary">
            Register with TNF
          </button>
          <button onclick="window.tnfInjectableUI.synchronizeWithTNFCore()" class="tnf-btn secondary">
            Sync with Core
          </button>
          <button onclick="window.tnfInjectableUI.connectToTNFOrchestrator()" class="tnf-btn secondary">
            Connect Orchestrator
          </button>
        </div>
      </div>
    `;
  }

  initializeTNFIntegration() {
    // Auto-register with TNF on initialization
    setTimeout(() => {
      this.registerWithTNF();
      this.connectToTNFOrchestrator();
    }, 2000);

    // Set up periodic synchronization
    this.syncInterval = setInterval(() => {
      this.synchronizeWithTNFCore();
      this.updatePerformanceMetrics();
    }, 30000); // Every 30 seconds
  }

  // Cleanup method to prevent memory leaks
  destroy() {
    // Clear all intervals
    if (this.performanceInterval) {
      clearInterval(this.performanceInterval);
      this.performanceInterval = null;
    }
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    // Clear all timeouts
    if (this.renderThrottle) {
      clearTimeout(this.renderThrottle);
      this.renderThrottle = null;
    }
    
    if (this.canvasContentTimeout) {
      clearTimeout(this.canvasContentTimeout);
      this.canvasContentTimeout = null;
    }
    
    if (this.responseDebounceTimeout) {
      clearTimeout(this.responseDebounceTimeout);
      this.responseDebounceTimeout = null;
    }
    
    if (this.monitoringTimeout) {
      clearTimeout(this.monitoringTimeout);
      this.monitoringTimeout = null;
    }
    
    // Disconnect all observers
    this.cleanupMonitoring();
    
    // Remove UI elements
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    
    if (this.toggleButton) {
      this.toggleButton.remove();
      this.toggleButton = null;
    }
  }
}

// Initialization with enhanced debugging
console.log('🚀 TNF Injectable UI - Starting initialization...');
console.log('🔍 Current URL:', window.location.href);
console.log('🔍 Document ready state:', document.readyState);

// Add visible alert for debugging
if (!window.tnfInjectableUI) {
  console.log('✅ Creating new TNF Injectable UI instance...');
  window.tnfInjectableUI = new TNFInjectableUI();
  
  // Add a temporary alert to confirm it's working
  setTimeout(() => {
    console.log('🎯 TNF UI should be visible now');
    console.log('🔍 TNF Toggle Button exists:', !!document.getElementById('tnf-toggle-button'));
    console.log('🔍 TNF UI Container exists:', !!document.getElementById('tnf-injectable-ui'));
  }, 1000);
} else {
  console.log('⚠️ TNF Injectable UI already exists');
}

// Add cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.tnfInjectableUI) {
    console.log('🧹 Cleaning up TNF Injectable UI...');
    window.tnfInjectableUI.destroy();
  }
});

// Also cleanup on visibility change (page becomes hidden)
document.addEventListener('visibilitychange', () => {
  if (document.hidden && window.tnfInjectableUI) {
    console.log('🧹 Page hidden, cleaning up TNF Injectable UI...');
    window.tnfInjectableUI.destroy();
  }
});

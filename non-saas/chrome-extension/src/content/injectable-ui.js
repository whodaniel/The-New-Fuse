/**
 * TNF Injectable UI - Fixed Event Handler Version
 * This fixes the button click issues identified in testing
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
        ports: {}
      }
    };
    
    this.performanceMode = 'balanced';
    this.renderThrottle = null;
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
    console.log('🔨 TNF Injectable UI - Fixed Version Initializing...');
    this.createToggleButton();
    this.createUI();
    // FIXED: Setup event listeners AFTER UI is created and add debug logging
    setTimeout(() => {
      this.setupEventListeners();
      this.setupMessageListener();
      this.setupKeyboardShortcuts();
      this.loadInitialState();
    }, 100);
  }

  setState(newState) {
    Object.assign(this.state, newState);
    this.throttledRender();
  }

  throttledRender() {
    if (this.renderThrottle) {
      clearTimeout(this.renderThrottle);
    }
    
    this.renderThrottle = setTimeout(() => {
      this.render();
      this.renderThrottle = null;
    }, 16);
  }

  createToggleButton() {
    console.log('🔨 Creating TNF toggle button...');
    const existing = document.getElementById('tnf-toggle-button');
    if (existing) {
      existing.remove();
    }

    const toggleButton = document.createElement('button');
    toggleButton.id = 'tnf-toggle-button';
    toggleButton.innerHTML = 'TNF';
    toggleButton.title = 'Toggle TNF AI Bridge (Ctrl+Shift+T)';
    
    toggleButton.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      width: 60px !important;
      height: 60px !important;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      border: 3px solid #00ff00 !important;
      border-radius: 50% !important;
      color: white !important;
      font-size: 16px !important;
      font-weight: bold !important;
      cursor: pointer !important;
      z-index: 999999 !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5) !important;
    `;
    
    // FIXED: Direct event listener attachment
    toggleButton.addEventListener('click', (e) => {
      console.log('🎯 TNF toggle button clicked!');
      e.preventDefault();
      e.stopPropagation();
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
    container.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      width: 350px;
      height: 500px;
      background: white;
      border: 2px solid #667eea;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      z-index: 999998;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: none;
      overflow: hidden;
    `;
    
    container.innerHTML = `
      <div class="tnf-ui-header" style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: move;
      ">
        <div class="tnf-ui-title" style="display: flex; align-items: center; gap: 8px;">
          <div class="tnf-ui-logo" style="font-weight: bold; font-size: 14px;">TNF</div>
          <span style="font-size: 14px;">AI Bridge</span>
          <div class="tnf-ai-badge" style="
            background: rgba(255,255,255,0.2);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
          ">${this.state.currentAI.toUpperCase()}</div>
        </div>
        <div class="tnf-ui-controls" style="display: flex; gap: 4px;">
          <button id="tnf-performance-btn" title="Performance Settings" style="
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          ">⚡</button>
          <button id="tnf-minimize-btn" title="Minimize" style="
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          ">−</button>
          <button id="tnf-close-btn" title="Close" style="
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          ">×</button>
        </div>
      </div>
      
      <div class="tnf-ui-content" style="padding: 12px; height: calc(100% - 60px); overflow-y: auto;">
        <div class="tnf-status-bar" style="
          padding: 8px;
          background: #f8f9fa;
          border-radius: 6px;
          margin-bottom: 12px;
          font-size: 12px;
        ">
          <div class="tnf-status-item" style="display: flex; align-items: center; gap: 6px;">
            <span class="tnf-indicator" style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: ${this.state.tnf.relayConnected ? '#28a745' : '#dc3545'};
            "></span>
            <span class="tnf-status-text">${this.state.tnf.relayConnected ? 'TNF Connected' : 'TNF Offline'}</span>
          </div>
        </div>
        
        <div class="tabs" style="
          display: flex;
          border-bottom: 1px solid #e9ecef;
          margin-bottom: 12px;
        ">
          <button class="tab-button active" data-tab="chat" style="
            flex: 1;
            padding: 8px 4px;
            border: none;
            background: none;
            border-bottom: 2px solid #667eea;
            color: #667eea;
            font-weight: bold;
            cursor: pointer;
            font-size: 12px;
          ">💬 Chat</button>
          <button class="tab-button" data-tab="tnf" style="
            flex: 1;
            padding: 8px 4px;
            border: none;
            background: none;
            border-bottom: 2px solid transparent;
            color: #6c757d;
            cursor: pointer;
            font-size: 12px;
          ">🔗 TNF</button>
          <button class="tab-button" data-tab="settings" style="
            flex: 1;
            padding: 8px 4px;
            border: none;
            background: none;
            border-bottom: 2px solid transparent;
            color: #6c757d;
            cursor: pointer;
            font-size: 12px;
          ">⚙️ Settings</button>
        </div>
        
        <div id="chat-tab" class="tab-content active" style="display: block;">
          <div class="conversation-section" style="margin-bottom: 16px;">
            <div class="section-title" style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">Conversation History</div>
            <div class="chat-log" id="tnf-chat-log" style="
              min-height: 100px;
              max-height: 150px;
              overflow-y: auto;
              border: 1px solid #e9ecef;
              border-radius: 6px;
              padding: 8px;
              background: #f8f9fa;
              font-size: 12px;
            ">
              <div class="no-messages" style="color: #6c757d; text-align: center; padding: 20px;">No conversation yet.</div>
            </div>

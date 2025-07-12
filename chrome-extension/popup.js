/**
 * TNF AI Bridge - Popup Script (Refactored)
 * Centralized state management and rendering for a more robust UI.
 */
class PopupInterface {
  constructor() {
    this.state = {
      currentTab: null,
      relayConnected: false,
      conversationHistory: [],
      serverStatus: {},
      portStatuses: {},
      activeTab: 'chat',
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
      },
      ui: {
        isLoading: true,
        errorMessage: null
      }
    };

    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.setupMessageListener();

    await this.loadInitialState();
    this.render();

    // Start periodic updates
    this.setupStatusUpdates();
  }

  setState(newState) {
    Object.assign(this.state, newState);
    this.render();
  }

  async loadInitialState() {
    this.setState({ ui: { ...this.state.ui, isLoading: true } });
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.state.currentTab = tab;

      const historyResponse = await chrome.runtime.sendMessage({ type: 'GET_CONVERSATION_HISTORY' });
      this.state.conversationHistory = historyResponse?.history || [];

      const serverStatusResponse = await chrome.runtime.sendMessage({ type: 'GET_SERVER_STATUS' });
      this.state.serverStatus = serverStatusResponse?.status || {};

      const portStatusResponse = await chrome.runtime.sendMessage({ type: 'GET_PORT_STATUS' });
      this.state.portStatuses = portStatusResponse?.status || {};
      
      const masterAgentResponse = await chrome.storage.local.get('masterAgent');
      this.state.masterAgent = masterAgentResponse?.masterAgent || null;

      await this.updateStatus(); // Initial status check

    } catch (error) {
      console.error('Error loading initial state:', error);
      this.setState({ ui: { ...this.state.ui, errorMessage: 'Could not load initial state.' } });
    } finally {
      this.setState({ ui: { ...this.state.ui, isLoading: false } });
    }
  }

  setupEventListeners() {
    document.body.addEventListener('click', (e) => {
      const targetId = e.target.id;
      const handler = this.eventHandlers[targetId];
      if (handler) {
        handler.call(this);
      } else if (e.target.dataset.tab) {
        this.switchTab(e.target.dataset.tab);
      }
    });

    document.getElementById('message-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) this.sendMessage();
    });
    
    document.getElementById('new-port-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.addPort();
    });
  }
  
  get eventHandlers() {
    return {
      'send-btn': this.sendMessage,
      'clear-btn': () => { document.getElementById('message-input').value = ''; },
      'clear-history-btn': this.clearConversationHistory,
      'refresh-btn': this.refreshConversationHistory,
      'register-master-btn': this.registerMasterAgent,
      'unregister-master-btn': this.unregisterMasterAgent,
      'assign-sub-agents-btn': this.assignSubAgents,
      'broadcast-to-group-btn': this.broadcastToGroup,
      'start-server-btn': this.startServer,
      'stop-server-btn': this.stopServer,
      'update-config-btn': this.updateConfig,
      'restart-vite-btn': this.restartVite,
      'add-port-btn': this.addPort,
      'refresh-ports-btn': this.loadPortStatus,
      'tnf-register-btn': this.registerWithTNF,
      'tnf-reload-config-btn': this.reloadTNFConfig,
      'tnf-start-comprehensive-btn': this.startTNFComprehensive,
      'tnf-health-check-btn': this.performTNFHealthCheck,
    };
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      const messageHandlers = {
        'CONVERSATION_UPDATED': (msg) => this.setState({ conversationHistory: msg.history || [] }),
        'SERVER_STATUS_UPDATE': (msg) => this.setState({ serverStatus: msg.payload || {} }),
        'PORT_STATUS_UPDATE': (msg) => this.setState({ portStatuses: msg.payload || {} }),
        'TNF_STATUS_UPDATE': (msg) => this.setState({ tnf: msg.payload || this.state.tnf }),
      };
      
      const handler = messageHandlers[message.type];
      if (handler) {
        handler(message);
      }
    });
  }

  render() {
    // Master render function to update the UI based on state
    this.renderConversationHistory();
    this.renderServerStatus();
    this.renderPortStatus();
    this.renderAgentStatus();
    this.renderTNFIntegrationStatus();
    this.renderTabs();
    this.renderStatus();
  }
  
  // Add all render sub-functions here (renderConversationHistory, renderServerStatus, etc.)
  // These functions will read from `this.state` and update the DOM.
  // Example:
  renderConversationHistory() {
    const chatLog = document.getElementById('chat-log');
    if (!chatLog) return;

    if (!this.state.conversationHistory || this.state.conversationHistory.length === 0) {
      chatLog.innerHTML = '<div class="no-messages">No conversation yet.</div>';
      return;
    }

    chatLog.innerHTML = this.state.conversationHistory.map(msg => {
        let senderType = 'system';
        let senderLabel = msg.sender || 'Unknown';
        if (msg.source === 'human-popup' || msg.source === 'injectable-ui') {
            senderType = 'user';
            senderLabel = 'You';
        } else if (msg.source === 'gemini' || msg.type === 'AI_RESPONSE') {
            senderType = 'ai';
            senderLabel = 'Gemini';
        }
        const time = new Date(msg.timestamp).toLocaleTimeString();
        return `<div class="message ${senderType}">
                    <div class="message-header">
                        <span class="message-sender ${senderType}">${senderLabel}</span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-content">${msg.content || msg.response || ''}</div>
                </div>`;
    }).join('');
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  renderServerStatus() {
    const indicator = document.getElementById('server-indicator');
    const statusText = document.getElementById('server-status-text');
    const portText = document.getElementById('server-port');
    const startBtn = document.getElementById('start-server-btn');
    const stopBtn = document.getElementById('stop-server-btn');

    if (!indicator || !statusText || !portText || !startBtn || !stopBtn) return;

    const { isRunning, message, port, error } = this.state.serverStatus;

    if (isRunning) {
      indicator.className = 'indicator connected';
      statusText.textContent = message || 'Running';
      portText.textContent = `Port: ${port}`;
      startBtn.disabled = true;
      stopBtn.disabled = false;
    } else {
      indicator.className = 'indicator disconnected';
      statusText.textContent = message || 'Not running';
      portText.textContent = '';
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }

    if (error) {
      indicator.className = 'indicator disconnected';
      statusText.textContent = `Error: ${error}`;
    }
  }

  renderPortStatus() {
    const portGrid = document.getElementById('port-grid');
    if (!portGrid) return;

    const { portStatuses } = this.state;
    if (Object.keys(portStatuses).length === 0) {
      portGrid.innerHTML = '<div style="text-align: center; color: #6c757d; font-size: 12px;">No ports monitored</div>';
      return;
    }

    portGrid.innerHTML = Object.entries(portStatuses).map(([port, isOnline]) => {
      return `<div class="port-item">
                <span>Port ${port}</span>
                <div class="port-status ${isOnline ? 'online' : ''}" title="${isOnline ? 'Online' : 'Offline'}"></div>
              </div>`;
    }).join('');
  }

  renderAgentStatus() {
    const masterGroupEl = document.getElementById('current-master-group');
    if (!masterGroupEl) return;

    const { masterAgent, agentGroups } = this.state;
    if (masterAgent) {
      const groupInfo = agentGroups[masterAgent.group];
      masterGroupEl.textContent = `${groupInfo.name} (${masterAgent.group.toUpperCase()})`;
      masterGroupEl.style.color = groupInfo.color;
    } else {
      masterGroupEl.textContent = 'Not Set';
      masterGroupEl.style.color = '#6c757d';
    }
  }

  renderTNFIntegrationStatus() {
    // This is a simplified version. You can expand this based on the original logic.
    const relayStatusEl = document.getElementById('relay-status');
    if (!relayStatusEl) return;

    const { tnf } = this.state;
    const indicator = relayStatusEl.querySelector('.indicator');
    if (tnf.relayConnected) {
      indicator.className = 'indicator connected';
      relayStatusEl.innerHTML = '<span class="indicator connected"></span>TNF Connected';
    } else {
      indicator.className = 'indicator disconnected';
      relayStatusEl.innerHTML = '<span class="indicator disconnected"></span>TNF Disconnected';
    }
  }

  renderTabs() {
    document.querySelectorAll('.tab-button').forEach(button => {
      button.classList.toggle('active', button.dataset.tab === this.state.activeTab);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${this.state.activeTab}-tab`);
    });
  }

  renderStatus() {
    this.updateRelayStatus();
    this.updateCurrentAI();
    this.updatePageReady();
  }

  async sendMessage() {
    const messageInput = document.getElementById('message-input');
    const targetAISelect = document.getElementById('target-ai');
    const message = messageInput.value.trim();
    const targetAI = targetAISelect.value;

    if (!message || !targetAI) {
      alert('Please enter a message and select an AI.');
      return;
    }

    try {
      // Add to local conversation history immediately
      this.state.conversationHistory.push({
        id: `popup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        source: 'human-popup',
        content: message,
        type: 'USER_MESSAGE'
      });
      this.renderConversationHistory();
      messageInput.value = '';

      // Use POPUP_INJECT for direct injection (same as injectable UI)
      const conversationId = `popup-${Date.now()}`;
      await chrome.runtime.sendMessage({
        type: 'POPUP_INJECT',
        targetAI: targetAI,
        content: message,
        conversationId: conversationId
      });
      
      console.log('📤 Popup: Message sent for injection');
    } catch (error) {
      console.error('❌ Popup: Unified injection failed:', error);
    }
  }
  
  async switchTab(tabName) {
    this.setState({ activeTab: tabName });
  }

  async clearConversationHistory() {
    try {
      await chrome.runtime.sendMessage({ type: 'CLEAR_CONVERSATION_HISTORY' });
      this.setState({ conversationHistory: [] });
    } catch (error) {
      console.error('Error clearing conversation history:', error);
    }
  }

  async refreshConversationHistory() {
    try {
      await chrome.runtime.sendMessage({ type: 'REQUEST_HISTORY_FROM_RELAY' });
      const response = await chrome.runtime.sendMessage({ type: 'GET_CONVERSATION_HISTORY' });
      this.setState({ conversationHistory: response?.history || [] });
    } catch (error) {
      console.error('Error refreshing conversation history:', error);
    }
  }

  async registerMasterAgent() {
    const nameInput = document.getElementById('master-agent-name');
    const groupSelect = document.getElementById('agent-group');
    const name = nameInput?.value?.trim();
    const group = groupSelect?.value;

    if (!name || !group) {
      alert('Please enter agent name and select a group.');
      return;
    }

    const masterAgent = { name, group, timestamp: new Date().toISOString() };
    await chrome.storage.local.set({ masterAgent });
    this.setState({ masterAgent });
  }

  async unregisterMasterAgent() {
    await chrome.storage.local.remove('masterAgent');
    this.setState({ masterAgent: null });
  }

  async assignSubAgents() {
    // Implementation for assigning sub-agents
    console.log('Assigning sub-agents...');
  }

  async broadcastToGroup() {
    // Implementation for broadcasting to group
    console.log('Broadcasting to group...');
  }

  async startServer() {
    const portInput = document.getElementById('server-port-input');
    const port = parseInt(portInput?.value) || 3001;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'START_WEBSOCKET_SERVER',
        port: port,
        clearPort: true,
        autoRestart: true
      });

      if (response?.success) {
        this.setState({ 
          serverStatus: { 
            isRunning: true, 
            port: port, 
            message: 'Server started successfully' 
          } 
        });
      } else {
        this.setState({ 
          serverStatus: { 
            isRunning: false, 
            message: `Failed to start: ${response?.error || 'Unknown error'}` 
          } 
        });
      }
    } catch (error) {
      console.error('Error starting server:', error);
      this.setState({ 
        serverStatus: { 
          isRunning: false, 
          message: `Error: ${error.message}` 
        } 
      });
    }
  }

  async stopServer() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'STOP_WEBSOCKET_SERVER',
        forceKill: true
      });

      if (response?.success) {
        this.setState({ 
          serverStatus: { 
            isRunning: false, 
            port: 0, 
            message: 'Server stopped successfully' 
          } 
        });
      }
    } catch (error) {
      console.error('Error stopping server:', error);
    }
  }

  async updateConfig() {
    const relayUrlInput = document.getElementById('relay-url-input');
    const relayUrl = relayUrlInput?.value?.trim();

    if (relayUrl) {
      try {
        await chrome.runtime.sendMessage({
          type: 'UPDATE_RELAY_URL',
          url: relayUrl
        });
        console.log('Relay URL updated:', relayUrl);
      } catch (error) {
        console.error('Error updating relay URL:', error);
      }
    }
  }

  async restartVite() {
    try {
      await chrome.runtime.sendMessage({
        type: 'RESTART_VITE',
        port: 5173
      });
    } catch (error) {
      console.error('Error restarting Vite:', error);
    }
  }

  async addPort() {
    const portInput = document.getElementById('new-port-input');
    const port = parseInt(portInput?.value);

    if (port && port > 0 && port <= 65535) {
      try {
        await chrome.runtime.sendMessage({
          type: 'PORT_ADD',
          port: port
        });
        portInput.value = '';
        await this.loadPortStatus();
      } catch (error) {
        console.error('Error adding port:', error);
      }
    }
  }

  async loadPortStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_PORT_STATUS' });
      this.setState({ portStatuses: response?.status || {} });
    } catch (error) {
      console.error('Error loading port status:', error);
    }
  }

  async registerWithTNF() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'EXECUTE_TNF_COMMAND',
        command: 'register_with_tnf'
      });

      if (response?.success) {
        await this.updateTNFStatus();
        console.log('Registered with TNF system');
      } else {
        console.error('Failed to register with TNF:', response?.error);
      }
    } catch (error) {
      console.error('Error registering with TNF:', error);
    }
  }

  async reloadTNFConfig() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'RELOAD_TNF_CONFIG'
      });

      if (response?.success) {
        await this.updateTNFStatus();
        console.log('TNF configuration reloaded');
      }
    } catch (error) {
      console.error('Error reloading TNF config:', error);
    }
  }

  async startTNFComprehensive() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'EXECUTE_TNF_COMMAND',
        command: 'start_tnf_comprehensive'
      });

      if (response?.success) {
        console.log('TNF comprehensive relay started');
      }
    } catch (error) {
      console.error('Error starting TNF comprehensive relay:', error);
    }
  }

  async performTNFHealthCheck() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'TNF_HEALTH_CHECK'
      });

      if (response) {
        this.updateTNFPortStatuses(response);
        console.log('TNF health check completed');
      }
    } catch (error) {
      console.error('Error performing TNF health check:', error);
    }
  }

  async updateStatus() {
    try {
      const connectionResponse = await chrome.runtime.sendMessage({ type: 'CONNECTION_STATUS' });
      this.setState({ relayConnected: connectionResponse?.connected || false });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  async updateTNFStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'TNF_HEALTH_CHECK' });
      if (response) {
        this.setState({
          tnf: {
            ...this.state.tnf,
            relayConnected: response.relay_connected || false,
            agentRegistered: response.agent_registered || false,
            mcpConfigLoaded: response.mcp_config_loaded || false,
            databaseConnected: response.database_connected || false
          }
        });
        this.updateTNFPortStatuses(response);
      }
    } catch (error) {
      console.error('Error updating TNF status:', error);
    }
  }

  updateTNFPortStatuses(response) {
    const portElements = {
      8765: document.getElementById('tnf-port-8765'),
      3001: document.getElementById('tnf-port-3001'),
      3000: document.getElementById('tnf-port-3000'),
      3002: document.getElementById('tnf-port-3002')
    };

    Object.entries(portElements).forEach(([port, element]) => {
      if (element) {
        const isOnline = response[`port_${port}`] || false;
        const indicator = element.querySelector('.indicator');
        if (indicator) {
          indicator.className = `indicator ${isOnline ? 'connected' : 'disconnected'}`;
        }
        element.querySelector('.status-value').textContent = isOnline ? 'Online' : 'Offline';
      }
    });
  }

  updateRelayStatus() {
    const relayStatusEl = document.getElementById('relay-status');
    if (!relayStatusEl) return;

    const indicator = relayStatusEl.querySelector('.indicator');
    if (this.state.relayConnected) {
      indicator.className = 'indicator connected';
      relayStatusEl.textContent = 'Connected';
    } else {
      indicator.className = 'indicator disconnected';
      relayStatusEl.textContent = 'Disconnected';
    }
  }

  updateCurrentAI() {
    const currentAIEl = document.getElementById('current-ai');
    if (!currentAIEl) return;

    const tab = this.state.currentTab;
    if (!tab) return;

    let aiType = 'Unknown';
    let connected = false;

    if (tab.url?.includes('gemini.google.com')) {
      aiType = 'Gemini';
      connected = true;
    } else if (tab.url?.includes('chatgpt.com')) {
      aiType = 'ChatGPT';
      connected = true;
    } else if (tab.url?.includes('claude.ai')) {
      aiType = 'Claude';
      connected = true;
    } else if (tab.url?.includes('perplexity.ai')) {
      aiType = 'Perplexity';
      connected = true;
    } else if (tab.url?.includes('poe.com')) {
      aiType = 'Poe';
      connected = true;
    } else if (tab.url?.includes('character.ai')) {
      aiType = 'Character.AI';
      connected = true;
    }

    const indicator = currentAIEl.querySelector('.indicator');
    indicator.className = `indicator ${connected ? 'connected' : 'unknown'}`;
    currentAIEl.innerHTML = `<span class="indicator ${connected ? 'connected' : 'unknown'}"></span>${aiType}`;
  }

  updatePageReady() {
    const pageReadyEl = document.getElementById('page-ready');
    if (!pageReadyEl) return;

    const tab = this.state.currentTab;
    const isAIPage = tab?.url && (
      tab.url.includes('gemini.google.com') ||
      tab.url.includes('chatgpt.com') ||
      tab.url.includes('claude.ai') ||
      tab.url.includes('perplexity.ai') ||
      tab.url.includes('poe.com') ||
      tab.url.includes('character.ai')
    );

    const indicator = pageReadyEl.querySelector('.indicator');
    if (isAIPage) {
      indicator.className = 'indicator connected';
      pageReadyEl.innerHTML = '<span class="indicator connected"></span>Ready';
    } else {
      indicator.className = 'indicator unknown';
      pageReadyEl.innerHTML = '<span class="indicator unknown"></span>Not AI page';
    }
  }

  setupStatusUpdates() {
    // Update status every 5 seconds
    setInterval(() => {
      this.updateStatus();
      this.updateTNFStatus();
      this.loadPortStatus();
    }, 5000);

    // Initial updates
    setTimeout(() => {
      this.updateStatus();
      this.updateTNFStatus();
      this.loadPortStatus();
    }, 1000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PopupInterface();
});

/**
 * The New Fuse Chrome Extension - Popup Controller
 *
 * Integrates with:
 * - TNF Backend Relay (/relay endpoints)
 * - TNF WebSocket Gateway (/relay namespace)
 * - AI Platform Detection and Bridge
 *
 * @version 1.0.0
 */

class TNFPopup {
  constructor() {
    // Connection state
    this.isConnected = false;
    this.ws = null;
    this.relayUrl = 'http://localhost:3000';
    this.wsPort = 3000;
    this.agentId = `chrome-bridge-${Date.now()}`;

    // Stats
    this.stats = {
      agents: 0,
      messages: 0,
      tabs: 0,
      startTime: Date.now(),
    };

    // Settings
    this.settings = {
      autoConnect: true,
      autoReconnect: true,
      showBadge: true,
      notifications: true,
      logLevel: 'info',
    };

    // Agents list
    this.agents = [];

    // Message history
    this.messageHistory = [];
    this.activityLog = [];

    // Initialize
    this.init();
  }

  async init() {
    console.log('🚀 TNF Popup initializing...');

    // Load settings from storage
    await this.loadSettings();

    // Set up event listeners
    this.setupEventListeners();

    // Set up tab navigation
    this.setupTabs();

    // Update stats display
    this.updateStatsDisplay();

    // Start uptime timer
    this.startUptimeTimer();

    // Count tabs
    this.countTabs();

    // Auto-connect if enabled
    if (this.settings.autoConnect) {
      this.connect();
    }

    this.log('info', 'Popup initialized');
  }

  // ============================================
  // Settings Management
  // ============================================

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['tnfSettings'], (result) => {
        if (result.tnfSettings) {
          this.settings = { ...this.settings, ...result.tnfSettings };
          this.relayUrl = this.settings.relayUrl || this.relayUrl;
          this.wsPort = this.settings.wsPort || this.wsPort;
        }

        // Apply to UI
        this.applySettingsToUI();
        resolve();
      });
    });
  }

  async saveSettings() {
    // Read from UI
    this.settings.relayUrl = document.getElementById('setting-relay-url')?.value || this.relayUrl;
    this.settings.wsPort =
      parseInt(document.getElementById('setting-ws-port')?.value) || this.wsPort;
    this.settings.autoConnect = document.getElementById('setting-auto-connect')?.checked ?? true;
    this.settings.autoReconnect =
      document.getElementById('setting-auto-reconnect')?.checked ?? true;
    this.settings.showBadge = document.getElementById('setting-show-badge')?.checked ?? true;
    this.settings.notifications = document.getElementById('setting-notifications')?.checked ?? true;
    this.settings.logLevel = document.getElementById('setting-log-level')?.value || 'info';

    this.relayUrl = this.settings.relayUrl;
    this.wsPort = this.settings.wsPort;

    return new Promise((resolve) => {
      chrome.storage.sync.set({ tnfSettings: this.settings }, () => {
        this.log('info', 'Settings saved');
        this.showToast('Settings saved successfully!', 'success');
        resolve();
      });
    });
  }

  applySettingsToUI() {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) {
        if (el.type === 'checkbox') el.checked = val;
        else el.value = val;
      }
    };

    setVal('setting-relay-url', this.relayUrl);
    setVal('setting-ws-port', this.wsPort);
    setVal('setting-auto-connect', this.settings.autoConnect);
    setVal('setting-auto-reconnect', this.settings.autoReconnect);
    setVal('setting-show-badge', this.settings.showBadge);
    setVal('setting-notifications', this.settings.notifications);
    setVal('setting-log-level', this.settings.logLevel);
  }

  // ============================================
  // Connection Management
  // ============================================

  async connect() {
    this.log('info', 'Connecting to TNF Relay...');
    this.updateConnectionStatus('connecting', 'Connecting...');

    try {
      // First, check if the relay server is available via HTTP
      const healthResponse = await fetch(`${this.relayUrl}/relay/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!healthResponse.ok) {
        throw new Error(`Relay health check failed: ${healthResponse.status}`);
      }

      const health = await healthResponse.json();
      this.log('info', `Relay health: ${health.status}`);

      // Connect via WebSocket
      await this.connectWebSocket();
    } catch (error) {
      this.log('error', `Connection failed: ${error.message}`);
      this.updateConnectionStatus('disconnected', 'Connection Failed');

      if (this.settings.autoReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  async connectWebSocket() {
    const wsUrl = `ws://localhost:${this.wsPort}/relay`;
    this.log('info', `Connecting WebSocket to ${wsUrl}`);

    return new Promise((resolve, reject) => {
      // Using Socket.IO client if available, otherwise raw WebSocket
      if (typeof io !== 'undefined') {
        this.ws = io(wsUrl, {
          transports: ['websocket'],
          reconnection: this.settings.autoReconnect,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        this.ws.on('connect', () => {
          this.onWebSocketOpen();
          resolve();
        });

        this.ws.on('disconnect', () => this.onWebSocketClose());
        this.ws.on('error', (err) => this.onWebSocketError(err));
        this.ws.on('message:received', (msg) => this.onMessageReceived(msg));
        this.ws.on('agent:registered', (agent) => this.onAgentRegistered(agent));
        this.ws.on('agent:unregistered', (data) => this.onAgentUnregistered(data));
      } else {
        // Fallback to raw WebSocket
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.onWebSocketOpen();
          resolve();
        };

        this.ws.onclose = () => this.onWebSocketClose();
        this.ws.onerror = (err) => {
          this.onWebSocketError(err);
          reject(err);
        };
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
          } catch (e) {
            this.log('warn', 'Failed to parse WebSocket message');
          }
        };
      }
    });
  }

  onWebSocketOpen() {
    this.isConnected = true;
    this.updateConnectionStatus('connected', 'Connected to TNF Relay');
    this.log('info', '✅ WebSocket connected');

    // Update badge
    this.updateBadge('connected');

    // Fetch initial data
    this.fetchAgents();
    this.fetchStatus();

    // Enable/disable buttons
    document.getElementById('btn-connect').disabled = true;
    document.getElementById('btn-disconnect').disabled = false;
  }

  onWebSocketClose() {
    this.isConnected = false;
    this.updateConnectionStatus('disconnected', 'Disconnected');
    this.log('info', '❌ WebSocket disconnected');

    this.updateBadge('disconnected');

    document.getElementById('btn-connect').disabled = false;
    document.getElementById('btn-disconnect').disabled = true;

    if (this.settings.autoReconnect) {
      this.scheduleReconnect();
    }
  }

  onWebSocketError(error) {
    this.log('error', `WebSocket error: ${error.message || 'Unknown error'}`);
  }

  disconnect() {
    if (this.ws) {
      if (this.ws.disconnect) {
        this.ws.disconnect();
      } else if (this.ws.close) {
        this.ws.close();
      }
      this.ws = null;
    }
    this.isConnected = false;
    this.updateConnectionStatus('disconnected', 'Disconnected');
  }

  scheduleReconnect() {
    this.log('info', 'Scheduling reconnect in 5s...');
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect();
      }
    }, 5000);
  }

  updateConnectionStatus(status, text) {
    const indicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const connDot = document.getElementById('connection-status-dot');
    const connText = document.getElementById('connection-status-text');

    // Update classes
    ['connected', 'disconnected', 'connecting'].forEach((cls) => {
      indicator?.classList.remove(cls);
      connDot?.classList.remove(cls);
    });

    indicator?.classList.add(status);
    connDot?.classList.add(status);

    if (statusText) statusText.textContent = text;
    if (connText) connText.textContent = text;

    // Update relay URL display
    const urlDisplay = document.getElementById('relay-url');
    if (urlDisplay) {
      urlDisplay.textContent = `${this.relayUrl}/relay`;
    }
  }

  updateBadge(status) {
    if (!this.settings.showBadge) return;

    const colors = {
      connected: '#10b981',
      disconnected: '#64748b',
      connecting: '#f59e0b',
    };

    chrome.action?.setBadgeBackgroundColor({ color: colors[status] || colors.disconnected });
    chrome.action?.setBadgeText({ text: status === 'connected' ? '✓' : '' });
  }

  // ============================================
  // API Interactions
  // ============================================

  async fetchAgents() {
    try {
      const response = await fetch(`${this.relayUrl}/relay/agents`);
      const data = await response.json();

      this.agents = data.agents || [];
      this.stats.agents = this.agents.length;

      this.renderAgentList();
      this.updateStatsDisplay();
      this.updateAgentDropdown();
    } catch (error) {
      this.log('error', `Failed to fetch agents: ${error.message}`);
    }
  }

  async fetchStatus() {
    try {
      const response = await fetch(`${this.relayUrl}/relay/status`);
      const data = await response.json();

      this.stats.messages = data.messageCount || 0;
      this.updateStatsDisplay();
    } catch (error) {
      this.log('error', `Failed to fetch status: ${error.message}`);
    }
  }

  async registerAsAgent() {
    const name = document.getElementById('agent-name')?.value || 'TNF Chrome Bridge';
    const capabilitiesStr = document.getElementById('agent-capabilities')?.value || '';
    const capabilities = capabilitiesStr
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c);

    try {
      const response = await fetch(`${this.relayUrl}/relay/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: this.agentId,
          name,
          type: 'browser-bridge',
          capabilities,
        }),
      });

      const data = await response.json();

      if (data.success) {
        this.log('info', `✅ Registered as agent: ${this.agentId}`);
        this.showToast('Registered as agent successfully!', 'success');
        this.fetchAgents();
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (error) {
      this.log('error', `Agent registration failed: ${error.message}`);
      this.showToast(`Registration failed: ${error.message}`, 'error');
    }
  }

  async sendMessage() {
    const targetAgent = document.getElementById('target-agent')?.value || '';
    const messageType = document.getElementById('message-type')?.value || 'chat';
    const payloadStr = document.getElementById('message-payload')?.value || '{}';

    let payload;
    try {
      payload = JSON.parse(payloadStr);
    } catch (e) {
      payload = { content: payloadStr };
    }

    try {
      const endpoint = targetAgent
        ? `${this.relayUrl}/relay/messages`
        : `${this.relayUrl}/relay/broadcast`;

      const body = targetAgent
        ? {
            type: messageType,
            source: this.agentId,
            target: targetAgent,
            payload,
          }
        : {
            source: this.agentId,
            type: messageType,
            payload,
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        this.stats.messages++;
        this.updateStatsDisplay();
        this.addToMessageLog('outgoing', messageType, payload);
        this.log('info', `Message sent: ${data.messageId || data.messageCount + ' recipients'}`);
        this.showToast('Message sent!', 'success');

        // Clear payload field
        document.getElementById('message-payload').value = '';
      }
    } catch (error) {
      this.log('error', `Failed to send message: ${error.message}`);
      this.showToast(`Failed to send: ${error.message}`, 'error');
    }
  }

  // ============================================
  // WebSocket Message Handling
  // ============================================

  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'message:received':
      case 'message:broadcast':
        this.onMessageReceived(data);
        break;
      case 'agent:registered':
        this.onAgentRegistered(data);
        break;
      case 'agent:unregistered':
      case 'agent:disconnected':
        this.onAgentUnregistered(data);
        break;
      default:
        this.log('debug', `Unknown message type: ${data.type}`);
    }
  }

  onMessageReceived(msg) {
    this.stats.messages++;
    this.updateStatsDisplay();
    this.addToMessageLog('incoming', msg.type, msg.payload || msg);
    this.addActivity(`📥 Message from ${msg.source || 'unknown'}: ${msg.type}`);
  }

  onAgentRegistered(agent) {
    this.addActivity(`🤖 Agent registered: ${agent.name || agent.id}`);
    this.fetchAgents();
  }

  onAgentUnregistered(data) {
    this.addActivity(`👋 Agent disconnected: ${data.agentId}`);
    this.fetchAgents();
  }

  // ============================================
  // AI Bridge Functions
  // ============================================

  async detectAIPlatform() {
    this.log('info', 'Detecting AI platform...');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.url) {
        this.showToast('No active tab found', 'error');
        return;
      }

      const url = new URL(tab.url);
      let platform = null;

      const platforms = {
        'gemini.google.com': { name: 'Google Gemini', icon: '🤖' },
        'chat.openai.com': { name: 'ChatGPT', icon: '💬' },
        'chatgpt.com': { name: 'ChatGPT', icon: '💬' },
        'claude.ai': { name: 'Claude', icon: '🧠' },
        'perplexity.ai': { name: 'Perplexity', icon: '🔮' },
        'bard.google.com': { name: 'Google Bard', icon: '✨' },
      };

      for (const [domain, info] of Object.entries(platforms)) {
        if (url.hostname.includes(domain.split('.')[0])) {
          platform = { domain, ...info };
          break;
        }
      }

      const statusDot = document.getElementById('ai-status-dot');
      const platformName = document.getElementById('ai-platform-name');

      if (platform) {
        statusDot?.classList.remove('disconnected');
        statusDot?.classList.add('connected');
        if (platformName) platformName.textContent = `${platform.icon} ${platform.name} detected`;
        this.showToast(`Detected: ${platform.name}`, 'success');
        this.addActivity(`🎯 Detected AI platform: ${platform.name}`);
      } else {
        statusDot?.classList.remove('connected');
        statusDot?.classList.add('disconnected');
        if (platformName) platformName.textContent = 'No AI platform detected';
        this.showToast('No supported AI platform on this page', 'warning');
      }
    } catch (error) {
      this.log('error', `Detection failed: ${error.message}`);
      this.showToast('Detection failed', 'error');
    }
  }

  async injectUI() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) {
        this.showToast('No active tab', 'error');
        return;
      }

      // Send message to content script to inject floating panel
      chrome.tabs.sendMessage(tab.id, { type: 'INJECT_FLOATING_PANEL' }, (response) => {
        if (chrome.runtime.lastError) {
          this.log('error', `Injection failed: ${chrome.runtime.lastError.message}`);
          this.showToast('Failed to inject UI. Is the content script loaded?', 'error');
        } else if (response?.success) {
          this.showToast('Floating panel injected!', 'success');
          this.addActivity('💉 Injected floating panel');
        }
      });
    } catch (error) {
      this.log('error', `Inject failed: ${error.message}`);
    }
  }

  async sendTestMessage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) return;

      chrome.tabs.sendMessage(
        tab.id,
        {
          type: 'INJECT_TEXT',
          payload: {
            text: 'Hello from The New Fuse! This is a test message from the Chrome extension.',
            submit: false,
          },
        },
        (response) => {
          if (response?.success) {
            this.showToast('Test message sent!', 'success');
          } else {
            this.showToast('Failed to send test message', 'error');
          }
        }
      );
    } catch (error) {
      this.log('error', `Test message failed: ${error.message}`);
    }
  }

  async captureResponse() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) return;

      chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_RESPONSE' }, (response) => {
        if (response?.success && response.content) {
          this.addToMessageLog('incoming', 'ai-response', { content: response.content });
          this.showToast('Response captured!', 'success');
          this.addActivity('📸 Captured AI response');
        } else {
          this.showToast('No response to capture', 'warning');
        }
      });
    } catch (error) {
      this.log('error', `Capture failed: ${error.message}`);
    }
  }

  // ============================================
  // UI Rendering
  // ============================================

  renderAgentList() {
    const container = document.getElementById('agent-list');
    const countBadge = document.getElementById('agent-count');

    if (countBadge) countBadge.textContent = this.agents.length;

    if (!container) return;

    if (this.agents.length === 0) {
      container.innerHTML = `
        <div class="text-center text-muted" style="padding: 20px;">
          <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
          <p>No agents connected</p>
          <p style="font-size: 0.7rem;">Connect to the relay to discover agents</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.agents
      .map(
        (agent) => `
      <div class="agent-item">
        <div class="agent-avatar">${this.getAgentIcon(agent.type)}</div>
        <div class="agent-info">
          <div class="agent-name">${this.escapeHtml(agent.name || agent.id)}</div>
          <div class="agent-type">${this.escapeHtml(agent.type || 'unknown')}</div>
        </div>
        <span class="badge badge-${agent.status === 'online' ? 'success' : 'warning'}">${agent.status || 'unknown'}</span>
      </div>
    `
      )
      .join('');
  }

  updateAgentDropdown() {
    const select = document.getElementById('target-agent');
    if (!select) return;

    select.innerHTML =
      '<option value="">Broadcast to all</option>' +
      this.agents
        .map((a) => `<option value="${a.id}">${this.escapeHtml(a.name || a.id)}</option>`)
        .join('');
  }

  addToMessageLog(direction, type, payload) {
    const log = document.getElementById('message-log');
    if (!log) return;

    const time = new Date().toLocaleTimeString();
    const content =
      typeof payload === 'object' ? JSON.stringify(payload).substring(0, 100) : String(payload);

    const item = document.createElement('div');
    item.className = 'message-item';
    item.innerHTML = `
      <span class="message-time">[${time}]</span>
      <span class="message-type ${direction}">${direction === 'incoming' ? '📥' : '📤'} ${type}</span>
      <div class="text-muted" style="font-size: 0.65rem; margin-top: 2px;">${this.escapeHtml(content)}...</div>
    `;

    // Remove placeholder
    if (log.querySelector('.text-muted')) {
      log.innerHTML = '';
    }

    log.insertBefore(item, log.firstChild);

    // Keep only last 50 messages
    while (log.children.length > 50) {
      log.removeChild(log.lastChild);
    }
  }

  addActivity(message) {
    const log = document.getElementById('activity-log');
    if (!log) return;

    const time = new Date().toLocaleTimeString();

    const item = document.createElement('div');
    item.className = 'message-item';
    item.innerHTML = `
      <span class="message-time">[${time}]</span>
      <span>${this.escapeHtml(message)}</span>
    `;

    // Remove placeholder
    const placeholder = log.querySelector('.text-muted');
    if (placeholder && placeholder.textContent.includes('Waiting')) {
      log.innerHTML = '';
    }

    log.insertBefore(item, log.firstChild);

    // Keep only last 100 activities
    while (log.children.length > 100) {
      log.removeChild(log.lastChild);
    }

    this.activityLog.unshift({ time, message });
  }

  updateStatsDisplay() {
    document.getElementById('stat-agents').textContent = this.stats.agents;
    document.getElementById('stat-messages').textContent = this.stats.messages;
    document.getElementById('stat-tabs').textContent = this.stats.tabs;
  }

  startUptimeTimer() {
    setInterval(() => {
      const seconds = Math.floor((Date.now() - this.stats.startTime) / 1000);
      let display;

      if (seconds < 60) {
        display = `${seconds}s`;
      } else if (seconds < 3600) {
        display = `${Math.floor(seconds / 60)}m`;
      } else {
        display = `${Math.floor(seconds / 3600)}h`;
      }

      const el = document.getElementById('stat-uptime');
      if (el) el.textContent = display;
    }, 1000);
  }

  async countTabs() {
    const tabs = await chrome.tabs.query({});
    this.stats.tabs = tabs.length;
    this.updateStatsDisplay();
  }

  // ============================================
  // Tab Navigation
  // ============================================

  setupTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const targetId = tab.dataset.tab;

        // Update active tab
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        // Update active panel
        panels.forEach((p) => {
          p.classList.remove('active');
          if (p.id === targetId) {
            p.classList.add('active');
          }
        });
      });
    });
  }

  // ============================================
  // Event Listeners
  // ============================================

  setupEventListeners() {
    // Connection buttons
    document.getElementById('btn-connect')?.addEventListener('click', () => this.connect());
    document.getElementById('btn-disconnect')?.addEventListener('click', () => this.disconnect());

    // Agent registration
    document
      .getElementById('btn-register-agent')
      ?.addEventListener('click', () => this.registerAsAgent());

    // Messaging
    document
      .getElementById('btn-send-message')
      ?.addEventListener('click', () => this.sendMessage());

    // AI Bridge
    document
      .getElementById('btn-detect-ai')
      ?.addEventListener('click', () => this.detectAIPlatform());
    document.getElementById('btn-inject-ui')?.addEventListener('click', () => this.injectUI());
    document
      .getElementById('btn-send-test')
      ?.addEventListener('click', () => this.sendTestMessage());
    document
      .getElementById('btn-capture-response')
      ?.addEventListener('click', () => this.captureResponse());
    document
      .getElementById('btn-start-monitoring')
      ?.addEventListener('click', () => this.startMonitoring());

    // Settings
    document
      .getElementById('btn-save-settings')
      ?.addEventListener('click', () => this.saveSettings());
    document
      .getElementById('btn-reset-settings')
      ?.addEventListener('click', () => this.resetSettings());
    document
      .getElementById('btn-export-settings')
      ?.addEventListener('click', () => this.exportSettings());
    document
      .getElementById('btn-import-settings')
      ?.addEventListener('click', () => this.importSettings());

    // Activity log
    document
      .getElementById('btn-clear-log')
      ?.addEventListener('click', () => this.clearActivityLog());
    document
      .getElementById('btn-export-log')
      ?.addEventListener('click', () => this.exportActivityLog());
  }

  startMonitoring() {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'START_MONITORING' }, (response) => {
          if (response?.success) {
            this.showToast('Monitoring started!', 'success');
            this.addActivity('👁️ Started response monitoring');
          }
        });
      }
    });
  }

  clearActivityLog() {
    const log = document.getElementById('activity-log');
    if (log) {
      log.innerHTML = `
        <div class="message-item">
          <span class="message-time">[--:--:--]</span>
          <span class="text-muted">Waiting for activity...</span>
        </div>
      `;
    }
    this.activityLog = [];
    this.showToast('Activity log cleared', 'success');
  }

  exportActivityLog() {
    const content = this.activityLog.map((a) => `[${a.time}] ${a.message}`).join('\n');
    this.downloadFile('tnf-activity-log.txt', content);
  }

  resetSettings() {
    if (confirm('Reset all settings to defaults?')) {
      chrome.storage.sync.remove('tnfSettings', () => {
        this.settings = {
          autoConnect: true,
          autoReconnect: true,
          showBadge: true,
          notifications: true,
          logLevel: 'info',
        };
        this.relayUrl = 'http://localhost:3000';
        this.wsPort = 3000;
        this.applySettingsToUI();
        this.showToast('Settings reset to defaults', 'success');
      });
    }
  }

  exportSettings() {
    const content = JSON.stringify(this.settings, null, 2);
    this.downloadFile('tnf-settings.json', content);
  }

  importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const text = await file.text();
        try {
          const imported = JSON.parse(text);
          this.settings = { ...this.settings, ...imported };
          this.applySettingsToUI();
          await this.saveSettings();
          this.showToast('Settings imported!', 'success');
        } catch (err) {
          this.showToast('Invalid settings file', 'error');
        }
      }
    };
    input.click();
  }

  // ============================================
  // Utility Functions
  // ============================================

  log(level, message) {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    const currentLevel = levels[this.settings.logLevel] ?? 2;

    if (levels[level] <= currentLevel) {
      const prefix = { error: '❌', warn: '⚠️', info: 'ℹ️', debug: '🔍' }[level];
      console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
        `${prefix} [TNF] ${message}`
      );
    }
  }

  showToast(message, type = 'info') {
    // Simple toast implementation - could be enhanced with a proper toast library
    const toast = document.createElement('div');
    toast.className = `badge badge-${type}`;
    toast.style.cssText = `
      position: fixed;
      bottom: 60px;
      left: 50%;
      transform: translateX(-50%);
      padding: 8px 16px;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'fadeIn 0.2s ease reverse';
      setTimeout(() => toast.remove(), 200);
    }, 2500);
  }

  downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  getAgentIcon(type) {
    const icons = {
      'browser-bridge': '🌐',
      vscode: '💻',
      cli: '⌨️',
      api: '🔌',
      ai: '🤖',
      default: '📦',
    };
    return icons[type] || icons.default;
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.tnfPopup = new TNFPopup();
});

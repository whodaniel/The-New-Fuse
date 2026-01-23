/******/ (() => {
  // webpackBootstrap
  /******/ 'use strict';
  /**
   * Fuse Connect v6 - Popup Logic
   */

  const NATIVE_HOST_NAME = 'com.thenewfuse.native_host';

  class FuseConnectPopup {
    constructor() {
      this.state = {
        connectionStatus: 'disconnected',
        agents: [],
        platform: null,
        messages: [],
        services: {
          relay: { running: false, port: 3000 },
          backend: { running: false, port: 3000 },
          frontend: { running: false, port: 3002 },
        },
        nativeHostAvailable: false,
        settings: {
          relayUrl: 'ws://localhost:3000/ws',
          autoReconnect: true,
          showPanel: true,
          debugMode: false,
          allowedSites: [],
        },
      };

      this.init();
    }

    async init() {
      // Setup tab navigation
      this.setupTabs();

      // Setup event handlers
      this.setupEventHandlers();

      // Load initial state from background
      await this.loadState();

      // Listen for updates
      this.setupMessageListener();

      // Load settings
      await this.loadSettings();

      // Check native host
      await this.checkNativeHost();

      // Check relay health and show helper if needed
      await this.checkRelayAndUpdateHelper();

      // Update UI
      this.updateUI();
    }

    async checkRelayAndUpdateHelper() {
      const helper = document.getElementById('quick-start-helper');
      if (!helper) return;

      try {
        const response = await fetch('http://localhost:3000/health', {
          method: 'GET',
          signal: AbortSignal.timeout(2000),
        });
        const data = await response.json();
        if (data.status === 'ok') {
          helper.style.display = 'none';
        } else {
          helper.style.display = 'block';
        }
      } catch (e) {
        // Relay not running, show helper
        helper.style.display = 'block';
      }
    }

    setupTabs() {
      const tabs = document.querySelectorAll('.tab');

      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          const tabId = tab.dataset.tab;

          // Update active tab
          tabs.forEach((t) => t.classList.remove('active'));
          tab.classList.add('active');

          // Show tab content
          document.querySelectorAll('.tab-content').forEach((content) => {
            content.classList.remove('active');
          });
          document.getElementById(`tab-${tabId}`)?.classList.add('active');

          // Refresh services when switching to services tab
          if (tabId === 'services') {
            this.refreshServiceStatus();
          }
        });
      });
    }

    setupEventHandlers() {
      // Connect button
      document.getElementById('connect-btn')?.addEventListener('click', () => {
        if (this.state.connectionStatus === 'connected') {
          this.disconnect();
        } else {
          this.connect();
        }
      });

      // Refresh agents
      document.getElementById('refresh-agents')?.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'REQUEST_SYNC' });
      });

      // Open Panel on current page
      document.getElementById('open-panel-btn')?.addEventListener('click', () => {
        this.openPanelOnPage();
      });

      // Refresh services
      document.getElementById('refresh-services')?.addEventListener('click', () => {
        this.refreshServiceStatus();
      });

      // Service control buttons
      document.querySelectorAll('[data-action]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const action = e.target.dataset.action;
          const service = e.target.dataset.service;
          if (action && service) {
            this.controlService(action, service);
          }
        });
      });

      // Start all services
      document.getElementById('start-all-services')?.addEventListener('click', () => {
        this.controlService('start', 'all');
      });

      // Stop all services
      document.getElementById('stop-all-services')?.addEventListener('click', () => {
        this.controlService('stop', 'all');
      });

      // Save settings
      document.getElementById('save-settings')?.addEventListener('click', () => {
        this.saveSettings();
      });

      // Settings inputs
      document.getElementById('relay-url')?.addEventListener('change', (e) => {
        this.state.settings.relayUrl = e.target.value;
      });

      document.getElementById('auto-reconnect')?.addEventListener('change', (e) => {
        this.state.settings.autoReconnect = e.target.checked;
      });

      document.getElementById('show-panel')?.addEventListener('change', (e) => {
        this.state.settings.showPanel = e.target.checked;
      });

      document.getElementById('debug-mode')?.addEventListener('change', (e) => {
        this.state.settings.debugMode = e.target.checked;
      });

      // Managed Sites
      document.getElementById('add-site-btn')?.addEventListener('click', () => {
        this.addManagedSite();
      });

      document.getElementById('new-site-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.addManagedSite();
      });

      document.getElementById('sites-list')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-site-btn')) {
          const site = e.target.dataset.site;
          this.removeManagedSite(site);
        }
      });

      // Export logs
      document.getElementById('export-logs')?.addEventListener('click', () => {
        this.exportLogs();
      });

      // Quick start relay button
      document.getElementById('quick-start-relay')?.addEventListener('click', () => {
        this.quickStartRelay();
      });
    }

    async quickStartRelay() {
      const btn = document.getElementById('quick-start-relay');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ Starting...';
      }

      if (this.state.nativeHostAvailable) {
        // Use native host to open Terminal and run relay command
        try {
          const response = await this.sendNativeMessage({
            action: 'open-terminal',
            command: 'pnpm relay:start',
          });

          if (response.success) {
            this.showToast('Terminal opened! Wait for relay to start...');
            // Wait and try to connect
            setTimeout(() => {
              this.connect();
              this.checkRelayAndUpdateHelper();
            }, 5000);
          } else {
            // Fallback to background start
            const startResponse = await this.sendNativeMessage({
              action: 'start',
              service: 'relay',
            });
            if (startResponse.result?.success) {
              this.showToast('Relay started! Connecting...');
              setTimeout(() => {
                this.connect();
                this.checkRelayAndUpdateHelper();
              }, 3000);
            } else {
              this.showToast(startResponse.result?.error || 'Failed to start relay');
            }
          }
        } catch (e) {
          this.showToast('Error: ' + e.message);
        }
      } else {
        // No native host - show installation helper
        this.showInstallHelper();
      }

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '🚀 Start Relay Server';
      }
    }

    showInstallHelper() {
      // Create a modal/overlay with installation instructions
      const extensionId = chrome.runtime.id;
      const installPath = `${chrome.runtime.getURL('native-host/install-macos.sh')}`;

      const modal = document.createElement('div');
      modal.id = 'install-helper-modal';
      modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <h3 style="margin:0 0 12px 0; color: var(--neon-cyan);">⚡ Setup Required</h3>
          <p style="margin:0 0 16px 0; font-size: 13px; color: var(--text-secondary);">
            To start services from the browser, install the native helper:
          </p>
          <div class="install-steps">
            <div class="install-step">
              <span class="step-num">1</span>
              <span>Open Terminal</span>
            </div>
            <div class="install-step">
              <span class="step-num">2</span>
              <span>Run this command:</span>
            </div>
            <code class="install-command" id="install-command">
              cd ~/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/chrome-extension && ./install.sh
            </code>
            <button class="btn-secondary" style="width:100%; margin-top:8px;" id="copy-install-cmd">
              📋 Copy Command
            </button>
          </div>
          <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border-subtle);">
            <p style="margin:0 0 8px 0; font-size: 12px; color: var(--text-muted);">
              Or start relay manually in terminal:
            </p>
            <code class="install-command" id="manual-command">
              cd ~/Desktop/A1-Inter-LLM-Com/The-New-Fuse && pnpm relay:start
            </code>
            <button class="btn-primary" style="width:100%; margin-top:8px;" id="copy-manual-cmd">
              📋 Copy & Close
            </button>
          </div>
          <button class="modal-close" id="close-modal">✕</button>
        </div>
      </div>
    `;

      // Add modal styles
      const styles = `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
      }
      .modal-content {
        background: var(--bg-card);
        border: 1px solid var(--border-accent);
        border-radius: var(--radius-lg);
        padding: 20px;
        max-width: 340px;
        position: relative;
        box-shadow: 0 0 40px rgba(0, 217, 255, 0.2);
      }
      .modal-close {
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 16px;
      }
      .modal-close:hover {
        color: var(--neon-red);
      }
      .install-steps {
        background: var(--bg-elevated);
        border-radius: var(--radius-md);
        padding: 12px;
      }
      .install-step {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
        font-size: 13px;
        color: var(--text-primary);
      }
      .step-num {
        width: 22px;
        height: 22px;
        background: var(--neon-cyan);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 600;
        color: #000;
      }
      .install-command {
        display: block;
        background: var(--bg-deep);
        padding: 10px;
        border-radius: var(--radius-sm);
        font-family: 'Monaco', 'Consolas', monospace;
        font-size: 10px;
        color: var(--neon-green);
        word-break: break-all;
        user-select: all;
        cursor: text;
        margin-top: 8px;
      }
    `;

      const styleEl = document.createElement('style');
      styleEl.textContent = styles;
      document.head.appendChild(styleEl);
      document.body.appendChild(modal);

      // Event handlers
      document.getElementById('copy-install-cmd')?.addEventListener('click', () => {
        navigator.clipboard.writeText(
          'cd ~/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/chrome-extension && ./install.sh'
        );
        this.showToast('Command copied!');
      });

      document.getElementById('copy-manual-cmd')?.addEventListener('click', () => {
        navigator.clipboard.writeText(
          'cd ~/Desktop/A1-Inter-LLM-Com/The-New-Fuse && pnpm relay:start'
        );
        this.showToast('Command copied!');
        modal.remove();
        styleEl.remove();
      });

      document.getElementById('close-modal')?.addEventListener('click', () => {
        modal.remove();
        styleEl.remove();
      });
    }

    async openPanelOnPage() {
      // Get the active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        try {
          // Did we inject?
          const isScriptInjected = await this.checkContentScript(tabs[0].id);

          if (!isScriptInjected) {
            this.showToast('Injecting content script...');
            await chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              files: ['content/index.js'],
            });
            // Brief wait for initialization
            await new Promise((r) => setTimeout(r, 500));
          }

          // Send message to content script to show panel
          chrome.tabs.sendMessage(tabs[0].id, { type: 'SHOW_PANEL' }, (response) => {
            if (chrome.runtime.lastError) {
              const err = chrome.runtime.lastError;
              const errMsg = err.message || JSON.stringify(err);
              this.showToast(`Cannot open panel: ${errMsg}`);
              console.error('Fuse Panel Open Error:', errMsg, err);
            } else if (response?.success) {
              this.showToast('Panel opened! (Ctrl+Shift+F to toggle)');
              // Close popup after opening panel
              window.close();
            }
          });
        } catch (e) {
          this.showToast(`Cannot open panel: ${e.message}`);
          console.error('Fuse Panel Exception:', e);
        }
      } else {
        this.showToast('No active tab found');
      }
    }

    async checkContentScript(tabId) {
      try {
        const response = await chrome.tabs.sendMessage(tabId, { type: 'GET_PANEL_STATUS' });
        return !!response;
      } catch (e) {
        return false;
      }
    }

    async checkNativeHost() {
      try {
        const response = await this.sendNativeMessage({ action: 'ping' });
        this.state.nativeHostAvailable = response.action === 'pong';
      } catch (e) {
        this.state.nativeHostAvailable = false;
      }
      this.updateNativeHostIndicator();
    }

    async sendNativeMessage(message) {
      return new Promise((resolve, reject) => {
        try {
          chrome.runtime.sendNativeMessage(NATIVE_HOST_NAME, message, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        } catch (e) {
          reject(e);
        }
      });
    }

    async refreshServiceStatus() {
      if (!this.state.nativeHostAvailable) {
        // Try to check again
        await this.checkNativeHost();
        if (!this.state.nativeHostAvailable) {
          return;
        }
      }

      try {
        const response = await this.sendNativeMessage({ action: 'status' });
        if (response.services) {
          this.state.services = response.services;
          this.updateServiceUI();
        }
      } catch (e) {
        console.error('Failed to get service status:', e);
      }
    }

    async controlService(action, service) {
      // Handle AI Studio specific actions
      if (service === 'ai-studio') {
        if (action === 'auth') {
          this.handleAIStudioAuth();
          return;
        } else if (action === 'process') {
          this.handleAIStudioProcess();
          return;
        } else if (action === 'history') {
          this.handleAIStudioHistory();
          return;
        } else if (action === 'export') {
          this.handleAIStudioExport();
          return;
        }
      }

      if (!this.state.nativeHostAvailable) {
        this.showToast('Native host not available. Run the install script.');
        return;
      }

      this.showToast(`${action === 'start' ? 'Starting' : 'Stopping'} ${service}...`);

      try {
        const response = await this.sendNativeMessage({ action, service });

        if (response.result?.success || response.results) {
          this.showToast(response.result?.message || `${service} ${action} completed`);

          // Refresh status after action
          setTimeout(() => this.refreshServiceStatus(), 2000);
        } else {
          this.showToast(
            `Failed: ${response.result?.error || response.message || 'Unknown error'}`
          );
        }
      } catch (e) {
        this.showToast(`Error: ${e.message}`);
      }
    }

    async handleAIStudioAuth() {
      this.showToast('Opening Google OAuth...');
      try {
        chrome.runtime.sendMessage({ type: 'AI_STUDIO_AUTH' }, (response) => {
          if (response?.success) {
            this.showToast('Authenticated successfully!');
            this.updateAIStudioStatus('connected');
          } else {
            this.showToast('Authentication failed');
          }
        });
      } catch (e) {
        this.showToast(`Auth error: ${e.message}`);
      }
    }

    async handleAIStudioProcess() {
      this.showToast('Opening AI Studio panel...');
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            {
              type: 'SHOW_PANEL',
              activeTab: 'services',
            },
            (response) => {
              if (response?.success) {
                this.showToast('Panel opened! Check the Services tab.');
                window.close();
              }
            }
          );
        }
      } catch (e) {
        this.showToast(`Error: ${e.message}`);
      }
    }

    async handleAIStudioHistory() {
      this.showToast('Generating watch history prompt...');
      try {
        chrome.runtime.sendMessage({ type: 'AI_VIDEO_GENERATE_HISTORY_PROMPT' }, (response) => {
          if (response?.prompt) {
            // Show prompt in a way user can copy it
            const textArea = document.createElement('textarea');
            textArea.value = response.prompt;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Prompt copied to clipboard! Paste it into Gemini.');

            // Open Gemini
            window.open('https://gemini.google.com/', '_blank');
          } else {
            this.showToast('Failed to generate prompt');
          }
        });
      } catch (e) {
        this.showToast(`Error: ${e.message}`);
      }
    }

    async handleAIStudioExport() {
      this.showToast('Preparing export...');
      try {
        chrome.runtime.sendMessage({ type: 'AI_VIDEO_EXPORT', format: 'urls' }, (response) => {
          if (response?.content) {
            const blob = new Blob([response.content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `notebooklm-urls-${Date.now()}.txt`;
            a.click();
            URL.revokeObjectURL(url);
            this.showToast('Export complete!');
          } else {
            this.showToast('Export failed');
          }
        });
      } catch (e) {
        this.showToast(`Error: ${e.message}`);
      }
    }

    updateAIStudioStatus(status) {
      const statusEl = document.getElementById('service-ai-studio-status');
      if (statusEl) {
        const dot = statusEl.querySelector('.status-dot');
        if (dot) {
          dot.className = `status-dot ${status === 'connected' ? 'connected' : 'disconnected'}`;
        }
      }
    }

    updateNativeHostIndicator() {
      const indicator = document.getElementById('native-host-indicator');
      if (indicator) {
        if (this.state.nativeHostAvailable) {
          indicator.textContent = '🟢 Connected';
          indicator.style.color = '#00ff88';
        } else {
          indicator.textContent = '🔴 Not Installed';
          indicator.style.color = '#ff3366';
        }
      }
    }

    updateServiceUI() {
      for (const [serviceName, status] of Object.entries(this.state.services)) {
        const card = document.querySelector(`[data-service="${serviceName}"]`);
        if (card) {
          const statusDot = card.querySelector('.status-dot');
          if (statusDot) {
            statusDot.className = `status-dot ${status.running ? 'connected' : 'disconnected'}`;
          }

          // Update card class
          if (status.running) {
            card.classList.add('running');
          } else {
            card.classList.remove('running');
          }

          // Update buttons
          const startBtn = card.querySelector('[data-action="start"]');
          const stopBtn = card.querySelector('[data-action="stop"]');
          if (startBtn) startBtn.disabled = status.running;
          if (stopBtn) stopBtn.disabled = !status.running;
        }
      }

      // Refresh AI Video Stats if visible
      this.refreshAIVideoStats();
    }

    async refreshAIVideoStats() {
      try {
        chrome.runtime.sendMessage({ type: 'AI_VIDEO_GET_STATS' }, (stats) => {
          if (stats) {
            const processedEl = document.getElementById('ai-video-processed');
            const totalEl = document.getElementById('ai-video-total');
            const costEl = document.getElementById('ai-video-cost');
            const accountEl = document.getElementById('ai-video-account');

            if (processedEl) processedEl.textContent = stats.processed || '0';
            if (totalEl) totalEl.textContent = stats.total || '0';
            if (costEl) costEl.textContent = `$${(stats.cost || 0).toFixed(2)}`;
            if (accountEl) accountEl.textContent = stats.account || 'None';
          }
        });
      } catch (e) {
        console.warn('Failed to refresh AI Video stats:', e);
      }
    }

    async loadState() {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
          if (response) {
            this.state.connectionStatus = response.connectionStatus || 'disconnected';
            this.state.agents = response.agents || [];
          }
          resolve();
        });
      });
    }

    async loadSettings() {
      return new Promise((resolve) => {
        chrome.storage.local.get(['fuse_settings'], (result) => {
          if (result.fuse_settings) {
            this.state.settings = { ...this.state.settings, ...result.fuse_settings };

            // Update UI
            const relayUrl = document.getElementById('relay-url');
            if (relayUrl) relayUrl.value = this.state.settings.relayUrl;

            const autoReconnect = document.getElementById('auto-reconnect');
            if (autoReconnect) autoReconnect.checked = this.state.settings.autoReconnect;

            const showPanel = document.getElementById('show-panel');
            if (showPanel) showPanel.checked = this.state.settings.showPanel;

            const debugMode = document.getElementById('debug-mode');
            if (debugMode) debugMode.checked = this.state.settings.debugMode;

            this.updateManagedSitesList();
          }
          resolve();
        });
      });
    }

    async saveSettings() {
      await chrome.storage.local.set({ fuse_settings: this.state.settings });
      this.showToast('Settings saved!');
    }

    setupMessageListener() {
      chrome.runtime.onMessage.addListener((message) => {
        switch (message.type) {
          case 'CONNECTION_STATUS':
            this.state.connectionStatus = message.status;
            this.updateUI();
            break;

          case 'AGENTS_UPDATE':
            this.state.agents = message.agents;
            this.updateAgentsList();
            this.updateStats();
            break;

          case 'NEW_MESSAGE':
            this.state.messages.unshift(message.message);
            if (this.state.messages.length > 20) {
              this.state.messages = this.state.messages.slice(0, 20);
            }
            this.updateMessageList();
            break;
        }
      });
    }

    connect() {
      chrome.runtime.sendMessage({ type: 'CONNECT' });
      this.state.connectionStatus = 'connecting';
      this.updateUI();
    }

    disconnect() {
      chrome.runtime.sendMessage({ type: 'DISCONNECT' });
      this.state.connectionStatus = 'disconnected';
      this.updateUI();
    }

    updateUI() {
      this.updateConnectionStatus();
      this.updateAgentsList();
      this.updateStats();
      this.updateServiceUI();
      this.updateNativeHostIndicator();
      this.updateQuickStartHelper();
    }

    updateQuickStartHelper() {
      const helper = document.getElementById('quick-start-helper');
      if (!helper) return;

      // Hide helper if connected
      if (this.state.connectionStatus === 'connected') {
        helper.style.display = 'none';
      }
    }

    updateConnectionStatus() {
      const { connectionStatus } = this.state;

      // Update indicator dot
      const dot = document.querySelector('.status-dot');
      if (dot) {
        dot.className = `status-dot ${connectionStatus}`;
      }

      // Update connection icon
      const icon = document.getElementById('connection-icon');
      if (icon) {
        icon.className = `connection-icon ${connectionStatus}`;
      }

      // Update status text
      const statusText = document.getElementById('connection-status-text');
      if (statusText) {
        const texts = {
          connected: 'Connected',
          connecting: 'Connecting...',
          disconnected: 'Disconnected',
          reconnecting: 'Reconnecting...',
          error: 'Connection Error',
        };
        statusText.textContent = texts[connectionStatus] || 'Unknown';
      }

      // Update button
      const btn = document.getElementById('connect-btn');
      if (btn) {
        if (connectionStatus === 'connected') {
          btn.innerHTML = '<span class="btn-icon">🔌</span> Disconnect';
          btn.classList.add('disconnect');
        } else if (connectionStatus === 'connecting' || connectionStatus === 'reconnecting') {
          btn.innerHTML = '<span class="btn-icon">⏳</span> Connecting...';
          btn.disabled = true;
        } else {
          btn.innerHTML = '<span class="btn-icon">🔌</span> Connect to Relay';
          btn.classList.remove('disconnect');
          btn.disabled = false;
        }
      }
    }

    updateManagedSitesList() {
      const list = document.getElementById('sites-list');
      const sites = this.state.settings.allowedSites || [];

      if (list) {
        if (sites.length === 0) {
          list.innerHTML = '<div class="empty-sites">No custom sites added</div>';
        } else {
          list.innerHTML = sites
            .map(
              (site) => `
          <div class="site-item">
            <span class="site-url">${site}</span>
            <button class="delete-site-btn" data-site="${site}" title="Remove">✕</button>
          </div>
        `
            )
            .join('');
        }
      }
    }

    addManagedSite() {
      const input = document.getElementById('new-site-input');
      if (!input) return;

      const rawSite = input.value.trim().toLowerCase();
      if (!rawSite) return;

      // Basic clean up: remove http://, https://, www.
      let site = rawSite.replace(/^https?:\/\//, '').replace(/^www\./, '');

      // Remove path, keep only hostname
      site = site.split('/')[0];

      if (!site) return;

      if (!this.state.settings.allowedSites) {
        this.state.settings.allowedSites = [];
      }

      if (!this.state.settings.allowedSites.includes(site)) {
        this.state.settings.allowedSites.push(site);
        this.saveSettings();
        this.updateManagedSitesList();
        input.value = '';
      } else {
        this.showToast('Site already added');
      }
    }

    removeManagedSite(site) {
      if (!this.state.settings.allowedSites) return;

      this.state.settings.allowedSites = this.state.settings.allowedSites.filter((s) => s !== site);
      this.saveSettings();
      this.updateManagedSitesList();
    }

    updateAgentsList() {
      const container = document.getElementById('agents-list');
      if (!container) return;

      if (this.state.agents.length === 0) {
        const isConnected = this.state.connectionStatus === 'connected';
        container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">🤖</span>
          <p>${isConnected ? 'Waiting for agents...' : 'No agents connected'}</p>
          ${
            !isConnected
              ? `
            <button class="btn-secondary" id="go-to-connect" style="margin: 12px 0; width: 100%;">
              🔌 Connect to Relay First
            </button>
          `
              : `
            <p class="empty-hint" style="color: var(--neon-cyan);">
              Relay connected! Agents will appear here when they join.
            </p>
          `
          }
          <div style="margin-top: 12px; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px; text-align: left;">
            <p style="font-size: 11px; color: var(--text-muted); margin: 0 0 8px 0;">Available agent types:</p>
            <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
              🔷 VS Code Extension<br>
              🖥️ Electron Desktop<br>
              🌐 Browser Extensions<br>
              🚀 API Gateway
            </div>
          </div>
        </div>
      `;

        // Add click handler for connect button
        document.getElementById('go-to-connect')?.addEventListener('click', () => {
          // Switch to Connect tab
          document.querySelector('[data-tab="connect"]')?.click();
        });
        return;
      }

      container.innerHTML = this.state.agents
        .map(
          (agent) => `
      <div class="agent-card" data-agent-id="${agent.id}">
        <div class="agent-avatar">${this.getAgentIcon(agent.platform)}</div>
        <div class="agent-info">
          <div class="agent-name">${agent.name}</div>
          <div class="agent-platform">${agent.platform}</div>
        </div>
        <div class="agent-status-indicator ${agent.status}"></div>
      </div>
    `
        )
        .join('');

      // Add click handlers for direct message
      container.querySelectorAll('.agent-card').forEach((card) => {
        card.addEventListener('click', () => {
          const agentId = card.dataset.agentId;
          this.showDirectMessagePrompt(agentId);
        });
      });
    }

    updateStats() {
      const agentsEl = document.getElementById('stat-agents');
      if (agentsEl) agentsEl.textContent = this.state.agents.length.toString();

      const messagesEl = document.getElementById('stat-messages');
      if (messagesEl) messagesEl.textContent = this.state.messages.length.toString();
    }

    updateMessageList() {
      const container = document.getElementById('message-list');
      if (!container) return;

      if (this.state.messages.length === 0) {
        container.innerHTML = `
        <div class="empty-state small">
          <p>No recent messages</p>
        </div>
      `;
        return;
      }

      container.innerHTML = this.state.messages
        .slice(0, 10)
        .map(
          (msg) => `
      <div class="message-item">
        <div class="message-item-header">
          <span class="message-item-from">${msg.from}</span>
          <span class="message-item-time">${this.formatTime(msg.timestamp)}</span>
        </div>
        <div class="message-item-content">${this.truncate(msg.content, 80)}</div>
      </div>
    `
        )
        .join('');
    }

    showDirectMessagePrompt(agentId) {
      const agent = this.state.agents.find((a) => a.id === agentId);
      if (!agent) return;

      const message = prompt(`Send message to ${agent.name}:`);
      if (message) {
        chrome.runtime.sendMessage({
          type: 'SEND_TO_AGENT',
          agentId,
          content: message,
        });
      }
    }

    async exportLogs() {
      // Get logs from storage
      const result = await chrome.storage.local.get(['fuse_logs']);
      const logs = result.fuse_logs || [];

      // Create download
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `fuse-connect-logs-${Date.now()}.json`;
      a.click();

      URL.revokeObjectURL(url);
      this.showToast('Logs exported!');
    }

    showToast(message) {
      // Simple toast notification
      const toast = document.createElement('div');
      toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 8px 16px;
      background: linear-gradient(135deg, #00D9FF, #9D4EDD);
      color: white;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      z-index: 10000;
      animation: fadeInUp 0.3s ease;
    `;
      toast.textContent = message;
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 2000);
    }

    getAgentIcon(platform) {
      const icons = {
        'chrome-extension': '🌐',
        vscode: '🔷',
        antigravity: '🌌',
        claude: '🤖',
        chatgpt: '💬',
        gemini: '✨',
        'electron-desktop': '🖥️',
        'api-gateway': '🚀',
        'backend-service': '⚙️',
      };
      return icons[platform] || '🤖';
    }

    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    truncate(text, length) {
      return text.length > length ? text.substring(0, length) + '...' : text;
    }
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    new FuseConnectPopup();
  });

  /******/
})();
//# sourceMappingURL=popup.js.map

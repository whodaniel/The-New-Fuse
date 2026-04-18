/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/**
 * Fuse Connect v7 - Popup Logic
 */

const NATIVE_HOST_NAME = 'com.thenewfuse.native_host';

class GeminiBridgePopup {
  constructor() {
    this.state = {
      connectionStatus: 'disconnected',
      agents: [],
      platform: null,
      messages: [],
      channels: [],
      joinedChannels: [],
      selectedChannel: null,
      agentId: null,
      services: {
        'ai-studio': { running: false, port: null },
      },
      aiVideo: {
        queue: [],
        queueCount: 0,
        playlistVideos: [],
        filteredPlaylistVideos: [],
        selectedPlaylistVideoIds: new Set(),
        reverseOrder: false,
        segmentDuration: 45,
        processingLevel: 'ai_studio',
        processingState: {
          isProcessing: false,
          isPaused: false,
          currentIndex: 0,
          totalCount: 0,
        },
      },
      nativeHostAvailable: false,
      autonomy: {
        monitorRunning: false,
        masterClockRunning: false,
        autoWakePing: true,
        lastWakePingAt: null,
        source: 'unknown',
      },
      settings: {
        relayUrl: 'ws://localhost:3000/ws',
        autoReconnect: true,
        autoMonitor: true,
        autoMasterClock: true,
        autoWakePing: true,
        showPanel: true,
        debugMode: false,
        allowedSites: [],
        popupSelectedChannel: null,
        popupSelectedChannelName: null,
        aiviSegmentDuration: 45,
        aiviConcurrentProcesses: 1,
        aiviAutoOpenNotebook: false,
        aiviAutoAudioOverview: false,
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
    await this.refreshAutonomyStatus();

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

    // Central chat controls
    document.getElementById('central-refresh-channels')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'REQUEST_SYNC' });
      this.showToast('Channel sync requested');
    });

    document.getElementById('central-channel-select')?.addEventListener('change', (e) => {
      const channelId = e.target.value || null;
      this.setSelectedChannel(channelId);
    });

    document.getElementById('central-create-channel')?.addEventListener('click', () => {
      this.createChannelFromPopup();
    });

    document.getElementById('central-new-channel')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.createChannelFromPopup();
      }
    });

    document.getElementById('central-send-message')?.addEventListener('click', () => {
      this.sendCentralMessage();
    });

    document.getElementById('central-chat-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.sendCentralMessage();
      }
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

    document.getElementById('ai-video-save-queue')?.addEventListener('click', () => {
      this.saveAIVideoQueue();
    });

    document.getElementById('ai-video-refresh-playlists')?.addEventListener('click', () => {
      this.refreshAIVideoPlaylists({ interactiveAuth: true });
    });
    document.getElementById('ai-video-auth-btn')?.addEventListener('click', () => {
      this.handleAIStudioAuth();
    });
    document.getElementById('ai-video-signout-btn')?.addEventListener('click', () => {
      this.handleAIStudioSignOut();
    });

    document.getElementById('ai-video-load-playlist')?.addEventListener('click', () => {
      this.loadSelectedPlaylistIntoQueue();
    });
    document.getElementById('ai-video-playlist-select')?.addEventListener('change', () => {
      this.loadSelectedPlaylistIntoQueue();
    });
    document.getElementById('ai-video-search-filter')?.addEventListener('input', () => {
      this.applyAIVideoPlaylistFilters();
      this.renderAIVideoPlaylistBrowser();
    });
    document.getElementById('ai-video-filter-short')?.addEventListener('change', () => {
      this.applyAIVideoPlaylistFilters();
      this.renderAIVideoPlaylistBrowser();
    });
    document.getElementById('ai-video-select-all')?.addEventListener('click', () => {
      this.state.aiVideo.filteredPlaylistVideos.forEach((video) =>
        this.state.aiVideo.selectedPlaylistVideoIds.add(String(video.id || ''))
      );
      this.renderAIVideoPlaylistBrowser();
    });
    document.getElementById('ai-video-deselect-all')?.addEventListener('click', () => {
      this.state.aiVideo.selectedPlaylistVideoIds.clear();
      this.renderAIVideoPlaylistBrowser();
    });
    document.getElementById('ai-video-add-selected')?.addEventListener('click', () => {
      this.addSelectedPlaylistVideosToQueue();
    });
    document.getElementById('ai-video-process-selected')?.addEventListener('click', () => {
      this.processSelectedPlaylistVideos();
    });
    document.getElementById('ai-video-clear-filter')?.addEventListener('click', () => {
      const searchEl = document.getElementById('ai-video-search-filter');
      const shortEl = document.getElementById('ai-video-filter-short');
      const watchedEl = document.getElementById('ai-video-filter-watched');
      const duplicatesEl = document.getElementById('ai-video-filter-duplicates');
      if (searchEl) searchEl.value = '';
      if (shortEl) shortEl.checked = false;
      if (watchedEl) watchedEl.checked = false;
      if (duplicatesEl) duplicatesEl.checked = false;
      this.applyAIVideoPlaylistFilters();
      this.renderAIVideoPlaylistBrowser();
    });
    document.getElementById('ai-video-filter-watched')?.addEventListener('change', () => {
      this.applyAIVideoPlaylistFilters();
      this.renderAIVideoPlaylistBrowser();
    });
    document.getElementById('ai-video-filter-duplicates')?.addEventListener('change', () => {
      this.applyAIVideoPlaylistFilters();
      this.renderAIVideoPlaylistBrowser();
    });
    document.getElementById('ai-video-subtab-queue')?.addEventListener('click', () => {
      const queueView = document.getElementById('ai-video-queue-view');
      const historyView = document.getElementById('ai-video-history-view');
      if (queueView) queueView.style.display = 'block';
      if (historyView) historyView.style.display = 'none';
    });
    document.getElementById('ai-video-subtab-history')?.addEventListener('click', () => {
      const queueView = document.getElementById('ai-video-queue-view');
      const historyView = document.getElementById('ai-video-history-view');
      if (queueView) queueView.style.display = 'none';
      if (historyView) historyView.style.display = 'block';
      this.refreshAIVideoHistory();
    });
    document.getElementById('ai-video-dashboard-link')?.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://connect.thenewfuse.com/', active: true });
    });
    document.getElementById('ai-video-bulk-import-btn')?.addEventListener('click', () => {
      this.openAIVideoPage('notebooklm');
    });
    document.getElementById('ai-video-export-queue-btn')?.addEventListener('click', () => {
      this.handleAIStudioExport('urls');
    });
    document.getElementById('ai-video-send-urls-channel')?.addEventListener('click', () => {
      this.sendSelectedUrlsToChannel();
    });
    document.getElementById('ai-video-send-analysis-channel')?.addEventListener('click', () => {
      this.sendRecentAnalysesToChannel();
    });

    document.getElementById('ai-video-create-playlist')?.addEventListener('click', () => {
      this.createAIVideoPlaylist();
    });
    document.getElementById('ai-video-processing-level')?.addEventListener('change', () => {
      this.updateProcessingLevelDescription();
      this.saveAIVideoPreferences();
    });

    document.getElementById('ai-video-single-url')?.addEventListener('input', () => {
      this.updateSingleVideoPreview();
    });

    document.getElementById('ai-video-single-add')?.addEventListener('click', () => {
      this.addSingleVideoToQueue();
    });

    document.getElementById('ai-video-clear-queue')?.addEventListener('click', () => {
      this.clearAIVideoQueue();
    });

    document.getElementById('ai-video-dedupe-queue')?.addEventListener('click', () => {
      this.dedupeQueueText();
    });

    document.getElementById('ai-video-clean-queue')?.addEventListener('click', () => {
      this.cleanQueueText();
    });

    document.getElementById('ai-video-save-preferences')?.addEventListener('click', () => {
      this.saveAIVideoPreferences();
    });

    document.getElementById('ai-video-open-ai-studio')?.addEventListener('click', () => {
      this.openAIVideoPage('ai-studio');
    });

    document.getElementById('ai-video-open-notebooklm')?.addEventListener('click', () => {
      this.openAIVideoPage('notebooklm');
    });

    document.getElementById('ai-video-process-panel')?.addEventListener('click', () => {
      this.handleAIStudioProcess();
    });

    document.getElementById('ai-video-start')?.addEventListener('click', () => {
      this.controlAIVideoProcessing('start');
    });

    document.getElementById('ai-video-pause')?.addEventListener('click', () => {
      this.controlAIVideoProcessing('pause');
    });

    document.getElementById('ai-video-resume')?.addEventListener('click', () => {
      this.controlAIVideoProcessing('resume');
    });

    document.getElementById('ai-video-stop')?.addEventListener('click', () => {
      this.controlAIVideoProcessing('stop');
    });

    document.getElementById('ai-video-generate-history')?.addEventListener('click', () => {
      this.handleAIStudioHistory();
    });

    document.getElementById('ai-video-export-urls')?.addEventListener('click', () => {
      this.handleAIStudioExport('urls');
    });

    document.getElementById('ai-video-export-json')?.addEventListener('click', () => {
      this.handleAIStudioExport('json');
    });

    document.getElementById('ai-video-refresh-history')?.addEventListener('click', () => {
      this.refreshAIVideoHistory();
    });

    document.getElementById('ai-video-export-reports')?.addEventListener('click', () => {
      this.handleAIStudioExport('reports-md');
    });

    document.getElementById('ai-video-clear-history')?.addEventListener('click', () => {
      this.clearAIVideoHistory();
    });

    // Save settings
    document.getElementById('save-settings')?.addEventListener('click', () => {
      this.saveSettings();
    });
    document.getElementById('clearCacheBtn')?.addEventListener('click', async () => {
      await chrome.storage.local.remove(['videoQueue', 'processingState']);
      this.showToast('AI Video cache cleared');
      await this.refreshAIVideoQueueAndPreferences();
      this.updateServiceUI();
    });
    document.getElementById('exportDataBtn')?.addEventListener('click', async () => {
      const allData = await chrome.storage.local.get(null);
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tnf-aivi-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
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

    document.getElementById('auto-monitor')?.addEventListener('change', (e) => {
      this.state.settings.autoMonitor = e.target.checked;
    });

    document.getElementById('auto-master-clock')?.addEventListener('change', (e) => {
      this.state.settings.autoMasterClock = e.target.checked;
    });

    document.getElementById('auto-wake-ping')?.addEventListener('change', (e) => {
      this.state.settings.autoWakePing = e.target.checked;
    });

    document.getElementById('start-autonomy-now')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'START_AUTONOMY' }, async (response) => {
        if (response?.success) {
          this.showToast('Autonomy started');
          setTimeout(() => this.refreshServiceStatus(), 1000);
          return;
        }

        // Fallback path for older background bundles: start services directly
        await this.controlService('start', 'monitor');
        await this.controlService('start', 'masterClock');
        this.showToast('Autonomy start fallback executed');
      });
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

    // Docs hub
    document.getElementById('open-docs')?.addEventListener('click', (e) => {
      e.preventDefault();
      const docsUrl = chrome.runtime.getURL('popup/docs-index.html');
      chrome.tabs.create({ url: docsUrl });
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
          const startResponse = await this.sendNativeMessage({ action: 'start', service: 'relay' });
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
            this.showToast('Panel opened! (Ctrl+Shift+G to toggle)');
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
    await this.checkNativeHost();
    if (this.state.nativeHostAvailable) {
      try {
        const response = await this.sendNativeMessage({ action: 'status' });
        if (response.services) {
          this.state.services = response.services;
        }
      } catch (e) {
        console.error('Failed to get native service status:', e);
      }
    }

    await this.refreshAIVideoStats();
    await this.refreshAIVideoQueueAndPreferences();
    await this.refreshAIVideoPlaylists();
    await this.refreshAIVideoHistory();
    await this.refreshAIVideoAccountSettings();
    this.updateServiceUI();
  }

  async refreshAutonomyStatus() {
    // Preferred path: background exposes full autonomy status
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_AUTONOMY_STATUS' }, (r) => resolve(r || null));
      });
      if (response?.success) {
        this.state.autonomy.monitorRunning = !!response.monitor?.running;
        this.state.autonomy.masterClockRunning = !!response.masterClock?.running;
        this.state.autonomy.autoWakePing = !!response.settings?.autoWakePing;
        this.state.autonomy.source = 'background';
        await this.refreshLastWakePingTime();
        this.updateAutonomyStatusUI();
        return;
      }
    } catch (e) {
      // Fallback below
    }

    // Fallback: native host status only
    if (this.state.nativeHostAvailable) {
      try {
        const response = await this.sendNativeMessage({ action: 'status' });
        const monitor = response?.services?.monitor;
        const masterClock = response?.services?.masterClock;
        this.state.autonomy.monitorRunning = !!monitor?.running;
        this.state.autonomy.masterClockRunning = !!masterClock?.running;
        this.state.autonomy.autoWakePing = !!this.state.settings.autoWakePing;
        this.state.autonomy.source = 'native-host-fallback';
        await this.refreshLastWakePingTime();
      } catch (e) {
        // Keep existing values
      }
    }
    this.updateAutonomyStatusUI();
  }

  async refreshLastWakePingTime() {
    try {
      const response = await fetch('http://localhost:3000/activity/recent?count=100', {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      const data = await response.json();
      const activities = Array.isArray(data?.events)
        ? data.events
        : Array.isArray(data)
          ? data
          : [];
      const lastWake = activities.find(
        (ev) =>
          ev?.eventType === 'wake_ping_sent' ||
          ev?.metadata?.eventType === 'wake_ping_sent' ||
          ev?.metadata?.eventType === 'wake_ping'
      );
      this.state.autonomy.lastWakePingAt = lastWake?.timestamp || lastWake?.ts || null;
    } catch (e) {
      // Best effort
    }
  }

  updateAutonomyStatusUI() {
    const overall = document.getElementById('autonomy-overall-indicator');
    const monitor = document.getElementById('autonomy-monitor-status');
    const masterClock = document.getElementById('autonomy-master-clock-status');
    const wakePing = document.getElementById('autonomy-wake-ping-status');
    const lastWake = document.getElementById('autonomy-last-wake-ping');

    if (monitor) monitor.textContent = this.state.autonomy.monitorRunning ? 'Running' : 'Stopped';
    if (masterClock)
      masterClock.textContent = this.state.autonomy.masterClockRunning ? 'Running' : 'Stopped';
    if (wakePing) wakePing.textContent = this.state.autonomy.autoWakePing ? 'Enabled' : 'Disabled';
    if (lastWake) {
      lastWake.textContent = this.state.autonomy.lastWakePingAt
        ? this.formatTime(this.state.autonomy.lastWakePingAt)
        : 'N/A';
    }

    if (overall) {
      const healthy = this.state.autonomy.monitorRunning && this.state.autonomy.masterClockRunning;
      overall.textContent = healthy ? '🟢 Healthy' : '🟡 Partial';
      overall.style.color = healthy ? '#00ff88' : '#ffb800';
    }
  }

  async controlService(action, service) {
    // Handle AI Studio specific actions
    if (service === 'ai-studio') {
      if (action === 'auth') {
        this.handleAIStudioAuth();
        return;
      } else if (action === 'signout') {
        this.handleAIStudioSignOut();
        return;
      } else if (action === 'process') {
        this.handleAIStudioProcess();
        return;
      } else if (action === 'history') {
        this.handleAIStudioHistory();
        return;
      } else if (action === 'export') {
        this.handleAIStudioExport('urls');
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
        this.showToast(`Failed: ${response.result?.error || response.message || 'Unknown error'}`);
      }
    } catch (e) {
      this.showToast(`Error: ${e.message}`);
    }
  }

  async handleAIStudioAuth() {
    const authBtn = document.querySelector('[data-action="auth"][data-service="ai-studio"]');
    if (authBtn) authBtn.disabled = true;
    this.showToast('Signing in with your Google account...');
    try {
      chrome.runtime.sendMessage({ type: 'YOUTUBE_AUTHENTICATE' }, async (response) => {
        if (authBtn) authBtn.disabled = false;
        if (response?.success) {
          this.showToast('YouTube access granted.');
          this.updateAIStudioStatus('connected');
          await this.refreshAIVideoStats();
          await this.refreshAIVideoPlaylists();
          this.refreshServiceStatus();
        } else {
          const rawError = String(response?.error || 'Authentication failed');
          if (rawError.includes('redirect_uri_mismatch')) {
            const oauth = response?.oauth || {};
            const redirect = oauth.redirectUri || 'Unknown redirect URI';
            const clientId = oauth.clientId || 'Unknown client_id';
            console.error('[AIVI OAuth] redirect_uri_mismatch', {
              redirectUri: redirect,
              clientId,
              extensionId: oauth.extensionId,
            });
            this.showToast('OAuth redirect mismatch. Check console for exact redirect URI.');
          } else {
            this.showToast(rawError);
          }
        }
      });
    } catch (e) {
      if (authBtn) authBtn.disabled = false;
      this.showToast(`Auth error: ${e.message}`);
    }
  }

  async handleAIStudioSignOut() {
    this.showToast('Signing out YouTube account...');
    chrome.runtime.sendMessage({ type: 'YOUTUBE_SIGN_OUT' }, (response) => {
      if (response?.success) {
        this.showToast('Signed out. Re-authenticate to choose another account.');
        this.state.aiVideo.account = 'None';
        this.refreshServiceStatus();
      } else {
        this.showToast(response?.error || 'Sign out failed');
      }
    });
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
          this.showToast('Prompt copied to clipboard');
        } else {
          this.showToast('Failed to generate prompt');
        }
      });
    } catch (e) {
      this.showToast(`Error: ${e.message}`);
    }
  }

  async handleAIStudioExport(format = 'urls') {
    this.showToast('Preparing export...');
    try {
      chrome.runtime.sendMessage({ type: 'AI_VIDEO_EXPORT', format }, (response) => {
        if (response?.content) {
          const blob = new Blob([response.content], {
            type: format === 'json' ? 'application/json' : 'text/plain',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download =
            format === 'json'
              ? `ai-video-export-${Date.now()}.json`
              : format === 'reports-md'
                ? `ai-video-reports-${Date.now()}.md`
                : `notebooklm-urls-${Date.now()}.txt`;
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

  async openAIVideoPage(page) {
    chrome.runtime.sendMessage({ type: 'AI_VIDEO_OPEN_PAGE', page }, (response) => {
      if (!response?.success) {
        this.showToast('Failed to open page');
      }
    });
  }

  async saveAIVideoQueue() {
    const queueInput = document.getElementById('ai-video-queue-input');
    const text = queueInput?.value || '';
    chrome.runtime.sendMessage({ type: 'AI_VIDEO_SET_QUEUE', text }, (response) => {
      if (response?.success) {
        this.showToast(`Queue saved (${response.queueCount || 0})`);
        this.refreshServiceStatus();
      } else {
        this.showToast('Failed to save queue');
      }
    });
  }

  async clearAIVideoQueue() {
    chrome.runtime.sendMessage({ type: 'AI_VIDEO_CLEAR_QUEUE' }, (response) => {
      if (response?.success) {
        this.showToast('Queue cleared');
        const queueInput = document.getElementById('ai-video-queue-input');
        if (queueInput) queueInput.value = '';
        this.refreshServiceStatus();
      } else {
        this.showToast('Failed to clear queue');
      }
    });
  }

  async saveAIVideoPreferences() {
    const reverseOrder = !!document.getElementById('ai-video-reverse-order')?.checked;
    const segmentDuration = Number(
      document.getElementById('ai-video-segment-duration')?.value || 45
    );
    const processingLevel =
      document.getElementById('ai-video-processing-level')?.value || 'ai_studio';
    chrome.runtime.sendMessage(
      {
        type: 'AI_VIDEO_SET_PREFERENCES',
        reverseOrder,
        segmentDuration,
        processingLevel,
      },
      (response) => {
        if (response?.success) {
          this.showToast('Preferences saved');
          this.refreshServiceStatus();
        } else {
          this.showToast('Failed to save preferences');
        }
      }
    );
  }

  updateProcessingLevelDescription() {
    const level = String(
      document.getElementById('ai-video-processing-level')?.value || 'ai_studio'
    );
    const description = document.getElementById('ai-video-processing-description');
    if (!description) return;
    if (level === 'transcript') {
      description.textContent =
        'Extracts metadata and transcript only. Fastest mode, no external AI model calls.';
      return;
    }
    if (level === 'flash') {
      description.textContent =
        'Builds a quick local summary from transcript/metadata. Does not call external AI APIs.';
      return;
    }
    if (level === 'pro') {
      description.textContent =
        'Builds a more detailed local summary from transcript/metadata. Does not call external AI APIs.';
      return;
    }
    description.textContent =
      'Full video analysis using your Google AI Studio account. Best quality, uses segments for long videos.';
  }

  async refreshAIVideoPlaylists(options = {}) {
    const interactiveAuth = !!options.interactiveAuth;
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'AI_STUDIO_GET_PLAYLISTS' }, (response) => {
        const selectEl = document.getElementById('ai-video-playlist-select');
        const destinationSelectEl = document.getElementById('ai-video-destination-playlist-select');
        if (!selectEl) {
          resolve();
          return;
        }
        const playlists =
          response?.success && Array.isArray(response.playlists) ? response.playlists : [];
        const currentValue = selectEl.value;
        const destinationValue = destinationSelectEl?.value || '';
        selectEl.innerHTML = '<option value="">Select playlist...</option>';
        if (destinationSelectEl) {
          destinationSelectEl.innerHTML = '<option value="">Select destination...</option>';
        }

        playlists.forEach((playlist) => {
          const option = document.createElement('option');
          option.value = playlist.id;
          option.textContent = `${playlist.title} (${playlist.videoCount || 0})`;
          selectEl.appendChild(option);
          if (destinationSelectEl) {
            const destinationOption = document.createElement('option');
            destinationOption.value = playlist.id;
            destinationOption.textContent = `${playlist.title} (${playlist.videoCount || 0})`;
            destinationSelectEl.appendChild(destinationOption);
          }
        });
        if (currentValue) selectEl.value = currentValue;
        if (destinationSelectEl && destinationValue) destinationSelectEl.value = destinationValue;

        if (!response?.success && response?.error) {
          const authError =
            String(response.error).includes('Not authenticated') ||
            String(response.error).includes('Quota Protection');
          if (authError) {
            if (interactiveAuth) {
              this.handleAIStudioAuth();
            } else {
              this.showToast('Not authenticated. Click refresh to sign in.');
            }
          } else {
            this.showToast(response.error);
          }
        }
        resolve();
      });
    });
  }

  async loadSelectedPlaylistIntoQueue() {
    const playlistId = document.getElementById('ai-video-playlist-select')?.value || '';
    if (!playlistId) {
      this.showToast('Select a playlist first');
      return;
    }
    chrome.runtime.sendMessage(
      { type: 'AI_STUDIO_GET_PLAYLIST_VIDEOS', playlistId },
      (response) => {
        if (!response?.success || !Array.isArray(response.videos)) {
          const error = String(response?.error || 'Failed to load playlist videos');
          if (error.includes('Not authenticated') || error.includes('Quota Protection')) {
            this.handleAIStudioAuth();
          } else {
            this.showToast(error);
          }
          return;
        }
        const baseVideos = response.videos.map((v) => ({
          id: String(v.id || ''),
          title: String(v.title || 'Untitled'),
          channelTitle: String(v.channelTitle || ''),
          thumbnail: String(v.thumbnail || ''),
          url: String(v.url || ''),
          durationSeconds: 0,
          viewCount: 0,
        }));
        this.state.aiVideo.playlistVideos = baseVideos;
        this.state.aiVideo.selectedPlaylistVideoIds.clear();

        const ids = baseVideos.map((v) => v.id).filter(Boolean);
        if (ids.length === 0) {
          this.applyAIVideoPlaylistFilters();
          this.renderAIVideoPlaylistBrowser();
          this.showToast('No videos found in playlist');
          return;
        }

        chrome.runtime.sendMessage(
          { type: 'YOUTUBE_GET_VIDEO_DETAILS', videoIds: ids },
          (detailsResp) => {
            if (detailsResp?.success && Array.isArray(detailsResp.data)) {
              const byId = new Map(detailsResp.data.map((d) => [String(d.id || ''), d]));
              this.state.aiVideo.playlistVideos = baseVideos.map((video) => {
                const detail = byId.get(video.id);
                return {
                  ...video,
                  durationSeconds: this.parseIsoDurationToSeconds(
                    String(detail?.durationISO || '')
                  ),
                  viewCount: Number(detail?.viewCount || 0),
                };
              });
            }
            this.applyAIVideoPlaylistFilters();
            this.renderAIVideoPlaylistBrowser();
            this.showToast(
              `Loaded ${this.state.aiVideo.playlistVideos.length} videos for selection`
            );
          }
        );
      }
    );
  }

  parseIsoDurationToSeconds(isoDuration) {
    const match = String(isoDuration || '').match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = Number(match[1] || 0);
    const minutes = Number(match[2] || 0);
    const seconds = Number(match[3] || 0);
    return hours * 3600 + minutes * 60 + seconds;
  }

  formatSeconds(seconds) {
    const total = Number(seconds || 0);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  applyAIVideoPlaylistFilters() {
    const term = String(document.getElementById('ai-video-search-filter')?.value || '')
      .trim()
      .toLowerCase();
    const onlyLong = !!document.getElementById('ai-video-filter-short')?.checked;
    const hideDuplicates = !!document.getElementById('ai-video-filter-duplicates')?.checked;
    const hideWatched = !!document.getElementById('ai-video-filter-watched')?.checked;

    let filtered = [...(this.state.aiVideo.playlistVideos || [])];
    if (term) {
      filtered = filtered.filter(
        (video) =>
          String(video.title || '')
            .toLowerCase()
            .includes(term) ||
          String(video.channelTitle || '')
            .toLowerCase()
            .includes(term)
      );
    }
    if (onlyLong) {
      filtered = filtered.filter((video) => Number(video.durationSeconds || 0) >= 600);
    }
    if (hideDuplicates) {
      const seen = new Set();
      filtered = filtered.filter((video) => {
        const id = String(video.id || '');
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    }
    if (hideWatched) {
      filtered = filtered.filter((video) => !video.watched);
    }
    this.state.aiVideo.filteredPlaylistVideos = filtered;
  }

  renderAIVideoPlaylistBrowser() {
    const listEl = document.getElementById('ai-video-browser-list');
    const emptyEl = document.getElementById('ai-video-browser-empty');
    const countEl =
      document.getElementById('videoCount') || document.getElementById('ai-video-browser-count');
    const selectedEl =
      document.getElementById('selectedCount') ||
      document.getElementById('ai-video-browser-selected');
    const addBtn = document.getElementById('ai-video-add-selected');
    const processBtn = document.getElementById('ai-video-process-selected');
    if (!listEl) return;

    const filtered = this.state.aiVideo.filteredPlaylistVideos || [];
    const selectedIds = this.state.aiVideo.selectedPlaylistVideoIds || new Set();
    if (countEl) countEl.textContent = String(filtered.length);
    if (selectedEl) selectedEl.textContent = String(selectedIds.size);
    if (addBtn) addBtn.disabled = selectedIds.size === 0;
    if (processBtn) {
      processBtn.disabled = selectedIds.size === 0;
      const selectedCountEl = document.getElementById('selectedCount');
      if (selectedCountEl) {
        selectedCountEl.textContent = String(selectedIds.size);
      } else {
        processBtn.textContent = `Process Selected Videos (${selectedIds.size})`;
      }
    }

    if (filtered.length === 0) {
      if (emptyEl) {
        emptyEl.style.display = 'block';
        emptyEl.textContent = this.state.aiVideo.playlistVideos.length
          ? 'No videos match current filters.'
          : 'Load a playlist to preview videos.';
      }
      listEl.querySelectorAll('.ai-video-browser-item').forEach((n) => n.remove());
      return;
    }
    if (emptyEl) emptyEl.style.display = 'none';

    listEl.innerHTML = filtered
      .map((video) => {
        const id = String(video.id || '');
        const checked = selectedIds.has(id) ? 'checked' : '';
        const thumb = this.escapeHtml(
          String(video.thumbnail || `https://i.ytimg.com/vi/${id}/mqdefault.jpg`)
        );
        const title = this.escapeHtml(String(video.title || 'Untitled'));
        const channel = this.escapeHtml(String(video.channelTitle || 'Unknown'));
        const duration = this.formatSeconds(Number(video.durationSeconds || 0));
        return `
        <label class="ai-video-browser-item" data-video-id="${id}"
          style="display:flex; gap:8px; align-items:flex-start; padding:6px; border-bottom:1px solid rgba(255,255,255,0.08); cursor:pointer;">
          <input type="checkbox" data-video-id="${id}" ${checked} style="margin-top:2px;" />
          <img src="${thumb}" alt="${title}" style="width:72px; height:40px; object-fit:cover; border-radius:4px; background:#000;" />
          <div style="min-width:0; flex:1;">
            <div style="font-size:11px; font-weight:600; line-height:1.3;">${title}</div>
            <div style="font-size:10px; opacity:0.74; margin-top:2px;">${channel} • ${duration}</div>
          </div>
        </label>`;
      })
      .join('');

    listEl.querySelectorAll('input[type="checkbox"][data-video-id]').forEach((checkbox) => {
      checkbox.addEventListener('change', (e) => {
        const videoId = String(e.target?.dataset?.videoId || '');
        if (!videoId) return;
        if (e.target.checked) selectedIds.add(videoId);
        else selectedIds.delete(videoId);
        if (selectedEl) selectedEl.textContent = String(selectedIds.size);
        if (addBtn) addBtn.disabled = selectedIds.size === 0;
        if (processBtn) {
          processBtn.disabled = selectedIds.size === 0;
          const selectedCountEl = document.getElementById('selectedCount');
          if (selectedCountEl) {
            selectedCountEl.textContent = String(selectedIds.size);
          } else {
            processBtn.textContent = `Process Selected Videos (${selectedIds.size})`;
          }
        }
      });
    });
  }

  processSelectedPlaylistVideos() {
    this.addSelectedPlaylistVideosToQueue({ autoStart: true });
  }

  addSelectedPlaylistVideosToQueue(options = {}) {
    const autoStart = !!options.autoStart;
    const selectedIds = this.state.aiVideo.selectedPlaylistVideoIds || new Set();
    if (!selectedIds.size) {
      this.showToast('Select videos first');
      return;
    }
    const selectedUrls = (this.state.aiVideo.playlistVideos || [])
      .filter((v) => selectedIds.has(String(v.id || '')))
      .map((v) => String(v.url || '').trim())
      .filter(Boolean);
    if (!selectedUrls.length) {
      this.showToast('No valid video URLs selected');
      return;
    }
    chrome.runtime.sendMessage({ type: 'AI_VIDEO_SET_QUEUE', urls: selectedUrls }, (response) => {
      if (response?.success) {
        this.showToast(`Added ${selectedUrls.length} videos to queue`);
        this.refreshServiceStatus();
        if (autoStart) {
          this.controlAIVideoProcessing('start');
        }
      } else {
        this.showToast(response?.error || 'Failed to save selected videos');
      }
    });
  }

  sendChannelMessage(content, origin = 'aivi-services') {
    const channelId = this.state.selectedChannel;
    if (!channelId) {
      this.showToast('Select a channel first in Central tab');
      return false;
    }
    chrome.runtime.sendMessage(
      {
        type: 'BROADCAST_MESSAGE',
        channel: channelId,
        content,
        senderId: this.state.agentId || undefined,
        metadata: {
          senderId: this.state.agentId || undefined,
          origin,
        },
      },
      (response) => {
        if (response?.success) {
          this.showToast('Sent to channel');
        } else {
          this.showToast(response?.error || 'Failed to send to channel');
        }
      }
    );
    return true;
  }

  sendSelectedUrlsToChannel() {
    const selectedIds = this.state.aiVideo.selectedPlaylistVideoIds || new Set();
    let urls = [];
    if (selectedIds.size > 0) {
      urls = (this.state.aiVideo.playlistVideos || [])
        .filter((v) => selectedIds.has(String(v.id || '')))
        .map((v) => String(v.url || '').trim())
        .filter(Boolean);
    }
    if (urls.length === 0) {
      urls = (this.state.aiVideo.queue || []).map((u) => String(u || '').trim()).filter(Boolean);
    }
    if (urls.length === 0) {
      this.showToast('No selected or queued URLs to send');
      return;
    }
    const content = `TNF AIVI: YouTube URLs\n\n${urls.join('\n')}`;
    this.sendChannelMessage(content, 'aivi-services-urls');
  }

  sendRecentAnalysesToChannel() {
    chrome.runtime.sendMessage({ type: 'AI_VIDEO_GET_HISTORY' }, (response) => {
      const reports = response?.success && Array.isArray(response.reports) ? response.reports : [];
      if (!reports.length) {
        this.showToast('No analyses in history yet');
        return;
      }
      const top = reports.slice(0, 5);
      const sections = top.map((r, i) => {
        const title = String(r?.title || 'Untitled');
        const url = String(r?.url || '');
        const level = String(r?.processingLevel || 'ai_studio');
        const summary = String(r?.summary || r?.content || '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 800);
        return `${i + 1}. ${title}\nLevel: ${level}\nURL: ${url}\nSummary: ${summary || 'No summary available.'}`;
      });
      const content = `TNF AIVI: Recent Analyses (latest ${top.length})\n\n${sections.join('\n\n')}`;
      this.sendChannelMessage(content, 'aivi-services-analysis');
    });
  }

  async createAIVideoPlaylist() {
    const input = document.getElementById('ai-video-new-playlist-title');
    const title = String(input?.value || '').trim();
    if (!title) {
      this.showToast('Enter a playlist title first');
      return;
    }

    chrome.runtime.sendMessage(
      {
        type: 'YOUTUBE_CREATE_PLAYLIST',
        title,
        description: 'Created by Fuse Connect AIVI',
      },
      (response) => {
        if (response?.success) {
          input.value = '';
          this.showToast('Playlist created');
          this.refreshAIVideoPlaylists();
        } else {
          const error = String(response?.error || 'Failed to create playlist');
          if (error.includes('Not authenticated') || error.includes('Quota Protection')) {
            this.handleAIStudioAuth();
          } else {
            this.showToast(error);
          }
        }
      }
    );
  }

  async controlAIVideoProcessing(action) {
    chrome.runtime.sendMessage({ type: 'AI_VIDEO_PROCESS_CONTROL', action }, (response) => {
      if (response?.success) {
        this.showToast(`Processing ${action}`);
        this.refreshServiceStatus();
      } else {
        this.showToast(response?.error || `Failed to ${action}`);
      }
    });
  }

  updateSingleVideoPreview() {
    const input = document.getElementById('ai-video-single-url');
    const preview = document.getElementById('ai-video-single-preview');
    if (!input || !preview) return;
    const url = String(input.value || '').trim();
    const match = url.match(/(?:v=|youtu\.be\/)([\w-]{11})/i);
    if (!url) {
      preview.textContent = 'No preview yet';
      return;
    }
    if (!match) {
      preview.textContent = 'Invalid YouTube URL format';
      return;
    }
    preview.textContent = `Video ID detected: ${match[1]}`;
  }

  addSingleVideoToQueue() {
    const input = document.getElementById('ai-video-single-url');
    if (!input) return;
    const url = String(input.value || '').trim();
    if (!url) return;
    const existing = Array.isArray(this.state.aiVideo.queue) ? [...this.state.aiVideo.queue] : [];
    if (!existing.includes(url)) existing.unshift(url);
    chrome.runtime.sendMessage({ type: 'AI_VIDEO_SET_QUEUE', urls: existing }, (response) => {
      if (response?.success) {
        input.value = '';
        this.updateSingleVideoPreview();
        this.showToast('Added single video');
        this.refreshServiceStatus();
      } else {
        this.showToast(response?.error || 'Failed to add single video');
      }
    });
  }

  dedupeQueueText() {
    const queueInput = document.getElementById('ai-video-queue-input');
    if (!queueInput) return;
    const lines = String(queueInput.value || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    queueInput.value = Array.from(new Set(lines)).join('\n');
    this.showToast('Queue deduped');
  }

  cleanQueueText() {
    const queueInput = document.getElementById('ai-video-queue-input');
    if (!queueInput) return;
    const lines = String(queueInput.value || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const cleaned = lines.filter((line) =>
      /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=[\w-]{11}[\w=&-]*|youtu\.be\/[\w-]{11}[\w?=&-]*)/i.test(
        line
      )
    );
    queueInput.value = cleaned.join('\n');
    this.showToast('Removed invalid URLs');
  }

  async refreshAIVideoHistory() {
    chrome.runtime.sendMessage({ type: 'AI_VIDEO_GET_HISTORY' }, (response) => {
      const listEl = document.getElementById('ai-video-history-list');
      if (!listEl) return;
      if (!response?.success || !Array.isArray(response.reports) || response.reports.length === 0) {
        listEl.textContent = 'No processed videos yet';
        return;
      }
      listEl.innerHTML = response.reports
        .slice(0, 30)
        .map((report) => {
          const title = this.escapeHtml(String(report.title || 'Untitled'));
          const url = this.escapeHtml(String(report.url || ''));
          const level = this.escapeHtml(String(report.processingLevel || 'ai_studio'));
          const ts = Number(report.processedAt || Date.now());
          return `<div style="padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.08);">
            <div style="font-weight:600;">${title}</div>
            <div style="opacity:0.7; font-size:10px;">${level} • ${new Date(ts).toLocaleString()}</div>
            <div style="opacity:0.78; font-size:10px; word-break:break-all;">${url}</div>
          </div>`;
        })
        .join('');
    });
  }

  async clearAIVideoHistory() {
    chrome.runtime.sendMessage({ type: 'AI_VIDEO_CLEAR_HISTORY' }, (response) => {
      if (response?.success) {
        this.showToast('History cleared');
        this.refreshAIVideoHistory();
      } else {
        this.showToast('Failed to clear history');
      }
    });
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
    const statusEl = document.getElementById('service-ai-studio-status');
    const statusDot = statusEl?.querySelector('.status-dot');
    if (statusDot) {
      const account = String(this.state.aiVideo.account || 'None').trim();
      const connected = account !== '' && account !== 'None';
      statusDot.className = `status-dot ${connected ? 'connected' : 'disconnected'}`;
    }
    const authState = document.getElementById('ai-video-auth-state');
    if (authState) {
      const account = String(this.state.aiVideo.account || 'None').trim();
      authState.textContent = account !== 'None' && account ? account : 'Not authenticated';
    }
    this.updateAIVideoChannelTarget();

    const pState = this.state.aiVideo.processingState || {};
    const processingStatusEl = document.getElementById('ai-video-processing-status');
    const processingProgressEl = document.getElementById('ai-video-processing-progress');
    if (processingStatusEl) {
      processingStatusEl.textContent = pState.isProcessing
        ? pState.isPaused
          ? 'Paused'
          : 'Running'
        : 'Idle';
    }
    if (processingProgressEl) {
      processingProgressEl.textContent = `${pState.currentIndex || 0}/${pState.totalCount || 0}`;
    }

    const startBtn = document.getElementById('ai-video-start');
    const pauseBtn = document.getElementById('ai-video-pause');
    const resumeBtn = document.getElementById('ai-video-resume');
    const stopBtn = document.getElementById('ai-video-stop');
    if (startBtn) startBtn.disabled = !!pState.isProcessing && !pState.isPaused;
    if (pauseBtn) pauseBtn.disabled = !pState.isProcessing || !!pState.isPaused;
    if (resumeBtn) resumeBtn.disabled = !pState.isProcessing || !pState.isPaused;
    if (stopBtn) stopBtn.disabled = !pState.isProcessing;
  }

  updateAIVideoChannelTarget() {
    const targetEl = document.getElementById('ai-video-channel-target');
    if (!targetEl) return;
    const selected = String(this.state.selectedChannel || '').trim();
    if (!selected) {
      targetEl.textContent = 'Channel target: none selected (set in Central tab)';
      return;
    }
    targetEl.textContent = `Channel target: ${this.getChannelName(selected)}`;
  }

  async refreshAIVideoStats() {
    const stats = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'AI_VIDEO_GET_STATS' }, (response) => {
        resolve(response || null);
      });
    });
    if (!stats) return;

    this.state.aiVideo.account = stats.account || 'None';

    const processedEl = document.getElementById('ai-video-processed');
    const totalEl = document.getElementById('ai-video-total');
    const costEl = document.getElementById('ai-video-cost');
    const accountEl = document.getElementById('ai-video-account');

    if (processedEl) processedEl.textContent = String(stats.processed || 0);
    if (totalEl) totalEl.textContent = String(stats.total || 0);
    if (costEl) costEl.textContent = `$${Number(stats.cost || 0).toFixed(2)}`;
    if (accountEl) accountEl.textContent = String(stats.account || 'None');
  }

  async refreshAIVideoQueueAndPreferences() {
    const queueResponse = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'AI_VIDEO_GET_QUEUE' }, (response) => {
        resolve(response || null);
      });
    });

    if (!queueResponse?.success) return;

    const queueItems = Array.isArray(queueResponse.queue) ? queueResponse.queue : [];
    const queue = queueItems.map((item) => item?.url).filter(Boolean);
    this.state.aiVideo.queue = queue;
    this.state.aiVideo.queueCount = Number(queueResponse.queueCount || queue.length);
    this.state.aiVideo.reverseOrder = !!queueResponse.reverseOrder;
    this.state.aiVideo.segmentDuration = Number(queueResponse.segmentDuration || 45);
    this.state.aiVideo.processingState = queueResponse.processingState || {
      isProcessing: false,
      isPaused: false,
      currentIndex: 0,
      totalCount: 0,
    };

    const queueInput = document.getElementById('ai-video-queue-input');
    if (queueInput && !queueInput.matches(':focus')) {
      queueInput.value = queue.join('\n');
    }
    const reverseOrderInput = document.getElementById('ai-video-reverse-order');
    if (reverseOrderInput) reverseOrderInput.checked = this.state.aiVideo.reverseOrder;
    const segmentDurationInput = document.getElementById('ai-video-segment-duration');
    if (segmentDurationInput)
      segmentDurationInput.value = String(this.state.aiVideo.segmentDuration);

    chrome.storage.local.get(['processingLevel'], (result) => {
      this.state.aiVideo.processingLevel = result.processingLevel || 'ai_studio';
      const processingLevelInput = document.getElementById('ai-video-processing-level');
      if (processingLevelInput) {
        processingLevelInput.value = this.state.aiVideo.processingLevel;
        this.updateProcessingLevelDescription();
      }
    });
  }

  async loadState() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
        if (response) {
          this.state.connectionStatus = response.connectionStatus || 'disconnected';
          this.state.agents = response.agents || [];
          this.state.channels = response.channels || [];
          this.state.joinedChannels = response.joinedChannels || [];
          this.state.agentId = response.agentId || null;

          const responseSelected = response.selectedChannel || null;
          const settingsSelected = this.state.settings.popupSelectedChannel || null;
          this.state.selectedChannel = responseSelected || settingsSelected || null;

          if (typeof response.autoMonitor === 'boolean')
            this.state.settings.autoMonitor = response.autoMonitor;
          if (typeof response.autoMasterClock === 'boolean')
            this.state.settings.autoMasterClock = response.autoMasterClock;
          if (typeof response.autoWakePing === 'boolean')
            this.state.settings.autoWakePing = response.autoWakePing;
        }
        resolve();
      });
    });
  }

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['gemini_bridge_settings'], (result) => {
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

          const autoMonitor = document.getElementById('auto-monitor');
          if (autoMonitor) autoMonitor.checked = !!this.state.settings.autoMonitor;

          const autoMasterClock = document.getElementById('auto-master-clock');
          if (autoMasterClock) autoMasterClock.checked = !!this.state.settings.autoMasterClock;

          const autoWakePing = document.getElementById('auto-wake-ping');
          if (autoWakePing) autoWakePing.checked = !!this.state.settings.autoWakePing;

          if (!this.state.selectedChannel && this.state.settings.popupSelectedChannel) {
            this.state.selectedChannel = this.state.settings.popupSelectedChannel;
          }

          const aiviSegmentDuration = document.getElementById('aivi-segment-duration-settings');
          if (aiviSegmentDuration)
            aiviSegmentDuration.value = String(this.state.settings.aiviSegmentDuration || 45);
          const aiviConcurrent = document.getElementById('aivi-concurrent-processes');
          if (aiviConcurrent)
            aiviConcurrent.value = String(this.state.settings.aiviConcurrentProcesses || 1);
          const aiviAutoOpen = document.getElementById('aivi-auto-open-notebook');
          if (aiviAutoOpen) aiviAutoOpen.checked = !!this.state.settings.aiviAutoOpenNotebook;
          const aiviAutoAudio = document.getElementById('aivi-auto-audio-overview');
          if (aiviAutoAudio) aiviAutoAudio.checked = !!this.state.settings.aiviAutoAudioOverview;

          this.updateManagedSitesList();
        }
        resolve();
      });
    });
  }

  async saveSettings() {
    this.state.settings.aiviSegmentDuration = Math.max(
      1,
      Math.min(120, Number(document.getElementById('aivi-segment-duration-settings')?.value || 45))
    );
    this.state.settings.aiviConcurrentProcesses = 1;
    this.state.settings.aiviAutoOpenNotebook =
      !!document.getElementById('aivi-auto-open-notebook')?.checked;
    this.state.settings.aiviAutoAudioOverview = !!document.getElementById(
      'aivi-auto-audio-overview'
    )?.checked;

    await chrome.storage.local.set({ fuse_settings: this.state.settings });
    await chrome.storage.local.set({
      segmentDuration: this.state.settings.aiviSegmentDuration,
      concurrentProcesses: this.state.settings.aiviConcurrentProcesses,
      preferences: {
        segmentDuration: this.state.settings.aiviSegmentDuration,
        concurrentProcesses: this.state.settings.aiviConcurrentProcesses,
        autoOpenNotebook: this.state.settings.aiviAutoOpenNotebook,
        autoAudioOverview: this.state.settings.aiviAutoAudioOverview,
      },
    });
    chrome.runtime.sendMessage(
      {
        type: 'SET_AUTONOMY_SETTINGS',
        autoMonitor: !!this.state.settings.autoMonitor,
        autoMasterClock: !!this.state.settings.autoMasterClock,
        autoWakePing: !!this.state.settings.autoWakePing,
      },
      () => {
        // Best-effort; older background bundles may not support this message yet.
      }
    );
    this.showToast('Settings saved!');
  }

  async refreshAIVideoAccountSettings() {
    const settings = await chrome.storage.local.get(['userProfile', 'firstAuthAt']);
    const profile = settings.userProfile || {};
    const email = String(profile.email || this.state.aiVideo.account || '').trim();
    const emailEl = document.getElementById('settingsEmail');
    if (emailEl) emailEl.textContent = email || '-';
    const tierEl = document.getElementById('settingsTier');
    if (tierEl) tierEl.textContent = 'FREE';
    const memberSinceRaw = Number(profile.createdAt || settings.firstAuthAt || 0);
    const memberSinceEl = document.getElementById('settingsMemberSince');
    if (memberSinceEl) {
      memberSinceEl.textContent =
        Number.isFinite(memberSinceRaw) && memberSinceRaw > 0
          ? new Date(memberSinceRaw).toLocaleDateString()
          : '-';
    }
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
          if (this.state.messages.length > 120) {
            this.state.messages = this.state.messages.slice(0, 120);
          }
          this.updateMessageList();
          this.updateCentralControlPanel();
          break;

        case 'CHANNELS_UPDATE':
          this.state.channels = message.channels || [];
          this.reconcileSelectedChannel();
          this.updateCentralControlPanel();
          break;

        case 'JOINED_CHANNELS_UPDATE':
          this.state.joinedChannels = message.joinedChannels || [];
          this.updateCentralControlPanel();
          break;

        case 'CHANNEL_SELECTED':
          if (!this.state.selectedChannel && message.channelId) {
            this.state.selectedChannel = message.channelId;
            this.updateCentralControlPanel();
          }
          break;

        case 'AI_VIDEO_PROCESSING_UPDATE':
          this.state.aiVideo.processingState = message.state || this.state.aiVideo.processingState;
          this.updateServiceUI();
          this.refreshAIVideoStats();
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
    this.updateAutonomyStatusUI();
    this.updateQuickStartHelper();
    this.updateCentralControlPanel();
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

  setSelectedChannel(channelId) {
    this.state.selectedChannel = channelId;
    this.state.settings.popupSelectedChannel = channelId;
    const selected = this.state.channels.find((ch) => ch.id === channelId);
    if (selected?.name) {
      this.state.settings.popupSelectedChannelName = selected.name;
    }
    this.saveSettings();

    if (channelId) {
      chrome.runtime.sendMessage({
        type: 'CHANNEL_JOIN',
        channelId,
      });
    }

    this.updateCentralControlPanel();
  }

  createChannelFromPopup() {
    const input = document.getElementById('central-new-channel');
    if (!input) return;

    const normalizedName = input.value.trim().replace(/\s+/g, ' ');
    if (!normalizedName) return;

    const duplicate = this.state.channels.find(
      (ch) => ch.name?.trim().replace(/\s+/g, ' ').toLowerCase() === normalizedName.toLowerCase()
    );
    if (duplicate) {
      this.showToast(`Channel "${duplicate.name}" already exists`);
      this.setSelectedChannel(duplicate.id);
      input.value = '';
      return;
    }

    this.state.settings.popupSelectedChannelName = normalizedName;
    this.saveSettings();

    chrome.runtime.sendMessage(
      {
        type: 'CHANNEL_CREATE',
        name: normalizedName,
      },
      (response) => {
        if (response?.success && response.channel?.id) {
          this.showToast(`Channel "${normalizedName}" created`);
          this.setSelectedChannel(response.channel.id);
        } else if (response?.alreadyExists && response.channel?.id) {
          this.showToast(`Channel "${response.channel.name}" already exists`);
          this.setSelectedChannel(response.channel.id);
        } else {
          this.showToast(response?.error || 'Failed to create channel');
        }
      }
    );

    input.value = '';
  }

  normalizeChannelName(name) {
    return String(name || '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  reconcileSelectedChannel() {
    const selectedId = this.state.selectedChannel;
    if (selectedId && this.state.channels.some((ch) => ch.id === selectedId)) {
      return;
    }

    const preferredName = this.state.settings.popupSelectedChannelName;
    if (!preferredName) return;

    const normalized = this.normalizeChannelName(preferredName);
    const byName = this.state.channels.find(
      (ch) => this.normalizeChannelName(ch.name) === normalized
    );

    if (byName?.id) {
      this.state.selectedChannel = byName.id;
      this.state.settings.popupSelectedChannel = byName.id;
      this.saveSettings();
    }
  }

  sendCentralMessage() {
    const input = document.getElementById('central-chat-input');
    const messageText = (input?.value || '').trim();
    const channelId = this.state.selectedChannel;

    if (!channelId) {
      this.showToast('Select a channel first');
      return;
    }
    if (!messageText) return;

    chrome.runtime.sendMessage(
      {
        type: 'BROADCAST_MESSAGE',
        channel: channelId,
        content: messageText,
        senderId: this.state.agentId || undefined,
        metadata: {
          senderId: this.state.agentId || undefined,
          origin: 'popup-central-control',
        },
      },
      (response) => {
        if (response?.success) {
          this.showToast('Message sent');
        } else {
          this.showToast(response?.error || 'Failed to send message');
        }
      }
    );

    input.value = '';
  }

  getChannelName(channelId) {
    const found = this.state.channels.find((ch) => ch.id === channelId);
    return found?.name || channelId || 'No channel';
  }

  updateCentralControlPanel() {
    const channelSelect = document.getElementById('central-channel-select');
    const subtitle = document.getElementById('central-chat-subtitle');
    const stream = document.getElementById('central-chat-stream');

    const channels = Array.isArray(this.state.channels) ? this.state.channels : [];
    if (channelSelect) {
      const options = ['<option value="">Select channel...</option>']
        .concat(
          channels.map(
            (ch) =>
              `<option value="${ch.id}" ${ch.id === this.state.selectedChannel ? 'selected' : ''}>${ch.name}</option>`
          )
        )
        .join('');
      channelSelect.innerHTML = options;
      if (this.state.selectedChannel) {
        channelSelect.value = this.state.selectedChannel;
      }
    }

    if (subtitle) {
      subtitle.textContent = this.state.selectedChannel
        ? `Channel: ${this.getChannelName(this.state.selectedChannel)}`
        : 'No channel selected';
    }
    this.updateAIVideoChannelTarget();

    if (!stream) return;

    const selectedChannel = this.state.selectedChannel;
    if (!selectedChannel) {
      stream.innerHTML = `
        <div class="empty-state small">
          <p>Select a channel to view stream</p>
        </div>
      `;
      return;
    }

    const filtered = this.state.messages
      .filter((msg) => msg?.channel === selectedChannel)
      .slice(0, 25)
      .reverse();

    if (filtered.length === 0) {
      stream.innerHTML = `
        <div class="empty-state small">
          <p>No messages in ${this.getChannelName(selectedChannel)}</p>
        </div>
      `;
      return;
    }

    stream.innerHTML = filtered
      .map(
        (msg) => `
        <div class="central-chat-message">
          <div class="central-chat-message-header">
            <span class="central-chat-from">${msg.from || 'Unknown'}</span>
            <span class="central-chat-meta">${this.formatTime(msg.timestamp)}</span>
          </div>
          <div class="central-chat-content">${this.escapeHtml(this.truncate(msg.content || '', 500))}</div>
        </div>
      `
      )
      .join('');

    stream.scrollTop = stream.scrollHeight;
  }

  escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
    const result = await chrome.storage.local.get(['gemini_bridge_logs']);
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
  new GeminiBridgePopup();
});

/******/ })()
;
//# sourceMappingURL=popup.js.map
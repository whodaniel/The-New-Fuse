/**
 * The New Fuse Chrome Extension - Options Page Controller
 */

class TNFOptions {
  constructor() {
    this.settings = {
      relayUrl: 'http://localhost:3000',
      wsPort: 3000,
      autoConnect: true,
      autoReconnect: true,
      maxReconnectAttempts: 10,
      agentName: 'TNF Chrome Bridge',
      agentIdPrefix: 'chrome-bridge',
      capabilities: 'web-bridge, ai-detection, text-injection, response-capture',
      showBadge: true,
      notifications: true,
      panelPosition: 'top-right',
      minimizedByDefault: false,
      logLevel: 'info',
      historyLimit: 100,
      enableTelemetry: false,
      devMode: false,
    };

    this.originalSettings = null;
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.applyToUI();
    this.setupEventListeners();
    this.updateVersion();
  }

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['tnfSettings'], (result) => {
        if (result.tnfSettings) {
          this.settings = { ...this.settings, ...result.tnfSettings };
        }
        this.originalSettings = JSON.stringify(this.settings);
        resolve();
      });
    });
  }

  async saveSettings() {
    // Read from UI
    this.readFromUI();

    return new Promise((resolve) => {
      chrome.storage.sync.set({ tnfSettings: this.settings }, () => {
        this.originalSettings = JSON.stringify(this.settings);
        this.showToast('Settings saved successfully!');
        resolve();
      });
    });
  }

  readFromUI() {
    const getVal = (id) => {
      const el = document.getElementById(id);
      if (!el) return undefined;
      if (el.type === 'checkbox') return el.checked;
      if (el.type === 'number') return parseInt(el.value) || 0;
      return el.value;
    };

    this.settings.relayUrl = getVal('relayUrl') || this.settings.relayUrl;
    this.settings.wsPort = getVal('wsPort') || this.settings.wsPort;
    this.settings.autoConnect = getVal('autoConnect');
    this.settings.autoReconnect = getVal('autoReconnect');
    this.settings.maxReconnectAttempts = getVal('maxReconnectAttempts');
    this.settings.agentName = getVal('agentName') || this.settings.agentName;
    this.settings.agentIdPrefix = getVal('agentIdPrefix') || this.settings.agentIdPrefix;
    this.settings.capabilities = getVal('capabilities') || this.settings.capabilities;
    this.settings.showBadge = getVal('showBadge');
    this.settings.notifications = getVal('notifications');
    this.settings.panelPosition = getVal('panelPosition');
    this.settings.minimizedByDefault = getVal('minimizedByDefault');
    this.settings.logLevel = getVal('logLevel');
    this.settings.historyLimit = getVal('historyLimit');
    this.settings.enableTelemetry = getVal('enableTelemetry');
    this.settings.devMode = getVal('devMode');
  }

  applyToUI() {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = val;
      else el.value = val;
    };

    setVal('relayUrl', this.settings.relayUrl);
    setVal('wsPort', this.settings.wsPort);
    setVal('autoConnect', this.settings.autoConnect);
    setVal('autoReconnect', this.settings.autoReconnect);
    setVal('maxReconnectAttempts', this.settings.maxReconnectAttempts);
    setVal('agentName', this.settings.agentName);
    setVal('agentIdPrefix', this.settings.agentIdPrefix);
    setVal('capabilities', this.settings.capabilities);
    setVal('showBadge', this.settings.showBadge);
    setVal('notifications', this.settings.notifications);
    setVal('panelPosition', this.settings.panelPosition);
    setVal('minimizedByDefault', this.settings.minimizedByDefault);
    setVal('logLevel', this.settings.logLevel);
    setVal('historyLimit', this.settings.historyLimit);
    setVal('enableTelemetry', this.settings.enableTelemetry);
    setVal('devMode', this.settings.devMode);
  }

  setupEventListeners() {
    document.getElementById('saveSettings')?.addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('discardChanges')?.addEventListener('click', () => {
      if (this.originalSettings) {
        this.settings = JSON.parse(this.originalSettings);
        this.applyToUI();
        this.showToast('Changes discarded');
      }
    });

    document.getElementById('exportSettings')?.addEventListener('click', () => {
      this.readFromUI();
      const content = JSON.stringify(this.settings, null, 2);
      this.downloadFile('tnf-settings.json', content);
    });

    document.getElementById('importSettings')?.addEventListener('click', () => {
      this.importSettings();
    });

    document.getElementById('clearHistory')?.addEventListener('click', () => {
      if (confirm('Clear all message history?')) {
        chrome.storage.local.remove(['messageHistory', 'activityLog'], () => {
          this.showToast('History cleared');
        });
      }
    });

    document.getElementById('resetAll')?.addEventListener('click', () => {
      if (confirm('Reset all settings to defaults? This cannot be undone.')) {
        chrome.storage.sync.remove('tnfSettings', () => {
          location.reload();
        });
      }
    });
  }

  importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const text = await file.text();
          const imported = JSON.parse(text);
          this.settings = { ...this.settings, ...imported };
          this.applyToUI();
          await this.saveSettings();
          this.showToast('Settings imported!');
        } catch (err) {
          this.showToast('Invalid settings file');
        }
      }
    };
    input.click();
  }

  updateVersion() {
    const versionEl = document.getElementById('version');
    if (versionEl) {
      versionEl.textContent = chrome.runtime.getManifest().version;
    }
  }

  showToast(message) {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = message;
      toast.classList.add('visible');
      setTimeout(() => toast.classList.remove('visible'), 3000);
    }
  }

  downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.tnfOptions = new TNFOptions();
});

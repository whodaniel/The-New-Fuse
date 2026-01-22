/**
 * Enhanced Popup UI for Element Selection and AI Integration
 * Enhanced with TNF Relay integration features
 */

import { ElementInfo, PageElementMapping } from '../content/element-selector.ts';
import { Logger } from '../utils/logger.ts';
import { TNFMessageFormatter } from '../utils/tnf-message-formatter.ts';

export class ElementSelectionManager {
  private logger: Logger;
  private currentPageMapping: PageElementMapping | null = null;

  // Enhanced TNF Relay properties
  private sessionId: string;
  private connectionAttempts: number = 0;
  private lastActivity: string = new Date().toISOString();
  private enhancedLogging: boolean = true;
  private autoDetectPlatform: boolean = true;

  constructor() {
    this.logger = new Logger({
      name: 'ElementSelection',
      level: 'info',
      saveToStorage: true,
    });

    // Enhanced TNF Relay initialization
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.updateLastActivity();

    this.initialize();
  }

  public initialize(): void {
    console.log('[TNF Debug] Initializing ElementSelectionManager...');

    try {
      this.setupElementSelectionUI();
      this.updateCurrentURL();
      this.updateElementStatusDisplay();

      // Load page mapping without triggering background communication
      setTimeout(() => {
        this.loadCurrentPageMapping().catch((error) => {
          console.log('[TNF Debug] Failed to load page mapping:', error);
        });
      }, 100);

      // Enhanced TNF Relay initialization (delayed to avoid connection issues)
      if (this.autoDetectPlatform) {
        setTimeout(() => {
          this.performEnhancedPlatformDetection().catch((error) => {
            console.log('[TNF Debug] Platform detection failed:', error);
          });
        }, 500);
      }

      console.log('[TNF Debug] ElementSelectionManager initialized successfully');
    } catch (error) {
      console.error('[TNF Debug] ElementSelectionManager initialization failed:', error);
    }
  }

  // Enhanced TNF Relay utility methods
  private updateLastActivity(): void {
    this.lastActivity = new Date().toISOString();
  }

  private enhancedLog(
    message: string,
    level: 'debug' | 'info' | 'warn' | 'error' | 'success' = 'info',
    category: string = 'general',
    metadata?: any
  ): void {
    this.updateLastActivity();

    // Use existing logger first (always works)
    this.logger[level === 'success' ? 'info' : level](message, metadata);

    // Try enhanced logging only if enabled, but don't block on failures
    if (this.enhancedLogging) {
      try {
        const logEntry = TNFMessageFormatter.createLogEntry(message, level, category, {
          ...metadata,
          sessionId: this.sessionId,
          timestamp: this.lastActivity,
        });

        // Send to background for enhanced tracking (fire and forget)
        if (chrome?.runtime?.sendMessage) {
          chrome.runtime
            .sendMessage({
              type: 'tnf_enhanced_log',
              log: logEntry,
            })
            .catch(() => {
              // Silently ignore - background might not be ready
            });
        }
      } catch (error) {
        // Silently ignore enhanced logging failures
        console.debug('[TNF Debug] Enhanced logging skipped:', error.message);
      }
    }
  }

  private async performEnhancedPlatformDetection(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.url) {
        // Use URL for detection since we're in popup context
        const detectionResult = this.detectPlatformFromURL(tabs[0].url);
        if (detectionResult.confidence > 0.5) {
          this.enhancedLog(
            `Auto-detected platform: ${detectionResult.platform} (confidence: ${Math.round(detectionResult.confidence * 100)}%)`,
            'info',
            'platform',
            detectionResult.details
          );

          // Update UI with detected platform
          this.updatePlatformDisplay(detectionResult.platform, detectionResult.confidence);
        }
      }
    } catch (error) {
      this.enhancedLog(`Platform detection failed: ${error}`, 'error', 'platform');
    }
  }

  private detectPlatformFromURL(url: string): {
    platform: string;
    confidence: number;
    details: any;
  } {
    const hostname = new URL(url).hostname;

    const platformDetectors = [
      {
        name: 'ChatGPT',
        pattern: /chat(gpt)?\.openai\.com/i,
        confidence: 0.95,
      },
      {
        name: 'Claude',
        pattern: /claude\.ai/i,
        confidence: 0.95,
      },
      {
        name: 'Gemini',
        pattern: /gemini\.google\.com/i,
        confidence: 0.9,
      },
      {
        name: 'Perplexity',
        pattern: /perplexity\.ai/i,
        confidence: 0.85,
      },
      {
        name: 'Character.AI',
        pattern: /character\.ai/i,
        confidence: 0.8,
      },
    ];

    for (const detector of platformDetectors) {
      if (detector.pattern.test(url) || detector.pattern.test(hostname)) {
        return {
          platform: detector.name,
          confidence: detector.confidence,
          details: {
            url,
            hostname,
            detectedAt: new Date().toISOString(),
            sessionId: this.sessionId,
          },
        };
      }
    }

    return {
      platform: 'Unknown',
      confidence: 0.1,
      details: { url, hostname, detectedAt: new Date().toISOString() },
    };
  }

  private updatePlatformDisplay(platform: string, confidence: number): void {
    // Update the existing status indicator
    const statusElement = document.getElementById('element-status-text');
    if (statusElement) {
      statusElement.textContent = `Platform: ${platform} (${Math.round(confidence * 100)}%)`;
    }
  }

  private async sendEnhancedMessageToClaudeDesktop(message: string, context: any): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const messageContext = {
        timestamp: new Date().toISOString(),
        source: 'tnf_chrome_extension',
        target: 'claude_desktop',
        platform: context.platform || 'Unknown',
        url: tabs[0]?.url,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
      };

      const formattedMessage = TNFMessageFormatter.formatForClaudeDesktop(message, messageContext);

      // Send via background script
      chrome.runtime.sendMessage({
        type: 'tnf_send_to_claude_desktop',
        message: formattedMessage,
        originalMessage: message,
        context: messageContext,
      });

      this.enhancedLog(
        'Message sent to Claude Desktop with enhanced formatting',
        'success',
        'chat',
        {
          messageLength: message.length,
          platform: context.platform,
        }
      );
    } catch (error) {
      this.enhancedLog(`Failed to send enhanced message: ${error}`, 'error', 'chat');
    }
  }

  /**
   * Toggle floating panel visibility
   */
  private async toggleFloatingPanel(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]?.id) {
        throw new Error('No active tab found');
      }

      // Send message to content script to toggle floating panel
      const response = await this.safeSendMessageToTab(tabs[0].id, {
        type: 'TOGGLE_FLOATING_PANEL',
      });

      if (response?.success) {
        this.showNotification(
          response.visible
            ? 'Floating panel activated! Check the page for the overlay interface.'
            : 'Floating panel hidden.',
          'success'
        );
      } else {
        this.showNotification('Failed to toggle floating panel', 'error');
      }
    } catch (error) {
      this.logger.error('Failed to toggle floating panel:', error);
      this.showNotification('Floating panel toggle failed', 'error');
    }
  }

  /**
   * Setup the element selection interface
   */
  private setupElementSelectionUI(): void {
    // This method does not create new UI since the HTML already exists
    // It just sets up event listeners for the existing UI
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for element selection UI
   */
  private setupEventListeners(): void {
    console.log('[TNF Debug] Setting up event listeners...');

    // Auto-detection
    const autoDetectBtn = document.getElementById('auto-detect-btn');
    if (autoDetectBtn) {
      autoDetectBtn.addEventListener('click', () => {
        console.log('[TNF Debug] Auto-detect button clicked');
        this.autoDetectElements();
      });
      console.log('[TNF Debug] Auto-detect button listener attached');
    }

    // Validation
    const validateBtn = document.getElementById('validate-btn');
    if (validateBtn) {
      validateBtn.addEventListener('click', () => {
        console.log('[TNF Debug] Validate button clicked');
        this.validateElements();
      });
    }

    // Manual selection buttons - use actual IDs from HTML
    const selectInputBtn = document.getElementById('select-input-btn');
    if (selectInputBtn) {
      selectInputBtn.addEventListener('click', () => this.startElementSelection('input'));
    }

    const selectButtonBtn = document.getElementById('select-button-btn');
    if (selectButtonBtn) {
      selectButtonBtn.addEventListener('click', () => this.startElementSelection('button'));
    }

    const selectOutputBtn = document.getElementById('select-output-btn');
    if (selectOutputBtn) {
      selectOutputBtn.addEventListener('click', () => this.startElementSelection('output'));
    }

    // AI Integration buttons
    const toggleFloatingPanelBtn = document.getElementById('toggle-floating-panel-btn');
    if (toggleFloatingPanelBtn) {
      toggleFloatingPanelBtn.addEventListener('click', () => this.toggleFloatingPanel());
    }

    // AI Session buttons - use actual IDs from HTML
    const startSessionBtn = document.getElementById('start-session-btn');
    if (startSessionBtn) {
      startSessionBtn.addEventListener('click', () => this.startAISession());
    }

    const endSessionBtn = document.getElementById('end-session-btn');
    if (endSessionBtn) {
      endSessionBtn.addEventListener('click', () => this.endAISession());
    }

    // WebSocket connection buttons
    const websocketConnectBtn = document.getElementById('websocket-connect-btn');
    if (websocketConnectBtn) {
      websocketConnectBtn.addEventListener('click', () => this.connectWebSocket());
    }

    const websocketDisconnectBtn = document.getElementById('websocket-disconnect-btn');
    if (websocketDisconnectBtn) {
      websocketDisconnectBtn.addEventListener('click', () => this.disconnectWebSocket());
    }

    // Listen for element selection results
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'ELEMENT_SELECTED') {
        this.handleElementSelected(message.elementType, message.elementInfo, message.pageMapping);
      } else if (message.type === 'ELEMENT_MAPPING_DETECTED') {
        this.currentPageMapping = message.mapping;
        this.updateMappingDisplay();
      }
    });
  }

  /**
   * Auto-detect elements on current page
   */
  private async autoDetectElements(): Promise<void> {
    this.showStatus('Detecting elements...', 'loading');

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]?.id) {
        throw new Error('No active tab found');
      }

      const response = await chrome.tabs.sendMessage(tabs[0].id, {
        type: 'AUTO_DETECT_ELEMENTS',
      });

      if (response.success) {
        this.currentPageMapping = response.mapping;
        this.updateMappingDisplay();
        this.showStatus('Elements detected successfully!', 'success');

        // Check relay connection after successful detection
        this.checkRelayConnection();
      } else {
        this.showStatus('No elements detected', 'warning');
      }
    } catch (error) {
      this.logger.error('Auto-detection failed:', error);
      this.showStatus('Detection failed', 'error');
    }
  }

  /**
   * Validate current element mapping
   */
  private async validateElements(): Promise<void> {
    if (!this.currentPageMapping) {
      this.showStatus('No mapping to validate', 'warning');
      return;
    }

    this.showStatus('Validating elements...', 'loading');

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]?.id) {
        throw new Error('No active tab found');
      }

      const response = await chrome.tabs.sendMessage(tabs[0].id, {
        type: 'VALIDATE_ELEMENT_MAPPING',
      });

      if (response.success) {
        const validation = response.validation;

        if (validation.valid) {
          this.showStatus('All elements valid!', 'success');
        } else {
          this.showStatus(`Issues found: ${validation.issues.join(', ')}`, 'warning');
        }
      } else {
        this.showStatus('Validation failed', 'error');
      }
    } catch (error) {
      this.logger.error('Validation failed:', error);
      this.showStatus('Validation error', 'error');
    }
  }

  /**
   * Start element selection mode
   */
  private async startElementSelection(elementType: string): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]?.id) {
        throw new Error('No active tab found');
      }

      // Close popup and enter selection mode
      window.close();

      await chrome.tabs.sendMessage(tabs[0].id, {
        type: 'ENTER_ELEMENT_SELECTION_MODE',
        payload: { elementType },
      });
    } catch (error) {
      this.logger.error('Failed to start element selection:', error);
      this.showNotification('Failed to start selection mode', 'error');
    }
  }

  /**
   * Handle element selection result
   */
  private handleElementSelected(
    elementType: string,
    elementInfo: ElementInfo,
    pageMapping: PageElementMapping
  ): void {
    this.currentPageMapping = pageMapping;
    this.updateMappingDisplay();
    this.showNotification(`${elementType} selected successfully!`, 'success');
  }

  /**
   * Start AI session
   */
  private async startAISession(): Promise<void> {
    if (
      !this.currentPageMapping?.chatInput ||
      !this.currentPageMapping?.sendButton ||
      !this.currentPageMapping?.chatOutput
    ) {
      this.showNotification(
        'All elements must be configured before starting AI session',
        'warning'
      );
      return;
    }

    try {
      // Check relay connection first
      const relayStatus = await this.checkRelayConnection();
      if (!relayStatus.connected) {
        this.showNotification('TNF Relay connection required for AI session', 'error');
        return;
      }

      // Start AI session
      const response = await this.safeSendMessage({
        type: 'START_AI_SESSION',
        mapping: this.currentPageMapping,
      });

      if (response?.success) {
        this.showNotification(
          'AI session started! You can now use voice commands and automation.',
          'success'
        );
        this.updateAIStatus('active');
      } else {
        this.showNotification('Failed to start AI session', 'error');
      }
    } catch (error) {
      this.logger.error('Failed to start AI session:', error);
      this.showNotification('AI session startup failed', 'error');
    }
  }

  /**
   * End AI session
   */
  private async endAISession(): Promise<void> {
    try {
      const response = await this.safeSendMessage({
        type: 'END_AI_SESSION',
      });

      if (response?.success) {
        this.showNotification('AI session ended', 'success');
        this.updateAIStatus('inactive');
        this.enhancedLog('AI session ended successfully', 'success', 'session');
      } else {
        this.showNotification('Failed to end AI session', 'error');
      }
    } catch (error) {
      this.logger.error('Failed to end AI session:', error);
      this.showNotification('AI session shutdown failed', 'error');
      this.enhancedLog(`AI session shutdown failed: ${error}`, 'error', 'session');
    }
  }

  /**
   * Connect WebSocket
   */
  private async connectWebSocket(): Promise<void> {
    try {
      this.connectionAttempts++;
      this.updateLastActivity();

      this.enhancedLog(
        `WebSocket connection attempt #${this.connectionAttempts}`,
        'info',
        'websocket'
      );

      const response = await this.safeSendMessage({
        type: 'WEBSOCKET_CONNECT',
      });

      if (response?.success) {
        this.showNotification('WebSocket connected', 'success');
        this.updateWebSocketStatus('connected');
        this.enhancedLog('WebSocket connected successfully', 'success', 'websocket');
      } else {
        this.showNotification('Failed to connect WebSocket', 'error');
        this.enhancedLog(
          `WebSocket connection failed: ${response?.error || 'Unknown error'}`,
          'error',
          'websocket'
        );
      }
    } catch (error) {
      this.logger.error('WebSocket connection failed:', error);
      this.showNotification('WebSocket connection error', 'error');
      this.enhancedLog(`WebSocket connection error: ${error}`, 'error', 'websocket');
    }
  }

  /**
   * Disconnect WebSocket
   */
  private async disconnectWebSocket(): Promise<void> {
    try {
      this.updateLastActivity();
      this.enhancedLog('Disconnecting WebSocket', 'info', 'websocket');

      const response = await this.safeSendMessage({
        type: 'WEBSOCKET_DISCONNECT',
      });

      if (response?.success) {
        this.showNotification('WebSocket disconnected', 'success');
        this.updateWebSocketStatus('disconnected');
        this.enhancedLog('WebSocket disconnected successfully', 'success', 'websocket');
      } else {
        this.showNotification('Failed to disconnect WebSocket', 'error');
        this.enhancedLog(
          `WebSocket disconnect failed: ${response?.error || 'Unknown error'}`,
          'error',
          'websocket'
        );
      }
    } catch (error) {
      this.logger.error('WebSocket disconnect failed:', error);
      this.showNotification('WebSocket disconnect error', 'error');
      this.enhancedLog(`WebSocket disconnect error: ${error}`, 'error', 'websocket');
    }
  }

  /**
   * Update WebSocket status display
   */
  private updateWebSocketStatus(status: 'connected' | 'disconnected' | 'connecting'): void {
    const statusElement = document.getElementById('websocket-status');
    if (statusElement) {
      statusElement.textContent =
        status === 'connected'
          ? 'Connected'
          : status === 'connecting'
            ? 'Connecting...'
            : 'Disconnected';
      statusElement.className = `status-value ${status === 'connected' ? 'online' : 'offline'}`;
    }

    // Also update connection status light
    const connectionStatus = document.getElementById('connection-status');
    if (connectionStatus) {
      if (status === 'connected') {
        connectionStatus.classList.add('connected');
        connectionStatus.title = 'Connected';
      } else {
        connectionStatus.classList.remove('connected');
        connectionStatus.title = 'Disconnected';
      }
    }
  }

  /**
   * Check relay connection
   */
  private async checkRelayConnection(): Promise<{ connected: boolean; status: string }> {
    const relayStatusEl = document.getElementById('relay-status');

    try {
      // Check if TNF Relay is running
      const response = await this.safeSendMessage({
        type: 'CHECK_RELAY_CONNECTION',
      });

      const status = response?.connected ? 'Connected' : 'Disconnected';
      const connected = response?.connected || false;

      if (relayStatusEl) {
        relayStatusEl.textContent = status;
        relayStatusEl.className = `status-value ${connected ? 'connected' : 'disconnected'}`;
      }

      return { connected, status };
    } catch (error) {
      if (relayStatusEl) {
        relayStatusEl.textContent = 'Error';
        relayStatusEl.className = 'status-value error';
      }
      return { connected: false, status: 'Error' };
    }
  }

  /**
   * Update AI status display
   */
  private updateAIStatus(status: 'inactive' | 'active' | 'error'): void {
    const aiModelsStatus = document.getElementById('ai-models-status');
    if (aiModelsStatus) {
      switch (status) {
        case 'active':
          aiModelsStatus.textContent = 'AI Session Active';
          aiModelsStatus.className = 'status-value connected';
          break;
        case 'error':
          aiModelsStatus.textContent = 'AI Error';
          aiModelsStatus.className = 'status-value error';
          break;
        default:
          aiModelsStatus.textContent = 'Inactive';
          aiModelsStatus.className = 'status-value disconnected';
      }
    }
  }

  /**
   * Update current URL display
   */
  private async updateCurrentURL(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];

      if (currentTab?.url) {
        const urlElement = document.getElementById('current-url');
        if (urlElement) {
          const url = new URL(currentTab.url);
          urlElement.textContent = `${url.hostname}${url.pathname}`;
          urlElement.title = currentTab.url;
        }
      }
    } catch (error) {
      this.logger.error('Failed to get current URL:', error);
      const urlElement = document.getElementById('current-url');
      if (urlElement) {
        urlElement.textContent = 'Unable to detect current page';
      }
    }
  }

  /**
   * Show status in the status area
   */
  private showStatus(
    message: string,
    type: 'success' | 'error' | 'warning' | 'loading' | 'unknown'
  ): void {
    const statusIndicator = document.getElementById('element-status-indicator');
    const statusText = document.getElementById('element-status-text');

    if (statusIndicator) {
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        loading: '🔄',
        unknown: '❓',
      };
      statusIndicator.textContent = icons[type];
      statusIndicator.className = `status-indicator ${type}`;
    }

    if (statusText) {
      statusText.textContent = message;
    }
  }

  /**
   * Show notification to user
   */
  private showNotification(
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
  ): void {
    const logLevel = type === 'warning' ? 'warn' : type;
    this.enhancedLog(message, logLevel, 'notification');

    // For now, use console log and could be extended to show UI notifications
    const typeStyles = {
      success: 'color: #28a745; font-weight: bold;',
      error: 'color: #dc3545; font-weight: bold;',
      warning: 'color: #ffc107; font-weight: bold;',
      info: 'color: #007bff; font-weight: bold;',
    };

    console.log(`%c[TNF Notification - ${type.toUpperCase()}] ${message}`, typeStyles[type]);
  }

  /**
   * Update element status display
   */
  private updateElementStatusDisplay(): void {
    const statusDisplay = document.getElementById('element-status-display');
    if (!statusDisplay) return;

    const hasInput = this.currentPageMapping?.chatInput;
    const hasButton = this.currentPageMapping?.sendButton;
    const hasOutput = this.currentPageMapping?.chatOutput;

    statusDisplay.innerHTML = `
      <div>Input Field: <span class="status-indicator ${hasInput ? 'success' : 'failure'}">●</span></div>
      <div>Send Button: <span class="status-indicator ${hasButton ? 'success' : 'failure'}">●</span></div>
      <div>Output Area: <span class="status-indicator ${hasOutput ? 'success' : 'failure'}">●</span></div>
    `;
  }

  /**
   * Update mapping display
   */
  private updateMappingDisplay(): void {
    this.updateElementStatusDisplay();
    // Log the current mapping state
    this.enhancedLog(
      `Mapping updated: Input=${!!this.currentPageMapping?.chatInput}, Button=${!!this.currentPageMapping?.sendButton}, Output=${!!this.currentPageMapping?.chatOutput}`,
      'info',
      'mapping'
    );
  }

  /**
   * Load current page mapping from storage
   */
  private async loadCurrentPageMapping(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]?.url) {
        this.enhancedLog('No active tab found', 'warn', 'mapping');
        return;
      }

      const url = new URL(tabs[0].url);
      const domain = url.hostname;

      // Try to load existing mapping for this domain
      const result = await chrome.storage.local.get([`mapping_${domain}`]);
      const mapping = result[`mapping_${domain}`];

      if (mapping) {
        this.currentPageMapping = mapping;
        this.enhancedLog(`Loaded existing mapping for ${domain}`, 'info', 'mapping');
        this.updateMappingDisplay();
      } else {
        this.enhancedLog(`No existing mapping found for ${domain}`, 'info', 'mapping');
      }
    } catch (error) {
      this.logger.error('Failed to load page mapping:', error);
      this.enhancedLog(`Failed to load page mapping: ${error}`, 'error', 'mapping');
    }
  }

  /**
   * Safely send message to background script with error handling
   */
  private async safeSendMessage(message: any): Promise<any> {
    try {
      // Check if chrome.runtime is available
      if (!chrome?.runtime?.sendMessage) {
        console.warn('[TNF Debug] Chrome runtime not available');
        return { success: false, error: 'Runtime not available' };
      }

      return await chrome.runtime.sendMessage(message);
    } catch (error) {
      this.logger.warn('Failed to communicate with background script:', error);
      console.warn('[TNF Debug] Background script communication failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Safely send message to content script with error handling
   */
  private async safeSendMessageToTab(tabId: number, message: any): Promise<any> {
    try {
      // Check if chrome.tabs is available
      if (!chrome?.tabs?.sendMessage) {
        console.warn('[TNF Debug] Chrome tabs API not available');
        return { success: false, error: 'Tabs API not available' };
      }

      return await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
      this.logger.warn('Failed to communicate with content script:', error);
      console.warn('[TNF Debug] Content script communication failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Initialize the ElementSelectionManager when the popup loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('[TNF Debug] DOM loaded, initializing ElementSelectionManager...');
  new ElementSelectionManager();
});

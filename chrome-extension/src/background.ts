/**
 * Enhanced Background Script with TNF Relay Integration
 * Supports AI-powered browser automation and element selection
 */

import { WebSocketManager } from './utils/websocket-manager';
import { FileTransferManager } from './utils/file-transfer';
import { Logger } from './utils/logger';
import { ConnectionStatusMessage } from './shared-protocol';

// Initialize a background-specific logger
const backgroundLogger = new Logger({
  name: 'Background',
  level: 'info',
  saveToStorage: true
});

// Initialize managers
let webSocketManager: WebSocketManager;
let fileTransferManager: FileTransferManager;
let tnfRelayConnection: TNFRelayConnection | null = null;

// Selection mode state management
interface SelectionState {
  isActive: boolean;
  targetElement: 'input' | 'button' | 'output' | null;
  tabId: number | null;
  currentMapping: PageElementMapping | null;
}

interface PageElementMapping {
  chatInput?: ElementInfo;
  sendButton?: ElementInfo;
  chatOutput?: ElementInfo;
  messageContainer?: ElementInfo;
  timestamp: number;
  url: string;
  domain: string;
}

interface ElementInfo {
  selector: string;
  xpath: string;
  tag: string;
  id?: string;
  classes: string[];
  text: string;
  placeholder?: string;
  type?: string;
  role?: string;
  ariaLabel?: string;
  position: { x: number; y: number; width: number; height: number };
  isVisible: boolean;
  isInteractable: boolean;
  confidence: number;
  elementType: 'input' | 'button' | 'output' | 'unknown';
}

let selectionState: SelectionState = {
  isActive: false,
  targetElement: null,
  tabId: null,
  currentMapping: null
};

// TNF Relay Connection Manager
class TNFRelayConnection {
  private logger: Logger;
  private wsConnection: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private isConnected: boolean = false;
  private aiSessionActive: boolean = false;
  private currentPageMapping: any = null;

  constructor() {
    this.logger = new Logger({
      name: 'TNFRelay',
      level: 'info',
      saveToStorage: true
    });
  }

  async connect(relayUrl?: string): Promise<boolean> {
    try {
      // Get relay configuration
      const config = await this.getRelayConfig();
      const url = relayUrl || config.relayUrl || 'ws://localhost:3000';
      
      this.logger.info(`Connecting to TNF Relay at ${url}`);
      
      this.wsConnection = new WebSocket(url);
      
      this.wsConnection.onopen = () => {
        this.logger.info('Connected to TNF Relay');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.sendRelayMessage('REGISTER', {
          type: 'chrome_extension',
          capabilities: ['element_selection', 'ai_automation', 'page_interaction']
        });
      };

      this.wsConnection.onmessage = (event) => {
        this.handleRelayMessage(JSON.parse(event.data));
      };

      this.wsConnection.onclose = () => {
        this.logger.warn('TNF Relay connection closed');
        this.isConnected = false;
        this.attemptReconnect();
      };

      this.wsConnection.onerror = (error) => {
        this.logger.error('TNF Relay connection error:', error);
        this.isConnected = false;
      };

      return true;
    } catch (error) {
      this.logger.error('Failed to connect to TNF Relay:', error);
      return false;
    }
  }

  private async getRelayConfig(): Promise<any> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['relayUrl', 'relayPort'], (result) => {
        resolve({
          relayUrl: result.relayUrl || 'ws://localhost:3000',
          relayPort: result.relayPort || 3000
        });
      });
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      this.logger.info(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      this.logger.error('Max reconnection attempts reached');
    }
  }

  private sendRelayMessage(type: string, payload: any): void {
    if (this.wsConnection && this.isConnected) {
      const message = {
        id: Date.now().toString(),
        type: type,
        source: 'chrome_extension',
        timestamp: new Date().toISOString(),
        payload: payload
      };
      
      this.wsConnection.send(JSON.stringify(message));
      this.logger.info(`Sent relay message: ${type}`);
    }
  }

  private async handleRelayMessage(message: any): Promise<void> {
    this.logger.info('Received relay message:', message.type);
    
    try {
        if (message.type === 'MCP_REQUEST') {
            const { toolName, parameters } = message.payload;
            const context = { tabId: null }; // tabId will be set in executeTool

            const result = await browserAgent.executeTool(toolName, parameters, context);
            this.sendRelayMessage('MCP_RESPONSE', { success: true, result });
        } else {
            this.logger.warn('Unknown relay message type:', message.type);
        }
    } catch (error) {
      this.logger.error('Error handling relay message:', error);
      this.sendRelayMessage('ERROR', { 
        originalMessageId: message.id, 
        error: (error as Error).message 
      });
    }
  }

  private async handleAIAutomationRequest(payload: any): Promise<void> {
    const { action, parameters, targetTabId } = payload;
    
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tabId = targetTabId || tabs[0]?.id;
      
      if (!tabId) {
        throw new Error('No target tab available');
      }

      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'EXECUTE_AI_ACTION',
        payload: { action, parameters }
      });

      this.sendRelayMessage('AI_AUTOMATION_RESPONSE', {
        success: response.success,
        result: response.result || null,
        error: response.error || null
      });
    } catch (error) {
      this.sendRelayMessage('AI_AUTOMATION_RESPONSE', {
        success: false,
        error: (error as Error).message
      });
    }
  }

  private async handleElementInteractionRequest(payload: any): Promise<void> {
    const { interactionType, target, parameters, targetTabId } = payload;
    
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tabId = targetTabId || tabs[0]?.id;
      
      if (!tabId) {
        throw new Error('No target tab available');
      }

      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'SIMULATE_USER_INTERACTION',
        payload: { interactionType, target, parameters }
      });

      this.sendRelayMessage('ELEMENT_INTERACTION_RESPONSE', {
        success: response.success,
        result: response.result || null,
        error: response.error || null
      });
    } catch (error) {
      this.sendRelayMessage('ELEMENT_INTERACTION_RESPONSE', {
        success: false,
        error: (error as Error).message
      });
    }
  }

  private async handlePageAnalysisRequest(payload: any): Promise<void> {
    const { analysisType, targetTabId } = payload;
    
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tabId = targetTabId || tabs[0]?.id;
      
      if (!tabId) {
        throw new Error('No target tab available');
      }

      let response;
      
      switch (analysisType) {
        case 'elements':
          response = await chrome.tabs.sendMessage(tabId, {
            type: 'AUTO_DETECT_ELEMENTS'
          });
          break;
        case 'interface':
          response = await chrome.tabs.sendMessage(tabId, {
            type: 'EXECUTE_AI_ACTION',
            payload: { action: 'analyzeInterface', parameters: {} }
          });
          break;
        case 'page_info':
          response = await chrome.tabs.sendMessage(tabId, {
            type: 'GET_PAGE_INFO'
          });
          break;
        default:
          throw new Error(`Unknown analysis type: ${analysisType}`);
      }

      this.sendRelayMessage('PAGE_ANALYSIS_RESPONSE', {
        success: response.success,
        data: response.mapping || response.pageInfo || response.result,
        error: response.error || null
      });
    } catch (error) {
      this.sendRelayMessage('PAGE_ANALYSIS_RESPONSE', {
        success: false,
        error: (error as Error).message
      });
    }
  }

  private async handleSessionControl(payload: any): Promise<void> {
    const { command, parameters } = payload;
    
    switch (command) {
      case 'start':
        this.aiSessionActive = true;
        this.currentPageMapping = parameters.mapping;
        this.sendRelayMessage('SESSION_CONTROL_RESPONSE', {
          success: true,
          sessionActive: true
        });
        break;
      case 'stop':
        this.aiSessionActive = false;
        this.currentPageMapping = null;
        this.sendRelayMessage('SESSION_CONTROL_RESPONSE', {
          success: true,
          sessionActive: false
        });
        break;
      case 'status':
        this.sendRelayMessage('SESSION_CONTROL_RESPONSE', {
          success: true,
          sessionActive: this.aiSessionActive,
          mapping: this.currentPageMapping
        });
        break;
    }
  }

  public isRelayConnected(): boolean {
    return this.isConnected;
  }

  public isAISessionActive(): boolean {
    return this.aiSessionActive;
  }

  public disconnect(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    this.isConnected = false;
    this.aiSessionActive = false;
  }
}

try {
  // Initialize FileTransferManager immediately
  fileTransferManager = new FileTransferManager();
  
  // Initialize TNF Relay Connection
  tnfRelayConnection = new TNFRelayConnection();
  
  // Initialize WebSocketManager safely and asynchronously
  chrome.storage.local.get(['websocketUrl'], (result) => {
    const websocketUrl = result.websocketUrl || 'ws://localhost:8080';
    backgroundLogger.info('Initializing WebSocketManager with URL:', websocketUrl);
    
    // Initialize with error handling
    try {
      webSocketManager = new WebSocketManager(websocketUrl, {
        logger: backgroundLogger,
        useCompression: true,
        reconnectAttempts: 5,
        reconnectDelay: 2000
      });
      
      // Add WebSocket event listeners only after initialization
      webSocketManager.on('connectionStatus', (statusPayload: ConnectionStatusMessage['payload']) => {
        backgroundLogger.info('Broadcasting WebSocket status update:', statusPayload);
        try {
          chrome.runtime.sendMessage({
            type: 'WEBSOCKET_STATUS_UPDATE',
            payload: statusPayload,
          });
        } catch (err) {
          backgroundLogger.error('Error broadcasting WebSocket status:', err);
        }
      });
      
      // Set icon to show disconnected status initially
      chrome.action.setIcon({ 
        path: {
          16: 'icons/icon16-disconnected.png',
          48: 'icons/icon48-disconnected.png',
          128: 'icons/icon128-disconnected.png'
        }
      });
      
    } catch (err) {
      backgroundLogger.error('Failed to initialize WebSocketManager:', err);
      chrome.action.setIcon({ 
        path: {
          16: 'icons/icon16-error.png',
          48: 'icons/icon48-error.png',
          128: 'icons/icon128-error.png'
        }
      });
    }
  });

} catch (error) {
  backgroundLogger.error('Failed to initialize managers:', error);
}

const FLOATING_PANEL_STATE_KEY = 'floatingPanelState';

// Listen for extension startup
chrome.runtime.onStartup.addListener(() => {
  try {
    backgroundLogger.info('Extension startup - initializing connections');
    
    // Auto-connect to TNF Relay if configured
    chrome.storage.local.get(['autoConnectRelay'], (result) => {
      if (result.autoConnectRelay && tnfRelayConnection) {
        tnfRelayConnection.connect();
      }
    });
  } catch (error) {
    backgroundLogger.error('Error during onStartup initialization:', error);
  }
});

// Listen for extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  try {
    backgroundLogger.info(`Extension ${details.reason} - setting up defaults`);
    
    // Set default settings for new installations
    if (details.reason === 'install') {
      chrome.storage.local.set({
        autoConnectRelay: true,
        relayUrl: 'ws://localhost:3000',
        enableAIAutomation: true,
        saveElementMappings: true
      });
    }
  } catch (error) {
    backgroundLogger.error('Error during onInstalled initialization:', error);
  }
});

import { BrowserAgent } from './agent/BrowserAgent';

const browserAgent = new BrowserAgent();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'MCP_REQUEST') {
        const { toolName, parameters } = message.payload;
        const context = { tabId: sender.tab.id };

        browserAgent.executeTool(toolName, parameters, context)
            .then(result => sendResponse({ success: true, result }))
            .catch(error => sendResponse({ success: false, error: error.message }));

        return true; // Indicates that the response is sent asynchronously
    }
});

/**
 * Handle content script ready notification
 */
async function handleContentScriptReady(message: any, sender: any, sendResponse: any) {
  try {
    const { data } = message;
    const tabId = sender.tab?.id;

    backgroundLogger.info('Content script ready in tab:', tabId, data);

    // Store tab information with enabled features
    if (tabId) {
      await chrome.storage.local.set({
        [`tab_${tabId}_features`]: data.features,
        [`tab_${tabId}_lastActive`]: data.timestamp
      });
    }

    // Relay to VS Code if connected
    if (tnfRelayConnection) {
      tnfRelayConnection.sendMessage({
        type: 'CONTENT_SCRIPT_READY',
        payload: {
          tabId,
          url: data.url,
          features: data.features,
          timestamp: data.timestamp
        }
      });
    }

    sendResponse({ success: true });
  } catch (error) {
    backgroundLogger.error('Error handling content script ready:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle health check results
 */
async function handleHealthCheckResult(message: any, sender: any, sendResponse: any) {
  try {
    const { data } = message;
    const tabId = sender.tab?.id;

    backgroundLogger.info('Health check result from tab:', tabId, data);

    // Store health status
    if (tabId) {
      await chrome.storage.local.set({
        [`tab_${tabId}_health`]: {
          results: data.results,
          timestamp: data.timestamp,
          url: data.url
        }
      });
    }

    // Check if any critical issues need immediate attention
    const criticalIssues = data.results.filter((result: any) => result.status === 'error');
    if (criticalIssues.length > 0) {
      backgroundLogger.warn('Critical health issues detected:', criticalIssues);
      
      // Send notification to user
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon128.png',
        title: 'Performance Issue Detected',
        message: `Critical issues detected in tab: ${criticalIssues.length} components need attention`
      });
    }

    // Relay to VS Code
    if (tnfRelayConnection) {
      tnfRelayConnection.sendMessage({
        type: 'HEALTH_CHECK_RESULT',
        payload: {
          tabId,
          results: data.results,
          timestamp: data.timestamp,
          url: data.url
        }
      });
    }

    sendResponse({ success: true });
  } catch (error) {
    backgroundLogger.error('Error handling health check result:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle feature toggle requests
 */
async function handleToggleFeature(message: any, sender: any, sendResponse: any) {
  try {
    const { featureId, enabled } = message.data;
    const tabId = sender.tab?.id;

    backgroundLogger.info(`Toggling feature ${featureId} to ${enabled} in tab:`, tabId);

    // Update feature state in storage
    if (tabId) {
      const result = await chrome.storage.local.get([`tab_${tabId}_features`]);
      const features = result[`tab_${tabId}_features`] || {};
      features[featureId] = enabled;
      
      await chrome.storage.local.set({
        [`tab_${tabId}_features`]: features
      });
    }

    // Relay to VS Code
    if (tnfRelayConnection) {
      tnfRelayConnection.sendMessage({
        type: 'FEATURE_TOGGLED',
        payload: {
          tabId,
          featureId,
          enabled,
          timestamp: Date.now()
        }
      });
    }

    sendResponse({ success: true, featureId, enabled });
  } catch (error) {
    backgroundLogger.error('Error handling feature toggle:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle performance optimization requests
 */
async function handleOptimizePerformance(message: any, sender: any, sendResponse: any) {
  try {
    const { optimizationType, parameters } = message.data;
    const tabId = sender.tab?.id;

    backgroundLogger.info(`Optimizing performance: ${optimizationType} in tab:`, tabId);

    // Apply optimization based on type
    switch (optimizationType) {
      case 'memory':
        await optimizeMemoryUsage(tabId);
        break;
      case 'cpu':
        await optimizeCPUUsage(tabId);
        break;
      case 'network':
        await optimizeNetworkUsage(tabId);
        break;
      case 'auto':
        await autoOptimizePerformance(tabId, parameters);
        break;
      default:
        throw new Error(`Unknown optimization type: ${optimizationType}`);
    }

    // Relay to VS Code
    if (tnfRelayConnection) {
      tnfRelayConnection.sendMessage({
        type: 'PERFORMANCE_OPTIMIZED',
        payload: {
          tabId,
          optimizationType,
          parameters,
          timestamp: Date.now()
        }
      });
    }

    sendResponse({ success: true, optimizationType });
  } catch (error) {
    backgroundLogger.error('Error handling performance optimization:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle new chat messages
 */
async function handleNewChatMessage(message: any, sender: any, sendResponse: any) {
  try {
    const { chatMessage } = message.data;
    const tabId = sender.tab?.id;

    backgroundLogger.info('New chat message in tab:', tabId, chatMessage);

    // Store message in history
    if (tabId) {
      const historyKey = `tab_${tabId}_chat_history`;
      const result = await chrome.storage.local.get([historyKey]);
      const history = result[historyKey] || [];
      
      history.push({
        ...chatMessage,
        timestamp: Date.now(),
        tabId
      });

      // Keep only last 100 messages
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }

      await chrome.storage.local.set({ [historyKey]: history });
    }

    // Relay to VS Code with enhanced context
    if (tnfRelayConnection) {
      tnfRelayConnection.sendMessage({
        type: 'NEW_CHAT_MESSAGE',
        payload: {
          tabId,
          message: chatMessage,
          url: sender.tab?.url,
          timestamp: Date.now(),
          context: {
            platform: chatMessage.platform,
            confidence: chatMessage.metadata?.confidence
          }
        }
      });
    }

    sendResponse({ success: true });
  } catch (error) {
    backgroundLogger.error('Error handling new chat message:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle metrics requests
 */
async function handleGetMetrics(message: any, sender: any, sendResponse: any) {
  try {
    const tabId = sender.tab?.id;
    
    if (!tabId) {
      throw new Error('No tab ID available');
    }

    // Collect metrics from storage
    const keys = [
      `tab_${tabId}_features`,
      `tab_${tabId}_health`,
      `tab_${tabId}_chat_history`,
      `tab_${tabId}_lastActive`
    ];

    const result = await chrome.storage.local.get(keys);
    
    const metrics = {
      features: result[`tab_${tabId}_features`] || {},
      health: result[`tab_${tabId}_health`] || null,
      chatHistory: result[`tab_${tabId}_chat_history`] || [],
      lastActive: result[`tab_${tabId}_lastActive`] || null,
      timestamp: Date.now()
    };

    sendResponse({ success: true, metrics });
  } catch (error) {
    backgroundLogger.error('Error getting metrics:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle settings updates
 */
async function handleUpdateSettings(message: any, sender: any, sendResponse: any) {
  try {
    const { settings } = message.data;

    backgroundLogger.info('Updating extension settings:', Object.keys(settings));

    // Validate and update settings
    await chrome.storage.sync.set({ extensionSettings: settings });

    // Notify all content scripts about settings change
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'SETTINGS_UPDATED',
          settings: settings
        }).catch(() => {
          // Content script might not be loaded - that's OK
        });
      }
    }

    // Relay to VS Code
    if (tnfRelayConnection) {
      tnfRelayConnection.sendMessage({
        type: 'SETTINGS_UPDATED',
        payload: {
          settings,
          timestamp: Date.now()
        }
      });
    }

    sendResponse({ success: true });
  } catch (error) {
    backgroundLogger.error('Error updating settings:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle error reports
 */
async function handleErrorReport(message: any, sender: any, sendResponse: any) {
  try {
    const { data: errorReport } = message;
    const tabId = sender.tab?.id;

    backgroundLogger.error('Error report from content script:', errorReport);

    // Store error report
    if (tabId) {
      const errorKey = `tab_${tabId}_errors`;
      const result = await chrome.storage.local.get([errorKey]);
      const errors = result[errorKey] || [];
      
      errors.push({
        ...errorReport,
        tabId,
        timestamp: Date.now()
      });

      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }

      await chrome.storage.local.set({ [errorKey]: errors });
    }

    // Relay to VS Code for debugging
    if (tnfRelayConnection) {
      tnfRelayConnection.sendMessage({
        type: 'ERROR_REPORT',
        payload: {
          tabId,
          error: errorReport,
          timestamp: Date.now()
        }
      });
    }

    sendResponse({ success: true });
  } catch (error) {
    backgroundLogger.error('Error handling error report:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Performance optimization helpers
async function optimizeMemoryUsage(tabId: number | undefined) {
  if (!tabId) return;
  
  // Clear cached data older than 1 hour
  const keys = await chrome.storage.local.get();
  const cutoffTime = Date.now() - (60 * 60 * 1000);
  
  const keysToRemove = Object.keys(keys).filter(key => {
    if (key.includes(`tab_${tabId}`)) {
      const data = keys[key];
      return data.timestamp && data.timestamp < cutoffTime;
    }
    return false;
  });

  if (keysToRemove.length > 0) {
    await chrome.storage.local.remove(keysToRemove);
    backgroundLogger.info(`Cleaned up ${keysToRemove.length} old cache entries`);
  }
}

async function optimizeCPUUsage(tabId: number | undefined) {
  if (!tabId) return;
  
  // Reduce update frequency for non-active tabs
  chrome.tabs.sendMessage(tabId, {
    type: 'OPTIMIZE_CPU',
    parameters: {
      reducePolling: true,
      batchUpdates: true,
      throttleAnimations: true
    }
  }).catch(() => {
    // Content script might not be loaded
  });
}

async function optimizeNetworkUsage(tabId: number | undefined) {
  if (!tabId) return;
  
  // Enable compression and reduce network requests
  chrome.tabs.sendMessage(tabId, {
    type: 'OPTIMIZE_NETWORK',
    parameters: {
      enableCompression: true,
      batchRequests: true,
      cacheAggressively: true
    }
  }).catch(() => {
    // Content script might not be loaded
  });
}

async function autoOptimizePerformance(tabId: number | undefined, parameters: any) {
  if (!tabId) return;
  
  // Analyze current performance and apply optimizations
  const healthData = await chrome.storage.local.get([`tab_${tabId}_health`]);
  const health = healthData[`tab_${tabId}_health`];
  
  if (health?.results) {
    const memoryIssues = health.results.filter((r: any) => r.component === 'Memory Usage' && r.status !== 'healthy');
    const cpuIssues = health.results.filter((r: any) => r.component === 'CPU Usage' && r.status !== 'healthy');
    const networkIssues = health.results.filter((r: any) => r.component === 'Network Latency' && r.status !== 'healthy');

    if (memoryIssues.length > 0) {
      await optimizeMemoryUsage(tabId);
    }
    
    if (cpuIssues.length > 0) {
      await optimizeCPUUsage(tabId);
    }
    
    if (networkIssues.length > 0) {
      await optimizeNetworkUsage(tabId);
    }
  }
}

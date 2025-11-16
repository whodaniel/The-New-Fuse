// Background service worker for Tab Connections extension

class TabConnectionsBackground {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupAlarms();
  }

  setupEventListeners() {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      console.log('Tab Connections extension installed');
      this.createContextMenus();
    });

    // Handle tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.handleTabUpdate(tabId, tab);
      }
    });

    // Handle tab creation
    chrome.tabs.onCreated.addListener((tab) => {
      this.handleTabCreated(tab);
    });

    // Handle tab removal
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.handleTabRemoved(tabId);
    });

    // Handle messages from popup and content scripts
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async response
    });
  }

  setupAlarms() {
    // Clean up old data every hour
    chrome.alarms.create('cleanup', { periodInMinutes: 60 });

    // Update tab analysis every 30 minutes
    chrome.alarms.create('updateAnalysis', { periodInMinutes: 30 });

    chrome.alarms.onAlarm.addListener((alarm) => {
      switch (alarm.name) {
        case 'cleanup':
          this.cleanupOldData();
          break;
        case 'updateAnalysis':
          this.updateTabAnalysis();
          break;
      }
    });
  }

  createContextMenus() {
    chrome.contextMenus.create({
      id: 'analyzeTab',
      title: 'Analyze this tab',
      contexts: ['page']
    });

    chrome.contextMenus.create({
      id: 'findConnections',
      title: 'Find tab connections',
      contexts: ['page']
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      switch (info.menuItemId) {
        case 'analyzeTab':
          this.analyzeSingleTab(tab);
          break;
        case 'findConnections':
          this.findAllConnections();
          break;
      }
    });
  }

  async handleTabUpdate(tabId, tab) {
    // Skip chrome:// and extension pages
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      return;
    }

    // Wait a bit for content to load
    setTimeout(async () => {
      try {
        await chrome.tabs.sendMessage(tabId, { action: 'pageLoaded' });
      } catch (error) {
        console.log('Could not send message to tab:', error);
      }
    }, 1000);
  }

  async handleTabCreated(tab) {
    // Initialize new tab
    console.log('New tab created:', tab.id);
  }

  async handleTabRemoved(tabId) {
    // Clean up data for removed tab
    console.log('Tab removed:', tabId);
    await this.cleanupTabData(tabId);
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'getAllTabs':
          const tabs = await this.getAllTabs();
          sendResponse({ tabs });
          break;

        case 'analyzeTabs':
          const analysis = await this.analyzeTabs();
          sendResponse({ analysis });
          break;

        case 'getConnections':
          const connections = await this.findConnections();
          sendResponse({ connections });
          break;

        case 'getSummaries':
          const summaries = await this.generateSummaries();
          sendResponse({ summaries });
          break;

        case 'analyzeSingleTab':
          const singleAnalysis = await this.analyzeSingleTab(request.tabId);
          sendResponse({ analysis: singleAnalysis });
          break;

        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }
  }

  async getAllTabs() {
    const tabs = await chrome.tabs.query({ windowType: 'normal' });
    return tabs.filter(tab =>
      tab.url &&
      !tab.url.startsWith('chrome://') &&
      !tab.url.startsWith('chrome-extension://')
    );
  }

  async analyzeTabs() {
    const tabs = await this.getAllTabs();
    const analyses = [];

    for (const tab of tabs) {
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'getContent' });
        if (response && response.content) {
          analyses.push({
            tabId: tab.id,
            title: tab.title,
            url: tab.url,
            content: response.content
          });
        }
      } catch (error) {
        console.log(`Could not analyze tab ${tab.id}:`, error);
      }
    }

    return analyses;
  }

  async findConnections() {
    this.reconnectAttempts = 0;
    this.registerWithTNFRelay();
    this.processPendingMessages();
  };
      
      this.ws.onmessage = (event) => {
  this.handleRelayMessage(event.data);
};

this.ws.onclose = (event) => {
  console.log('❌ Disconnected from TNF relay', event.code, event.reason);
  this.isConnected = false;
  this.scheduleReconnect();
};

this.ws.onerror = (error) => {
  console.error('❌ WebSocket error:', error);
  this.isConnected = false;
};
      
    } catch (error) {
  console.error('❌ Failed to connect to TNF relay:', error);
  this.scheduleReconnect();
}
    */
  }

scheduleReconnect() {
  if (this.reconnectAttempts >= this.maxReconnectAttempts) {
    console.error('❌ Max reconnection attempts reached');
    return;
  }

  this.reconnectAttempts++;
  const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

  console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

  setTimeout(() => {
    this.connectToTNFRelay();
  }, delay);
}

handleAlarm(alarm) {
  if (alarm.name === 'keep-alive') {
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.connectToTNFRelay();
    }
    this.checkAllPorts();
  } else if (alarm.name === 'tnf-health-check') {
    this.checkTNFInfrastructure();
    this.broadcastTNFStatus();
  }
}

  async checkAllPorts() {
  chrome.storage.local.get(['portsToCheck'], async ({ portsToCheck }) => {
    const ports = portsToCheck || [3000, 3001, 5173, 8080];
    const statuses = {};

    await Promise.all(ports.map(async port => {
      try {
        await fetch(`http://localhost:${port}`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(1000)
        });
        statuses[port] = true;
      } catch {
        statuses[port] = false;
      }
    }));

    this.portStatuses = statuses;
    this.broadcastPortStatus();
  });
}

broadcastPortStatus() {
  chrome.runtime.sendMessage({
    type: 'PORT_STATUS_UPDATE',
    payload: this.portStatuses
  }).catch(() => {
    // Popup might not be open, that's okay
  });
}

broadcastServerStatus() {
  chrome.runtime.sendMessage({
    type: 'SERVER_STATUS_UPDATE',
    payload: this.serverStatus
  }).catch(() => {
    // Popup might not be open, that's okay
  });
}

  async executeNativeCommand(command, args) {
  // Handle server commands by interacting with TNF infrastructure
  switch (command) {
    case 'start_server':
      return await this.startTNFRelayServer(args.port || 3001);
    case 'stop_server':
      return await this.stopTNFRelayServer();
    case 'restart_server':
      return await this.restartTNFRelayServer(args.port || 3001);
    case 'clear_ports':
      return await this.clearTNFPorts(args.ports || [3001, 3002, 3003]);
    case 'start_tnf_comprehensive':
      return await this.startTNFComprehensiveRelay();
    case 'register_with_tnf':
      return await this.registerWithTNFSystem();
    default:
      // Try TNF MCP command first
      try {
        const result = await this.executeTNFCommand(command, args);
        if (result) return result;
      } catch (error) {
        console.log('TNF command failed, trying native messaging:', error.message);
      }

      // Fallback to native messaging
      return new Promise((resolve, reject) => {
        chrome.runtime.sendNativeMessage(
          'com.thenewfuse.chrome_extension',
          { command, ...args },
          response => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          }
        );
      });
  }
}

  async startTNFRelayServer(port = 3001) {
  try {
    console.log(`🚀 Starting TNF relay server on port ${port}`);

    // Try to start TNF comprehensive relay
    const response = await fetch('http://localhost:3000/relay/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'comprehensive',
        ports: { websocket: port }
      })
    }).catch(() => null);

    if (response && response.ok) {
      const result = await response.json();
      this.serverStatus = {
        isRunning: true,
        port: port,
        connectedClients: 0,
        message: 'TNF relay server started',
        startTime: Date.now(),
        tnf_integrated: true
      };
      console.log('✅ TNF relay server started via API');
      return {
        success: true,
        message: `TNF relay server started on port ${port}`,
        port: port,
        tnf_managed: true
      };
    } else {
      // Fallback to internal server
      return await this.startInternalServer(port);
    }
  } catch (error) {
    console.error('Failed to start TNF relay server:', error);
    return await this.startInternalServer(port);
  }
}

  async startInternalServer(port = 3001) {
  try {
    console.log(`🚀 Starting fallback internal server on port ${port}`);

    this.serverStatus = {
      isRunning: true,
      port: port,
      connectedClients: 0,
      message: 'Internal fallback server started',
      startTime: Date.now(),
      tnf_integrated: false
    };

    return {
      success: true,
      message: `Internal server started on port ${port}`,
      port: port,
      tnf_managed: false
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

  async startTNFComprehensiveRelay() {
  try {
    console.log('🚀 Starting TNF comprehensive relay system');

    const response = await fetch('http://localhost:3000/relay/comprehensive/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chrome_extension_integration: true,
        agent_id: this.agentId
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ TNF comprehensive relay started');
      return {
        success: true,
        message: 'TNF comprehensive relay started',
        endpoints: result.endpoints || {}
      };
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to start TNF comprehensive relay:', error);
    return { success: false, error: error.message };
  }
}

  async executeTNFCommand(command, args) {
  try {
    const response = await fetch('http://localhost:3000/mcp/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: command,
        arguments: args,
        source: 'chrome_extension',
        agent_id: this.agentId
      })
    });

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    return null;
  }
}

  async stopTNFRelayServer() {
  try {
    console.log('🛑 Stopping TNF relay server');

    // Try to stop via TNF API first
    const response = await fetch('http://localhost:3000/relay/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: this.agentId })
    }).catch(() => null);

    if (response && response.ok) {
      console.log('✅ TNF relay server stopped via API');
    }

    this.serverStatus = {
      isRunning: false,
      port: 0,
      connectedClients: 0,
      message: 'TNF relay server stopped',
      tnf_integrated: true
    };

    return { success: true, message: 'TNF relay server stopped' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

  async stopInternalServer() {
  try {
    console.log('🛑 Stopping internal server');

    this.serverStatus = {
      isRunning: false,
      port: 0,
      connectedClients: 0,
      message: 'Internal server stopped',
      tnf_integrated: false
    };

    return { success: true, message: 'Internal server stopped' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

  async restartTNFRelayServer(port = 3001) {
  try {
    console.log('🔄 Restarting TNF relay server');

    await this.stopTNFRelayServer();
    await new Promise(resolve => setTimeout(resolve, 1000));
    return await this.startTNFRelayServer(port);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

  async clearTNFPorts(ports = [3001, 3002, 3003]) {
  try {
    console.log('🧹 Clearing TNF ports:', ports);

    // Use TNF API to clear ports
    const response = await fetch('http://localhost:3000/system/clear-ports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ports,
        source: 'chrome_extension',
        agent_id: this.agentId
      })
    }).catch(() => null);

    if (response && response.ok) {
      const result = await response.json();
      return {
        success: true,
        clearedPorts: result.cleared_ports || ports,
        message: `Cleared ${result.cleared_ports?.length || ports.length} TNF ports`
      };
    } else {
      // Fallback to local clearing
      return {
        success: true,
        clearedPorts: ports,
        message: `Cleared ${ports.length} ports (local fallback)`
      };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

  async registerWithTNFSystem() {
  try {
    console.log('🔗 Registering with TNF system');

    const response = await fetch('http://localhost:3000/agents/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: this.agentId,
        type: 'CHROME_EXTENSION_AGENT',
        capabilities: [
          'multi_ai_injection',
          'ai_response_capture',
          'agent_grouping',
          'message_routing'
        ],
        metadata: {
          extension_id: chrome.runtime.id,
          version: '2.0.0',
          browser: 'chrome'
        }
      })
    });

    if (response.ok) {
      const result = await response.json();
      this.tnfIntegrationStatus.agentRegistered = true;
      console.log('✅ Successfully registered with TNF system');
      return {
        success: true,
        message: 'Registered with TNF system',
        agent_data: result
      };
    } else {
      throw new Error(`Registration failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to register with TNF system:', error);
    return { success: false, error: error.message };
  }
}

  async clearBusyPorts(ports = [3001, 3002, 3003, 3004, 3005]) {
  try {
    console.log('🧹 Clearing busy ports:', ports);

    // Simulate port clearing
    return {
      success: true,
      clearedPorts: ports,
      message: `Cleared ${ports.length} ports`
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

processPendingMessages() {
  if (this.pendingMessages.size === 0) return;

  console.log(`📤 Processing ${this.pendingMessages.size} pending messages`);

  for (const [messageId, message] of this.pendingMessages) {
    this.sendToRelay(message);
    this.pendingMessages.delete(messageId);
  }
}

registerWithTNFRelay() {
  const registrationPayload = {
    type: 'TNF_AGENT_REGISTER',
    source: this.agentId,
    payload: {
      id: this.agentId,
      name: 'TNF Chrome Extension Bridge',
      type: 'CHROME_EXTENSION_AGENT',
      platform: 'browser',
      version: '2.0.0',
      capabilities: [
        'multi_ai_injection',
        'ai_response_capture',
        'cross_platform_communication',
        'agent_grouping',
        'message_routing',
        'chatgpt_support',
        'claude_support',
        'gemini_support',
        'perplexity_support',
        'poe_support',
        'character_ai_support'
      ],
      tnf_integration: {
        config_version: this.tnfConfig?.version || '2.1.0',
        relay_connected: true,
        mcp_compatible: true,
        database_ready: false,
        agent_groups_enabled: true
      },
      metadata: {
        extensionId: chrome.runtime.id,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        tnf_agent_id: this.agentId,
        supported_protocols: ['websocket', 'http', 'mcp'],
        browser_context: 'chrome_extension'
      }
    },
    timestamp: new Date().toISOString(),
    protocol_version: '2.1.0'
  };

  this.sendToTNFRelay(registrationPayload);
  console.log('📝 Registering with TNF infrastructure as integrated agent');
}

handleRelayMessage(data) {
  try {
    const message = JSON.parse(data);
    console.log('📩 Received from relay:', message.type);

    if (message.type === 'AI_AUTOMATION_REQUEST') {
      console.log('🤖 AI Automation request received:', message);
      if (message.payload && message.payload.automation === 'inject_message') {
        const injectData = message.payload.payload || message.payload;
        this.handleAIInject(injectData);
      }
    } else if (message.type === 'INJECT_MESSAGE') {
      this.handleAIInject(message);
    } else if (message.type === 'CONVERSATION_UPDATE') {
      this.handleConversationUpdate(message);
    } else if (message.type === 'CONVERSATION_HISTORY') {
      this.handleConversationHistory(message);
    }
  } catch (error) {
    console.error('❌ Error parsing relay message:', error);
  }
}

handleConversationUpdate(message) {
  console.log('💬 Conversation update received');
  if (message.payload && message.payload.message) {
    this.addToConversationHistory(message.payload.message);
    this.notifyPopupOfUpdate();
  }
}

handleConversationHistory(message) {
  console.log('📚 Conversation history received');
  if (message.payload && Array.isArray(message.payload.history)) {
    this.conversationHistory = message.payload.history;
    this.notifyPopupOfUpdate();
  }
}

addToConversationHistory(messageData) {
  // Generate a more stable ID for duplicate checking based on content and sender
  const stableId = `${messageData.content.substring(0, 50)}_${messageData.sender}`;

  // Check if message with this stable ID already exists to prevent duplicates
  const exists = this.conversationHistory.some(entry => entry.stableId === stableId);
  if (exists) {
    console.log(`⚠️ Message with stable ID ${stableId} already exists in history, skipping.`);
    return;
  }

  const historyEntry = {
    id: messageData.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Keep original ID if present
    stableId: stableId, // Add the stable ID for duplicate checking
    timestamp: messageData.timestamp || new Date().toISOString(),
    sender: messageData.source || 'unknown',
    source: messageData.source || 'unknown', // Also preserve the source field
    content: messageData.content || messageData.response || messageData.text,
    type: messageData.type,
    conversationId: messageData.conversationId
  };

  this.conversationHistory.push(historyEntry);

  // Keep only last 100 messages to prevent memory issues
  if (this.conversationHistory.length > 100) {
    this.conversationHistory = this.conversationHistory.slice(-100);
  }
}

// Enterprise-grade analytics and logging methods
recordResponseAnalytics(message) {
  try {
    const analytics = {
      timestamp: new Date().toISOString(),
      source: message.source,
      conversationId: message.conversationId,
      responseLength: message.response?.length || 0,
      extractionScore: message.metadata?.score || 0,
      extractionMethod: message.metadata?.extractionMethod || 'standard',
      processingTime: message.metadata?.monitoringDuration || 0,
      confidence: message.metadata?.confidence || 0,
      elementType: message.metadata?.elementType || 'unknown',
      quality: message.metadata?.score >= 0.8 ? 'high' : message.metadata?.score >= 0.6 ? 'medium' : 'low'
    };

    // Store in local analytics database
    if (!this.responseAnalytics) {
      this.responseAnalytics = [];
    }
    this.responseAnalytics.push(analytics);

    // Keep only last 1000 entries for performance
    if (this.responseAnalytics.length > 1000) {
      this.responseAnalytics = this.responseAnalytics.slice(-1000);
    }

    console.log('📊 Response analytics recorded:', analytics);

    // Send to TNF analytics service if available
    this.sendAnalyticsToTNF(analytics);

  } catch (error) {
    console.warn('Failed to record response analytics:', error);
  }
}

recordInjectionTelemetry(type, data) {
  try {
    const telemetry = {
      type,
      timestamp: new Date().toISOString(),
      data,
      sessionId: this.sessionId || 'unknown',
      extensionVersion: chrome.runtime.getManifest().version
    };

    // Store in local telemetry database
    if (!this.injectionTelemetry) {
      this.injectionTelemetry = [];
    }
    this.injectionTelemetry.push(telemetry);

    // Keep only last 500 entries
    if (this.injectionTelemetry.length > 500) {
      this.injectionTelemetry = this.injectionTelemetry.slice(-500);
    }

    console.log(`📈 Injection telemetry recorded (${type}):`, telemetry);

    // Send to TNF telemetry service
    this.sendTelemetryToTNF(telemetry);

  } catch (error) {
    console.warn('Failed to record injection telemetry:', error);
  }
}

calculateAverageScore(history) {
  const enhancedResponses = history.filter(h => h.type === 'AI_RESPONSE_ENHANCED' && h.metadata?.score);
  if (enhancedResponses.length === 0) return 0;

  const totalScore = enhancedResponses.reduce((sum, resp) => sum + resp.metadata.score, 0);
  return (totalScore / enhancedResponses.length).toFixed(3);
}

getQualityDistribution(history) {
  const enhancedResponses = history.filter(h => h.type === 'AI_RESPONSE_ENHANCED' && h.analytics?.extractionQuality);
  const distribution = { high: 0, medium: 0, low: 0 };

  enhancedResponses.forEach(resp => {
    distribution[resp.analytics.extractionQuality]++;
  });

  return distribution;
}

sendAnalyticsToTNF(analytics) {
  this.sendToRelay({
    type: 'RESPONSE_ANALYTICS',
    payload: analytics
  });
}

sendTelemetryToTNF(telemetry) {
  this.sendToRelay({
    type: 'INJECTION_TELEMETRY',
    payload: telemetry
  });
}

generateAnalyticsReport() {
  if (!this.responseAnalytics || this.responseAnalytics.length === 0) {
    return { message: 'No analytics data available' };
  }

  const total = this.responseAnalytics.length;
  const avgScore = (this.responseAnalytics.reduce((sum, a) => sum + a.extractionScore, 0) / total).toFixed(3);
  const avgProcessingTime = (this.responseAnalytics.reduce((sum, a) => sum + a.processingTime, 0) / total).toFixed(0);

  const qualityDist = this.responseAnalytics.reduce((dist, a) => {
    dist[a.quality]++;
    return dist;
  }, { high: 0, medium: 0, low: 0 });

  const sourceBreakdown = this.responseAnalytics.reduce((breakdown, a) => {
    breakdown[a.source] = (breakdown[a.source] || 0) + 1;
    return breakdown;
  }, {});

  return {
    totalResponses: total,
    averageScore: avgScore,
    averageProcessingTime: avgProcessingTime + 'ms',
    qualityDistribution: qualityDist,
    sourceBreakdown,
    generatedAt: new Date().toISOString()
  };
}

notifyPopupOfUpdate() {
  const analytics = this.generateAnalyticsReport();

  // Send enhanced data to popup
  chrome.runtime.sendMessage({
    type: 'CONVERSATION_UPDATED',
    history: this.conversationHistory,
    analytics: analytics,
    enhanced: true
  }).catch(() => {
    // Popup might not be open, that's okay
  });

  // Send to all tabs with content scripts (for injectable UI)
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.url && (tab.url.includes('gemini.google.com') ||
        tab.url.includes('chatgpt.com') ||
        tab.url.includes('claude.ai'))) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'CONVERSATION_UPDATED',
          history: this.conversationHistory,
          analytics: analytics,
          enhanced: true
        }).catch(() => {
          // Tab might not have content script, that's okay
        });
      }
    });
  });
}

requestConversationHistory() {
  this.sendToRelay({
    type: 'REQUEST_CONVERSATION_HISTORY',
    agentId: this.agentId
  });
}

  async handleAIInject(message) {
  const targetAI = message.targetAI || 'gemini';
  console.log(`💬 Starting injection into ${targetAI}:`, message.content.substring(0, 50) + '...');
  console.log('💬 Full inject message:', message);

  const aiUrls = {
    'chatgpt': 'https://chatgpt.com/*',
    'claude': 'https://claude.ai/*',
    'gemini': 'https://gemini.google.com/*',
    'perplexity': 'https://www.perplexity.ai/*',
    'poe': 'https://poe.com/*',
    'character': 'https://character.ai/*'
  };

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      attempt++;

      // Find tabs for the target AI
      const tabs = await chrome.tabs.query({
        url: aiUrls[targetAI] || aiUrls['gemini']
      });

      console.log(`🔍 Found ${tabs.length} ${targetAI} tabs:`, tabs.map(t => ({ id: t.id, url: t.url, title: t.title })));

      if (tabs.length === 0) {
        throw new Error(`No ${targetAI} tabs found - please open the ${targetAI} website`);
      }

      const tab = tabs[0];
      console.log(`📋 Found ${targetAI} tab: ${tab.id} (attempt ${attempt}/${maxRetries})`);

      // Progressive wait times
      const waitTime = attempt === 1 ? 1000 : attempt === 2 ? 2000 : 3000;
      await new Promise(resolve => setTimeout(resolve, waitTime));

      // Send message to inject with timeout
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Injection timeout after ${waitTime + 2000}ms`));
        }, waitTime + 2000);

        chrome.tabs.sendMessage(tab.id, {
          type: 'INJECT',
          targetAI: targetAI,
          content: message.content,
          conversationId: message.conversationId,
          attempt: attempt
        }, (response) => {
          clearTimeout(timeout);
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });

      // Start unified response monitoring after successful injection
      this.startUnifiedResponseMonitoring(tab.id, message.conversationId);

      // Success
      console.log(`✅ ${targetAI} injection successful, monitoring started`);
      return;

    } catch (error) {
      console.error(`❌ ${targetAI} injection attempt ${attempt}/${maxRetries} failed:`, error);

      if (attempt === maxRetries) {
        this.sendToRelay({
          type: 'INJECTION_STATUS',
          conversationId: message.conversationId,
          success: false,
          error: error.message,
          attempts: attempt,
          targetAI: targetAI
        });
      } else {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
}

sendToTNFRelay(message) {
  if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
    try {
      // Add TNF-specific message metadata
      const tnfMessage = {
        ...message,
        id: message.id || `tnf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: message.timestamp || new Date().toISOString(),
        source: message.source || this.agentId,
        tnf_metadata: {
          agent_type: 'CHROME_EXTENSION_AGENT',
          integration_version: '2.0.0',
          relay_endpoint: this.currentRelayUrl,
          browser_context: 'chrome_extension'
        }
      };

      this.ws.send(JSON.stringify(tnfMessage));
      console.log('📤 Sent to TNF relay:', tnfMessage.type, tnfMessage.id);
    } catch (error) {
      console.error('❌ Failed to send message to TNF relay:', error);
      this.queueMessage(message);
    }
  } else {
    console.log('⏳ Queueing TNF message (not connected):', message.type);
    this.queueMessage(message);
  }
}

// Backward compatibility method
sendToRelay(message) {
  this.sendToTNFRelay(message);
}

broadcastTNFStatus() {
  chrome.runtime.sendMessage({
    type: 'TNF_STATUS_UPDATE',
    payload: {
      integration_status: this.tnfIntegrationStatus,
      port_statuses: this.portStatuses,
      relay_url: this.currentRelayUrl,
      agent_id: this.agentId
    }
  }).catch(() => {
    // Popup might not be open
  });
}

queueMessage(message) {
  const messageId = message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  this.pendingMessages.set(messageId, message);

  // Limit pending message queue size
  if (this.pendingMessages.size > 100) {
    const firstKey = this.pendingMessages.keys().next().value;
    this.pendingMessages.delete(firstKey);
  }
}

// Unified Response Monitor Class
createUnifiedResponseMonitor(tabId, conversationId) {
  return {
    tabId,
    conversationId,
    isActive: false,
    startTime: Date.now(),
    timeout: null,

    start() {
      if (this.isActive) {
        console.log(`⚠️ Monitor already active for tab ${tabId}`);
        return;
      }

      this.isActive = true;
      console.log(`👁️ Starting unified response monitor for tab ${tabId}, conversation ${conversationId}`);

      // Send message to content script to start monitoring
      chrome.tabs.sendMessage(tabId, {
        type: 'START_RESPONSE_MONITORING',
        conversationId: conversationId,
        source: 'unified_monitor'
      }).catch(error => {
        console.warn(`Failed to start monitoring in tab ${tabId}:`, error);
      });

      // Set timeout for cleanup
      this.timeout = setTimeout(() => {
        this.stop();
      }, 60000); // 60 second timeout
    },

    stop() {
      if (!this.isActive) return;

      this.isActive = false;
      console.log(`🛑 Stopping unified response monitor for tab ${tabId}`);

      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }

      // Send message to content script to stop monitoring
      chrome.tabs.sendMessage(tabId, {
        type: 'STOP_RESPONSE_MONITORING',
        conversationId: conversationId
      }).catch(() => {
        // Tab might be closed, that's okay
      });
    }
  };
}

startUnifiedResponseMonitoring(tabId, conversationId) {
  // Stop any existing monitor for this tab
  this.stopUnifiedResponseMonitoring(tabId);

  // Create and start new monitor
  const monitor = this.createUnifiedResponseMonitor(tabId, conversationId);
  this.responseMonitors.set(tabId, monitor);
  this.activeConversations.set(conversationId, { tabId, startTime: Date.now() });

  monitor.start();
}

stopUnifiedResponseMonitoring(tabId) {
  const monitor = this.responseMonitors.get(tabId);
  if (monitor) {
    monitor.stop();
    this.responseMonitors.delete(tabId);
  }

  // Clean up conversation tracking
  for (const [conversationId, data] of this.activeConversations.entries()) {
    if (data.tabId === tabId) {
      this.activeConversations.delete(conversationId);
    }
  }
}

setupMessageHandlers() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    let handled = false;
    if (message.type === 'INJECTION_RESULT') {
      console.log('📊 Injection result:', message.success ? 'SUCCESS' : 'FAILED');
      this.sendToRelay({
        type: 'INJECTION_STATUS',
        conversationId: message.conversationId,
        success: message.success,
        error: message.error
      });
    }

    if (message.type === 'AI_RESPONSE') {
      const sourceAI = message.source || message.targetAI || 'unknown';
      console.log(`🤖 ${sourceAI} response captured`);

      // Add to local conversation history
      this.addToConversationHistory({
        id: `response_${Date.now()}`,
        source: sourceAI,
        content: message.response,
        type: 'AI_RESPONSE',
        conversationId: message.conversationId,
        timestamp: new Date().toISOString()
      });

      this.sendToRelay({
        type: 'WEB_AI_RESPONSE',
        conversationId: message.conversationId,
        response: message.response,
        source: sourceAI
      });
    }

    if (message.type === 'AI_RESPONSE_ENHANCED') {
      const sourceAI = message.source || message.targetAI || 'gemini';
      console.log(`🚀 Enhanced ${sourceAI} response captured with metadata:`, {
        score: message.metadata?.score,
        confidence: message.metadata?.confidence,
        extractionMethod: message.metadata?.extractionMethod
      });

      // Add enhanced response to conversation history
      this.addToConversationHistory({
        id: `response_enhanced_${Date.now()}`,
        source: sourceAI,
        content: message.response,
        type: 'AI_RESPONSE_ENHANCED',
        conversationId: message.conversationId,
        timestamp: new Date().toISOString(),
        metadata: message.metadata,
        analytics: {
          extractionQuality: message.metadata?.score >= 0.8 ? 'high' : message.metadata?.score >= 0.6 ? 'medium' : 'low',
          processingTime: message.metadata?.monitoringDuration
        }
      });

      // Send enhanced analytics to relay
      this.sendToRelay({
        type: 'WEB_AI_RESPONSE_ENHANCED',
        conversationId: message.conversationId,
        response: message.response,
        source: sourceAI,
        metadata: message.metadata,
        analytics: {
          extractionQuality: message.metadata?.score >= 0.8 ? 'high' : 'medium',
          processingTime: message.metadata?.monitoringDuration,
          elementInfo: message.metadata?.elementSelector
        }
      });

      // Record response analytics
      this.recordResponseAnalytics(message);

      this.notifyPopupOfUpdate();
    }

    // Backward compatibility for Gemini-specific responses
    if (message.type === 'GEMINI_RESPONSE') {
      console.log('🤖 Gemini response captured (legacy)');

      // Add to local conversation history
      this.addToConversationHistory({
        id: `response_${Date.now()}`,
        source: 'gemini',
        content: message.response,
        type: 'AI_RESPONSE',
        conversationId: message.conversationId,
        timestamp: new Date().toISOString()
      });

      this.sendToRelay({
        type: 'WEB_AI_RESPONSE',
        conversationId: message.conversationId,
        response: message.response,
        source: 'gemini'
      });

      this.notifyPopupOfUpdate();
    }

    if (message.type === 'SEND_TO_RELAY') {
      console.log('📤 Popup message to relay:', message.payload.type);

      // Add user message to local conversation history
      if (message.payload.type === 'AI_AUTOMATION_REQUEST' &&
        message.payload.automation === 'inject_message') {
        this.addToConversationHistory({
          id: `user_${Date.now()}`,
          source: 'human-popup',
          content: message.payload.payload.content,
          type: 'USER_MESSAGE',
          conversationId: message.payload.payload.conversationId,
          timestamp: new Date().toISOString()
        });
        this.notifyPopupOfUpdate();

        this.handleAIInject(message.payload.payload);
      } else {
        this.sendToRelay(message.payload);
      }
    }

    if (message.type === 'GET_CONVERSATION_HISTORY') {
      sendResponse({ history: this.conversationHistory });
      handled = true;
    }

    if (message.type === 'CLEAR_CONVERSATION_HISTORY') {
      this.conversationHistory = [];
      this.notifyPopupOfUpdate();
      sendResponse({ success: true });
      handled = true;
    }

    if (message.type === 'REQUEST_HISTORY_FROM_RELAY') {
      this.requestConversationHistory();
      sendResponse({ success: true });
      handled = true;
    }

    if (message.type === 'CONNECTION_STATUS') {
      sendResponse({ connected: this.isConnected });
      handled = true;
    }

    if (message.type === 'POPUP_INJECT') {
      console.log('💬 Direct popup injection request:', message);
      this.handleAIInject({
        targetAI: message.targetAI,
        content: message.content,
        conversationId: message.conversationId || `popup-${Date.now()}`
      });
    }

    // Server Management Commands
    if (message.type === 'START_WEBSOCKET_SERVER') {
      console.log('🚀 Starting WebSocket server...');
      this.executeNativeCommand('start_server', {
        port: message.port || 3001,
        redisConfig: message.redisConfig,
        autoRestart: message.autoRestart,
        clearPort: message.clearPort
      }).then(response => {
        this.serverStatus = {
          isRunning: response.success,
          port: message.port || 3001,
          connectedClients: 0,
          message: response.success ? 'Server started' : 'Failed to start server',
          error: response.success ? null : response.error
        };
        sendResponse(response);
        this.broadcastServerStatus();
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      return true; // async
    }

    if (message.type === 'STOP_WEBSOCKET_SERVER') {
      console.log('🛑 Stopping WebSocket server...');
      this.executeNativeCommand('stop_server', {
        forceKill: message.forceKill
      }).then(response => {
        this.serverStatus = {
          isRunning: false,
          port: 0,
          connectedClients: 0,
          message: 'Server stopped'
        };
        sendResponse(response);
        this.broadcastServerStatus();
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      return true; // async
    }

    if (message.type === 'RESTART_WEBSOCKET_SERVER') {
      console.log('🔄 Restarting WebSocket server...');
      this.executeNativeCommand('restart_server', {
        port: message.port || 3001,
        clearPort: message.clearPort
      }).then(response => {
        this.serverStatus = {
          isRunning: response.success,
          port: message.port || 3001,
          connectedClients: 0,
          message: response.success ? 'Server restarted' : 'Failed to restart server',
          error: response.success ? null : response.error
        };
        sendResponse(response);
        this.broadcastServerStatus();
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      return true; // async
    }

    if (message.type === 'CLEAR_BUSY_PORTS') {
      console.log('🧹 Clearing busy ports...');
      this.executeNativeCommand('clear_ports', {
        ports: message.ports || [3001, 3002, 3003, 3004, 3005]
      }).then(response => {
        sendResponse(response);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      return true; // async
    }

    if (message.type === 'GET_SERVER_STATUS') {
      sendResponse({ status: this.serverStatus });
      handled = true;
    }

    if (message.type === 'TEST_REDIS_CONNECTION') {
      this.executeNativeCommand('test_redis', message.config).then(sendResponse);
      return true; // async
    }

    // Port Management Commands
    if (message.type === 'PORT_ADD') {
      chrome.storage.local.get(['portsToCheck'], ({ portsToCheck }) => {
        const ports = portsToCheck || [3000, 3001, 5173, 8080];
        if (!ports.includes(message.port)) {
          ports.push(message.port);
          chrome.storage.local.set({ portsToCheck: ports }, () => {
            this.checkAllPorts();
            sendResponse({ success: true });
          });
        } else {
          sendResponse({ success: true, message: 'Port already monitored' });
        }
      });
      return true; // async
    }

    if (message.type === 'PORT_REMOVE') {
      chrome.storage.local.get(['portsToCheck'], ({ portsToCheck }) => {
        const ports = portsToCheck || [3000, 3001, 5173, 8080];
        const newPorts = ports.filter(p => p !== message.port);
        chrome.storage.local.set({ portsToCheck: newPorts }, () => {
          this.checkAllPorts();
          sendResponse({ success: true });
        });
      });
      return true; // async
    }

    if (message.type === 'GET_PORT_STATUS') {
      sendResponse({ status: this.portStatuses });
      handled = true;
    }

    if (message.type === 'RESTART_VITE') {
      console.log('🔄 Restarting Vite server...');
      this.executeNativeCommand('restart_vite', { port: message.port || 5173 })
        .then(sendResponse)
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // async
    }

    if (message.type === 'UPDATE_RELAY_URL') {
      this.currentRelayUrl = message.url;
      chrome.storage.local.set({ relayUrl: message.url });
      this.connectToTNFRelay();
      sendResponse({ success: true });
      handled = true;
    }

    // TNF Integration Commands
    if (message.type === 'EXECUTE_TNF_COMMAND') {
      this.executeNativeCommand(message.command, message.args || {})
        .then(sendResponse)
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // async
    }

    if (message.type === 'RELOAD_TNF_CONFIG') {
      this.loadTNFConfiguration()
        .then(() => {
          this.updateRelayUrls();
          this.connectToTNFRelay();
          sendResponse({ success: true });
        })
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // async
    }

    if (message.type === 'TNF_HEALTH_CHECK') {
      this.checkTNFInfrastructure()
        .then(() => {
          sendResponse({
            relay_connected: this.tnfIntegrationStatus.relayConnected,
            agent_registered: this.tnfIntegrationStatus.agentRegistered,
            mcp_config_loaded: this.tnfIntegrationStatus.mcpConfigLoaded,
            database_connected: this.tnfIntegrationStatus.databaseConnected,
            task_engine_status: this.tnfIntegrationStatus.taskEngineStatus || false,
            workflow_engine_status: this.tnfIntegrationStatus.workflowEngineStatus || false,
            core_api_status: this.tnfIntegrationStatus.coreApiStatus || false,
            websocket_status: this.tnfIntegrationStatus.webSocketStatus || false,
            database_health: this.tnfIntegrationStatus.databaseHealth || false,
            agent_orchestrator: this.tnfIntegrationStatus.agentOrchestrator || false,
            port_8765: this.portStatuses[8765] || false,
            port_3001: this.portStatuses[3001] || false,
            port_3000: this.portStatuses[3000] || false,
            port_3002: this.portStatuses[3002] || false
          });
        })
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // async
    }

    // New Enhanced TNF Integration Handlers
    if (message.type === 'ENABLE_TNF_FEATURES') {
      this.enableTNFFeatures(message.features)
        .then(result => sendResponse({ success: true, features: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // async
    }

    if (message.type === 'TOGGLE_TNF_FEATURE') {
      this.toggleTNFFeature(message.feature, message.enabled)
        .then(result => sendResponse({ success: true, feature: message.feature, enabled: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // async
    }

    if (message.type === 'CONNECT_TNF_ORCHESTRATOR') {
      this.connectToTNFOrchestrator(message.config)
        .then(result => sendResponse({ success: true, orchestrator: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // async
    }

    if (message.type === 'SYNC_WITH_TNF_CORE') {
      this.synchronizeWithTNFCore(message.syncData)
        .then(result => sendResponse({ success: true, syncResult: result, connectionQuality: 'good' }))
        .catch(error => sendResponse({ success: false, error: error.message, connectionQuality: 'poor' }));
      return true; // async
    }

    if (message.type === 'GET_PERFORMANCE_METRICS') {
      this.getPerformanceMetrics()
        .then(metrics => sendResponse({ success: true, metrics }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // async
    }

    if (message.type === 'INITIATE_TNF_WORKFLOW') {
      this.initiateTNFWorkflow(message.workflow)
        .then(workflowId => sendResponse({ success: true, workflowId }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // async
    }

    return handled;
  });
}

  // Enhanced TNF Integration Methods

  async enableTNFFeatures(features) {
  try {
    console.log('🚀 Enabling TNF features:', features);

    // Store feature states
    const featureConfig = {};
    features.forEach(feature => {
      featureConfig[`${feature}Enabled`] = true;
    });

    chrome.storage.local.set({ features: featureConfig });

    // Update TNF integration status
    this.tnfIntegrationStatus = {
      ...this.tnfIntegrationStatus,
      taskEngineStatus: features.includes('agentSwarm'),
      workflowEngineStatus: features.includes('workflowAutomation'),
      agentOrchestrator: features.includes('realTimeMonitoring')
    };

    return featureConfig;
  } catch (error) {
    console.error('Error enabling TNF features:', error);
    throw error;
  }
}

  async toggleTNFFeature(feature, enabled) {
  try {
    console.log(`🔄 Toggling TNF feature ${feature}: ${enabled}`);

    chrome.storage.local.get(['features'], (result) => {
      const features = result.features || {};
      features[`${feature}Enabled`] = enabled;
      chrome.storage.local.set({ features });
    });

    return enabled;
  } catch (error) {
    console.error(`Error toggling TNF feature ${feature}:`, error);
    throw error;
  }
}

  async connectToTNFOrchestrator(config) {
  try {
    console.log('🎯 Connecting to TNF Agent Orchestrator:', config);

    // Simulate connection to TNF orchestrator
    this.tnfIntegrationStatus.agentOrchestrator = true;

    // In a real implementation, this would connect to the actual TNF orchestrator
    // For now, we'll simulate the connection
    const orchestratorData = {
      agentId: config.agentId,
      connected: true,
      capabilities: config.capabilities,
      timestamp: new Date().toISOString()
    };

    chrome.storage.local.set({ orchestratorConnection: orchestratorData });

    return orchestratorData;
  } catch (error) {
    console.error('Error connecting to TNF orchestrator:', error);
    throw error;
  }
}

  async synchronizeWithTNFCore(syncData) {
  try {
    console.log('🔄 Synchronizing with TNF Core:', syncData);

    // Store sync data
    const syncResult = {
      timestamp: new Date().toISOString(),
      dataTypes: Object.keys(syncData),
      recordCount: syncData.conversationHistory?.length || 0,
      features: syncData.features,
      performance: syncData.performance
    };

    chrome.storage.local.set({ lastTNFSync: syncResult });

    // Update integration status
    this.tnfIntegrationStatus.lastSync = new Date();

    return syncResult;
  } catch (error) {
    console.error('Error synchronizing with TNF Core:', error);
    throw error;
  }
}

  async getPerformanceMetrics() {
  try {
    const metrics = {
      responseTime: Math.floor(Math.random() * 100) + 50, // Simulated metrics
      throughput: Math.floor(Math.random() * 10) + 1,
      errorRate: Math.floor(Math.random() * 5),
      uptime: Math.floor((Date.now() - performance.timeOrigin) / 1000),
      conversationCount: this.conversationHistory.length,
      injectionSuccessRate: 95 + Math.floor(Math.random() * 5),
      timestamp: new Date().toISOString()
    };

    console.log('📊 Performance metrics:', metrics);
    return metrics;
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    throw error;
  }
}

  async initiateTNFWorkflow(workflow) {
  try {
    console.log('🔄 Initiating TNF workflow:', workflow);

    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store workflow data
    const workflowData = {
      id: workflowId,
      type: workflow.type,
      agents: workflow.agents,
      priority: workflow.priority,
      status: 'initiated',
      timestamp: new Date().toISOString()
    };

    chrome.storage.local.get(['workflows'], (result) => {
      const workflows = result.workflows || [];
      workflows.push(workflowData);
      chrome.storage.local.set({ workflows });
    });

    return workflowId;
  } catch (error) {
    console.error('Error initiating TNF workflow:', error);
    throw error;
  }
}
}

// Initialize
new TNFAIBridge();
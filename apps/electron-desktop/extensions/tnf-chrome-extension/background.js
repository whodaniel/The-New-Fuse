/**
 * The New Fuse Chrome Extension - Background Service Worker
 *
 * Responsibilities:
 * - Manage connection to TNF Relay
 * - Route messages between popup, content scripts, and relay
 * - Handle agent registration and communication
 * - Manage extension state and storage
 *
 * @version 1.0.0
 */

// ============================================
// Configuration
// ============================================

const CONFIG = {
  relayUrl: 'http://localhost:3000',
  wsPort: 3000,
  agentId: `chrome-bridge-${Date.now()}`,
  agentName: 'TNF Chrome Bridge',
  agentType: 'browser-bridge',
  reconnectDelay: 5000,
  maxReconnectAttempts: 10,
};

// ============================================
// State
// ============================================

let state = {
  isConnected: false,
  ws: null,
  reconnectAttempts: 0,
  registeredAsAgent: false,
  settings: {
    autoConnect: true,
    autoReconnect: true,
    showBadge: true,
    notifications: true,
  },
  tabs: new Map(), // tabId -> tab info
  messageQueue: [],
};

// ============================================
// Initialization
// ============================================

console.log('🚀 [TNF Background] Service worker starting...');

// Load settings from storage
chrome.storage.sync.get(['tnfSettings'], (result) => {
  if (result.tnfSettings) {
    state.settings = { ...state.settings, ...result.tnfSettings };
    CONFIG.relayUrl = result.tnfSettings.relayUrl || CONFIG.relayUrl;
    CONFIG.wsPort = result.tnfSettings.wsPort || CONFIG.wsPort;
  }

  console.log('[TNF Background] Settings loaded');

  // Auto-connect if enabled
  if (state.settings.autoConnect) {
    connectToRelay();
  }
});

// ============================================
// Relay Connection
// ============================================

async function connectToRelay() {
  if (state.isConnected) {
    console.log('[TNF Background] Already connected');
    return;
  }

  console.log(`[TNF Background] Connecting to relay at ${CONFIG.relayUrl}...`);
  updateBadge('connecting');

  try {
    // Check relay health
    const healthResponse = await fetch(`${CONFIG.relayUrl}/relay/health`);
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }

    const health = await healthResponse.json();
    console.log('[TNF Background] Relay health:', health);

    // For now, we'll use HTTP polling since service workers don't support WebSocket well
    // In a full implementation, you'd use an offscreen document for WebSocket
    state.isConnected = true;
    state.reconnectAttempts = 0;

    updateBadge('connected');
    console.log('[TNF Background] ✅ Connected to relay');

    // Register as agent
    await registerAsAgent();

    // Start polling for messages
    startPolling();

    // Notify popup
    broadcastToPopup({
      type: 'CONNECTION_STATUS',
      payload: { connected: true, url: CONFIG.relayUrl },
    });
  } catch (error) {
    console.error('[TNF Background] Connection failed:', error);
    state.isConnected = false;
    updateBadge('disconnected');

    if (state.settings.autoReconnect && state.reconnectAttempts < CONFIG.maxReconnectAttempts) {
      scheduleReconnect();
    }
  }
}

function disconnectFromRelay() {
  state.isConnected = false;
  updateBadge('disconnected');

  // Unregister agent
  if (state.registeredAsAgent) {
    unregisterAgent();
  }

  broadcastToPopup({
    type: 'CONNECTION_STATUS',
    payload: { connected: false },
  });

  console.log('[TNF Background] Disconnected from relay');
}

function scheduleReconnect() {
  state.reconnectAttempts++;
  const delay = Math.min(CONFIG.reconnectDelay * Math.pow(2, state.reconnectAttempts - 1), 30000);

  console.log(
    `[TNF Background] Scheduling reconnect attempt ${state.reconnectAttempts} in ${delay}ms`
  );

  setTimeout(() => {
    if (!state.isConnected) {
      connectToRelay();
    }
  }, delay);
}

// ============================================
// Agent Management
// ============================================

async function registerAsAgent() {
  try {
    const response = await fetch(`${CONFIG.relayUrl}/relay/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: CONFIG.agentId,
        name: CONFIG.agentName,
        type: CONFIG.agentType,
        capabilities: [
          'web-bridge',
          'ai-detection',
          'text-injection',
          'response-capture',
          'tab-management',
        ],
        metadata: {
          browser: 'chrome',
          extensionVersion: chrome.runtime.getManifest().version,
        },
      }),
    });

    const data = await response.json();

    if (data.success) {
      state.registeredAsAgent = true;
      console.log('[TNF Background] ✅ Registered as agent:', CONFIG.agentId);
    } else {
      console.warn('[TNF Background] Agent registration failed:', data.error);
    }
  } catch (error) {
    console.error('[TNF Background] Agent registration error:', error);
  }
}

async function unregisterAgent() {
  try {
    await fetch(`${CONFIG.relayUrl}/relay/agents/${CONFIG.agentId}`, {
      method: 'DELETE',
    });
    state.registeredAsAgent = false;
    console.log('[TNF Background] Agent unregistered');
  } catch (error) {
    console.error('[TNF Background] Unregister error:', error);
  }
}

// ============================================
// Message Polling (alternative to WebSocket)
// ============================================

let pollingInterval = null;

function startPolling() {
  if (pollingInterval) return;

  // Poll for messages every 2 seconds
  pollingInterval = setInterval(async () => {
    if (!state.isConnected) {
      stopPolling();
      return;
    }

    try {
      // This would be replaced with actual message fetching logic
      // For now, we'll just check status
      const response = await fetch(`${CONFIG.relayUrl}/relay/status`);
      if (!response.ok) {
        throw new Error('Status check failed');
      }
    } catch (error) {
      console.warn('[TNF Background] Polling error:', error);
      state.isConnected = false;
      updateBadge('disconnected');
      stopPolling();

      if (state.settings.autoReconnect) {
        scheduleReconnect();
      }
    }
  }, 5000);
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

// ============================================
// Badge Management
// ============================================

function updateBadge(status) {
  if (!state.settings.showBadge) {
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  const badges = {
    connected: { text: '✓', color: '#10b981' },
    disconnected: { text: '', color: '#64748b' },
    connecting: { text: '...', color: '#f59e0b' },
    error: { text: '!', color: '#ef4444' },
  };

  const badge = badges[status] || badges.disconnected;

  chrome.action.setBadgeText({ text: badge.text });
  chrome.action.setBadgeBackgroundColor({ color: badge.color });
}

// ============================================
// Tab Management
// ============================================

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    state.tabs.set(tabId, {
      id: tabId,
      url: tab.url,
      title: tab.title,
      platform: detectPlatformFromUrl(tab.url),
    });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  state.tabs.delete(tabId);
});

function detectPlatformFromUrl(url) {
  if (!url) return null;

  const platforms = {
    'gemini.google.com': 'gemini',
    'bard.google.com': 'gemini',
    'chat.openai.com': 'chatgpt',
    'chatgpt.com': 'chatgpt',
    'claude.ai': 'claude',
    'perplexity.ai': 'perplexity',
  };

  for (const [domain, platform] of Object.entries(platforms)) {
    if (url.includes(domain)) {
      return platform;
    }
  }
  return null;
}

// ============================================
// Message Routing
// ============================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[TNF Background] Message received:', request.type);

  switch (request.type) {
    // ============================================
    // Connection Management
    // ============================================
    case 'CONNECT':
      connectToRelay().then(() => sendResponse({ success: true }));
      return true;

    case 'DISCONNECT':
      disconnectFromRelay();
      sendResponse({ success: true });
      break;

    case 'GET_CONNECTION_STATUS':
      sendResponse({
        connected: state.isConnected,
        registeredAsAgent: state.registeredAsAgent,
        relayUrl: CONFIG.relayUrl,
        agentId: CONFIG.agentId,
      });
      break;

    // ============================================
    // Agent & Messaging
    // ============================================
    case 'GET_AGENTS':
      fetchAgents().then(sendResponse);
      return true;

    case 'SEND_MESSAGE':
      sendRelayMessage(request.payload).then(sendResponse);
      return true;

    case 'BROADCAST_MESSAGE':
      broadcastRelayMessage(request.payload).then(sendResponse);
      return true;

    // ============================================
    // Content Script Events
    // ============================================
    case 'CONTENT_SCRIPT_READY':
      handleContentScriptReady(sender.tab, request.payload);
      sendResponse({ success: true });
      break;

    case 'AI_RESPONSE_CAPTURED':
      handleAIResponse(request.payload, sender.tab);
      sendResponse({ success: true });
      break;

    // ============================================
    // Tab Management
    // ============================================
    case 'GET_TABS':
      sendResponse({
        tabs: Array.from(state.tabs.values()),
        count: state.tabs.size,
      });
      break;

    case 'INJECT_TO_TAB':
      injectToTab(request.payload.tabId, request.payload.message).then(sendResponse);
      return true;

    // ============================================
    // Settings
    // ============================================
    case 'GET_SETTINGS':
      sendResponse(state.settings);
      break;

    case 'UPDATE_SETTINGS':
      state.settings = { ...state.settings, ...request.payload };
      chrome.storage.sync.set({ tnfSettings: state.settings });
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

// ============================================
// Relay API Functions
// ============================================

async function fetchAgents() {
  if (!state.isConnected) {
    return { success: false, error: 'Not connected', agents: [] };
  }

  try {
    const response = await fetch(`${CONFIG.relayUrl}/relay/agents`);
    const data = await response.json();
    return { success: true, agents: data.agents || [], count: data.count };
  } catch (error) {
    return { success: false, error: error.message, agents: [] };
  }
}

async function sendRelayMessage(payload) {
  if (!state.isConnected) {
    return { success: false, error: 'Not connected' };
  }

  try {
    const response = await fetch(`${CONFIG.relayUrl}/relay/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: payload.type || 'message',
        source: CONFIG.agentId,
        target: payload.target,
        payload: payload.content || payload.payload,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function broadcastRelayMessage(payload) {
  if (!state.isConnected) {
    return { success: false, error: 'Not connected' };
  }

  try {
    const response = await fetch(`${CONFIG.relayUrl}/relay/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: CONFIG.agentId,
        type: payload.type || 'broadcast',
        payload: payload.content || payload.payload,
        filter: payload.filter,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================
// Content Script Interaction
// ============================================

function handleContentScriptReady(tab, payload) {
  if (!tab) return;

  state.tabs.set(tab.id, {
    id: tab.id,
    url: tab.url,
    title: tab.title,
    platform: payload.platform,
    ready: true,
  });

  console.log(
    `[TNF Background] Content script ready on tab ${tab.id}: ${payload.platform || 'unknown platform'}`
  );

  // Notify popup
  broadcastToPopup({
    type: 'TAB_READY',
    payload: { tabId: tab.id, platform: payload.platform },
  });
}

function handleAIResponse(payload, tab) {
  console.log('[TNF Background] AI response captured:', payload.platform);

  // Forward to relay if connected
  if (state.isConnected) {
    sendRelayMessage({
      type: 'ai_response',
      content: {
        source: payload.platform,
        content: payload.content,
        timestamp: payload.timestamp,
        tabId: tab?.id,
        url: tab?.url,
      },
    });
  }

  // Notify popup
  broadcastToPopup({
    type: 'AI_RESPONSE',
    payload,
  });

  // Show notification if enabled
  if (state.settings.notifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'AI Response Captured',
      message: `From ${payload.platform}: ${payload.content.substring(0, 100)}...`,
    });
  }
}

async function injectToTab(tabId, message) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, message);
    return response;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================
// Popup Communication
// ============================================

function broadcastToPopup(message) {
  chrome.runtime.sendMessage(message).catch(() => {
    // Popup might not be open, that's okay
  });
}

// ============================================
// Context Menu
// ============================================

chrome.runtime.onInstalled.addListener(() => {
  console.log('[TNF Background] Extension installed/updated');

  // Create context menus
  chrome.contextMenus.create({
    id: 'tnf-inject-selection',
    title: 'Inject Selected Text',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: 'tnf-capture-page',
    title: 'Capture Page Content',
    contexts: ['page'],
  });

  chrome.contextMenus.create({
    id: 'tnf-send-to-relay',
    title: 'Send to TNF Relay',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'tnf-inject-selection':
      if (info.selectionText) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'INJECT_TEXT',
          payload: { text: info.selectionText, submit: false },
        });
      }
      break;

    case 'tnf-capture-page':
      chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_RESPONSE' }, (response) => {
        if (response?.success) {
          handleAIResponse(response, tab);
        }
      });
      break;

    case 'tnf-send-to-relay':
      if (info.selectionText && state.isConnected) {
        sendRelayMessage({
          type: 'user_selection',
          content: info.selectionText,
          source: tab.url,
        });
      }
      break;
  }
});

// ============================================
// Alarms (Periodic Tasks)
// ============================================

chrome.alarms.create('tnf-health-check', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'tnf-health-check') {
    if (state.isConnected) {
      // Check if relay is still healthy
      fetch(`${CONFIG.relayUrl}/relay/health`)
        .then((r) => r.json())
        .catch(() => {
          console.warn('[TNF Background] Health check failed');
          state.isConnected = false;
          updateBadge('disconnected');

          if (state.settings.autoReconnect) {
            connectToRelay();
          }
        });
    }
  }
});

// ============================================
// Cleanup
// ============================================

// Handle extension disable/unload
chrome.runtime.onSuspend?.addListener(() => {
  console.log('[TNF Background] Extension suspending...');
  stopPolling();
  disconnectFromRelay();
});

console.log('[TNF Background] Service worker initialized');

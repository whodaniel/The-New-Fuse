/**
 * Fuse Connect - Popup Script (Vanilla JS)
 */

let state = {
  websocketConnected: false,
  redisConnected: false,
  agentId: '',
  currentPlatform: null,
  agents: [],
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupTabNavigation();
  setupEventListeners();
  loadState();
  loadSettings();
});

// Tab Navigation
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const tabId = button.dataset.tab;

      // Update buttons
      tabButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');

      // Update panes
      tabPanes.forEach((pane) => pane.classList.remove('active'));
      document.getElementById(`${tabId}Tab`).classList.add('active');
    });
  });
}

// Event Listeners
function setupEventListeners() {
  document.getElementById('connectBtn').addEventListener('click', handleConnect);
  document.getElementById('autoDetectBtn').addEventListener('click', handleAutoDetect);
  document.getElementById('startSessionBtn').addEventListener('click', handleStartSession);
  document.getElementById('togglePanelBtn').addEventListener('click', handleTogglePanel);
  document.getElementById('saveSettingsBtn').addEventListener('click', handleSaveSettings);

  // Listen for status updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'STATUS_UPDATE') {
      updateStatus(message.status);
    } else if (message.type === 'AGENT_LIST_UPDATE') {
      state.agents = message.agents || [];
      updateAgentsTab();
    }
  });
}

// Load State
async function loadState() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
    if (response?.success && response.status) {
      updateStatus(response.status);
    }
  } catch (error) {
    console.error('Failed to load state:', error);
  }
}

// Load Settings
async function loadSettings() {
  try {
    const saved = await chrome.storage.local.get(['settings']);
    if (saved.settings) {
      document.getElementById('relayUrlInput').value = saved.settings.relayUrl || 'ws://localhost:3001/ws';
      document.getElementById('autoReconnectCheck').checked = saved.settings.autoReconnect !== false;
      document.getElementById('debugModeCheck').checked = saved.settings.debugMode || false;
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

// Update Status
function updateStatus(status) {
  state = { ...state, ...status };

  // Update status indicators
  const statusDot = document.getElementById('statusDot');
  const relayIndicator = document.getElementById('relayIndicator');
  const redisIndicator = document.getElementById('redisIndicator');
  const platformIndicator = document.getElementById('platformIndicator');

  // Main status dot
  if (state.websocketConnected) {
    statusDot.classList.add('online');
    statusDot.classList.remove('offline');
  } else {
    statusDot.classList.remove('online');
    statusDot.classList.add('offline');
  }

  // Relay status
  relayIndicator.className = 'status-indicator';
  const relayStatus = document.getElementById('relayStatus');
  if (state.websocketConnected) {
    relayIndicator.classList.add('status-online');
    relayStatus.textContent = 'CONNECTED';
    relayStatus.className = 'status-value neon-text-green';
  } else {
    relayIndicator.classList.add('status-offline');
    relayStatus.textContent = 'DISCONNECTED';
    relayStatus.className = 'status-value text-secondary';
  }

  // Redis status
  redisIndicator.className = 'status-indicator';
  const redisStatus = document.getElementById('redisStatus');
  if (state.redisConnected) {
    redisIndicator.classList.add('status-online');
    redisStatus.textContent = 'CONNECTED';
    redisStatus.className = 'status-value neon-text-green';
  } else {
    redisIndicator.classList.add('status-offline');
    redisStatus.textContent = 'DISCONNECTED';
    redisStatus.className = 'status-value text-secondary';
  }

  // Platform status
  platformIndicator.className = 'status-indicator';
  const platformStatus = document.getElementById('platformStatus');
  if (state.currentPlatform) {
    platformIndicator.classList.add('status-online');
    platformStatus.textContent = 'DETECTED';
    platformStatus.className = 'status-value neon-text-cyan';
    updatePlatformCard(state.currentPlatform);
  } else {
    platformIndicator.classList.add('status-idle');
    platformStatus.textContent = 'NOT DETECTED';
    platformStatus.className = 'status-value text-secondary';
    document.getElementById('platformSection').style.display = 'none';
  }

  // Agent ID
  document.getElementById('agentId').textContent = state.agentId || 'Not assigned';

  // Connect button
  const connectBtn = document.getElementById('connectBtn');
  if (state.websocketConnected) {
    connectBtn.innerHTML = '<span>🔌</span> Disconnect';
    connectBtn.onclick = handleDisconnect;
  } else {
    connectBtn.innerHTML = '<span>🔌</span> Connect to Relay';
    connectBtn.onclick = handleConnect;
  }
}

// Update Platform Card
function updatePlatformCard(platform) {
  const platformNames = {
    chatgpt: 'ChatGPT',
    claude: 'Claude',
    gemini: 'Google Gemini',
    perplexity: 'Perplexity AI',
    deepseek: 'DeepSeek',
  };

  const platformIcons = {
    chatgpt: '🤖',
    claude: '🧠',
    gemini: '✨',
    perplexity: '🔍',
    deepseek: '🌊',
  };

  const card = document.getElementById('platformCard');
  card.innerHTML = `
    <div class="platform-icon">${platformIcons[platform] || '🤖'}</div>
    <div class="platform-info">
      <div class="platform-name">${platformNames[platform] || platform}</div>
      <div class="platform-url text-secondary">${window.location.hostname || 'Unknown'}</div>
    </div>
  `;
  document.getElementById('platformSection').style.display = 'block';
}

// Update Agents Tab
function updateAgentsTab() {
  document.getElementById('agentCount').textContent = state.agents.length;

  const content = document.getElementById('agentsContent');

  if (state.agents.length === 0) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <p class="empty-text">No network agents detected</p>
        <p class="empty-subtext text-secondary">Connect to TNF Relay to see active agents</p>
      </div>
    `;
    return;
  }

  const agentHTML = state.agents
    .map(
      (agent) => `
    <div class="agent-card">
      <div class="agent-header">
        <span class="agent-name">${agent.name}</span>
        <span class="agent-badge ${agent.role}">${agent.role.toUpperCase()}</span>
      </div>
      <div class="agent-details">
        <div class="agent-detail">
          <span>Platform:</span>
          <span class="neon-text-cyan">${agent.platform}</span>
        </div>
        <div class="agent-detail">
          <span>Status:</span>
          <span class="status-${agent.status}">● ${agent.status}</span>
        </div>
      </div>
    </div>
  `
    )
    .join('');

  content.innerHTML = agentHTML;
}

// Handlers
async function handleConnect() {
  try {
    await chrome.runtime.sendMessage({ type: 'CONNECT' });
  } catch (error) {
    console.error('Connect failed:', error);
  }
}

async function handleDisconnect() {
  try {
    await chrome.runtime.sendMessage({ type: 'DISCONNECT' });
  } catch (error) {
    console.error('Disconnect failed:', error);
  }
}

async function handleAutoDetect() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'AUTO_DETECT_ELEMENTS' });
    }
  } catch (error) {
    console.error('Auto-detect failed:', error);
  }
}

async function handleStartSession() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'START_AI_SESSION' });
    }
  } catch (error) {
    console.error('Start session failed:', error);
  }
}

async function handleTogglePanel() {
  try {
    await chrome.runtime.sendMessage({ type: 'TOGGLE_FLOATING_PANEL' });
  } catch (error) {
    console.error('Toggle panel failed:', error);
  }
}

async function handleSaveSettings() {
  try {
    const settings = {
      relayUrl: document.getElementById('relayUrlInput').value,
      autoReconnect: document.getElementById('autoReconnectCheck').checked,
      debugMode: document.getElementById('debugModeCheck').checked,
    };

    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      payload: settings,
    });

    // Visual feedback
    const btn = document.getElementById('saveSettingsBtn');
    btn.textContent = '✅ Saved!';
    setTimeout(() => {
      btn.innerHTML = '💾 Save Settings';
    }, 2000);
  } catch (error) {
    console.error('Save settings failed:', error);
  }
}

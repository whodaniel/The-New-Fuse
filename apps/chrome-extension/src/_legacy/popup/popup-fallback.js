// The New Fuse - Popup Script (Vanilla JS Fallback)
console.log('The New Fuse popup script loading...');

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializePopup);

// State management
let state = {
  connectionStatus: {
    connected: false,
    websocketStatus: 'DISCONNECTED',
    aiSessionActive: false,
    port: 3712,
    isConnecting: false,
  },
  elementStatus: {
    inputField: false,
    sendButton: false,
    outputArea: false,
  },
  currentUrl: 'https://chatgpt.com/',
  currentTab: 'elements',
};

function initializePopup() {
  console.log('Initializing The New Fuse popup...');

  // Create the main UI
  createUI();

  // Set up message listeners
  setupMessageListeners();

  // Get current tab URL
  if (chrome && chrome.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        state.currentUrl = tabs[0].url;
        updateUI();
      }
    });
  }

  // Request initial status
  if (chrome && chrome.runtime) {
    chrome.runtime.sendMessage({ type: 'GET_STATUS' });
  }

  console.log('The New Fuse popup initialized!');
}

function createUI() {
  const container = document.getElementById('popup-root');
  if (!container) {
    console.error('popup-root container not found!');
    return;
  }

  container.innerHTML = `
    <div style="
      width: 400px;
      height: 600px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    ">
      <!-- Header -->
      <div style="
        padding: 16px;
        text-align: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
      ">
        <h1 style="
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        ">The New Fuse</h1>
        <div id="connection-indicator" style="
          font-size: 12px;
          opacity: 0.8;
          margin-top: 4px;
        ">
          🔴 Disconnected
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div style="
        display: flex;
        background: rgba(255, 255, 255, 0.1);
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      ">
        <button id="tab-elements" class="nav-tab active" style="
          flex: 1;
          padding: 8px 4px;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 2px solid white;
        ">
          <div style="font-size: 14px;">🎯</div>
          <div>Elements</div>
        </button>
        <button id="tab-session" class="nav-tab" style="
          flex: 1;
          padding: 8px 4px;
          border: none;
          background: transparent;
          color: white;
          font-size: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 2px solid transparent;
        ">
          <div style="font-size: 14px;">🤖</div>
          <div>AI Session</div>
        </button>
        <button id="tab-connection" class="nav-tab" style="
          flex: 1;
          padding: 8px 4px;
          border: none;
          background: transparent;
          color: white;
          font-size: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 2px solid transparent;
        ">
          <div style="font-size: 14px;">🔌</div>
          <div>Connection</div>
        </button>
        <button id="tab-settings" class="nav-tab" style="
          flex: 1;
          padding: 8px 4px;
          border: none;
          background: transparent;
          color: white;
          font-size: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 2px solid transparent;
        ">
          <div style="font-size: 14px;">⚙️</div>
          <div>Settings</div>
        </button>
      </div>

      <!-- Content Area -->
      <div style="
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      ">
        <!-- Elements Tab Content -->
        <div id="content-elements" class="tab-content" style="display: block;">
          <div style="
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 16px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          ">
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 16px;
            ">
              <span style="font-size: 16px;">🎯</span>
              <h3 style="
                margin: 0;
                font-size: 14px;
                font-weight: 700;
                letter-spacing: 0.5px;
              ">ELEMENT DETECTION</h3>
            </div>

            <!-- Element Status Indicators -->
            <div style="
              background: rgba(255, 255, 255, 0.1);
              border-radius: 8px;
              padding: 12px;
              margin-bottom: 16px;
            ">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 12px;">Input Field:</span>
                <div id="status-input" style="
                  width: 12px;
                  height: 12px;
                  border-radius: 50%;
                  background: #ff4757;
                "></div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 12px;">Send Button:</span>
                <div id="status-button" style="
                  width: 12px;
                  height: 12px;
                  border-radius: 50%;
                  background: #ff4757;
                "></div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12px;">Output Area:</span>
                <div id="status-output" style="
                  width: 12px;
                  height: 12px;
                  border-radius: 50%;
                  background: #ff4757;
                "></div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <button id="btn-auto-detect" style="
                padding: 10px 16px;
                border: none;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                background: linear-gradient(135deg, #2ed573 0%, #17a085 100%);
                color: white;
                transition: transform 0.2s ease;
              ">
                🔍 Auto-Detect Elements
              </button>
              
              <button id="btn-select-input" style="
                padding: 10px 16px;
                border: none;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                background: linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%);
                color: white;
                transition: transform 0.2s ease;
              ">
                💬 Select Chat Input
              </button>
              
              <button id="btn-select-button" style="
                padding: 10px 16px;
                border: none;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                background: linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%);
                color: white;
                transition: transform 0.2s ease;
              ">
                ➤ Select Send Button
              </button>
              
              <button id="btn-select-output" style="
                padding: 10px 16px;
                border: none;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                background: linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%);
                color: white;
                transition: transform 0.2s ease;
              ">
                💬 Select Chat Output
              </button>
              
              <button id="btn-validate" style="
                padding: 10px 16px;
                border: none;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
                color: white;
                transition: transform 0.2s ease;
              ">
                ✅ Validate Elements
              </button>
              
              <button id="btn-toggle-panel" style="
                padding: 10px 16px;
                border: none;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
                color: white;
                transition: transform 0.2s ease;
              ">
                🎛️ Toggle Floating Panel
              </button>
            </div>
          </div>
        </div>

        <!-- AI Session Tab Content -->
        <div id="content-session" class="tab-content" style="display: none;">
          <div style="
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 16px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          ">
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 16px;
            ">
              <span style="font-size: 16px;">🤖</span>
              <h3 style="
                margin: 0;
                font-size: 14px;
                font-weight: 700;
                letter-spacing: 0.5px;
              ">AI SESSION</h3>
            </div>
            
            <div style="margin-bottom: 16px;">
              <input id="current-url" type="text" value="https://chatgpt.com/" readonly style="
                width: 100%;
                padding: 8px 12px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 6px;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                font-size: 12px;
                box-sizing: border-box;
              ">
            </div>
            
            <div style="
              display: flex;
              gap: 8px;
              margin-bottom: 16px;
            ">
              <button id="btn-start-session" style="
                flex: 1;
                padding: 10px 12px;
                border: none;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                background: linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%);
                color: white;
                transition: transform 0.2s ease;
              ">
                🚀 Start AI Session
              </button>
              
              <button id="btn-end-session" style="
                flex: 1;
                padding: 10px 12px;
                border: none;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                cursor: not-allowed;
                background: #666;
                color: white;
                transition: transform 0.2s ease;
              " disabled>
                🛑 End AI Session
              </button>
            </div>

            <div id="session-status" style="
              text-align: center;
              font-size: 12px;
              padding: 8px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 6px;
            ">
              Status: Inactive
            </div>
          </div>
        </div>

        <!-- Connection Tab Content -->
        <div id="content-connection" class="tab-content" style="display: none;">
          <div style="
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 16px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          ">
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 16px;
            ">
              <span style="font-size: 16px;">🔌</span>
              <h3 style="
                margin: 0;
                font-size: 14px;
                font-weight: 700;
                letter-spacing: 0.5px;
              ">WEBSOCKET CONNECTION</h3>
            </div>
            
            <div style="
              margin-bottom: 16px;
              text-align: center;
            ">
              <span id="websocket-status" style="
                display: inline-block;
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 700;
                letter-spacing: 0.5px;
                background: #ff4757;
                color: white;
              ">
                DISCONNECTED
              </span>
            </div>

            <div style="margin-bottom: 16px;">
              <label style="font-size: 12px; margin-bottom: 4px; display: block;">Port:</label>
              <input id="port-input" type="number" value="3712" style="
                width: 100%;
                padding: 8px 12px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 6px;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                font-size: 12px;
                box-sizing: border-box;
              ">
            </div>
            
            <div style="
              display: flex;
              gap: 8px;
            ">
              <button id="btn-connect" style="
                flex: 1;
                padding: 10px 12px;
                border: none;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                background: linear-gradient(135deg, #3742fa 0%, #2f3542 100%);
                color: white;
                transition: transform 0.2s ease;
              ">
                Connect
              </button>
              
              <button id="btn-disconnect" style="
                flex: 1;
                padding: 10px 12px;
                border: none;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                cursor: not-allowed;
                background: #666;
                color: white;
                transition: transform 0.2s ease;
              " disabled>
                Disconnect
              </button>
            </div>
          </div>
        </div>

        <!-- Settings Tab Content -->
        <div id="content-settings" class="tab-content" style="display: none;">
          <div style="
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 16px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          ">
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 16px;
            ">
              <span style="font-size: 16px;">⚙️</span>
              <h3 style="
                margin: 0;
                font-size: 14px;
                font-weight: 700;
                letter-spacing: 0.5px;
              ">SETTINGS</h3>
            </div>

            <div style="font-size: 12px; opacity: 0.8;">
              <p style="margin: 8px 0;">• Auto-detection settings</p>
              <p style="margin: 8px 0;">• Connection preferences</p>
              <p style="margin: 8px 0;">• Notification settings</p>
              <p style="margin: 8px 0;">• Debug options</p>
            </div>

            <button style="
              width: 100%;
              padding: 10px 16px;
              border: none;
              border-radius: 8px;
              font-size: 12px;
              font-weight: 600;
              cursor: pointer;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              margin-top: 16px;
            ">
              Open Advanced Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Set up event listeners
  setupEventListeners();
}

function setupEventListeners() {
  // Tab navigation
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', (e) => {
      const tabId = e.currentTarget.id.replace('tab-', '');
      switchTab(tabId);
    });
  });

  // Element detection buttons
  document.getElementById('btn-auto-detect')?.addEventListener('click', handleAutoDetectElements);
  document.getElementById('btn-select-input')?.addEventListener('click', handleSelectChatInput);
  document.getElementById('btn-select-button')?.addEventListener('click', handleSelectSendButton);
  document.getElementById('btn-select-output')?.addEventListener('click', handleSelectChatOutput);
  document.getElementById('btn-validate')?.addEventListener('click', handleValidateElements);
  document.getElementById('btn-toggle-panel')?.addEventListener('click', handleToggleFloatingPanel);

  // AI session buttons
  document.getElementById('btn-start-session')?.addEventListener('click', handleStartAiSession);
  document.getElementById('btn-end-session')?.addEventListener('click', handleEndAiSession);

  // Connection buttons
  document.getElementById('btn-connect')?.addEventListener('click', handleConnect);
  document.getElementById('btn-disconnect')?.addEventListener('click', handleDisconnect);

  // Port input
  document.getElementById('port-input')?.addEventListener('change', (e) => {
    state.connectionStatus.port = parseInt(e.target.value) || 3712;
  });
}

function switchTab(tabId) {
  // Update tab buttons
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    if (tab.id === `tab-${tabId}`) {
      tab.style.background = 'rgba(255, 255, 255, 0.2)';
      tab.style.borderBottom = '2px solid white';
    } else {
      tab.style.background = 'transparent';
      tab.style.borderBottom = '2px solid transparent';
    }
  });

  // Update tab content
  document.querySelectorAll('.tab-content').forEach((content) => {
    content.style.display = 'none';
  });

  const activeContent = document.getElementById(`content-${tabId}`);
  if (activeContent) {
    activeContent.style.display = 'block';
  }

  state.currentTab = tabId;
}

function setupMessageListeners() {
  if (chrome && chrome.runtime) {
    chrome.runtime.onMessage.addListener((message) => {
      switch (message.type) {
        case 'WEBSOCKET_STATUS_UPDATE':
          state.connectionStatus.websocketStatus = message.payload.status.toUpperCase();
          state.connectionStatus.connected = message.payload.status === 'connected';
          state.connectionStatus.isConnecting = false;
          updateUI();
          break;
        case 'AI_SESSION_STATUS_UPDATE':
          state.connectionStatus.aiSessionActive = message.payload.status === 'Active';
          updateUI();
          break;
        case 'ELEMENT_SELECTED':
          state.elementStatus[message.payload.elementType] = true;
          updateUI();
          break;
        case 'ELEMENTS_DETECTED':
          state.elementStatus = {
            inputField: message.payload.input || false,
            sendButton: message.payload.button || false,
            outputArea: message.payload.output || false,
          };
          updateUI();
          break;
      }
    });
  }
}

function updateUI() {
  // Update connection indicator
  const connectionIndicator = document.getElementById('connection-indicator');
  if (connectionIndicator) {
    connectionIndicator.textContent = state.connectionStatus.connected
      ? '🟢 Connected'
      : '🔴 Disconnected';
  }

  // Update element status indicators
  const statusInput = document.getElementById('status-input');
  const statusButton = document.getElementById('status-button');
  const statusOutput = document.getElementById('status-output');

  if (statusInput)
    statusInput.style.background = state.elementStatus.inputField ? '#2ed573' : '#ff4757';
  if (statusButton)
    statusButton.style.background = state.elementStatus.sendButton ? '#2ed573' : '#ff4757';
  if (statusOutput)
    statusOutput.style.background = state.elementStatus.outputArea ? '#2ed573' : '#ff4757';

  // Update WebSocket status
  const websocketStatus = document.getElementById('websocket-status');
  if (websocketStatus) {
    websocketStatus.textContent = state.connectionStatus.websocketStatus;
    websocketStatus.style.background =
      state.connectionStatus.websocketStatus === 'CONNECTED' ? '#2ed573' : '#ff4757';
  }

  // Update session status
  const sessionStatus = document.getElementById('session-status');
  if (sessionStatus) {
    sessionStatus.textContent = `Status: ${state.connectionStatus.aiSessionActive ? 'Active' : 'Inactive'}`;
  }

  // Update button states
  updateButtonStates();

  // Update current URL
  const currentUrlInput = document.getElementById('current-url');
  if (currentUrlInput) {
    currentUrlInput.value = state.currentUrl;
  }
}

function updateButtonStates() {
  // AI session buttons
  const startBtn = document.getElementById('btn-start-session');
  const endBtn = document.getElementById('btn-end-session');

  if (startBtn && endBtn) {
    if (state.connectionStatus.aiSessionActive) {
      startBtn.disabled = true;
      startBtn.style.cursor = 'not-allowed';
      startBtn.style.background = '#666';
      endBtn.disabled = false;
      endBtn.style.cursor = 'pointer';
      endBtn.style.background = 'linear-gradient(135deg, #ff5f6d 0%, #ffc371 100%)';
    } else {
      startBtn.disabled = false;
      startBtn.style.cursor = 'pointer';
      startBtn.style.background = 'linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%)';
      endBtn.disabled = true;
      endBtn.style.cursor = 'not-allowed';
      endBtn.style.background = '#666';
    }
  }

  // Connection buttons
  const connectBtn = document.getElementById('btn-connect');
  const disconnectBtn = document.getElementById('btn-disconnect');

  if (connectBtn && disconnectBtn) {
    if (state.connectionStatus.connected || state.connectionStatus.isConnecting) {
      connectBtn.disabled = true;
      connectBtn.style.cursor = 'not-allowed';
      connectBtn.style.background = '#666';
      connectBtn.textContent = state.connectionStatus.isConnecting ? 'Connecting...' : 'Connect';
      disconnectBtn.disabled = false;
      disconnectBtn.style.cursor = 'pointer';
      disconnectBtn.style.background = 'linear-gradient(135deg, #ff3742 0%, #ff5252 100%)';
    } else {
      connectBtn.disabled = false;
      connectBtn.style.cursor = 'pointer';
      connectBtn.style.background = 'linear-gradient(135deg, #3742fa 0%, #2f3542 100%)';
      connectBtn.textContent = 'Connect';
      disconnectBtn.disabled = true;
      disconnectBtn.style.cursor = 'not-allowed';
      disconnectBtn.style.background = '#666';
    }
  }
}

// Action handlers
function handleAutoDetectElements() {
  if (chrome && chrome.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'AUTO_DETECT_ELEMENTS',
        });
      }
    });
  }
}

function handleSelectChatInput() {
  if (chrome && chrome.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'START_ELEMENT_SELECTION',
          elementType: 'inputField',
        });
      }
    });
  }
}

function handleSelectSendButton() {
  if (chrome && chrome.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'START_ELEMENT_SELECTION',
          elementType: 'sendButton',
        });
      }
    });
  }
}

function handleSelectChatOutput() {
  if (chrome && chrome.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'START_ELEMENT_SELECTION',
          elementType: 'outputArea',
        });
      }
    });
  }
}

function handleValidateElements() {
  if (chrome && chrome.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'VALIDATE_ELEMENTS',
        });
      }
    });
  }
}

function handleToggleFloatingPanel() {
  if (chrome && chrome.runtime) {
    chrome.runtime.sendMessage({
      type: 'TOGGLE_FLOATING_PANEL',
    });
  }
}

function handleStartAiSession() {
  if (chrome && chrome.runtime) {
    state.connectionStatus.aiSessionActive = true;
    updateUI();
    chrome.runtime.sendMessage({
      type: 'START_AI_SESSION',
    });
  }
}

function handleEndAiSession() {
  if (chrome && chrome.runtime) {
    state.connectionStatus.aiSessionActive = false;
    updateUI();
    chrome.runtime.sendMessage({
      type: 'END_AI_SESSION',
    });
  }
}

function handleConnect() {
  if (chrome && chrome.runtime) {
    state.connectionStatus.isConnecting = true;
    updateUI();
    chrome.runtime.sendMessage({
      type: 'WEBSOCKET_CONNECT',
      port: state.connectionStatus.port,
    });
  }
}

function handleDisconnect() {
  if (chrome && chrome.runtime) {
    state.connectionStatus.connected = false;
    state.connectionStatus.websocketStatus = 'DISCONNECTED';
    updateUI();
    chrome.runtime.sendMessage({
      type: 'WEBSOCKET_DISCONNECT',
    });
  }
}

console.log("The New Fuse - Detached Popup Script");

// Global state
let isWindowPinned = false;

document.addEventListener('DOMContentLoaded', function() {
  // Connect to background script with persistent connection
  const port = chrome.runtime.connect({ name: 'detached-popup' });
  
  // Track current tab for state persistence
  let currentActiveTab = 'communication-tab';
  
  // Get connection state
  port.postMessage({ type: 'getConnectionState' });
  
  // Listen for messages from background script
  port.onMessage.addListener((message) => {
    console.log('Message from background:', message);
    
    if (message.type === 'connectionState') {
      updateConnectionStatus(message.data);
    }
    
    // Restore popup state when reopening
    if (message.type === 'restorePopupState') {
      restorePopupState(message.data);
    }
  });
  
  // Listen for connection state updates and responses
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'connectionStateUpdate') {
      updateConnectionStatus(message.data);
    }
    
    // Handle new responses from VS Code
    if (message.type === 'newResponse') {
      handleNewResponse(message.data);
    }
    
    return false;
  });
  
  // Initialize tabs
  initTabs();

  // Window control buttons
  document.getElementById('pin-window-btn').addEventListener('click', function() {
    isWindowPinned = !isWindowPinned;
    this.classList.toggle('active', isWindowPinned);
    chrome.windows.getCurrent(function(currentWindow) {
      chrome.windows.update(currentWindow.id, {
        focused: true,
        alwaysOnTop: isWindowPinned
      });
    });
    addLog(`Window ${isWindowPinned ? 'pinned' : 'unpinned'}`, "info");
  });
  
  document.getElementById('minimize-window-btn').addEventListener('click', function() {
    chrome.windows.getCurrent(function(currentWindow) {
      chrome.windows.update(currentWindow.id, {
        state: 'minimized'
      });
    });
  });
  
  document.getElementById('close-window-btn').addEventListener('click', function() {
    // Save state before closing
    savePopupState();
    window.close();
  });

  document.getElementById('return-to-popup-btn').addEventListener('click', function() {
    // Save state before closing
    savePopupState();
    // Open normal popup
    chrome.action.openPopup();
    window.close();
  });
  
  // Set up view switching event listeners
  document.getElementById('settings-button').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    addLog("Settings opened", "info");
  });
  
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  
  // Connect button functionality
  const connectBtn = document.getElementById('connectBtn');
  if (connectBtn) {
    connectBtn.addEventListener('click', function() {
      const wsUrl = document.getElementById('wsUrl').value;
      console.log("Connecting to: " + wsUrl);
      document.getElementById('connection-status').className = 'status-indicator connecting';
      addLog("Connecting to: " + wsUrl, "info");
      
      // Save URL in storage
      chrome.storage.local.get(['settings'], function(result) {
        const settings = result.settings || {};
        settings.wsUrl = wsUrl;
        chrome.storage.local.set({ settings });
      });
      
      // Connect via background script
      chrome.runtime.sendMessage({
        type: 'connectWebSocket',
        url: wsUrl
      }, function(response) {
        if (response && response.success) {
          addLog("Connection request sent", "info");
        } else {
          addLog("Failed to initiate connection", "error");
          document.getElementById('connection-status').className = 'status-indicator disconnected';
        }
      });
    });
  }
  
  const disconnectBtn = document.getElementById('disconnectBtn');
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', function() {
      console.log("Disconnecting...");
      
      chrome.runtime.sendMessage({
        type: 'disconnectWebSocket'
      }, function(response) {
        if (response && response.success) {
          addLog("Disconnected from WebSocket", "info");
        } else {
          addLog("Failed to disconnect", "error");
        }
      });
    });
  }

  // Code and response button handlers
  const codeBtn = document.getElementById('codeBtn');
  if (codeBtn) {
    codeBtn.addEventListener('click', function() {
      document.getElementById('codeModal').style.display = 'block';
    });
  }
  
  const responseBtn = document.getElementById('responseBtn');
  if (responseBtn) {
    responseBtn.addEventListener('click', function() {
      document.getElementById('responseModal').style.display = 'block';
    });
  }
  
  // Modal close buttons
  const closeCodeModal = document.getElementById('closeCodeModal');
  if (closeCodeModal) {
    closeCodeModal.addEventListener('click', function() {
      document.getElementById('codeModal').style.display = 'none';
    });
  }
  
  const closeResponseModal = document.getElementById('closeResponseModal');
  if (closeResponseModal) {
    closeResponseModal.addEventListener('click', function() {
      document.getElementById('responseModal').style.display = 'none';
    });
  }

  // Keep modals within window and make them draggable
  initializeModalDrag('codeModal');
  initializeModalDrag('responseModal');

  // Send message button
  const sendMessageBtn = document.getElementById('send-message-button');
  if (sendMessageBtn) {
    sendMessageBtn.addEventListener('click', function() {
      const messageInput = document.getElementById('message-input');
      if (messageInput && messageInput.value.trim()) {
        sendMessageToVSCode(messageInput.value.trim());
        addLog("Message sent to VS Code: " + messageInput.value.trim(), "info");
        messageInput.value = '';
      }
    });
  }
  
  // Send code button
  const sendCodeBtn = document.getElementById('sendCodeBtn');
  if (sendCodeBtn) {
    sendCodeBtn.addEventListener('click', function() {
      const codeInput = document.getElementById('codeInput');
      if (codeInput && codeInput.value.trim()) {
        chrome.runtime.sendMessage({
          type: 'CODE_INPUT',
          code: codeInput.value.trim()
        }, function(response) {
          if (response && response.success) {
            addLog("Code sent to VS Code", "success");
            document.getElementById('codeModal').style.display = 'none';
          } else {
            addLog("Failed to send code", "error");
          }
        });
      }
    });
  }

  // Initialize Web Integration buttons
  initWebIntegrationButtons();

  // Initialize other buttons
  const clearLogBtn = document.getElementById('clear-log-btn');
  if (clearLogBtn) {
    clearLogBtn.addEventListener('click', function() {
      document.getElementById('log').innerHTML = '';
      addLog("Log cleared", "info");
    });
  }
  
  // Ping button
  const pingBtn = document.getElementById('pingBtn');
  if (pingBtn) {
    pingBtn.addEventListener('click', function() {
      chrome.runtime.sendMessage({
        type: 'TEXT',
        text: 'PING'
      }, function(response) {
        if (response && response.success) {
          addLog("Ping sent to VS Code", "info");
        } else {
          addLog("Failed to send ping", "error");
        }
      });
    });
  }

  // Load connection URL from settings
  chrome.storage.local.get(['settings'], function(result) {
    const settings = result.settings || {};
    if (settings.wsUrl) {
      const wsUrlInput = document.getElementById('wsUrl');
      if (wsUrlInput) {
        wsUrlInput.value = settings.wsUrl;
      }
    }
  });

  // Initialize theme
  initTheme();
  
  // Save state when popup is potentially going to close
  window.addEventListener('beforeunload', function() {
    savePopupState();
  });
  
  // Add initial log entry
  addLog("Detached popup initialized", "info");

  // Load saved popup state
  chrome.storage.local.get(['popupState'], function(result) {
    if (result.popupState) {
      restorePopupState(result.popupState);
    }
  });
});

// Make modal draggable
function initializeModalDrag(modalId) {
  const modal = document.getElementById(modalId);
  const header = modal.querySelector('.modal-header');
  let isDragging = false;
  let offsetX, offsetY;

  header.addEventListener('mousedown', function(e) {
    isDragging = true;
    offsetX = e.clientX - modal.getBoundingClientRect().left;
    offsetY = e.clientY - modal.getBoundingClientRect().top;
    
    // Prevent text selection during drag
    e.preventDefault();
  });

  document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    
    // Keep the modal within the viewport
    const maxX = window.innerWidth - modal.offsetWidth;
    const maxY = window.innerHeight - modal.offsetHeight;
    
    modal.style.left = Math.max(0, Math.min(maxX, x)) + 'px';
    modal.style.top = Math.max(0, Math.min(maxY, y)) + 'px';
  });

  document.addEventListener('mouseup', function() {
    isDragging = false;
  });

  // Position modal initially
  modal.style.left = '50%';
  modal.style.top = '50%';
  modal.style.transform = 'translate(-50%, -50%)';
}

// Save popup state to background script
function savePopupState() {
  const activeTabBtn = document.querySelector('.tab-button.active');
  const activeTab = activeTabBtn ? activeTabBtn.getAttribute('data-tab') : 'communication-tab';
  
  // Get content from response container if visible
  let responseContent = null;
  const responseContainer = document.getElementById('responseContainer');
  if (responseContainer && responseContainer.textContent) {
    responseContent = responseContainer.textContent;
  }
  
  // Get any selected content
  let selectedContent = null;
  const messageInput = document.getElementById('message-input');
  if (messageInput && messageInput.value) {
    selectedContent = messageInput.value;
  }
  
  // Save window information for next opening
  chrome.windows.getCurrent(function(currentWindow) {
    const state = {
      activeTab, 
      responseContent,
      selectedContent,
      window: {
        width: currentWindow.width,
        height: currentWindow.height,
        top: currentWindow.top,
        left: currentWindow.left
      }
    };
    
    // Store in local storage
    chrome.storage.local.set({ popupState: state });
    
    // Also send to background script
    chrome.runtime.sendMessage({
      type: 'popupState',
      data: state
    });
  });
}

// Restore popup state from background
function restorePopupState(state) {
  if (!state) return;
  
  // Restore active tab
  if (state.activeTab) {
    const tabBtn = document.querySelector(`[data-tab="${state.activeTab}"]`);
    if (tabBtn) tabBtn.click();
  }
  
  // Restore response content
  if (state.responseContent) {
    const responseContainer = document.getElementById('responseContainer');
    if (responseContainer) {
      responseContainer.innerHTML = `<pre>${escapeHtml(state.responseContent)}</pre>`;
    }
  }
  
  // Restore input content
  if (state.selectedContent) {
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
      messageInput.value = state.selectedContent;
    }
  }
  
  // Restore window position and size if available
  if (state.window) {
    chrome.windows.getCurrent(function(currentWindow) {
      chrome.windows.update(currentWindow.id, {
        width: state.window.width || 500,
        height: state.window.height || 600,
        top: state.window.top || 100,
        left: state.window.left || 100
      });
    });
  }
}

// Handle new responses from VS Code
function handleNewResponse(data) {
  if (!data || !data.text) return;
  
  // Show in the response modal
  const responseContainer = document.getElementById('responseContainer');
  if (responseContainer) {
    responseContainer.innerHTML = `<pre>${escapeHtml(data.text)}</pre>`;
    // Don't auto-open modal to avoid disturbing user
  }
  
  addLog(`Received response from ${data.source || 'VS Code'}`, "info");
}

// Initialize Web Integration buttons
function initWebIntegrationButtons() {
  // Scan Page button
  const scanPageBtn = document.getElementById('scan-page-btn');
  if (scanPageBtn) {
    scanPageBtn.addEventListener('click', function() {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'getAIChatInfo' }, function(response) {
            if (chrome.runtime.lastError) {
              addLog("Error scanning page: " + chrome.runtime.lastError.message, "error");
              return;
            }
            
            if (response && response.platform) {
              document.getElementById('current-page').textContent = `Connected to ${response.platform}`;
              document.getElementById('web-status').className = 'status-indicator connected';
              
              // Update global connection state
              chrome.runtime.sendMessage({
                type: 'updateWebStatus',
                webStatus: true
              });
              
              if (response.hasInputField) {
                document.getElementById('send-to-page-btn').disabled = false;
                addLog(`Found chat input on ${response.platform}`, "success");
              }
              
              addLog(`AI platform detected: ${response.platform}`, "success");
            } else {
              document.getElementById('current-page').textContent = "No AI chat interface detected";
              document.getElementById('web-status').className = 'status-indicator disconnected';
              addLog("No AI chat interface detected on this page", "warning");
              
              // Update global connection state
              chrome.runtime.sendMessage({
                type: 'updateWebStatus',
                webStatus: false
              });
            }
          });
        }
      });
    });
  }

  // Inject Script button  
  const injectScriptBtn = document.getElementById('inject-script-btn');
  if (injectScriptBtn) {
    injectScriptBtn.addEventListener('click', function() {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { 
            type: 'injectMonitoringScript',
            autoCapture: document.getElementById('auto-capture').checked
          }, function(response) {
            if (chrome.runtime.lastError) {
              addLog("Error injecting script: " + chrome.runtime.lastError.message, "error");
              return;
            }
            
            if (response && response.success) {
              document.getElementById('web-status').className = 'status-indicator connected';
              addLog("Monitoring script injected successfully", "success");
              document.getElementById('capture-btn').disabled = false;
              
              // Update global connection state
              chrome.runtime.sendMessage({
                type: 'updateWebStatus',
                webStatus: true
              });
            } else {
              addLog("Failed to inject monitoring script", "error");
            }
          });
        }
      });
    });
  }

  // Capture button
  const captureBtn = document.getElementById('capture-btn');
  if (captureBtn) {
    captureBtn.addEventListener('click', function() {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'extractChatContent' }, function(response) {
            if (chrome.runtime.lastError) {
              addLog("Error extracting chat: " + chrome.runtime.lastError.message, "error");
              return;
            }
            
            if (response && response.content) {
              // Send to VS Code
              chrome.runtime.sendMessage({
                type: 'CHAT_CONTENT',
                content: response.content,
                source: tabs[0].url
              }, function(response) {
                if (chrome.runtime.lastError) {
                  addLog("Error sending to VS Code: " + chrome.runtime.lastError.message, "error");
                  return;
                }
                
                if (response && response.success) {
                  addLog("Chat content sent to VS Code", "success");
                }
              });
              
              // Show in the response modal
              const responseContainer = document.getElementById('responseContainer');
              if (responseContainer) {
                responseContainer.innerHTML = `<pre>${escapeHtml(response.content)}</pre>`;
                document.getElementById('responseModal').style.display = 'block';
              }
            } else {
              addLog("No chat content found on the page", "warning");
            }
          });
        }
      });
    });
  }

  // Send to Page button
  const sendToPageBtn = document.getElementById('send-to-page-btn');
  if (sendToPageBtn) {
    sendToPageBtn.addEventListener('click', function() {
      const messageInput = document.getElementById('message-input');
      if (messageInput && messageInput.value.trim()) {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          if (tabs && tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { 
              type: 'insertInChat',
              text: messageInput.value.trim()
            }, function(response) {
              if (chrome.runtime.lastError) {
                addLog("Error inserting text: " + chrome.runtime.lastError.message, "error");
                return;
              }
              
              if (response && response.success) {
                addLog("Text inserted in chat input", "success");
                
                // Send message by clicking the chat send button
                chrome.tabs.sendMessage(tabs[0].id, { type: 'sendChat' }, function(sendResponse) {
                  if (chrome.runtime.lastError) {
                    addLog("Error sending chat: " + chrome.runtime.lastError.message, "error");
                    return;
                  }
                  
                  if (sendResponse && sendResponse.success) {
                    addLog("Chat message sent successfully", "success");
                  } else {
                    addLog("Failed to send chat message", "error");
                  }
                });
              } else {
                addLog("Failed to insert text in chat input", "error");
              }
            });
          }
        });
        messageInput.value = '';
      }
    });
  }

  // Auto-capture and Auto-inject checkboxes
  const autoCaptureCheckbox = document.getElementById('auto-capture');
  if (autoCaptureCheckbox) {
    autoCaptureCheckbox.addEventListener('change', function() {
      // Save preference
      chrome.storage.local.get(['settings'], function(result) {
        const settings = result.settings || {};
        settings.autoCapture = autoCaptureCheckbox.checked;
        chrome.storage.local.set({ settings });
        addLog(`Auto-capture ${autoCaptureCheckbox.checked ? 'enabled' : 'disabled'}`, "info");
      });
      
      // Update content script if on a compatible page
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { 
            type: 'updateAutoCapture',
            autoCapture: autoCaptureCheckbox.checked
          });
        }
      });
    });
  }

  const autoInjectCheckbox = document.getElementById('auto-inject');
  if (autoInjectCheckbox) {
    autoInjectCheckbox.addEventListener('change', function() {
      // Save preference
      chrome.storage.local.get(['settings'], function(result) {
        const settings = result.settings || {};
        settings.autoInject = autoInjectCheckbox.checked;
        chrome.storage.local.set({ settings });
        addLog(`Auto-inject ${autoInjectCheckbox.checked ? 'enabled' : 'disabled'}`, "info");
      });
    });
  }

  // Load saved preferences
  chrome.storage.local.get(['settings'], function(result) {
    const settings = result.settings || {};
    
    if (autoCaptureCheckbox) {
      autoCaptureCheckbox.checked = settings.autoCapture !== false;
    }
    
    if (autoInjectCheckbox) {
      autoInjectCheckbox.checked = settings.autoInject !== false;
    }
  });
}

// Send message to VS Code via background script
function sendMessageToVSCode(message) {
  chrome.runtime.sendMessage({
    type: 'TEXT',
    text: message
  }, function(response) {
    if (!response || !response.success) {
      addLog("Failed to send message", "error");
    }
  });
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Update connection status indicators
function updateConnectionStatus(state) {
  console.log('Updating connection status:', state);
  
  const connectionStatus = document.getElementById('connection-status');
  const vscodeStatus = document.getElementById('vscode-status');
  const webStatus = document.getElementById('web-status');
  
  if (connectionStatus) {
    connectionStatus.className = 'status-indicator ' + (state.vscode ? 'connected' : 'disconnected');
  }
  
  if (vscodeStatus) {
    vscodeStatus.className = 'status-indicator ' + (state.vscode ? 'connected' : 'disconnected');
  }
  
  if (webStatus && state.web !== undefined) {
    webStatus.className = 'status-indicator ' + (state.web ? 'connected' : 'disconnected');
  }
  
  // Update button states
  const connectBtn = document.getElementById('connectBtn');
  const disconnectBtn = document.getElementById('disconnectBtn');
  const pingBtn = document.getElementById('pingBtn');
  const codeBtn = document.getElementById('codeBtn');
  const responseBtn = document.getElementById('responseBtn');
  const sendMessageBtn = document.getElementById('send-message-button');
  
  if (connectBtn) connectBtn.disabled = state.vscode;
  if (disconnectBtn) disconnectBtn.disabled = !state.vscode;
  if (pingBtn) pingBtn.disabled = !state.vscode;
  if (codeBtn) codeBtn.disabled = !state.vscode;
  if (responseBtn) responseBtn.disabled = !state.vscode;
  if (sendMessageBtn) sendMessageBtn.disabled = !state.vscode;
  
  // Enable/disable web integration buttons based on connection status
  const scanPageBtn = document.getElementById('scan-page-btn');
  const injectScriptBtn = document.getElementById('inject-script-btn');
  const captureBtn = document.getElementById('capture-btn');
  const sendToPageBtn = document.getElementById('send-to-page-btn');
  
  if (scanPageBtn) scanPageBtn.disabled = !state.vscode;
  if (injectScriptBtn) injectScriptBtn.disabled = !state.vscode;
  if (captureBtn) captureBtn.disabled = !state.vscode || !state.web;
  if (sendToPageBtn) sendToPageBtn.disabled = !state.vscode || !state.web;
}

// Initialize tabs
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      
      // Hide all tab contents
      tabContents.forEach(content => {
        content.classList.remove('active');
      });
      
      // Deactivate all tab buttons
      tabButtons.forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Activate the selected tab button and content
      button.classList.add('active');
      document.getElementById(tabId).classList.add('active');
      
      // Save current tab to state
      savePopupState();
    });
  });
}

// Toggle dark/light theme
function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  const themeToggle = document.getElementById('theme-toggle');
  
  if (document.body.classList.contains('dark-theme')) {
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    localStorage.setItem('theme', 'dark');
    addLog("Theme changed to dark", "info");
  } else {
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    localStorage.setItem('theme', 'light');
    addLog("Theme changed to light", "info");
  }
}

// Initialize theme from saved preference
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const themeToggle = document.getElementById('theme-toggle');
  
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
  }
}

// Add log entry
function addLog(message, type = 'info') {
  const logContainer = document.getElementById('log');
  if (!logContainer) return;
  
  const logEntry = document.createElement('div');
  logEntry.className = 'log-entry log-' + type;
  logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logContainer.appendChild(logEntry);
  logContainer.scrollTop = logContainer.scrollHeight;
  
  console.log(`[${type}] ${message}`);
}

// detached-popup.js - Script for the detached popup window functionality

let webSocketManager = null;
let inputFields = [];
let selectedField = null;
let isDarkTheme = false;
let windowAlwaysOnTop = false;
let logEntries = [];

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Register this window as a detached popup with the background script
  chrome.runtime.sendMessage({ type: 'REGISTER_DETACHED_POPUP' }, (response) => {
    console.log('Registered as detached popup:', response);
    
    // Tell the background script we're ready to receive data
    chrome.runtime.sendMessage({ type: 'DETACHED_POPUP_READY' });
  });
  
  // Load saved theme preference
  chrome.storage.local.get(['darkTheme'], (result) => {
    if (result.darkTheme) {
      isDarkTheme = result.darkTheme;
      applyTheme();
    }
  });
  
  // Set up all event listeners
  setupEventListeners();
  
  // Initialize the tabs
  initTabs();
  
  // Initialize WebSocket connection
  initializeWebSocketConnection();
  
  // Add a listener for messages from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'DETACHED_POPUP_MESSAGE') {
      handleBackgroundMessage(message.data);
      sendResponse({ received: true });
    }
    return true;
  });
  
  // Add window beforeunload event to notify background script
  window.addEventListener('beforeunload', () => {
    chrome.runtime.sendMessage({ type: 'DETACHED_POPUP_CLOSING' });
  });
  
  // Check for input fields immediately
  refreshInputFields();
  
  // Log the initialization
  addLogEntry('Detached popup initialized', 'info');
});

// Initialize the tab system
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Deactivate all tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Activate the selected tab
      button.classList.add('active');
      const tabName = button.getAttribute('data-tab');
      document.getElementById(tabName).classList.add('active');
    });
  });
}

// Set up all event listeners
function setupEventListeners() {
  // Window controls
  document.getElementById('close-window-btn').addEventListener('click', () => window.close());
  
  document.getElementById('minimize-window-btn').addEventListener('click', () => {
    chrome.windows.getCurrent(window => {
      chrome.windows.update(window.id, { state: 'minimized' });
    });
  });
  
  document.getElementById('pin-window-btn').addEventListener('click', toggleAlwaysOnTop);
  
  document.getElementById('return-to-popup-btn').addEventListener('click', () => {
    // Tell background to close this window and open regular popup
    chrome.runtime.sendMessage({ type: 'RETURN_TO_POPUP' });
    window.close();
  });
  
  // Theme toggle
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  
  // Connection controls
  document.getElementById('connectBtn').addEventListener('click', connectWebSocket);
  document.getElementById('disconnectBtn').addEventListener('click', disconnectWebSocket);
  document.getElementById('pingBtn').addEventListener('click', sendPing);
  
  // Message controls
  document.getElementById('send-message-button').addEventListener('click', sendMessage);
  document.getElementById('codeBtn').addEventListener('click', () => toggleModal('codeModal', true));
  document.getElementById('responseBtn').addEventListener('click', () => toggleModal('responseModal', true));
  document.getElementById('closeCodeModal').addEventListener('click', () => toggleModal('codeModal', false));
  document.getElementById('closeResponseModal').addEventListener('click', () => toggleModal('responseModal', false));
  document.getElementById('sendCodeBtn').addEventListener('click', sendCode);
  
  // Input field controls
  document.getElementById('refresh-fields-btn').addEventListener('click', refreshInputFields);
  document.getElementById('input-fields-dropdown').addEventListener('change', selectInputField);
  document.getElementById('send-text-btn').addEventListener('click', sendText);
  document.getElementById('click-button-btn').addEventListener('click', clickButton);
  document.getElementById('send-and-submit-btn').addEventListener('click', sendAndSubmit);
  
  // Web integration controls
  document.getElementById('scan-page-btn').addEventListener('click', scanPage);
  document.getElementById('inject-script-btn').addEventListener('click', injectMonitor);
  document.getElementById('capture-btn').addEventListener('click', captureChatContent);
  document.getElementById('send-to-page-btn').addEventListener('click', sendToPage);
  
  // Log controls
  document.getElementById('clear-log-btn').addEventListener('click', clearLog);
}

// Toggle a modal dialog
function toggleModal(modalId, show) {
  const modal = document.getElementById(modalId);
  modal.style.display = show ? 'block' : 'none';
}

// Initialize WebSocket connection
function initializeWebSocketConnection() {
  const wsUrlInput = document.getElementById('wsUrl');
  const savedWsUrl = localStorage.getItem('wsUrl');
  
  if (savedWsUrl) {
    wsUrlInput.value = savedWsUrl;
  }
  
  // Check if we should auto-connect
  chrome.storage.local.get(['autoConnect'], (result) => {
    if (result.autoConnect) {
      connectWebSocket();
    }
  });
}

// Connect to WebSocket
function connectWebSocket() {
  const wsUrl = document.getElementById('wsUrl').value;
  
  if (!wsUrl) {
    updateStatus('Please enter a WebSocket URL');
    return;
  }
  
  // Save URL for future use
  localStorage.setItem('wsUrl', wsUrl);
  
  updateConnectionStatus('connecting');
  
  try {
    webSocketManager = new WebSocket(wsUrl);
    
    webSocketManager.onopen = () => {
      updateConnectionStatus('connected');
      addLogEntry(`Connected to WebSocket at ${wsUrl}`, 'success');
      
      // Enable buttons that require connection
      document.getElementById('disconnectBtn').disabled = false;
      document.getElementById('pingBtn').disabled = false;
      document.getElementById('send-message-button').disabled = false;
      document.getElementById('codeBtn').disabled = false;
      
      // Send a connection message
      webSocketManager.send(JSON.stringify({
        type: 'CHROME_CONNECTED',
        version: chrome.runtime.getManifest().version,
        source: 'detached-popup'
      }));
    };
    
    webSocketManager.onclose = (event) => {
      updateConnectionStatus('disconnected');
      addLogEntry(`WebSocket disconnected: ${event.code} - ${event.reason}`, 'warning');
      
      // Disable buttons that require connection
      document.getElementById('disconnectBtn').disabled = true;
      document.getElementById('pingBtn').disabled = true;
      document.getElementById('send-message-button').disabled = true;
      document.getElementById('codeBtn').disabled = true;
      
      webSocketManager = null;
    };
    
    webSocketManager.onerror = (error) => {
      updateConnectionStatus('disconnected');
      addLogEntry(`WebSocket error: ${error.message || 'Unknown error'}`, 'error');
    };
    
    webSocketManager.onmessage = (event) => {
      handleWebSocketMessage(event);
    };
    
  } catch (error) {
    updateConnectionStatus('disconnected');
    addLogEntry(`Failed to connect: ${error.message}`, 'error');
  }
}

// Disconnect from WebSocket
function disconnectWebSocket() {
  if (webSocketManager && webSocketManager.readyState === WebSocket.OPEN) {
    webSocketManager.close();
    addLogEntry('Disconnected from WebSocket', 'info');
  }
}

// Send a ping message
function sendPing() {
  if (webSocketManager && webSocketManager.readyState === WebSocket.OPEN) {
    webSocketManager.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
    addLogEntry('Ping sent', 'info');
  } else {
    addLogEntry('Cannot ping: WebSocket not connected', 'error');
  }
}

// Handle WebSocket messages
function handleWebSocketMessage(event) {
  try {
    const message = JSON.parse(event.data);
    addLogEntry(`Received: ${message.type || 'Unknown message type'}`, 'info');
    
    // Update response modal with the received message
    document.getElementById('responseContainer').textContent = JSON.stringify(message, null, 2);
    
    // Handle specific message types
    if (message.type === 'PONG') {
      const latency = Date.now() - message.timestamp;
      updateStatus(`Pong received (latency: ${latency}ms)`);
    } else if (message.type === 'INPUT_FIELDS') {
      updateInputFields(message.fields, message.selectedField);
    } else if (message.type === 'TEXT_INJECTED') {
      updateStatus(`Text ${message.success ? 'injected successfully' : 'injection failed'}`);
    } else if (message.type === 'BUTTON_CLICKED') {
      updateStatus(`Button ${message.success ? 'clicked successfully' : 'click failed'}`);
    }
    
  } catch (error) {
    addLogEntry(`Error parsing message: ${error.message}`, 'error');
    console.error('Error parsing WebSocket message:', error);
  }
}

// Handle messages from the background script
function handleBackgroundMessage(message) {
  if (!message || !message.type) {
    console.error('Invalid background message format');
    return;
  }
  
  addLogEntry(`Background message: ${message.type}`, 'info');
  
  if (message.type === 'INPUT_FIELDS_UPDATED' && message.data) {
    updateInputFields(message.data.fields, message.data.selectedField);
  } else if (message.type === 'INIT_DATA' && message.data) {
    // Initialize with data from the background script
    updateInputFields(message.data.fields, message.data.selectedField);
  }
}

// Send a message through WebSocket
function sendMessage() {
  if (!webSocketManager || webSocketManager.readyState !== WebSocket.OPEN) {
    addLogEntry('Cannot send message: WebSocket not connected', 'error');
    return;
  }
  
  const messageInput = document.getElementById('message-input');
  const message = messageInput.value.trim();
  
  if (!message) {
    addLogEntry('Cannot send empty message', 'warning');
    return;
  }
  
  try {
    // Try to parse as JSON
    const jsonMsg = JSON.parse(message);
    webSocketManager.send(JSON.stringify(jsonMsg));
  } catch {
    // Not valid JSON, send as string
    webSocketManager.send(JSON.stringify({
      type: 'MESSAGE',
      text: message,
      timestamp: Date.now()
    }));
  }
  
  addLogEntry(`Message sent: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`, 'info');
  messageInput.value = '';
}

// Send code through WebSocket
function sendCode() {
  if (!webSocketManager || webSocketManager.readyState !== WebSocket.OPEN) {
    addLogEntry('Cannot send code: WebSocket not connected', 'error');
    return;
  }
  
  const codeInput = document.getElementById('codeInput');
  const code = codeInput.value.trim();
  
  if (!code) {
    addLogEntry('Cannot send empty code', 'warning');
    return;
  }
  
  webSocketManager.send(JSON.stringify({
    type: 'CODE',
    code: code,
    timestamp: Date.now()
  }));
  
  addLogEntry(`Code sent: ${code.substring(0, 50)}${code.length > 50 ? '...' : ''}`, 'info');
  toggleModal('codeModal', false);
}

// Refresh input fields from the active tab
function refreshInputFields() {
  updateStatus('Refreshing input fields...');
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0] || !tabs[0].id) {
      updateStatus('No active tab found');
      return;
    }
    
    chrome.tabs.sendMessage(tabs[0].id, { type: 'DETECT_INPUT_FIELDS' }, (response) => {
      if (chrome.runtime.lastError) {
        updateStatus(`Error: ${chrome.runtime.lastError.message}`);
        return;
      }
      
      if (response && response.data && response.data.fields) {
        updateInputFields(response.data.fields);
        updateStatus(`Found ${response.data.fields.length} input fields`);
      } else {
        updateInputFields([]);
        updateStatus('No input fields detected');
      }
    });
  });
}

// Update the input fields dropdown
function updateInputFields(fields, selectedFieldId = null) {
  inputFields = fields || [];
  selectedField = selectedFieldId;
  
  const dropdown = document.getElementById('input-fields-dropdown');
  
  // Clear existing options
  while (dropdown.options.length > 1) {
    dropdown.remove(1);
  }
  
  if (!inputFields || inputFields.length === 0) {
    dropdown.disabled = true;
    document.getElementById('send-text-btn').disabled = true;
    document.getElementById('click-button-btn').disabled = true;
    document.getElementById('send-and-submit-btn').disabled = true;
    return;
  }
  
  dropdown.disabled = false;
  
  // Add options for each field
  inputFields.forEach(field => {
    const option = document.createElement('option');
    option.value = field.id;
    
    // Create a descriptive label
    let label = '';
    if (field.label) {
      label += `${field.label}: `;
    }
    
    if (field.placeholder) {
      label += `[${field.placeholder}] `;
    }
    
    label += `(${field.type})`;
    
    option.textContent = label;
    dropdown.appendChild(option);
    
    // Select the previously selected field or the focused one
    if ((selectedFieldId && field.id === selectedFieldId) || 
        (!selectedFieldId && field.focused)) {
      dropdown.value = field.id;
      selectedField = field.id;
      
      // Enable buttons
      document.getElementById('send-text-btn').disabled = false;
      document.getElementById('click-button-btn').disabled = false;
      document.getElementById('send-and-submit-btn').disabled = false;
    }
  });
  
  // If no field is selected yet but we have fields, enable the dropdown
  if (!selectedField && inputFields.length > 0) {
    dropdown.selectedIndex = 0;  // Select the first option (the placeholder)
  }
}

// Select an input field from the dropdown
function selectInputField() {
  const dropdown = document.getElementById('input-fields-dropdown');
  const selectedId = dropdown.value;
  
  if (!selectedId) {
    document.getElementById('send-text-btn').disabled = true;
    document.getElementById('click-button-btn').disabled = true;
    document.getElementById('send-and-submit-btn').disabled = true;
    selectedField = null;
    return;
  }
  
  selectedField = selectedId;
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0] || !tabs[0].id) {
      updateStatus('No active tab found');
      return;
    }
    
    chrome.tabs.sendMessage(tabs[0].id, {
      type: 'SELECT_INPUT_FIELD',
      data: { id: selectedId }
    }, (response) => {
      if (chrome.runtime.lastError) {
        updateStatus(`Error: ${chrome.runtime.lastError.message}`);
        selectedField = null;
        return;
      }
      
      if (response && response.success) {
        updateStatus(`Selected input field: ${selectedId}`);
        document.getElementById('send-text-btn').disabled = false;
        document.getElementById('click-button-btn').disabled = false;
        document.getElementById('send-and-submit-btn').disabled = false;
      } else {
        updateStatus('Failed to select input field');
        selectedField = null;
        document.getElementById('send-text-btn').disabled = true;
        document.getElementById('click-button-btn').disabled = true;
        document.getElementById('send-and-submit-btn').disabled = true;
      }
    });
  });
}

// Send text to the selected input field
function sendText() {
  if (!selectedField) {
    updateStatus('No input field selected');
    return;
  }
  
  const text = document.getElementById('input-text-area').value;
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0] || !tabs[0].id) {
      updateStatus('No active tab found');
      return;
    }
    
    chrome.tabs.sendMessage(tabs[0].id, {
      type: 'INJECT_TEXT',
      data: { text }
    }, (response) => {
      if (chrome.runtime.lastError) {
        updateStatus(`Error: ${chrome.runtime.lastError.message}`);
        return;
      }
      
      if (response && response.success) {
        updateStatus('Text sent successfully');
        addLogEntry(`Text sent to input field: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`, 'success');
      } else {
        updateStatus('Failed to send text');
        addLogEntry('Failed to send text to input field', 'error');
      }
    });
  });
}

// Click the submit button for the selected input
function clickButton() {
  if (!selectedField) {
    updateStatus('No input field selected');
    return;
  }
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0] || !tabs[0].id) {
      updateStatus('No active tab found');
      return;
    }
    
    chrome.tabs.sendMessage(tabs[0].id, {
      type: 'CLICK_BUTTON'
    }, (response) => {
      if (chrome.runtime.lastError) {
        updateStatus(`Error: ${chrome.runtime.lastError.message}`);
        return;
      }
      
      if (response && response.success) {
        updateStatus('Button clicked successfully');
        addLogEntry(`Button clicked using method: ${response.data?.method || 'unknown'}`, 'success');
      } else {
        updateStatus('Failed to click button');
        addLogEntry('Failed to click button', 'error');
      }
    });
  });
}

// Send text and then click the submit button
function sendAndSubmit() {
  if
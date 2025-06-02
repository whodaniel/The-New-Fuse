// The New Fuse - Chrome Extension Popup Script

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initializePopup);

// Global connection state
let connectionStatus = {
  vscode: false,
  relay: false,
  auth: 'unauthenticated'
};

// Initialize popup
function initializePopup() {
  console.log('Initializing popup UI...');

  // Initialize tabs
  initializeTabs();

  // Initialize theme
  initializeTheme();

  // Initialize connection status
  checkConnectionStatus();

  // Initialize various components
  initializeHomeTab();
  initializeConnectionTab();
  initializeAITab();
  initializeCodeTab();
  initializeSettingsTab();

  // Set up message listeners for background script communication
  setupMessageListeners();

  // --- WebSocket Connection UI ---
  setupWebSocketUI();

  console.log('Popup UI initialized');
}

// Initialize tabs
function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');

      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Update active tab content
      tabContents.forEach(content => content.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');

      // Save active tab to storage
      chrome.storage.local.set({ activeTab: tabId });
    });
  });

  // Load saved active tab
  chrome.storage.local.get(['activeTab'], result => {
    if (result.activeTab) {
      const savedTabButton = document.querySelector(`.tab-button[data-tab="${result.activeTab}"]`);
      if (savedTabButton) {
        savedTabButton.click();
      }
    }
  });
}

// Initialize theme
function initializeTheme() {
  const themeToggle = document.getElementById('theme-toggle');

  // Load saved theme
  chrome.storage.local.get(['darkTheme'], result => {
    if (result.darkTheme) {
      document.body.classList.add('dark-theme');
      document.getElementById('theme-stylesheet').href = 'dark-theme.css';
    } else {
      document.body.classList.remove('dark-theme');
      document.getElementById('theme-stylesheet').href = 'light-theme.css';
    }
  });

  // Theme toggle button
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDarkTheme = document.body.classList.contains('dark-theme');

      if (isDarkTheme) {
        document.body.classList.remove('dark-theme');
        document.getElementById('theme-stylesheet').href = 'light-theme.css';
        chrome.storage.local.set({ darkTheme: false });
      } else {
        document.body.classList.add('dark-theme');
        document.getElementById('theme-stylesheet').href = 'dark-theme.css';
        chrome.storage.local.set({ darkTheme: true });
      }
    });
  }
}

// Check connection status
function checkConnectionStatus() {
  chrome.runtime.sendMessage({ type: 'CHECK_RELAY' }, response => {
    if (response) {
      updateConnectionStatus(response);
    }
  });
}

// Update connection status UI
function updateConnectionStatus(status) {
  connectionStatus = status;

  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');

  if (statusIndicator && statusText) {
    if (status.vscode && status.relay) {
      statusIndicator.className = 'status-indicator online';
      statusText.textContent = 'Connected';
    } else if (status.vscode) {
      statusIndicator.className = 'status-indicator partial';
      statusText.textContent = 'Partial Connection';
    } else {
      statusIndicator.className = 'status-indicator offline';
      statusText.textContent = 'Disconnected';
    }
  }

  // Update detailed connection status if on connection tab
  updateDetailedConnectionStatus();

  // Update UI elements that depend on connection status
  updateConnectionDependentUI();
}

// Update detailed connection status in the connection tab
function updateDetailedConnectionStatus() {
  const vscodeStatus = document.getElementById('vscode-status');
  const websocketStatus = document.getElementById('websocket-status');
  const authStatus = document.getElementById('auth-status');

  if (vscodeStatus) {
    vscodeStatus.textContent = connectionStatus.vscode ? 'Connected' : 'Disconnected';
    vscodeStatus.className = 'status-value ' + (connectionStatus.vscode ? 'online' : 'offline');
  }

  if (websocketStatus) {
    websocketStatus.textContent = connectionStatus.relay ? 'Connected' : 'Disconnected';
    websocketStatus.className = 'status-value ' + (connectionStatus.relay ? 'online' : 'offline');
  }

  if (authStatus) {
    let authText = 'Not authenticated';
    let authClass = 'offline';

    if (connectionStatus.auth === 'authenticated') {
      authText = 'Authenticated';
      authClass = 'online';
    } else if (connectionStatus.auth === 'authenticating') {
      authText = 'Authenticating...';
      authClass = 'partial';
    }

    authStatus.textContent = authText;
    authStatus.className = 'status-value ' + authClass;
  }
}

// Update UI elements that depend on connection status
function updateConnectionDependentUI() {
  const sendSelectionBtn = document.getElementById('send-selection-btn');
  const extractChatBtn = document.getElementById('extract-chat-btn');
  const openViewBtn = document.getElementById('open-view-btn');
  const sendChatBtn = document.getElementById('send-chat-btn');
  const codeExecuteBtn = document.getElementById('code-execute-btn');

  const isConnected = connectionStatus.vscode;

  if (sendSelectionBtn) sendSelectionBtn.disabled = !isConnected;
  if (extractChatBtn) extractChatBtn.disabled = !isConnected;
  if (openViewBtn) openViewBtn.disabled = !isConnected;
  if (sendChatBtn) sendChatBtn.disabled = !isConnected;
  if (codeExecuteBtn) codeExecuteBtn.disabled = !isConnected;
}

// Initialize home tab
function initializeHomeTab() {
  const sendSelectionBtn = document.getElementById('send-selection-btn');
  const extractChatBtn = document.getElementById('extract-chat-btn');
  const openViewBtn = document.getElementById('open-view-btn');
  const copySelectionBtn = document.getElementById('copy-selection-btn');
  const analyzeSelectionBtn = document.getElementById('analyze-selection-btn');
  const executeSelectionBtn = document.getElementById('execute-selection-btn');

  // Get current selection from active tab
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'getSelection' }, response => {
        if (chrome.runtime.lastError) {
          console.warn('Error getting selection:', chrome.runtime.lastError);
          return;
        }

        if (response && response.text) {
          updateSelectionPreview(response.text);
        }
      });

      // Check if we're on an AI chat page
      chrome.tabs.sendMessage(tabs[0].id, { type: 'getAIChatInfo' }, response => {
        if (chrome.runtime.lastError) {
          console.warn('Error getting AI chat info:', chrome.runtime.lastError);
          return;
        }

        if (response && response.hasInputField) {
          updateChatInfo(response);
        }
      });
    }
  });

  // Send selection button
  if (sendSelectionBtn) {
    sendSelectionBtn.addEventListener('click', () => {
      const selectionText = document.getElementById('selection-text')?.textContent;

      if (!selectionText) {
        showNotification('No text selected', true);
        return;
      }

      chrome.runtime.sendMessage({
        type: 'TEXT',
        text: selectionText
      }, response => {
        if (response?.success) {
          showNotification('Text sent to VS Code');
        } else {
          showNotification('Failed to send text to VS Code', true);
        }
      });
    });
  }

  // Extract chat button
  if (extractChatBtn) {
    extractChatBtn.addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'extractChatContent' }, response => {
            if (chrome.runtime.lastError) {
              showNotification('Could not extract chat content', true);
              return;
            }

            if (response && response.content) {
              chrome.runtime.sendMessage({
                type: 'CHAT_CONTENT',
                content: response.content
              }, msgResponse => {
                if (msgResponse?.success) {
                  showNotification('Chat content sent to VS Code');
                } else {
                  showNotification('Failed to send chat content', true);
                }
              });
            } else {
              showNotification('No chat content detected', true);
            }
          });
        }
      });
    });
  }

  // Open view button
  if (openViewBtn) {
    openViewBtn.addEventListener('click', () => {
      showViewSelectionDialog();
    });
  }

  // Copy selection button
  if (copySelectionBtn) {
    copySelectionBtn.addEventListener('click', () => {
      const selectionText = document.getElementById('selection-text')?.textContent;

      if (selectionText) {
        navigator.clipboard.writeText(selectionText)
          .then(() => {
            showNotification('Text copied to clipboard');
          })
          .catch(err => {
            showNotification('Failed to copy text', true);
            console.error('Copy failed:', err);
          });
      }
    });
  }

  // Analyze selection button
  if (analyzeSelectionBtn) {
    analyzeSelectionBtn.addEventListener('click', () => {
      const selectionText = document.getElementById('selection-text')?.textContent;

      if (!selectionText) {
        showNotification('No text selected', true);
        return;
      }

      chrome.runtime.sendMessage({
        type: 'ANALYZE_CODE',
        code: selectionText
      }, response => {
        if (response?.success) {
          showNotification('Code sent for analysis');
        } else {
          showNotification('Failed to analyze code', true);
        }
      });
    });
  }

  // Execute selection button
  if (executeSelectionBtn) {
    executeSelectionBtn.addEventListener('click', () => {
      const selectionText = document.getElementById('selection-text')?.textContent;

      if (!selectionText) {
        showNotification('No text selected', true);
        return;
      }

      chrome.runtime.sendMessage({
        type: 'EXECUTE_CODE',
        code: selectionText
      }, response => {
        if (response?.success) {
          showNotification('Code sent for execution');
        } else {
          showNotification('Failed to execute code', true);
        }
      });
    });
  }
}

// Update selection preview
function updateSelectionPreview(text) {
  const selectionPreview = document.getElementById('selection-preview');
  const selectionText = document.getElementById('selection-text');

  if (selectionPreview && selectionText) {
    selectionPreview.classList.remove('hidden');
    selectionText.textContent = text;
  }
}

// Update chat info
function updateChatInfo(info) {
  const activeChatInfo = document.getElementById('active-chat-info');
  const chatPlatformInfo = document.getElementById('chat-platform-info');

  if (activeChatInfo && chatPlatformInfo) {
    activeChatInfo.classList.remove('hidden');

    let platformText = 'Unknown chat interface detected';
    if (info.platform && info.platform !== 'unknown') {
      platformText = `${info.platform} detected`;
    }

    chatPlatformInfo.textContent = platformText;
  }
}

// Show view selection dialog
function showViewSelectionDialog() {
  const dialog = document.createElement('div');
  dialog.className = 'dialog';

  dialog.innerHTML = `
    <div class="dialog-content">
      <h3>Open VS Code View</h3>
      <p>Select a view to open in VS Code:</p>
      <div class="view-buttons">
        <button class="view-button" data-view="communication">Communication Hub</button>
        <button class="view-button" data-view="agents">Agents</button>
        <button class="view-button" data-view="workflows">Workflows</button>
        <button class="view-button" data-view="dashboard">Dashboard</button>
        <button class="view-button" data-view="settings">Settings</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  // Add click events to view buttons
  dialog.querySelectorAll('.view-button').forEach(button => {
    button.addEventListener('click', () => {
      const view = button.getAttribute('data-view');

      // Send open view message
      chrome.runtime.sendMessage({
        type: 'OPEN_VSCODE_VIEW',
        view
      }, response => {
        if (response?.success) {
          showNotification(`Opening ${view} view`);
        } else {
          showNotification(`Failed to open ${view} view`, true);
        }
      });

      // Remove dialog
      document.body.removeChild(dialog);
    });
  });

  // Close dialog when clicking outside
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      document.body.removeChild(dialog);
    }
  });
}

// Initialize connection tab
function initializeConnectionTab() {
  const connectionForm = document.getElementById('connection-form');
  const saveConnectionBtn = document.getElementById('save-connection-btn');
  const connectBtn = document.getElementById('connect-btn');

  // Load connection settings
  chrome.storage.local.get(['settings'], result => {
    if (result.settings) {
      const settings = result.settings;

      // Set form values
      const wsProtocolSelect = document.getElementById('ws-protocol');
      const wsHostInput = document.getElementById('ws-host');
      const wsPortInput = document.getElementById('ws-port');
      const wsCompressionCheckbox = document.getElementById('ws-compression');

      if (wsProtocolSelect && settings.wsProtocol) {
        wsProtocolSelect.value = settings.wsProtocol;
      }

      if (wsHostInput && settings.wsHost) {
        wsHostInput.value = settings.wsHost;
      }

      if (wsPortInput && settings.wsPort) {
        wsPortInput.value = settings.wsPort.toString();
      }

      if (wsCompressionCheckbox && settings.useCompression !== undefined) {
        wsCompressionCheckbox.checked = settings.useCompression;
      }
    }
  });

  // Save connection button
  if (saveConnectionBtn) {
    saveConnectionBtn.addEventListener('click', event => {
      event.preventDefault();

      const wsProtocolSelect = document.getElementById('ws-protocol');
      const wsHostInput = document.getElementById('ws-host');
      const wsPortInput = document.getElementById('ws-port');
      const wsCompressionCheckbox = document.getElementById('ws-compression');

      const connectionSettings = {
        wsProtocol: wsProtocolSelect?.value || 'ws',
        wsHost: wsHostInput?.value || 'localhost',
        wsPort: parseInt(wsPortInput?.value || '3712'),
        useCompression: wsCompressionCheckbox?.checked || false
      };

      // Save connection settings
      chrome.storage.local.get(['settings'], result => {
        const currentSettings = result.settings || {};
        const newSettings = { ...currentSettings, ...connectionSettings };

        chrome.storage.local.set({ settings: newSettings }, () => {
          showNotification('Connection settings saved');
        });
      });
    });
  }

  // Connect button
  if (connectBtn) {
    connectBtn.addEventListener('click', event => {
      event.preventDefault();

      chrome.runtime.sendMessage({ type: 'CONNECT' }, response => {
        if (response?.success) {
          showNotification('Connecting to VS Code...');

          // Check connection status after a delay
          setTimeout(() => {
            checkConnectionStatus();
          }, 1000);
        } else {
          showNotification('Failed to connect to VS Code', true);
        }
      });
    });
  }
}

// Initialize AI tab
function initializeAITab() {
  const chatInput = document.getElementById('chat-input');
  const sendChatBtn = document.getElementById('send-chat-btn');
  const chatMessages = document.getElementById('chat-messages');

  // Load chat history
  chrome.storage.local.get(['chatHistory'], result => {
    if (result.chatHistory && chatMessages) {
      result.chatHistory.forEach(message => {
        addChatMessage(message.text, message.sender);
      });
    }
  });

  // Send chat button
  if (sendChatBtn && chatInput) {
    sendChatBtn.addEventListener('click', () => {
      const text = chatInput.value.trim();

      if (!text) {
        return;
      }

      // Add message to chat
      addChatMessage(text, 'user');

      // Clear input
      chatInput.value = '';

      // Send message to VS Code
      chrome.runtime.sendMessage({
        type: 'AI_REQUEST',
        request: text
      }, response => {
        if (!response?.success) {
          showNotification('Failed to send message to VS Code', true);
        }
      });
    });
  }

  // Chat input enter key
  if (chatInput) {
    chatInput.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendChatBtn?.click();
      }
    });
  }
}

// Add chat message
function addChatMessage(text, sender, isHtml = false) {
  const chatMessages = document.getElementById('chat-messages');

  if (chatMessages) {
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${sender}`;

    // If the content is already HTML, use it directly (with sanitization)
    // Otherwise, format the text as markdown
    const content = isHtml ? sanitizeHtml(text) : formatMessageText(text);

    messageElement.innerHTML = `
      <div class="message-content">${content}</div>
    `;

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Save to chat history
    saveChatMessage(text, sender);
  }
}

// Basic HTML sanitization
function sanitizeHtml(html) {
  // This is a very basic sanitization - in production, use DOMPurify
  // Remove potentially dangerous tags and attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/on\w+='[^']*'/g, '')
    .replace(/javascript:/g, '')
    .replace(/data:/g, 'data-safe:');
}

// Format message text (convert markdown, code blocks, etc.)
function formatMessageText(text) {
  // Simple markdown-like formatting
  // This is a basic implementation - could be enhanced with a proper markdown parser

  // Code blocks
  text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Line breaks
  text = text.replace(/\n/g, '<br>');

  return text;
}

// Save chat message to history
function saveChatMessage(text, sender) {
  chrome.storage.local.get(['chatHistory', 'settings'], result => {
    const saveChatHistory = result.settings?.saveChatHistory !== false;

    if (saveChatHistory) {
      const chatHistory = result.chatHistory || [];
      chatHistory.push({ text, sender, timestamp: Date.now() });

      // Limit history to last 100 messages
      if (chatHistory.length > 100) {
        chatHistory.shift();
      }

      chrome.storage.local.set({ chatHistory });
    }
  });
}

// Initialize code tab
function initializeCodeTab() {
  const codeInput = document.getElementById('code-input');
  const codeExecuteBtn = document.getElementById('code-execute-btn');
  const codeAnalyzeBtn = document.getElementById('code-analyze-btn');
  const codeSaveBtn = document.getElementById('code-save-btn');

  // Execute code button
  if (codeExecuteBtn && codeInput) {
    codeExecuteBtn.addEventListener('click', () => {
      const code = codeInput.value.trim();

      if (!code) {
        showNotification('Please enter code to execute', true);
        return;
      }

      // Send code for execution
      chrome.runtime.sendMessage({
        type: 'EXECUTE_CODE',
        code
      }, response => {
        if (response?.success) {
          showNotification('Code sent for execution');
        } else {
          showNotification('Failed to execute code', true);
        }
      });
    });
  }

  // Analyze code button
  if (codeAnalyzeBtn && codeInput) {
    codeAnalyzeBtn.addEventListener('click', () => {
      const code = codeInput.value.trim();

      if (!code) {
        showNotification('Please enter code to analyze', true);
        return;
      }

      // Send code for analysis
      chrome.runtime.sendMessage({
        type: 'ANALYZE_CODE',
        code
      }, response => {
        if (response?.success) {
          showNotification('Code sent for analysis');
        } else {
          showNotification('Failed to analyze code', true);
        }
      });
    });
  }

  // Save code button
  if (codeSaveBtn && codeInput) {
    codeSaveBtn.addEventListener('click', () => {
      const code = codeInput.value.trim();

      if (!code) {
        showNotification('Please enter code to save', true);
        return;
      }

      // Show save snippet dialog
      showSaveSnippetDialog(code);
    });
  }
}

// Show save snippet dialog
function showSaveSnippetDialog(code) {
  const dialog = document.createElement('div');
  dialog.className = 'dialog';

  dialog.innerHTML = `
    <div class="dialog-content">
      <h3>Save Code Snippet</h3>
      <form id="save-snippet-form">
        <div class="form-group">
          <label for="snippet-name">Name:</label>
          <input type="text" id="snippet-name" placeholder="My Snippet" required>
        </div>
        <div class="form-group">
          <label for="snippet-language">Language:</label>
          <select id="snippet-language">
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="csharp">C#</option>
            <option value="cpp">C++</option>
            <option value="php">PHP</option>
            <option value="ruby">Ruby</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
            <option value="swift">Swift</option>
            <option value="kotlin">Kotlin</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="sql">SQL</option>
            <option value="shell">Shell</option>
            <option value="plaintext">Plain Text</option>
          </select>
        </div>
        <div class="form-group">
          <label for="snippet-description">Description:</label>
          <textarea id="snippet-description" placeholder="Description (optional)"></textarea>
        </div>
        <div class="action-buttons">
          <button type="submit" class="primary-button">Save</button>
          <button type="button" class="secondary-button" id="cancel-save-snippet">Cancel</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(dialog);

  // Cancel button
  const cancelButton = dialog.querySelector('#cancel-save-snippet');
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      document.body.removeChild(dialog);
    });
  }

  // Save snippet form
  const saveSnippetForm = dialog.querySelector('#save-snippet-form');
  if (saveSnippetForm) {
    saveSnippetForm.addEventListener('submit', event => {
      event.preventDefault();

      const name = document.getElementById('snippet-name')?.value || 'Untitled Snippet';
      const language = document.getElementById('snippet-language')?.value || 'plaintext';
      const description = document.getElementById('snippet-description')?.value || '';

      // Save snippet
      chrome.runtime.sendMessage({
        type: 'SAVE_SNIPPET',
        snippet: {
          name,
          language,
          description,
          code,
          createdAt: Date.now()
        }
      }, response => {
        if (response?.success) {
          showNotification('Snippet saved');
        } else {
          showNotification('Failed to save snippet', true);
        }
      });

      // Remove dialog
      document.body.removeChild(dialog);
    });
  }

  // Close dialog when clicking outside
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      document.body.removeChild(dialog);
    }
  });
}

// Initialize settings tab
function initializeSettingsTab() {
  const settingsForm = document.getElementById('settings-form');
  const saveSettingsBtn = document.getElementById('save-settings');
  const resetSettingsBtn = document.getElementById('reset-settings');
  const saveSecretBtn = document.getElementById('save-secret');

  // Load settings
  chrome.storage.local.get(['settings', 'sharedSecret'], result => {
    if (result.settings) {
      const settings = result.settings;

      // Set form values
      const autoConnectCheckbox = document.getElementById('auto-connect');
      const showNotificationsCheckbox = document.getElementById('show-notifications');
      const saveHistoryCheckbox = document.getElementById('save-history');
      const debugModeCheckbox = document.getElementById('debug-mode');
      const relayUrlInput = document.getElementById('relay-url');
      const retryAttemptsInput = document.getElementById('retry-attempts');
      const retryDelayInput = document.getElementById('retry-delay');
      const sharedSecretInput = document.getElementById('shared-secret');

      if (autoConnectCheckbox && settings.autoConnect !== undefined) {
        autoConnectCheckbox.checked = settings.autoConnect;
      }

      if (showNotificationsCheckbox && settings.showNotifications !== undefined) {
        showNotificationsCheckbox.checked = settings.showNotifications;
      }

      if (saveHistoryCheckbox && settings.saveChatHistory !== undefined) {
        saveHistoryCheckbox.checked = settings.saveChatHistory;
      }

      if (debugModeCheckbox && settings.debugMode !== undefined) {
        debugModeCheckbox.checked = settings.debugMode;
      }

      if (relayUrlInput && settings.relayUrl) {
        relayUrlInput.value = settings.relayUrl;
      }

      if (retryAttemptsInput && settings.maxRetryAttempts !== undefined) {
        retryAttemptsInput.value = settings.maxRetryAttempts.toString();
      }

      if (retryDelayInput && settings.retryDelay !== undefined) {
        retryDelayInput.value = settings.retryDelay.toString();
      }

      // If shared secret exists, show a placeholder instead of the actual secret
      if (sharedSecretInput && result.sharedSecret) {
        sharedSecretInput.placeholder = '••••••••••••••••';
        sharedSecretInput.dataset.hasSecret = 'true';
      }
    }
  });

  // Save settings button
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      const autoConnectCheckbox = document.getElementById('auto-connect');
      const showNotificationsCheckbox = document.getElementById('show-notifications');
      const saveHistoryCheckbox = document.getElementById('save-history');
      const debugModeCheckbox = document.getElementById('debug-mode');
      const relayUrlInput = document.getElementById('relay-url');
      const retryAttemptsInput = document.getElementById('retry-attempts');
      const retryDelayInput = document.getElementById('retry-delay');

      const settings = {
        autoConnect: autoConnectCheckbox?.checked,
        showNotifications: showNotificationsCheckbox?.checked,
        saveChatHistory: saveHistoryCheckbox?.checked,
        debugMode: debugModeCheckbox?.checked,
        relayUrl: relayUrlInput?.value,
        maxRetryAttempts: parseInt(retryAttemptsInput?.value || '5'),
        retryDelay: parseInt(retryDelayInput?.value || '2000')
      };

      // Send settings update message
      chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings
      }, response => {
        if (response?.success) {
          showNotification('Settings saved');
        } else {
          showNotification(`Failed to save settings: ${response?.error}`, true);
        }
      });
    });
  }

  // Save shared secret button
  if (saveSecretBtn) {
    saveSecretBtn.addEventListener('click', () => {
      const sharedSecretInput = document.getElementById('shared-secret');
      const secret = sharedSecretInput?.value;

      if (!secret) {
        showNotification('Please enter a shared secret', true);
        return;
      }

      // Generate a unique message ID
      const messageId = Date.now().toString() + Math.random().toString(36).substring(2, 9);

      // Send the shared secret to the background script
      chrome.runtime.sendMessage({
        id: messageId,
        type: 'SET_SHARED_SECRET_REQUEST',
        source: 'chrome-extension-popup',
        timestamp: Date.now(),
        payload: {
          secret: secret
        }
      }, response => {
        if (response?.payload?.success) {
          showNotification('Shared secret saved successfully');
          sharedSecretInput.value = '';
          sharedSecretInput.placeholder = '••••••••••••••••';
          sharedSecretInput.dataset.hasSecret = 'true';
        } else {
          showNotification(`Failed to save shared secret: ${response?.payload?.message || 'Unknown error'}`, true);
        }
      });
    });
  }

  // Reset settings button
  if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all settings to defaults?')) {
        const defaultSettings = {
          wsProtocol: 'ws',
          wsHost: 'localhost',
          wsPort: 3712,
          useCompression: true,
          relayUrl: 'http://localhost:3000',
          autoConnect: true,
          showNotifications: true,
          saveChatHistory: true,
          debugMode: false,
          maxRetryAttempts: 5,
          retryDelay: 2000
        };

        // Send settings update message
        chrome.runtime.sendMessage({
          type: 'UPDATE_SETTINGS',
          settings: defaultSettings
        }, response => {
          if (response?.success) {
            showNotification('Settings reset to defaults');

            // Reload settings in form
            chrome.storage.local.get(['settings'], result => {
              if (result.settings) {
                const settings = result.settings;

                // Update form values
                const autoConnectCheckbox = document.getElementById('auto-connect');
                const showNotificationsCheckbox = document.getElementById('show-notifications');
                const saveHistoryCheckbox = document.getElementById('save-history');
                const debugModeCheckbox = document.getElementById('debug-mode');
                const relayUrlInput = document.getElementById('relay-url');
                const retryAttemptsInput = document.getElementById('retry-attempts');
                const retryDelayInput = document.getElementById('retry-delay');

                if (autoConnectCheckbox) autoConnectCheckbox.checked = settings.autoConnect;
                if (showNotificationsCheckbox) showNotificationsCheckbox.checked = settings.showNotifications;
                if (saveHistoryCheckbox) saveHistoryCheckbox.checked = settings.saveChatHistory;
                if (debugModeCheckbox) debugModeCheckbox.checked = settings.debugMode;
                if (relayUrlInput) relayUrlInput.value = settings.relayUrl;
                if (retryAttemptsInput) retryAttemptsInput.value = settings.maxRetryAttempts.toString();
                if (retryDelayInput) retryDelayInput.value = settings.retryDelay.toString();
              }
            });
          } else {
            showNotification('Failed to reset settings', true);
          }
        });
      }
    });
  }
}

// --- WebSocket Connection UI ---
function setupWebSocketUI() {
  const statusEl = document.getElementById('websocket-status');
  const connectBtn = document.getElementById('websocket-connect-btn');
  const disconnectBtn = document.getElementById('websocket-disconnect-btn');
  const logEl = document.getElementById('websocket-log');

  function updateStatus(connected) {
    if (statusEl) {
      statusEl.textContent = connected ? 'Connected' : 'Disconnected';
      statusEl.className = 'status-value ' + (connected ? 'online' : 'offline');
    }
  }

  function log(msg) {
    if (logEl) {
      logEl.textContent += `[${new Date().toLocaleTimeString()}] ${msg}\n`;
      logEl.scrollTop = logEl.scrollHeight;
    }
  }

  if (connectBtn) {
    connectBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'RECONNECT' }, (resp) => {
        if (resp && resp.success) {
          updateStatus(true);
          log('WebSocket connected.');
        } else {
          updateStatus(false);
          log('Failed to connect WebSocket.');
        }
      });
    });
  }
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'WEBSOCKET_DISCONNECT' }, (resp) => {
        updateStatus(false);
        log('WebSocket disconnected.');
      });
    });
  }

  // Initial status check
  chrome.runtime.sendMessage({ type: 'GET_CONNECTION_STATUS' }, (resp) => {
    updateStatus(resp && resp.connected);
    log('WebSocket status checked.');
  });
}

// Set up message listeners
function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CONNECTION_STATE') {
      updateConnectionStatus(message.state);
    } else if (message.type === 'AI_RESPONSE') {
      addChatMessage(message.response, 'ai');
    } else if (message.type === 'CONNECTION_STATUS') {
      // Handle connection status updates from the WebSocketManager
      if (message.payload && message.payload.status) {
        const statusIndicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');

        if (statusIndicator && statusText) {
          // Update the status indicator based on the connection status
          switch (message.payload.status) {
            case 'connected':
              statusIndicator.className = 'status-indicator online';
              statusText.textContent = 'Connected';
              break;
            case 'connecting':
              statusIndicator.className = 'status-indicator partial';
              statusText.textContent = 'Connecting...';
              break;
            case 'authenticating':
              statusIndicator.className = 'status-indicator partial';
              statusText.textContent = 'Authenticating...';
              break;
            case 'error':
              statusIndicator.className = 'status-indicator error';
              statusText.textContent = 'Connection Error';
              break;
            default:
              statusIndicator.className = 'status-indicator offline';
              statusText.textContent = 'Disconnected';
          }
        }

        // Update detailed connection status if on connection tab
        updateDetailedConnectionStatus();

        // Update UI elements that depend on connection status
        updateConnectionDependentUI();
      }
    } else if (message.type === 'SHARED_SECRET_ACK') {
      // Handle shared secret acknowledgment
      // This is handled directly in the save secret button click handler
    } else if (message.type === 'LLM_RESPONSE') {
      // Handle LLM response from VS Code
      if (message.payload) {
        const { text, codeSnippet, htmlContent, error } = message.payload;

        if (error) {
          showNotification(`Error from VS Code: ${error}`, true);
        } else if (text) {
          addChatMessage(text, 'ai');
        } else if (codeSnippet) {
          addChatMessage(`\`\`\`\n${codeSnippet}\n\`\`\``, 'ai');
        } else if (htmlContent) {
          addChatMessage(htmlContent, 'ai', true);
        }
      }
    } else if (message.type === 'ERROR_MESSAGE') {
      // Handle error messages
      if (message.payload && message.payload.message) {
        showNotification(`Error: ${message.payload.message}`, true);
      }
    }
  });
}

// Show notification
function showNotification(message, isError = false) {
  const notificationsContainer = document.getElementById('notifications-container');
  if (!notificationsContainer) return;

  const notification = document.createElement('div');
  notification.className = `notification ${isError ? 'error' : 'success'}`;
  notification.textContent = message;

  notificationsContainer.appendChild(notification);

  // Remove notification after a delay
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      if (notificationsContainer.contains(notification)) {
        notificationsContainer.removeChild(notification);
      }
    }, 500);
  }, 3000);
}

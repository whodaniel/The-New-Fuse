(function() {
    const vscode = acquireVsCodeApi();
    
    // Tab management
    let activeTab = 'chat';
    
    // Elements
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Chat elements
    const chatInput = document.getElementById('chatInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const chatMessages = document.getElementById('chatMessages');
    const startCollabBtn = document.getElementById('startCollabBtn');
    const clearChatBtn = document.getElementById('clearChatBtn');
    
    // Settings elements
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    
    // Dashboard elements
    const refreshStatsBtn = document.getElementById('refreshStatsBtn');
    const clearDataBtn = document.getElementById('clearDataBtn');
    
    // Initialize
    initializeTabHandlers();
    initializeChatHandlers();
    initializeSettingsHandlers();
    initializeDashboardHandlers();
    requestStatus();
    
    /**
     * Initialize tab switching functionality
     */
    function initializeTabHandlers() {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tab = button.getAttribute('data-tab');
                switchTab(tab);
            });
        });
    }
    
    /**
     * Switch to a specific tab
     */
    function switchTab(tab) {
        if (tab === activeTab) return;
        
        // Update active tab
        activeTab = tab;
        
        // Update button states
        tabButtons.forEach(button => {
            const buttonTab = button.getAttribute('data-tab');
            button.classList.toggle('active', buttonTab === tab);
        });
        
        // Update content visibility
        tabContents.forEach(content => {
            const contentTab = content.id.replace('tab-', '');
            content.classList.toggle('active', contentTab === tab);
        });
        
        // Notify extension of tab change
        vscode.postMessage({
            command: 'tabChanged',
            tab: tab
        });
        
        // Load tab-specific data
        loadTabData(tab);
    }
    
    /**
     * Load data for specific tab
     */
    function loadTabData(tab) {
        switch (tab) {
            case 'chat':
                // Load chat history if needed
                break;
            case 'communication':
                requestConnectionStatus();
                break;
            case 'dashboard':
                requestDashboardStats();
                break;
            case 'settings':
                // Settings are loaded on page load
                break;
        }
    }
    
    /**
     * Initialize chat functionality
     */
    function initializeChatHandlers() {
        if (sendMessageBtn) {
            sendMessageBtn.addEventListener('click', sendMessage);
        }
        
        if (chatInput) {
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
        }
        
        if (startCollabBtn) {
            startCollabBtn.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'startCollaboration'
                });
            });
        }
        
        if (clearChatBtn) {
            clearChatBtn.addEventListener('click', () => {
                clearChat();
            });
        }
    }
    
    /**
     * Send a chat message
     */
    function sendMessage() {
        if (!chatInput) return;
        
        const message = chatInput.value.trim();
        if (!message) return;
        
        // Add message to chat display
        addMessageToChat('user', message);
        
        // Clear input
        chatInput.value = '';
        
        // Send to extension
        vscode.postMessage({
            command: 'sendMessage',
            text: message,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Add a message to the chat display
     */
    function addMessageToChat(sender, message, timestamp) {
        if (!chatMessages) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${sender}`;
        
        const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
        
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="message-sender">${sender === 'user' ? 'You' : 'AI'}</span>
                <span class="message-time">${timeStr}</span>
            </div>
            <div class="message-content">${escapeHtml(message)}</div>
        `;
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    /**
     * Clear chat messages
     */
    function clearChat() {
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
    }
    
    /**
     * Initialize settings functionality
     */
    function initializeSettingsHandlers() {
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', saveSettings);
        }
        
        // Add test connection button handler
        const testConnectionBtn = document.getElementById('testConnectionBtn');
        if (testConnectionBtn) {
            testConnectionBtn.addEventListener('click', testConnection);
        }
        
        // Add change handlers for provider selection
        const llmProviderSelect = document.getElementById('llmProvider');
        if (llmProviderSelect) {
            llmProviderSelect.addEventListener('change', onProviderChange);
        }
    }
    
    /**
     * Handle provider selection change
     */
    function onProviderChange() {
        const llmProviderSelect = document.getElementById('llmProvider');
        if (!llmProviderSelect) return;
        
        const selectedProvider = llmProviderSelect.value;
        
        // Hide all provider configs
        const providerConfigs = document.querySelectorAll('.provider-config');
        providerConfigs.forEach(config => {
            config.style.display = 'none';
        });
        
        // Show the selected provider config
        const activeConfig = document.getElementById(`${selectedProvider}-config`);
        if (activeConfig) {
            activeConfig.style.display = 'block';
        }
    }
    
    /**
     * Test connection with current provider
     */
    function testConnection() {
        const llmProviderSelect = document.getElementById('llmProvider');
        if (!llmProviderSelect) return;
        
        vscode.postMessage({
            command: 'testConnection',
            provider: llmProviderSelect.value
        });
    }
    
    /**
     * Save settings
     */
    function saveSettings() {
        const settings = {};
        
        // Collect all form values
        const formElements = document.querySelectorAll('#tab-settings input, #tab-settings select');
        formElements.forEach(element => {
            const key = element.id;
            let value;
            
            if (element.type === 'checkbox') {
                value = element.checked;
            } else if (element.type === 'password' && element.value === '') {
                // Don't save empty passwords (keep existing values)
                return;
            } else {
                value = element.value;
            }
            
            // Map form fields to configuration keys
            const configKey = mapFormFieldToConfig(key);
            if (configKey) {
                settings[configKey] = value;
            }
        });
        
        vscode.postMessage({
            command: 'saveSettings',
            data: settings
        });
    }
    
    /**
     * Map form field IDs to configuration keys
     */
    function mapFormFieldToConfig(fieldId) {
        const mapping = {
            'llmProvider': 'llmProvider',  // Fix: use correct config key
            'enableChat': 'chat.enabled',
            'mcpUrl': 'mcp.url',
            'autoConnect': 'mcp.autoConnect',
            'openaiApiKey': 'openai.apiKey',
            'anthropicApiKey': 'anthropic.apiKey',
            'cerebrasApiKey': 'cerebras.apiKey',
            'cerebrasModel': 'cerebras.model',
            'ollamaUrl': 'ollama.url',
            'ollamaModel': 'ollama.model'
        };
        return mapping[fieldId];
    }
    
    /**
     * Initialize dashboard functionality
     */
    function initializeDashboardHandlers() {
        if (refreshStatsBtn) {
            refreshStatsBtn.addEventListener('click', () => {
                requestDashboardStats();
            });
        }
        
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all monitoring data?')) {
                    vscode.postMessage({
                        command: 'clearMonitoringData'
                    });
                }
            });
        }
    }
    
    /**
     * Request dashboard statistics
     */
    function requestDashboardStats() {
        vscode.postMessage({
            command: 'getDashboardStats'
        });
    }
    
    /**
     * Request connection status
     */
    function requestConnectionStatus() {
        vscode.postMessage({
            command: 'getConnectionStatus'
        });
    }
    
    /**
     * Request general status
     */
    function requestStatus() {
        vscode.postMessage({
            command: 'status'
        });
    }
    
    /**
     * Update dashboard stats display
     */
    function updateDashboardStats(stats) {
        const elements = {
            'llmRequestCount': stats.llmRequests || 0,
            'agentMessageCount': stats.agentMessages || 0,
            'activeSessionCount': stats.activeSessions || 0,
            'errorCount': stats.errors || 0
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }
    
    /**
     * Update connection status display
     */
    function updateConnectionStatus(status) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.textContent = status.connected ? 'Connected' : 'Disconnected';
            statusElement.className = status.connected ? 'status-connected' : 'status-disconnected';
        }
    }
    
    /**
     * Handle messages from the extension
     */
    window.addEventListener('message', event => {
        const message = event.data;
        
        switch (message.command) {
            case 'switchTab':
                switchTab(message.tab);
                break;
                
            case 'message':
                addMessageToChat('ai', message.text, message.timestamp);
                break;
                
            case 'llm-response':
                addMessageToChat('ai', message.text, new Date().toISOString());
                break;
                
            case 'llm-error':
                addMessageToChat('system', `Error: ${message.data.error}`, new Date().toISOString());
                break;
                
            case 'status':
                if (message.data.connected !== undefined) {
                    updateConnectionStatus(message.data);
                }
                break;
                
            case 'dashboardStats':
                updateDashboardStats(message.data);
                break;
                
            case 'settings-updated':
                // Could refresh settings display here
                break;
        }
    });
    
    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
    
    /**
     * Handle external tab switching
     */
    vscode.postMessage({
        command: 'ready'
    });
})();

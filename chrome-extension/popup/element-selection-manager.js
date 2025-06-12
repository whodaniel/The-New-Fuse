/**
 * Enhanced Popup UI for Element Selection and AI Integration
 */
import { Logger } from '../utils/logger.js';
export class ElementSelectionManager {
    constructor() {
        this.currentPageMapping = null;
        this.logger = new Logger({
            name: 'ElementSelection',
            level: 'info',
            saveToStorage: true
        });
        this.initialize();
    }
    initialize() {
        this.setupElementSelectionUI();
        this.loadCurrentPageMapping();
    }
    /**
     * Toggle floating panel visibility
     */
    async toggleFloatingPanel() {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tabs[0]?.id) {
                throw new Error('No active tab found');
            }
            // Send message to content script to toggle floating panel
            const response = await chrome.tabs.sendMessage(tabs[0].id, {
                type: 'TOGGLE_FLOATING_PANEL'
            });
            if (response?.success) {
                this.showNotification(response.visible
                    ? 'Floating panel activated! Check the page for the overlay interface.'
                    : 'Floating panel hidden.', 'success');
            }
            else {
                this.showNotification('Failed to toggle floating panel', 'error');
            }
        }
        catch (error) {
            this.logger.error('Failed to toggle floating panel:', error);
            this.showNotification('Floating panel toggle failed', 'error');
        }
    }
    /**
     * Setup the element selection interface
     */
    setupElementSelectionUI() {
        // Create element selection section
        const mainView = document.getElementById('main-view');
        if (!mainView)
            return;
        const elementSection = document.createElement('div');
        elementSection.className = 'section element-selection';
        elementSection.innerHTML = `
      <div class="section-header">
        <h3>🎯 Page Element Configuration</h3>
        <div class="element-status">
          <span id="element-status-indicator" class="status-indicator unknown">❓</span>
          <span id="element-status-text">Checking...</span>
        </div>
      </div>
      
      <div class="element-config-content">
        <!-- Auto-detection section -->
        <div class="auto-detection">
          <button id="auto-detect-btn" class="btn btn-primary">
            🤖 Auto-Detect Elements
          </button>
          <button id="validate-elements-btn" class="btn btn-secondary">
            ✅ Validate Current
          </button>
        </div>

        <!-- Manual selection section -->
        <div class="manual-selection">
          <h4>Manual Element Selection</h4>
          <div class="element-buttons">
            <button id="select-chat-input-btn" class="btn btn-outline" data-element-type="chatInput">
              📝 Select Chat Input
            </button>
            <button id="select-send-button-btn" class="btn btn-outline" data-element-type="sendButton">
              📤 Select Send Button
            </button>
            <button id="select-chat-output-btn" class="btn btn-outline" data-element-type="chatOutput">
              💬 Select Chat Output
            </button>
          </div>
        </div>

        <!-- Current mapping display -->
        <div class="current-mapping">
          <h4>Current Element Mapping</h4>
          <div id="element-mapping-display" class="mapping-display">
            <div class="element-info" id="chat-input-info">
              <span class="element-label">Chat Input:</span>
              <span class="element-value" id="chat-input-value">Not configured</span>
            </div>
            <div class="element-info" id="send-button-info">
              <span class="element-label">Send Button:</span>
              <span class="element-value" id="send-button-value">Not configured</span>
            </div>
            <div class="element-info" id="chat-output-info">
              <span class="element-label">Chat Output:</span>
              <span class="element-value" id="chat-output-value">Not configured</span>
            </div>
          </div>
        </div>

        <!-- AI Integration section -->
        <div class="ai-integration">
          <h4>🧠 AI Integration</h4>
          <div class="ai-actions">
            <button id="toggle-floating-panel-btn" class="btn btn-feature">
              🎯 Toggle Floating Panel
            </button>
            <button id="test-send-message-btn" class="btn btn-success">
              📨 Test Send Message
            </button>
            <button id="test-capture-response-btn" class="btn btn-success">
              📋 Test Capture Response
            </button>
            <button id="start-ai-session-btn" class="btn btn-primary">
              🚀 Start AI Session
            </button>
          </div>
          
          <div class="ai-status">
            <div class="relay-connection">
              <span class="status-label">TNF Relay:</span>
              <span id="relay-status" class="status-value">Checking...</span>
            </div>
            <div class="ai-models">
              <span class="status-label">AI Models:</span>
              <span id="ai-models-status" class="status-value">Loading...</span>
            </div>
          </div>
        </div>

        <!-- Advanced Configuration -->
        <div class="advanced-config">
          <details>
            <summary>🔧 Advanced Configuration</summary>
            <div class="advanced-content">
              <div class="config-option">
                <label for="auto-retry-failed">Auto-retry failed selections:</label>
                <input type="checkbox" id="auto-retry-failed" checked>
              </div>
              <div class="config-option">
                <label for="use-ai-validation">Use AI validation:</label>
                <input type="checkbox" id="use-ai-validation" checked>
              </div>
              <div class="config-option">
                <label for="save-per-domain">Save settings per domain:</label>
                <input type="checkbox" id="save-per-domain" checked>
              </div>
              <div class="config-buttons">
                <button id="export-mapping-btn" class="btn btn-outline">
                  📤 Export Mapping
                </button>
                <button id="import-mapping-btn" class="btn btn-outline">
                  📥 Import Mapping
                </button>
                <button id="clear-mapping-btn" class="btn btn-danger">
                  🗑️ Clear Mapping
                </button>
              </div>
            </div>
          </details>
        </div>
      </div>
    `;
        // Insert before chat section
        const chatSection = mainView.querySelector('.section.chat');
        if (chatSection) {
            mainView.insertBefore(elementSection, chatSection);
        }
        else {
            mainView.appendChild(elementSection);
        }
        // Setup event listeners
        this.setupEventListeners();
    }
    /**
     * Setup event listeners for element selection UI
     */
    setupEventListeners() {
        // Auto-detection
        const autoDetectBtn = document.getElementById('auto-detect-btn');
        if (autoDetectBtn) {
            autoDetectBtn.addEventListener('click', () => this.autoDetectElements());
        }
        // Validation
        const validateBtn = document.getElementById('validate-elements-btn');
        if (validateBtn) {
            validateBtn.addEventListener('click', () => this.validateElements());
        }
        // Manual selection buttons
        const selectionButtons = document.querySelectorAll('[data-element-type]');
        selectionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const elementType = e.target.getAttribute('data-element-type');
                if (elementType) {
                    this.startElementSelection(elementType);
                }
            });
        });
        // AI Integration buttons
        const toggleFloatingPanelBtn = document.getElementById('toggle-floating-panel-btn');
        if (toggleFloatingPanelBtn) {
            toggleFloatingPanelBtn.addEventListener('click', () => this.toggleFloatingPanel());
        }
        const testSendBtn = document.getElementById('test-send-message-btn');
        if (testSendBtn) {
            testSendBtn.addEventListener('click', () => this.testSendMessage());
        }
        const testCaptureBtn = document.getElementById('test-capture-response-btn');
        if (testCaptureBtn) {
            testCaptureBtn.addEventListener('click', () => this.testCaptureResponse());
        }
        const startAIBtn = document.getElementById('start-ai-session-btn');
        if (startAIBtn) {
            startAIBtn.addEventListener('click', () => this.startAISession());
        }
        // Advanced configuration buttons
        const exportBtn = document.getElementById('export-mapping-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportMapping());
        }
        const importBtn = document.getElementById('import-mapping-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importMapping());
        }
        const clearBtn = document.getElementById('clear-mapping-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearMapping());
        }
        // Listen for element selection results
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'ELEMENT_SELECTED') {
                this.handleElementSelected(message.elementType, message.elementInfo, message.pageMapping);
            }
            else if (message.type === 'ELEMENT_MAPPING_DETECTED') {
                this.currentPageMapping = message.mapping;
                this.updateMappingDisplay();
            }
        });
    }
    /**
     * Auto-detect elements on current page
     */
    async autoDetectElements() {
        this.showStatus('Detecting elements...', 'loading');
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tabs[0]?.id) {
                throw new Error('No active tab found');
            }
            const response = await chrome.tabs.sendMessage(tabs[0].id, {
                type: 'AUTO_DETECT_ELEMENTS'
            });
            if (response.success) {
                this.currentPageMapping = response.mapping;
                this.updateMappingDisplay();
                this.showStatus('Elements detected successfully!', 'success');
                // Check relay connection after successful detection
                this.checkRelayConnection();
            }
            else {
                this.showStatus('No elements detected', 'warning');
            }
        }
        catch (error) {
            this.logger.error('Auto-detection failed:', error);
            this.showStatus('Detection failed', 'error');
        }
    }
    /**
     * Validate current element mapping
     */
    async validateElements() {
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
                type: 'VALIDATE_ELEMENT_MAPPING'
            });
            if (response.success) {
                const validation = response.validation;
                if (validation.valid) {
                    this.showStatus('All elements valid!', 'success');
                }
                else {
                    this.showStatus(`Issues found: ${validation.issues.join(', ')}`, 'warning');
                }
            }
            else {
                this.showStatus('Validation failed', 'error');
            }
        }
        catch (error) {
            this.logger.error('Validation failed:', error);
            this.showStatus('Validation error', 'error');
        }
    }
    /**
     * Start element selection mode
     */
    async startElementSelection(elementType) {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tabs[0]?.id) {
                throw new Error('No active tab found');
            }
            // Close popup and enter selection mode
            window.close();
            await chrome.tabs.sendMessage(tabs[0].id, {
                type: 'ENTER_ELEMENT_SELECTION_MODE',
                payload: { elementType }
            });
        }
        catch (error) {
            this.logger.error('Failed to start element selection:', error);
            this.showNotification('Failed to start selection mode', 'error');
        }
    }
    /**
     * Handle element selection result
     */
    handleElementSelected(elementType, elementInfo, pageMapping) {
        this.currentPageMapping = pageMapping;
        this.updateMappingDisplay();
        this.showNotification(`${elementType} selected successfully!`, 'success');
    }
    /**
     * Test sending a message
     */
    async testSendMessage() {
        if (!this.currentPageMapping?.chatInput || !this.currentPageMapping?.sendButton) {
            this.showNotification('Chat input and send button must be configured first', 'warning');
            return;
        }
        const message = prompt('Enter test message:', 'Hello, this is a test from The New Fuse!');
        if (!message)
            return;
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tabs[0]?.id) {
                throw new Error('No active tab found');
            }
            const response = await chrome.tabs.sendMessage(tabs[0].id, {
                type: 'SEND_TO_PAGE_INPUT',
                payload: { text: message }
            });
            if (response.success) {
                this.showNotification('Test message sent successfully!', 'success');
            }
            else {
                this.showNotification(`Failed to send message: ${response.error}`, 'error');
            }
        }
        catch (error) {
            this.logger.error('Test send failed:', error);
            this.showNotification('Test send failed', 'error');
        }
    }
    /**
     * Test capturing response
     */
    async testCaptureResponse() {
        if (!this.currentPageMapping?.chatOutput) {
            this.showNotification('Chat output must be configured first', 'warning');
            return;
        }
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tabs[0]?.id) {
                throw new Error('No active tab found');
            }
            const response = await chrome.tabs.sendMessage(tabs[0].id, {
                type: 'CAPTURE_PAGE_OUTPUT',
                payload: {}
            });
            if (response.success) {
                const capturedText = response.text.slice(0, 100) + (response.text.length > 100 ? '...' : '');
                this.showNotification(`Captured: "${capturedText}"`, 'success');
            }
            else {
                this.showNotification(`Failed to capture response: ${response.error}`, 'error');
            }
        }
        catch (error) {
            this.logger.error('Test capture failed:', error);
            this.showNotification('Test capture failed', 'error');
        }
    }
    /**
     * Start AI session
     */
    async startAISession() {
        if (!this.currentPageMapping?.chatInput || !this.currentPageMapping?.sendButton || !this.currentPageMapping?.chatOutput) {
            this.showNotification('All elements must be configured before starting AI session', 'warning');
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
            const response = await chrome.runtime.sendMessage({
                type: 'START_AI_SESSION',
                mapping: this.currentPageMapping
            });
            if (response?.success) {
                this.showNotification('AI session started! You can now use voice commands and automation.', 'success');
                this.updateAIStatus('active');
            }
            else {
                this.showNotification('Failed to start AI session', 'error');
            }
        }
        catch (error) {
            this.logger.error('Failed to start AI session:', error);
            this.showNotification('AI session startup failed', 'error');
        }
    }
    /**
     * Export element mapping
     */
    exportMapping() {
        if (!this.currentPageMapping) {
            this.showNotification('No mapping to export', 'warning');
            return;
        }
        const exportData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            mapping: this.currentPageMapping
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tnf-mapping-${this.currentPageMapping.domain}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showNotification('Mapping exported successfully!', 'success');
    }
    /**
     * Import element mapping
     */
    importMapping() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files?.[0];
            if (!file)
                return;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importData = JSON.parse(e.target?.result);
                    if (importData.mapping) {
                        this.currentPageMapping = importData.mapping;
                        this.updateMappingDisplay();
                        this.showNotification('Mapping imported successfully!', 'success');
                    }
                    else {
                        this.showNotification('Invalid mapping file format', 'error');
                    }
                }
                catch (error) {
                    this.logger.error('Import failed:', error);
                    this.showNotification('Failed to import mapping', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
    /**
     * Clear current mapping
     */
    clearMapping() {
        if (confirm('Are you sure you want to clear the current element mapping?')) {
            this.currentPageMapping = null;
            this.updateMappingDisplay();
            this.showStatus('Mapping cleared', 'warning');
            // Clear from storage
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.id) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: 'SAVE_ELEMENT_MAPPING',
                        payload: { mapping: null }
                    });
                }
            });
        }
    }
    /**
     * Load current page mapping
     */
    async loadCurrentPageMapping() {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tabs[0]?.id)
                return;
            const response = await chrome.tabs.sendMessage(tabs[0].id, {
                type: 'LOAD_ELEMENT_MAPPING'
            });
            if (response?.success && response.mapping) {
                this.currentPageMapping = response.mapping;
                this.updateMappingDisplay();
            }
        }
        catch (error) {
            this.logger.error('Failed to load mapping:', error);
        }
        // Check relay connection
        this.checkRelayConnection();
    }
    /**
     * Update mapping display
     */
    updateMappingDisplay() {
        const chatInputValue = document.getElementById('chat-input-value');
        const sendButtonValue = document.getElementById('send-button-value');
        const chatOutputValue = document.getElementById('chat-output-value');
        if (chatInputValue) {
            chatInputValue.textContent = this.currentPageMapping?.chatInput
                ? this.formatElementInfo(this.currentPageMapping.chatInput)
                : 'Not configured';
            chatInputValue.className = this.currentPageMapping?.chatInput ? 'element-value configured' : 'element-value';
        }
        if (sendButtonValue) {
            sendButtonValue.textContent = this.currentPageMapping?.sendButton
                ? this.formatElementInfo(this.currentPageMapping.sendButton)
                : 'Not configured';
            sendButtonValue.className = this.currentPageMapping?.sendButton ? 'element-value configured' : 'element-value';
        }
        if (chatOutputValue) {
            chatOutputValue.textContent = this.currentPageMapping?.chatOutput
                ? this.formatElementInfo(this.currentPageMapping.chatOutput)
                : 'Not configured';
            chatOutputValue.className = this.currentPageMapping?.chatOutput ? 'element-value configured' : 'element-value';
        }
        // Update overall status
        const configuredCount = [
            this.currentPageMapping?.chatInput,
            this.currentPageMapping?.sendButton,
            this.currentPageMapping?.chatOutput
        ].filter(Boolean).length;
        if (configuredCount === 3) {
            this.showStatus('Fully configured', 'success');
        }
        else if (configuredCount > 0) {
            this.showStatus(`${configuredCount}/3 configured`, 'warning');
        }
        else {
            this.showStatus('Not configured', 'error');
        }
    }
    /**
     * Format element info for display
     */
    formatElementInfo(elementInfo) {
        if (elementInfo.id) {
            return `#${elementInfo.id}`;
        }
        else if (elementInfo.classes.length > 0) {
            return `.${elementInfo.classes[0]}`;
        }
        else {
            return elementInfo.tag;
        }
    }
    /**
     * Check relay connection
     */
    async checkRelayConnection() {
        const relayStatusEl = document.getElementById('relay-status');
        try {
            // Check if TNF Relay is running
            const response = await chrome.runtime.sendMessage({
                type: 'CHECK_RELAY_CONNECTION'
            });
            const status = response?.connected ? 'Connected' : 'Disconnected';
            const connected = response?.connected || false;
            if (relayStatusEl) {
                relayStatusEl.textContent = status;
                relayStatusEl.className = `status-value ${connected ? 'connected' : 'disconnected'}`;
            }
            return { connected, status };
        }
        catch (error) {
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
    updateAIStatus(status) {
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
     * Show status in the status area
     */
    showStatus(message, type) {
        const statusIndicator = document.getElementById('element-status-indicator');
        const statusText = document.getElementById('element-status-text');
        if (statusIndicator) {
            const icons = {
                success: '✅',
                error: '❌',
                warning: '⚠️',
                loading: '🔄',
                unknown: '❓'
            };
            statusIndicator.textContent = icons[type];
            statusIndicator.className = `status-indicator ${type}`;
        }
        if (statusText) {
            statusText.textContent = message;
        }
    }
    /**
     * Show notification
     */
    showNotification(message, type = 'success') {
        // Use the existing notification system from the main popup
        if (typeof window.showNotification === 'function') {
            window.showNotification(message);
        }
        else if (typeof window.showError === 'function' && type === 'error') {
            window.showError(message);
        }
        else {
            // Fallback to console
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}
//# sourceMappingURL=element-selection-manager.js.map
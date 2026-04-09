/**
 * Chrome Extension Integration Example
 * 
 * This example demonstrates how to integrate the Extension Message Inspector
 * with a Chrome extension to monitor communication between content scripts,
 * background scripts, and popup scripts.
 */

// Background Script Integration (background.js)
class ChromeExtensionInspectorIntegration {
    constructor() {
        this.inspector = null;
        this.initializeInspector();
        this.setupExtensionListeners();
    }

    async initializeInspector() {
        // Load the inspector script
        if (typeof ExtensionMessageInspector === 'undefined') {
            await this.loadInspectorScript();
        }
        
        this.inspector = new ExtensionMessageInspector({
            enableFiltering: true,
            enablePatternMatching: true,
            logLevel: 'debug',
            maxQueueSize: 2000,
            enablePerformanceMonitoring: true
        });

        // Add Chrome extension specific patterns
        this.setupExtensionPatterns();
        
        // Start monitoring
        this.inspector.start();
        console.log('🔍 Chrome Extension Message Inspector initialized');
    }

    async loadInspectorScript() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL('scripts/extension-message-inspector.js');
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    setupExtensionPatterns() {
        // Monitor authentication messages
        this.inspector.addPattern('auth-messages', /auth|login|token/, (message, patternName) => {
            console.log(`🔐 Auth message detected:`, message);
            this.handleAuthMessage(message);
        });

        // Monitor API calls
        this.inspector.addPattern('api-calls', {
            type: 'api-call',
            method: /.*/
        }, (message, patternName) => {
            console.log(`🌐 API call detected:`, message);
            this.handleApiCall(message);
        });

        // Monitor error messages
        this.inspector.addPattern('error-messages', /error|fail|exception/, (message, patternName) => {
            console.log(`❌ Error message detected:`, message);
            this.handleErrorMessage(message);
        });

        // Monitor content script communication
        this.inspector.addPattern('content-script', {
            source: 'content-script'
        }, (message, patternName) => {
            console.log(`📄 Content script message:`, message);
            this.handleContentScriptMessage(message);
        });
    }

    setupExtensionListeners() {
        // Monitor chrome.runtime messages
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.inspector.logMessage({
                type: 'chrome-runtime-message',
                message: message,
                sender: sender,
                timestamp: Date.now(),
                source: 'chrome-runtime'
            });

            // Handle specific message types
            this.handleRuntimeMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async response
        });

        // Monitor chrome.runtime.onConnect (for long-lived connections)
        chrome.runtime.onConnect.addListener((port) => {
            this.inspector.logMessage({
                type: 'chrome-port-connection',
                portName: port.name,
                sender: port.sender,
                timestamp: Date.now(),
                source: 'chrome-runtime'
            });

            port.onMessage.addListener((message) => {
                this.inspector.logMessage({
                    type: 'chrome-port-message',
                    portName: port.name,
                    message: message,
                    timestamp: Date.now(),
                    source: 'chrome-port'
                });
            });

            port.onDisconnect.addListener(() => {
                this.inspector.logMessage({
                    type: 'chrome-port-disconnect',
                    portName: port.name,
                    timestamp: Date.now(),
                    source: 'chrome-runtime'
                });
            });
        });

        // Monitor tab updates
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete') {
                this.inspector.logMessage({
                    type: 'tab-updated',
                    tabId: tabId,
                    url: tab.url,
                    title: tab.title,
                    timestamp: Date.now(),
                    source: 'chrome-tabs'
                });
            }
        });

        // Monitor storage changes
        chrome.storage.onChanged.addListener((changes, namespace) => {
            this.inspector.logMessage({
                type: 'storage-changed',
                changes: changes,
                namespace: namespace,
                timestamp: Date.now(),
                source: 'chrome-storage'
            });
        });
    }

    handleRuntimeMessage(message, sender, sendResponse) {
        switch (message.type) {
            case 'get-inspector-stats':
                sendResponse(this.inspector.getStats());
                break;
                
            case 'get-inspector-messages':
                const messages = this.inspector.getMessages();
                sendResponse({ messages: messages.slice(-100) }); // Last 100 messages
                break;
                
            case 'search-messages':
                const searchResults = this.inspector.search(message.query, {
                    limit: message.limit || 50,
                    source: message.source
                });
                sendResponse(searchResults);
                break;
                
            case 'export-messages':
                const exportData = this.inspector.exportMessages(message.format || 'json');
                sendResponse({ data: exportData });
                break;
                
            case 'add-filter':
                this.inspector.addFilter(message.name, message.config);
                sendResponse({ success: true });
                break;
                
            case 'add-pattern':
                this.inspector.addPattern(message.name, message.pattern, message.callback);
                sendResponse({ success: true });
                break;
                
            default:
                // Log unknown message types
                this.inspector.logMessage({
                    type: 'unknown-runtime-message',
                    message: message,
                    sender: sender,
                    timestamp: Date.now(),
                    source: 'chrome-runtime',
                    level: 'warn'
                });
        }
    }

    handleAuthMessage(message) {
        // Custom handling for authentication messages
        if (message.message && message.message.token) {
            // Don't log sensitive token data
            this.inspector.logMessage({
                type: 'auth-token-detected',
                hasToken: true,
                tokenLength: message.message.token.length,
                timestamp: Date.now(),
                source: 'auth-handler',
                level: 'info'
            });
        }
    }

    handleApiCall(message) {
        // Track API call performance
        if (message.message && message.message.url) {
            this.inspector.logMessage({
                type: 'api-call-tracked',
                url: message.message.url,
                method: message.message.method,
                timestamp: Date.now(),
                source: 'api-tracker',
                level: 'info'
            });
        }
    }

    handleErrorMessage(message) {
        // Enhanced error tracking
        this.inspector.logMessage({
            type: 'error-tracked',
            originalMessage: message,
            timestamp: Date.now(),
            source: 'error-tracker',
            level: 'error'
        });

        // Could trigger alerts or notifications here
        this.sendErrorNotification(message);
    }

    handleContentScriptMessage(message) {
        // Track content script activity
        this.inspector.logMessage({
            type: 'content-script-activity',
            activity: message,
            timestamp: Date.now(),
            source: 'content-tracker',
            level: 'debug'
        });
    }

    sendErrorNotification(errorMessage) {
        // Send notification to popup or content script about errors
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'error-notification',
                    error: errorMessage,
                    timestamp: Date.now()
                });
            }
        });
    }

    // Public API for other parts of the extension
    getInspectorInstance() {
        return this.inspector;
    }

    getStats() {
        return this.inspector ? this.inspector.getStats() : null;
    }

    exportData(format = 'json') {
        return this.inspector ? this.inspector.exportMessages(format) : null;
    }
}

// Content Script Integration (content.js)
class ContentScriptInspectorIntegration {
    constructor() {
        this.inspector = null;
        this.initializeInspector();
        this.setupPageListeners();
    }

    async initializeInspector() {
        // Load inspector if not already available
        if (typeof ExtensionMessageInspector === 'undefined') {
            await this.loadInspectorScript();
        }

        this.inspector = new ExtensionMessageInspector({
            enableFiltering: true,
            logLevel: 'info',
            maxQueueSize: 1000
        });

        // Add content script specific patterns
        this.setupContentPatterns();
        
        this.inspector.start();
        console.log('🔍 Content Script Message Inspector initialized');
    }

    async loadInspectorScript() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL('scripts/extension-message-inspector.js');
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    setupContentPatterns() {
        // Monitor DOM mutations
        this.inspector.addPattern('dom-mutations', /mutation|dom|element/, (message) => {
            console.log('🔄 DOM mutation detected:', message);
        });

        // Monitor page navigation
        this.inspector.addPattern('navigation', /navigate|url|location/, (message) => {
            console.log('🧭 Navigation event:', message);
        });

        // Monitor user interactions
        this.inspector.addPattern('user-interaction', /click|scroll|input|focus/, (message) => {
            console.log('👆 User interaction:', message);
        });
    }

    setupPageListeners() {
        // Monitor page messages
        window.addEventListener('message', (event) => {
            this.inspector.logMessage({
                type: 'page-message',
                message: event.data,
                origin: event.origin,
                source: 'page-window',
                timestamp: Date.now()
            });
        });

        // Monitor DOM mutations
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                this.inspector.logMessage({
                    type: 'dom-mutation',
                    mutationType: mutation.type,
                    target: mutation.target.tagName,
                    addedNodes: mutation.addedNodes.length,
                    removedNodes: mutation.removedNodes.length,
                    timestamp: Date.now(),
                    source: 'dom-observer'
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
        });

        // Monitor runtime messages from background
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.inspector.logMessage({
                type: 'runtime-message-received',
                message: message,
                sender: sender,
                timestamp: Date.now(),
                source: 'chrome-runtime'
            });

            if (message.type === 'get-content-inspector-stats') {
                sendResponse(this.inspector.getStats());
            }
        });
    }

    // Send message to background with inspector logging
    sendMessageToBackground(message) {
        this.inspector.logMessage({
            type: 'message-to-background',
            message: message,
            timestamp: Date.now(),
            source: 'content-script'
        });

        return chrome.runtime.sendMessage(message);
    }
}

// Popup Script Integration (popup.js)
class PopupInspectorIntegration {
    constructor() {
        this.inspector = null;
        this.initializeInspector();
        this.setupPopupUI();
    }

    async initializeInspector() {
        // Request inspector data from background script
        this.backgroundStats = await this.requestBackgroundStats();
        this.setupInspectorUI();
    }

    async requestBackgroundStats() {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'get-inspector-stats' }, (response) => {
                resolve(response);
            });
        });
    }

    setupInspectorUI() {
        const container = document.getElementById('inspector-container');
        if (!container) return;

        container.innerHTML = `
            <div class="inspector-popup">
                <h3>Message Inspector Stats</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">Total Messages:</span>
                        <span class="stat-value">${this.backgroundStats?.totalMessages || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Errors:</span>
                        <span class="stat-value">${this.backgroundStats?.performance?.errorCount || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Avg Processing:</span>
                        <span class="stat-value">${Math.round(this.backgroundStats?.performance?.averageProcessingTime || 0)}ms</span>
                    </div>
                </div>
                <div class="inspector-actions">
                    <button id="exportBtn">Export Messages</button>
                    <button id="clearBtn">Clear Messages</button>
                    <button id="openDashboard">Open Dashboard</button>
                </div>
            </div>
        `;

        this.setupPopupEventListeners();
    }

    setupPopupEventListeners() {
        document.getElementById('exportBtn')?.addEventListener('click', () => {
            chrome.runtime.sendMessage({ type: 'export-messages', format: 'json' }, (response) => {
                this.downloadData(response.data, 'extension-messages.json');
            });
        });

        document.getElementById('clearBtn')?.addEventListener('click', () => {
            chrome.runtime.sendMessage({ type: 'clear-messages' });
        });

        document.getElementById('openDashboard')?.addEventListener('click', () => {
            chrome.tabs.create({
                url: chrome.runtime.getURL('scripts/message-inspector-dashboard.html')
            });
        });
    }

    downloadData(data, filename) {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    setupPopupUI() {
        // Additional popup UI setup
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeInspector();
        });
    }
}

// Initialize based on context
if (typeof chrome !== 'undefined' && chrome.runtime) {
    if (chrome.runtime.getBackgroundPage) {
        // Background script context
        const backgroundInspector = new ChromeExtensionInspectorIntegration();
        window.extensionInspector = backgroundInspector;
    } else if (window.location.protocol === 'chrome-extension:') {
        // Popup context
        const popupInspector = new PopupInspectorIntegration();
        window.extensionInspector = popupInspector;
    } else {
        // Content script context
        const contentInspector = new ContentScriptInspectorIntegration();
        window.extensionInspector = contentInspector;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ChromeExtensionInspectorIntegration,
        ContentScriptInspectorIntegration,
        PopupInspectorIntegration
    };
}
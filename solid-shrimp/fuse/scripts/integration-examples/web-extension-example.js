/**
 * WebExtensions API Integration Example
 * 
 * This example demonstrates how to integrate the Extension Message Inspector
 * with WebExtensions API for cross-browser compatibility (Firefox, Edge, etc.)
 * using the browser namespace instead of chrome.
 */

// Cross-browser compatibility helper
const browserAPI = (() => {
    if (typeof browser !== 'undefined') {
        return browser; // Firefox, Edge
    } else if (typeof chrome !== 'undefined') {
        return chrome; // Chrome, Chromium-based browsers
    }
    throw new Error('No browser extension API available');
})();

// Background Script Integration for WebExtensions
class WebExtensionInspectorIntegration {
    constructor() {
        this.inspector = null;
        this.browserAPI = browserAPI;
        this.initializeInspector();
        this.setupWebExtensionListeners();
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
            enablePerformanceMonitoring: true,
            customSources: ['webextension', 'firefox', 'edge']
        });

        // Add WebExtension specific patterns
        this.setupWebExtensionPatterns();
        
        // Start monitoring
        this.inspector.start();
        console.log('🔍 WebExtension Message Inspector initialized');
    }

    async loadInspectorScript() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = this.browserAPI.runtime.getURL('scripts/extension-message-inspector.js');
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    setupWebExtensionPatterns() {
        // Monitor browser-specific messages
        this.inspector.addPattern('browser-specific', /firefox|edge|webkit|gecko/, (message, patternName) => {
            console.log(`🌐 Browser-specific message detected:`, message);
            this.handleBrowserSpecificMessage(message);
        });

        // Monitor permissions requests
        this.inspector.addPattern('permissions', /permission|grant|request/, (message, patternName) => {
            console.log(`🔐 Permission message detected:`, message);
            this.handlePermissionMessage(message);
        });

        // Monitor web request events
        this.inspector.addPattern('web-requests', {
            type: 'web-request',
            method: /.*/
        }, (message, patternName) => {
            console.log(`🌍 Web request detected:`, message);
            this.handleWebRequestMessage(message);
        });

        // Monitor context menu interactions
        this.inspector.addPattern('context-menu', /contextmenu|menu|click/, (message, patternName) => {
            console.log(`📋 Context menu interaction:`, message);
            this.handleContextMenuMessage(message);
        });

        // Monitor bookmark operations
        this.inspector.addPattern('bookmarks', /bookmark|folder|create|remove/, (message, patternName) => {
            console.log(`🔖 Bookmark operation:`, message);
            this.handleBookmarkMessage(message);
        });
    }

    setupWebExtensionListeners() {
        // Monitor runtime messages (cross-browser)
        this.browserAPI.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
            this.inspector.logMessage({
                type: 'webextension-runtime-message',
                message: message,
                sender: sender,
                timestamp: Date.now(),
                source: 'webextension-runtime',
                browser: this.detectBrowser()
            });

            return this.handleRuntimeMessage(message, sender, sendResponse);
        });

        // Monitor tab events
        if (this.browserAPI.tabs) {
            this.browserAPI.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
                this.inspector.logMessage({
                    type: 'tab-updated',
                    tabId: tabId,
                    changeInfo: changeInfo,
                    url: tab.url,
                    title: tab.title,
                    timestamp: Date.now(),
                    source: 'webextension-tabs',
                    browser: this.detectBrowser()
                });
            });

            this.browserAPI.tabs.onActivated.addListener((activeInfo) => {
                this.inspector.logMessage({
                    type: 'tab-activated',
                    tabId: activeInfo.tabId,
                    windowId: activeInfo.windowId,
                    timestamp: Date.now(),
                    source: 'webextension-tabs'
                });
            });

            this.browserAPI.tabs.onCreated.addListener((tab) => {
                this.inspector.logMessage({
                    type: 'tab-created',
                    tabId: tab.id,
                    url: tab.url,
                    timestamp: Date.now(),
                    source: 'webextension-tabs'
                });
            });
        }

        // Monitor storage events
        if (this.browserAPI.storage) {
            this.browserAPI.storage.onChanged.addListener((changes, areaName) => {
                this.inspector.logMessage({
                    type: 'storage-changed',
                    changes: changes,
                    areaName: areaName,
                    timestamp: Date.now(),
                    source: 'webextension-storage'
                });
            });
        }

        // Monitor web request events (if permissions available)
        if (this.browserAPI.webRequest) {
            this.browserAPI.webRequest.onBeforeRequest.addListener(
                (details) => {
                    this.inspector.logMessage({
                        type: 'web-request-before',
                        url: details.url,
                        method: details.method,
                        tabId: details.tabId,
                        timestamp: Date.now(),
                        source: 'webextension-webrequest'
                    });
                },
                { urls: ['<all_urls>'] }
            );

            this.browserAPI.webRequest.onCompleted.addListener(
                (details) => {
                    this.inspector.logMessage({
                        type: 'web-request-completed',
                        url: details.url,
                        statusCode: details.statusCode,
                        tabId: details.tabId,
                        timestamp: Date.now(),
                        source: 'webextension-webrequest'
                    });
                },
                { urls: ['<all_urls>'] }
            );
        }

        // Monitor context menu events
        if (this.browserAPI.contextMenus) {
            this.browserAPI.contextMenus.onClicked.addListener((info, tab) => {
                this.inspector.logMessage({
                    type: 'context-menu-clicked',
                    menuItemId: info.menuItemId,
                    selectionText: info.selectionText,
                    pageUrl: info.pageUrl,
                    tabId: tab?.id,
                    timestamp: Date.now(),
                    source: 'webextension-contextmenu'
                });
            });
        }

        // Monitor bookmark events (if permissions available)
        if (this.browserAPI.bookmarks) {
            this.browserAPI.bookmarks.onCreated.addListener((id, bookmark) => {
                this.inspector.logMessage({
                    type: 'bookmark-created',
                    bookmarkId: id,
                    title: bookmark.title,
                    url: bookmark.url,
                    timestamp: Date.now(),
                    source: 'webextension-bookmarks'
                });
            });

            this.browserAPI.bookmarks.onRemoved.addListener((id, removeInfo) => {
                this.inspector.logMessage({
                    type: 'bookmark-removed',
                    bookmarkId: id,
                    parentId: removeInfo.parentId,
                    timestamp: Date.now(),
                    source: 'webextension-bookmarks'
                });
            });
        }

        // Monitor alarm events
        if (this.browserAPI.alarms) {
            this.browserAPI.alarms.onAlarm.addListener((alarm) => {
                this.inspector.logMessage({
                    type: 'alarm-triggered',
                    alarmName: alarm.name,
                    scheduledTime: alarm.scheduledTime,
                    timestamp: Date.now(),
                    source: 'webextension-alarms'
                });
            });
        }
    }

    detectBrowser() {
        if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.getBrowserInfo) {
            // Firefox
            return 'firefox';
        } else if (typeof chrome !== 'undefined' && chrome.runtime) {
            // Chrome or Chromium-based
            return navigator.userAgent.includes('Edg') ? 'edge' : 'chrome';
        }
        return 'unknown';
    }

    async handleRuntimeMessage(message, sender, sendResponse) {
        const browser = this.detectBrowser();
        
        switch (message.type) {
            case 'get-inspector-stats':
                const stats = this.inspector.getStats();
                stats.browser = browser;
                if (browser === 'firefox') {
                    return Promise.resolve(stats);
                } else {
                    sendResponse(stats);
                }
                break;
                
            case 'get-browser-info':
                const browserInfo = await this.getBrowserInfo();
                if (browser === 'firefox') {
                    return Promise.resolve(browserInfo);
                } else {
                    sendResponse(browserInfo);
                }
                break;
                
            case 'search-messages':
                const searchResults = this.inspector.search(message.query, {
                    limit: message.limit || 50,
                    source: message.source
                });
                if (browser === 'firefox') {
                    return Promise.resolve(searchResults);
                } else {
                    sendResponse(searchResults);
                }
                break;
                
            case 'export-messages':
                const exportData = this.inspector.exportMessages(message.format || 'json');
                if (browser === 'firefox') {
                    return Promise.resolve({ data: exportData });
                } else {
                    sendResponse({ data: exportData });
                }
                break;
                
            case 'test-browser-features':
                const features = await this.testBrowserFeatures();
                if (browser === 'firefox') {
                    return Promise.resolve(features);
                } else {
                    sendResponse(features);
                }
                break;
                
            default:
                this.inspector.logMessage({
                    type: 'unknown-runtime-message',
                    message: message,
                    sender: sender,
                    timestamp: Date.now(),
                    source: 'webextension-runtime',
                    level: 'warn'
                });
        }
        
        return true; // Keep message channel open for async response
    }

    async getBrowserInfo() {
        const browser = this.detectBrowser();
        const info = {
            browser: browser,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            timestamp: Date.now()
        };

        // Firefox-specific info
        if (browser === 'firefox' && this.browserAPI.runtime.getBrowserInfo) {
            try {
                const browserInfo = await this.browserAPI.runtime.getBrowserInfo();
                info.browserInfo = browserInfo;
            } catch (error) {
                info.browserInfoError = error.message;
            }
        }

        // Platform info
        if (this.browserAPI.runtime.getPlatformInfo) {
            try {
                const platformInfo = await this.browserAPI.runtime.getPlatformInfo();
                info.platformInfo = platformInfo;
            } catch (error) {
                info.platformInfoError = error.message;
            }
        }

        return info;
    }

    async testBrowserFeatures() {
        const features = {
            browser: this.detectBrowser(),
            timestamp: Date.now(),
            available: {},
            permissions: {}
        };

        // Test available APIs
        const apis = [
            'tabs', 'storage', 'webRequest', 'contextMenus', 'bookmarks',
            'alarms', 'notifications', 'cookies', 'history', 'downloads'
        ];

        apis.forEach(api => {
            features.available[api] = !!this.browserAPI[api];
        });

        // Test permissions (if available)
        if (this.browserAPI.permissions) {
            try {
                const permissions = await this.browserAPI.permissions.getAll();
                features.permissions = permissions;
            } catch (error) {
                features.permissionsError = error.message;
            }
        }

        return features;
    }

    handleBrowserSpecificMessage(message) {
        const browser = this.detectBrowser();
        this.inspector.logMessage({
            type: 'browser-specific-handled',
            browser: browser,
            originalMessage: message,
            timestamp: Date.now(),
            source: 'browser-handler'
        });
    }

    handlePermissionMessage(message) {
        this.inspector.logMessage({
            type: 'permission-handled',
            originalMessage: message,
            timestamp: Date.now(),
            source: 'permission-handler'
        });
    }

    handleWebRequestMessage(message) {
        this.inspector.logMessage({
            type: 'web-request-handled',
            originalMessage: message,
            timestamp: Date.now(),
            source: 'webrequest-handler'
        });
    }

    handleContextMenuMessage(message) {
        this.inspector.logMessage({
            type: 'context-menu-handled',
            originalMessage: message,
            timestamp: Date.now(),
            source: 'contextmenu-handler'
        });
    }

    handleBookmarkMessage(message) {
        this.inspector.logMessage({
            type: 'bookmark-handled',
            originalMessage: message,
            timestamp: Date.now(),
            source: 'bookmark-handler'
        });
    }

    // Public API
    getInspectorInstance() {
        return this.inspector;
    }

    async getStats() {
        const stats = this.inspector ? this.inspector.getStats() : null;
        if (stats) {
            stats.browser = this.detectBrowser();
            stats.browserInfo = await this.getBrowserInfo();
        }
        return stats;
    }

    exportData(format = 'json') {
        return this.inspector ? this.inspector.exportMessages(format) : null;
    }
}

// Content Script Integration for WebExtensions
class WebExtensionContentScriptIntegration {
    constructor() {
        this.inspector = null;
        this.browserAPI = browserAPI;
        this.initializeInspector();
        this.setupContentListeners();
    }

    async initializeInspector() {
        if (typeof ExtensionMessageInspector === 'undefined') {
            await this.loadInspectorScript();
        }

        this.inspector = new ExtensionMessageInspector({
            enableFiltering: true,
            logLevel: 'info',
            maxQueueSize: 1000,
            customSources: ['webextension-content']
        });

        this.setupContentPatterns();
        this.inspector.start();
        console.log('🔍 WebExtension Content Script Inspector initialized');
    }

    async loadInspectorScript() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = this.browserAPI.runtime.getURL('scripts/extension-message-inspector.js');
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    setupContentPatterns() {
        // Monitor page-specific events
        this.inspector.addPattern('page-events', /load|unload|beforeunload|resize/, (message) => {
            console.log('📄 Page event detected:', message);
        });

        // Monitor form interactions
        this.inspector.addPattern('form-interactions', /submit|input|change|focus|blur/, (message) => {
            console.log('📝 Form interaction:', message);
        });

        // Monitor AJAX/Fetch requests
        this.inspector.addPattern('network-requests', /fetch|xhr|ajax|request/, (message) => {
            console.log('🌐 Network request:', message);
        });
    }

    setupContentListeners() {
        // Monitor page messages
        window.addEventListener('message', (event) => {
            this.inspector.logMessage({
                type: 'page-message',
                message: event.data,
                origin: event.origin,
                source: 'webextension-page',
                timestamp: Date.now(),
                browser: this.detectBrowser()
            });
        });

        // Monitor runtime messages
        this.browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.inspector.logMessage({
                type: 'content-runtime-message',
                message: message,
                sender: sender,
                timestamp: Date.now(),
                source: 'webextension-runtime'
            });

            if (message.type === 'get-content-stats') {
                const stats = this.inspector.getStats();
                stats.browser = this.detectBrowser();
                
                if (this.detectBrowser() === 'firefox') {
                    return Promise.resolve(stats);
                } else {
                    sendResponse(stats);
                }
            }
        });

        // Monitor DOM events
        this.setupDOMEventListeners();
        
        // Monitor network requests (monkey patch)
        this.setupNetworkMonitoring();
    }

    setupDOMEventListeners() {
        const events = ['click', 'submit', 'input', 'change', 'focus', 'blur', 'scroll'];
        
        events.forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                this.inspector.logMessage({
                    type: 'dom-event',
                    eventType: eventType,
                    target: event.target.tagName,
                    targetId: event.target.id,
                    targetClass: event.target.className,
                    timestamp: Date.now(),
                    source: 'webextension-dom'
                });
            }, true);
        });
    }

    setupNetworkMonitoring() {
        // Monkey patch fetch
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = Date.now();
            const url = args[0];
            
            this.inspector.logMessage({
                type: 'fetch-request',
                url: url,
                startTime: startTime,
                timestamp: Date.now(),
                source: 'webextension-network'
            });

            try {
                const response = await originalFetch(...args);
                const endTime = Date.now();
                
                this.inspector.logMessage({
                    type: 'fetch-response',
                    url: url,
                    status: response.status,
                    statusText: response.statusText,
                    duration: endTime - startTime,
                    timestamp: endTime,
                    source: 'webextension-network'
                });

                return response;
            } catch (error) {
                this.inspector.logMessage({
                    type: 'fetch-error',
                    url: url,
                    error: error.message,
                    duration: Date.now() - startTime,
                    timestamp: Date.now(),
                    source: 'webextension-network',
                    level: 'error'
                });
                throw error;
            }
        };

        // Monkey patch XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            this._inspectorData = {
                method: method,
                url: url,
                startTime: Date.now()
            };
            return originalXHROpen.call(this, method, url, ...args);
        };

        XMLHttpRequest.prototype.send = function(...args) {
            if (this._inspectorData) {
                this.addEventListener('loadend', () => {
                    const endTime = Date.now();
                    this.inspector?.logMessage({
                        type: 'xhr-completed',
                        method: this._inspectorData.method,
                        url: this._inspectorData.url,
                        status: this.status,
                        statusText: this.statusText,
                        duration: endTime - this._inspectorData.startTime,
                        timestamp: endTime,
                        source: 'webextension-network'
                    });
                });
            }
            return originalXHRSend.call(this, ...args);
        };
    }

    detectBrowser() {
        if (typeof browser !== 'undefined') return 'firefox';
        if (typeof chrome !== 'undefined') {
            return navigator.userAgent.includes('Edg') ? 'edge' : 'chrome';
        }
        return 'unknown';
    }

    sendMessageToBackground(message) {
        this.inspector.logMessage({
            type: 'message-to-background',
            message: message,
            timestamp: Date.now(),
            source: 'webextension-content'
        });

        return this.browserAPI.runtime.sendMessage(message);
    }
}

// Initialize based on context and browser
if (typeof browserAPI !== 'undefined' && browserAPI.runtime) {
    try {
        if (browserAPI.runtime.getBackgroundPage || 
            (typeof window !== 'undefined' && window.location.protocol.includes('extension'))) {
            // Background script or extension page context
            const webExtensionInspector = new WebExtensionInspectorIntegration();
            window.extensionInspector = webExtensionInspector;
        } else {
            // Content script context
            const contentInspector = new WebExtensionContentScriptIntegration();
            window.extensionInspector = contentInspector;
        }
    } catch (error) {
        console.error('Failed to initialize WebExtension Inspector:', error);
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        WebExtensionInspectorIntegration,
        WebExtensionContentScriptIntegration
    };
}
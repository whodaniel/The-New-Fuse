"use strict";
// The New Fuse Chrome Extension - Background Script v2.0
// TypeScript source for background service worker
class TNFBackground {
    constructor() {
        this.relayUrl = 'ws://localhost:3001';
        this.socket = null;
        this.connected = false;
        this.elementMappings = new Map();
        this.activeSessions = new Map();
        this.initializationComplete = false;
        // Defer initialization until Chrome APIs are ready
        this.deferredInit();
    }
    async deferredInit() {
        // Wait for Chrome runtime to be fully available
        if (typeof chrome === 'undefined' || !chrome.runtime) {
            setTimeout(() => this.deferredInit(), 100);
            return;
        }
        try {
            await this.init();
        }
        catch (error) {
            console.error('Failed to initialize TNF Background:', error);
            // Retry initialization after delay
            setTimeout(() => this.deferredInit(), 1000);
        }
    }
    async init() {
        console.log('🚀 TNF Background script initializing...');
        // Set up event listeners with error handling
        this.setupEventListeners();
        // Try to connect to relay
        this.connectToRelay();
        // Set up keep-alive mechanism
        this.setupKeepAlive();
        this.initializationComplete = true;
        console.log('✅ TNF Background script initialized');
    }
    setupEventListeners() {
        try {
            // Handle extension startup
            if (chrome.runtime?.onStartup) {
                chrome.runtime.onStartup.addListener(() => {
                    console.log('Extension startup');
                    this.connectToRelay();
                });
            }
            // Handle extension install
            if (chrome.runtime?.onInstalled) {
                chrome.runtime.onInstalled.addListener((details) => {
                    console.log('Extension installed/updated:', details.reason);
                    this.createContextMenus();
                });
            }
            // Handle messages from popup and content scripts
            if (chrome.runtime?.onMessage) {
                chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                    this.handleMessage(message, sender, sendResponse);
                    return true; // Keep message channel open for async response
                });
            }
            // Handle tab updates
            if (chrome.tabs?.onUpdated) {
                chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
                    if (changeInfo.status === 'complete' && tab.url) {
                        this.handleTabUpdate(tabId, tab);
                    }
                });
            }
            // Handle tab activation
            if (chrome.tabs?.onActivated) {
                chrome.tabs.onActivated.addListener((activeInfo) => {
                    this.handleTabActivated(activeInfo);
                });
            }
            // Handle commands (keyboard shortcuts)
            if (chrome.commands?.onCommand) {
                chrome.commands.onCommand.addListener((command) => {
                    this.handleCommand(command);
                });
            }
        }
        catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }
    setupKeepAlive() {
        try {
            // Only set up alarms if the API is available
            if (chrome.alarms?.create) {
                // Clear any existing alarms first
                chrome.alarms.clear('tnf-keep-alive', () => {
                    // Create new keep-alive alarm
                    chrome.alarms.create('tnf-keep-alive', { periodInMinutes: 1 });
                    console.log('Keep-alive alarm created');
                });
                // Set up alarm listener
                if (chrome.alarms.onAlarm) {
                    chrome.alarms.onAlarm.addListener((alarm) => {
                        if (alarm.name === 'tnf-keep-alive') {
                            console.log('Keep-alive alarm triggered');
                            // Ping relay to maintain connection
                            if (this.connected && this.socket) {
                                this.socket.send(JSON.stringify({ type: 'PING' }));
                            }
                        }
                    });
                }
            }
            else {
                console.log('Chrome alarms API not available, using setInterval');
                // Fallback to setInterval
                setInterval(() => {
                    if (this.connected && this.socket) {
                        this.socket.send(JSON.stringify({ type: 'PING' }));
                    }
                }, 60000); // 1 minute
            }
        }
        catch (error) {
            console.error('Error setting up keep-alive:', error);
        }
    }
    createContextMenus() {
        try {
            if (!chrome.contextMenus) {
                console.log('Context menus API not available');
                return;
            }
            chrome.contextMenus.removeAll(() => {
                chrome.contextMenus.create({
                    id: 'tnf-auto-detect',
                    title: 'Auto-Detect Chat Elements',
                    contexts: ['page']
                });
                chrome.contextMenus.create({
                    id: 'tnf-manual-select',
                    title: 'Manual Element Selection',
                    contexts: ['page']
                });
                chrome.contextMenus.create({
                    id: 'tnf-start-session',
                    title: 'Start AI Session',
                    contexts: ['page']
                });
            });
            chrome.contextMenus.onClicked.addListener((info, tab) => {
                this.handleContextMenuClick(info, tab);
            });
        }
        catch (error) {
            console.error('Error creating context menus:', error);
        }
    }
    connectToRelay() {
        // First check if relay is available via HTTP
        this.checkRelayAvailability().then(available => {
            if (available) {
                this.initWebSocketConnection();
            }
            else {
                console.log('TNF Relay not available, will retry in 10 seconds');
                setTimeout(() => this.connectToRelay(), 10000);
            }
        });
    }
    async checkRelayAvailability() {
        try {
            const response = await fetch('http://localhost:3000/status', {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            });
            if (response.ok) {
                const status = await response.json();
                console.log('TNF Relay is available:', status.relayId);
                return true;
            }
            return false;
        }
        catch (error) {
            console.log('TNF Relay not available:', error);
            return false;
        }
    }
    initWebSocketConnection() {
        try {
            this.socket = new WebSocket(this.relayUrl);
            this.socket.onopen = () => {
                console.log('✅ Connected to TNF Relay WebSocket');
                this.connected = true;
                this.registerWithRelay();
            };
            this.socket.onmessage = (event) => {
                this.handleRelayMessage(JSON.parse(event.data));
            };
            this.socket.onclose = () => {
                console.log('❌ Disconnected from TNF Relay');
                this.connected = false;
                // Attempt to reconnect after 5 seconds
                setTimeout(() => this.connectToRelay(), 5000);
            };
            this.socket.onerror = (error) => {
                console.error('❌ TNF Relay WebSocket error:', error);
                this.connected = false;
            };
        }
        catch (error) {
            console.error('Failed to create WebSocket connection:', error);
        }
    }
    registerWithRelay() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'REGISTER',
                payload: {
                    type: 'chrome_extension',
                    capabilities: [
                        'element_selection',
                        'ai_automation',
                        'page_analysis',
                        'session_management'
                    ],
                    version: '2.0'
                }
            }));
        }
    }
    handleRelayMessage(message) {
        console.log('Received relay message:', message);
        switch (message.type) {
            case 'WELCOME':
                console.log('Welcomed by relay:', message.relayInfo);
                break;
            case 'REGISTRATION_CONFIRMED':
                console.log('✅ TNF Extension Connected to Relay successfully!');
                break;
            case 'AI_AUTOMATION_REQUEST':
                this.handleAIAutomationRequest(message);
                break;
            case 'ELEMENT_INTERACTION_REQUEST':
                this.handleElementInteractionRequest(message);
                break;
            case 'PAGE_ANALYSIS_REQUEST':
                this.handlePageAnalysisRequest(message);
                break;
            default:
                console.log('Unhandled relay message type:', message.type);
        }
    }
    async handleMessage(message, sender, sendResponse) {
        console.log('Handling message:', message.type);
        try {
            switch (message.type) {
                case 'GET_RELAY_STATUS':
                    sendResponse({
                        connected: this.connected,
                        relayUrl: this.relayUrl
                    });
                    break;
                case 'SAVE_MANUAL_MAPPING':
                    await this.saveElementMapping(sender.tab, message.mapping);
                    sendResponse({ success: true });
                    break;
                case 'GET_ELEMENT_MAPPING':
                    const mapping = await this.getElementMapping(sender.tab.url);
                    sendResponse({ mapping });
                    break;
                case 'START_AI_SESSION':
                    const sessionResult = await this.startAISession(sender.tab, message.mapping);
                    sendResponse(sessionResult);
                    break;
                case 'STOP_AI_SESSION':
                    const stopResult = await this.stopAISession(sender.tab.id);
                    sendResponse(stopResult);
                    break;
                default:
                    console.log('Unhandled message type:', message.type);
                    sendResponse({ error: 'Unknown message type' });
            }
        }
        catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
    }
    async handleTabUpdate(tabId, tab) {
        if (this.connected && this.socket) {
            this.socket.send(JSON.stringify({
                type: 'PAGE_CHANGED',
                payload: {
                    tabId: tabId,
                    url: tab.url,
                    title: tab.title
                }
            }));
        }
        // Check if we have a mapping for this URL
        if (tab.url) {
            const mapping = await this.getElementMapping(tab.url);
            if (mapping) {
                console.log('Found existing mapping for:', tab.url);
            }
        }
    }
    async handleTabActivated(activeInfo) {
        try {
            const tab = await chrome.tabs.get(activeInfo.tabId);
            if (this.connected && this.socket) {
                this.socket.send(JSON.stringify({
                    type: 'TAB_ACTIVATED',
                    payload: {
                        tabId: activeInfo.tabId,
                        url: tab.url,
                        title: tab.title
                    }
                }));
            }
        }
        catch (error) {
            console.error('Error handling tab activation:', error);
        }
    }
    async handleCommand(command) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            switch (command) {
                case 'toggle-element-selection':
                    this.triggerElementSelection(tab);
                    break;
                case 'auto-detect-elements':
                    this.triggerAutoDetection(tab);
                    break;
                case 'start-ai-session':
                    this.triggerAISession(tab);
                    break;
            }
        }
        catch (error) {
            console.error('Error handling command:', error);
        }
    }
    async handleContextMenuClick(info, tab) {
        if (!tab)
            return;
        switch (info.menuItemId) {
            case 'tnf-auto-detect':
                this.triggerAutoDetection(tab);
                break;
            case 'tnf-manual-select':
                this.triggerElementSelection(tab);
                break;
            case 'tnf-start-session':
                this.triggerAISession(tab);
                break;
        }
    }
    async triggerAutoDetection(tab) {
        try {
            if (!tab.id)
                return;
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    window.postMessage({
                        type: 'TNF_AUTO_DETECT',
                        source: 'tnf_extension'
                    }, '*');
                }
            });
        }
        catch (error) {
            console.error('Failed to trigger auto-detection:', error);
        }
    }
    async triggerElementSelection(tab) {
        try {
            if (!tab.id)
                return;
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    window.postMessage({
                        type: 'TNF_MANUAL_SELECT',
                        source: 'tnf_extension'
                    }, '*');
                }
            });
        }
        catch (error) {
            console.error('Failed to trigger element selection:', error);
        }
    }
    async triggerAISession(tab) {
        if (!tab.url)
            return;
        const mapping = await this.getElementMapping(tab.url);
        if (mapping) {
            await this.startAISession(tab, mapping);
        }
        else {
            console.log('⚠️ No element mapping available. Please detect elements first.');
        }
    }
    async saveElementMapping(tab, mapping) {
        try {
            if (!tab.url)
                return;
            const domain = new URL(tab.url).hostname;
            const mappingData = {
                domain: domain,
                url: tab.url,
                mapping: mapping,
                timestamp: Date.now()
            };
            // Save to Chrome storage
            await chrome.storage.local.set({
                [`mapping_${domain}`]: mappingData
            });
            // Cache in memory
            this.elementMappings.set(domain, mappingData);
            // Notify relay
            if (this.connected && this.socket && tab.id) {
                this.socket.send(JSON.stringify({
                    type: 'ELEMENT_MAPPING_UPDATE',
                    payload: {
                        tabId: tab.id,
                        mapping: mappingData
                    }
                }));
            }
            console.log('Element mapping saved for:', domain);
        }
        catch (error) {
            console.error('Failed to save element mapping:', error);
        }
    }
    async getElementMapping(url) {
        try {
            const domain = new URL(url).hostname;
            // Check memory cache first
            if (this.elementMappings.has(domain)) {
                return this.elementMappings.get(domain);
            }
            // Check Chrome storage
            const result = await chrome.storage.local.get([`mapping_${domain}`]);
            const mappingData = result[`mapping_${domain}`];
            if (mappingData) {
                // Cache in memory
                this.elementMappings.set(domain, mappingData);
                return mappingData;
            }
            return null;
        }
        catch (error) {
            console.error('Failed to get element mapping:', error);
            return null;
        }
    }
    async startAISession(tab, mapping) {
        try {
            if (!tab.id || !tab.url)
                return { success: false, error: 'Invalid tab' };
            const sessionId = `session_${tab.id}_${Date.now()}`;
            const sessionData = {
                id: sessionId,
                tabId: tab.id,
                url: tab.url,
                mapping: mapping,
                startedAt: Date.now(),
                active: true
            };
            this.activeSessions.set(sessionId, sessionData);
            // Notify relay
            if (this.connected && this.socket) {
                this.socket.send(JSON.stringify({
                    type: 'SESSION_CONTROL',
                    payload: {
                        command: 'start',
                        sessionId: sessionId,
                        parameters: {
                            tabId: tab.id,
                            mapping: mapping
                        }
                    }
                }));
            }
            console.log('✅ AI session started successfully:', sessionId);
            return { success: true, sessionId };
        }
        catch (error) {
            console.error('Failed to start AI session:', error);
            return { success: false, error: error.message };
        }
    }
    async stopAISession(tabId) {
        try {
            // Find session for this tab
            const session = Array.from(this.activeSessions.values())
                .find((s) => s.tabId === tabId && s.active);
            if (session) {
                session.active = false;
                session.endedAt = Date.now();
                // Notify relay
                if (this.connected && this.socket) {
                    this.socket.send(JSON.stringify({
                        type: 'SESSION_CONTROL',
                        payload: {
                            command: 'stop',
                            sessionId: session.id
                        }
                    }));
                }
                console.log('✅ AI session stopped successfully');
                return { success: true };
            }
            else {
                return { success: false, error: 'No active session found' };
            }
        }
        catch (error) {
            console.error('Failed to stop AI session:', error);
            return { success: false, error: error.message };
        }
    }
    async handleAIAutomationRequest(message) {
        const { payload } = message;
        try {
            // Find the appropriate tab and session
            const session = this.activeSessions.get(payload.sessionId);
            if (!session || !session.active) {
                console.error('No active session found for automation request');
                return;
            }
            // Execute automation on the tab
            await chrome.scripting.executeScript({
                target: { tabId: session.tabId },
                args: [payload],
                func: (automationPayload) => {
                    // Handle different automation types
                    switch (automationPayload.action) {
                        case 'type_message':
                            console.log('Type message automation:', automationPayload.text);
                            break;
                        case 'click_button':
                            console.log('Click button automation');
                            break;
                        case 'read_output':
                            console.log('Read output automation');
                            break;
                    }
                }
            });
        }
        catch (error) {
            console.error('AI automation request failed:', error);
        }
    }
    async handleElementInteractionRequest(message) {
        const { payload } = message;
        console.log('Element interaction request:', payload);
    }
    async handlePageAnalysisRequest(message) {
        const { payload } = message;
        console.log('Page analysis request:', payload);
    }
}
// Initialize background script with proper error handling
try {
    new TNFBackground();
    console.log('TNF Background script loaded successfully');
}
catch (error) {
    console.error('Failed to initialize TNF Background script:', error);
}
//# sourceMappingURL=background.js.map
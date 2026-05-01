/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./src/v6/shared/constants.ts
/**
 * Gemini Bridge v7 - Constants and Configuration
 *
 * Note: This extension is designed to work alongside Fuse Connect
 * without conflict. All storage keys use 'gemini_bridge_' prefix.
 */
// ============================================
// EXTENSION METADATA
// ============================================
const EXTENSION_NAME = 'Gemini Bridge';
const EXTENSION_VERSION = '7.2.0';
const EXTENSION_ID = 'gemini-bridge-v7';
// ============================================
// NODE ENDPOINTS
// ============================================
const DEFAULT_NODES = {
    relay: 'ws://localhost:3000/ws',
    apiGateway: 'http://localhost:8080',
    backend: 'http://localhost:3001',
    saas: 'http://localhost:3002',
    // Cloudflare TNF agent orchestration (canonical edge state)
    tnfWorker: 'https://tnf-agent-orchestration.bizsynth.workers.dev',
};
// ============================================
// CHAT DETECTION CONFIG
// ============================================
const DEFAULT_CHAT_DETECTION = {
    inputSelectors: [
        // Contenteditable (modern AI UIs)
        'div[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"][data-placeholder]',
        'div.ProseMirror[contenteditable="true"]',
        'div[contenteditable="true"]',
        // Textareas
        'textarea[placeholder*="message" i]',
        'textarea[placeholder*="ask" i]',
        'textarea[placeholder*="type" i]',
        'textarea[data-testid*="input" i]',
        'textarea#prompt-textarea',
        'form textarea',
        'textarea',
    ],
    contentEditableCheck: true,
    textareaCheck: true,
    sendButtonSelectors: [
        'button[data-testid*="send" i]',
        'button[aria-label*="send" i]',
        'button[type="submit"]',
        'button.send-button',
        'form button:last-of-type',
    ],
    buttonTextPatterns: [/send/i, /submit/i, /ask/i, /→/, /➤/, /▶/],
    ariaLabelPatterns: [/send/i, /submit/i],
    messageContainerSelectors: [
        'div[class*="message-list"]',
        'div[class*="conversation"]',
        'main div[class*="scroll"]',
        'div[role="log"]',
    ],
    streamingIndicatorSelectors: [
        'div[data-is-streaming="true"]',
        'div[class*="streaming"]',
        '.generating',
    ],
    retryInterval: 500,
    maxRetries: 20,
    inputDebounce: 100,
};
// ============================================
// NOTIFICATION DEFAULTS
// ============================================
const DEFAULT_NOTIFICATIONS = {
    enabled: true,
    sound: false,
    desktop: true,
    badge: true,
    showMessages: true,
    showAgentEvents: true,
    showSystemEvents: false,
    muteChannels: [],
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
};
// ============================================
// DEFAULT SETTINGS
// ============================================
const DEFAULT_SETTINGS = {
    nodes: {
        endpoints: DEFAULT_NODES,
        autoDiscover: true,
        healthCheckInterval: 30000,
    },
    autoConnect: true,
    chatDetection: DEFAULT_CHAT_DETECTION,
    autoInject: true,
    panel: {
        defaultPosition: { x: 20, y: 20 },
        defaultSize: { width: 360, height: 480 },
        defaultMode: 'collapsed',
        opacity: 1,
        theme: 'neon',
    },
    notifications: DEFAULT_NOTIFICATIONS,
    federation: {
        autoJoinChannels: ['general'],
        defaultChannel: 'general',
    },
    debug: {
        enabled: false,
        logLevel: 'warn',
        logToConsole: true,
        logToStorage: false,
        recordNetworkTraffic: false,
    },
    shortcuts: {
        togglePanel: 'Ctrl+Shift+G',
        quickMessage: 'Ctrl+Shift+M',
        focusInput: 'Ctrl+Shift+I',
    },
};
// ============================================
// STORAGE KEYS
// ============================================
// IMPORTANT: These keys use 'gemini_bridge_' prefix to avoid
// conflicts with Fuse Connect extension storage
const STORAGE_KEYS = {
    settings: 'gemini_bridge_settings',
    agentId: 'gemini_bridge_agent_id',
    panelState: 'gemini_bridge_panel_state',
    channels: 'gemini_bridge_channels',
    joinedChannels: 'gemini_bridge_joined_channels',
    notifications: 'gemini_bridge_notifications',
    knownNodes: 'gemini_bridge_known_nodes',
    recentMessages: 'gemini_bridge_recent_messages',
};
// ============================================
// UI CONSTANTS
// ============================================
const PANEL_DIMENSIONS = {
    minWidth: 300,
    minHeight: 200,
    maxWidth: 600,
    maxHeight: 800,
    collapsedHeight: 48,
    defaultWidth: 360,
    defaultHeight: 480,
};
const Z_INDEX = {
    panel: 2147483647,
    overlay: 2147483646,
    notification: 2147483645,
};
// ============================================
// TIMING CONSTANTS
// ============================================
const TIMINGS = {
    debounceDelay: 300,
    retryInterval: 1000,
    heartbeatInterval: 30000,
    healthCheckInterval: 10000,
    reconnectBaseDelay: 1000,
    reconnectMaxDelay: 30000,
    messageDedupWindow: 5000,
};

;// ./src/v6/content/utils/TnfTranscriptClient.ts
/**
 * TNF Transcript Client (Cloudflare DO)
 *
 * Reads/writes canonical transcript entries stored at the edge.
 */
class TnfTranscriptClient {
    constructor(workerUrl, sessionKey) {
        this.workerUrl = workerUrl;
        this.sessionKey = sessionKey;
    }
    async latest(limit = 50) {
        const url = `${this.workerUrl}/transcript/latest?sessionKey=${encodeURIComponent(this.sessionKey)}&limit=${limit}`;
        const res = await fetch(url, { method: 'GET' });
        if (!res.ok)
            throw new Error(`transcript.latest failed: ${res.status}`);
        const data = await res.json();
        return { lastSeq: data.lastSeq || 0, entries: data.entries || [] };
    }
    async since(afterSeq, limit = 200) {
        const url = `${this.workerUrl}/transcript/since?sessionKey=${encodeURIComponent(this.sessionKey)}&afterSeq=${afterSeq}&limit=${limit}`;
        const res = await fetch(url, { method: 'GET' });
        if (!res.ok)
            throw new Error(`transcript.since failed: ${res.status}`);
        const data = await res.json();
        return { lastSeq: data.lastSeq || 0, entries: data.entries || [] };
    }
    async append(entries) {
        const url = `${this.workerUrl}/transcript/append?sessionKey=${encodeURIComponent(this.sessionKey)}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Session-Key': this.sessionKey },
            body: JSON.stringify({ entries }),
        });
        if (!res.ok)
            throw new Error(`transcript.append failed: ${res.status}`);
        const data = await res.json();
        return { lastSeq: data.lastSeq || 0, added: data.added || [] };
    }
}

;// ./src/v6/content/adapters/SimpleChatBridge.ts
/**
 * Fuse Connect v7 - Simple Chat Bridge
 *
 * NOTE: This file still contains legacy v5 comments, but it is used by the current extension build.
 *
 * Cloudflare upgrade (2026-02): when a target UI is unreliable (e.g. OpenClaw cloud
 * transcript rendering issues), we can use the TNF Agent Orchestration worker as a
 * canonical transcript store and poll it from the content script.
 */


class SimpleChatBridge {
    constructor() {
        this.lastResponseText = '';
        this.responseObserver = null;
        this.callbacks = {};
        this.isWaitingForResponse = false;
        this.responseCheckInterval = null;
        this.responseTimeoutTimer = null;
        this._sendingGuard = false; // Safety guard for UI lag between click and streaming state
        // TNF Transcript polling (Cloudflare DO)
        this.transcriptClient = null;
        this.transcriptPollTimer = null;
        this.transcriptLastSeq = 0;
        // ORCHESTRATOR IMPROVEMENT: Element caching to reduce DOM scanning
        this.cachedElements = null;
        this.cacheValidUntil = 0;
        this.CACHE_DURATION = 10000; // 10 seconds
        this.lastSentText = '';
        // Supported AI chat platforms for element detection logging
        // NOTE: Only include actual AI chat interfaces - thenewfuse.com is NOT a chat interface
        this.SUPPORTED_CHAT_PLATFORMS = [
            'gemini.google.com',
            'bard.google.com',
            'chatgpt.com',
            'chat.openai.com',
            'claude.ai',
            'perplexity.ai',
            'poe.com',
            'aistudio.google.com',
            'openclaw-cloud-production-934c.up.railway.app', // OpenClaw cloud control UI
            'localhost:3000', // Local dev with chat
            'localhost:3000', // Local dev with chat
            'localhost:3001', // Local backend
        ];
        this.customSites = [];
    }
    /**
     * Guard against matching Fuse extension UI elements while scanning the page.
     * We only want host-page chat inputs/buttons, not our own floating panel controls.
     */
    isExtensionUiElement(el) {
        if (!el)
            return false;
        return !!el.closest([
            '#fuse-connect-panel-v7',
            '#fuse-connect-panel',
            '#fuse-panel-minimized',
            '[data-testid="fuse-connect-panel"]',
            '[data-testid="fuse-panel-content"]',
            '.fcp6-panel',
            '.fcp6-input-row',
        ].join(', '));
    }
    /**
     * Check if current page is a supported chat platform
     * Used to suppress noisy logging on non-chat sites
     */
    isSupportedPlatform() {
        return true; // Gemini Bridge extension supports all platforms it is injected into
    }
    /**
     * Initialize the bridge with callbacks
     */
    init(callbacks) {
        this.callbacks = callbacks;
        // Suppress initialization log unless explicitly debugging or first time
        if (window.__FUSE_DEBUG_SELECTORS) {
            console.log('[SimpleChatBridge] Initialized');
        }
        // Load custom sites from storage
        this.loadCustomSites();
        // Always enable transcript polling on OpenClaw cloud UI (DOM rendering is currently unreliable there).
        // This will power the TNF injectable modal with canonical state from Cloudflare.
        try {
            const host = window.location.hostname.toLowerCase();
            if (host.includes('openclaw-cloud') || host.endsWith('up.railway.app')) {
                const workerUrl = DEFAULT_NODES.tnfWorker;
                const sessionKey = this.deriveSessionKey();
                this.enableTranscriptPolling(workerUrl, sessionKey);
            }
        }
        catch (e) {
            // non-fatal
        }
    }
    /**
     * Load custom allowed sites from storage
     */
    loadCustomSites() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['gemini_bridge_settings'], (result) => {
                if (result.fuse_settings && result.fuse_settings.allowedSites) {
                    this.customSites = result.fuse_settings.allowedSites;
                    if (window.__FUSE_DEBUG_SELECTORS) {
                        console.log('[SimpleChatBridge] Loaded custom sites:', this.customSites);
                    }
                }
            });
        }
    }
    /**
     * Derive a stable sessionKey for Cloudflare transcript storage.
     * Best effort: host + OpenClaw session query param (if present).
     */
    deriveSessionKey() {
        const host = window.location.hostname.toLowerCase();
        const url = new URL(window.location.href);
        const session = url.searchParams.get('session') || 'main';
        return `openclaw-ui:${host}:session:${session}`;
    }
    enableTranscriptPolling(workerUrl, sessionKey) {
        // Avoid double-start
        if (this.transcriptPollTimer)
            return;
        this.transcriptClient = new TnfTranscriptClient(workerUrl, sessionKey);
        const poll = async () => {
            if (!this.transcriptClient)
                return;
            try {
                // First pull: load latest and set cursor.
                if (this.transcriptLastSeq === 0) {
                    const { lastSeq, entries } = await this.transcriptClient.latest(50);
                    this.transcriptLastSeq = lastSeq || 0;
                    for (const e of entries) {
                        this.callbacks.onTranscriptEntry?.({
                            role: e.role,
                            content: e.content,
                            ts: e.ts,
                            seq: e.seq,
                            id: e.id,
                        });
                        // CRITICAL FIX: Polled transcript entries from Cloudflare are for DISPLAY ONLY.
                        // We must NEVER call onResponse() here, because onResponse() triggers the "Response Complete"
                        // flow which broadcasts back to the relay, creating an infinite loop.
                        // Scraped responses from the actual page DOM are still handled by the MutationObserver.
                    }
                    return;
                }
                const { lastSeq, entries } = await this.transcriptClient.since(this.transcriptLastSeq, 200);
                for (const e of entries) {
                    this.transcriptLastSeq = Math.max(this.transcriptLastSeq, e.seq || this.transcriptLastSeq);
                    this.callbacks.onTranscriptEntry?.({
                        role: e.role,
                        content: e.content,
                        ts: e.ts,
                        seq: e.seq,
                        id: e.id,
                    });
                    // CRITICAL FIX: Same as above. Polled entries are for UI rendering only.
                }
                this.transcriptLastSeq = Math.max(this.transcriptLastSeq, lastSeq || 0);
            }
            catch (err) {
                this.callbacks.onError?.(String(err?.message || err));
            }
        };
        // Kick off now, then poll.
        poll();
        this.transcriptPollTimer = window.setInterval(poll, 1500);
    }
    /**
     * Find chat elements on the page - Enhanced with platform-specific selectors
     * ORCHESTRATOR IMPROVEMENT: Added caching to reduce DOM scanning overhead
     */
    findElements() {
        // Check cache first
        const now = Date.now();
        if (this.cachedElements?.isReady && now < this.cacheValidUntil) {
            return this.cachedElements;
        }
        // Enable debug mode via console: window.__FUSE_DEBUG_SELECTORS = true
        const DEBUG = window.__FUSE_DEBUG_SELECTORS || false;
        // IMPORTANT: Always attempt generic detection, including unknown sites.
        // We only use support status to tune logging verbosity, not to disable detection.
        const isSupportedSite = this.isSupportedPlatform();
        const hostname = window.location.hostname.toLowerCase();
        const isQwenHost = hostname === 'chat.qwen.ai' || hostname.endsWith('.qwen.ai');
        // Platform-specific selectors (most reliable first)
        const inputSelectors = [
            // Qwen-specific (activate when on qwen host)
            ...(isQwenHost
                ? [
                    'textarea[data-testid*="chat" i]',
                    'textarea[data-testid*="input" i]',
                    'textarea[data-testid*="compose" i]',
                    'textarea[data-testid*="prompt" i]',
                    'textarea[placeholder*="Send" i]',
                    'textarea[placeholder*="message" i]',
                    'textarea[aria-label*="chat" i]',
                    'textarea[aria-label*="message" i]',
                    'form textarea',
                    'main textarea',
                    'textarea',
                    'div[contenteditable="true"][role="textbox"]',
                    'div[contenteditable="true"][data-testid*="input" i]',
                    'div[role="textbox"][contenteditable="true"]',
                ]
                : []),
            // The New Fuse (Custom App) - High Priority
            'input[placeholder="Type a message..."]',
            'input[placeholder="Type a message..."][type="text"]',
            // OpenClaw Chat UI
            '.chat-compose textarea',
            'textarea[placeholder*="Message" i]',
            'textarea[placeholder*="start chatting" i]',
            // Perplexity (New 2025)
            'textarea[placeholder*="Ask" i]',
            'textarea[placeholder*="follow-up" i]',
            'div[class*="search-bar-input"] textarea',
            // Gemini 2025+ patterns (highest priority - latest interface)
            'side-panel-chat textarea',
            'side-panel-chat [contenteditable="true"]',
            'gemini-sidebar-input textarea',
            '#gemini-chat-input',
            'rich-textarea p[contenteditable="true"]',
            'rich-textarea p[data-placeholder]',
            'rich-textarea div[contenteditable="true"]',
            'rich-textarea [contenteditable="true"]',
            // Gemini-specific (high priority) - EXPANDED for 2024+ Gemini updates
            '.ql-editor.textarea[contenteditable="true"]',
            'rich-textarea .ql-editor[contenteditable="true"]',
            'div.ql-editor.textarea',
            'div.ql-editor[contenteditable="true"]',
            // Gemini 2024+ patterns
            'textarea.ql-editor[contenteditable="true"]',
            '[data-placeholder*="Ask Gemini" i][contenteditable="true"]',
            '[data-placeholder*="Enter a prompt" i][contenteditable="true"]',
            'div[aria-label*="Enter a prompt" i][contenteditable="true"]',
            'div[aria-label*="Type your message" i][contenteditable="true"]',
            // Gemini with data attributes
            'div[contenteditable="true"][data-placeholder*="Enter"]',
            'div[contenteditable="true"][aria-label*="prompt" i]',
            'p[contenteditable="true"][data-placeholder]',
            // ChatGPT-specific
            '#prompt-textarea',
            'textarea[data-id="root"]',
            'textarea[placeholder*="Message" i]',
            // Claude-specific
            'div[contenteditable="true"][aria-label*="Message" i]',
            // Generic fallbacks
            'div[contenteditable="true"][role="textbox"]',
            'p[contenteditable="true"]',
            'div[contenteditable="true"][data-placeholder]',
            'div[contenteditable="true"]:not([role="button"])',
            'textarea[placeholder*="Ask" i]',
            'form textarea',
            'main textarea',
            'textarea',
            // Ultra-broad fallback (use with caution)
            'textarea[contenteditable="true"]',
            'div.textarea[contenteditable="true"]',
        ];
        const sendButtonSelectors = [
            // Qwen-specific (activate when on qwen host)
            ...(isQwenHost
                ? [
                    'button[data-testid*="send" i]',
                    'button[aria-label*="Send" i]',
                    'button[title*="Send" i]',
                    'form button[type="submit"]',
                ]
                : []),
            // The New Fuse (Custom App) - High Priority
            'button:has(svg path[d="M5 12h14M12 5l7 7-7 7"])', // Exact path match
            'button:has(svg[stroke="currentColor"])', // Generic SVG button match for our app
            // OpenClaw Chat UI
            '.chat-compose button.primary',
            '.chat-compose .btn.primary',
            '.chat-compose button[type="submit"]',
            // Perplexity (New 2025)
            'button[aria-label="Submit"]',
            'button[aria-label="Send"]',
            'div[class*="search-bar"] button:not([disabled])',
            // Gemini-specific - EXPANDED
            'button[aria-label*="Send" i]',
            'button[aria-label*="submit" i]',
            'button[data-testid*="send" i]',
            'button.send-button-container button',
            'button[aria-label*="Send message" i]',
            'button[title*="Send" i]',
            // Look for SVG send icons
            'button:has(svg[aria-label*="Send" i])',
            'button:has(path[d*="M2.01"])', // Common send icon path
            // ChatGPT-specific
            'button[data-testid="send-button"]',
            // Generic
            'button.send-button',
            'button[type="submit"]',
            // Fallback: buttons near textarea
            'form button[type="submit"]',
        ];
        if (DEBUG) {
            console.log('[SimpleChatBridge DEBUG] Starting element search...');
            const allContentEditable = Array.from(document.querySelectorAll('[contenteditable="true"]'));
            const allButtons = Array.from(document.querySelectorAll('button[aria-label]'));
            console.log('[SimpleChatBridge DEBUG] All contenteditable elements:', allContentEditable.length);
            allContentEditable.forEach((el, i) => {
                console.log(`  [${i}]`, {
                    tag: el.tagName,
                    classes: el.className,
                    ariaLabel: el.getAttribute('aria-label'),
                    placeholder: el.getAttribute('data-placeholder'),
                    parent: el.parentElement?.tagName,
                    parentClass: el.parentElement?.className,
                    visible: this.isVisible(el),
                });
            });
            console.log('[SimpleChatBridge DEBUG] All buttons with aria-label:', allButtons.length);
            allButtons.forEach((el, i) => {
                console.log(`  [${i}]`, {
                    ariaLabel: el.getAttribute('aria-label'),
                    title: el.getAttribute('title'),
                    visible: this.isVisible(el),
                });
            });
        }
        // Try each input selector - first pass with visibility, second pass without
        let input = null;
        // First try: visible elements only
        for (const selector of inputSelectors) {
            try {
                const candidates = this.queryAllIncludingShadow(selector);
                for (const el of candidates) {
                    if (this.isExtensionUiElement(el))
                        continue;
                    if (this.isVisible(el)) {
                        input = el;
                        break;
                    }
                }
                if (input)
                    break;
            }
            catch (e) {
                // Invalid selector, skip
            }
        }
        // Fallback: any matching element (visibility check may have failed)
        if (!input) {
            for (const selector of inputSelectors) {
                try {
                    const candidates = this.queryAllIncludingShadow(selector);
                    for (const el of candidates) {
                        if (this.isExtensionUiElement(el))
                            continue;
                        input = el;
                        if (DEBUG) {
                            console.log('[SimpleChatBridge] Using fallback input (no visibility check):', selector);
                        }
                        break;
                    }
                    if (input)
                        break;
                }
                catch (e) {
                    // Invalid selector, skip
                }
            }
        }
        // Try each button selector with same fallback logic
        let sendButton = null;
        for (const selector of sendButtonSelectors) {
            try {
                const candidates = this.queryAllIncludingShadow(selector);
                for (const el of candidates) {
                    if (this.isExtensionUiElement(el))
                        continue;
                    if (this.isVisible(el)) {
                        sendButton = el;
                        break;
                    }
                }
                if (sendButton)
                    break;
            }
            catch (e) {
                // Invalid selector, skip
            }
        }
        // Fallback for button
        if (!sendButton) {
            for (const selector of sendButtonSelectors) {
                try {
                    const candidates = this.queryAllIncludingShadow(selector);
                    for (const el of candidates) {
                        if (this.isExtensionUiElement(el))
                            continue;
                        sendButton = el;
                        if (DEBUG) {
                            console.log('[SimpleChatBridge] Using fallback button (no visibility check):', selector);
                        }
                        break;
                    }
                    if (sendButton)
                        break;
                }
                catch (e) {
                    // Invalid selector, skip
                }
            }
        }
        // Non-debug fallback: accept any visible textarea outside extension UI.
        if (!input) {
            const allTextareas = this.queryAllIncludingShadow('textarea');
            for (const el of allTextareas) {
                if (this.isExtensionUiElement(el))
                    continue;
                if (this.isVisible(el) && !el.disabled) {
                    input = el;
                    break;
                }
            }
        }
        // ULTRA FALLBACK: If we still don't have elements, try to find the FIRST visible contenteditable
        // and the FIRST visible button (in desperation mode)
        if (!input && DEBUG) {
            console.warn('[SimpleChatBridge] Ultra fallback: Looking for ANY contenteditable element...');
            const allEditable = Array.from(document.querySelectorAll('[contenteditable="true"]'));
            for (const el of allEditable) {
                if (this.isExtensionUiElement(el))
                    continue;
                if (this.isVisible(el)) {
                    input = el;
                    console.warn('[SimpleChatBridge] Ultra fallback input found:', {
                        tag: el.tagName,
                        classes: el.className,
                        parent: el.parentElement?.tagName,
                    });
                    break;
                }
            }
            if (!input) {
                console.warn('[SimpleChatBridge] Ultra fallback: Looking for ANY visible textarea...');
                const allTextareas = Array.from(document.querySelectorAll('textarea'));
                for (const el of allTextareas) {
                    if (this.isExtensionUiElement(el))
                        continue;
                    if (this.isVisible(el) && !el.disabled) {
                        input = el;
                        console.warn('[SimpleChatBridge] Ultra fallback textarea found');
                        break;
                    }
                }
            }
        }
        if (!sendButton && DEBUG) {
            console.warn('[SimpleChatBridge] Ultra fallback: Looking for ANY button...');
            const allButtons = Array.from(document.querySelectorAll('button'));
            for (const btn of allButtons) {
                if (this.isExtensionUiElement(btn))
                    continue;
                const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
                const title = btn.getAttribute('title')?.toLowerCase() || '';
                if ((ariaLabel.includes('send') || title.includes('send')) && this.isVisible(btn)) {
                    sendButton = btn;
                    console.warn('[SimpleChatBridge] Ultra fallback button found:', {
                        ariaLabel: btn.getAttribute('aria-label'),
                        title: btn.getAttribute('title'),
                    });
                    break;
                }
            }
        }
        const isReady = !!(input && sendButton);
        const result = { input, sendButton, isReady };
        // Enhanced logging with selector diagnostics
        // ONLY log if state changed or debug mode is on to preventing spamming
        const prevStateReady = this.cachedElements ? this.cachedElements.isReady : null;
        const stateChanged = prevStateReady === null || result.isReady !== prevStateReady;
        if (stateChanged || DEBUG) {
            const logData = {
                hasInput: !!input,
                hasSendButton: !!sendButton,
                isReady,
                url: window.location.href,
                timestamp: new Date().toISOString(),
            };
            // Add which selector matched (if any)
            if (input) {
                for (const selector of inputSelectors) {
                    try {
                        if (document.querySelector(selector) === input) {
                            logData.matchedInputSelector = selector;
                            break;
                        }
                    }
                    catch (e) {
                        // Invalid selector
                    }
                }
            }
            if (sendButton) {
                for (const selector of sendButtonSelectors) {
                    try {
                        if (document.querySelector(selector) === sendButton) {
                            logData.matchedButtonSelector = selector;
                            break;
                        }
                    }
                    catch (e) {
                        // Invalid selector
                    }
                }
            }
            if (!isReady) {
                // Only log on supported AI chat platforms AND when DEBUG is enabled
                // This prevents confusing users on non-chat sites
                if (stateChanged && isSupportedSite && DEBUG) {
                    // Add platform info to help debugging
                    logData.isKnownPlatform = isSupportedSite;
                    console.log('[SimpleChatBridge] Elements NOT ready:', logData);
                    // Provide hints for debugging
                    if (!input) {
                        console.log('[SimpleChatBridge] 💡 Enable debug mode: window.__FUSE_DEBUG_SELECTORS = true');
                        console.log('[SimpleChatBridge] 💡 Available elements:', 'contenteditable count:', document.querySelectorAll('[contenteditable="true"]').length, 'buttons with aria-label:', document.querySelectorAll('button[aria-label]').length);
                    }
                }
            }
            else if (stateChanged) {
                // Only log ready state when it actually changes (not on every scan)
                console.log('[SimpleChatBridge] ✅ Elements ready:', logData);
            }
        }
        // Update cache - ALWAYS update to maintain state tracking, but only set expiry if ready
        this.cachedElements = result;
        if (result.isReady) {
            this.cacheValidUntil = Date.now() + this.CACHE_DURATION;
        }
        else {
            this.cacheValidUntil = 0; // Force re-scan next time if not ready
        }
        return result;
    }
    queryAllIncludingShadow(selector) {
        const results = [];
        const seen = new Set();
        const collect = (root) => {
            const matches = root.querySelectorAll(selector);
            for (const node of matches) {
                if (seen.has(node))
                    continue;
                seen.add(node);
                if (node instanceof HTMLElement) {
                    results.push(node);
                }
            }
            const allInRoot = root.querySelectorAll('*');
            for (const node of allInRoot) {
                if (node instanceof HTMLElement && node.shadowRoot) {
                    collect(node.shadowRoot);
                }
            }
        };
        try {
            collect(document);
        }
        catch {
            // Ignore invalid selector/root traversal issues and return partial results.
        }
        return results;
    }
    /**
     * Check if element is visible (relaxed check with multiple strategies)
     */
    isVisible(el) {
        // Strategy 1: Check if element is connected to DOM and has offsetParent
        // (offsetParent is null for display:none or detached elements)
        if (el.offsetParent !== null) {
            return true;
        }
        // Strategy 2: Try getBoundingClientRect
        try {
            const rect = el.getBoundingClientRect();
            // Element has some dimensions
            if (rect.width > 0 && rect.height > 0) {
                const style = window.getComputedStyle(el);
                // Not explicitly hidden
                if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
                    return true;
                }
            }
        }
        catch (e) {
            // getBoundingClientRect failed - not necessarily invisible
        }
        // Strategy 3: Check if element is in viewport but with zero dimensions
        // (some chat inputs are positioned off-screen or have min-height only)
        try {
            const style = window.getComputedStyle(el);
            if (style.display !== 'none' && style.visibility !== 'hidden') {
                // Element exists in layout tree
                return true;
            }
        }
        catch (e) {
            // Style check failed
        }
        return false;
    }
    /**
     * Count model responses (for detecting new responses)
     */
    countModelResponses() {
        // Qwen-specific assistant message count
        if (this.isQwenHost()) {
            const strictNodes = this.getQwenResponseNodes(false);
            if (strictNodes.length > 0)
                return strictNodes.length;
            // If strict assistant-role matching fails on current Qwen DOM, use relaxed candidates.
            const relaxedNodes = this.getQwenResponseNodes(true);
            if (relaxedNodes.length > 0)
                return relaxedNodes.length;
        }
        // Primary path for Gemini-style UIs
        const modelResponses = this.queryAllIncludingShadow('model-response').length;
        if (modelResponses > 0)
            return modelResponses;
        // OpenClaw chat UI fallback
        const openClawThread = document.querySelector('.chat-thread');
        if (openClawThread) {
            const entries = Array.from(openClawThread.querySelectorAll(':scope > *')).filter((el) => {
                const text = (el.textContent || '').trim();
                return text.length > 0;
            });
            return entries.length;
        }
        // Perplexity Fallback (Expanded)
        const perplexity = document.querySelectorAll('div.prose, div[class*="prose"], div[data-testid*="answer"], div.font-sans.text-base.text-text-main').length;
        if (perplexity > 0)
            return perplexity;
        // Generic assistant-like message fallback
        const generic = this.getGenericAssistantResponseNodes(true).length;
        return generic;
    }
    /**
     * Get latest response text
     */
    getLatestResponse() {
        // Primary path for Gemini-style UIs
        const responses = this.queryAllIncludingShadow('model-response, side-panel-response, gemini-sidebar-output, .gemini-response-content');
        if (responses.length > 0) {
            const lastResponse = responses[responses.length - 1];
            const markdown = lastResponse.querySelector('.markdown, .message-content, side-panel-chat-message');
            const txt = this.extractCleanText(markdown || lastResponse);
            if (txt)
                return txt;
        }
        // Qwen fallback: assistant-tagged message nodes.
        if (this.isQwenHost()) {
            const strict = this.getLatestQwenResponse(false);
            if (strict)
                return strict;
            // Relaxed fallback for guest/new Qwen layouts where assistant role attrs are absent.
            const relaxed = this.getLatestQwenResponse(true);
            if (relaxed)
                return relaxed;
        }
        // OpenClaw chat UI fallback: only inspect chat-thread scoped entries
        const openClawThread = document.querySelector('.chat-thread');
        if (openClawThread) {
            const candidates = Array.from(openClawThread.querySelectorAll(':scope > *'));
            for (let i = candidates.length - 1; i >= 0; i--) {
                const text = this.extractCleanText(candidates[i]);
                if (!text)
                    continue;
                // Skip obvious non-reply/system status text
                const low = text.toLowerCase();
                if (low.includes('disconnected from gateway'))
                    continue;
                if (low === 'openclaw' || low === '🦞')
                    continue;
                // CRITICAL: Block user message scrapes to prevent doubling in OpenClaw
                if (low.startsWith('u ') ||
                    low.startsWith('you ') ||
                    low.includes(' you ') ||
                    (low.startsWith('u') && low.length < 5))
                    continue;
                return text;
            }
        }
        // Perplexity Fallback (Expanded)
        const perplexityResponses = document.querySelectorAll('div.prose, div[class*="prose"], div[data-testid*="answer"], div.font-sans.text-base.text-text-main');
        if (perplexityResponses.length > 0) {
            // Get the last one
            const last = perplexityResponses[perplexityResponses.length - 1];
            const text = this.extractCleanText(last);
            // Perplexity often has "Sources" or "Related" sections at the bottom, we might need to be careful
            // But usually 'prose' contains the main answer.
            if (text)
                return text;
        }
        // Generic assistant fallback across regular + shadow DOM.
        const generic = this.getGenericAssistantResponseNodes(true);
        for (let i = generic.length - 1; i >= 0; i--) {
            const text = this.extractCleanText(generic[i]);
            if (!text)
                continue;
            if (this.lastSentText && text.trim() === this.lastSentText.trim())
                continue;
            return text;
        }
        return null;
    }
    /**
     * Check if AI is currently streaming a response
     */
    isStreaming() {
        if (this._sendingGuard)
            return true; // Force streaming state if we recently sent a message
        // Qwen can keep generic "loading/thinking" classes mounted even after completion.
        // Use stricter indicators there to avoid permanent streaming=true.
        if (this.isQwenHost()) {
            const qwenStreamingIndicators = [
                '[data-testid*="stop" i]',
                'button[aria-label*="Stop generating" i]',
                'button[aria-label*="Stop response" i]',
                'button[aria-label*="Stop" i]',
                'button[title*="Stop" i]',
            ];
            for (const selector of qwenStreamingIndicators) {
                const matches = this.queryAllIncludingShadow(selector);
                for (const el of matches) {
                    if (this.isExtensionUiElement(el))
                        continue;
                    if (this.isVisible(el))
                        return true;
                }
            }
            return false;
        }
        const streamingIndicators = [
            'span[class*="cursor"][class*="blink"]',
            '[class*="thinking"]',
            '[class*="loading-spinner"]',
            '[class*="generating"]',
            '[data-testid*="generat" i]',
            '[data-testid*="typing" i]',
            'button[aria-label*="Stop response"]',
            'button[aria-label*="Stop generating"]',
            '[data-testid*="stop-button"]',
            'button[aria-label*="Stop" i]',
            'button[title*="Stop" i]',
        ];
        for (const selector of streamingIndicators) {
            const el = document.querySelector(selector);
            if (el && this.isVisible(el))
                return true;
        }
        return false;
    }
    /**
     * Send a message to the AI - Enhanced with button re-fetch and robust clicking
     */
    async sendMessage(text) {
        this.lastSentText = text.trim();
        let initialElements = this.findElements();
        if (!initialElements.input) {
            const maxWaitMs = 4000;
            const intervalMs = 250;
            const start = Date.now();
            while (!initialElements.input && Date.now() - start < maxWaitMs) {
                await this.delay(intervalMs);
                initialElements = this.findElements();
            }
        }
        if (!initialElements.input) {
            console.error('[SimpleChatBridge] Chat elements not ready');
            this.callbacks.onError?.('Chat elements not found');
            return false;
        }
        // Activate Sending Guard (reduced from 10s to 3s for faster federation)
        // This prevents queue processing during the gap between click and AI streaming start
        this._sendingGuard = true;
        setTimeout(() => {
            this._sendingGuard = false;
        }, 3000); // 3s protection window - balanced for federation speed vs streaming protection
        const input = initialElements.input;
        // React Scheduler Hack: Get the native setter to bypass React's virtual DOM blocking
        // This is required for Perplexity, ChatGPT, and other React-heavy apps
        const setNativeValue = (element, value) => {
            const { set: valueSetter } = Object.getOwnPropertyDescriptor(element, 'value') ||
                Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value') ||
                {};
            const prototype = Object.getPrototypeOf(element);
            const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
            if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
                prototypeValueSetter.call(element, value);
            }
            else if (valueSetter) {
                valueSetter.call(element, value);
            }
            else {
                element.value = value;
            }
            element.dispatchEvent(new Event('input', { bubbles: true }));
        };
        try {
            // Focus and clear the input
            input.focus();
            await this.delay(100);
            const isContentEditable = input.isContentEditable || input.getAttribute('contenteditable') === 'true';
            // Input simulation
            if (isContentEditable) {
                // Use document.execCommand for reliable Rich Text Editor interaction
                // This simulates actual user typing events better than setting textContent
                // 1. Clear existing content
                // Try native clear first if safe, otherwise select-all-delete
                if (input.textContent && input.textContent.length > 0) {
                    document.execCommand('selectAll', false);
                    document.execCommand('delete', false);
                }
                // 2. Insert new text
                const success = document.execCommand('insertText', false, text);
                // Fallback if execCommand failed (or was blocked)
                if (!success || (input.textContent || '').trim() !== text.trim()) {
                    console.warn('[SimpleChatBridge] execCommand insertText failed, falling back to direct manipulation');
                    input.textContent = text;
                    input.dispatchEvent(new InputEvent('input', {
                        bubbles: true,
                        cancelable: true,
                        inputType: 'insertText',
                        data: text,
                    }));
                }
            }
            else {
                // Textarea/Input handling
                // Use native setter for React-controlled inputs (ChatGPT, Perplexity, etc.)
                setNativeValue(input, text);
                input.dispatchEvent(new InputEvent('input', {
                    bubbles: true,
                    cancelable: true,
                    inputType: 'insertText',
                    data: text,
                }));
                // Also dispatch change for form listeners
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
            // Wait for UI to react to the text input
            await this.delay(300);
            // RE-FIND the send button AFTER text input - it may have become enabled
            // Gemini and other chat UIs often disable the send button until there's text
            const updatedElements = this.findElements();
            let sendButton = updatedElements.sendButton;
            if (!sendButton) {
                console.warn('[SimpleChatBridge] Send button not found after text input, retrying...');
                await this.delay(200);
                sendButton = this.findElements().sendButton;
            }
            if (sendButton) {
                // Wait for button to be enabled (check disabled attribute)
                let attempts = 0;
                while (sendButton.hasAttribute('disabled') && attempts < 10) {
                    await this.delay(100);
                    sendButton = this.findElements().sendButton;
                    if (!sendButton)
                        break;
                    attempts++;
                }
            }
            else {
                console.warn('[SimpleChatBridge] Send button not found; attempting Enter-only submission');
            }
            // Count responses before sending
            const responsesBefore = this.countModelResponses();
            console.log('[SimpleChatBridge] Responses before send:', responsesBefore);
            // FIXED: Try send methods ONE AT A TIME, checking for success after each
            // Previously all methods executed causing multiple sends!
            console.log('[SimpleChatBridge] Sending message...');
            // Helper to check if input was cleared (message was sent)
            const inputWasCleared = () => {
                if (input.isContentEditable || input.getAttribute('contenteditable') === 'true') {
                    return !input.textContent || input.textContent.trim().length === 0;
                }
                return (!input.value ||
                    input.value.trim().length === 0);
            };
            // Method 1: Simulate Enter key press on the input (most reliable for Gemini)
            const enterKeyInit = {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true,
            };
            input.dispatchEvent(new KeyboardEvent('keydown', enterKeyInit));
            input.dispatchEvent(new KeyboardEvent('keypress', enterKeyInit));
            input.dispatchEvent(new KeyboardEvent('keyup', enterKeyInit));
            console.log('[SimpleChatBridge] Dispatched Enter key sequence on input');
            // Some textarea-based UIs submit only on form submit handlers.
            if (!isContentEditable) {
                const form = input.closest('form');
                if (form) {
                    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                    console.log('[SimpleChatBridge] Dispatched form submit fallback');
                }
            }
            // Wait and check if it worked - INCREASED DELAY to prevent double-sending
            await this.delay(500);
            const wasCleared = inputWasCleared();
            const isNowStreaming = this.isStreaming();
            if (wasCleared || isNowStreaming) {
                console.log('[SimpleChatBridge] Message sent via Enter key', {
                    wasCleared,
                    isNowStreaming,
                });
                this.startWatchingForResponse(responsesBefore);
                return true;
            }
            // Method 2: Direct button click (if Enter didn't work)
            if (sendButton) {
                sendButton.click();
                console.log('[SimpleChatBridge] Clicked send button directly');
                // Check again with increased delay
                await this.delay(500);
                if (inputWasCleared() || this.isStreaming()) {
                    console.log('[SimpleChatBridge] Message sent via button click');
                    this.startWatchingForResponse(responsesBefore);
                    return true;
                }
            }
            // Method 3: Dispatch synthetic MouseEvent on button
            if (sendButton) {
                sendButton.dispatchEvent(new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                }));
                console.log('[SimpleChatBridge] Dispatched MouseEvent click on button');
                await this.delay(150);
                if (inputWasCleared()) {
                    console.log('[SimpleChatBridge] Message sent via MouseEvent');
                    this.startWatchingForResponse(responsesBefore);
                    return true;
                }
            }
            // If we get here, none of the methods worked but we'll start watching anyway
            console.warn('[SimpleChatBridge] All send methods attempted, input may not have cleared');
            console.log('[SimpleChatBridge] Message sent:', text.substring(0, 50));
            // Start watching for response
            this.startWatchingForResponse(responsesBefore);
            return true;
        }
        catch (error) {
            console.error('[SimpleChatBridge] Error sending message:', error);
            this.callbacks.onError?.(`Send failed: ${error}`);
            return false;
        }
    }
    /**
     * Inject message (alias for sendMessage)
     */
    async injectMessage(text) {
        return this.sendMessage(text);
    }
    /**
     * Start watching for AI response
     * ENHANCED: Longer timeout for image/video generation, better content detection
     */
    startWatchingForResponse(responsesBefore) {
        this.stopWatching();
        this.isWaitingForResponse = true;
        let stableCount = 0;
        let lastContent = '';
        let lastChangeAt = Date.now();
        const startAt = Date.now();
        const initialContent = this.getLatestResponse() || '';
        const INACTIVITY_TIMEOUT_MS = 180000;
        const HARD_TIMEOUT_MS = 600000;
        this.responseCheckInterval = window.setInterval(() => {
            const currentResponseCount = this.countModelResponses();
            let content = this.getLatestResponse();
            if (!content && this.isQwenHost()) {
                content = this.getLatestQwenResponse(true);
            }
            // Check if a new response appeared OR existing latest response content changed
            const hasNewResponse = currentResponseCount > responsesBefore;
            const hasUpdatedLatest = !!content && content !== initialContent;
            if (hasNewResponse || hasUpdatedLatest) {
                const streaming = this.isStreaming();
                // Also check for image/media content in the latest response
                const hasMedia = this.checkForMediaContent();
                console.log('[SimpleChatBridge] Checking response...', {
                    newContent: !!content,
                    streaming,
                    contentLength: content?.length || 0,
                    hasMedia,
                    responseCount: currentResponseCount,
                });
                if (content || hasMedia) {
                    const currentContentSignature = `${content || ''}-${hasMedia}`;
                    if (currentContentSignature !== lastContent) {
                        // Content changed
                        stableCount = 0;
                        lastContent = currentContentSignature;
                        lastChangeAt = Date.now();
                    }
                    else {
                        // Content is stable
                        stableCount++;
                        const streamStalled = streaming && Date.now() - lastChangeAt > 12000;
                        if (stableCount >= 3 && (!streaming || streamStalled)) {
                            // If streaming appears stuck but content has been stable for long enough,
                            // finalize anyway (Qwen occasionally leaves stop indicators mounted).
                            this.stopWatching();
                            // For media responses, create a placeholder message
                            const finalContent = content || (hasMedia ? '[AI generated media content]' : null);
                            if (finalContent && finalContent !== this.lastResponseText) {
                                this.lastResponseText = finalContent;
                                console.log('[SimpleChatBridge] Response complete!', finalContent.substring(0, 100));
                                this.callbacks.onResponse?.(finalContent);
                            }
                        }
                    }
                }
            }
        }, 1000);
        this.responseTimeoutTimer = window.setInterval(() => {
            if (this.isWaitingForResponse) {
                const elapsedMs = Date.now() - startAt;
                const inactiveMs = Date.now() - lastChangeAt;
                if (elapsedMs < HARD_TIMEOUT_MS && inactiveMs < INACTIVITY_TIMEOUT_MS) {
                    return;
                }
                const timeoutReason = elapsedMs >= HARD_TIMEOUT_MS
                    ? `hard timeout after ${Math.round(elapsedMs / 1000)}s`
                    : `inactivity timeout after ${Math.round(inactiveMs / 1000)}s`;
                console.warn(`[SimpleChatBridge] Response timeout (${timeoutReason})`);
                this.stopWatching();
                // Even on timeout, try to get whatever response is there
                const finalContent = this.getLatestResponse() || this.getLatestQwenResponse(true);
                if (finalContent && finalContent !== this.lastResponseText) {
                    console.log('[SimpleChatBridge] Captured response on timeout:', finalContent.substring(0, 100));
                    this.lastResponseText = finalContent;
                    this.callbacks.onResponse?.(finalContent);
                }
                else {
                    this.callbacks.onError?.('Response timeout');
                }
            }
        }, 1000);
    }
    /**
     * Check if the latest response contains media (images, videos)
     */
    checkForMediaContent() {
        const modelResponses = this.queryAllIncludingShadow('model-response');
        let lastResponse = modelResponses.length
            ? modelResponses[modelResponses.length - 1]
            : null;
        if (!lastResponse) {
            const assistantNodes = this.getGenericAssistantResponseNodes(true);
            if (assistantNodes.length > 0) {
                lastResponse = assistantNodes[assistantNodes.length - 1];
            }
        }
        if (!lastResponse)
            return false;
        // Check for various media elements
        const hasImage = lastResponse.querySelector('img') !== null;
        const hasVideo = lastResponse.querySelector('video') !== null;
        const hasCanvas = lastResponse.querySelector('canvas') !== null;
        const hasIframe = lastResponse.querySelector('iframe') !== null;
        // Check for Gemini-specific image generation indicators
        const hasGeneratedImage = lastResponse.querySelector('[data-generated-image]') !== null ||
            lastResponse.querySelector('.generated-image') !== null ||
            lastResponse.querySelector('[class*="image-output"]') !== null;
        return hasImage || hasVideo || hasCanvas || hasIframe || hasGeneratedImage;
    }
    /**
     * Stop watching for response
     */
    stopWatching() {
        this.isWaitingForResponse = false;
        if (this.responseCheckInterval) {
            clearInterval(this.responseCheckInterval);
            this.responseCheckInterval = null;
        }
        if (this.responseTimeoutTimer) {
            clearInterval(this.responseTimeoutTimer);
            this.responseTimeoutTimer = null;
        }
    }
    /**
     * Get last response
     */
    getLastResponse() {
        return this.getLatestResponse();
    }
    /**
     * Destroy/cleanup
     */
    destroy() {
        this.stopWatching();
        if (this.responseObserver) {
            this.responseObserver.disconnect();
            this.responseObserver = null;
        }
    }
    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    extractCleanText(node) {
        if (!node)
            return null;
        const clone = node.cloneNode(true);
        clone
            .querySelectorAll('button, [role="button"], .chip, [class*="action"], .chat-compose, textarea, input')
            .forEach((el) => el.remove());
        const text = (clone.textContent || '').replace(/\s+/g, ' ').trim();
        if (!text)
            return null;
        if (text.length < 8)
            return null;
        return text;
    }
    getQwenResponseNodes(relaxed) {
        const strictSelectors = [
            '[data-message-author-role="assistant"]',
            '[data-role="assistant"]',
            '[data-author-role="assistant"]',
            '[data-testid*="assistant" i]',
            '[class*="assistant-message" i]',
            '[class*="assistant" i]',
            '[class*="bot" i]',
        ];
        const relaxedSelectors = [
            '[data-testid*="message" i]',
            '[data-testid*="chat-message" i]',
            '[class*="message-content" i]',
            '[class*="markdown" i]',
            '[class*="chat-message" i]',
            '[role="article"]',
            'article',
            'main p',
        ];
        const selectors = relaxed ? [...strictSelectors, ...relaxedSelectors] : strictSelectors;
        const candidates = [];
        const seen = new Set();
        for (const selector of selectors) {
            for (const node of this.queryAllIncludingShadow(selector)) {
                if (seen.has(node))
                    continue;
                seen.add(node);
                candidates.push(node);
            }
        }
        const filtered = [];
        for (const node of candidates) {
            if (this.isExtensionUiElement(node))
                continue;
            if (!this.isVisible(node))
                continue;
            if (this.isLikelyUserMessageNode(node))
                continue;
            if (this.isLikelyNonConversationNode(node))
                continue;
            const text = this.extractCleanText(node);
            if (!text)
                continue;
            filtered.push(node);
        }
        // Deduplicate identical text blocks, keeping the last DOM occurrence.
        const bySignature = new Map();
        for (const node of filtered) {
            const text = this.extractCleanText(node) || '';
            const signature = `${text.slice(0, 240)}|${text.length}`;
            bySignature.set(signature, node);
        }
        return Array.from(bySignature.values());
    }
    getGenericAssistantResponseNodes(relaxed) {
        const strictSelectors = [
            '[data-message-author-role="assistant"]',
            '[data-role="assistant"]',
            '[data-author-role="assistant"]',
            '[data-testid*="assistant" i]',
            '[class*="assistant-message" i]',
            '[class*="assistant-response" i]',
            '[class*="assistant" i]',
            '[class*="bot-message" i]',
            '[class*="bot-response" i]',
        ];
        const relaxedSelectors = [
            '[data-testid*="message" i]',
            '[data-testid*="chat-message" i]',
            '[class*="message-content" i]',
            '[class*="message-body" i]',
            '[class*="markdown" i]',
            '[role="article"]',
            'article',
            'main p',
        ];
        const selectors = relaxed ? [...strictSelectors, ...relaxedSelectors] : strictSelectors;
        const candidates = [];
        const seen = new Set();
        for (const selector of selectors) {
            for (const node of this.queryAllIncludingShadow(selector)) {
                if (seen.has(node))
                    continue;
                seen.add(node);
                candidates.push(node);
            }
        }
        const filtered = [];
        const bySignature = new Map();
        for (const node of candidates) {
            if (this.isExtensionUiElement(node))
                continue;
            if (!this.isVisible(node))
                continue;
            if (this.isLikelyUserMessageNode(node))
                continue;
            if (this.isLikelyNonConversationNode(node))
                continue;
            const text = this.extractCleanText(node);
            const hasMedia = node.querySelector('img, video, canvas, iframe, [data-generated-image], .generated-image') !== null;
            if (!text && !hasMedia)
                continue;
            filtered.push(node);
            const signature = text ? `${text.slice(0, 240)}|${text.length}` : `media:${filtered.length}`;
            bySignature.set(signature, node);
        }
        return Array.from(bySignature.values());
    }
    getLatestQwenResponse(relaxed) {
        const nodes = this.getQwenResponseNodes(relaxed);
        for (let i = nodes.length - 1; i >= 0; i--) {
            const text = this.extractCleanText(nodes[i]);
            if (!text)
                continue;
            if (this.lastSentText && text.trim() === this.lastSentText.trim())
                continue;
            return text;
        }
        return null;
    }
    isQwenHost() {
        const host = window.location.hostname.toLowerCase();
        return host === 'chat.qwen.ai' || host.endsWith('.qwen.ai');
    }
    isLikelyUserMessageNode(node) {
        const role = node.getAttribute('data-message-author-role') ||
            node.getAttribute('data-role') ||
            node.getAttribute('data-author-role') ||
            '';
        if (role.toLowerCase() === 'user')
            return true;
        const cls = `${node.className || ''}`.toLowerCase();
        if (cls.includes('user') || cls.includes('human') || cls.includes('me-message'))
            return true;
        if (node.matches('textarea, input, [contenteditable="true"]'))
            return true;
        if (node.closest('form'))
            return true;
        return false;
    }
    isLikelyNonConversationNode(node) {
        if (node.closest('header, nav, aside, footer, [role="navigation"], [role="complementary"]')) {
            return true;
        }
        if (node.matches('button, [role="button"], a, label')) {
            return true;
        }
        if (node.querySelector('textarea, input, [contenteditable="true"]')) {
            return true;
        }
        const aria = `${node.getAttribute('aria-label') || ''}`.toLowerCase();
        if (aria.includes('send') ||
            aria.includes('new chat') ||
            aria.includes('search') ||
            aria.includes('history')) {
            return true;
        }
        return false;
    }
}
// Export singleton instance
const simpleChatBridge = new SimpleChatBridge();
/* harmony default export */ const adapters_SimpleChatBridge = ((/* unused pure expression or super */ null && (simpleChatBridge)));

;// ./src/v6/content/guard.ts
/**
 * Custom Element Guard for Chrome Extension
 * Prevents the "A custom element with name ... has already been defined" error
 * by patching customElements.define to safely check existence first.
 *
 * Enhanced for Perplexity: handles sandboxed iframes where customElements may be null.
 */
// Entire guard is wrapped: only execute if customElements is available
if (typeof globalThis.customElements !== 'undefined' && globalThis.customElements !== null) {
    try {
        // GLOBAL ERROR LISTENER: Catch errors that bypass our patch (including scheduler module errors)
        window.addEventListener('error', (event) => {
            if (event.message &&
                (event.message.includes('mce-autosize-textarea') ||
                    event.message.includes('already been defined') ||
                    event.message.includes('already been used') ||
                    event.message.includes('Failed to resolve module specifier') ||
                    event.message.includes('scheduler') ||
                    // Catch null customElements access
                    (event.message.includes('Cannot read properties of null') &&
                        event.message.includes('customElements')))) {
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }
        }, true); // Capture phase
        // Also catch unhandled promise rejections for module loading failures
        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason &&
                event.reason.message &&
                (event.reason.message.includes('Failed to resolve module specifier') ||
                    event.reason.message.includes('scheduler') ||
                    event.reason.message.includes('already been defined') ||
                    (event.reason.message.includes('Cannot read properties of null') &&
                        event.reason.message.includes('customElements')))) {
                event.preventDefault();
                return;
            }
        }, true);
        const originalDefine = globalThis.customElements.define;
        if (originalDefine) {
            // Only patch if not already patched (check for our marker)
            if (globalThis.customElements.define &&
                !globalThis.customElements.define.__isSafeGuarded) {
                globalThis.customElements.define = function (name, constructor, options) {
                    // SWALLOW known problematic elements
                    if (name === 'mce-autosize-textarea') {
                        if (globalThis.customElements.get(name))
                            return;
                    }
                    if (globalThis.customElements.get(name)) {
                        // Silently skip - already defined
                        return;
                    }
                    try {
                        originalDefine.call(this, name, constructor, options);
                    }
                    catch (e) {
                        if (e.message && e.message.includes('already been defined')) {
                            // Silently skip collision
                            return;
                        }
                        throw e;
                    }
                };
                // Mark as guarded
                globalThis.customElements.define.__isSafeGuarded = true;
                // Lock the customElements object itself to prevent polyfills from replacing it
                try {
                    const originalCustomElements = globalThis.customElements;
                    Object.defineProperty(globalThis, 'customElements', {
                        get() {
                            return originalCustomElements;
                        },
                        set(v) {
                            // Silently prevent overwriting
                        },
                        configurable: false,
                    });
                }
                catch (e) {
                    // Ignore if already non-configurable
                }
            }
        }
    }
    catch (e) {
        // Silently fail - guard is optional
    }
} // else: customElements not available (sandboxed iframe), skip guard entirely


;// ./src/v6/content/injectable/FloatingPanel.ts
/**
 * Fuse Connect v7 - Enhanced Floating Panel
 * Fully draggable, resizable, with federation channels and notifications
 */
const PANEL_MIN_WIDTH = 300;
const PANEL_MIN_HEIGHT = 200;
const PANEL_MAX_WIDTH = 1200;
const PANEL_MAX_HEIGHT = 1000;
const COLLAPSED_HEIGHT = 48;
class EnhancedFloatingPanel {
    constructor(options = {}) {
        this.container = null;
        this.dragState = { isDragging: false, startX: 0, startY: 0, startPosX: 0, startPosY: 0 };
        this.resizeState = {
            isResizing: false,
            startX: 0,
            startY: 0,
            startWidth: 0,
            startHeight: 0,
            startPosX: 0,
            startPosY: 0,
            edge: '',
        };
        this.myAgentId = null;
        // Data
        this.connectionStatus = 'disconnected';
        this.chatElements = null;
        this.streamingState = null;
        this.agents = [];
        this.channels = [];
        this.currentChannel = null;
        this.pausedChannels = new Set();
        this.messages = [];
        this.notifications = [];
        this.tasks = [];
        this.unreadCount = 0;
        // Track recently broadcast messages to prevent duplicates
        this.recentBroadcasts = new Map();
        // Service health tracking
        this.serviceStatuses = new Map([
            ['relay', 'unknown'],
            ['api', 'unknown'],
            ['frontend', 'unknown'],
        ]);
        this.healthPollInterval = null;
        // Track Chrome message listener for cleanup
        this.chromeMessageListener = null;
        this.storageListener = null;
        this.containerClickListener = null;
        this.containerKeydownListener = null;
        // Flag to track if extension context is valid
        this.isContextValid = true;
        // Cleanup timer to prevent memory leaks
        this.cleanupInterval = null;
        this.CLEANUP_INTERVAL_MS = 30000; // 30 seconds
        this.BROADCAST_DEDUP_WINDOW_MS = 10000; // 10 seconds
        this.aiVideoState = {
            account: 'None',
            processed: 0,
            total: 0,
            cost: 0,
            queue: [],
            queueCount: 0,
            reverseOrder: false,
            segmentDuration: 45,
            processingLevel: 'ai_studio',
            isProcessing: false,
            isPaused: false,
            currentIndex: 0,
            totalCount: 0,
            playlists: [],
            selectedPlaylistId: '',
            channels: [],
            selectedChannelId: '',
            history: [],
        };
        // Generate unique panel ID based on hostname and random suffix
        this.hostName = window.location.hostname.replace(/\./g, '-');
        this.panelId = `${this.hostName}-${Math.random().toString(36).substring(2, 8)}`;
        this.state = {
            mode: options.mode || 'expanded', // UPDATED: Default to expanded
            position: options.position || { x: 20, y: 20 },
            size: options.size || { width: 360, height: 480 },
            activeTab: 'chat',
            isDragging: false,
            isResizing: false,
            isPinned: false,
            opacity: 1,
        };
        console.log(`[GeminiBridge] Panel initialized with ID: ${this.panelId}`);
        this.loadState();
        this.inject();
        this.setupListeners();
        // Request current connection state from background script
        this.requestConnectionState();
        // Start periodic cleanup to prevent memory leaks
        this.startCleanupInterval();
    }
    /**
     * Start periodic cleanup of stale data
     */
    startCleanupInterval() {
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            let cleaned = 0;
            // Clean up old broadcast entries
            for (const [key, time] of this.recentBroadcasts.entries()) {
                if (now - time > this.BROADCAST_DEDUP_WINDOW_MS) {
                    this.recentBroadcasts.delete(key);
                    cleaned++;
                }
            }
            // Trim messages array if it gets too long
            if (this.messages.length > 100) {
                this.messages = this.messages.slice(-50);
            }
            // Trim notifications array
            if (this.notifications.length > 50) {
                this.notifications = this.notifications.slice(-25);
            }
        }, this.CLEANUP_INTERVAL_MS);
    }
    /**
     * Request connection state from background script
     * This ensures the panel gets the correct state when created
     */
    requestConnectionState() {
        chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
            this.connectionStatus = response.connectionStatus || 'disconnected';
            this.agents = response.agents || [];
            this.channels = response.channels || [];
            if (response.selectedChannel !== undefined) {
                this.currentChannel = response.selectedChannel || null;
            }
            if (Array.isArray(response.pausedChannels)) {
                this.pausedChannels = new Set(response.pausedChannels.map((id) => String(id)));
            }
            // Save Browser Agent ID for loop prevention
            if (response.browserAgentId) {
                this.browserAgentId = response.browserAgentId;
            }
            if (response.agentId) {
                this.myAgentId = response.agentId;
            }
            this.update();
        });
    }
    /**
     * Load saved state
     */
    async loadState() {
        try {
            const result = await chrome.storage.local.get(['gemini_bridge_panel_state']);
            if (result.fuse_panel_state) {
                this.state = { ...this.state, ...result.fuse_panel_state };
            }
        }
        catch (e) {
            // Storage not available
        }
    }
    /**
     * Save state
     */
    async saveState() {
        try {
            await chrome.storage.local.set({ fuse_panel_state: this.state });
        }
        catch (e) {
            // Storage not available
        }
    }
    /**
     * Inject panel into page
     */
    inject() {
        // Remove existing
        document.getElementById('fuse-connect-panel-v7')?.remove();
        // Create container
        this.container = document.createElement('div');
        this.container.id = 'fuse-connect-panel-v7';
        this.container.innerHTML = this.render();
        // Inject styles
        this.injectStyles();
        // Add to page
        document.body.appendChild(this.container);
        // Apply position and size
        this.applyPositionAndSize();
    }
    /**
     * Inject CSS
     */
    injectStyles() {
        if (document.getElementById('fuse-connect-styles-v7'))
            return;
        const style = document.createElement('style');
        style.id = 'fuse-connect-styles-v7';
        style.textContent = this.getStyles();
        document.head.appendChild(style);
    }
    /**
     * Get CSS styles
     */
    getStyles() {
        return `
      /* Fuse Connect v7 - Enhanced Panel Styles */

      #fuse-connect-panel-v7 {
        position: fixed !important;
        z-index: 2147483647 !important;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        font-size: 13px !important;
        line-height: 1.4 !important;
        color: #fff !important;
        pointer-events: auto !important;
        user-select: none !important;
      }

      #fuse-connect-panel-v7 * {
        box-sizing: border-box !important;
      }

      .fcp6-panel {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(10,10,15,0.98) 0%, rgba(18,18,26,0.98) 100%) !important;
        border: 1px solid rgba(0,217,255,0.3) !important;
        border-radius: 16px !important;
        box-shadow:
          0 0 40px rgba(0,217,255,0.2),
          0 20px 60px rgba(0,0,0,0.6),
          inset 0 1px 0 rgba(255,255,255,0.1) !important;
        backdrop-filter: blur(20px) !important;
        overflow: hidden !important;
        display: flex !important;
        flex-direction: column !important;
      }

      .fcp6-panel.collapsed {
        height: ${COLLAPSED_HEIGHT}px !important;
      }

      .fcp6-panel.minimized {
        width: 48px !important;
        height: 48px !important;
        border-radius: 50% !important;
      }

      /* Header */
      .fcp6-header {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 8px !important;
        padding: 10px 12px !important;
        background: linear-gradient(90deg, rgba(0,217,255,0.15) 0%, rgba(157,78,221,0.15) 100%) !important;
        border-bottom: 1px solid rgba(0,217,255,0.2) !important;
        cursor: move !important;
        min-height: 46px !important;
      }

      .fcp6-logo {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        min-width: 0 !important;
        flex: 1 1 auto !important;
      }

      .fcp6-icon {
        width: 26px !important;
        height: 26px !important;
        background: linear-gradient(135deg, #00D9FF 0%, #9D4EDD 100%) !important;
        border-radius: 6px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 14px !important;
        box-shadow: 0 0 15px rgba(0,217,255,0.4) !important;
      }

      .fcp6-title {
        font-size: 13px !important;
        font-weight: 600 !important;
        background: linear-gradient(90deg, #00D9FF, #9D4EDD) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        background-clip: text !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }

      .fcp6-status-dot {
        width: 8px !important;
        height: 8px !important;
        border-radius: 50% !important;
        margin-left: 8px !important;
      }

      .fcp6-status-dot.connected { background: #00FF88 !important; box-shadow: 0 0 8px rgba(0,255,136,0.6) !important; }
      .fcp6-status-dot.disconnected { background: #FF3366 !important; }
      .fcp6-status-dot.connecting { background: #FFB800 !important; animation: fcp6-pulse 1s infinite !important; }

      @keyframes fcp6-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }

      .fcp6-controls {
        display: flex !important;
        gap: 4px !important;
        align-items: center !important;
        flex-shrink: 0 !important;
      }

      .fcp6-btn {
        width: 26px !important;
        height: 26px !important;
        border: none !important;
        border-radius: 6px !important;
        background: rgba(255,255,255,0.08) !important;
        color: rgba(255,255,255,0.7) !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 12px !important;
        transition: all 0.2s ease !important;
      }

      .fcp6-btn:hover {
        background: rgba(0,217,255,0.3) !important;
        color: #00D9FF !important;
      }

      .fcp6-badge {
        position: absolute !important;
        top: -4px !important;
        right: -4px !important;
        min-width: 16px !important;
        height: 16px !important;
        background: #FF006E !important;
        border-radius: 8px !important;
        font-size: 10px !important;
        font-weight: 600 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 0 4px !important;
      }

      /* Tabs */
      .fcp6-tabs {
        display: flex !important;
        padding: 4px !important;
        gap: 2px !important;
        background: rgba(0,0,0,0.2) !important;
        border-bottom: 1px solid rgba(255,255,255,0.05) !important;
      }

      .fcp6-tab {
        flex: 1 !important;
        padding: 8px 4px !important;
        border: none !important;
        border-radius: 6px !important;
        background: transparent !important;
        color: rgba(255,255,255,0.5) !important;
        font-size: 11px !important;
        font-weight: 500 !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 2px !important;
      }

      .fcp6-tab:hover {
        background: rgba(255,255,255,0.05) !important;
        color: rgba(255,255,255,0.8) !important;
      }

      .fcp6-tab.active {
        background: linear-gradient(135deg, rgba(0,217,255,0.2) 0%, rgba(157,78,221,0.2) 100%) !important;
        color: #00D9FF !important;
        border: 1px solid rgba(0,217,255,0.3) !important;
      }

      .fcp6-tab-icon {
        font-size: 14px !important;
      }

      /* Content */
      .fcp6-content {
        flex: 1 !important;
        overflow-y: auto !important;
        padding: 12px !important;
      }

      .fcp6-content::-webkit-scrollbar {
        width: 5px !important;
      }

      .fcp6-content::-webkit-scrollbar-thumb {
        background: rgba(0,217,255,0.3) !important;
        border-radius: 3px !important;
      }

      /* Input area */
      .fcp6-input-area {
        padding: 10px 12px 12px !important;
        border-top: 1px solid rgba(0,217,255,0.22) !important;
        background: linear-gradient(180deg, rgba(13,20,30,0.94) 0%, rgba(9,14,22,0.98) 100%) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.04) !important;
      }

      .fcp6-input-row {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) auto !important;
        gap: 10px !important;
        align-items: stretch !important;
      }

      .fcp6-input-shell {
        flex: 1 !important;
        display: flex !important;
        align-items: flex-end !important;
        padding: 6px !important;
        border: 1px solid rgba(0,217,255,0.28) !important;
        border-radius: 12px !important;
        background: linear-gradient(145deg, rgba(3,8,16,0.9), rgba(5,11,20,0.98)) !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.05),
          0 8px 18px rgba(0,0,0,0.26) !important;
      }

      .fcp6-input {
        width: 100% !important;
        min-height: 42px !important;
        max-height: 120px !important;
        padding: 8px 10px !important;
        border: none !important;
        border-radius: 8px !important;
        background: transparent !important;
        color: rgba(255,255,255,0.96) !important;
        font-size: 13px !important;
        outline: none !important;
        line-height: 1.35 !important;
        resize: none !important;
      }

      .fcp6-input-shell:focus-within {
        border-color: rgba(0,217,255,0.65) !important;
        box-shadow:
          0 0 0 2px rgba(0,217,255,0.2),
          0 0 24px rgba(0,217,255,0.14),
          inset 0 1px 0 rgba(255,255,255,0.07) !important;
      }

      .fcp6-input:focus {
        box-shadow: none !important;
      }

      .fcp6-input::placeholder {
        color: rgba(196,210,230,0.62) !important;
      }

      .fcp6-send-btn {
        min-width: 46px !important;
        min-height: 46px !important;
        padding: 0 !important;
        border: none !important;
        border-radius: 12px !important;
        background: linear-gradient(140deg, #00D9FF 0%, #00A3FF 45%, #7A5CFF 100%) !important;
        color: #fff !important;
        font-weight: 700 !important;
        font-size: 16px !important;
        line-height: 1 !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
      }

      .fcp6-send-btn:hover {
        box-shadow: 0 0 24px rgba(0,217,255,0.45) !important;
        transform: translateY(-1px) !important;
      }

      .fcp6-send-btn:active {
        transform: translateY(0) !important;
      }

      .fcp6-input-hint {
        margin-top: 8px !important;
        font-size: 10px !important;
        color: rgba(196,210,230,0.62) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 8px !important;
        flex-wrap: wrap !important;
      }

      .fcp6-input-action {
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        padding: 4px 8px !important;
        border: 1px solid rgba(0,255,136,0.32) !important;
        border-radius: 8px !important;
        background: rgba(0,255,136,0.12) !important;
        color: #86ffd0 !important;
        font-size: 10px !important;
        line-height: 1 !important;
      }

      .fcp6-input-action:hover {
        background: rgba(0,255,136,0.2) !important;
        border-color: rgba(0,255,136,0.44) !important;
      }

      .fcp6-shortcut-hint {
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        margin-left: auto !important;
      }

      .fcp6-shortcut-key {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        min-width: 18px !important;
        height: 16px !important;
        padding: 0 5px !important;
        border-radius: 5px !important;
        border: 1px solid rgba(255,255,255,0.22) !important;
        background: rgba(255,255,255,0.08) !important;
        color: rgba(255,255,255,0.88) !important;
        font-size: 9px !important;
        line-height: 1 !important;
      }

      /* Chat card */
      .fcp6-chat-card {
        padding: 10px !important;
        background: rgba(255,255,255,0.03) !important;
        border-radius: 8px !important;
        margin-bottom: 8px !important;
        border: 1px solid rgba(255,255,255,0.05) !important;
      }

      .fcp6-chat-header {
        display: flex !important;
        justify-content: space-between !important;
        margin-bottom: 4px !important;
        font-size: 11px !important;
      }

      .fcp6-chat-from {
        color: #00D9FF !important;
        font-weight: 500 !important;
      }

      .fcp6-chat-time {
        color: rgba(255,255,255,0.3) !important;
      }

      .fcp6-chat-content {
        color: rgba(255,255,255,0.8) !important;
        word-break: break-word !important;
      }

      /* Channel list */
      .fcp6-channel {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        padding: 10px !important;
        background: rgba(255,255,255,0.03) !important;
        border-radius: 8px !important;
        margin-bottom: 6px !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
      }

      .fcp6-channel:hover, .fcp6-channel.active {
        background: rgba(0,217,255,0.1) !important;
        border: 1px solid rgba(0,217,255,0.3) !important;
      }

      .fcp6-channel-icon {
        font-size: 18px !important;
      }

      .fcp6-channel-info {
        flex: 1 !important;
      }

      .fcp6-channel-name {
        font-weight: 500 !important;
      }

      .fcp6-channel-members {
        font-size: 11px !important;
        color: rgba(255,255,255,0.4) !important;
      }

      .fcp6-channel-actions {
        display: flex !important;
        align-items: center !important;
        gap: 4px !important;
        flex-shrink: 0 !important;
      }

      .fcp6-channel-delete {
        width: 24px !important;
        height: 24px !important;
        border-radius: 999px !important;
        border: 1px solid rgba(255,51,102,0.42) !important;
        background: rgba(255,51,102,0.18) !important;
        color: #ff5f86 !important;
        font-weight: 700 !important;
        line-height: 1 !important;
      }

      .fcp6-channel-delete:hover {
        background: rgba(255,51,102,0.28) !important;
        color: #ffd9e4 !important;
      }

      /* Agent card */
      .fcp6-agent {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        padding: 10px !important;
        background: rgba(255,255,255,0.03) !important;
        border-radius: 8px !important;
        margin-bottom: 6px !important;
      }

      .fcp6-agent-avatar {
        width: 36px !important;
        height: 36px !important;
        border-radius: 8px !important;
        background: linear-gradient(135deg, #9D4EDD 0%, #00D9FF 100%) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 16px !important;
      }

      .fcp6-agent-name {
        font-weight: 500 !important;
      }

      .fcp6-agent-platform {
        font-size: 11px !important;
        color: rgba(255,255,255,0.4) !important;
      }

      /* Notification */
      .fcp6-notification {
        padding: 10px !important;
        background: rgba(255,255,255,0.03) !important;
        border-radius: 8px !important;
        margin-bottom: 8px !important;
        border-left: 3px solid #00D9FF !important;
      }

      .fcp6-notification.unread {
        background: rgba(0,217,255,0.1) !important;
      }

      /* Task card */
      .fcp6-task {
        padding: 12px !important;
        background: rgba(255,255,255,0.03) !important;
        border-radius: 8px !important;
        margin-bottom: 8px !important;
        border-left: 3px solid #9D4EDD !important;
      }

      .fcp6-task.high { border-left-color: #FF3366 !important; }
      .fcp6-task.medium { border-left-color: #FFB800 !important; }
      .fcp6-task.completed { border-left-color: #00FF88 !important; opacity: 0.7 !important; }

      .fcp6-task-header {
        display: flex !important;
        justify-content: space-between !important;
        margin-bottom: 6px !important;
      }

      .fcp6-task-title {
        font-weight: 600 !important;
        font-size: 12px !important;
      }

      .fcp6-task-meta {
        font-size: 10px !important;
        color: rgba(255,255,255,0.5) !important;
        display: flex !important;
        gap: 8px !important;
      }

      /* Detection status */
      .fcp6-detection {
        padding: 10px !important;
        background: rgba(0,255,136,0.1) !important;
        border: 1px solid rgba(0,255,136,0.3) !important;
        border-radius: 8px !important;
        margin-bottom: 12px !important;
      }

      .fcp6-detection.streaming {
        border-color: #FFB800 !important;
        background: rgba(255,184,0,0.1) !important;
      }

      /* Resize handles */
      .fcp6-resize-handle {
        position: absolute !important;
        background: transparent !important;
        z-index: 5 !important;
      }

      .fcp6-resize-handle.left, .fcp6-resize-handle.right {
        top: 10% !important;
        width: 8px !important;
        height: 80% !important;
        cursor: ew-resize !important;
      }

      .fcp6-resize-handle.left {
        left: 0 !important;
      }

      .fcp6-resize-handle.right {
        right: 0 !important;
      }

      .fcp6-resize-handle.top, .fcp6-resize-handle.bottom {
        left: 10% !important;
        width: 80% !important;
        height: 8px !important;
        cursor: ns-resize !important;
      }

      .fcp6-resize-handle.top {
        top: 0 !important;
      }

      .fcp6-resize-handle.bottom {
        bottom: 0 !important;
      }

      .fcp6-resize-handle.corner-nw,
      .fcp6-resize-handle.corner-ne,
      .fcp6-resize-handle.corner-sw,
      .fcp6-resize-handle.corner-se {
        width: 14px !important;
        height: 14px !important;
      }

      .fcp6-resize-handle.corner-nw {
        left: 0 !important;
        top: 0 !important;
        cursor: nwse-resize !important;
      }

      .fcp6-resize-handle.corner-ne {
        right: 0 !important;
        top: 0 !important;
        cursor: nesw-resize !important;
      }

      .fcp6-resize-handle.corner-sw {
        left: 0 !important;
        bottom: 0 !important;
        cursor: nwse-resize !important;
      }

      .fcp6-resize-handle.corner-se {
        right: 0 !important;
        bottom: 0 !important;
        cursor: nesw-resize !important;
      }

      @media (max-width: 540px) {
        .fcp6-header {
          padding: 8px 10px !important;
        }
        .fcp6-title {
          max-width: 128px !important;
        }
      }
    `;
    }
    /**
     * Apply position and size from state
     */
    applyPositionAndSize() {
        if (!this.container)
            return;
        const { position, mode } = this.state;
        const size = {
            width: Math.min(this.getMaxPanelWidth(), Math.max(PANEL_MIN_WIDTH, this.state.size.width)),
            height: Math.min(this.getMaxPanelHeight(), Math.max(PANEL_MIN_HEIGHT, this.state.size.height)),
        };
        this.state.size = size;
        const isCollapsed = mode === 'collapsed';
        const isMinimized = mode === 'minimized';
        if (isMinimized) {
            // Minimized size is fixed in CSS
            this.container.style.width = '';
            this.container.style.height = '';
            // Keep position but clamp to screen
            const maxX = window.innerWidth - 48; // 48 is width
            const maxY = window.innerHeight - 48; // 48 is height
            const x = Math.min(Math.max(0, position.x), maxX);
            const y = Math.min(Math.max(0, position.y), maxY);
            this.container.style.left = `${x}px`;
            this.container.style.top = `${y}px`;
            return;
        }
        if (isCollapsed) {
            this.container.style.height = `${COLLAPSED_HEIGHT}px`;
            this.container.style.width = `${size.width}px`;
        }
        else {
            this.container.style.height = `${size.height}px`;
            this.container.style.width = `${size.width}px`;
        }
        // Clamp position
        const maxX = window.innerWidth - size.width;
        const maxY = window.innerHeight - (isCollapsed ? COLLAPSED_HEIGHT : size.height);
        const x = Math.min(Math.max(0, position.x), maxX);
        const y = Math.min(Math.max(0, position.y), maxY);
        this.container.style.left = `${x}px`;
        this.container.style.top = `${y}px`;
    }
    /**
     * Setup event listeners
     */
    setupListeners() {
        if (!this.container)
            return;
        // Prevent duplicate handler accumulation across update() re-renders.
        if (this.containerClickListener) {
            this.container.removeEventListener('click', this.containerClickListener);
            this.containerClickListener = null;
        }
        if (this.containerKeydownListener) {
            this.container.removeEventListener('keydown', this.containerKeydownListener);
            this.containerKeydownListener = null;
        }
        if (this.storageListener) {
            chrome.storage.onChanged.removeListener(this.storageListener);
            this.storageListener = null;
        }
        // Drag handling
        const header = this.container.querySelector('[data-drag-handle]');
        if (header) {
            header.addEventListener('mousedown', (e) => {
                this.startDrag(e);
            });
        }
        // Resize handling
        const resizeHandles = this.container.querySelectorAll('[data-resize]');
        resizeHandles.forEach((handle) => {
            handle.addEventListener('mousedown', (e) => {
                const edge = e.currentTarget.dataset.resize || '';
                this.startResize(e, edge);
            });
        });
        // Content clicks (delegation)
        this.containerClickListener = (e) => {
            const target = e.target;
            // Handle action buttons
            const actionBtn = target.closest('[data-action]');
            if (actionBtn) {
                const action = actionBtn.dataset.action || '';
                this.handleAction(action, actionBtn);
                return;
            }
            // Handle tabs
            const tabBtn = target.closest('[data-tab]');
            if (tabBtn) {
                const tab = tabBtn.dataset.tab;
                this.switchTab(tab);
                return;
            }
            // Handle Poker Technician actions
            if (target.id === 'poker-activate-tech') {
                const techPrompt = `STEM: You are now the most prolific poker technician that ever lived. 
        Your reasoning is grounded in GTO (Game Theory Optimal) balance but your edge comes from elite exploitative adjustments. 
        Analyze all incoming hand histories and board states with absolute technical precision. 
        Focus on: Range vs Range equity, polarized vs condensed distributions, and board texture advantage. 
        You are connected to the TNF Federation Green Channel. Broadcast your high-level insights there. 
        Acknowledge your technical activation now.`;
                chrome.runtime.sendMessage({
                    type: 'BROADCAST_MESSAGE',
                    channel: 'green',
                    content: techPrompt,
                    metadata: { isSystemMessage: true },
                });
                chrome.runtime.sendMessage({
                    type: 'INJECT_MESSAGE',
                    content: techPrompt,
                });
                target.textContent = 'Technician Active!';
                target.style.background = '#34a853';
                return;
            }
            if (target.id === 'poker-push-context') {
                chrome.runtime.sendMessage({
                    type: 'ACTIVITY_EVENT',
                    eventType: 'GAME_STATE_PUSH',
                    channel: 'green',
                    metadata: {
                        url: window.location.href,
                        timestamp: Date.now(),
                    },
                });
                target.textContent = 'State Pushed!';
                setTimeout(() => {
                    if (target)
                        target.textContent = 'Push Game State to Green';
                }, 2000);
                return;
            }
            // Handle channel selection
            if (target.matches('.fcp6-channel')) {
                const channelId = target.dataset.channel;
                if (channelId) {
                    // If clicking generic channel row, select it
                    this.selectChannel(channelId);
                }
            }
        };
        this.container.addEventListener('click', this.containerClickListener);
        // Input handling
        this.containerKeydownListener = (e) => {
            const keyEvent = e;
            const target = e.target;
            // Send message on Enter (without Shift)
            if (target.dataset.input === 'message' && keyEvent.key === 'Enter' && !keyEvent.shiftKey) {
                keyEvent.preventDefault();
                this.sendMessage();
            }
            // Create channel on Enter
            if (target.id === 'fuse-new-channel-name' && keyEvent.key === 'Enter') {
                keyEvent.preventDefault();
                this.submitCreateChannel();
            }
        };
        this.container.addEventListener('keydown', this.containerKeydownListener);
        // Channel selector change
        const channelSelect = this.container.querySelector('#fuse-channel-select');
        if (channelSelect) {
            channelSelect.addEventListener('change', (e) => {
                const select = e.target;
                this.selectChannel(select.value || null);
            });
        }
        // NOTE: Channel selection is now tab-specific (per-panel), so we do NOT sync across tabs.
        // Each panel maintains its own independent channel selection.
        // Listen for storage changes for OTHER settings that should sync (like channels list, agents, etc.)
        this.storageListener = (changes, areaName) => {
            if (areaName === 'local') {
                // Sync channels list changes (not channel SELECTION, but the list of available channels)
                if (changes.fuse_channels) {
                    const newChannels = changes.fuse_channels.newValue;
                    if (newChannels && Array.isArray(newChannels)) {
                        console.log('[GeminiBridge] Syncing channels list from storage:', newChannels.length);
                        this.channels = newChannels;
                        this.update();
                    }
                }
            }
        };
        chrome.storage.onChanged.addListener(this.storageListener);
    }
    /**
     * Start dragging
     */
    startDrag(e) {
        if (e.target.closest('button'))
            return; // Don't drag if clicking buttons
        this.dragState = {
            isDragging: true,
            startX: e.clientX,
            startY: e.clientY,
            startPosX: this.state.position.x,
            startPosY: this.state.position.y,
        };
        const onMove = (e) => {
            if (!this.dragState.isDragging || !this.container)
                return;
            const deltaX = e.clientX - this.dragState.startX;
            const deltaY = e.clientY - this.dragState.startY;
            this.state.position.x = this.dragState.startPosX + deltaX;
            this.state.position.y = this.dragState.startPosY + deltaY;
            // Update actual element
            this.applyPositionAndSize();
        };
        const onUp = () => {
            this.dragState.isDragging = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            this.saveState();
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }
    /**
     * Render panel HTML
     */
    render() {
        const { mode, activeTab } = this.state;
        const isCollapsed = mode === 'collapsed';
        const isMinimized = mode === 'minimized';
        if (isMinimized) {
            return this.renderMinimized();
        }
        return `
      <div class="fcp6-panel ${isCollapsed ? 'collapsed' : ''}" id="fuse-connect-panel" data-testid="fuse-connect-panel" aria-label="Fuse Connect Panel">
        ${this.renderHeader()}
        ${!isCollapsed
            ? `
          ${this.renderTabs()}
          <div class="fcp6-content" id="fuse-panel-content" data-testid="fuse-panel-content">
            ${this.renderTabContent(activeTab)}
          </div>
          ${activeTab === 'chat' ? this.renderInputArea() : ''}
        `
            : ''}
        ${!isCollapsed ? this.renderResizeHandles() : ''}
      </div>
    `;
    }
    // ... (keeping other methods as is, assuming they are not in the ReplaceContent unless needed)
    // Wait, I need to replace renderResizeHandles and startResize too.
    // I will just replace the specific blocks.
    /**
     * Render resize handles
     */
    renderResizeHandles() {
        return `
      <div class="fcp6-resize-handle left" data-resize="left"></div>
      <div class="fcp6-resize-handle right" data-resize="right"></div>
      <div class="fcp6-resize-handle top" data-resize="top"></div>
      <div class="fcp6-resize-handle bottom" data-resize="bottom"></div>
      <div class="fcp6-resize-handle corner-nw" data-resize="corner-nw"></div>
      <div class="fcp6-resize-handle corner-ne" data-resize="corner-ne"></div>
      <div class="fcp6-resize-handle corner-sw" data-resize="corner-sw"></div>
      <div class="fcp6-resize-handle corner-se" data-resize="corner-se"></div>
    `;
    }
    // ...
    /**
     * Start resizing
     */
    startResize(e, edge) {
        this.resizeState = {
            isResizing: true,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: this.state.size.width,
            startHeight: this.state.size.height,
            startPosX: this.state.position.x,
            startPosY: this.state.position.y,
            edge,
        };
        let rafId = null;
        const onMove = (e) => {
            if (!this.resizeState.isResizing || !this.container)
                return;
            const clientX = e.clientX;
            const clientY = e.clientY;
            if (rafId)
                return;
            rafId = requestAnimationFrame(() => {
                const dx = clientX - this.resizeState.startX;
                const dy = clientY - this.resizeState.startY;
                const maxWidth = this.getMaxPanelWidth();
                const maxHeight = this.getMaxPanelHeight();
                let newWidth = this.resizeState.startWidth;
                let newHeight = this.resizeState.startHeight;
                let newX = this.resizeState.startPosX;
                let newY = this.resizeState.startPosY;
                const resizingLeft = edge.includes('left') || edge.includes('nw') || edge.includes('sw');
                const resizingRight = edge.includes('right') || edge.includes('ne') || edge.includes('se');
                const resizingTop = edge.includes('top') || edge.includes('nw') || edge.includes('ne');
                const resizingBottom = edge.includes('bottom') || edge.includes('sw') || edge.includes('se');
                if (resizingLeft) {
                    const proposedWidth = this.resizeState.startWidth - dx;
                    newWidth = Math.min(maxWidth, Math.max(PANEL_MIN_WIDTH, proposedWidth));
                    newX = this.resizeState.startPosX + (this.resizeState.startWidth - newWidth);
                }
                else if (resizingRight) {
                    const proposedWidth = this.resizeState.startWidth + dx;
                    newWidth = Math.min(maxWidth, Math.max(PANEL_MIN_WIDTH, proposedWidth));
                }
                if (resizingTop) {
                    const proposedHeight = this.resizeState.startHeight - dy;
                    newHeight = Math.min(maxHeight, Math.max(PANEL_MIN_HEIGHT, proposedHeight));
                    newY = this.resizeState.startPosY + (this.resizeState.startHeight - newHeight);
                }
                else if (resizingBottom) {
                    const proposedHeight = this.resizeState.startHeight + dy;
                    newHeight = Math.min(maxHeight, Math.max(PANEL_MIN_HEIGHT, proposedHeight));
                }
                newX = Math.max(0, Math.min(window.innerWidth - newWidth, newX));
                newY = Math.max(0, Math.min(window.innerHeight - newHeight, newY));
                this.state.position.x = newX;
                this.state.position.y = newY;
                this.state.size.width = newWidth;
                this.state.size.height = newHeight;
                this.applyPositionAndSize();
                rafId = null;
            });
        };
        const onUp = () => {
            this.resizeState.isResizing = false;
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            this.saveState();
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }
    getMaxPanelWidth() {
        return Math.max(PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, window.innerWidth - 16));
    }
    getMaxPanelHeight() {
        return Math.max(PANEL_MIN_HEIGHT, Math.min(PANEL_MAX_HEIGHT, window.innerHeight - 16));
    }
    /**
     * Render input area
     */
    renderInputArea() {
        return `
      <div class="fcp6-input-area">
        <div class="fcp6-input-row">
          <div class="fcp6-input-shell">
            <textarea
              class="fcp6-input"
              data-input="message"
              placeholder="Message the channel..."
              rows="1"
            ></textarea>
          </div>
          <button class="fcp6-send-btn" data-action="send" title="Send">
            ➤
          </button>
        </div>
        <div class="fcp6-input-hint">
          <button class="fcp6-btn fcp6-input-action" data-action="inject-to-chat" title="Inject only to the page chat">
            Inject to Page
          </button>
          <span class="fcp6-shortcut-hint">
            <span class="fcp6-shortcut-key">Enter</span>
            <span>to send</span>
          </span>
        </div>
      </div>
    `;
    }
    /**
     * Render minimized state
     */
    renderMinimized() {
        return `
      <div class="fcp6-panel minimized" id="fuse-panel-minimized" data-testid="fuse-panel-minimized" data-action="expand" aria-label="Expand Fuse Connect Panel">
        <div class="fcp6-icon">⚡</div>
        ${this.unreadCount > 0 ? `<span class="fcp6-badge">${this.unreadCount}</span>` : ''}
      </div>
    `;
    }
    /**
     * Render header
     */
    renderHeader() {
        const shortId = this.panelId.split('-').pop() || this.panelId;
        return `
      <div class="fcp6-header" data-drag-handle>
        <div class="fcp6-logo">
          <div class="fcp6-icon">⚡</div>
          <span class="fcp6-title">FUSE CONNECT</span>
          <span class="fcp6-status-dot ${this.connectionStatus}"></span>
        </div>
        <div class="fcp6-controls">
          <span style="font-size: 9px; color: rgba(255,255,255,0.4); margin-right: 8px;" title="Panel ID: ${this.panelId}">
            #${shortId}
          </span>
          <button class="fcp6-btn" id="fuse-btn-pin" data-testid="fuse-btn-pin" data-action="pin" title="Pin panel" aria-label="Pin panel">${this.state.isPinned ? '📌' : '📍'}</button>
          <button class="fcp6-btn" id="fuse-btn-minimize" data-testid="fuse-btn-minimize" data-action="minimize" title="Minimize" aria-label="Minimize panel">−</button>
          <button class="fcp6-btn" id="fuse-btn-toggle" data-testid="fuse-btn-toggle" data-action="toggle" title="${this.state.mode === 'collapsed' ? 'Expand' : 'Collapse'}" aria-label="${this.state.mode === 'collapsed' ? 'Expand panel' : 'Collapse panel'}">
            ${this.state.mode === 'collapsed' ? '▼' : '▲'}
          </button>
        </div>
      </div>
      ${this.state.mode !== 'collapsed' ? this.renderChannelSelector() : ''}
    `;
    }
    /**
     * Render channel selector bar
     */
    renderChannelSelector() {
        const isPaused = !!(this.currentChannel && this.pausedChannels.has(this.currentChannel));
        return `
      <div class="fcp6-channel-selector" style="
        padding: 6px 12px;
        background: rgba(0,0,0,0.3);
        border-bottom: 1px solid rgba(255,255,255,0.1);
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
      ">
        <span style="color: rgba(255,255,255,0.5);">Sync to:</span>
        <select id="fuse-channel-select" data-action="select-channel" style="
          flex: 1;
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(0,0,0,0.4);
          color: white;
          font-size: 11px;
          cursor: pointer;
        ">
          <option value="" ${!this.currentChannel ? 'selected' : ''}>-- None (local only) --</option>
          ${this.channels
            .map((ch) => `
            <option value="${ch.id}" ${this.currentChannel === ch.id ? 'selected' : ''}>
              ${ch.isPrivate ? '🔒' : '#'} ${this.escapeHtml(ch.name)}
            </option>
          `)
            .join('')}
        </select>
        <span style="color: ${this.currentChannel ? '#0f8' : 'rgba(255,255,255,0.3)'}; font-size: 10px;">
          ${this.currentChannel ? '● Syncing' : '○ Local'}
        </span>
        ${this.currentChannel
            ? `
          <button class="fcp6-btn" data-action="toggle-channel-pause" title="${isPaused ? 'Resume channel' : 'Pause channel'}" style="width:auto; padding:4px 8px; font-size:11px; ${isPaused ? 'background:rgba(255,184,0,0.2); color:#FFB800;' : 'background:rgba(255,255,255,0.08);'}">
            ${isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
        `
            : ''}
      </div>
    `;
    }
    /**
     * Render tabs
     */
    renderTabs() {
        const tabs = [
            { id: 'chat', icon: '💬', label: 'Chat' },
            { id: 'poker', icon: '🃏', label: 'Poker' },
            { id: 'agents', icon: '🤖', label: 'Agents' },
            { id: 'channels', icon: '📢', label: 'Channels' },
            { id: 'tasks', icon: '📋', label: 'Tasks' },
            { id: 'services', icon: '⚙️', label: 'Services' },
            { id: 'notifications', icon: '🔔', label: 'Alerts' },
            { id: 'settings', icon: '🔧', label: 'Settings' },
        ];
        return `
      <div class="fcp6-tabs">
        ${tabs
            .map((tab) => `
          <button class="fcp6-tab ${this.state.activeTab === tab.id ? 'active' : ''}" data-tab="${tab.id}">
            <span class="fcp6-tab-icon">${tab.icon}</span>
            <span>${tab.label}</span>
            ${tab.id === 'notifications' && this.unreadCount > 0 ? `<span class="fcp6-badge">${this.unreadCount}</span>` : ''}
          </button>
        `)
            .join('')}
      </div>
    `;
    }
    /**
     * Render tab content
     */
    renderTabContent(tab) {
        switch (tab) {
            case 'chat':
                return this.renderChatTab();
            case 'poker':
                return this.renderPokerTab();
            case 'channels':
                return this.renderChannelsTab();
            case 'agents':
                return this.renderAgentsTab();
            case 'tasks':
                return this.renderTasksTab();
            case 'notifications':
                return this.renderNotificationsTab();
            case 'services':
                return this.renderServicesTab();
            case 'settings':
                return this.renderSettingsTab();
            default:
                return '';
        }
    }
    /**
     * Render Poker tab
     */
    renderPokerTab() {
        return `
      <div class="fcp6-poker-tab" style="padding: 16px; display: flex; flex-direction: column; gap: 16px; color: #fff;">
        <div style="text-align: center; margin-bottom: 8px;">
          <div style="font-size: 24px;">🃏</div>
          <h3 style="margin: 8px 0 4px 0; color: #fff;">Poker Technician</h3>
          <p style="font-size: 11px; color: rgba(255,255,255,0.5); margin: 0;">Elite GTO & Exploitative Analysis</p>
        </div>

        <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
          <h4 style="margin: 0 0 8px 0; font-size: 12px; color: #00D9FF;">Technician Actions</h4>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button class="fcp6-btn" id="poker-activate-tech" style="width: 100%; padding: 10px; background: linear-gradient(135deg, #1a73e8, #4285f4); color: white; font-weight: bold; border-radius: 8px; border: none; cursor: pointer;">
              Stem as Prolific Technician
            </button>
            <button class="fcp6-btn" id="poker-push-context" style="width: 100%; padding: 8px; background: rgba(52, 168, 83, 0.2); color: #34a853; border: 1px solid rgba(52, 168, 83, 0.3); border-radius: 8px; cursor: pointer;">
              Push Game State to Green
            </button>
          </div>
        </div>

        <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 12px;">
          <h4 style="margin: 0 0 8px 0; font-size: 12px; color: #FFB800;">Real-time HUD</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
            <div style="background: rgba(255,255,255,0.03); padding: 6px; border-radius: 4px;">
              <span style="color: rgba(255,255,255,0.4);">VPIP:</span> 24.5%
            </div>
            <div style="background: rgba(255,255,255,0.03); padding: 6px; border-radius: 4px;">
              <span style="color: rgba(255,255,255,0.4);">PFR:</span> 19.2%
            </div>
            <div style="background: rgba(255,255,255,0.03); padding: 6px; border-radius: 4px;">
              <span style="color: rgba(255,255,255,0.4);">3-Bet:</span> 8.1%
            </div>
            <div style="background: rgba(255,255,255,0.03); padding: 6px; border-radius: 4px;">
              <span style="color: rgba(255,255,255,0.4);">AF:</span> 3.4
            </div>
          </div>
        </div>
      </div>
    `;
    }
    /**
     * Render chat tab
     */
    renderChatTab() {
        // Detection status
        let detectionHtml = '';
        if (this.chatElements) {
            const isStreaming = this.streamingState?.isStreaming;
            detectionHtml = `
        <div class="fcp6-detection ${isStreaming ? 'streaming' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>${isStreaming ? '🔄 AI is responding...' : '✅ Chat detected'}</span>
            <span style="font-size: 11px; color: rgba(255,255,255,0.5);">
              ${Math.round(this.chatElements.confidence * 100)}% confidence
            </span>
          </div>
        </div>
      `;
        }
        // Messages - render in a scrollable container (oldest first, newest at bottom)
        const messagesHtml = this.messages.length > 0
            ? this.messages
                .slice(-50) // Get last 50 messages
                .map((msg) => {
                // Resolve Sender Name and ID
                let senderName = msg.from;
                let senderId = msg.from;
                let isMe = false;
                if (msg.from === 'You' ||
                    msg.from === 'You (Fuse)' ||
                    (this.myAgentId && msg.from === this.myAgentId)) {
                    senderName = 'You';
                    senderId = this.myAgentId || 'unknown-id';
                    isMe = true;
                }
                else {
                    // Try to resolve name from agents list
                    const agent = this.agents.find((a) => a.id === msg.from);
                    if (agent) {
                        senderName = agent.name;
                        senderId = agent.id;
                    }
                }
                // Handler for System Messages
                if (msg.metadata?.isSystemMessage) {
                    return `
                  <div class="fcp6-system-message" style="text-align: center; margin: 8px 0; font-size: 11px; color: rgba(255, 255, 255, 0.5); font-style: italic;">
                    <span style="background: rgba(255, 255, 255, 0.05); padding: 2px 8px; border-radius: 10px;">
                      ${this.escapeHtml(msg.content)}
                    </span>
                  </div>
                 `;
                }
                // Metadata ID check (if present)
                if (msg.metadata && typeof msg.metadata.senderId === 'string') {
                    senderId = msg.metadata.senderId;
                }
                // Shorten ID for display
                const shortId = senderId.length > 8 ? senderId.substring(0, 6) + '...' : senderId;
                return `
            <div class="fcp6-chat-card" data-msg-id="${msg.id}">
            <div class="fcp6-chat-header">
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span class="fcp6-chat-from" title="Agent ID: ${this.escapeHtml(senderId)}">
                  ${this.escapeHtml(senderName)}
                </span>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span style="font-size: 9px; font-family: monospace; background: rgba(255,255,255,0.1); padding: 1px 6px; border-radius: 4px; color: rgba(255,255,255,0.6); user-select: text; -webkit-user-select: text;" title="Click copy to get full ID: ${this.escapeHtml(senderId)}">
                    #${this.escapeHtml(shortId)}
                  </span>
                  <button class="fcp6-btn" data-action="copy-to-clipboard" data-value="${this.escapeHtml(senderId)}" title="Copy Agent ID" style="width: 18px; height: 18px; font-size: 8px; padding: 0; background: rgba(0,217,255,0.1); color: #00D9FF; border: 1px solid rgba(0,217,255,0.2);">
                    📋
                  </button>
                </div>
              </div>
              <span class="fcp6-chat-time">${this.formatTime(msg.timestamp)}</span>
            </div>
            <div class="fcp6-chat-content" style="user-select: text; -webkit-user-select: text; cursor: text;">${this.escapeHtml(msg.content)}</div>
          </div>
        `;
            })
                .join('')
            : `<div class="fcp6-empty"><div class="fcp6-empty-icon">💬</div><p>No messages yet</p><p style="font-size: 11px; opacity: 0.6;">Send a message to start chatting</p></div>`;
        return `
      ${detectionHtml}
      <div class="fcp6-chat-scroll" id="fuse-chat-scroll" style="flex: 1; overflow-y: auto; max-height: 300px; padding-right: 4px;">
        ${messagesHtml}
      </div>
      </div>
    `;
    }
    /**
     * Render channels tab
     */
    renderChannelsTab() {
        return `
      <div class="fcp6-section-title">Active Channels</div>
      <div class="fcp6-list">
        ${this.channels.length > 0
            ? this.channels
                .map((ch) => `
          <div class="fcp6-channel ${this.currentChannel === ch.id ? 'active' : ''}" data-channel="${ch.id}">
            <div class="fcp6-channel-icon">${ch.isPrivate ? '🔒' : '#'}</div>
            <div class="fcp6-channel-info">
              <div class="fcp6-channel-name">${this.escapeHtml(ch.name)}</div>
              <div class="fcp6-channel-members">${ch.members.length} active agents</div>
            </div>
            <div class="fcp6-channel-actions">
              ${this.currentChannel === ch.id ? '<div class="fcp6-badge" style="position:static; margin:0;">✓</div>' : ''}
              ${ch.id !== 'general' ? `<button class="fcp6-btn fcp6-channel-delete" data-action="delete-channel" data-channel-id="${ch.id}" title="Delete Channel">×</button>` : ''}
            </div>
          </div>
        `)
                .join('')
            : '<div class="fcp6-empty">No active channels</div>'}
      </div>

      <div class="fcp6-section-title" style="margin-top: 16px;">Create Channel</div>
      <div class="fcp6-input-row">
        <input type="text" id="fuse-new-channel-name" class="fcp6-input" placeholder="New channel name..." style="min-height: 36px;">
        <button class="fcp6-btn" style="width: auto; padding: 0 12px; background: rgba(0,217,255,0.2); color: #00D9FF;" data-action="submit-create-channel">Create</button>
      </div>
    `;
    }
    /**
     * Render agents tab
     */
    renderAgentsTab() {
        return `
      <div class="fcp6-section-title">Connected Agents (${this.agents.length})</div>
      <div class="fcp6-list">
        ${this.agents.length > 0
            ? this.agents
                .map((agent) => `
          <div class="fcp6-agent">
            <div class="fcp6-agent-avatar">${this.getAgentIcon(agent.platform || 'unknown')}</div>
            <div class="fcp6-channel-info">
              <div class="fcp6-agent-name">
                ${this.escapeHtml(agent.name)}
                ${agent.id === this.myAgentId ? '<span class="fcp6-badge" style="position:static; display:inline-block; margin-left:6px; background:rgba(0,217,255,0.2); color:#00D9FF;">YOU</span>' : ''}
              </div>
              <div class="fcp6-agent-platform">${agent.platform} • ${agent.status}</div>
            </div>
          </div>
        `)
                .join('')
            : '<div class="fcp6-empty">No other agents connected</div>'}
      </div>
    `;
    }
    /**
     * Render services tab
     */
    renderServicesTab() {
        return `
      <div class="fcp6-section-title">✨ Services</div>
      <div style="padding:16px; text-align:center; color:rgba(255,255,255,0.7); font-size:12px; margin-top:20px;">
        <div>Please open the main <strong>Fuse Connect Extension popup</strong> from your browser toolbar to access AI Video Intelligence and other connected services.</div>
      </div>
    `;
    }
    /**
     * Render tasks tab
     */
    renderTasksTab() {
        return `
      <div class="fcp6-section-title">Assigned Tasks (${this.tasks.length})</div>
      <div class="fcp6-list">
        ${this.tasks.length > 0
            ? this.tasks
                .map((task) => `
          <div class="fcp6-task ${task.priority}" data-task-id="${task.id}">
            <div class="fcp6-task-header">
              <span class="fcp6-task-title">#${task.id.split('-').pop()} - ${this.escapeHtml(task.title)}</span>
              <span class="fcp6-badge" style="background:rgba(255,255,255,0.1);">${task.type}</span>
            </div>
            <div class="fcp6-task-meta" style="margin-bottom:6px;">
              <span>Created ${this.formatTime(task.createdAt)}</span>
              <span>•</span>
              <span>By ${task.createdBy || 'Orchestrator'}</span>
            </div>
            <div style="font-size:11px; opacity:0.8; margin-bottom:8px;">
              ${this.escapeHtml(task.description)}
            </div>
            ${task.instructions.length > 0
                ? `<div style="font-size:10px; background:rgba(0,0,0,0.2); padding:6px; border-radius:4px;">
                  <div style="opacity:0.6; margin-bottom:2px;">INSTRUCTIONS:</div>
                  <ul style="margin:0; padding-left:16px;">
                    ${task.instructions.map((i) => `<li>${this.escapeHtml(i)}</li>`).join('')}
                  </ul>
                </div>`
                : ''}
            <div style="display:flex; gap:6px; margin-top:8px;">
               <button class="fcp6-btn" data-action="accept-task" data-task-id="${task.id}" style="flex:1; background:rgba(0,217,255,0.2); color:#00D9FF;">Accept</button>
               <button class="fcp6-btn" data-action="reject-task" data-task-id="${task.id}" style="flex:1;">Reject</button>
            </div>
          </div>
        `)
                .join('')
            : '<div class="fcp6-empty"><div class="fcp6-empty-icon">✓</div><p>No active tasks</p></div>'}
      </div>
    `;
    }
    /**
     * Render notifications tab
     */
    renderNotificationsTab() {
        // Mark as read when viewing
        setTimeout(() => this.markNotificationsRead(), 1000);
        return `
      <div class="fcp6-section-title">Notifications</div>
      <div class="fcp6-list">
        ${this.notifications.length > 0
            ? this.notifications
                .map((n) => `
          <div class="fcp6-notification ${!n.read ? 'unread' : ''}">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span style="font-weight:600; font-size:11px;">${this.escapeHtml(n.title)}</span>
              <span style="font-size:9px; opacity:0.5;">${this.formatTime(n.timestamp)}</span>
            </div>
            <div style="font-size:11px; opacity:0.8;">${this.escapeHtml(n.message)}</div>
          </div>
        `)
                .join('')
            : '<div class="fcp6-empty">No notifications</div>'}
      </div>
    `;
    }
    /**
     * Render settings tab
     */
    renderSettingsTab() {
        return `
      <div class="fcp6-section-title">Panel Settings</div>
      <div style="padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px;">

        <div style="margin-bottom: 12px;">
          <label style="display:block; font-size:11px; margin-bottom:4px; opacity:0.7;">Opacity</label>
          <input type="range" data-setting="opacity" min="0.2" max="1" step="0.1" value="${this.state.opacity || 1}" style="width:100%;">
        </div>

        <div style="margin-bottom: 12px; display:flex; align-items:center;">
          <input type="checkbox" data-setting="alwaysOnTop" ${this.state.isPinned ? 'checked' : ''} style="margin-right:8px;">
          <label style="font-size:11px;">Always on Top (Pin)</label>
        </div>

         <div style="margin-bottom: 12px; display:flex; align-items:center;">
          <input type="checkbox" data-setting="autoReconnect" checked style="margin-right:8px;">
          <label style="font-size:11px;">Auto-Reconnect Relay</label>
        </div>

         <div style="margin-bottom: 12px; display:flex; align-items:center;">
          <input type="checkbox" data-setting="debugMode" style="margin-right:8px;">
          <label style="font-size:11px;">Debug Mode</label>
        </div>

        <div style="display:flex; gap:8px; margin-top:16px;">
           <button class="fcp6-btn" data-action="save-settings" style="flex:1; width:auto; background:rgba(0,217,255,0.2); color:#00D9FF;">Save</button>
           <button class="fcp6-btn" data-action="reset-settings" style="flex:1; width:auto;">Reset</button>
        </div>
      </div>

      <div class="fcp6-section-title" style="margin-top:16px;">Connection</div>
       <div style="padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px;">
          <label style="display:block; font-size:11px; margin-bottom:4px; opacity:0.7;">Relay Server URL</label>
          <input type="text" data-setting="relayUrl" value="ws://localhost:3000/ws" class="fcp6-input" style="width:100%; margin-bottom:8px;">
       </div>

      <div class="fcp6-section-title" style="margin-top:16px;">Event Logs</div>
      <div style="padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px;">
        <div style="display:flex; gap:8px; margin-bottom:8px;">
          <button class="fcp6-btn" data-action="copy-event-logs" style="flex:1; width:auto;">Copy JSON</button>
          <button class="fcp6-btn" data-action="clear-event-logs" style="flex:1; width:auto;">Clear</button>
        </div>
        <div style="font-size:10px; color:rgba(255,255,255,0.55);">
          Captures extension message flow and browser tab lifecycle events.
        </div>
      </div>
    `;
    }
    sendMessage() {
        const input = this.container?.querySelector('[data-input="message"]');
        if (!input || !input.value.trim())
            return;
        const content = input.value.trim();
        input.value = '';
        const metadata = {
            senderId: this.myAgentId || 'unknown',
            source: 'floating-panel',
        };
        // 1. Send via relay to agents (Broadcast)
        this.safeSendMessage({
            type: 'BROADCAST_MESSAGE',
            content,
            channel: this.currentChannel,
            metadata,
        });
        // 2. Inject into page chat (Submit to Page)
        this.safeSendMessage({
            type: 'INJECT_MESSAGE',
            content,
            metadata,
        }, (response) => {
            if (!response?.success) {
                console.warn('[GeminiBridge] Failed to inject message to page:', response?.error);
            }
        });
        // 3. Add to local messages
        this.messages.push({
            id: Date.now().toString(),
            from: this.myAgentId || 'You',
            to: 'AI',
            content,
            timestamp: Date.now(),
            type: 'text',
            metadata,
        });
        this.update();
    }
    /**
     * Inject message into page chat (sends to detected AI chat input)
     */
    injectToPageChat() {
        const input = this.container?.querySelector('[data-input="message"]');
        if (!input || !input.value.trim())
            return;
        const content = input.value.trim();
        input.value = '';
        const metadata = {
            senderId: this.myAgentId || 'unknown',
            source: 'floating-panel-inject-only',
        };
        // Send to content script to inject into page chat
        this.safeSendMessage({
            type: 'INJECT_MESSAGE',
            content,
            metadata,
        }, (response) => {
            if (response?.success) {
                // Add to local messages
                this.messages.push({
                    id: Date.now().toString(),
                    from: this.myAgentId || 'You (Fuse)',
                    to: 'page',
                    content,
                    timestamp: Date.now(),
                    type: 'text',
                    metadata,
                });
                this.update();
            }
            else {
                console.warn('[GeminiBridge] Failed to inject message:', response?.error);
            }
        });
    }
    /**
     * Send unified message - injects to page chat AND syncs to relay if connected
     */
    sendUnifiedMessage() {
        const input = this.container?.querySelector('[data-input="message"]');
        if (!input || !input.value.trim())
            return;
        const content = input.value.trim();
        input.value = '';
        // CRITICAL: Ensure we have a valid page agent ID before sending
        // Without this, the message will have wrong senderId and cause self-injection loops
        if (!this.myAgentId || !this.myAgentId.startsWith('page-agent-')) {
            console.error('[GeminiBridge] Cannot send message: myAgentId is not set correctly!', {
                myAgentId: this.myAgentId,
                expected: 'page-agent-XXXXX',
            });
            // Try to recover by requesting page agent ID again
            alert('Connection not ready. Please wait a moment and try again.');
            input.value = content; // Put the content back
            return;
        }
        console.log('[GeminiBridge] Sending unified message:', {
            content: content.substring(0, 50),
            myAgentId: this.myAgentId,
        });
        const metadata = {
            senderId: this.myAgentId, // Guaranteed to be a valid page-agent ID now
            source: 'floating-panel-unified',
        };
        // Add user message to local display immediately with unique ID
        const msgId = `user-${Date.now()}`;
        this.messages.push({
            id: msgId,
            from: this.myAgentId,
            to: 'AI',
            content,
            timestamp: Date.now(),
            type: 'text',
            metadata,
        });
        this.update();
        // If connected to relay and has a channel, sync the user message
        if (this.connectionStatus === 'connected' && this.currentChannel) {
            const broadcastKey = `user:${content}`;
            const lastSent = this.recentBroadcasts.get(broadcastKey);
            // Only broadcast if we haven't sent this exact message in the last 3 seconds
            if (!lastSent || Date.now() - lastSent > 3000) {
                this.recentBroadcasts.set(broadcastKey, Date.now());
                // Clean up old entries
                for (const [key, time] of this.recentBroadcasts.entries()) {
                    if (Date.now() - time > 10000) {
                        this.recentBroadcasts.delete(key);
                    }
                }
                this.safeSendMessage({
                    type: 'BROADCAST_MESSAGE',
                    content: `[User → AI] ${content}`,
                    channel: this.currentChannel,
                    metadata,
                });
            }
            else {
                console.log('[GeminiBridge] Skipping duplicate user message broadcast');
            }
        }
        // Inject message into page chat
        this.safeSendMessage({
            type: 'INJECT_MESSAGE',
            content,
            metadata,
        }, (response) => {
            if (!response?.success) {
                console.warn('[GeminiBridge] Failed to inject message:', response?.error);
                // Update message to show error
                const msg = this.messages.find((m) => m.content === content);
                if (msg) {
                    msg.content = `❌ ${content} (failed to send)`;
                    this.update();
                }
            }
            // Note: AI response will be captured by the content script's response polling
            // and forwarded via RESPONSE_COMPLETE message to handleChromeMessage
        });
    }
    /**
     * Join channel
     */
    joinChannel(channelId) {
        this.currentChannel = channelId;
        this.safeSendMessage({
            type: 'CHANNEL_JOIN',
            channelId,
        });
        this.update();
    }
    /**
     * Select channel from dropdown (can be null to disconnect)
     */
    selectChannel(channelId) {
        const previousChannel = this.currentChannel;
        this.currentChannel = channelId;
        console.log(`[GeminiBridge] Panel ${this.panelId} switching channel: ${previousChannel} → ${channelId}`);
        if (channelId) {
            this.safeSendMessage({
                type: 'CHANNEL_JOIN',
                channelId,
                panelId: this.panelId,
            });
        }
        else {
            this.safeSendMessage({
                type: 'CHANNEL_LEAVE',
                channelId: previousChannel,
                panelId: this.panelId,
            });
        }
        this.update();
    }
    /**
     * Create channel (legacy - using prompt)
     */
    createChannel() {
        const name = prompt('Enter channel name:');
        if (name) {
            this.safeSendMessage({
                type: 'CHANNEL_CREATE',
                name,
            });
        }
    }
    /**
     * Submit create channel from inline form
     */
    submitCreateChannel() {
        const input = this.container?.querySelector('#fuse-new-channel-name');
        console.log('[GeminiBridge] submitCreateChannel called. Input found:', !!input, 'Value:', input?.value);
        if (!input || !input.value.trim()) {
            console.warn('[GeminiBridge] No channel name entered');
            return;
        }
        const normalizedName = input.value.trim().replace(/\s+/g, ' ');
        const existing = this.channels.find((ch) => ch.name.trim().replace(/\s+/g, ' ').toLowerCase() === normalizedName.toLowerCase());
        if (existing) {
            console.warn('[GeminiBridge] Duplicate channel name blocked:', normalizedName);
            input.value = '';
            this.selectChannel(existing.id);
            return;
        }
        const name = normalizedName;
        input.value = ''; // Clear input
        console.log('[GeminiBridge] Creating channel:', name);
        // Use safe send with error handling
        this.safeSendMessage({
            type: 'CHANNEL_CREATE',
            name,
        }, (response) => {
            if (response?.success || response?.channelId) {
                console.log('[GeminiBridge] Channel created successfully:', response.channelId);
                // The channels will be updated via CHANNELS_UPDATE message
            }
            else if (response?.alreadyExists && response?.channel?.id) {
                this.selectChannel(response.channel.id);
            }
        });
    }
    /**
     * Delete a channel (Admin only or creator - enforced by relay)
     */
    deleteChannel(channelId) {
        if (channelId === 'general') {
            alert('The General channel cannot be deleted.');
            return;
        }
        const ch = this.channels.find((c) => c.id === channelId);
        const name = ch ? ch.name : channelId;
        if (!confirm(`Are you sure you want to delete the channel "${name}"?`)) {
            return;
        }
        console.log('[GeminiBridge] Deleting channel:', channelId);
        this.safeSendMessage({
            type: 'CHANNEL_DELETE',
            channelId,
        }, (response) => {
            if (response?.success) {
                console.log('[GeminiBridge] Channel delete request sent');
                // Optimistically remove from local list
                this.channels = this.channels.filter((c) => c.id !== channelId);
                if (this.currentChannel === channelId) {
                    this.currentChannel = null;
                }
                this.update();
            }
        });
    }
    /**
     * Copy text to clipboard
     */
    copyToClipboard(text, element) {
        navigator.clipboard
            .writeText(text)
            .then(() => {
            if (element) {
                const originalText = element.innerHTML;
                element.innerHTML = '✅';
                setTimeout(() => {
                    element.innerHTML = originalText;
                }, 1500);
            }
        })
            .catch((err) => {
            console.error('[GeminiBridge] Failed to copy:', err);
        });
    }
    /**
     * Safely send a message to Chrome runtime, handling context invalidation
     */
    safeSendMessage(message, callback) {
        if (!this.isContextValid) {
            console.warn('[GeminiBridge] Extension context is invalid, cannot send message');
            this.showContextInvalidatedWarning();
            return;
        }
        try {
            chrome.runtime.sendMessage(message, (response) => {
                // Check for runtime.lastError which indicates context invalidation
                if (chrome.runtime.lastError) {
                    const errorMessage = chrome.runtime.lastError.message || '';
                    if (errorMessage.includes('Extension context invalidated') ||
                        errorMessage.includes('Receiving end does not exist')) {
                        console.error('[GeminiBridge] Extension context invalidated:', errorMessage);
                        this.isContextValid = false;
                        this.showContextInvalidatedWarning();
                        return;
                    }
                    console.warn('[GeminiBridge] Chrome runtime error:', errorMessage);
                }
                if (callback) {
                    callback(response);
                }
            });
        }
        catch (error) {
            console.error('[GeminiBridge] Failed to send message:', error);
            this.isContextValid = false;
            this.showContextInvalidatedWarning();
        }
    }
    /**
     * Show warning that extension context is invalidated and page needs refresh
     */
    showContextInvalidatedWarning() {
        // Only show once
        if (this.container?.querySelector('.fcp6-context-warning'))
            return;
        const warning = document.createElement('div');
        warning.className = 'fcp6-context-warning';
        warning.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, rgba(255,50,50,0.95) 0%, rgba(180,30,30,0.95) 100%);
        color: white;
        padding: 24px 32px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        z-index: 2147483647;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        max-width: 400px;
      ">
        <div style="font-size: 32px; margin-bottom: 12px;">⚠️</div>
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">Extension Reloaded</div>
        <div style="font-size: 13px; opacity: 0.9; margin-bottom: 16px;">
          The Fuse Connect extension was updated. Please refresh this page to continue using it.
        </div>
        <button onclick="location.reload()" style="
          background: white;
          color: #c00;
          border: none;
          padding: 10px 24px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        ">Refresh Page</button>
      </div>
    `;
        document.body.appendChild(warning);
    }
    /**
     * Handle service action (start/stop/restart)
     */
    handleServiceAction(action) {
        const target = this.container?.querySelector(`[data-action="${action}"]`);
        const serviceId = target?.getAttribute('data-service');
        if (!serviceId)
            return;
        const actionType = action.replace('-service', '').toUpperCase();
        this.safeSendMessage({
            type: 'SERVICE_CONTROL',
            action: actionType,
            serviceId,
        }, (response) => {
            if (response?.success) {
                this.addNotification({
                    id: Date.now().toString(),
                    title: 'Service ' + actionType.toLowerCase() + 'ed',
                    message: `${serviceId} service ${actionType.toLowerCase()}ed successfully`,
                    type: 'success',
                    priority: 'normal',
                    timestamp: Date.now(),
                    read: false,
                });
            }
            this.update();
        });
    }
    /**
     * Start all services
     */
    startAllServices() {
        this.safeSendMessage({
            type: 'SERVICE_CONTROL',
            action: 'START_ALL',
        }, (response) => {
            if (response?.success) {
                this.addNotification({
                    id: Date.now().toString(),
                    title: 'All Services Started',
                    message: 'All TNF services have been started',
                    type: 'success',
                    priority: 'normal',
                    timestamp: Date.now(),
                    read: false,
                });
            }
            this.update();
        });
    }
    /**
     * Open terminal with relay command
     */
    openTerminal() {
        this.safeSendMessage({
            type: 'OPEN_TERMINAL',
            command: 'pnpm relay:start',
        });
    }
    /**
     * Check health of all services
     */
    checkServiceHealth() {
        // Request health check from background script
        this.safeSendMessage({
            type: 'CHECK_SERVICE_HEALTH',
        }, (response) => {
            if (response?.services) {
                // Update service statuses
                for (const [serviceId, status] of Object.entries(response.services)) {
                    this.serviceStatuses.set(serviceId, status);
                }
                this.update();
            }
        });
        // Also update relay status based on connection
        if (this.connectionStatus === 'connected') {
            this.serviceStatuses.set('relay', 'online');
        }
        else {
            this.serviceStatuses.set('relay', 'offline');
        }
        this.update();
    }
    /**
     * Save settings from the settings tab
     */
    saveSettings() {
        const relayUrl = this.container?.querySelector('[data-setting="relayUrl"]');
        const autoReconnect = this.container?.querySelector('[data-setting="autoReconnect"]');
        const opacity = this.container?.querySelector('[data-setting="opacity"]');
        const alwaysOnTop = this.container?.querySelector('[data-setting="alwaysOnTop"]');
        const debugMode = this.container?.querySelector('[data-setting="debugMode"]');
        const settings = {
            relayUrl: relayUrl?.value || 'ws://localhost:3000/ws',
            autoReconnect: autoReconnect?.checked ?? true,
            opacity: parseFloat(opacity?.value || '1'),
            alwaysOnTop: alwaysOnTop?.checked ?? false,
            debugMode: debugMode?.checked ?? false,
        };
        // Update state
        this.state.opacity = settings.opacity;
        this.state.isPinned = settings.alwaysOnTop;
        // Apply opacity
        if (this.container) {
            this.container.style.opacity = String(settings.opacity);
        }
        // Save to storage
        chrome.storage.local.set({ fuse_settings: settings }, () => {
            this.addNotification({
                id: Date.now().toString(),
                title: 'Settings Saved',
                message: 'Your settings have been saved successfully',
                type: 'success',
                priority: 'normal',
                timestamp: Date.now(),
                read: false,
            });
            this.update();
        });
        // Send to background for relay URL update
        this.safeSendMessage({
            type: 'UPDATE_SETTINGS',
            settings,
        });
        this.saveState();
    }
    /**
     * Reset settings to defaults
     */
    resetSettings() {
        if (!confirm('Are you sure you want to reset all settings to defaults?'))
            return;
        const defaults = {
            relayUrl: 'ws://localhost:3000/ws',
            autoReconnect: true,
            opacity: 1,
            alwaysOnTop: false,
            debugMode: false,
        };
        this.state.opacity = 1;
        this.state.isPinned = false;
        if (this.container) {
            this.container.style.opacity = '1';
        }
        chrome.storage.local.set({ fuse_settings: defaults }, () => {
            this.addNotification({
                id: Date.now().toString(),
                title: 'Settings Reset',
                message: 'All settings have been reset to defaults',
                type: 'info',
                priority: 'normal',
                timestamp: Date.now(),
                read: false,
            });
            this.update();
        });
        this.safeSendMessage({
            type: 'UPDATE_SETTINGS',
            settings: defaults,
        });
    }
    /**
     * Mark notifications as read
     */
    markNotificationsRead() {
        this.notifications.forEach((n) => (n.read = true));
        this.unreadCount = 0;
        this.update();
    }
    /**
     * Handle Chrome messages
     */
    handleChromeMessage(message) {
        switch (message.type) {
            case 'CONNECTION_STATUS':
                this.connectionStatus = message.status;
                this.update();
                break;
            case 'AGENTS_UPDATE':
                this.agents = message.agents || [];
                this.update();
                break;
            case 'NEW_MESSAGE':
                // MULTI-AGENT COLLABORATION:
                // This is a chatroom model. Every participant (human + AI agents) should see all messages.
                // Messages from OTHER agents should be injected into our local chat so our AI can respond.
                // Messages from OURSELVES should NOT be re-injected (prevents loops).
                if (message.message) {
                    const msg = message.message;
                    // PRIMARY SELF-DETECTION: Use metadata.senderId (most reliable)
                    const senderIdFromMeta = msg.metadata?.senderId;
                    const isFromSelf = senderIdFromMeta === this.myAgentId ||
                        msg.from === this.myAgentId ||
                        senderIdFromMeta === this.browserAgentId ||
                        msg.from === this.browserAgentId;
                    // FALLBACK SELF-DETECTION: Check common self-identifiers
                    const isFromSelfFallback = msg.from === 'You' || msg.from === 'You (Fuse)';
                    const isOwnMessage = isFromSelf || isFromSelfFallback;
                    if (isOwnMessage) {
                        console.log('[GeminiBridge] Identified self-message');
                    }
                    // DEDUPE LOCK: Prevent optimistic local entries + relay roundtrip echoes from rendering twice.
                    const normalizeContent = (value) => String(value || '')
                        .replace(/\s+/g, ' ')
                        .trim();
                    const incomingContent = normalizeContent(msg.content);
                    const incomingTs = typeof msg.timestamp === 'number' ? msg.timestamp : Date.now();
                    const incomingSender = (msg.metadata?.senderId || msg.from || '').toString().trim().toLowerCase() || 'unknown';
                    const isDuplicate = this.messages.some((m) => {
                        if (msg.id && m.id === msg.id)
                            return true;
                        const storedContent = normalizeContent(m.content);
                        if (!storedContent || storedContent !== incomingContent)
                            return false;
                        const storedSender = (m.metadata?.senderId || m.from || '').toString().trim().toLowerCase() || 'unknown';
                        const sameSender = storedSender === incomingSender ||
                            (isOwnMessage &&
                                (m.from === 'You' ||
                                    m.from === 'You (Fuse)' ||
                                    m.from === this.myAgentId ||
                                    storedSender === (this.myAgentId || '').toLowerCase()));
                        if (!sameSender)
                            return false;
                        const storedTs = typeof m.timestamp === 'number' ? m.timestamp : 0;
                        // Some relay messages may omit timestamp; compare against "now" in that case.
                        return Math.abs(storedTs - incomingTs) < 15000 || Date.now() - storedTs < 15000;
                    });
                    if (isDuplicate) {
                        console.log('[GeminiBridge] Deduped message (already shown):', msg.id || 'local');
                        break;
                    }
                    // Add ALL messages to chat display (this is a chatroom - everyone sees everything)
                    this.messages.push(msg);
                    if (this.messages.length > 50)
                        this.messages.shift();
                    this.update();
                    // INJECTION LOGIC for multi-agent collaboration:
                    // - If message is from SELF: Don't inject (we already sent it or it's our AI's response)
                    // - If message is from ANOTHER agent: INJECT so our AI can see and respond
                    //
                    // The key distinction: isOwnMessage means this message originated from THIS tab.
                    // If it's from another tab/agent, we want our AI to see it and potentially respond.
                    console.log('[GeminiBridge] NEW_MESSAGE processing:', {
                        from: msg.from,
                        isOwnMessage,
                        senderId: msg.metadata?.senderId,
                        myAgentId: this.myAgentId,
                        messageType: msg.messageType,
                        contentPreview: msg.content?.substring(0, 50),
                    });
                    if (!isOwnMessage && msg.content) {
                        // This message is from ANOTHER participant.
                        // NOTE: We do NOT need to request injection here because `content/index.ts`
                        // already handles injection for all tabs (active and background) via its own
                        // NEW_MESSAGE handler.
                        //
                        // Requesting injection here causes DOUBLE INJECTION on the active tab:
                        // 1. content/index.ts injects it directly
                        // 2. FloatingPanel adds it here -> sends INJECT_MESSAGE to background -> background sends to active tab -> content/index.ts injects it AGAIN
                        //
                        // This double injection causes race conditions where messages get cleared/overwritten
                        // and often results in the message getting "stuck" in the input field.
                        console.log('[GeminiBridge] External message received (display only):', msg.from, msg.metadata?.platform);
                    }
                    else if (isOwnMessage) {
                        console.log('[GeminiBridge] Not injecting own message (self-detection)');
                    }
                }
                break;
            case 'CHANNELS_UPDATE':
                this.channels = message.channels || [];
                this.update();
                break;
            case 'JOINED_CHANNELS_UPDATE':
                // Update any local state tracking joined channels if necessary
                // For now, we mainly rely on currentChannel, but this ensures we have the data
                console.log('[GeminiBridge] Joined channels updated:', message.joinedChannels);
                this.update();
                break;
            case 'CHANNEL_SELECTED':
                this.currentChannel = message.channelId || null;
                this.update();
                break;
            case 'CHANNEL_PAUSE_UPDATE':
                if (Array.isArray(message.pausedChannels)) {
                    this.pausedChannels = new Set(message.pausedChannels.map((id) => String(id)));
                }
                else if (message.channelId) {
                    const channelId = String(message.channelId);
                    if (message.paused)
                        this.pausedChannels.add(channelId);
                    else
                        this.pausedChannels.delete(channelId);
                }
                this.update();
                break;
            case 'NOTIFICATION':
                this.addNotification(message.notification);
                break;
            case 'CHAT_DETECTED':
                this.chatElements = message.elements;
                this.update();
                break;
            case 'TRANSCRIPT_UPDATE':
                if (message.entry) {
                    const entry = message.entry;
                    // Add to local messages if not already present (dedupe by id)
                    const id = entry.id || `transcript-${entry.ts}-${entry.seq}`;
                    if (!this.messages.some((m) => m.id === id)) {
                        this.messages.push({
                            id,
                            from: entry.role === 'user'
                                ? this.myAgentId || 'You'
                                : entry.role === 'assistant'
                                    ? 'AI (Edge)'
                                    : entry.role,
                            to: entry.role === 'user' ? 'AI' : 'User',
                            content: entry.content,
                            timestamp: entry.ts,
                            type: 'text',
                            metadata: entry.meta,
                        });
                        this.update();
                    }
                }
                break;
            case 'STREAMING_UPDATE':
                this.streamingState = message.state;
                this.update();
                break;
            case 'AI_VIDEO_PROCESSING_UPDATE':
                this.aiVideoState.isProcessing = !!message.state?.isProcessing;
                this.aiVideoState.isPaused = !!message.state?.isPaused;
                this.aiVideoState.currentIndex = Number(message.state?.currentIndex || 0);
                this.aiVideoState.totalCount = Number(message.state?.totalCount || 0);
                this.aiVideoState.queueCount = Math.max(this.aiVideoState.queueCount, this.aiVideoState.totalCount);
                this.update();
                break;
            case 'RESPONSE_COMPLETE':
                // RESTORED FROM BACKUP: Only add to local UI, do NOT broadcast
                console.log('[GeminiBridge] RESPONSE_COMPLETE received:', {
                    hasContent: !!message.content,
                    connectionStatus: this.connectionStatus,
                    currentChannel: this.currentChannel,
                });
                // When relay is connected, this response will come back via NEW_MESSAGE.
                // Skip local append here to avoid duplicate AI messages.
                if (this.connectionStatus === 'connected' && this.currentChannel) {
                    console.log('[GeminiBridge] Skipping local RESPONSE_COMPLETE append (relay-connected)');
                    break;
                }
                if (message.content) {
                    let responseContent = typeof message.content === 'string'
                        ? message.content
                        : message.content?.substring(0, 500) || 'Response received';
                    // Strip any relay prefixes from the response content
                    responseContent = responseContent
                        .replace(/^\[User → AI\]\s*/g, '')
                        .replace(/^\[AI → User\]\s*/g, '')
                        .replace(/^\[AI Response\]\s*/g, '')
                        .trim();
                    // Skip if content is empty after stripping or if it still contains embedded prefixes
                    if (!responseContent ||
                        responseContent.includes('[User → AI]') ||
                        responseContent.includes('[AI → User]') ||
                        responseContent.includes('[AI Response]')) {
                        console.log('[GeminiBridge] Skipping response with embedded prefixes');
                        break;
                    }
                    // Check for duplicate
                    const recentDuplicate = this.messages.some((m) => m.from === 'AI (Page)' &&
                        m.content === responseContent &&
                        Date.now() - m.timestamp < 5000);
                    if (!recentDuplicate) {
                        this.messages.push({
                            id: `ai-${Date.now()}`,
                            from: 'AI (Page)',
                            to: 'You',
                            content: responseContent,
                            timestamp: Date.now(),
                            type: 'text',
                        });
                        this.update();
                    }
                    else {
                        console.log('[GeminiBridge] Skipping duplicate response');
                    }
                    // NOTE: We do NOT broadcast AI responses automatically.
                    // This was causing the self-injection loop.
                    // Users can manually share AI responses if desired.
                }
                break;
            case 'TASK_ASSIGN':
                const task = message.task;
                if (task) {
                    // Check for duplicate
                    if (!this.tasks.some((t) => t.id === task.id)) {
                        this.tasks.unshift(task);
                        this.unreadCount++;
                        this.addNotification({
                            id: Date.now().toString(),
                            type: 'info',
                            title: 'New Task Assigned',
                            message: task.title,
                            priority: 'normal',
                            timestamp: Date.now(),
                            read: false,
                        });
                        this.update();
                    }
                }
                break;
        }
    }
    /**
     * Add notification
     */
    addNotification(notification) {
        this.notifications.unshift(notification);
        if (this.notifications.length > 50)
            this.notifications.pop();
        this.unreadCount++;
        this.update();
        // Show desktop notification if enabled
        if (Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: chrome.runtime.getURL('icons/icon48.png'),
            });
        }
    }
    /**
     * Update UI
     */
    /**
     * Update UI
     */
    update() {
        if (!this.container)
            return;
        // Save scroll position if chat is open
        let scrollTop = 0;
        const chatScroll = this.container.querySelector('#fuse-chat-scroll');
        if (chatScroll) {
            scrollTop = chatScroll.scrollTop;
        }
        // Save input value
        const input = this.container.querySelector('[data-input="message"]');
        const inputValue = input ? input.value : '';
        // Save channel name input value
        const channelInput = this.container.querySelector('#fuse-new-channel-name');
        const channelInputValue = channelInput ? channelInput.value : '';
        // Re-render
        this.container.innerHTML = this.render();
        // Restore input value
        const newInput = this.container.querySelector('[data-input="message"]');
        if (newInput && inputValue) {
            newInput.value = inputValue;
        }
        // Restore channel name input value
        const newChannelInput = this.container.querySelector('#fuse-new-channel-name');
        if (newChannelInput && channelInputValue) {
            newChannelInput.value = channelInputValue;
            // If it had focus, we should try to restore focus too, but simple value restore helps most
        }
        // Apply styles/position
        this.applyPositionAndSize();
        // Re-attach listeners
        this.setupListeners();
        // Restore scroll position or scroll to bottom if it was at bottom
        const newChatScroll = this.container.querySelector('#fuse-chat-scroll');
        if (newChatScroll) {
            // If was near bottom, scroll to bottom (auto-scroll)
            // Otherwise restore position
            const wasNearBottom = chatScroll && chatScroll.scrollHeight - chatScroll.scrollTop - chatScroll.clientHeight < 50;
            if (wasNearBottom) {
                newChatScroll.scrollTop = newChatScroll.scrollHeight;
            }
            else {
                newChatScroll.scrollTop = scrollTop;
            }
        }
    }
    // Utility methods
    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    truncate(text, len) {
        return text.length > len ? text.slice(0, len) + '...' : text;
    }
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    getAgentIcon(platform) {
        const icons = {
            'chrome-extension': '🌐',
            vscode: '🔷',
            antigravity: '🌌',
            'electron-desktop': '🖥️',
            'theia-ide': '💻',
            'api-gateway': '🚀',
            'backend-service': '⚙️',
            saas: '☁️',
        };
        return icons[platform] || '🤖';
    }
    /**
     * Update chat detection state
     */
    updateChatElements(elements) {
        this.chatElements = elements;
        this.update();
    }
    /**
     * Set the Page Agent ID for this panel
     */
    setAgentId(id) {
        console.log('[GeminiBridge] Panel assigned Agent ID:', id);
        this.myAgentId = id;
        this.update(); // Update UI if needed (e.g. to show ID)
    }
    /**
     * Get the current channel this panel is connected to
     */
    getCurrentChannel() {
        return this.currentChannel;
    }
    /**
     * Update streaming state
     */
    updateStreamingState(state) {
        this.streamingState = state;
        this.update();
    }
    /**
     * Show the panel
     */
    show() {
        if (!this.container) {
            this.inject();
        }
        if (this.container) {
            this.container.style.display = 'block';
            this.state.mode = 'expanded'; // FORCE expanded on show
            this.applyPositionAndSize();
            this.update(); // Add update to ensure render state matches
        }
    }
    /**
     * Hide the panel
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }
    /**
     * Check if panel is visible
     */
    isVisible() {
        return this.container?.style.display !== 'none';
    }
    /**
     * Handle messages from background/popup/content script
     */
    handleMessage(message) {
        this.handleChromeMessage(message);
    }
    /**
    /**
     * Destroy panel
     */
    destroy() {
        // Remove Chrome message listener to prevent memory leaks and duplicate handlers
        if (this.chromeMessageListener) {
            chrome.runtime.onMessage.removeListener(this.chromeMessageListener);
            this.chromeMessageListener = null;
        }
        // Remove storage listener
        if (this.storageListener) {
            chrome.storage.onChanged.removeListener(this.storageListener);
            this.storageListener = null;
        }
        if (this.container && this.containerClickListener) {
            this.container.removeEventListener('click', this.containerClickListener);
            this.containerClickListener = null;
        }
        if (this.container && this.containerKeydownListener) {
            this.container.removeEventListener('keydown', this.containerKeydownListener);
            this.containerKeydownListener = null;
        }
        // Clear health poll interval
        if (this.healthPollInterval) {
            clearInterval(this.healthPollInterval);
            this.healthPollInterval = null;
        }
        this.container?.remove();
        document.getElementById('fuse-connect-styles-v7')?.remove();
    }
    /**
    /**
     * Handle generic actions from data-action attributes
     */
    handleAction(action, element) {
        switch (action) {
            case 'send':
                this.sendMessage();
                break;
            case 'pin':
                this.togglePin();
                break;
            case 'minimize':
                this.minimize();
                break;
            case 'toggle':
                this.toggleCollapse();
                break;
            case 'expand':
                this.expand();
                break;
            case 'copy-to-clipboard':
                if (element && element.dataset.value) {
                    this.copyToClipboard(element.dataset.value, element);
                }
                break;
            case 'select-channel':
                // Handled by change listener, but good to have case
                break;
            case 'delete-channel':
                if (element && element.dataset.channelId) {
                    this.deleteChannel(element.dataset.channelId);
                }
                break;
            case 'inject-to-chat':
                this.injectToPageChat();
                break;
            case 'toggle-channel-pause':
                this.toggleCurrentChannelPause();
                break;
            case 'accept-task':
                if (element && element.dataset.taskId) {
                    const taskId = element.dataset.taskId;
                    const task = this.tasks.find((t) => t.id === taskId);
                    if (task) {
                        // Construct prompt
                        const prompt = `[SYSTEM TASK ASSIGNMENT]\nTitle: ${task.title}\nDescription: ${task.description}\nInstructions:\n${task.instructions.map((i) => `- ${i}`).join('\n')}\n\nPlease execute this task.`;
                        // Inject
                        this.safeSendMessage({
                            type: 'INJECT_MESSAGE',
                            content: prompt,
                            metadata: { isTask: true, taskId: task.id },
                        }, (response) => {
                            if (response?.success) {
                                // Add system message indicating start
                                this.messages.push({
                                    id: `sys-${Date.now()}`,
                                    from: 'System',
                                    to: 'You',
                                    content: `Task "${task.title}" started.`,
                                    timestamp: Date.now(),
                                    type: 'text',
                                    metadata: { isSystemMessage: true },
                                });
                                this.update();
                            }
                        });
                        // Remove from local list (mark as in progress basically)
                        this.tasks = this.tasks.filter((t) => t.id !== taskId);
                        this.update();
                    }
                }
                break;
            case 'reject-task':
                if (element && element.dataset.taskId) {
                    this.tasks = this.tasks.filter((t) => t.id !== element.dataset.taskId);
                    this.update();
                }
                break;
            default:
                // Check if it's a service action
                if (action.endsWith('-service')) {
                    this.handleServiceAction(action);
                }
                else if (action === 'start-all-services') {
                    this.startAllServices();
                }
                else if (action === 'open-terminal') {
                    this.openTerminal();
                }
                else if (action === 'check-health') {
                    this.checkServiceHealth();
                }
                else if (action === 'save-settings') {
                    this.saveSettings();
                }
                else if (action === 'reset-settings') {
                    this.resetSettings();
                }
                else if (action === 'copy-event-logs') {
                    this.copyEventLogs();
                }
                else if (action === 'clear-event-logs') {
                    this.clearEventLogs();
                }
                else if (action === 'submit-create-channel') {
                    this.submitCreateChannel();
                }
        }
    }
    switchTab(tab) {
        this.state.activeTab = tab;
        // Persist active tab
        this.saveState();
        this.update();
    }
    toggleCurrentChannelPause() {
        if (!this.currentChannel)
            return;
        const channelId = this.currentChannel;
        const isPaused = this.pausedChannels.has(channelId);
        this.safeSendMessage({
            type: isPaused ? 'CHANNEL_RESUME' : 'CHANNEL_PAUSE',
            channelId,
        }, (response) => {
            if (!response?.success) {
                console.warn('[GeminiBridge] Failed to toggle channel pause:', response?.error);
            }
        });
    }
    copyEventLogs() {
        this.safeSendMessage({ type: 'GET_EVENT_LOGS', limit: 1000 }, async (response) => {
            if (!response?.success) {
                console.warn('[GeminiBridge] Failed to fetch event logs');
                return;
            }
            const payload = JSON.stringify(response.logs || [], null, 2);
            try {
                await navigator.clipboard.writeText(payload);
                this.addNotification({
                    id: Date.now().toString(),
                    type: 'success',
                    title: 'Event Logs Copied',
                    message: `Copied ${(response.logs || []).length} log entries`,
                    priority: 'normal',
                    timestamp: Date.now(),
                    read: false,
                });
            }
            catch (e) {
                console.error('[GeminiBridge] Failed to copy event logs:', e);
            }
        });
    }
    clearEventLogs() {
        this.safeSendMessage({ type: 'CLEAR_EVENT_LOGS' }, (response) => {
            if (response?.success) {
                this.addNotification({
                    id: Date.now().toString(),
                    type: 'info',
                    title: 'Event Logs Cleared',
                    message: 'Background event log storage has been reset',
                    priority: 'normal',
                    timestamp: Date.now(),
                    read: false,
                });
            }
            else {
                console.warn('[GeminiBridge] Failed to clear event logs:', response?.error);
            }
        });
    }
    /**
     * Toggle pin state
     */
    togglePin() {
        this.state.isPinned = !this.state.isPinned;
        const btn = this.container?.querySelector('#fuse-btn-pin');
        if (btn) {
            btn.innerHTML = this.state.isPinned ? '📌' : '📍';
        }
        this.saveState();
    }
    /**
     * Minimize panel
     */
    minimize() {
        this.state.mode = 'minimized';
        this.saveState();
        this.update();
    }
    /**
     * Expand panel
     */
    expand() {
        this.state.mode = 'expanded';
        this.saveState();
        this.update();
    }
    /**
     * Toggle collapse state
     */
    toggleCollapse() {
        if (this.state.mode === 'collapsed') {
            this.state.mode = 'expanded';
        }
        else {
            this.state.mode = 'collapsed';
        }
        this.saveState();
        this.update();
    }
}
function createEnhancedFloatingPanel(options) {
    return new EnhancedFloatingPanel(options);
}

;// ./src/v6/content/utils/AccessibilityTree.ts
/**
 * Fuse Connect v7 - Accessibility Tree Generator
 * Generates a structured tree of interactive elements on any page
 * Inspired by Claude extension's accessibility-tree.js
 */
// Role mapping based on HTML elements
const ROLE_MAP = {
    a: 'link',
    button: 'button',
    input: 'textbox',
    select: 'combobox',
    textarea: 'textbox',
    h1: 'heading',
    h2: 'heading',
    h3: 'heading',
    h4: 'heading',
    h5: 'heading',
    h6: 'heading',
    img: 'image',
    nav: 'navigation',
    main: 'main',
    header: 'banner',
    footer: 'contentinfo',
    section: 'region',
    article: 'article',
    aside: 'complementary',
    form: 'form',
    table: 'table',
    ul: 'list',
    ol: 'list',
    li: 'listitem',
    label: 'label',
};
// Elements to skip
const SKIP_ELEMENTS = ['script', 'style', 'meta', 'link', 'title', 'noscript'];
// Interactive elements
const INTERACTIVE_ELEMENTS = ['a', 'button', 'input', 'select', 'textarea', 'details', 'summary'];
// Landmark elements
const LANDMARK_ELEMENTS = [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'nav',
    'main',
    'header',
    'footer',
    'section',
    'article',
    'aside',
];
class AccessibilityTreeGenerator {
    constructor() {
        this.elementMap = new Map();
        this.refCounter = 0;
        // Initialize global map for cross-session persistence
        if (!window.__fuseElementMap) {
            window.__fuseElementMap = new Map();
        }
        if (!window.__fuseRefCounter) {
            window.__fuseRefCounter = 0;
        }
        this.elementMap = window.__fuseElementMap;
        this.refCounter = window.__fuseRefCounter;
    }
    /**
     * Generate accessibility tree
     */
    generateTree(options = {}) {
        const { filter = 'all', maxDepth = 15, refId } = options;
        const lines = [];
        const nodes = [];
        try {
            // If refId provided, start from that element
            if (refId) {
                const ref = this.elementMap.get(refId);
                if (!ref) {
                    return {
                        tree: '',
                        nodes: [],
                        viewport: this.getViewport(),
                        error: `Element with ref_id '${refId}' not found. It may have been removed from the page.`,
                    };
                }
                const element = ref.ref.deref();
                if (!element) {
                    this.elementMap.delete(refId);
                    return {
                        tree: '',
                        nodes: [],
                        viewport: this.getViewport(),
                        error: `Element with ref_id '${refId}' no longer exists in the DOM.`,
                    };
                }
                this.processElement(element, 0, maxDepth, filter, refId !== undefined, lines, nodes);
            }
            else {
                // Start from body
                if (document.body) {
                    this.processElement(document.body, 0, maxDepth, filter, false, lines, nodes);
                }
            }
            // Cleanup stale refs
            this.cleanupRefs();
            // Update global counter
            window.__fuseRefCounter = this.refCounter;
            const tree = lines.join('\n');
            // Check size limit
            if (tree.length > 50000) {
                return {
                    tree: '',
                    nodes: [],
                    viewport: this.getViewport(),
                    error: `Output exceeds 50000 character limit (${tree.length} characters). Try using a smaller depth or focusing on a specific element.`,
                };
            }
            return { tree, nodes, viewport: this.getViewport() };
        }
        catch (error) {
            return {
                tree: '',
                nodes: [],
                viewport: this.getViewport(),
                error: `Error generating accessibility tree: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Process a single element
     */
    processElement(element, depth, maxDepth, filter, hasRefId, lines, nodes) {
        if (depth > maxDepth)
            return;
        if (!element || !element.tagName)
            return;
        const tagName = element.tagName.toLowerCase();
        if (SKIP_ELEMENTS.includes(tagName))
            return;
        const shouldInclude = this.shouldIncludeElement(element, filter, hasRefId);
        if (shouldInclude) {
            const role = this.getRole(element);
            const label = this.getLabel(element);
            const refId = this.getOrCreateRefId(element);
            // Build tree line
            let line = '  '.repeat(depth) + role;
            if (label) {
                const cleanLabel = label.replace(/\s+/g, ' ').substring(0, 100).replace(/"/g, '\\"');
                line += ` "${cleanLabel}"`;
            }
            line += ` [${refId}]`;
            // Add important attributes
            const attrs = this.getImportantAttributes(element);
            for (const [key, value] of Object.entries(attrs)) {
                line += ` ${key}="${value}"`;
            }
            lines.push(line);
            nodes.push({
                role,
                label,
                refId,
                depth,
                attributes: attrs,
            });
        }
        // Process children
        if (element.children && depth < maxDepth) {
            for (let i = 0; i < element.children.length; i++) {
                const child = element.children[i];
                this.processElement(child, shouldInclude ? depth + 1 : depth, maxDepth, filter, hasRefId, lines, nodes);
            }
        }
    }
    /**
     * Determine if element should be included
     */
    shouldIncludeElement(element, filter, hasRefId) {
        const tagName = element.tagName.toLowerCase();
        // Skip hidden elements unless we have a specific refId
        if (filter !== 'all' && !hasRefId) {
            if (element.getAttribute('aria-hidden') === 'true')
                return false;
            if (!this.isVisible(element))
                return false;
            if (!this.isInViewport(element))
                return false;
        }
        // Interactive filter
        if (filter === 'interactive') {
            return this.isInteractive(element);
        }
        // Include interactive elements
        if (this.isInteractive(element))
            return true;
        // Include landmarks
        if (this.isLandmark(element))
            return true;
        // Include elements with labels
        if (this.getLabel(element).length > 0)
            return true;
        // Include elements with explicit roles
        const role = this.getRole(element);
        return role !== 'generic' && role !== 'image';
    }
    /**
     * Get element role
     */
    getRole(element) {
        // Check for explicit role
        const ariaRole = element.getAttribute('role');
        if (ariaRole)
            return ariaRole;
        const tagName = element.tagName.toLowerCase();
        const type = element.getAttribute('type');
        // Special handling for input types
        if (tagName === 'input') {
            if (type === 'submit' || type === 'button')
                return 'button';
            if (type === 'checkbox')
                return 'checkbox';
            if (type === 'radio')
                return 'radio';
            if (type === 'file')
                return 'button';
            return 'textbox';
        }
        return ROLE_MAP[tagName] || 'generic';
    }
    /**
     * Get element label
     */
    getLabel(element) {
        const tagName = element.tagName.toLowerCase();
        // Select elements - use selected option
        if (tagName === 'select') {
            const select = element;
            const option = select.querySelector('option[selected]') || select.options[select.selectedIndex];
            if (option?.textContent?.trim())
                return option.textContent.trim();
        }
        // Aria-label
        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel?.trim())
            return ariaLabel.trim();
        // Placeholder
        const placeholder = element.getAttribute('placeholder');
        if (placeholder?.trim())
            return placeholder.trim();
        // Title
        const title = element.getAttribute('title');
        if (title?.trim())
            return title.trim();
        // Alt (for images)
        const alt = element.getAttribute('alt');
        if (alt?.trim())
            return alt.trim();
        // Associated label
        if (element.id) {
            const label = document.querySelector(`label[for="${element.id}"]`);
            if (label?.textContent?.trim())
                return label.textContent.trim();
        }
        // Input value
        if (tagName === 'input') {
            const input = element;
            const type = element.getAttribute('type') || '';
            const value = element.getAttribute('value');
            if (type === 'submit' && value?.trim())
                return value.trim();
            if (input.value && input.value.length < 50 && input.value.trim())
                return input.value.trim();
        }
        // Text content for buttons/links
        if (['button', 'a', 'summary'].includes(tagName)) {
            let text = '';
            for (let i = 0; i < element.childNodes.length; i++) {
                const node = element.childNodes[i];
                if (node.nodeType === Node.TEXT_NODE) {
                    text += node.textContent || '';
                }
            }
            if (text.trim())
                return text.trim();
        }
        // Headings - full text content
        if (tagName.match(/^h[1-6]$/)) {
            const text = element.textContent;
            if (text?.trim())
                return text.trim().substring(0, 100);
        }
        // Direct text nodes
        let directText = '';
        for (let i = 0; i < element.childNodes.length; i++) {
            const node = element.childNodes[i];
            if (node.nodeType === Node.TEXT_NODE) {
                directText += node.textContent || '';
            }
        }
        if (directText.trim() && directText.trim().length >= 3) {
            const text = directText.trim();
            return text.length > 100 ? text.substring(0, 100) + '...' : text;
        }
        return '';
    }
    /**
     * Get or create a reference ID for an element
     */
    getOrCreateRefId(element) {
        // Check if already mapped
        for (const [id, ref] of this.elementMap.entries()) {
            if (ref.ref.deref() === element) {
                return id;
            }
        }
        // Create new ref
        const refId = `gemini_bridge_ref_${++this.refCounter}`;
        this.elementMap.set(refId, {
            ref: new WeakRef(element),
            role: this.getRole(element),
            label: this.getLabel(element),
        });
        return refId;
    }
    /**
     * Get element by ref ID
     */
    getElementByRefId(refId) {
        const ref = this.elementMap.get(refId);
        if (!ref)
            return null;
        const element = ref.ref.deref();
        if (!element) {
            this.elementMap.delete(refId);
            return null;
        }
        return element;
    }
    /**
     * Get important attributes for an element
     */
    getImportantAttributes(element) {
        const attrs = {};
        // Href for links
        const href = element.getAttribute('href');
        if (href)
            attrs.href = href;
        // Type for inputs
        const type = element.getAttribute('type');
        if (type)
            attrs.type = type;
        // Placeholder
        const placeholder = element.getAttribute('placeholder');
        if (placeholder)
            attrs.placeholder = placeholder;
        // Disabled state
        if (element.hasAttribute('disabled'))
            attrs.disabled = 'true';
        // Checked state
        if (element.checked)
            attrs.checked = 'true';
        return attrs;
    }
    /**
     * Check if element is visible
     */
    isVisible(element) {
        const style = window.getComputedStyle(element);
        if (style.display === 'none')
            return false;
        if (style.visibility === 'hidden')
            return false;
        if (style.opacity === '0')
            return false;
        return element.offsetWidth > 0 && element.offsetHeight > 0;
    }
    /**
     * Check if element is in viewport
     */
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (rect.top < window.innerHeight &&
            rect.bottom > 0 &&
            rect.left < window.innerWidth &&
            rect.right > 0);
    }
    /**
     * Check if element is interactive
     */
    isInteractive(element) {
        const tagName = element.tagName.toLowerCase();
        if (INTERACTIVE_ELEMENTS.includes(tagName))
            return true;
        if (element.getAttribute('onclick'))
            return true;
        if (element.getAttribute('tabindex') !== null)
            return true;
        if (element.getAttribute('role') === 'button')
            return true;
        if (element.getAttribute('role') === 'link')
            return true;
        if (element.getAttribute('contenteditable') === 'true')
            return true;
        return false;
    }
    /**
     * Check if element is a landmark
     */
    isLandmark(element) {
        const tagName = element.tagName.toLowerCase();
        return LANDMARK_ELEMENTS.includes(tagName) || element.getAttribute('role') !== null;
    }
    /**
     * Get viewport dimensions
     */
    getViewport() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
        };
    }
    /**
     * Cleanup stale references
     */
    cleanupRefs() {
        for (const [id, ref] of this.elementMap.entries()) {
            if (!ref.ref.deref()) {
                this.elementMap.delete(id);
            }
        }
    }
    /**
     * Click an element by ref ID
     */
    async clickElement(refId) {
        const element = this.getElementByRefId(refId);
        if (!element)
            return false;
        try {
            element.focus();
            element.click();
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Type into an element by ref ID
     */
    async typeIntoElement(refId, text, options = {}) {
        const element = this.getElementByRefId(refId);
        if (!element)
            return false;
        try {
            element.focus();
            if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                if (options.clear) {
                    element.value = '';
                }
                element.value += text;
                element.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
            }
            else if (element.getAttribute('contenteditable') === 'true') {
                if (options.clear) {
                    element.innerHTML = '';
                }
                element.textContent = (element.textContent || '') + text;
                element.dispatchEvent(new InputEvent('input', { bubbles: true }));
            }
            return true;
        }
        catch {
            return false;
        }
    }
}
// Export singleton
const accessibilityTree = new AccessibilityTreeGenerator();

;// ./src/v6/content/utils/HumanBehaviorSimulator.ts
/**
 * Fuse Connect v7 - Human Behavior Simulator
 *
 * Implements techniques to make browser automation appear more human-like:
 * - Randomized timing and delays
 * - Realistic mouse movements with Bezier curves
 * - Natural typing with variable speed and occasional typos
 * - Human-like scrolling patterns
 * - Session management helpers
 *
 * Based on 2024 best practices for bypassing bot detection.
 */
class HumanBehaviorSimulator {
    constructor() {
        this.lastMousePosition = { x: 0, y: 0 };
        this.isMoving = false;
        // Track actual mouse position when available
        document.addEventListener('mousemove', (e) => {
            if (!this.isMoving) {
                this.lastMousePosition = { x: e.clientX, y: e.clientY };
            }
        });
    }
    // ============================================
    // TIMING & DELAYS
    // ============================================
    /**
     * Wait for a random duration within a range (human-like variance)
     */
    async randomDelay(minMs, maxMs) {
        const delay = this.randomBetween(minMs, maxMs);
        await this.sleep(delay);
    }
    /**
     * Human-like delay with natural distribution (more likely to be near middle)
     */
    async humanDelay(baseMs = 500) {
        // Use gaussian-like distribution
        const variance = baseMs * 0.4;
        const delay = this.gaussianRandom(baseMs, variance);
        await this.sleep(Math.max(50, delay));
    }
    /**
     * Add micro-delays between actions (100-500ms)
     */
    async microPause() {
        await this.randomDelay(100, 500);
    }
    /**
     * Add thinking pause (500-2000ms, like a human reading/thinking)
     */
    async thinkingPause() {
        await this.randomDelay(500, 2000);
    }
    // ============================================
    // MOUSE MOVEMENTS
    // ============================================
    /**
     * Move mouse to target using Bezier curve (natural movement)
     */
    async moveMouse(target, options) {
        const duration = options?.duration ?? this.randomBetween(200, 500);
        const steps = options?.steps ?? Math.max(10, Math.floor(duration / 16));
        const start = { ...this.lastMousePosition };
        const controlPoints = this.generateBezierControlPoints(start, target);
        this.isMoving = true;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const point = this.bezierPoint(t, start, controlPoints[0], controlPoints[1], target);
            // Add slight noise to make movement less perfect
            const noise = this.randomBetween(-2, 2);
            const noisyPoint = {
                x: point.x + noise,
                y: point.y + noise,
            };
            // Dispatch mouse move event
            this.dispatchMouseEvent('mousemove', noisyPoint);
            this.lastMousePosition = noisyPoint;
            await this.sleep(duration / steps);
        }
        this.isMoving = false;
    }
    /**
     * Move to element with human-like behavior
     */
    async moveToElement(element) {
        const rect = element.getBoundingClientRect();
        // Aim for a random point within the element (not always center)
        const targetX = rect.left + this.randomBetween(rect.width * 0.2, rect.width * 0.8);
        const targetY = rect.top + this.randomBetween(rect.height * 0.2, rect.height * 0.8);
        await this.moveMouse({ x: targetX, y: targetY });
    }
    /**
     * Human-like click with optional movement first
     */
    async humanClick(element, options = {}) {
        const { moveFirst = true, prePauseMin = 50, prePauseMax = 150, postPauseMin = 50, postPauseMax = 200, } = options;
        // Move to element first (like a human would)
        if (moveFirst) {
            await this.moveToElement(element);
            await this.randomDelay(prePauseMin, prePauseMax);
        }
        const rect = element.getBoundingClientRect();
        const clickX = rect.left + rect.width / 2;
        const clickY = rect.top + rect.height / 2;
        // Dispatch mousedown, mouseup, click sequence
        this.dispatchMouseEvent('mousedown', { x: clickX, y: clickY }, element);
        await this.sleep(this.randomBetween(50, 120)); // Hold duration
        this.dispatchMouseEvent('mouseup', { x: clickX, y: clickY }, element);
        this.dispatchMouseEvent('click', { x: clickX, y: clickY }, element);
        await this.randomDelay(postPauseMin, postPauseMax);
    }
    /**
     * Double click with human timing
     */
    async humanDoubleClick(element) {
        await this.humanClick(element, { postPauseMin: 50, postPauseMax: 150 });
        await this.humanClick(element, { moveFirst: false });
        this.dispatchMouseEvent('dblclick', this.lastMousePosition, element);
    }
    // ============================================
    // TYPING SIMULATION
    // ============================================
    /**
     * Type text with human-like speed and optional typos
     */
    async humanType(element, text, options = {}) {
        const { minDelay = 50, maxDelay = 150, typoChance = 0.02, // 2% chance of typo
        correctTypos = true, pauseOnPunctuation = true, } = options;
        // Focus the element first
        element.focus();
        await this.microPause();
        const punctuation = ['.', ',', '!', '?', ';', ':'];
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            // Occasionally make a typo and correct it
            if (typoChance > 0 && Math.random() < typoChance && correctTypos) {
                const nearbyKeys = this.getNearbyKeys(char);
                if (nearbyKeys.length > 0) {
                    const typoChar = nearbyKeys[Math.floor(Math.random() * nearbyKeys.length)];
                    await this.typeCharacter(element, typoChar);
                    await this.randomDelay(100, 300);
                    await this.typeBackspace(element);
                    await this.randomDelay(50, 150);
                }
            }
            // Type the actual character
            await this.typeCharacter(element, char);
            // Variable delay between keystrokes
            let delay = this.randomBetween(minDelay, maxDelay);
            // Longer pause after punctuation (thinking time)
            if (pauseOnPunctuation && punctuation.includes(char)) {
                delay += this.randomBetween(100, 400);
            }
            // Occasional longer pauses (like thinking)
            if (Math.random() < 0.05) {
                delay += this.randomBetween(200, 600);
            }
            await this.sleep(delay);
        }
    }
    /**
     * Type a single character with proper events
     */
    async typeCharacter(element, char) {
        const keyCode = char.charCodeAt(0);
        // Dispatch key events
        element.dispatchEvent(new KeyboardEvent('keydown', {
            key: char,
            code: `Key${char.toUpperCase()}`,
            keyCode,
            which: keyCode,
            bubbles: true,
            cancelable: true,
        }));
        element.dispatchEvent(new KeyboardEvent('keypress', {
            key: char,
            code: `Key${char.toUpperCase()}`,
            keyCode,
            which: keyCode,
            bubbles: true,
            cancelable: true,
        }));
        // Update input value
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            element.value += char;
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }
        else if (element.getAttribute('contenteditable') === 'true') {
            // For contenteditable, insert text at cursor
            document.execCommand('insertText', false, char);
        }
        element.dispatchEvent(new KeyboardEvent('keyup', {
            key: char,
            code: `Key${char.toUpperCase()}`,
            keyCode,
            which: keyCode,
            bubbles: true,
            cancelable: true,
        }));
    }
    /**
     * Type backspace
     */
    async typeBackspace(element) {
        element.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Backspace',
            code: 'Backspace',
            keyCode: 8,
            which: 8,
            bubbles: true,
            cancelable: true,
        }));
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            element.value = element.value.slice(0, -1);
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }
        else if (element.getAttribute('contenteditable') === 'true') {
            document.execCommand('delete', false);
        }
        element.dispatchEvent(new KeyboardEvent('keyup', {
            key: 'Backspace',
            code: 'Backspace',
            keyCode: 8,
            which: 8,
            bubbles: true,
            cancelable: true,
        }));
    }
    // ============================================
    // SCROLLING
    // ============================================
    /**
     * Human-like scroll to position
     */
    async humanScroll(target, options = {}) {
        const { duration = 800, easing = 'human', addNoise = true } = options;
        const startY = window.scrollY;
        let endY;
        if (typeof target === 'number') {
            endY = target;
        }
        else {
            const rect = target.getBoundingClientRect();
            endY = startY + rect.top - window.innerHeight / 3; // Scroll element to upper third
        }
        const distance = endY - startY;
        const startTime = performance.now();
        return new Promise((resolve) => {
            const step = () => {
                const elapsed = performance.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                let easedProgress;
                switch (easing) {
                    case 'linear':
                        easedProgress = progress;
                        break;
                    case 'easeInOut':
                        easedProgress = this.easeInOutCubic(progress);
                        break;
                    case 'human':
                    default:
                        // Human scrolling is usually fast start, slow end
                        easedProgress = this.humanEasing(progress);
                        break;
                }
                let scrollY = startY + distance * easedProgress;
                // Add slight noise to make scrolling less mechanical
                if (addNoise && progress < 1) {
                    scrollY += this.randomBetween(-3, 3);
                }
                window.scrollTo(0, scrollY);
                if (progress < 1) {
                    requestAnimationFrame(step);
                }
                else {
                    // Small pause after scrolling (like reading)
                    setTimeout(resolve, this.randomBetween(100, 300));
                }
            };
            requestAnimationFrame(step);
        });
    }
    /**
     * Scroll like reading a page (down in steps)
     */
    async readingScroll(stepHeight = 300, pauseMs = 1000) {
        const pageHeight = document.documentElement.scrollHeight;
        const viewHeight = window.innerHeight;
        let currentY = window.scrollY;
        while (currentY + viewHeight < pageHeight) {
            const scrollAmount = stepHeight + this.randomBetween(-50, 100);
            await this.humanScroll(currentY + scrollAmount);
            currentY = window.scrollY;
            await this.randomDelay(pauseMs * 0.5, pauseMs * 1.5);
        }
    }
    // ============================================
    // ANTI-DETECTION HELPERS
    // ============================================
    /**
     * Mask navigator.webdriver property
     */
    maskWebdriverProperty() {
        try {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
                configurable: true,
            });
        }
        catch (e) {
            console.warn('[HumanSimulator] Could not mask webdriver property:', e);
        }
    }
    /**
     * Generate realistic user agent rotation
     */
    getRandomUserAgent() {
        const userAgents = [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        ];
        return userAgents[Math.floor(Math.random() * userAgents.length)];
    }
    /**
     * Add realistic browser plugins/languages to mimic real user
     */
    getRealisticBrowserProfile() {
        return {
            screenWidth: [1920, 1680, 1440, 1366, 1280][Math.floor(Math.random() * 5)],
            screenHeight: [1080, 1050, 900, 768][Math.floor(Math.random() * 4)],
            colorDepth: 24,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform,
            doNotTrack: Math.random() > 0.5 ? '1' : null,
            hardwareConcurrency: [4, 8, 12, 16][Math.floor(Math.random() * 4)],
        };
    }
    // ============================================
    // PRIVATE HELPERS
    // ============================================
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }
    gaussianRandom(mean, stdev) {
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return z * stdev + mean;
    }
    generateBezierControlPoints(start, end) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        // Control points create a slight curve
        const cp1 = {
            x: start.x + dx * 0.3 + this.randomBetween(-30, 30),
            y: start.y + dy * 0.1 + this.randomBetween(-30, 30),
        };
        const cp2 = {
            x: start.x + dx * 0.7 + this.randomBetween(-30, 30),
            y: start.y + dy * 0.9 + this.randomBetween(-30, 30),
        };
        return [cp1, cp2];
    }
    bezierPoint(t, p0, p1, p2, p3) {
        const t2 = t * t;
        const t3 = t2 * t;
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        return {
            x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
            y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
        };
    }
    dispatchMouseEvent(type, position, target) {
        const event = new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            clientX: position.x,
            clientY: position.y,
            view: window,
        });
        (target || document.elementFromPoint(position.x, position.y) || document.body).dispatchEvent(event);
    }
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    humanEasing(t) {
        // Fast start, gradual slowdown (like real scrolling)
        return 1 - Math.pow(1 - t, 3);
    }
    getNearbyKeys(char) {
        const keyboard = {
            q: ['w', 'a'],
            w: ['q', 'e', 's'],
            e: ['w', 'r', 'd'],
            r: ['e', 't', 'f'],
            t: ['r', 'y', 'g'],
            y: ['t', 'u', 'h'],
            u: ['y', 'i', 'j'],
            i: ['u', 'o', 'k'],
            o: ['i', 'p', 'l'],
            p: ['o', 'l'],
            a: ['q', 's', 'z'],
            s: ['a', 'w', 'd', 'x'],
            d: ['s', 'e', 'f', 'c'],
            f: ['d', 'r', 'g', 'v'],
            g: ['f', 't', 'h', 'b'],
            h: ['g', 'y', 'j', 'n'],
            j: ['h', 'u', 'k', 'm'],
            k: ['j', 'i', 'l'],
            l: ['k', 'o', 'p'],
            z: ['a', 'x'],
            x: ['z', 's', 'c'],
            c: ['x', 'd', 'v'],
            v: ['c', 'f', 'b'],
            b: ['v', 'g', 'n'],
            n: ['b', 'h', 'm'],
            m: ['n', 'j'],
        };
        return keyboard[char.toLowerCase()] || [];
    }
}
// Export singleton
const humanSimulator = new HumanBehaviorSimulator();

;// ./src/v6/content/utils/CaptchaHandler.ts
/**
 * Fuse Connect v7 - CAPTCHA Handler
 *
 * Detects and attempts to handle common CAPTCHA challenges:
 * - reCAPTCHA v2/v3
 * - hCaptcha
 * - Cloudflare Turnstile
 * - Generic "Verify you are human" prompts
 *
 * Uses human behavior simulation to interact naturally with CAPTCHA elements.
 */

class CaptchaHandler {
    constructor() {
        this.lastDetection = null;
        this.bypassAttempts = 0;
        this.maxAttempts = 3;
    }
    /**
     * Detect if a CAPTCHA is present on the page
     */
    detectCaptcha() {
        console.log('[CaptchaHandler] Scanning for CAPTCHA challenges...');
        // Check for reCAPTCHA v2
        const recaptchaV2 = this.detectRecaptchaV2();
        if (recaptchaV2.detected) {
            this.lastDetection = recaptchaV2;
            return recaptchaV2;
        }
        // Check for reCAPTCHA v3 (invisible, harder to detect)
        const recaptchaV3 = this.detectRecaptchaV3();
        if (recaptchaV3.detected) {
            this.lastDetection = recaptchaV3;
            return recaptchaV3;
        }
        // Check for hCaptcha
        const hcaptcha = this.detectHCaptcha();
        if (hcaptcha.detected) {
            this.lastDetection = hcaptcha;
            return hcaptcha;
        }
        // Check for Cloudflare Turnstile
        const turnstile = this.detectCloudflareTurnstile();
        if (turnstile.detected) {
            this.lastDetection = turnstile;
            return turnstile;
        }
        // Check for Cloudflare challenge page
        const cfChallenge = this.detectCloudflareChallenge();
        if (cfChallenge.detected) {
            this.lastDetection = cfChallenge;
            return cfChallenge;
        }
        // Check for generic "I'm not a robot" checkboxes
        const genericCheckbox = this.detectGenericVerification();
        if (genericCheckbox.detected) {
            this.lastDetection = genericCheckbox;
            return genericCheckbox;
        }
        return {
            detected: false,
            type: null,
            element: null,
            iframe: null,
            confidence: 0,
        };
    }
    /**
     * Attempt to bypass/solve the detected CAPTCHA using human simulation
     */
    async attemptBypass() {
        const detection = this.lastDetection || this.detectCaptcha();
        if (!detection.detected) {
            return {
                success: true,
                type: null,
                message: 'No CAPTCHA detected',
                requiresManualIntervention: false,
            };
        }
        if (this.bypassAttempts >= this.maxAttempts) {
            return {
                success: false,
                type: detection.type,
                message: 'Max bypass attempts reached',
                requiresManualIntervention: true,
            };
        }
        this.bypassAttempts++;
        console.log(`[CaptchaHandler] Attempting bypass for ${detection.type} (attempt ${this.bypassAttempts}/${this.maxAttempts})`);
        try {
            switch (detection.type) {
                case 'recaptcha-v2':
                    return await this.bypassRecaptchaV2(detection);
                case 'hcaptcha':
                    return await this.bypassHCaptcha(detection);
                case 'cloudflare-turnstile':
                    return await this.bypassTurnstile(detection);
                case 'cloudflare-challenge':
                    return await this.handleCloudflareChallenge(detection);
                case 'generic-checkbox':
                    return await this.bypassGenericCheckbox(detection);
                default:
                    return {
                        success: false,
                        type: detection.type,
                        message: 'Unknown CAPTCHA type - manual intervention required',
                        requiresManualIntervention: true,
                    };
            }
        }
        catch (error) {
            console.error('[CaptchaHandler] Bypass error:', error);
            return {
                success: false,
                type: detection.type,
                message: `Bypass failed: ${error}`,
                requiresManualIntervention: true,
            };
        }
    }
    /**
     * Wait for CAPTCHA to be solved (by user or automation)
     */
    async waitForCaptchaSolved(timeoutMs = 60000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeoutMs) {
            const detection = this.detectCaptcha();
            // Check if CAPTCHA is no longer blocking
            if (!detection.detected) {
                console.log('[CaptchaHandler] CAPTCHA solved or no longer detected');
                this.resetState();
                return true;
            }
            // Check for success indicators
            if (this.checkSuccessIndicators()) {
                console.log('[CaptchaHandler] Success indicator detected');
                this.resetState();
                return true;
            }
            await this.sleep(1000);
        }
        console.log('[CaptchaHandler] Timeout waiting for CAPTCHA solution');
        return false;
    }
    // ============================================
    // DETECTION METHODS
    // ============================================
    detectRecaptchaV2() {
        // Look for reCAPTCHA iframe
        const iframes = document.querySelectorAll('iframe[src*="recaptcha"], iframe[src*="google.com/recaptcha"]');
        for (const iframe of iframes) {
            if (iframe.src.includes('anchor') || iframe.src.includes('bframe')) {
                // Also look for the checkbox element
                const checkbox = document.querySelector('.g-recaptcha, .recaptcha-checkbox');
                return {
                    detected: true,
                    type: 'recaptcha-v2',
                    element: checkbox,
                    iframe,
                    confidence: 0.95,
                };
            }
        }
        // Check for grecaptcha object
        if (window.grecaptcha) {
            return {
                detected: true,
                type: 'recaptcha-v2',
                element: document.querySelector('.g-recaptcha'),
                iframe: null,
                confidence: 0.8,
            };
        }
        return { detected: false, type: null, element: null, iframe: null, confidence: 0 };
    }
    detectRecaptchaV3() {
        // reCAPTCHA v3 is invisible, look for badge
        const badge = document.querySelector('.grecaptcha-badge');
        if (badge) {
            return {
                detected: true,
                type: 'recaptcha-v3',
                element: badge,
                iframe: null,
                confidence: 0.7,
            };
        }
        return { detected: false, type: null, element: null, iframe: null, confidence: 0 };
    }
    detectHCaptcha() {
        // Look for hCaptcha iframe
        const iframe = document.querySelector('iframe[src*="hcaptcha"], iframe[src*="hcaptcha.com"]');
        if (iframe) {
            const checkbox = document.querySelector('.h-captcha');
            return {
                detected: true,
                type: 'hcaptcha',
                element: checkbox,
                iframe,
                confidence: 0.95,
            };
        }
        // Check for hcaptcha object
        if (window.hcaptcha) {
            return {
                detected: true,
                type: 'hcaptcha',
                element: document.querySelector('.h-captcha'),
                iframe: null,
                confidence: 0.8,
            };
        }
        return { detected: false, type: null, element: null, iframe: null, confidence: 0 };
    }
    detectCloudflareTurnstile() {
        // Look for Turnstile iframe
        const iframe = document.querySelector('iframe[src*="challenges.cloudflare.com/turnstile"]');
        if (iframe) {
            return {
                detected: true,
                type: 'cloudflare-turnstile',
                element: iframe.parentElement,
                iframe,
                confidence: 0.95,
            };
        }
        // Look for turnstile container
        const container = document.querySelector('.cf-turnstile');
        if (container) {
            return {
                detected: true,
                type: 'cloudflare-turnstile',
                element: container,
                iframe: null,
                confidence: 0.85,
            };
        }
        return { detected: false, type: null, element: null, iframe: null, confidence: 0 };
    }
    detectCloudflareChallenge() {
        // Cloudflare challenge page indicators
        const indicators = [
            document.querySelector('#cf-challenge-running'),
            document.querySelector('.cf-browser-verification'),
            document.querySelector('[data-ray]'),
            document.title.includes('Just a moment'),
            document.title.includes('Checking your browser'),
        ];
        const matchCount = indicators.filter(Boolean).length;
        if (matchCount >= 2) {
            return {
                detected: true,
                type: 'cloudflare-challenge',
                element: document.body,
                iframe: null,
                confidence: 0.9,
            };
        }
        return { detected: false, type: null, element: null, iframe: null, confidence: 0 };
    }
    detectGenericVerification() {
        // Look for common verification patterns
        const patterns = [
            'verify you are human',
            "i'm not a robot",
            'prove you are not a robot',
            'human verification',
            'security check',
            'bot detection',
        ];
        const bodyText = document.body.innerText.toLowerCase();
        const matchingPattern = patterns.find((p) => bodyText.includes(p));
        if (matchingPattern) {
            // Try to find clickable elements
            const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
            const verifyButton = buttons.find((btn) => btn.textContent?.toLowerCase().includes('verify') ||
                btn.textContent?.toLowerCase().includes('continue') ||
                btn.textContent?.toLowerCase().includes('confirm'));
            const checkboxes = document.querySelectorAll('input[type="checkbox"]');
            return {
                detected: true,
                type: 'generic-checkbox',
                element: (verifyButton || checkboxes[0]),
                iframe: null,
                confidence: 0.6,
            };
        }
        return { detected: false, type: null, element: null, iframe: null, confidence: 0 };
    }
    // ============================================
    // BYPASS METHODS
    // ============================================
    async bypassRecaptchaV2(detection) {
        console.log('[CaptchaHandler] Attempting reCAPTCHA v2 bypass...');
        // First, try clicking the checkbox if visible
        const checkbox = document.querySelector('.recaptcha-checkbox-border');
        if (checkbox && this.isElementVisible(checkbox)) {
            // Add pre-click delay (human thinking time)
            await humanSimulator.thinkingPause();
            // Human-like click
            await humanSimulator.humanClick(checkbox);
            // Wait for response
            await this.sleep(2000);
            // Check if solved
            const stillDetected = this.detectRecaptchaV2();
            if (!stillDetected.detected) {
                return {
                    success: true,
                    type: 'recaptcha-v2',
                    message: 'reCAPTCHA checkbox clicked successfully',
                    requiresManualIntervention: false,
                };
            }
        }
        // If image challenge appears, we need manual intervention
        const challengeFrame = document.querySelector('iframe[src*="bframe"], iframe[title*="recaptcha challenge"]');
        if (challengeFrame && this.isElementVisible(challengeFrame)) {
            return {
                success: false,
                type: 'recaptcha-v2',
                message: 'Image challenge detected - manual intervention required',
                requiresManualIntervention: true,
            };
        }
        return {
            success: false,
            type: 'recaptcha-v2',
            message: 'Could not interact with reCAPTCHA',
            requiresManualIntervention: true,
        };
    }
    async bypassHCaptcha(detection) {
        console.log('[CaptchaHandler] Attempting hCaptcha bypass...');
        // Try to find and click the checkbox
        const checkbox = document.querySelector('.hcaptcha-checkbox, #checkbox');
        if (checkbox && this.isElementVisible(checkbox)) {
            await humanSimulator.thinkingPause();
            await humanSimulator.humanClick(checkbox);
            await this.sleep(2000);
            const stillDetected = this.detectHCaptcha();
            if (!stillDetected.detected) {
                return {
                    success: true,
                    type: 'hcaptcha',
                    message: 'hCaptcha checkbox clicked successfully',
                    requiresManualIntervention: false,
                };
            }
        }
        return {
            success: false,
            type: 'hcaptcha',
            message: 'hCaptcha requires manual intervention',
            requiresManualIntervention: true,
        };
    }
    async bypassTurnstile(detection) {
        console.log('[CaptchaHandler] Attempting Cloudflare Turnstile bypass...');
        // Turnstile often auto-solves, just wait
        await this.sleep(3000);
        const stillDetected = this.detectCloudflareTurnstile();
        if (!stillDetected.detected) {
            return {
                success: true,
                type: 'cloudflare-turnstile',
                message: 'Turnstile auto-solved',
                requiresManualIntervention: false,
            };
        }
        // Try clicking the widget
        if (detection.element) {
            await humanSimulator.humanClick(detection.element);
            await this.sleep(2000);
        }
        return {
            success: false,
            type: 'cloudflare-turnstile',
            message: 'Turnstile requires manual intervention',
            requiresManualIntervention: true,
        };
    }
    async handleCloudflareChallenge(detection) {
        console.log('[CaptchaHandler] Cloudflare challenge page detected, waiting...');
        // Cloudflare challenges usually auto-complete
        await this.sleep(5000);
        // Check if we're still on challenge page
        const stillChallenging = document.title.includes('Just a moment') || document.querySelector('#cf-challenge-running');
        if (!stillChallenging) {
            return {
                success: true,
                type: 'cloudflare-challenge',
                message: 'Cloudflare challenge passed',
                requiresManualIntervention: false,
            };
        }
        return {
            success: false,
            type: 'cloudflare-challenge',
            message: 'Cloudflare challenge requires patience or manual intervention',
            requiresManualIntervention: true,
        };
    }
    async bypassGenericCheckbox(detection) {
        console.log('[CaptchaHandler] Attempting generic verification bypass...');
        if (detection.element) {
            await humanSimulator.thinkingPause();
            await humanSimulator.humanClick(detection.element);
            await this.sleep(1500);
            return {
                success: true,
                type: 'generic-checkbox',
                message: 'Clicked verification element',
                requiresManualIntervention: false,
            };
        }
        return {
            success: false,
            type: 'generic-checkbox',
            message: 'No clickable verification element found',
            requiresManualIntervention: true,
        };
    }
    // ============================================
    // HELPERS
    // ============================================
    checkSuccessIndicators() {
        // Check for success checkmarks
        const successIndicators = [
            document.querySelector('.recaptcha-checkbox-checked'),
            document.querySelector('[data-success="true"]'),
            document.querySelector('.success-icon'),
        ];
        return successIndicators.some((el) => el !== null);
    }
    isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return (rect.width > 0 &&
            rect.height > 0 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0');
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    resetState() {
        this.bypassAttempts = 0;
        this.lastDetection = null;
    }
}
// Export singleton
const captchaHandler = new CaptchaHandler();

;// ./src/v6/content/index.ts
/**
 * Gemini Bridge v7 - Content Script Entry Point
 *
 * SIMPLIFIED VERSION - Uses SimpleChatBridge for direct Gemini interaction.
 *
 * The floating panel is NOT auto-injected. It only appears when:
 * 1. User clicks "Open Panel" button in popup
 * 2. User presses Ctrl+Shift+G keyboard shortcut
 */

 // MUST BE FIRST - Patches customElements.define




const shouldSkipForPage = () => {
    const host = window.location.hostname;
    const path = window.location.pathname;
    // Skip initialization on SkIDEancer IDE pages to prevent editor collisions.
    if (host === 'skideancer.thenewfuse.com')
        return true;
    // Skip auth and Cloudflare challenge routes so login/register are not disrupted.
    if (path === '/login' ||
        path === '/register' ||
        path.startsWith('/auth/') ||
        path.startsWith('/cdn-cgi/challenge-platform/')) {
        return true;
    }
    return false;
};
class GeminiBridgeContentScript {
    constructor() {
        this.panel = null;
        this.isInitialized = false;
        this.panelVisible = false;
        this.chatReady = false;
        this.pageAgentId = null;
        this.currentChannel = null;
        this.pausedChannels = new Set();
        // DEDUPE GUARD: Track message IDs we have already processed (injected or shown)
        // to prevent infinite loops from the relay-Cloudflare-Extension circle.
        this.processedMessageIds = new Set();
        // FEDERATION IMPROVEMENT: Track pending requests for response correlation
        this.pendingRequests = new Map();
        // FEDERATION IMPROVEMENT: Message Queue for delayed injection
        this.injectionQueue = [];
        this.isProcessingQueue = false;
        this.init();
    }
    async init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        }
        else {
            this.setup();
        }
    }
    setup() {
        if (this.isInitialized)
            return;
        this.isInitialized = true;
        console.debug('[GeminiBridge v7] Content script initialized (panel AUTO-OPEN disabled)');
        // Auto-open panel disabled by default per user request
        // try {
        //   this.showPanel();
        // } catch (e) {
        //   console.error('[GeminiBridge v7] Failed to auto-open panel:', e);
        // }
        // Initialize the simple chat bridge with callbacks
        simpleChatBridge.init({
            onResponse: (content) => {
                console.log('[GeminiBridge v7] AI Response received, length:', content.length);
                // Forward to panel
                if (this.panel) {
                    this.panel.handleMessage({
                        type: 'RESPONSE_COMPLETE',
                        content: content,
                    });
                }
                // FEDERATION IMPROVEMENT: Check for pending request to correlate response
                const pendingRequest = this.getOldestPendingRequest();
                if (!this.pageAgentId) {
                    console.warn('[GeminiBridge v7] ⚠️ Page Agent ID missing during response! This may cause message drop.');
                }
                // Get current channel from panel for proper routing
                const currentChannel = this.panel?.getCurrentChannel() || null;
                const responseMetadata = {
                    agentId: this.pageAgentId,
                    responseType: 'ai-response',
                    timestamp: Date.now(),
                    channel: currentChannel, // Include channel for per-tab routing
                };
                if (pendingRequest) {
                    // Correlate this response with the original request
                    responseMetadata.correlationId = pendingRequest.correlationId;
                    responseMetadata.taskId = pendingRequest.taskId;
                    responseMetadata.inResponseTo = pendingRequest.from;
                    console.log('[GeminiBridge v7] 🔗 Correlating response to request:', pendingRequest.correlationId);
                    this.pendingRequests.delete(pendingRequest.correlationId);
                }
                // Forward to background for relay with correlation info
                this.safeSendMessage({
                    type: 'RESPONSE_COMPLETE',
                    content: content.length > 50000 ? content.substring(0, 50000) : content,
                    channel: currentChannel, // Also pass at top level for easier access
                    metadata: responseMetadata,
                });
                // Trigger queue processing after response
                this.processInjectionQueue();
            },
            onTranscriptEntry: (entry) => {
                // Track the ID in our dedupe guard
                if (entry.id)
                    this.processedMessageIds.add(entry.id);
                // Forward canonical transcript updates from Cloudflare DO to panel
                if (this.panel) {
                    this.panel.handleMessage({
                        type: 'TRANSCRIPT_UPDATE',
                        entry: entry,
                    });
                }
            },
            onError: (error) => {
                console.error('[GeminiBridge v7] Chat bridge error:', error);
            },
        });
        // Check for chat elements periodically
        this.startChatDetection();
        // Auto-detect CAPTCHA on page load (after short delay for iframes to load)
        setTimeout(() => {
            this.checkForCaptcha();
        }, 2000);
        // Setup debug utilities for console diagnostics
        this.setupDebugUtils();
        // Setup message handlers
        this.setupMessageHandlers();
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        // Notify background that content script is ready
        this.safeSendMessage({
            type: 'CONTENT_SCRIPT_READY',
            url: window.location.href,
            hostname: window.location.hostname,
        });
    }
    /**
     * Periodically check for chat elements
     */
    startChatDetection() {
        const checkElements = () => {
            const elements = simpleChatBridge.findElements();
            if (elements.isReady && !this.chatReady) {
                this.chatReady = true;
                console.log('[GeminiBridge v7] Chat is ready!');
                // Notify background
                this.safeSendMessage({
                    type: 'CHAT_DETECTED',
                    elements: {
                        hasInput: !!elements.input,
                        hasSendButton: !!elements.sendButton,
                        confidence: 1,
                        isStreaming: false,
                    },
                }, (response) => {
                    if (response?.agentId) {
                        this.pageAgentId = response.agentId;
                        console.log('[GeminiBridge v7] Assigned Page Agent ID:', this.pageAgentId);
                    }
                });
                // Update panel if exists
                if (this.panel) {
                    this.panel.updateChatElements({
                        input: elements.input,
                        sendButton: elements.sendButton,
                        messageContainer: null,
                        lastMessage: null,
                        isStreaming: false,
                        confidence: 1,
                        detectedAt: Date.now(),
                    });
                }
                // Pass agent ID to panel if available
                if (this.panel && this.pageAgentId) {
                    this.panel.setAgentId(this.pageAgentId);
                }
            }
        };
        // Check immediately and every 2 seconds
        checkElements();
        setInterval(checkElements, 2000);
    }
    /**
     * Setup debug utilities accessible from browser console
     */
    setupDebugUtils() {
        window.__GEMINI_BRIDGE_DEBUG = {
            getLastResponse: () => {
                const response = simpleChatBridge.getLastResponse();
                console.log('[GeminiBridge Debug] Last response:', response);
                return response;
            },
            sendTestMessage: (msg) => {
                console.log('[GeminiBridge Debug] Sending test message:', msg);
                simpleChatBridge.sendMessage(msg);
            },
            checkExtensionContext: () => {
                try {
                    const isValid = !!chrome.runtime?.id;
                    console.log('[GeminiBridge Debug] Extension context valid:', isValid);
                    return isValid;
                }
                catch (e) {
                    console.error('[GeminiBridge Debug] Extension context check failed:', e);
                    return false;
                }
            },
            findElements: () => {
                const elements = simpleChatBridge.findElements();
                console.log('[GeminiBridge Debug] Found elements:', elements);
                return elements;
            },
        };
        console.debug('[GeminiBridge v7] Debug utils available at window.__GEMINI_BRIDGE_DEBUG');
    }
    /**
     * Show or create the floating panel
     */
    showPanel() {
        // SECURITY/UX: Never show floating panel in iframes (like YouTube embeds or ads)
        if (window.self !== window.top) {
            return;
        }
        if (!this.panel) {
            this.panel = createEnhancedFloatingPanel();
            // Update with current detection state
            const elements = simpleChatBridge.findElements();
            if (elements.isReady) {
                this.panel.updateChatElements({
                    input: elements.input,
                    sendButton: elements.sendButton,
                    messageContainer: null,
                    lastMessage: null,
                    isStreaming: false,
                    confidence: 1,
                    detectedAt: Date.now(),
                });
            }
            // Pass agent ID if we already have it
            if (this.pageAgentId) {
                this.panel.setAgentId(this.pageAgentId);
            }
        }
        this.panel.show();
        this.panelVisible = true;
        console.log('[GeminiBridge v7] Panel shown');
    }
    /**
     * Hide the floating panel
     */
    hidePanel() {
        if (this.panel) {
            this.panel.hide();
            this.panelVisible = false;
            console.log('[GeminiBridge v7] Panel hidden');
        }
    }
    /**
     * Toggle panel visibility
     */
    togglePanel() {
        if (this.panelVisible) {
            this.hidePanel();
        }
        else {
            this.showPanel();
        }
    }
    setupMessageHandlers() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            // CRITICAL: Check if extension context is still valid
            if (!chrome.runtime?.id) {
                return false;
            }
            // Safe wrapper for sendResponse to prevent "Extension context invalidated" errors
            const safeSendResponse = (response) => {
                try {
                    if (chrome.runtime?.id) {
                        sendResponse(response);
                    }
                }
                catch (e) {
                    // Ignore context invalidation errors - expected during reloads
                    console.debug('[GeminiBridge] Context invalidated during response sending');
                }
            };
            try {
                switch (message.type) {
                    case 'PING':
                        // Used to check if content script is already injected
                        safeSendResponse({ pong: true, initialized: this.isInitialized });
                        return true;
                    case 'TOGGLE_PANEL':
                        this.togglePanel();
                        safeSendResponse({ success: true, visible: this.panelVisible });
                        return true;
                    case 'SHOW_PANEL':
                        try {
                            this.showPanel();
                            safeSendResponse({ success: true });
                        }
                        catch (e) {
                            console.error('[GeminiBridge] Failed to show panel:', e);
                            safeSendResponse({ success: false, error: e.message });
                        }
                        return true;
                    case 'HIDE_PANEL':
                        this.hidePanel();
                        safeSendResponse({ success: true });
                        return true;
                    case 'GET_PANEL_STATUS':
                        safeSendResponse({ visible: this.panelVisible, exists: !!this.panel });
                        return true;
                    case 'INJECT_MESSAGE':
                        this.injectMessage(message.content).then((success) => {
                            safeSendResponse({ success });
                        });
                        return true;
                    case 'GET_LAST_RESPONSE': {
                        const response = simpleChatBridge.getLastResponse();
                        safeSendResponse({ response });
                        return true;
                    }
                    case 'GET_CHAT_STATUS': {
                        const elements = simpleChatBridge.findElements();
                        safeSendResponse({
                            detected: elements.isReady,
                            confidence: elements.isReady ? 1 : 0,
                            isStreaming: false,
                        });
                        return true;
                    }
                    // Accessibility tree commands
                    case 'GET_ACCESSIBILITY_TREE': {
                        const treeResult = accessibilityTree.generateTree({
                            filter: message.filter,
                            maxDepth: message.maxDepth,
                            refId: message.refId,
                        });
                        safeSendResponse(treeResult);
                        return true;
                    }
                    case 'CLICK_ELEMENT':
                        accessibilityTree.clickElement(message.refId).then((success) => {
                            safeSendResponse({ success });
                        });
                        return true;
                    case 'TYPE_INTO_ELEMENT':
                        accessibilityTree
                            .typeIntoElement(message.refId, message.text, {
                            clear: message.clear,
                        })
                            .then((success) => {
                            safeSendResponse({ success });
                        });
                        return true;
                    case 'GET_ELEMENT_BY_REF': {
                        const el = accessibilityTree.getElementByRefId(message.refId);
                        safeSendResponse({
                            found: !!el,
                            tagName: el?.tagName,
                            textContent: el?.textContent?.substring(0, 200),
                        });
                        return true;
                    }
                    // Human simulation commands
                    case 'HUMAN_TYPE': {
                        const typeElements = simpleChatBridge.findElements();
                        const typeTarget = message.refId
                            ? accessibilityTree.getElementByRefId(message.refId)
                            : typeElements.input;
                        if (typeTarget) {
                            humanSimulator
                                .humanType(typeTarget, message.text, {
                                minDelay: message.minDelay || 50,
                                maxDelay: message.maxDelay || 150,
                                typoChance: message.typoChance || 0.02,
                            })
                                .then(() => safeSendResponse({ success: true }));
                        }
                        else {
                            safeSendResponse({ success: false, error: 'No target element' });
                        }
                        return true;
                    }
                    case 'HUMAN_CLICK': {
                        const clickTarget = message.refId
                            ? accessibilityTree.getElementByRefId(message.refId)
                            : null;
                        if (clickTarget) {
                            humanSimulator
                                .humanClick(clickTarget)
                                .then(() => safeSendResponse({ success: true }));
                        }
                        else {
                            safeSendResponse({ success: false, error: 'No target element' });
                        }
                        return true;
                    }
                    case 'HUMAN_SCROLL':
                        humanSimulator.humanScroll(message.target || message.y || 500).then(() => {
                            safeSendResponse({ success: true });
                        });
                        return true;
                    // CAPTCHA handling commands
                    case 'DETECT_CAPTCHA': {
                        const detection = captchaHandler.detectCaptcha();
                        safeSendResponse(detection);
                        return true;
                    }
                    case 'BYPASS_CAPTCHA':
                        captchaHandler.attemptBypass().then((result) => {
                            safeSendResponse(result);
                        });
                        return true;
                    case 'WAIT_FOR_CAPTCHA':
                        captchaHandler.waitForCaptchaSolved(message.timeout || 60000).then((solved) => {
                            safeSendResponse({ solved });
                        });
                        return true;
                    // Forward state updates to panel if it exists
                    case 'CONNECTION_STATUS':
                    case 'AGENTS_UPDATE':
                    case 'CHANNELS_UPDATE':
                    case 'JOINED_CHANNELS_UPDATE':
                    case 'CHANNEL_PAUSE_UPDATE':
                    case 'CHANNEL_SELECTED':
                    case 'NOTIFICATION':
                    case 'TASK_ASSIGN':
                        if (message.type === 'CHANNEL_SELECTED') {
                            this.currentChannel = message.channelId || null;
                        }
                        if (message.type === 'CHANNEL_PAUSE_UPDATE') {
                            const paused = Array.isArray(message.pausedChannels)
                                ? message.pausedChannels.map((id) => String(id))
                                : [];
                            this.pausedChannels = new Set(paused);
                        }
                        if (this.panel) {
                            this.panel.handleMessage(message);
                        }
                        safeSendResponse({ success: true });
                        return true;
                    case 'NEW_MESSAGE': {
                        if (message.message) {
                            const msg = message.message;
                            // DEDUPE GUARD: Never process the same message ID twice.
                            // This is vital for stopping feedback loops between Relay and Cloudflare.
                            if (msg.id && this.processedMessageIds.has(msg.id)) {
                                safeSendResponse({ success: true, reason: 'deduped' });
                                return true;
                            }
                            if (msg.id)
                                this.processedMessageIds.add(msg.id);
                            const myChannel = this.panel?.getCurrentChannel();
                            const effectiveChannel = myChannel || this.currentChannel;
                            const messageChannel = msg.channel || msg.metadata?.channel;
                            const messageChannelId = messageChannel ? String(messageChannel) : '';
                            // Hard mute for paused channels on this tab:
                            // do not render into panel and do not auto-inject while paused.
                            if (msg.to === 'broadcast' &&
                                messageChannelId &&
                                this.isChannelPaused(messageChannelId) &&
                                msg.metadata?.forceInject !== true) {
                                console.log('[GeminiBridge v7] ⏸️ Skipping paused-channel message', {
                                    messageChannel: messageChannelId,
                                    pausedChannels: Array.from(this.pausedChannels),
                                });
                                safeSendResponse({ success: true, reason: 'paused_channel' });
                                return true;
                            }
                            // CHANNEL FILTERING:
                            // Only process messages for OUR channel (or if no channel filtering needed)
                            // Direct messages (to specific agentId) always bypass channel filtering.
                            const isBroadcast = msg.to === 'broadcast';
                            const isForMyChannel = !isBroadcast ||
                                !messageChannel ||
                                !effectiveChannel ||
                                messageChannel === effectiveChannel;
                            if (!isForMyChannel) {
                                console.log('[GeminiBridge v7] ⏭️ Skipping message for different channel:', {
                                    messageChannel,
                                    myChannel: effectiveChannel,
                                    contentPreview: msg.content?.substring(0, 30),
                                });
                                safeSendResponse({ success: true });
                                return true;
                            }
                            // Forward to panel for display if it exists
                            if (this.panel) {
                                this.panel.handleMessage(message);
                            }
                            // Handle message injection (works even if panel isn't open)
                            // TARGETED INJECTION: If addressed specifically to this page agent
                            if (this.pageAgentId && msg.to === this.pageAgentId && msg.content) {
                                if (!this.canAutoInjectRelayMessage(msg)) {
                                    console.log('[GeminiBridge v7] ⏭️ Skipping targeted auto-injection (panel hidden on this tab)');
                                    safeSendResponse({ success: true, reason: 'panel_hidden' });
                                    return true;
                                }
                                if (!this.shouldInjectRelayMessage(msg)) {
                                    console.log('[GeminiBridge v7] ⏭️ Skipping non-conversational targeted message', msg.metadata?.eventType || msg.messageType || 'unknown');
                                    safeSendResponse({ success: true, reason: 'filtered_system_message' });
                                    return true;
                                }
                                console.log('[GeminiBridge v7] Injecting targeted message:', msg.content);
                                this.injectMessage(msg.content).then((success) => {
                                    if (success)
                                        console.log('[GeminiBridge v7] Injection successful');
                                    else
                                        console.warn('[GeminiBridge v7] Injection failed');
                                });
                            }
                            // CHANNEL BROADCAST INJECTION: If from external agent on same channel
                            else if (msg.to === 'broadcast' && msg.content && msg.from) {
                                if (!this.canAutoInjectRelayMessage(msg)) {
                                    console.log('[GeminiBridge v7] ⏭️ Skipping broadcast auto-injection (panel hidden on this tab)');
                                    safeSendResponse({ success: true, reason: 'panel_hidden' });
                                    return true;
                                }
                                if (!this.shouldInjectRelayMessage(msg)) {
                                    console.log('[GeminiBridge v7] ⏭️ Skipping non-conversational broadcast message', msg.metadata?.eventType || msg.messageType || 'unknown');
                                    safeSendResponse({ success: true, reason: 'filtered_system_message' });
                                    return true;
                                }
                                // CRITICAL FIX: Check both msg.from AND metadata.senderId for self-identification
                                // The senderId in metadata is more reliable as it's set when the message originates
                                const senderFromMetadata = msg.metadata?.senderId;
                                const isStreaming = simpleChatBridge.isStreaming();
                                // NORMALIZE IDs for comparison (strip common prefixes)
                                const normalizeId = (id) => id ? id.replace(/^(page-agent-|browser-|agent-)/, '') : '';
                                const myNormalizedId = normalizeId(this.pageAgentId || '');
                                const fromNormalizedId = normalizeId(msg.from || '');
                                const metaSenderNormalizedId = normalizeId(senderFromMetadata || '');
                                const isFromSelf = (myNormalizedId &&
                                    fromNormalizedId &&
                                    myNormalizedId.startsWith(fromNormalizedId) &&
                                    fromNormalizedId.length > 5) ||
                                    (myNormalizedId &&
                                        metaSenderNormalizedId &&
                                        myNormalizedId.startsWith(metaSenderNormalizedId) &&
                                        metaSenderNormalizedId.length > 5) ||
                                    msg.from === 'You';
                                const isFromYou = msg.from === 'You';
                                // Also check browser agent ID if we can get it from storage or background
                                // This is a safety margin against late pageAgentId assignment
                                const isExternalAgent = !isFromSelf;
                                // Debug logging to trace agent identification
                                console.log('[GeminiBridge v7] 📨 Message received:', {
                                    from: msg.from,
                                    senderId: senderFromMetadata,
                                    myAgentId: this.pageAgentId,
                                    isFromSelf,
                                    isExternalAgent,
                                    messageType: msg.messageType,
                                    channel: messageChannel,
                                });
                                // FIXED LOGIC:
                                // - Skip ONLY self-messages (already handled by isExternalAgent check)
                                // - AI responses from OTHER agents SHOULD be injected so our AI can see/respond to them
                                // - This enables true multi-AI conversation
                                if (!isExternalAgent) {
                                    console.log('[GeminiBridge v7] ⏭️ Skipping message:', {
                                        from: msg.from,
                                        senderId: senderFromMetadata,
                                        myAgentId: this.pageAgentId,
                                        reason: isFromYou ? 'from-you' : isFromSelf ? 'same-agent' : 'unknown',
                                    });
                                }
                                else {
                                    // SAFETY CHECK: If AI is actively streaming, DO NOT INJECT IMMEDIATELY.
                                    // Instead, add to queue.
                                    if (isStreaming) {
                                        console.log('[GeminiBridge v7] ⏳ AI is streaming, QUEUING message for later injection:', msg.content.substring(0, 50));
                                        this.queueMessage(msg.content, msg.metadata);
                                        return;
                                    }
                                    // This is from an external agent - inject it!
                                    // (Even if it's an AI response - we WANT to inject other AIs' responses)
                                    console.log('[GeminiBridge v7] ✅ Injecting message from external agent:', {
                                        from: msg.from,
                                        isAIResponse: msg.messageType === 'ai-response' || msg.metadata?.isAIResponse,
                                        contentPreview: msg.content.substring(0, 50),
                                        channel: messageChannel,
                                    });
                                    // FEDERATION IMPROVEMENT: Track orchestrator tasks for response correlation
                                    const isOrchestratorTask = msg.metadata?.source === 'orchestrator' ||
                                        msg.metadata?.taskId ||
                                        msg.metadata?.requiresResponse;
                                    if (isOrchestratorTask) {
                                        console.log('[GeminiBridge v7] 🎯 Orchestrator task detected:', msg.metadata?.taskId);
                                        // Register this as a pending request so we can correlate the AI response
                                        this.trackPendingRequest({
                                            correlationId: msg.metadata?.correlationId || msg.id || `req-${Date.now()}`,
                                            taskId: msg.metadata?.taskId,
                                            from: msg.from,
                                        });
                                    }
                                    this.injectMessage(msg.content).then((success) => {
                                        if (success)
                                            console.log('[GeminiBridge v7] ✅ Injection successful');
                                        else
                                            console.warn('[GeminiBridge v7] ⚠️ Injection failed');
                                    });
                                }
                            }
                        }
                        safeSendResponse({ success: true });
                        return true;
                    }
                }
            }
            catch (e) {
                console.error('[GeminiBridge] Content script message handler error:', e);
                // Don't call sendResponse here for async cases as it might be too late,
                // but for sync cases it prevents the "closed prematurely" error.
                try {
                    safeSendResponse({ success: false, error: e.message || 'Unknown error' });
                }
                catch (ignore) {
                    // ignore if response sent already
                }
            }
        });
    }
    /**
     * Safely send message to background
     */
    safeSendMessage(message, callback) {
        if (!chrome.runtime?.id)
            return;
        try {
            chrome.runtime.sendMessage(message, (response) => {
                // Access lastError to suppress "Unchecked runtime.lastError" warnings
                const error = chrome.runtime.lastError;
                if (callback && !error) {
                    callback(response);
                }
            });
        }
        catch (e) {
            // Ignore context invalidated errors
        }
    }
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + F to toggle panel
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
                e.preventDefault();
                this.togglePanel();
            }
            // Ctrl/Cmd + Shift + I to inject last clipboard as message
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                navigator.clipboard.readText().then((text) => {
                    if (text)
                        this.injectMessage(text);
                });
            }
        });
    }
    /**
     * Only conversational payloads should be auto-injected into page chat.
     * Control-plane events (activity/wake/heartbeat) must stay out of model input.
     */
    shouldInjectRelayMessage(msg) {
        const content = String(msg?.content || '').trim();
        if (!content)
            return false;
        const messageType = String(msg?.messageType || '').toLowerCase();
        const eventType = String(msg?.metadata?.eventType || '').toLowerCase();
        const lower = content.toLowerCase();
        if (messageType === 'event')
            return false;
        const blockedEventTypes = new Set([
            'activity',
            'wake_ping',
            'wake_ack',
            'monitor_idle',
            'page_agent_registered',
            'agent_registered',
            'heartbeat',
        ]);
        if (blockedEventTypes.has(eventType))
            return false;
        if (lower.startsWith('[activity]') ||
            lower.startsWith('[wake_ping') ||
            lower.startsWith('[wake_ack')) {
            return false;
        }
        return true;
    }
    async injectMessage(content, metadata) {
        console.log('[GeminiBridge v7] Injecting message:', content.substring(0, 50));
        const success = await simpleChatBridge.sendMessage(content);
        if (success) {
            console.log('[GeminiBridge v7] Message sent successfully');
        }
        else {
            console.error('[GeminiBridge v7] Message send failed');
        }
        return success;
    }
    /**
     * FEDERATION IMPROVEMENT: Track a pending request for response correlation
     */
    trackPendingRequest(request) {
        this.pendingRequests.set(request.correlationId, {
            ...request,
            timestamp: Date.now(),
        });
        console.log('[GeminiBridge v7] 📝 Tracking pending request:', request.correlationId);
        // Clean up old requests (older than 5 minutes)
        const now = Date.now();
        for (const [id, req] of this.pendingRequests) {
            if (now - req.timestamp > 300000) {
                this.pendingRequests.delete(id);
            }
        }
    }
    /**
     * FEDERATION IMPROVEMENT: Get the oldest pending request for response matching
     */
    getOldestPendingRequest() {
        let oldest = null;
        for (const req of this.pendingRequests.values()) {
            if (!oldest || req.timestamp < oldest.timestamp) {
                oldest = req;
            }
        }
        return oldest;
    }
    /**
     * Check for CAPTCHA on page load and notify if found
     */
    checkForCaptcha() {
        const detection = captchaHandler.detectCaptcha();
        if (detection.detected) {
            console.log(`[GeminiBridge v7] CAPTCHA detected: ${detection.type} (confidence: ${detection.confidence})`);
            this.safeSendMessage({
                type: 'CAPTCHA_DETECTED',
                captcha: {
                    type: detection.type,
                    confidence: detection.confidence,
                    url: window.location.href,
                },
            });
        }
    }
    /**
     * Queue a message for injection
     */
    queueMessage(content, metadata) {
        this.injectionQueue.push({
            content,
            metadata,
            timestamp: Date.now(),
            attempts: 0,
        });
        // Try to process immediately (will fail if still streaming, but sets up interval)
        this.processInjectionQueue();
    }
    /**
     * Process the injection queue
     */
    processInjectionQueue() {
        if (this.isProcessingQueue)
            return;
        this.isProcessingQueue = true;
        const process = async () => {
            if (!this.panelVisible) {
                // Per-tab safety: never auto-inject relay queue while panel is hidden.
                this.injectionQueue = [];
                this.isProcessingQueue = false;
                return;
            }
            if (this.injectionQueue.length === 0) {
                this.isProcessingQueue = false;
                return;
            }
            if (simpleChatBridge.isStreaming()) {
                // Still streaming, wait and retry
                console.debug('[GeminiBridge v7] Queue paused (AI streaming)...');
                setTimeout(process, 1000);
                return;
            }
            // Ready to inject
            const item = this.injectionQueue.shift();
            if (item) {
                console.log('[GeminiBridge v7] 🚀 Processing queued message:', item.content.substring(0, 30));
                // If it's an orchestrator task, track it again (timestamp refresh)
                const isOrchestratorTask = item.metadata?.source === 'orchestrator' ||
                    item.metadata?.taskId ||
                    item.metadata?.requiresResponse;
                if (isOrchestratorTask) {
                    this.trackPendingRequest({
                        correlationId: item.metadata?.correlationId || `queued-${Date.now()}`,
                        taskId: item.metadata?.taskId,
                        from: item.metadata?.senderId || 'unknown',
                    });
                }
                await this.injectMessage(item.content, item.metadata);
                // Wait a bit before next injection to allow UI to update
                // (Wait longer than the _sendingGuard in SimpleChatBridge to avoid self-blocking)
                setTimeout(process, 3500);
            }
            else {
                this.isProcessingQueue = false;
            }
        };
        process();
    }
    /**
     * Auto relay injection is opt-in per tab: only when that tab's panel is open.
     * Allows explicit override for system workflows by setting metadata.forceInject=true.
     */
    canAutoInjectRelayMessage(msg) {
        if (msg?.metadata?.forceInject === true)
            return true;
        const channelId = msg?.channel || msg?.metadata?.channel || this.currentChannel;
        if (channelId && this.isChannelPaused(String(channelId)))
            return false;
        return this.panelVisible;
    }
    isChannelPaused(channelId) {
        if (!channelId)
            return false;
        if (this.pausedChannels.has(channelId))
            return true;
        const normalized = channelId.trim().toLowerCase();
        if (!normalized)
            return false;
        for (const pausedId of this.pausedChannels) {
            if (String(pausedId).trim().toLowerCase() === normalized)
                return true;
        }
        return false;
    }
}
// Initialize with guard to prevent multiple instances
if (shouldSkipForPage()) {
    console.log('[GeminiBridge v7] Skipping content script on auth/challenge/IDE page');
}
else if (!window.__GEMINI_BRIDGE_INITIALIZED__) {
    window.__GEMINI_BRIDGE_INITIALIZED__ = true;
    new GeminiBridgeContentScript();
}
else {
    console.log('[GeminiBridge v7] Content script already initialized, skipping duplicate');
}

/******/ })()
;
//# sourceMappingURL=index.js.map
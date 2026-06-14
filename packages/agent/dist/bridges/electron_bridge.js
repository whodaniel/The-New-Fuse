"use strict";
/**
 * Electron Bridge - Desktop App Integration
 *
 * Enables communication between TNF agents and the Electron/Tauri desktop app:
 * - IPC (Inter-Process Communication) handling
 * - Native system access (file system, clipboard, notifications)
 * - Window management
 * - Deep linking
 *
 * CONNECTS TO:
 * - UniversalBridge: For transport abstraction
 * - Tauri App: Via IPC channels
 * - Chrome Extension: Via messaging
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElectronBridge = void 0;
const index_js_1 = require("./index.js");
const DEFAULT_CONFIG = {
    appName: 'tnf-desktop',
    version: '1.0.0',
    enableIPC: true,
    enableFileAccess: true,
    enableNotifications: true,
    allowedChannels: [
        'tnf:agent',
        'tnf:workflow',
        'tnf:system',
        'tnf:notification',
        'tnf:file',
        'tnf:extension',
    ],
};
// ============================================================
// ELECTRON BRIDGE IMPLEMENTATION
// ============================================================
class ElectronBridge extends index_js_1.BaseBridge {
    constructor(config = {}) {
        super('electron-bridge');
        // IPC handling
        this.ipcHandlers = new Map();
        this.pendingResponses = new Map();
        // Native capabilities
        this.capabilities = new Map();
        // Electron API references (set when running in Electron context)
        this.electronAPI = null;
        this.ipcRenderer = null;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.detectCapabilities();
        this.registerDefaultHandlers();
    }
    // ============================================================
    // CONNECTION MANAGEMENT
    // ============================================================
    async connect() {
        this.emit('connecting');
        try {
            // Try to detect Electron environment
            this.electronAPI = this.detectElectronAPI();
            this.ipcRenderer = this.detectIPCRenderer();
            if (this.ipcRenderer) {
                this.setupIPCListeners();
            }
            this.isConnected = true;
            this.emit('connected');
        }
        catch (error) {
            // Continue without Electron - may be running in browser or other context
            this.isConnected = true;
            this.emit('connected');
        }
    }
    async disconnect() {
        // Cancel pending responses
        for (const [id, pending] of this.pendingResponses) {
            clearTimeout(pending.timeout);
            pending.reject(new Error('Bridge disconnected'));
        }
        this.pendingResponses.clear();
        this.isConnected = false;
        this.emit('disconnected');
    }
    async sendMessage(message, messageType = index_js_1.MessageType.COMMAND, priority = index_js_1.Priority.MEDIUM) {
        const ipcMessage = {
            id: `ipc-${Date.now()}-${globalThis.crypto.randomUUID().split('-')[0]}`,
            channel: message.channel || 'tnf:agent',
            payload: message,
            timestamp: new Date(),
            sender: 'tnf-agent',
        };
        await this.send(ipcMessage);
    }
    // ============================================================
    // IPC COMMUNICATION
    // ============================================================
    /**
     * Send an IPC message
     */
    async send(message) {
        // Validate channel
        if (!this.config.allowedChannels.includes(message.channel)) {
            return {
                id: message.id,
                success: false,
                error: `Channel not allowed: ${message.channel}`,
            };
        }
        this.emit('ipc:sending', message);
        // If IPC renderer is available, use it
        if (this.ipcRenderer) {
            return this.sendViaIPC(message);
        }
        // Fallback: emit event for local handling
        this.emit('ipc:message', message);
        return {
            id: message.id,
            success: true,
            data: { queued: true },
        };
    }
    /**
     * Send and wait for response
     */
    async sendAndWait(channel, payload, timeout = 30000) {
        const message = {
            id: `ipc-${Date.now()}-${globalThis.crypto.randomUUID().split('-')[0]}`,
            channel,
            payload,
            timestamp: new Date(),
        };
        return new Promise((resolve, reject) => {
            const timeoutHandle = setTimeout(() => {
                this.pendingResponses.delete(message.id);
                reject(new Error(`IPC timeout after ${timeout}ms`));
            }, timeout);
            this.pendingResponses.set(message.id, {
                resolve,
                reject,
                timeout: timeoutHandle,
            });
            this.send(message).catch(reject);
        });
    }
    /**
     * Register an IPC handler
     */
    onChannel(channel, handler) {
        this.ipcHandlers.set(channel, handler);
        this.emit('ipc:handler:registered', { channel });
    }
    /**
     * Handle incoming IPC message
     */
    async handleMessage(message) {
        this.emit('ipc:received', message);
        // Check for pending response
        const pending = this.pendingResponses.get(message.id);
        if (pending) {
            clearTimeout(pending.timeout);
            pending.resolve({
                id: message.id,
                success: true,
                data: message.payload,
            });
            this.pendingResponses.delete(message.id);
            return;
        }
        // Find and execute handler
        const handler = this.ipcHandlers.get(message.channel);
        if (handler) {
            const response = await handler(message);
            this.emit('ipc:response', response);
        }
        else {
            this.emit('ipc:unhandled', message);
        }
    }
    // ============================================================
    // NATIVE CAPABILITIES
    // ============================================================
    /**
     * Get available capabilities
     */
    getCapabilities() {
        return Array.from(this.capabilities.values());
    }
    /**
     * Check if capability is available
     */
    hasCapability(id) {
        const capability = this.capabilities.get(id);
        return capability?.available ?? false;
    }
    /**
     * Show a notification
     */
    async showNotification(config) {
        if (!this.hasCapability('notifications')) {
            return false;
        }
        this.emit('notification:showing', config);
        // Try Electron notification
        if (this.electronAPI &&
            typeof this.electronAPI.showNotification === 'function') {
            await this.electronAPI.showNotification(config);
            return true;
        }
        // Fallback to web notification
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification(config.title, { body: config.body, icon: config.icon });
            return true;
        }
        return false;
    }
    /**
     * Read a file
     */
    async readFile(path) {
        if (!this.hasCapability('file-read')) {
            return null;
        }
        try {
            const response = await this.sendAndWait('tnf:file', {
                action: 'read',
                path,
            });
            return response.success ? response.data : null;
        }
        catch {
            return null;
        }
    }
    /**
     * Write a file
     */
    async writeFile(path, content) {
        if (!this.hasCapability('file-write')) {
            return false;
        }
        try {
            const response = await this.sendAndWait('tnf:file', {
                action: 'write',
                path,
                content,
            });
            return response.success;
        }
        catch {
            return false;
        }
    }
    /**
     * Open a URL in the default browser
     */
    async openExternal(url) {
        try {
            if (this.electronAPI &&
                typeof this.electronAPI.openExternal === 'function') {
                await this.electronAPI.openExternal(url);
                return true;
            }
            // Fallback to window.open
            if (typeof window !== 'undefined') {
                window.open(url, '_blank');
                return true;
            }
            return false;
        }
        catch {
            return false;
        }
    }
    /**
     * Get clipboard content
     */
    async getClipboard() {
        if (!this.hasCapability('clipboard-read')) {
            return null;
        }
        try {
            const response = await this.sendAndWait('tnf:system', {
                action: 'clipboard-read',
            });
            return response.success ? response.data : null;
        }
        catch {
            return null;
        }
    }
    /**
     * Set clipboard content
     */
    async setClipboard(text) {
        if (!this.hasCapability('clipboard-write')) {
            return false;
        }
        try {
            const response = await this.sendAndWait('tnf:system', {
                action: 'clipboard-write',
                text,
            });
            return response.success;
        }
        catch {
            return false;
        }
    }
    // ============================================================
    // WINDOW MANAGEMENT
    // ============================================================
    /**
     * Create a new window
     */
    async createWindow(config) {
        try {
            const response = await this.sendAndWait('tnf:system', {
                action: 'window-create',
                config,
            });
            return response.success ? response.data : null;
        }
        catch {
            return null;
        }
    }
    /**
     * Close a window
     */
    async closeWindow(windowId) {
        try {
            const response = await this.sendAndWait('tnf:system', {
                action: 'window-close',
                windowId,
            });
            return response.success;
        }
        catch {
            return false;
        }
    }
    /**
     * Minimize window
     */
    async minimizeWindow() {
        await this.sendAndWait('tnf:system', { action: 'window-minimize' });
    }
    /**
     * Maximize window
     */
    async maximizeWindow() {
        await this.sendAndWait('tnf:system', { action: 'window-maximize' });
    }
    // ============================================================
    // PRIVATE HELPERS
    // ============================================================
    detectElectronAPI() {
        if (typeof window !== 'undefined' && 'electronAPI' in window) {
            return window.electronAPI;
        }
        return null;
    }
    detectIPCRenderer() {
        if (typeof window !== 'undefined' && 'require' in window) {
            try {
                const { ipcRenderer } = window.require('electron');
                return ipcRenderer;
            }
            catch {
                return null;
            }
        }
        return null;
    }
    detectCapabilities() {
        this.capabilities.set('ipc', {
            id: 'ipc',
            name: 'IPC Communication',
            description: 'Inter-process communication with main process',
            available: this.config.enableIPC,
        });
        this.capabilities.set('file-read', {
            id: 'file-read',
            name: 'File Read',
            description: 'Read files from the file system',
            available: this.config.enableFileAccess,
        });
        this.capabilities.set('file-write', {
            id: 'file-write',
            name: 'File Write',
            description: 'Write files to the file system',
            available: this.config.enableFileAccess,
        });
        this.capabilities.set('notifications', {
            id: 'notifications',
            name: 'Notifications',
            description: 'Show system notifications',
            available: this.config.enableNotifications,
        });
        this.capabilities.set('clipboard-read', {
            id: 'clipboard-read',
            name: 'Clipboard Read',
            description: 'Read from system clipboard',
            available: true,
        });
        this.capabilities.set('clipboard-write', {
            id: 'clipboard-write',
            name: 'Clipboard Write',
            description: 'Write to system clipboard',
            available: true,
        });
    }
    setupIPCListeners() {
        if (!this.ipcRenderer)
            return;
        const ipc = this.ipcRenderer;
        // Listen for messages on allowed channels
        for (const channel of this.config.allowedChannels) {
            ipc.on(channel, async (event, ...args) => {
                const message = args[0];
                await this.handleMessage(message);
            });
        }
    }
    async sendViaIPC(message) {
        if (!this.ipcRenderer) {
            return {
                id: message.id,
                success: false,
                error: 'IPC not available',
            };
        }
        const ipc = this.ipcRenderer;
        try {
            const result = await ipc.invoke(message.channel, message);
            return {
                id: message.id,
                success: true,
                data: result,
            };
        }
        catch (error) {
            return {
                id: message.id,
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    registerDefaultHandlers() {
        // Register default channel handlers
        this.onChannel('tnf:system', async (message) => {
            const action = message.payload.action;
            return {
                id: message.id,
                success: true,
                data: { action, handled: true },
            };
        });
    }
    // ============================================================
    // STATISTICS
    // ============================================================
    getStatistics() {
        return {
            connected: this.isConnected,
            hasElectronAPI: this.electronAPI !== null,
            hasIPCRenderer: this.ipcRenderer !== null,
            capabilities: this.capabilities.size,
            pendingResponses: this.pendingResponses.size,
            handlers: this.ipcHandlers.size,
        };
    }
}
exports.ElectronBridge = ElectronBridge;
exports.default = ElectronBridge;
//# sourceMappingURL=electron_bridge.js.map
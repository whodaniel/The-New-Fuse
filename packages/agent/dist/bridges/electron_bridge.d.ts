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
import { BaseBridge, MessageType, Priority } from './index.js';
export interface IPCMessage {
    id: string;
    channel: string;
    payload: unknown;
    timestamp: Date;
    sender?: string;
}
export interface IPCResponse {
    id: string;
    success: boolean;
    data?: unknown;
    error?: string;
}
export interface NativeCapability {
    id: string;
    name: string;
    description: string;
    available: boolean;
}
export interface FileSystemAccess {
    read: boolean;
    write: boolean;
    allowedPaths?: string[];
}
export interface NotificationConfig {
    title: string;
    body: string;
    icon?: string;
    silent?: boolean;
    urgency?: 'low' | 'normal' | 'critical';
}
export interface WindowConfig {
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    title?: string;
    resizable?: boolean;
    alwaysOnTop?: boolean;
}
export interface ElectronBridgeConfig {
    appName: string;
    version: string;
    enableIPC: boolean;
    enableFileAccess: boolean;
    enableNotifications: boolean;
    allowedChannels: string[];
}
export declare class ElectronBridge extends BaseBridge {
    private config;
    private ipcHandlers;
    private pendingResponses;
    private capabilities;
    private electronAPI;
    private ipcRenderer;
    constructor(config?: Partial<ElectronBridgeConfig>);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendMessage(message: Record<string, unknown>, messageType?: MessageType, priority?: Priority): Promise<void>;
    /**
     * Send an IPC message
     */
    send(message: IPCMessage): Promise<IPCResponse>;
    /**
     * Send and wait for response
     */
    sendAndWait(channel: string, payload: unknown, timeout?: number): Promise<IPCResponse>;
    /**
     * Register an IPC handler
     */
    onChannel(channel: string, handler: (message: IPCMessage) => Promise<IPCResponse>): void;
    /**
     * Handle incoming IPC message
     */
    handleMessage(message: IPCMessage): Promise<void>;
    /**
     * Get available capabilities
     */
    getCapabilities(): NativeCapability[];
    /**
     * Check if capability is available
     */
    hasCapability(id: string): boolean;
    /**
     * Show a notification
     */
    showNotification(config: NotificationConfig): Promise<boolean>;
    /**
     * Read a file
     */
    readFile(path: string): Promise<string | null>;
    /**
     * Write a file
     */
    writeFile(path: string, content: string): Promise<boolean>;
    /**
     * Open a URL in the default browser
     */
    openExternal(url: string): Promise<boolean>;
    /**
     * Get clipboard content
     */
    getClipboard(): Promise<string | null>;
    /**
     * Set clipboard content
     */
    setClipboard(text: string): Promise<boolean>;
    /**
     * Create a new window
     */
    createWindow(config: WindowConfig): Promise<string | null>;
    /**
     * Close a window
     */
    closeWindow(windowId?: string): Promise<boolean>;
    /**
     * Minimize window
     */
    minimizeWindow(): Promise<void>;
    /**
     * Maximize window
     */
    maximizeWindow(): Promise<void>;
    private detectElectronAPI;
    private detectIPCRenderer;
    private detectCapabilities;
    private setupIPCListeners;
    private sendViaIPC;
    private registerDefaultHandlers;
    getStatistics(): {
        connected: boolean;
        hasElectronAPI: boolean;
        hasIPCRenderer: boolean;
        capabilities: number;
        pendingResponses: number;
        handlers: number;
    };
}
export default ElectronBridge;
//# sourceMappingURL=electron_bridge.d.ts.map
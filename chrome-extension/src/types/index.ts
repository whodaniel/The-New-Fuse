// Common types
export interface LogEntry {
    timestamp: number;
    level: 'info' | 'warn' | 'error';
    message: string;
    details?: any;
    name?: string;
    data?: any;
}

export interface DebugSettings {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    enableVerboseLogging: boolean;
    saveLogsToFile: boolean;
    debugMode: boolean;
    verboseLogging: boolean;
    logToConsole: boolean;
    logToStorage: boolean;
    maxLogSize: number;
}

export interface WebSocketServerStatus {
    isRunning: boolean;
    port: number;
    connectedClients: number;
    error?: string;
    message?: string;
    uptime?: number;
}

export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    env?: 'development' | 'production' | 'custom';
    username?: string;
    tls?: boolean;
}

export type WebSocketEventType = 
    | 'connect'
    | 'disconnect'
    | 'message'
    | 'error';

export interface WebSocketEventListener {
    (event: any): void;
}

export interface WebSocketEventListenerOptions {
    once?: boolean;
    reconnectDelay?: number;
}

// File Transfer Types
export interface FileTransferMessage {
    type: string;
    fileId: string;
    error?: string;
}

export interface FileTransferManager {
    getActiveTransfers(): Map<string, any>;
}

// Add any additional types needed by the application

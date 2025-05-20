/// <reference types="node" />
import { EventEmitter } from 'events';
import { ConnectionStatus } from '../types/shared.js';
export declare class ChromeExtensionHandler extends EventEmitter {
    private static instance;
    private logger;
    private relayService;
    private chromeWebSocketService;
    private conversationManager;
    private status;
    private lastPingTime;
    private pingInterval;
    private readonly PING_INTERVAL;
    private readonly PING_TIMEOUT;
    private constructor();
    static getInstance(): ChromeExtensionHandler;
    private setupHandlers;
    initialize(): Promise<void>;
    private startPingInterval;
    private sendPing;
    private checkConnection;
    private updateStatus;
    private handleChromeMessage;
    private handleCodeInput;
    private handleAIRequest;
    private handleConversationStart;
    private sendToChromeExtension;
    getStatus(): ConnectionStatus;
    dispose(): void;
    private stopPinging;
}
//# sourceMappingURL=chrome-extension-handler.d.ts.map
import { ExtensionLogger } from '../src/core/logging.js';
export interface WebViewMessage {
    command: string;
    data?: any;
    text?: string;
    timestamp?: string;
}
type MessageHandler = (message: WebViewMessage) => Promise<void>;
interface RelayServiceOptions {
    port?: number;
    logger?: ExtensionLogger;
}
export declare class RelayService {
    private static instance;
    private logger;
    private connections;
    private handlers;
    private wsServer;
    private wsClient;
    private port;
    constructor(options?: RelayServiceOptions);
    static getInstance(): RelayService;
    initialize(): Promise<void>;
    private handleWebSocketMessage;
    private handleRelayMessage;
    registerConnection(id: string, connection: any): void;
    unregisterConnection(id: string): void;
    registerHandler(command: string, handler: MessageHandler): void;
    unregisterHandler(command: string): void;
    sendMessage(id: string, message: WebViewMessage): void;
    /**
     * Send a message to a web client
     */
    sendMessageToWeb(message: WebViewMessage): Promise<void>;
    /**
     * Get the current connection status
     */
    getConnectionStatus(): boolean;
    broadcast(message: WebViewMessage): void;
    dispose(): void;
}
export {};
//# sourceMappingURL=relay-service.d.ts.map
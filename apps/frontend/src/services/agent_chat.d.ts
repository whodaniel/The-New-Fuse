import { EventEmitter } from 'events';
export declare class AgentChatService extends EventEmitter {
    constructor();
    static getInstance(): any;
    setupWebSocketListeners(): void;
    sendMessage(content: any, metadata: any): Promise<void>;
    getMessageHistory(): any[];
    clearHistory(): void;
}

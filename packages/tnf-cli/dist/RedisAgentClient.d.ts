export interface AgentInfo {
    id: string;
    name: string;
    role: 'orchestrator' | 'broker' | 'worker' | 'participant';
    platform: 'antigravity' | 'gemini' | 'claude' | 'jules' | 'vscode' | 'browser' | string;
    status: 'active' | 'idle' | 'offline';
    capabilities: string[];
    registeredAt: string;
    lastSeen: string;
    isOnline?: boolean;
}
export interface AgentMessage {
    id: string;
    timestamp: string;
    from: {
        agentId: string;
        agentName: string;
        role: string;
        platform: string;
    };
    to?: {
        agentId?: string;
        channel?: string;
        role?: string;
        broadcast?: boolean;
    };
    type: 'message' | 'command' | 'response' | 'heartbeat' | 'status' | 'auction' | 'bid' | 'award' | 'task' | 'event' | 'query';
    content: string;
    payload?: any;
    conversationId?: string;
    replyTo?: string;
    expectsResponse?: boolean;
    metadata?: any;
}
export declare const CONFIG: {
    redis: {
        host: string;
        port: number;
        password: string | undefined;
        url: string | undefined;
        keyPrefix: string;
    };
    channels: {
        agents: string;
        conversations: string;
        orchestrator: string;
        broker: string;
        heartbeat: string;
        directPrefix: string;
    };
    heartbeatInterval: number;
};
export declare class RedisAgentClient {
    private publisher;
    private subscriber;
    private upstash;
    private agentInfo;
    private messageHandlers;
    private heartbeatTimer;
    currentConversation: string | null;
    private lastRedisErrorLoggedAt;
    private static readonly REDIS_ERROR_LOG_COOLDOWN_MS;
    constructor();
    initialize(): Promise<void>;
    private logRedisClientError;
    register(name: string, role: any, platform: string, capabilities?: string[]): Promise<AgentInfo>;
    /**
     * Listen for task auctions
     */
    onAuction(callback: (auction: any) => void): void;
    /**
     * Submit a bid for an auction
     */
    submitBid(taskId: string, suitability: number, metadata?: any): Promise<void>;
    private getDefaultCapabilities;
    send(content: string, options?: any): Promise<AgentMessage>;
    broadcast(options: any): Promise<AgentMessage>;
    startConversation(topic: string): Promise<string>;
    joinConversation(conversationId: string): void;
    private handleIncomingMessage;
    private normalizeIncomingMessage;
    private formatTaskForWorker;
    onMessage(type: string, handler: (message: AgentMessage, channel: string) => void): void;
    private startHeartbeat;
    listAgents(): Promise<AgentInfo[]>;
    createChannel(channelName: string): Promise<string>;
    /**
     * Log real-time activity to the swarm log
     */
    logActivity(eventType: string, content: string, metadata?: any): Promise<void>;
    getChannels(): Promise<string[]>;
    cleanup(): Promise<void>;
}
//# sourceMappingURL=RedisAgentClient.d.ts.map
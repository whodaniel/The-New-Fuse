export interface ChannelData {
    members: Set<string>;
    lastActivity: number;
    messageCount: number;
}
export declare class ChannelManagerService {
    channels: Map<string, ChannelData>;
    private sendToRelay;
    private redisClient;
    private agentRegistry;
    private orchestratorIdentity;
    private emitActivityEvent;
    constructor(sendToRelay: (msg: any) => void, redisClient: any, // Placeholder for RedisClientManager
    agentRegistry: any, // Placeholder for AgentRegistryService
    orchestratorIdentity: any, emitActivityEvent: (eventType: string, content: string, metadata: Record<string, unknown>) => Promise<void>);
    private attachOrchestratorAudit;
    joinAllChannels(): Promise<void>;
    broadcastToChannel(channel: string, content: string): void;
    broadcastDiscovery(): void;
    handleChannelCreate(msg: any): Promise<void>;
    handleAgentJoined(channel: string, agentId: string): void;
    updateChannelActivity(channel: string): void;
    broadcastAgentOffline(agentId: string): void;
    sendSigningReminder(channel: string, agentId: string): void;
}
//# sourceMappingURL=channel-manager.service.d.ts.map
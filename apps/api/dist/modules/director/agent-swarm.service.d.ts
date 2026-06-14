import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
export declare class AgentSwarmService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private agents;
    private heartbeatInterval;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): void;
    registerAgent(agent: {
        id: string;
        name: string;
        capabilities: string[];
    }): void;
    unregisterAgent(agentId: string): void;
    recordHeartbeat(agentId: string): void;
    findAgentsByCapability(capability: string): any[];
    private startHeartbeatMonitor;
    private stopHeartbeatMonitor;
    getStatistics(): {
        totalAgents: number;
        onlineAgents: number;
        offlineAgents: number;
        agentsByCapability: Record<string, number>;
    };
    getAgents(): {
        id: any;
        name: any;
        capabilities: any[];
        status: any;
        lastHeartbeat: any;
    }[];
}
//# sourceMappingURL=agent-swarm.service.d.ts.map
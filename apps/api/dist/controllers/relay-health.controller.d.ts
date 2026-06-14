export declare class RelayHealthController {
    private lastHeartbeat;
    private messageCount;
    private connectedAgents;
    getHealth(): {
        status: string;
        uptime: number;
        memory: NodeJS.MemoryUsage;
        lastHeartbeat: number;
        messageCount: number;
        connectedAgents: {
            id: string;
            lastSeen: number;
            age: number;
        }[];
    };
    getAgents(): {
        count: number;
        agents: {
            id: string;
            lastSeen: string;
            status: string;
        }[];
    };
    recordHeartbeat(agentId: string): void;
}
//# sourceMappingURL=relay-health.controller.d.ts.map
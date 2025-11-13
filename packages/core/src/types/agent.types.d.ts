export declare enum AgentStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    CONNECTING = "connecting",
    ERROR = "error"
}
export type AgentStatusType = 'active' | 'inactive' | 'connecting' | 'error';
export interface AgentHealth {
    status: AgentStatus;
    lastSeen: Date;
    uptime: number;
    memoryUsage: {
        used: number;
        total: number;
    };
    cpuUsage: number;
    messageQueue: {
        size: number;
        pending: number;
    };
    activeConnections: number;
    errorRate: number;
    responseTime: number;
}
export interface AgentMetrics {
    messagesProcessed: number;
    errorCount: number;
    averageResponseTime: number;
    uptime: number;
    lastActivity: Date;
}
//# sourceMappingURL=agent.types.d.ts.map
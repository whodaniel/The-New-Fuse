export declare class UnifiedMonitor {
    private redisMonitor;
    private agentMonitor;
    private metrics;
    constructor();
    private initializeMonitoring;
    private processMetrics;
    getAgentStatus(agentId: string): AgentStatus;
    getSystemHealth(): SystemHealth;
}

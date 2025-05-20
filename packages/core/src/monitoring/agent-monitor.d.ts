export declare class AgentMonitor {
    private static instance;
    private metrics;
    private heartbeatIntervals;
    private constructor();
    static getInstance(): AgentMonitor;
    private initializeHeartbeat;
    private sendHeartbeat;
    private monitorHeartbeat;
    private updateAgentStatus;
    private emitAlert;
}

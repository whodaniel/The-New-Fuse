/**
 * AgentMetrics holds monitoring data for AI agents, including tool usage,
 * response times, errors, and active agent tracking.
 */
export interface AgentMetrics {
    toolUsage: Map<string, number>;
    responseTime: number[];
    errorCount: number;
    activeAgents: string[];
    toolSuccessRate: Map<string, {
        success: number;
        failure: number;
    }>;
    responseTimeByTool: Map<string, number[]>;
    activeToolExecutions: Map<string, {
        startTime: number;
        toolId: string;
    }>;
    mostRecentTools: {
        agentId: string;
        toolId: string;
        timestamp: number;
        success: boolean;
    }[];
}
/**
 * Status of an agent
 */
export declare enum AgentStatus {
    ACTIVE = "active",
    IDLE = "idle",
    ERROR = "error"
}
/**
 * Interface for tool execution tracking
 */
export interface ToolExecution {
    agentId: string;
    toolId: string;
    startTime: number;
    endTime?: number;
    success?: boolean;
    error?: Error;
    metadata?: Record<string, any>;
    traceId?: string;
}
/**
 * AgentMonitor provides singleton monitoring for all AI agents.
 */
export declare class AgentMonitor {
    private static instance;
    private metrics;
    private logger;
    private telemetry;
    private enabled;
    private backendEnabled;
    private backendUrl;
    private eventQueue;
    private flushInterval;
    private constructor();
    /**
     * Load settings from VS Code configuration
     */
    private loadSettings;
    /**
     * Start the interval to flush events to the backend
     */
    private startFlushInterval;
    /**
     * Stop the flush interval
     */
    private stopFlushInterval;
    /**
     * Flush queued events to the backend
     */
    private flushEvents;
    static getInstance(): AgentMonitor;
    setEnabled(enabled: boolean): void;
    isEnabled(): boolean;
    /**
     * Configure backend telemetry settings
     */
    setBackendSettings(enabled: boolean, url?: string): void;
    /**
     * Track usage of a specific tool by an agent
     */
    trackToolUsage(agentId: string, toolId: string, executionTime: number): void;
    /**
     * Start tracking a tool execution
     */
    startToolExecution(agentId: string, toolId: string, metadata?: Record<string, any>, traceId?: string): string;
    /**
     * Complete a tool execution (success or failure)
     */
    completeToolExecution(executionId: string, agentId: string, success: boolean, error?: Error, metadata?: Record<string, any>): void;
    /**
     * Track an error encountered by an agent
     */
    trackError(agentId: string, error: Error): void;
    /**
     * Update the list of currently active agents
     */
    updateActiveAgents(agents: string[]): void;
    /**
     * Update status for a specific agent
     */
    updateAgentStatus(agentId: string, status: AgentStatus): void;
    /**
     * Add a tool usage to the recent tools list
     */
    private addRecentTool;
    /**
     * Queue an event to be sent to the backend
     */
    private queueEvent;
    /**
     * Get the current monitoring metrics for agents
     */
    getMetrics(): AgentMetrics;
    /**
     * Get success rate for a specific tool
     */
    getToolSuccessRate(toolId: string): {
        success: number;
        failure: number;
        rate: number;
    };
    /**
     * Get average response time for a specific tool
     */
    getToolAverageResponseTime(toolId: string): number;
    /**
     * Get the most recent tool usages
     */
    getRecentToolUsage(limit?: number): typeof this.metrics.mostRecentTools;
}
//# sourceMappingURL=AgentMonitor.d.ts.map
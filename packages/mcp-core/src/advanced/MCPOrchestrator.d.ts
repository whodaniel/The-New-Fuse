/**
 * Advanced MCP Orchestrator
 *
 * Provides sophisticated orchestration capabilities for multi-agent coordination,
 * intelligent task distribution, real-time collaboration, and advanced automation.
 */
import { EventEmitter } from 'events';
import { IMCPBroker } from '../interfaces';
export interface AgentCapability {
    id: string;
    name: string;
    description: string;
    category: 'automation' | 'analysis' | 'communication' | 'integration' | 'monitoring';
    complexity: 'simple' | 'moderate' | 'complex' | 'expert';
    dependencies: string[];
    performance: {
        averageResponseTime: number;
        successRate: number;
        resourceUsage: number;
    };
}
export interface TaskDistributionStrategy {
    type: 'round-robin' | 'capability-based' | 'load-balanced' | 'priority-queue' | 'intelligent';
    parameters: Record<string, any>;
}
export interface CollaborationSession {
    id: string;
    participants: string[];
    context: Record<string, any>;
    sharedState: Record<string, any>;
    startTime: Date;
    lastActivity: Date;
    status: 'active' | 'paused' | 'completed' | 'failed';
}
export interface OrchestrationMetrics {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageTaskTime: number;
    agentUtilization: Record<string, number>;
    collaborationSessions: number;
    systemLoad: number;
}
export declare class MCPOrchestrator extends EventEmitter {
    private broker;
    private config;
    private agents;
    private activeTasks;
    private collaborationSessions;
    private webSocketConnections;
    private taskQueue;
    private metrics;
    private distributionStrategy;
    constructor(broker: IMCPBroker, config?: {
        maxConcurrentTasks?: number;
        taskTimeout?: number;
        enableRealTimeCollaboration?: boolean;
        enableIntelligentRouting?: boolean;
        metricsInterval?: number;
    });
    private initializeOrchestrator;
    /**
     * Register an agent with the orchestrator
     */
    registerAgent(capability: AgentCapability): Promise<void>;
    /**
     * Distribute task to most suitable agent
     */
    distributeTask(task: {
        id: string;
        type: string;
        payload: any;
        priority: 'low' | 'medium' | 'high' | 'critical';
        requiredCapabilities: string[];
        deadline?: Date;
    }): Promise<string>;
    /**
     * Create a collaboration session between multiple agents
     */
    createCollaborationSession(sessionId: string, participantIds: string[], context?: Record<string, any>): Promise<CollaborationSession>;
    /**
     * Enable real-time communication between agents in a session
     */
    enableRealTimeCollaboration(sessionId: string): Promise<void>;
    /**
     * Advanced task routing with AI-powered decision making
     */
    private findBestAgent;
    private calculateAgentScore;
    private createWebSocketConnection;
    private setupCollaborationBroadcasting;
    private broadcastToSession;
    private handleRealtimeMessage;
    private handleTaskCompletion;
    private handleTaskFailure;
    private notifyAgent;
    private getTaskContext;
    private collectMetrics;
    private initializeCollaborationSystem;
    private initializeIntelligentRouting;
    private handleCollaborationUpdate;
    private handleTaskProgress;
    private handleCapabilityUpdate;
    /**
     * Get public metrics (without sensitive data)
     */
    getPublicMetrics(): Partial<OrchestrationMetrics>;
    /**
     * Get detailed orchestration status
     */
    getStatus(): {
        agents: number;
        activeTasks: number;
        collaborationSessions: number;
        metrics: OrchestrationMetrics;
        health: 'healthy' | 'degraded' | 'critical';
    };
    /**
     * Shutdown orchestrator gracefully
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=MCPOrchestrator.d.ts.map
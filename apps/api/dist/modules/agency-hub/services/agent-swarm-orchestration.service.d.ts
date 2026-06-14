import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@the-new-fuse/database';
export interface SwarmConfiguration {
    maxConcurrentExecutions: number;
    defaultQualityThreshold: number;
    enableAutoScaling: boolean;
    agentSelectionStrategy: 'round_robin' | 'quality_based' | 'load_balanced';
    coordinationMode: 'centralized' | 'distributed' | 'hybrid';
}
export interface SwarmAgent {
    id: string;
    agencyId: string;
    name: string;
    type: 'specialized' | 'generalist' | 'coordinator';
    capabilities: string[];
    currentLoad: number;
    maxLoad: number;
    qualityScore: number;
    status: 'active' | 'busy' | 'offline' | 'error';
    lastHeartbeat: Date;
}
export interface SwarmTask {
    id: string;
    agencyId: string;
    type: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    payload: any;
    requirements: string[];
    assignedAgents: string[];
    status: 'pending' | 'assigned' | 'executing' | 'completed' | 'failed';
    progress: number;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    result?: any;
    errors?: string[];
}
export interface SwarmExecution {
    id: string;
    taskId: string;
    agencyId: string;
    coordinatorAgent: string;
    participatingAgents: SwarmAgent[];
    executionPlan: {
        phases: Array<{
            name: string;
            agents: string[];
            dependencies: string[];
            estimatedDuration: number;
        }>;
    };
    status: 'planning' | 'executing' | 'completed' | 'failed';
    metrics: {
        startTime: Date;
        endTime?: Date;
        totalDuration?: number;
        agentUtilization: Record<string, number>;
        qualityScore?: number;
    };
}
export interface SwarmStatus {
    agencyId: string;
    isSwarmEnabled: boolean;
    activeExecutions: number;
    totalProviders: number;
    activeProviders: number;
    availableCategories: string[];
    recentActivity: {
        totalRequests: number;
        completedRequests: number;
        failedRequests: number;
        averageResponseTime: number;
    };
    healthMetrics: {
        overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
        agentConnectivity: number;
        systemLoad: number;
        errorRate: number;
    };
}
export declare class AgentSwarmOrchestrationService {
    private readonly db;
    private readonly eventEmitter;
    private readonly logger;
    private swarmConfigurations;
    private activeAgents;
    private activeExecutions;
    private taskQueue;
    constructor(db: DatabaseService, eventEmitter: EventEmitter2);
    /**
     * Initialize swarm (global initialization for compatibility with EnhancedAgencyService)
     */
    initializeSwarm(): Promise<{
        message: string;
        agentCount: number;
    }>;
    /**
     * Get global swarm status (aggregated across all agencies)
     * Note: Use getSwarmStatus(agencyId) for agency-specific status
     */
    getGlobalSwarmStatus(): Promise<{
        totalAgents: number;
        onlineAgents: number;
        busyAgents: number;
        offlineAgents: number;
        activeExecutions: number;
        completedExecutions: number;
    }>;
    /**
     * Initialize swarm orchestration for an agency
     */
    initializeAgencySwarm(agencyId: string, config?: Partial<SwarmConfiguration>): Promise<void>;
    /**
     * Disable swarm orchestration for an agency
     */
    disableAgencySwarm(agencyId: string): Promise<void>;
    /**
     * Register an agent with the swarm
     */
    registerAgent(agencyId: string, agent: Omit<SwarmAgent, 'id' | 'agencyId' | 'lastHeartbeat'>): Promise<string>;
    /**
     * Submit a task for swarm execution
     */
    submitTask(agencyId: string, task: Omit<SwarmTask, 'id' | 'agencyId' | 'status' | 'progress' | 'createdAt'>): Promise<string>;
    /**
     * Get swarm status for an agency
     */
    getSwarmStatus(agencyId: string): Promise<SwarmStatus>;
    /**
     * Get execution metrics for an agency
     */
    getExecutionMetrics(agencyId: string): Promise<any>;
    /**
     * Process task queue and assign tasks to available agents
     */
    private processTaskQueue;
    /**
     * Find suitable agents for a task based on capabilities and availability
     */
    private findSuitableAgents;
    /**
     * Assign a task to selected agents
     */
    private assignTaskToAgents;
    private completeExecution;
    /**
     * Terminate an execution
     */
    private terminateExecution;
    /**
     * Initialize heartbeat monitoring for agents
     */
    private initializeHeartbeatMonitoring;
    /**
     * Monitor agent heartbeats and update status
     */
    private monitorAgentHeartbeats;
    /**
     * Calculate overall health for an agency's swarm
     */
    private calculateOverallHealth;
    /**
     * Calculate system load for an agency
     */
    private calculateSystemLoad;
    /**
     * Calculate average execution time
     */
    private calculateAverageExecutionTime;
    /**
     * Calculate agent utilization
     */
    private calculateAgentUtilization;
}
//# sourceMappingURL=agent-swarm-orchestration.service.d.ts.map
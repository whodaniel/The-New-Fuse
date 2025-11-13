/**
 * Agent Swarm Orchestration Service
 * Manages multi-agent coordination, task distribution, and execution monitoring
 * Integrates with the Enhanced Agency Service for comprehensive agent management
 */
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@the-new-fuse/database';
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
    private readonly prisma;
    private readonly eventEmitter;
    private readonly logger;
    private swarmConfigurations;
    private activeAgents;
    private activeExecutions;
    private taskQueue;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
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
     * Terminate an execution
     */
    private terminateExecution;
}
//# sourceMappingURL=agent-swarm-orchestration.service.d.ts.map
/**
 * Orchestrator Integration Service
 *
 * Integrates all orchestration components:
 * - Handoff template system
 * - Heartbeat monitoring
 * - Cleanup service
 * - Agent swarm coordination
 * - State preservation with Redis, NestJS, RAG, and Graph systems
 */
import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
export interface OrchestratorConfig {
    workspaceRoot: string;
    enableHeartbeatMonitoring: boolean;
    enableCleanup: boolean;
    enableStatePreservation: boolean;
    redis: {
        host: string;
        port: number;
        database: number;
    };
    heartbeat: {
        intervalMs: number;
        timeoutMs: number;
        maxRetries: number;
        escalationDelay: number;
        stagnationThresholdMs: number;
    };
    stall: {
        stallThresholdMs: number;
        checkIntervalMs: number;
        maxRecoveryAttempts: number;
        autoRecover: boolean;
    };
    cleanup: {
        backupDirectory: string;
        dryRun: boolean;
        createBackups: boolean;
    };
}
export interface TaskState {
    taskId: string;
    agentId: string;
    status: 'pending' | 'in_progress' | 'stalled' | 'completed' | 'failed';
    startTime: Date;
    lastUpdate: Date;
    context: Record<string, any>;
    handoffHistory: string[];
    stagnationCount: number;
}
export interface OrchestrationMetrics {
    totalTasks: number;
    activeTasks: number;
    stalledTasks: number;
    completedTasks: number;
    averageTaskDuration: number;
    handoffSuccessRate: number;
    stagnationRate: number;
    cleanupEfficiency: number;
}
export declare class OrchestratorIntegrationService extends EventEmitter {
    private logger;
    private config;
    private cleanupService;
    private heartbeatService;
    private stallDetector;
    private handoffService;
    private taskStates;
    private isInitialized;
    constructor(config: OrchestratorConfig, logger: Logger);
    /**
     * Initialize all orchestration services
     */
    initialize(): Promise<boolean>;
    /**
     * Shutdown all orchestration services
     */
    shutdown(): Promise<void>;
    /**
     * Setup event handlers for cross-service communication
     */
    private setupEventHandlers;
    /**
     * Initialize state preservation systems (Redis, NestJS, RAG, Graph)
     */
    private initializeStatePreservation;
    /**
     * Initialize Redis for distributed state management
     */
    private initializeRedisStatePreservation;
    /**
     * Initialize todo/task management integration
     */
    private initializeTodoManagement;
    /**
     * Initialize RAG integration for context preservation
     */
    private initializeRAGIntegration;
    /**
     * Initialize Graph database integration
     */
    private initializeGraphIntegration;
    /**
     * Handle conversation stall detection
     */
    private handleConversationStalled;
    /**
     * Record conversation activity
     */
    recordConversationActivity(channelId: string, agentId?: string, hasContent?: boolean): void;
    /**
     * Get stall statistics
     */
    getStallStats(): {
        total: number;
        active: number;
        stalled: number;
        completed: number;
        terminated: number;
        totalRecoveryAttempts: number;
    };
    /**
     * Handle stagnation detection
     */
    private handleStagnationDetected;
    /**
     * Handle agent ping requirements
     */
    private handleAgentPingRequired;
    /**
     * Handle escalation requirements
     */
    private handleEscalationRequired;
    /**
     * Handle human intervention requirements
     */
    private handleHumanInterventionRequired;
    /**
     * Handle task reassignment
     */
    private handleTaskReassignment;
    /**
     * Create anti-stagnation handoff prompt
     */
    private createAntiStagnationHandoff;
    /**
     * Get anti-stagnation strategies based on stagnation type
     */
    private getAntiStagnationStrategies;
    /**
     * Get fallback options based on severity
     */
    private getFallbackOptions;
    /**
     * Record task start
     */
    private recordTaskStart;
    /**
     * Record task progress
     */
    private recordTaskProgress;
    /**
     * Record task completion
     */
    private recordTaskCompletion;
    /**
     * Get task context for handoff preservation
     */
    private getTaskContext;
    /**
     * Generate human action recommendations
     */
    private generateHumanActionRecommendations;
    /**
     * Perform final cleanup
     */
    private performFinalCleanup;
    /**
     * Get comprehensive orchestration metrics
     */
    getOrchestrationMetrics(): OrchestrationMetrics;
    /**
     * Get service status
     */
    getServiceStatus(): {
        initialized: boolean;
        heartbeatMonitoring: any;
        cleanup: any;
        taskStates: number;
        metrics: OrchestrationMetrics;
    };
}
//# sourceMappingURL=OrchestratorIntegrationService.d.ts.map
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
import { Logger } from '../utils/Logger.js';
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
     * Handle stagnation detection
     */
    private handleStagnationDetected;
}
//# sourceMappingURL=OrchestratorIntegrationService.d.ts.map
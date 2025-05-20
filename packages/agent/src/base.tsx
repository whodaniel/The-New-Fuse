/**
 * Base classes and interfaces for agent system.
 */
import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { v4 as uuidv4 } from 'uuid';

import { BaseBridge, MessageType, Priority } from '../bridges.js';
import { ContextManager, ContextType } from '../context/manager.js';
import { ErrorRecovery, ErrorCategory, ErrorSeverity } from '../error/recovery.js';
import { MetricsRegistry, PerformanceMonitor } from '../monitoring/metrics.js';

// Create logger
const logger = (Logger as any).createLogger({
    level: 'info',
    format: (Logger as any).format.json(),
    transports: [new (Logger as any).transports.Console()]
});

export enum AgentState {
    INITIALIZING = 'INITIALIZING',
    READY = 'READY',
    BUSY = 'BUSY',
    ERROR = 'ERROR',
    TERMINATED = 'TERMINATED'
}

export enum AgentCapability {
    CODE_GENERATION = 'code_generation',
    CODE_REVIEW = 'code_review',
    ARCHITECTURE_DESIGN = 'architecture_design',
    TESTING = 'testing',
    DOCUMENTATION = 'documentation',
    OPTIMIZATION = 'optimization',
    SECURITY_AUDIT = 'security_audit',
    PROJECT_MANAGEMENT = 'project_management'
}

export interface AgentConfig {
    agentId: string;
    capabilities: Set<AgentCapability>;
    modelName?: string;
    maxConcurrentTasks?: number;
    taskTimeout?: number;  // seconds
    retryLimit?: number;
    memoryLimit?: number;  // number of context items to remember
}

export interface Task {
    taskId: string;
    type: string;
    priority: Priority;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
    message: Record<string, unknown>;
    startTime?: number;
    result?: unknown;
    error?: Error;
}

export abstract class BaseAgent extends EventEmitter {
    protected config: AgentConfig;
    protected bridge?: BaseBridge;
    protected contextManager: ContextManager;
    protected metrics: MetricsRegistry;
    protected monitor: PerformanceMonitor;
    protected errorRecovery: ErrorRecovery;
    
    protected state: AgentState = AgentState.INITIALIZING;
    protected tasks: Map<string, Task> = new Map();
    protected context: Map<string, any> = new Map();
    protected shouldRun: boolean = false;
    protected taskProcessor?: Promise<void>;

    constructor(
        config: AgentConfig,
        bridge?: BaseBridge,
        redisClient?: Redis
    ) {
        super();
        this.config = {
            modelName: 'gpt-4',
            maxConcurrentTasks: 5,
            taskTimeout: 300,
            retryLimit: 3,
            memoryLimit: 1000,
            ...config
        };
        this.bridge = bridge;

        // Initialize context manager
        this.contextManager = new ContextManager(
            ContextType.AGENT,
            config.agentId,
            redisClient
        );

        // Initialize monitoring
        this.monitor = new PerformanceMonitor(config.agentId, redisClient);

        // Initialize remaining state
        this.metrics = new MetricsRegistry(config.agentId);
        this.errorRecovery = new ErrorRecovery();
    }

    abstract processMessage(message: Record<string, unknown>): Promise<void>;
    abstract executeTask(task: Task): Promise<Record<string, unknown>>;

    protected async sendMessage(
        message: Record<string, unknown>,
        messageType: MessageType,
        priority: Priority = Priority.NORMAL
    ): Promise<void> {
        if (!this.bridge) {
            throw new Error('Bridge not initialized');
        }
        await this.bridge.sendMessage(message, messageType, priority);
    }

    protected async handleError(
        error: Error,
        category: ErrorCategory,
        severity: ErrorSeverity
    ): Promise<void> {
        logger.error(`Agent ${this.config.agentId} encountered error:`, {
            error: error.message,
            category,
            severity
        });

        await this.errorRecovery.handleError(error, category, severity);

        if (severity === ErrorSeverity.FATAL) {
            this.terminate();
        }
    }

    protected async start(): Promise<void> {
        if (this.shouldRun) {
            return;
        }

        this.shouldRun = true;
        await this.processNextTask();
    }

    protected async stop(): Promise<void> {
        this.shouldRun = false;
    }

    protected async terminate(): Promise<void> {
        await this.stop();
        this.state = AgentState.TERMINATED;
        this.emit('terminated');
    }

    protected async processNextTask(): Promise<void> {
        if (!this.shouldRun || this.tasks.size === 0) {
            return;
        }

        // Find next task to process
        const [taskId, task] = Array.from(this.tasks.entries())
            .find(([_, t]) => t.status === 'pending') || [null, null];

        if (!taskId || !task) {
            return;
        }

        task.status = 'running';
        task.startTime = Date.now();

        try {
            const result = await this.executeTask(task);
            task.status = 'completed';
            task.result = result;
        } catch (error) {
            task.status = 'failed';
            task.error = error instanceof Error ? error : new Error(String(error));
        }
    }
}

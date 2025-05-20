/**
 * Base classes and interfaces for agent system.
 */
import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import { BaseBridge } from '../bridges.js';
import { ContextManager } from '../context/manager.js';
import { ErrorRecovery } from '../error/recovery.js';
import { MetricsRegistry, PerformanceMonitor } from '../monitoring/metrics.js';

export enum AgentState {
    INITIALIZING = 'initializing',
    READY = 'ready',
    RUNNING = 'running',
    PAUSED = 'paused',
    STOPPED = 'stopped',
    ERROR = 'error'
}

export enum AgentCapability {
    TEXT_PROCESSING = 'text_processing',
    CODE_GENERATION = 'code_generation',
    MEMORY_MANAGEMENT = 'memory_management',
    ERROR_HANDLING = 'error_handling',
    TASK_COORDINATION = 'task_coordination'
}

export interface AgentConfig {
    agentId: string;
    capabilities: Set<AgentCapability>;
    modelName?: string;
    maxConcurrentTasks?: number;
    taskTimeout?: number;
    retryLimit?: number;
    memoryLimit?: number;
}

export interface Task {
    taskId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
    startTime?: number;
    result?: unknown;
    error?: string;
}

export declare abstract class BaseAgent extends EventEmitter {
    protected config: AgentConfig;
    protected bridge?: BaseBridge;
    protected contextManager: ContextManager;
    protected metrics: MetricsRegistry;
    protected monitor: PerformanceMonitor;
    protected errorRecovery: ErrorRecovery;
    protected state: AgentState;
    protected tasks: Map<string, Task>;
    protected context: Map<string, unknown>;
    protected shouldRun: boolean;
    protected taskProcessor?: Promise<void>;
    constructor(config: AgentConfig, bridge?: BaseBridge, redisClient?: Redis);
}

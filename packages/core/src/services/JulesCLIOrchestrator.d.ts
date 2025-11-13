/**
 * Jules CLI Orchestrator
 *
 * High-level orchestration service for managing multiple Jules CLI sessions,
 * coordinating with other agents, and handling complex multi-step coding tasks.
 *
 * @module JulesCLIOrchestrator
 * @since 2025-10-05
 */
import { OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JulesCLIService } from './JulesCLIService';
export interface JulesOrchestrationTask {
    id: string;
    type: 'coding' | 'testing' | 'documentation' | 'refactoring' | 'bugfix' | 'feature';
    repository: string;
    description: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    dependencies?: string[];
    subtasks?: JulesSubtask[];
    status: 'pending' | 'running' | 'completed' | 'failed' | 'blocked';
    julesSessionId?: string;
    result?: any;
    error?: string;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
}
export interface JulesSubtask {
    id: string;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    julesSessionId?: string;
}
export interface JulesWorkflow {
    id: string;
    name: string;
    description: string;
    tasks: JulesOrchestrationTask[];
    status: 'pending' | 'running' | 'completed' | 'failed';
    createdAt: Date;
    completedAt?: Date;
}
export declare class JulesCLIOrchestrator implements OnModuleInit {
    private readonly julesCLIService;
    private readonly eventEmitter;
    private readonly logger;
    private activeTasks;
    private activeWorkflows;
    private taskQueue;
    constructor(julesCLIService: JulesCLIService, eventEmitter: EventEmitter2);
    onModuleInit(): Promise<void>;
    /**
     * Create a new orchestrated task
     */
    createTask(task: Omit<JulesOrchestrationTask, 'id' | 'status' | 'createdAt'>): Promise<JulesOrchestrationTask>;
    /**
     * Execute a single task with Jules
     */
    executeTask(taskId: string): Promise<void>;
}
//# sourceMappingURL=JulesCLIOrchestrator.d.ts.map
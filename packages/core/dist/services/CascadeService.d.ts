import { EventEmitter } from 'events';
export interface CascadeOptions {
    maxDepth?: number;
    timeout?: number;
    retries?: number;
    failOnError?: boolean;
}
export declare enum CascadeMode {
    SEQUENTIAL = "sequential",
    PARALLEL = "parallel",
    WATERFALL = "waterfall",
    PIPELINE = "pipeline"
}
export declare enum CascadeState {
    IDLE = "idle",
    RUNNING = "running",
    PAUSED = "paused",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export interface CascadeController {
    id: string;
    name: string;
    mode: CascadeMode;
    state: CascadeState;
    options: CascadeOptions;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface CascadeStep {
    id: string;
    name: string;
    handler: (input: any, context: CascadeContext) => Promise<any>;
    dependencies?: string[];
    optional?: boolean;
    timeout?: number;
    retries?: number;
}
export interface CascadeContext {
    controllerId: string;
    stepId: string;
    input: any;
    output?: any;
    error?: Error;
    metadata: Record<string, any>;
    startTime: Date;
    endTime?: Date;
}
export declare class CascadeService extends EventEmitter {
    private readonly logger;
    private readonly controllers;
    private readonly steps;
    private readonly activeExecutions;
    constructor();
    createController(name: string, mode: CascadeMode, options?: CascadeOptions): CascadeController;
    addStep(controllerId: string, step: Omit<CascadeStep, 'id'>): CascadeStep;
    executeController(controllerId: string, input: any): Promise<any>;
    cancelExecution(controllerId: string): Promise<void>;
    getController(controllerId: string): CascadeController | undefined;
    getSteps(controllerId: string): CascadeStep[];
    getAllControllers(): CascadeController[];
    deleteController(controllerId: string): boolean;
    private executeSteps;
    private executeSequential;
    private executeParallel;
    private executeWaterfall;
    private executePipeline;
    private executeStep;
    private updateControllerState;
    private generateId;
}
//# sourceMappingURL=CascadeService.d.ts.map
import { EventEmitter } from 'events';
import { TaskPriority } from '../core/types.js';
import { Coordinator } from '../orchestration/Coordinator.js';
/**
 * Pipeline stage function
 */
export type StageFunction<TInput, TOutput> = (input: TInput) => Promise<TOutput>;
/**
 * Pipeline stage definition
 */
export interface PipelineStage<TInput = any, TOutput = any> {
    name: string;
    type: string;
    processFn: StageFunction<TInput, TOutput>;
    requiredCapabilities?: string[];
    timeout?: number;
    retries?: number;
}
/**
 * Pipeline pattern for sequential task processing (A → B → C)
 */
export declare class PipelinePattern extends EventEmitter {
    private coordinator;
    private stageResults;
    constructor(coordinator: Coordinator);
    /**
     * Execute pipeline with sequential stages
     */
    execute<TInput, TOutput>(input: TInput, stages: PipelineStage[], options?: {
        priority?: TaskPriority;
        timeout?: number;
    }): Promise<TOutput>;
    /**
     * Execute a single pipeline stage
     */
    private executeStage;
    /**
     * Execute pipeline with parallel stages at specific points
     */
    executeHybrid<TInput, TOutput>(input: TInput, stageGroups: PipelineStage[][], options?: {
        priority?: TaskPriority;
        timeout?: number;
    }): Promise<TOutput>;
    /**
     * Execute multiple stages in parallel
     */
    private executeParallelStages;
    /**
     * Execute pipeline with conditional branching
     */
    executeConditional<TInput, TOutput>(input: TInput, branches: Array<{
        condition: (input: any) => boolean;
        stages: PipelineStage[];
    }>, options?: {
        priority?: TaskPriority;
        timeout?: number;
    }): Promise<TOutput>;
    /**
     * Store stage result (called by coordinator)
     */
    storeStageResult(stageName: string, index: number, result: any): void;
    /**
     * Get stage result
     */
    getStageResult(stageName: string, index: number): any;
    /**
     * Get all stage results
     */
    getAllStageResults(): Map<string, any>;
    /**
     * Clear stored results
     */
    clear(): void;
}
//# sourceMappingURL=PipelinePattern.d.ts.map
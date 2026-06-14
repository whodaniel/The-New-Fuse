import { EventEmitter } from 'events';
import { Coordinator } from '../orchestration/Coordinator.js';
/**
 * Map function type
 */
export type MapFunction<TInput, TMapOutput> = (input: TInput, partition: number) => Promise<TMapOutput>;
/**
 * Reduce function type
 */
export type ReduceFunction<TMapOutput, TFinalOutput> = (results: TMapOutput[]) => Promise<TFinalOutput>;
/**
 * Map-Reduce pattern for distributed data processing
 */
export declare class MapReducePattern<TInput, TMapOutput, TFinalOutput> extends EventEmitter {
    private coordinator;
    private mapResults;
    constructor(coordinator: Coordinator);
    /**
     * Execute Map-Reduce workflow
     */
    execute(input: TInput[], mapFn: MapFunction<TInput, TMapOutput>, reduceFn: ReduceFunction<TMapOutput, TFinalOutput>, options?: {
        mapConcurrency?: number;
        timeout?: number;
    }): Promise<TFinalOutput>;
    /**
     * Create map tasks
     */
    private createMapTasks;
    /**
     * Wait for all map results
     */
    private waitForMapResults;
    /**
     * Store map result
     */
    storeMapResult(taskId: string, result: TMapOutput): void;
    /**
     * Clear stored results
     */
    clear(): void;
}
//# sourceMappingURL=MapReducePattern.d.ts.map
import { Task } from '../core/types.js';
/**
 * Decomposition strategy
 */
export interface DecompositionStrategy {
    name: string;
    decompose(task: Task): Task[];
}
/**
 * Task decomposer for breaking complex tasks into subtasks
 */
export declare class TaskDecomposer {
    private strategies;
    /**
     * Register a decomposition strategy
     */
    registerStrategy(taskType: string, strategy: DecompositionStrategy): void;
    /**
     * Decompose a task into subtasks
     */
    decompose(task: Task): Task[];
    /**
     * Decompose task with parallel execution
     */
    decomposeParallel(task: Task, count: number): Task[];
    /**
     * Decompose task with sequential execution
     */
    decomposeSequential(task: Task, steps: Partial<Task>[]): Task[];
    /**
     * Map-Reduce decomposition
     */
    decomposeMapReduce(task: Task, mapCount: number, reducerConfig?: Partial<Task>): {
        mapTasks: Task[];
        reduceTasks: Task[];
    };
    /**
     * Pipeline decomposition (A → B → C)
     */
    decomposePipeline(task: Task, stages: Partial<Task>[]): Task[];
    /**
     * Tree decomposition (hierarchical tasks)
     */
    decomposeTree(task: Task, childConfigs: Partial<Task>[]): Task[];
    /**
     * Conditional decomposition
     */
    decomposeConditional(task: Task, branches: Array<{
        condition: (payload: any) => boolean;
        tasks: Partial<Task>[];
    }>): Task[];
    /**
     * Dynamic decomposition based on data size
     */
    decomposeByDataSize(task: Task, dataSize: number, chunkSize: number): Task[];
    /**
     * Aggregate results from subtasks
     */
    aggregateResults(subtasks: Task[], results: Map<string, any>, aggregator: (results: any[]) => any): any;
}
//# sourceMappingURL=TaskDecomposer.d.ts.map
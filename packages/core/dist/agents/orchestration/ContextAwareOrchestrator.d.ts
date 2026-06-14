import { Task, ExecutionPlan, VectorMemorySystem, SemanticSkillDiscovery } from './types.js';
/**
 * Service for creating context-aware execution plans for tasks.
 */
export declare class ContextAwareOrchestrator {
    private readonly vectorMemory;
    private readonly skillDiscovery;
    /**
     * Constructs a new ContextAwareOrchestrator.
     * @param vectorMemory - The VectorMemorySystem to use for retrieving past task results.
     * @param skillDiscovery - The SemanticSkillDiscovery to use for finding relevant skills.
     */
    constructor(vectorMemory: VectorMemorySystem, skillDiscovery: SemanticSkillDiscovery);
    /**
     * Creates an execution plan for a given task, leveraging past context.
     * @param task - The task to be planned.
     * @returns A promise that resolves to an ExecutionPlan.
     */
    planTaskWithContext(task: Task): Promise<ExecutionPlan>;
    /**
     * Synthesizes a high-level approach based on past successful tasks.
     * @param successfulPatterns - A list of successful past task results.
     * @returns A string describing the estimated approach.
     */
    private synthesizeApproach;
    /**
     * Calculates a confidence score for the execution plan.
     * @param successfulPatterns - A list of successful past task results.
     * @param totalSimilarTasks - The total number of similar tasks found.
     * @returns A confidence score between 0 and 1.
     */
    private calculateConfidence;
}
//# sourceMappingURL=ContextAwareOrchestrator.d.ts.map
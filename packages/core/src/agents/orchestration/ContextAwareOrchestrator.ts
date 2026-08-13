// packages/core/src/agents/orchestration/ContextAwareOrchestrator.ts

import {
  Task,
  ExecutionPlan,
  PastTaskResult,
  VectorMemorySystem,
  SemanticSkillDiscovery,
} from './types.js';

/**
 * Service for creating context-aware execution plans for tasks.
 */
export class ContextAwareOrchestrator {
  private readonly vectorMemory: VectorMemorySystem;
  private readonly skillDiscovery: SemanticSkillDiscovery;

  /**
   * Constructs a new ContextAwareOrchestrator.
   * @param vectorMemory - The VectorMemorySystem to use for retrieving past task results.
   * @param skillDiscovery - The SemanticSkillDiscovery to use for finding relevant skills.
   */
  constructor(vectorMemory: VectorMemorySystem, skillDiscovery: SemanticSkillDiscovery) {
    this.vectorMemory = vectorMemory;
    this.skillDiscovery = skillDiscovery;
  }

  /**
   * Creates an execution plan for a given task, leveraging past context.
   * @param task - The task to be planned.
   * @returns A promise that resolves to an ExecutionPlan.
   */
  public async planTaskWithContext(task: Task): Promise<ExecutionPlan> {
    try {
      console.log(`Planning task with context: ${task.description}`);

      // 1. Search for similar past tasks
      const similarTasks = await this.vectorMemory.search(task.description, {
        type: 'TASK_RESULT',
        minRelevance: 0.75,
      });

      // 2. Extract successful patterns
      const successfulPatterns = similarTasks.filter((t) => t.outcome.success);

      // 3. Find relevant skills
      const recommendedSkills = await this.skillDiscovery.findSkillsByExample(successfulPatterns);

      // 4. Synthesize the approach and calculate confidence
      const estimatedApproach = this.synthesizeApproach(successfulPatterns);
      const confidence = this.calculateConfidence(successfulPatterns, similarTasks.length);

      const plan: ExecutionPlan = {
        recommendedSkills,
        pastContext: successfulPatterns,
        estimatedApproach,
        confidence,
      };

      console.log('Execution plan created:', plan);
      return plan;
    } catch (error) {
      console.error('Error planning task with context:', error);
      throw new Error('Failed to create execution plan.');
    }
  }

  /**
   * Synthesizes a high-level approach based on past successful tasks.
   * @param successfulPatterns - A list of successful past task results.
   * @returns A string describing the estimated approach.
   */
  private synthesizeApproach(successfulPatterns: PastTaskResult[]): string {
    if (successfulPatterns.length === 0) {
      return 'No relevant past experience found. A novel approach is required.';
    }

    const keyElements = successfulPatterns.map(
      (p) => p.taskDescription.split(' ').slice(0, 5).join(' ') + '...',
    );

    return `Based on past successes with tasks like "${keyElements.join(
      ', ',
    )}", the recommended approach involves leveraging similar strategies.`;
  }

  /**
   * Calculates a confidence score for the execution plan.
   * @param successfulPatterns - A list of successful past task results.
   * @param totalSimilarTasks - The total number of similar tasks found.
   * @returns A confidence score between 0 and 1.
   */
  private calculateConfidence(
    successfulPatterns: PastTaskResult[],
    totalSimilarTasks: number,
  ): number {
    if (totalSimilarTasks === 0) {
      return 0.1; // Low confidence if no similar tasks are found
    }

    const successRate = successfulPatterns.length / totalSimilarTasks;
    const averageRelevance =
      successfulPatterns.reduce((sum, p) => sum + p.relevance, 0) /
      (successfulPatterns.length || 1);

    // Weighted average of success rate and relevance
    const confidence = successRate * 0.6 + averageRelevance * 0.4;
    return Math.min(Math.max(confidence, 0), 1); // Clamp between 0 and 1
  }
}

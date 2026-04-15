// packages/core/src/agents/orchestration/types.ts

/**
 * Represents a generic task to be processed by the orchestrator.
 */
export interface Task {
  id: string;
  description: string;
  data: Record<string, any>;
}

/**
 * Represents the execution plan created by the ContextAwareOrchestrator.
 */
export interface ExecutionPlan {
  recommendedSkills: string[];
  pastContext: PastTaskResult[];
  estimatedApproach: string;
  confidence: number;
}

/**
 * Represents the result of a past task, retrieved from vector memory.
 */
export interface PastTaskResult {
  taskId: string;
  taskDescription: string;
  outcome: {
    success: boolean;
    result: any;
  };
  relevance: number;
}

/**
 * Interface for the VectorMemorySystem, responsible for storing and retrieving past task results.
 */
export interface VectorMemorySystem {
  search(query: string, options: { type: string; minRelevance: number }): Promise<PastTaskResult[]>;
}

/**
 * Interface for the SemanticSkillDiscovery, responsible for finding relevant skills.
 */
export interface SemanticSkillDiscovery {
  findSkillsByExample(examples: PastTaskResult[]): Promise<string[]>;
}

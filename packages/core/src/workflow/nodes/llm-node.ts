export interface LLMConfig {
  model: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface WorkflowStep {
  id: string;
  type: string;
  config: any;
}

export interface WorkflowContext {
  workflowId: string;
  stepId: string;
  data: Record<string, any>;
  metadata: Record<string, any>;
}

export class LLMNodeHandler {
  constructor(private dependencies: any) {}

  async handle(step: WorkflowStep, context: WorkflowContext): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const config = step.config as LLMConfig;
      if (!config.model || !config.prompt) {
        throw new Error('LLM model and prompt are required');
      }

      // Mock implementation - replace with actual LLM service
      const result = {
        response: `Processed with model: ${config.model}`,
        prompt: config.prompt,
        temperature: config.temperature || 0.7,
        maxTokens: config.maxTokens || 1000,
      };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

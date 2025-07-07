
export interface LLMConfig { model: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number; }
  systemPrompt?: string;
 }

export class LLMNodeHandler { constructor(private dependencies: unknown) { }

  async handle(step: WorkflowStep, context: WorkflowContext): Promise<unknown> { try {
    try {
      const config = step.config as LLMConfig;

      if (!config.model || !config.prompt) { }
        throw new Error('LLM model and prompt are required'
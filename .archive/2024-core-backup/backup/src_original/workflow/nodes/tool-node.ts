
export interface ToolConfig { toolName: string;
  parameters: Record<string, unknown>; }
  timeout?: number;
}

export class ToolNodeHandler { constructor(private dependencies: unknown) { }

  async handle(step: WorkflowStep, context: WorkflowContext): Promise<unknown> { try {
    try {
      const config = step.config as ToolConfig;

      if (!config.toolName) { }
        throw new Error('Tool name is required'
import { z } from 'zod';

export enum SkillExecutionType {
  LINEAR = 'LINEAR', // Step 1 -> Step 2 -> Step 3
  LOOP = 'LOOP', // ReAct style loop
  PARALLEL = 'PARALLEL', // Fan out
  CONDITIONAL = 'CONDITIONAL', // Branching based on output
}

export enum SkillStepType {
  PROMPT = 'PROMPT',
  TOOL_CALL = 'TOOL_CALL',
  WAIT_FOR_INPUT = 'WAIT_FOR_INPUT', // Progressive disclosure
  DECISION = 'DECISION', // Logic branch
}

export type SkillStep = {
  id: string;
  name: string;
  type: SkillStepType;

  // For PROMPT steps
  promptTemplateId?: string;
  promptVariables?: Record<string, string>; // Mapping from context keys to template vars

  // For TOOL steps
  toolName?: string;
  toolArguments?: Record<string, any>;

  // For DECISION steps
  condition?: {
    variable: string;
    operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt';
    value: any;
    nextStepIdTrue: string;
    nextStepIdFalse: string;
  };

  nextStepId?: string | null; // Null means end of skill
};

export interface Skill {
  id: string;
  name: string;
  description: string;
  version: string;

  // Capabilities
  requiredTools: string[]; // MCP Tool names/IDs

  // Execution Logic
  executionType: SkillExecutionType;
  steps: SkillStep[];
  entryStepId: string; // Start point

  // Metadata
  author: string;
  tags: string[];
  isPublic: boolean;

  // Inputs/Outputs
  inputSchema: z.ZodSchema | any; // Expected context variables
  outputSchema: z.ZodSchema | any;
}

export const SkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  executionType: z.nativeEnum(SkillExecutionType),
  steps: z.array(z.any()), // Simplified for Zod
  requiredTools: z.array(z.string()),
});

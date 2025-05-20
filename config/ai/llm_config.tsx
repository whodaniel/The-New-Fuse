import { z } from 'zod';

export const LLMConfig = z.object({
  model: z.enum(['gpt-4', 'gpt-3.5-turbo', 'claude-2']),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().positive().default(2048),
  topP: z.number().min(0).max(1).default(1),
  frequencyPenalty: z.number().min(-2).max(2).default(0),
  presencePenalty: z.number().min(-2).max(2).default(0),
  stopSequences: z.array(z.string()).optional(),
  apiKey: z.string(),
  organizationId: z.string().optional(),
});

export type LLMConfigType = z.infer<typeof LLMConfig>;

export const defaultLLMConfig: LLMConfigType = {
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2048,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  apiKey: process.env.OPENAI_API_KEY || '',
};

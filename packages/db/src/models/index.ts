import { z } from 'zod';

export const AgentSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    systemPrompt: z.string(),
    maxTokens: z.number().optional(),
    temperature: z.number().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const CreateAgentDto = AgentSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
});

export const UpdateAgentDto = AgentSchema.partial();

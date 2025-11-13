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
export const CreateAgentSchema = AgentSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
export class CreateAgentDtoZod {
    name;
    description;
    systemPrompt;
    maxTokens;
    temperature;
    constructor() {
        this.name = '';
        this.systemPrompt = '';
    }
}
export const UpdateAgentSchema = AgentSchema.partial();
export class UpdateAgentDtoZod {
    name;
    description;
    systemPrompt;
    maxTokens;
    temperature;
}
//# sourceMappingURL=agent-validation.dto.js.map
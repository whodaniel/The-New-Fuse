import { z } from 'zod';
export declare const AgentSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    systemPrompt: z.ZodString;
    maxTokens: z.ZodOptional<z.ZodNumber>;
    temperature: z.ZodOptional<z.ZodNumber>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export declare const CreateAgentSchema: z.ZodObject<{
    description: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    systemPrompt: z.ZodString;
    temperature: z.ZodOptional<z.ZodNumber>;
    maxTokens: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare class CreateAgentDtoZod {
    name: string;
    description?: string;
    systemPrompt: string;
    maxTokens?: number;
    temperature?: number;
    constructor();
}
export declare const UpdateAgentSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    systemPrompt: z.ZodOptional<z.ZodString>;
    maxTokens: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    temperature: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
}, z.core.$strip>;
export declare class UpdateAgentDtoZod {
    name?: string;
    description?: string;
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
}
//# sourceMappingURL=agent-validation.dto.d.ts.map
import { z } from 'zod';
export declare const LLMConfig: z.ZodObject<{
    model: z.ZodEnum<["gpt-4", "gpt-3.5-turbo", "claude-2"]>;
    temperature: z.ZodDefault<z.ZodNumber>;
    maxTokens: z.ZodDefault<z.ZodNumber>;
    topP: z.ZodDefault<z.ZodNumber>;
    frequencyPenalty: z.ZodDefault<z.ZodNumber>;
    presencePenalty: z.ZodDefault<z.ZodNumber>;
    stopSequences: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    apiKey: z.ZodString;
    organizationId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    apiKey: string;
    model: "gpt-3.5-turbo" | "gpt-4" | "claude-2";
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    stopSequences?: string[] | undefined;
    organizationId?: string | undefined;
}, {
    apiKey: string;
    model: "gpt-3.5-turbo" | "gpt-4" | "claude-2";
    temperature?: number | undefined;
    maxTokens?: number | undefined;
    topP?: number | undefined;
    frequencyPenalty?: number | undefined;
    stopSequences?: string[] | undefined;
    presencePenalty?: number | undefined;
    organizationId?: string | undefined;
}>;
export type LLMConfigType = z.infer<typeof LLMConfig>;
export declare const defaultLLMConfig: LLMConfigType;

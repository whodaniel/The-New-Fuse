import { z } from 'zod';
export declare const agentCardSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    version: z.ZodString;
    description: z.ZodString;
    capabilities: z.ZodArray<z.ZodNativeEnum<any>, "many">;
    role: z.ZodNativeEnum<any>;
    type: z.ZodNativeEnum<any>;
    endpoints: z.ZodObject<{
        discovery: z.ZodString;
        messaging: z.ZodString;
        metrics: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        discovery: string;
        messaging: string;
        metrics?: string | undefined;
    }, {
        discovery: string;
        messaging: string;
        metrics?: string | undefined;
    }>;
    protocols: z.ZodArray<z.ZodString, "many">;
    security: z.ZodObject<{
        authentication: z.ZodEnum<["none", "api_key", "oauth2", "jwt"]>;
        encryption: z.ZodBoolean;
        rateLimit: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        authentication: "none" | "api_key" | "oauth2" | "jwt";
        encryption: boolean;
        rateLimit?: number | undefined;
    }, {
        authentication: "none" | "api_key" | "oauth2" | "jwt";
        encryption: boolean;
        rateLimit?: number | undefined;
    }>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    [x: string]: any;
    id?: unknown;
    name?: unknown;
    version?: unknown;
    description?: unknown;
    capabilities?: unknown;
    role?: unknown;
    type?: unknown;
    endpoints?: unknown;
    protocols?: unknown;
    security?: unknown;
    metadata?: unknown;
}, {
    [x: string]: any;
    id?: unknown;
    name?: unknown;
    version?: unknown;
    description?: unknown;
    capabilities?: unknown;
    role?: unknown;
    type?: unknown;
    endpoints?: unknown;
    protocols?: unknown;
    security?: unknown;
    metadata?: unknown;
}>;
export type AgentCard = z.infer<typeof agentCardSchema>;

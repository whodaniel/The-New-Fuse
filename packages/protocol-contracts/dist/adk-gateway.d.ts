import { z } from 'zod';
export declare const AdkMessageSchema: z.ZodObject<{
    role: z.ZodEnum<{
        system: "system";
        user: "user";
        assistant: "assistant";
    }>;
    content: z.ZodString;
}, z.core.$strict>;
export declare const ExecuteInputSchema: z.ZodObject<{
    messages: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<{
            system: "system";
            user: "user";
            assistant: "assistant";
        }>;
        content: z.ZodString;
    }, z.core.$strict>>>>;
}, z.core.$strict>;
export declare const ExecuteMetadataSchema: z.ZodObject<{
    source: z.ZodOptional<z.ZodString>;
    policyProfile: z.ZodOptional<z.ZodString>;
    provider: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strict>;
export declare const ExecuteRequestSchema: z.ZodObject<{
    requestId: z.ZodString;
    traceId: z.ZodString;
    workspaceId: z.ZodString;
    agentId: z.ZodString;
    model: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    input: z.ZodObject<{
        messages: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
            role: z.ZodEnum<{
                system: "system";
                user: "user";
                assistant: "assistant";
            }>;
            content: z.ZodString;
        }, z.core.$strict>>>>;
    }, z.core.$strict>;
    tools: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>>;
    metadata: z.ZodDefault<z.ZodOptional<z.ZodObject<{
        source: z.ZodOptional<z.ZodString>;
        policyProfile: z.ZodOptional<z.ZodString>;
        provider: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strict>>>;
    timeoutMs: z.ZodDefault<z.ZodOptional<z.ZodInt>>;
}, z.core.$strict>;
export declare const UsageSchema: z.ZodObject<{
    inputTokens: z.ZodInt;
    outputTokens: z.ZodInt;
    totalTokens: z.ZodInt;
}, z.core.$strict>;
export declare const ExecuteOutputSchema: z.ZodObject<{
    content: z.ZodString;
    parts: z.ZodDefault<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, z.core.$strict>;
export declare const ExecuteResponseSchema: z.ZodObject<{
    requestId: z.ZodString;
    traceId: z.ZodString;
    status: z.ZodEnum<{
        error: "error";
        ok: "ok";
    }>;
    output: z.ZodObject<{
        content: z.ZodString;
        parts: z.ZodDefault<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    }, z.core.$strict>;
    usage: z.ZodObject<{
        inputTokens: z.ZodInt;
        outputTokens: z.ZodInt;
        totalTokens: z.ZodInt;
    }, z.core.$strict>;
    toolCalls: z.ZodDefault<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    latencyMs: z.ZodInt;
    provider: z.ZodString;
    model: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strict>;
export type AdkMessage = z.infer<typeof AdkMessageSchema>;
export type ExecuteRequest = z.infer<typeof ExecuteRequestSchema>;
export type ExecuteResponse = z.infer<typeof ExecuteResponseSchema>;
//# sourceMappingURL=adk-gateway.d.ts.map
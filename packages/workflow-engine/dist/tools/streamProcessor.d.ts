import { z } from 'zod';
export declare const StreamEventSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["token", "tool_call", "tool_result", "thinking", "error", "done", "metadata"]>;
    content: z.ZodOptional<z.ZodString>;
    toolName: z.ZodOptional<z.ZodString>;
    toolArgs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    toolResult: z.ZodOptional<z.ZodUnknown>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    timestamp: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "token" | "tool_call" | "tool_result" | "thinking" | "error" | "done" | "metadata";
    timestamp: number;
    metadata?: Record<string, unknown> | undefined;
    content?: string | undefined;
    toolName?: string | undefined;
    toolArgs?: Record<string, unknown> | undefined;
    toolResult?: unknown;
}, {
    id: string;
    type: "token" | "tool_call" | "tool_result" | "thinking" | "error" | "done" | "metadata";
    metadata?: Record<string, unknown> | undefined;
    content?: string | undefined;
    toolName?: string | undefined;
    toolArgs?: Record<string, unknown> | undefined;
    toolResult?: unknown;
    timestamp?: number | undefined;
}>;
export type StreamEvent = z.infer<typeof StreamEventSchema>;
export interface StreamProcessorConfig {
    maxBufferMs: number;
    maxTokensPerChunk: number;
    flushIntervalMs: number;
}
export declare class StreamProcessor {
    private buffer;
    private config;
    private onFlush?;
    constructor(config?: Partial<StreamProcessorConfig>, onFlush?: (events: StreamEvent[]) => void);
    push(event: StreamEvent): void;
    flush(): StreamEvent[];
    reduceToAnswer(events: StreamEvent[]): {
        text: string;
        toolCalls: {
            name: string;
            args: Record<string, unknown>;
            result?: unknown;
        }[];
        errors: string[];
        thinking: string[];
    };
    getBufferSize(): number;
}
//# sourceMappingURL=streamProcessor.d.ts.map
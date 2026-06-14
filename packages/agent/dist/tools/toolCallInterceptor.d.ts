import { z } from 'zod';
export declare const ToolCallInterceptSchema: z.ZodObject<{
    toolName: z.ZodString;
    args: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    result: z.ZodOptional<z.ZodUnknown>;
    error: z.ZodOptional<z.ZodString>;
    durationMs: z.ZodOptional<z.ZodNumber>;
    interceptedAt: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type ToolCallIntercept = z.infer<typeof ToolCallInterceptSchema>;
export interface InterceptHook {
    name: string;
    beforeCall?(toolName: string, args: Record<string, unknown>): Record<string, unknown> | null;
    afterCall?(toolName: string, args: Record<string, unknown>, result: unknown): unknown;
    onError?(toolName: string, args: Record<string, unknown>, error: Error): void;
}
export declare class ToolCallInterceptor {
    private hooks;
    private log;
    private maxLogSize;
    private enabled;
    constructor(options?: {
        maxLogSize?: number;
        enabled?: boolean;
    });
    registerHook(hook: InterceptHook): void;
    removeHook(name: string): void;
    interceptCall<T>(toolName: string, args: Record<string, unknown>, executor: () => Promise<T>): Promise<T>;
    getLog(filter?: {
        toolName?: string;
        from?: number;
        to?: number;
    }): ToolCallIntercept[];
    enable(): void;
    disable(): void;
    isEnabled(): boolean;
    clearLog(): void;
    private appendLog;
}
//# sourceMappingURL=toolCallInterceptor.d.ts.map
import { z } from 'zod';
export declare const ShellToolInputSchema: z.ZodObject<{
    command: z.ZodString;
    timeout: z.ZodDefault<z.ZodNumber>;
    cwd: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    command: string;
    timeout: number;
    cwd?: string | undefined;
}, {
    command: string;
    timeout?: number | undefined;
    cwd?: string | undefined;
}>;
export type ShellToolInput = z.infer<typeof ShellToolInputSchema>;
export interface ShellToolResult {
    success: boolean;
    stdout: string;
    stderr: string;
    exitCode: number | null;
    timedOut: boolean;
    command: string;
}
export declare function executeShellTool(input: ShellToolInput): Promise<ShellToolResult>;
//# sourceMappingURL=shellTool.d.ts.map
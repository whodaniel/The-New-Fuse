import { EventEmitter } from 'events';
export interface SandboxOptions {
    timeout?: number;
    memoryLimit?: number;
    allowedModules?: string[];
    context?: Record<string, any>;
}
export interface ExecutionResult {
    success: boolean;
    output: string[];
    error?: Error;
    result?: any;
    memoryUsage?: number;
    executionTime?: number;
}
export declare class CodeSandbox extends EventEmitter {
    private options;
    private context;
    constructor(options?: SandboxOptions);
    private initializeContext;
    execute(code: string): Promise<ExecutionResult>;
    /**
     * Reset the sandbox context
     */
    reset(): void;
}
//# sourceMappingURL=code-sandbox.d.ts.map
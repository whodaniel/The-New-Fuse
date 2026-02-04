/**
 * Types for the Code Execution Service
 */
/**
 * Supported programming languages for code execution
 */
export declare enum CodeExecutionLanguage {
    JAVASCRIPT = "javascript",
    TYPESCRIPT = "typescript",
    PYTHON = "python",
    RUBY = "ruby",
    SHELL = "shell",
    HTML = "html",
    CSS = "css"
}
/**
 * Execution environments for code execution
 */
export declare enum ExecutionEnvironment {
    SANDBOX = "sandbox",
    CONTAINER = "container",
    CLOUDFLARE_WORKER = "cloudflare-worker"
}
/**
 * Represents a request to execute code
 */
export interface CodeExecutionRequest {
    code: string;
    language: CodeExecutionLanguage;
    environment?: ExecutionEnvironment;
}
/**
 * Represents the result of a code execution
 */
export interface CodeExecutionResult {
    executionId: string;
    success: boolean;
    output: string;
    error?: string;
    executionTime: number;
}
//# sourceMappingURL=types.d.ts.map
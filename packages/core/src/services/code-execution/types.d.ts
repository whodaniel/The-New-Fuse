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
    SHELL = "shell",
    HTML = "html",
    CSS = "css"
}
/**
 * Request parameters for code execution
 */
export interface CodeExecutionRequest {
    /**
     * The code to execute
     */
    code: string;
    /**
     * The programming language of the code
     */
    language: CodeExecutionLanguage;
    /**
     * Maximum execution time in milliseconds
     * Default: 5000 (5 seconds)
     */
    timeout?: number;
    /**
     * Maximum memory usage in bytes
     * Default: 50MB
     */
    memoryLimit?: number;
    /**
     * List of allowed modules/packages that can be imported
     * Default: [] (no modules allowed)
     */
    allowedModules?: string[];
    /**
     * Additional context variables to inject into the execution environment
     */
    context?: Record<string, any>;
    /**
     * Client ID for billing purposes
     */
    clientId: string;
    /**
     * Agent ID that requested the execution
     */
    agentId?: string;
    /**
     * Optional execution environment
     * Default: 'sandbox'
     */
    environment?: 'sandbox' | 'container' | 'serverless';
    /**
     * Session ID for collaborative code execution
     */
    sessionId?: string;
    /**
     * Whether to persist the execution environment for future executions
     */
    persistEnvironment?: boolean;
}
/**
 * Response from code execution
 */
export interface CodeExecutionResponse {
    /**
     * Whether the execution was successful
     */
    success: boolean;
    /**
     * Console output from the execution
     */
    output: string[];
    /**
     * The result value of the execution (if any)
     */
    result?: any;
    /**
     * Error information if execution failed
     */
    error?: {
        message: string;
        stack?: string;
        type?: string;
    };
    /**
     * Execution metrics
     */
    metrics: {
        /**
         * Execution time in milliseconds
         */
        executionTime: number;
        /**
         * Memory usage in bytes
         */
        memoryUsage: number;
        /**
         * Compute units used (for billing)
         */
        computeUnits: number;
        /**
         * Estimated cost in USD
         */
        cost: number;
    };
}
/**
 * Billing tier for code execution
 */
export declare enum CodeExecutionTier {
    BASIC = "basic",
    STANDARD = "standard",
    PREMIUM = "premium"
}
/**
 * Pricing configuration for code execution
 */
export interface CodeExecutionPricing {
    /**
     * Cost per second of execution time
     */
    costPerSecond: number;
    /**
     * Cost per MB of memory used
     */
    costPerMB: number;
    /**
     * Maximum execution time in milliseconds
     */
    maxExecutionTime: number;
    /**
     * Maximum memory limit in bytes
     */
    maxMemoryLimit: number;
    /**
     * Allowed modules/packages
     */
    allowedModules: string[];
}
/**
 * Usage record for code execution
 */
export interface CodeExecutionUsageRecord {
    /**
     * Unique ID for the execution
     */
    id: string;
    /**
     * Client ID
     */
    clientId: string;
    /**
     * Agent ID that requested the execution
     */
    agentId: string;
    /**
     * Timestamp of the execution
     */
    timestamp: string;
    /**
     * Execution metrics
     */
    metrics: {
        executionTime: number;
        memoryUsage: number;
        computeUnits: number;
        cost: number;
    };
    /**
     * Billing tier used
     */
    tier: CodeExecutionTier;
    /**
     * Execution environment used
     */
    environment: 'sandbox' | 'container' | 'serverless';
}

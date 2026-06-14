/**
 * Error recovery mechanisms for agents
 * Provides automated error handling and recovery strategies
 */
export declare enum ErrorCategory {
    NETWORK = "network",
    AUTHENTICATION = "authentication",
    RESOURCE = "resource",
    LOGIC = "logic",
    VALIDATION = "validation",
    TIMEOUT = "timeout",
    DEPENDENCY = "dependency",
    SYSTEM = "system"
}
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    FATAL = "fatal"
}
export interface ErrorRecoveryStrategy {
    name: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    maxRetries: number;
    backoffMultiplier: number;
    execute: (error: Error, attempt: number) => Promise<boolean>;
}
export interface ErrorRecord {
    error: Error;
    category: ErrorCategory;
    severity: ErrorSeverity;
    timestamp: number;
    attempts: number;
    resolved: boolean;
    strategy?: string;
}
export declare class ErrorRecovery {
    private strategies;
    private errorHistory;
    private readonly maxHistorySize;
    constructor();
    /**
     * Handle an error with appropriate recovery strategy
     */
    handleError(error: Error, category: ErrorCategory, severity: ErrorSeverity): Promise<boolean>;
    /**
     * Register a custom recovery strategy
     */
    registerStrategy(strategy: ErrorRecoveryStrategy): void;
    /**
     * Find appropriate recovery strategy
     */
    private findStrategy;
    /**
     * Add error to history
     */
    private addToHistory;
    /**
     * Initialize default recovery strategies
     */
    private initializeDefaultStrategies;
    /**
     * Get error statistics
     */
    getStats(): {
        totalErrors: number;
        resolvedErrors: number;
        categoryCounts: Record<ErrorCategory, number>;
        severityCounts: Record<ErrorSeverity, number>;
    };
    /**
     * Clear error history
     */
    clearHistory(): void;
}
//# sourceMappingURL=recovery.d.ts.map
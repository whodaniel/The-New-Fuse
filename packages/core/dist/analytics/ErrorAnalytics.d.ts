export interface ErrorMetrics {
    errorCount: number;
    errorRate: number;
    lastError?: Date;
    errorTypes: Record<string, number>;
    averageErrorsPerHour: number;
    criticalErrors: number;
}
export interface ErrorEvent {
    type: string;
    timestamp: Date;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    stack?: string;
    metadata?: Record<string, any>;
}
export declare class ErrorAnalytics {
    private errors;
    private readonly maxStoredErrors;
    trackError(type: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical', stack?: string, metadata?: Record<string, any>): void;
    getMetrics(timeWindowMinutes?: number): ErrorMetrics;
    getRecentErrors(hours?: number): ErrorEvent[];
    getErrorsByType(type: string, hours?: number): ErrorEvent[];
    getCriticalErrors(hours?: number): ErrorEvent[];
    clearOldErrors(olderThanHours?: number): void;
    getTotalErrorCount(): number;
}
//# sourceMappingURL=ErrorAnalytics.d.ts.map
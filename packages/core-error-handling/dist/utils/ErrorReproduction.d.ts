/**
 * Error Reproduction Tools
 *
 * @description
 * Tools for capturing, storing, and reproducing errors in development
 * and testing environments for easier debugging and troubleshooting.
 */
import { ApplicationError } from '../errors/CustomErrors.js';
import { ErrorContext } from '../interfaces/IErrorHandling.js';
/**
 * Error reproduction data
 */
export interface ErrorReproductionData {
    id: string;
    error: ApplicationError;
    context: ErrorContext;
    timestamp: Date;
    environment: EnvironmentSnapshot;
    requestData?: RequestSnapshot;
    stateSnapshot?: Record<string, any>;
    breadcrumbs: Breadcrumb[];
    reproducible: boolean;
    reproductionSteps?: string[];
}
/**
 * Environment snapshot
 */
export interface EnvironmentSnapshot {
    userAgent?: string;
    platform?: string;
    language?: string;
    screenResolution?: string;
    viewport?: {
        width: number;
        height: number;
    };
    timezone?: string;
    memory?: {
        usedJSHeapSize?: number;
        totalJSHeapSize?: number;
    };
    connection?: {
        effectiveType?: string;
        downlink?: number;
    };
}
/**
 * Request snapshot
 */
export interface RequestSnapshot {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: any;
    query?: Record<string, string>;
    params?: Record<string, string>;
}
/**
 * Breadcrumb for tracking user actions
 */
export interface Breadcrumb {
    timestamp: Date;
    category: string;
    message: string;
    level: 'debug' | 'info' | 'warning' | 'error';
    data?: Record<string, any>;
}
/**
 * Error recorder for capturing reproduction data
 */
export declare class ErrorRecorder {
    private logger;
    private recordings;
    private breadcrumbs;
    private maxBreadcrumbs;
    private stateCapture?;
    constructor();
    /**
     * Record an error with full reproduction data
     */
    record(error: ApplicationError, context: ErrorContext, requestData?: RequestSnapshot, additionalData?: Record<string, any>): ErrorReproductionData;
    /**
     * Add breadcrumb for tracking user actions
     */
    addBreadcrumb(category: string, message: string, level?: Breadcrumb['level'], data?: Record<string, any>): void;
    /**
     * Get recorded error by ID
     */
    getRecording(id: string): ErrorReproductionData | undefined;
    /**
     * Get all recordings
     */
    getAllRecordings(): ErrorReproductionData[];
    /**
     * Export recording for sharing
     */
    exportRecording(id: string): string;
    /**
     * Import recording from export
     */
    importRecording(exportData: string): ErrorReproductionData;
    /**
     * Clear all recordings
     */
    clearRecordings(): void;
    /**
     * Set state capture function
     */
    setStateCapture(captureFunc: () => Record<string, any>): void;
    /**
     * Capture current environment
     */
    private captureEnvironment;
    /**
     * Setup automatic breadcrumb capture
     */
    private setupBreadcrumbCapture;
    /**
     * Get element description for breadcrumbs
     */
    private getElementDescription;
    /**
     * Determine if error is reproducible
     */
    private determineReproducibility;
    /**
     * Generate reproduction steps
     */
    private generateReproductionSteps;
    /**
     * Generate unique ID
     */
    private generateId;
}
/**
 * Error replay tool for reproducing errors
 */
export declare class ErrorReplay {
    private logger;
    constructor();
    /**
     * Replay error from reproduction data
     */
    replay(reproductionData: ErrorReproductionData): Promise<void>;
    /**
     * Compare current environment with recorded environment
     */
    private compareEnvironment;
    /**
     * Generate test case from reproduction data
     */
    generateTestCase(reproductionData: ErrorReproductionData): string;
}
/**
 * Global error recorder instance
 */
export declare const errorRecorder: ErrorRecorder;
/**
 * Global error replay instance
 */
export declare const errorReplay: ErrorReplay;
//# sourceMappingURL=ErrorReproduction.d.ts.map
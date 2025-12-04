export declare class ErrorService {
    constructor();
    static getInstance(): any;
    setupGlobalErrorHandling(): void;
    handleError(error: any, context: any): void;
    shouldReportError(error: any): boolean;
    reportError(error: any): Promise<void>;
    addToHistory(error: any): void;
    getErrorHistory(): any[];
    clearHistory(): void;
    getErrorStats(): Promise<{
        success: boolean;
        data: {
            total: any;
            handled: any;
            unhandled: any;
            byType: any;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: {
            code: string;
            message: string;
            details: unknown;
        };
        data?: undefined;
    }>;
    subscribeToErrors(callback: any): any;
    subscribeToErrorHistory(callback: any): any;
}

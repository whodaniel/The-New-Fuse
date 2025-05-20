import { Result } from '../../domain/core/types.js';
export interface ErrorReport {
    code: string;
    message: string;
    stack?: string;
    context?: Record<string, any>;
    timestamp: number;
    handled: boolean;
}
export declare class ErrorService {
    private static instance;
    private readonly eventBus;
    private readonly stateManager;
    private readonly logger;
    private readonly errorHistory;
    private readonly maxHistorySize;
    private constructor();
    static getInstance(): ErrorService;
    private setupGlobalErrorHandling;
    handleError(error: Error, context?: Record<string, any>): void;
    private shouldReportError;
    private reportError;
    private addToHistory;
    getErrorHistory(): ErrorReport[];
    clearHistory(): void;
    getErrorStats(): Promise<Result<{
        total: number;
        handled: number;
        unhandled: number;
        byType: Record<string, number>;
    }>>;
    subscribeToErrors(callback: (error: ErrorReport) => void): () => void;
    subscribeToErrorHistory(callback: (history: ErrorReport[]) => void): () => void;
}

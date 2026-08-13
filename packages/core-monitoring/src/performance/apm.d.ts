/**
 * Application Performance Monitoring (APM)
 * Tracks backend performance, database queries, and service metrics
 */
export interface APMConfig {
    enabled: boolean;
    serviceName: string;
    environment: string;
    sampleRate?: number;
    slowQueryThreshold?: number;
    slowRequestThreshold?: number;
    captureHeaders?: boolean;
    captureBody?: boolean;
}
export interface Transaction {
    id: string;
    name: string;
    type: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    result?: string;
    context?: TransactionContext;
    spans: Span[];
}
export interface Span {
    id: string;
    transactionId: string;
    parentId?: string;
    name: string;
    type: string;
    subtype?: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    context?: SpanContext;
    stacktrace?: string[];
}
export interface TransactionContext {
    request?: {
        method: string;
        url: string;
        headers?: Record<string, string>;
        body?: any;
    };
    response?: {
        statusCode: number;
        headers?: Record<string, string>;
        body?: any;
    };
    user?: {
        id: string;
        username?: string;
        email?: string;
    };
    tags?: Record<string, string>;
    custom?: Record<string, any>;
}
export interface SpanContext {
    db?: {
        type: string;
        statement: string;
        user?: string;
        instance?: string;
    };
    http?: {
        method: string;
        url: string;
        statusCode?: number;
    };
    tags?: Record<string, string>;
    custom?: Record<string, any>;
}
export declare class APMService {
    private config;
    private activeTransactions;
    private activeSpans;
    private completedTransactions;
    constructor(config: Partial<APMConfig>);
    /**
     * Initialize APM service
     */
    initialize(): Promise<void>;
    /**
     * Start a new transaction
     */
    startTransaction(name: string, type?: string): Transaction;
    /**
     * End a transaction
     */
    endTransaction(transactionId: string, result?: string): void;
    /**
     * Start a span within a transaction
     */
    startSpan(transactionId: string, name: string, type: string, subtype?: string, parentId?: string): Span;
    /**
     * End a span
     */
    endSpan(spanId: string): void;
    /**
     * Set transaction context
     */
    setTransactionContext(transactionId: string, context: Partial<TransactionContext>): void;
    /**
     * Set span context
     */
    setSpanContext(spanId: string, context: Partial<SpanContext>): void;
    /**
     * Track database query
     */
    trackDatabaseQuery(transactionId: string, dbType: string, query: string, callback: () => Promise<any>): Promise<any>;
    /**
     * Track HTTP request
     */
    trackHttpRequest(transactionId: string, method: string, url: string, callback: () => Promise<any>): Promise<any>;
    /**
     * Get transaction by ID
     */
    getTransaction(transactionId: string): Transaction | undefined;
    /**
     * Get all active transactions
     */
    getActiveTransactions(): Transaction[];
    /**
     * Get completed transactions
     */
    getCompletedTransactions(limit?: number): Transaction[];
    /**
     * Get performance metrics
     */
    getMetrics(): {
        activeTransactions: number;
        completedTransactions: number;
        averageDuration: number;
        slowTransactions: number;
    };
    /**
     * Should sample this transaction
     */
    private shouldSample;
    /**
     * Generate unique ID
     */
    private generateId;
    /**
     * Create dummy transaction (for non-sampled requests)
     */
    private createDummyTransaction;
    /**
     * Create dummy span (for non-sampled requests)
     */
    private createDummySpan;
    /**
     * Cleanup old transactions
     */
    private cleanup;
}
/**
 * Create APM service from environment variables
 */
export declare function createAPMFromEnv(): APMService;
//# sourceMappingURL=apm.d.ts.map
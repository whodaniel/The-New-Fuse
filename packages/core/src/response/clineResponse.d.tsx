import { MetricsCollector } from '../monitoring/metricsCollector.js';
export interface ResponseMetadata {
    requestId: string;
    timestamp: number;
    processingTime: number;
    source: string;
    target: string;
}
export interface ResponseOptions {
    format?: json' | 'text' | 'binary';
    compression?: boolean;
    priority?: number;
    ttl?: number;
    callback?: (response: ClineResponse) => Promise<void>;
}
export declare class ClineResponse {
    private readonly data;
    private readonly metadata;
    private readonly options;
    private readonly metricsCollector;
    private processed;
    private error;
    constructor(data: unknown, metadata: ResponseMetadata, options: ResponseOptions | undefined, metricsCollector: MetricsCollector);
    process(): Promise<void>;
}
export declare class ResponseFormatter {
    private static readonly DEFAULT_INDENT;
    static formatJson(data: unknown, pretty?: boolean): string;
}

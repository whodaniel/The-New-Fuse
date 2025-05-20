import { MetricsCollector } from '../monitoring/metricsCollector.js';
export declare class ResponseQueue {
    private readonly queue;
    private readonly maxSize;
    private readonly maxRetries;
    private readonly metricsCollector;
    private processing;
    constructor(metricsCollector: MetricsCollector, options?: {
        maxSize?: number;
        maxRetries?: number;
    });
    catch(error: unknown): any;
    private getAverageWaitTime;
    stop(): Promise<void>;
}

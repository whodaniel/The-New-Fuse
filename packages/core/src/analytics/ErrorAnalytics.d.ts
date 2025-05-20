import { EventEmitter } from 'events';
export declare class ErrorAnalytics extends EventEmitter {
    private static readonly MAX_ERRORS;
    private static readonly errors;
    private static readonly errorMap;
    private readonly logger;
    constructor();
}

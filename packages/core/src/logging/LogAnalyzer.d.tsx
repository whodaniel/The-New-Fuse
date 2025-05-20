import { LoggingService } from './LoggingService.js';
export interface LogAnalysis {
    errorCount: number;
    warningCount: number;
    topErrors: Array<{
        message: string;
        count: number;
    }>;
    timeRange: {
        start: Date;
        end: Date;
    };
}
export declare class LogAnalyzer {
    private logger;
    constructor(logger: LoggingService);
    analyzeLogsByTimeRange(): Promise<void>;
}

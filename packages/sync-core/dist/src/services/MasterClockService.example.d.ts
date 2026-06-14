/**
 * Example usage of MasterClockService with existing infrastructure integration
 * This demonstrates how to set up and use the MasterClockService in a real application
 */
import { MasterClockConfig, MasterClockService } from './MasterClockService';
export declare function demonstrateMasterClockService(): Promise<void>;
export declare class MasterClockServiceFactory {
    /**
     * Create a MasterClockService instance with production-ready configuration
     */
    static create(redisService: any, heartbeatService: any, metricsService: any, options?: Partial<MasterClockConfig>): MasterClockService;
    /**
     * Create a MasterClockService with development-friendly settings
     */
    static createForDevelopment(redisService: any, heartbeatService: any, metricsService: any): MasterClockService;
    /**
     * Create a MasterClockService with high-availability settings
     */
    static createForProduction(redisService: any, heartbeatService: any, metricsService: any): MasterClockService;
}
export declare class ApplicationWithMasterClock {
    private redisService;
    private heartbeatService;
    private metricsService;
    private masterClock?;
    constructor(redisService: any, heartbeatService: any, metricsService: any);
    start(): Promise<void>;
    stop(): Promise<void>;
    private setupClockMonitoring;
    getCurrentTime(): Promise<Date>;
    getClockMetrics(): import("./MasterClockService").ClockMetrics | undefined;
}
//# sourceMappingURL=MasterClockService.example.d.ts.map
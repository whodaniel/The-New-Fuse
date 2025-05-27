/**
 * Monitoring Strategy Guide for The New Fuse
 *
 * This file outlines the monitoring implementation strategy, balancing native features
 * and Langfuse integration to provide comprehensive monitoring capabilities.
 */
export interface MonitoringStrategy {
    nativeImplementations: {
        highPriority: string[];
        mediumPriority: string[];
        lowPriority: string[];
    };
    langfuseIntegration: {
        immediateUse: string[];
        potentialReplacement: string[];
    };
}
/**
 * The recommended monitoring strategy for The New Fuse platform.
 */
export declare const recommendedStrategy: MonitoringStrategy;
/**
 * Helper function to determine if a feature should be implemented natively
 * or delegated to Langfuse based on the recommended strategy.
 */
export declare function shouldImplementNatively(featureName: string): boolean;
/**
 * Implementation plan for integrating monitoring across the full Fuse stack
 */
export declare const implementationPlan: {
    vsCodeExtension: {
        current: string[];
        next: string[];
    };
    saasBackend: {
        current: string[];
        next: string[];
    };
    langfuseBridge: {
        current: string[];
        next: string[];
    };
};
//# sourceMappingURL=MonitoringStrategy.d.ts.map
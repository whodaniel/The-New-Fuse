import { DynamicModule } from '@nestjs/common';
export interface A2AModuleOptions {
    agentId?: string;
    agentName?: string;
    agentType?: 'coordinator' | 'worker' | 'specialist';
    capabilities?: string[];
    maxConnections?: number;
    heartbeatInterval?: number;
    messageTimeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
    enableDiscovery?: boolean;
    enableLoadBalancing?: boolean;
    enableHealthChecks?: boolean;
    enableMetrics?: boolean;
    enableLogging?: boolean;
    enableSecurity?: boolean;
    enableRateLimiting?: boolean;
    enableValidation?: boolean;
    enableCaching?: boolean;
    enablePersistence?: boolean;
    enableEncryption?: boolean;
    enableCompression?: boolean;
    enableBatching?: boolean;
    enableStreaming?: boolean;
    enableMultiplexing?: boolean;
    enableFailover?: boolean;
    enableCircuitBreaker?: boolean;
    enableRetry?: boolean;
    enableTimeout?: boolean;
    enableBackoff?: boolean;
    enableJitter?: boolean;
}
export interface A2AModuleAsyncOptions {
    useFactory?: (...args: any[]) => Promise<A2AModuleOptions> | A2AModuleOptions;
    inject?: any[];
    imports?: any[];
}
export declare class A2AModule {
    static forRoot(options?: A2AModuleOptions): DynamicModule;
    static forRootAsync(options: A2AModuleAsyncOptions): DynamicModule;
    static forFeature(options?: A2AModuleOptions): DynamicModule;
}
export default A2AModule;
//# sourceMappingURL=A2AModule.d.ts.map
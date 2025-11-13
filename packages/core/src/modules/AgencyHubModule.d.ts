import { DynamicModule } from '@nestjs/common';
export interface AgencyHubModuleOptions {
    hubId?: string;
    hubName?: string;
    hubType?: 'coordinator' | 'worker' | 'specialist';
    maxAgents?: number;
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
export interface AgencyHubModuleAsyncOptions {
    useFactory?: (...args: any[]) => Promise<AgencyHubModuleOptions> | AgencyHubModuleOptions;
    inject?: any[];
    imports?: any[];
}
export declare class AgencyHubModule {
    static forRoot(options?: AgencyHubModuleOptions): DynamicModule;
    static forRootAsync(options: AgencyHubModuleAsyncOptions): DynamicModule;
    static forFeature(options?: AgencyHubModuleOptions): DynamicModule;
}
export default AgencyHubModule;
//# sourceMappingURL=AgencyHubModule.d.ts.map
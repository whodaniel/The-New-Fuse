import { Integration, IntegrationRegistry } from './types';
/**
 * Event types emitted by IntegrationRegistryImpl
 */
export declare enum IntegrationEvent {
    REGISTERED = "integration:registered",
    REMOVED = "integration:removed",
    CONNECTED = "integration:connected",
    DISCONNECTED = "integration:disconnected",
    UPDATED = "integration:updated",
    ERROR = "integration:error"
}
/**
 * A central registry for managing all API integrations
 */
export declare class IntegrationRegistryImpl implements IntegrationRegistry {
    private loggingService;
    private integrations;
    private eventEmitter;
    private logger;
    constructor(loggingService: LoggingService);
    /**
     * Register a new integration
     */
    registerIntegration(integration: Integration): void;
    /**
     * Disconnect from an integration
     */
    disconnectIntegration(id: string): Promise<boolean>;
}
//# sourceMappingURL=IntegrationRegistry.d.ts.map
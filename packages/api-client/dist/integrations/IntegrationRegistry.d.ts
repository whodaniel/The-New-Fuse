import { Integration, IntegrationType, IntegrationRegistry } from './types.js';
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
     * Get an integration by ID
     */
    getIntegration(id: string): Integration | undefined;
    /**
     * Check if an integration exists by ID
     */
    hasIntegration(id: string): boolean;
    /**
     * Get all registered integrations
     */
    getIntegrations(): Integration[];
    /**
     * Get integrations by type
     */
    getIntegrationsByType(type: IntegrationType): Integration[];
    /**
     * Remove an integration by ID
     */
    removeIntegration(id: string): boolean;
    /**
     * Connect to an integration
     */
    connectIntegration(id: string): Promise<boolean>;
    /**
     * Disconnect from an integration
     */
    disconnectIntegration(id: string): Promise<boolean>;
    /**
     * Execute an action on an integration
     */
    executeAction(integrationId: string, action: string, params?: Record<string, any>): Promise<any>;
    /**
     * Get metadata for all integrations
     */
    getIntegrationsMetadata(): Promise<Record<string, any>[]>;
    /**
     * Subscribe to integration events
     */
    on(event: IntegrationEvent, listener: (...args: any[]) => void): void;
    /**
     * Unsubscribe from integration events
     */
    off(event: IntegrationEvent, listener: (...args: any[]) => void): void;
}
/**
 * Replace LoggingService with a minimal local logger implementation or a placeholder
 */
declare class LoggingService {
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    debug(...args: any[]): void;
    createLogger(_name?: string): this;
}
export {};
//# sourceMappingURL=IntegrationRegistry.d.ts.map
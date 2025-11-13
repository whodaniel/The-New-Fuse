import { IntegrationListing } from '../integrations/types';
import { IntegrationRegistryImpl } from '../integrations/IntegrationRegistry';
/**
 * Events emitted by the Integration Marketplace
 */
export declare enum MarketplaceEvent {
    INSTALLED = "integration:installed",
    UNINSTALLED = "integration:uninstalled",
    UPDATED = "integration:updated",
    DISCOVERED = "integration:discovered"
}
/**
 * Installation status of integrations
 */
export declare enum InstallationStatus {
    NOT_INSTALLED = "not_installed",
    INSTALLING = "installing",
    INSTALLED = "installed",
    UPDATE_AVAILABLE = "update_available",
    FAILED = "failed"
}
/**
 * Integration Marketplace Service
 * Manages the discovery, installation, and updating of integrations
 */
export declare class MarketplaceService {
    private integrationRegistry;
    private loggingService;
    private discoveryEndpoint?;
    private listings;
    private installationStatus;
    private eventEmitter;
    private logger;
    constructor(integrationRegistry: IntegrationRegistryImpl, loggingService: LoggingService, discoveryEndpoint?: string | undefined);
    /**
     * Initialize the marketplace service
     */
    initialize(): Promise<void>;
    /**
     * Discover available integrations from the marketplace
     */
    discoverIntegrations(): Promise<IntegrationListing[]>;
    catch(error: any): void;
}
declare class LoggingService {
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    debug(...args: any[]): void;
    createLogger(_name?: string): this;
}
export {};
//# sourceMappingURL=MarketplaceService.d.ts.map
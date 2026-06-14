import { IntegrationListing, Integration, IntegrationType } from '../integrations/types.js';
import { IntegrationRegistryImpl } from '../integrations/IntegrationRegistry.js';
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
    /**
     * Install an integration from the marketplace
     */
    installIntegration(id: string): Promise<Integration>;
    /**
     * Uninstall an integration
     */
    uninstallIntegration(id: string): boolean;
    /**
     * Get all available integration listings
     */
    getListings(filter?: {
        type?: IntegrationType;
        category?: string;
        search?: string;
    }): IntegrationListing[];
    /**
     * Get a specific listing by ID
     */
    getListing(id: string): IntegrationListing | undefined;
    /**
     * Get the installation status of an integration
     */
    getInstallationStatus(id: string): {
        status: InstallationStatus;
        message?: string;
    };
    /**
     * Update installation statuses for all integrations
     */
    private updateInstallationStatuses;
    /**
     * Subscribe to marketplace events
     */
    on(event: MarketplaceEvent, listener: (...args: any[]) => void): void;
    /**
     * Unsubscribe from marketplace events
     */
    off(event: MarketplaceEvent, listener: (...args: any[]) => void): void;
    /**
     * Simulate fetching listings from the API
     * In a real implementation, this would make an API call
     */
    private fetchListingsFromAPI;
    /**
     * Simulate installing an integration
     * In a real implementation, this would download and install the actual integration code
     */
    private simulateInstallation;
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
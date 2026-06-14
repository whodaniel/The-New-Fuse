import { EventEmitter } from 'events';
/**
 * Event types emitted by IntegrationRegistryImpl
 */
export var IntegrationEvent;
(function (IntegrationEvent) {
    IntegrationEvent["REGISTERED"] = "integration:registered";
    IntegrationEvent["REMOVED"] = "integration:removed";
    IntegrationEvent["CONNECTED"] = "integration:connected";
    IntegrationEvent["DISCONNECTED"] = "integration:disconnected";
    IntegrationEvent["UPDATED"] = "integration:updated";
    IntegrationEvent["ERROR"] = "integration:error";
})(IntegrationEvent || (IntegrationEvent = {}));
/**
 * A central registry for managing all API integrations
 */
export class IntegrationRegistryImpl {
    constructor(loggingService) {
        this.loggingService = loggingService;
        this.integrations = new Map();
        this.eventEmitter = new EventEmitter();
        this.logger = this.loggingService.createLogger('IntegrationRegistry');
    }
    /**
     * Register a new integration
     */
    registerIntegration(integration) {
        if (this.integrations.has(integration.id)) {
            this.logger.warn(`Integration with ID ${integration.id} already exists. Replacing.`);
        }
        this.integrations.set(integration.id, integration);
        this.eventEmitter.emit(IntegrationEvent.REGISTERED, integration);
        this.logger.info(`Registered integration: ${integration.name} (${integration.id})`);
    }
    /**
     * Get an integration by ID
     */
    getIntegration(id) {
        return this.integrations.get(id);
    }
    /**
     * Check if an integration exists by ID
     */
    hasIntegration(id) {
        return this.integrations.has(id);
    }
    /**
     * Get all registered integrations
     */
    getIntegrations() {
        return Array.from(this.integrations.values());
    }
    /**
     * Get integrations by type
     */
    getIntegrationsByType(type) {
        return this.getIntegrations().filter(integration => integration.type === type);
    }
    /**
     * Remove an integration by ID
     */
    removeIntegration(id) {
        const integration = this.getIntegration(id);
        if (integration) {
            const result = this.integrations.delete(id);
            if (result) {
                this.eventEmitter.emit(IntegrationEvent.REMOVED, integration);
                this.logger.info(`Removed integration: ${integration.name} (${integration.id})`);
            }
            return result;
        }
        return false;
    }
    /**
     * Connect to an integration
     */
    async connectIntegration(id) {
        const integration = this.getIntegration(id);
        if (!integration) {
            this.logger.error(`Integration with ID ${id} not found`);
            return false;
        }
        try {
            const connected = await integration.connect();
            if (connected) {
                this.eventEmitter.emit(IntegrationEvent.CONNECTED, integration);
                this.logger.info(`Connected to integration: ${integration.name} (${integration.id})`);
            }
            return connected;
        }
        catch (error) {
            if (error instanceof Error) {
                this.logger.error(`Failed to connect to integration: ${integration.name} (${integration.id})`, {
                    error: error.message,
                    stack: error.stack
                });
            }
            else {
                this.logger.error(`Failed to connect to integration: ${integration.name} (${integration.id})`, {
                    error: String(error)
                });
            }
            this.eventEmitter.emit(IntegrationEvent.ERROR, {
                integration,
                error,
                operation: 'connect'
            });
            return false;
        }
    }
    /**
     * Disconnect from an integration
     */
    async disconnectIntegration(id) {
        const integration = this.getIntegration(id);
        if (!integration) {
            this.logger.error(`Integration with ID ${id} not found`);
            return false;
        }
        try {
            const disconnected = await integration.disconnect();
            if (disconnected) {
                this.eventEmitter.emit(IntegrationEvent.DISCONNECTED, integration);
                this.logger.info(`Disconnected from integration: ${integration.name} (${integration.id})`);
            }
            return disconnected;
        }
        catch (error) {
            if (error instanceof Error) {
                this.logger.error(`Failed to disconnect from integration: ${integration.name} (${integration.id})`, {
                    error: error.message,
                    stack: error.stack
                });
            }
            else {
                this.logger.error(`Failed to disconnect from integration: ${integration.name} (${integration.id})`, {
                    error: String(error)
                });
            }
            this.eventEmitter.emit(IntegrationEvent.ERROR, {
                integration,
                error,
                operation: 'disconnect'
            });
            return false;
        }
    }
    /**
     * Execute an action on an integration
     */
    async executeAction(integrationId, action, params = {}) {
        const integration = this.getIntegration(integrationId);
        if (!integration) {
            throw new Error(`Integration with ID ${integrationId} not found`);
        }
        if (!integration.isConnected) {
            throw new Error(`Integration ${integration.name} is not connected. Connect first.`);
        }
        try {
            this.logger.debug(`Executing action ${action} on ${integration.name} (${integration.id})`, { params });
            return await integration.execute(action, params);
        }
        catch (error) {
            if (error instanceof Error) {
                this.logger.error(`Failed to execute action ${action} on ${integration.name} (${integration.id})`, {
                    error: error.message,
                    stack: error.stack,
                    params
                });
            }
            else {
                this.logger.error(`Failed to execute action ${action} on ${integration.name} (${integration.id})`, {
                    error: String(error),
                    params
                });
            }
            this.eventEmitter.emit(IntegrationEvent.ERROR, {
                integration,
                error,
                operation: 'execute',
                action,
                params
            });
            throw error;
        }
    }
    /**
     * Get metadata for all integrations
     */
    async getIntegrationsMetadata() {
        const metadataPromises = this.getIntegrations().map(async (integration) => {
            try {
                return await integration.getMetadata();
            }
            catch (error) {
                if (error instanceof Error) {
                    this.logger.error(`Failed to get metadata for ${integration.name} (${integration.id})`, {
                        error: error.message,
                        stack: error.stack
                    });
                }
                else {
                    this.logger.error(`Failed to get metadata for ${integration.name} (${integration.id})`, {
                        error: String(error)
                    });
                }
                return {
                    id: integration.id,
                    name: integration.name,
                    type: integration.type,
                    isConnected: integration.isConnected,
                    isEnabled: integration.isEnabled,
                    error: error instanceof Error ? error.message : String(error)
                };
            }
        });
        return Promise.all(metadataPromises);
    }
    /**
     * Subscribe to integration events
     */
    on(event, listener) {
        this.eventEmitter.on(event, listener);
    }
    /**
     * Unsubscribe from integration events
     */
    off(event, listener) {
        this.eventEmitter.off(event, listener);
    }
}
/**
 * Replace LoggingService with a minimal local logger implementation or a placeholder
 */
class LoggingService {
    info(...args) { console.info(...args); }
    warn(...args) { console.warn(...args); }
    error(...args) { console.error(...args); }
    debug(...args) { console.debug(...args); }
    createLogger(_name) { return this; }
}
//# sourceMappingURL=IntegrationRegistry.js.map
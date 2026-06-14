// Import required API client and types
import { ApiClient } from '../../core/ApiClient.js';
import { IntegrationType, AuthType } from '../types.js';
/**
 * Zapier integration for workflow automation
 */
export class ZapierIntegration {
    constructor(config) {
        this.isConnected = false;
        this.isEnabled = true;
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.id = config.id;
        this.name = config.name;
        this.type = config.type;
        this.description = config.description;
        this.config = config;
        // Default Zapier capabilities
        this.capabilities = {
            actions: [
                'list_zaps',
                'get_zap',
                'toggle_zap',
                'list_apps',
                'list_triggers',
                'list_actions',
                'list_searches',
                'execute_zap',
                'create_webhook',
                'list_webhooks',
                'delete_webhook'
            ],
            triggers: [
                'zap_triggered',
                'zap_succeeded',
                'zap_failed'
            ],
            supportsWebhooks: true,
            supportsPolling: true,
            supportsCustomFields: true
        };
        // Create API client for Zapier
        const apiConfig = {
            baseURL: config.baseUrl || '',
            headers: {
                ...config.defaultHeaders,
                'Content-Type': 'application/json'
            }
        };
        // Add API key if provided
        if (config.apiKey) {
            apiConfig.headers = {
                ...apiConfig.headers,
                'X-API-Key': config.apiKey
            };
        }
        this.apiClient = new ApiClient(apiConfig);
    }
    /**
     * Connect to Zapier API
     */
    async connect() {
        try {
            // Verify API key by making a test request
            await this.listZaps();
            this.isConnected = true;
            this.updatedAt = new Date();
            return true;
        }
        catch (error) {
            this.isConnected = false;
            throw new Error(`Failed to connect to Zapier: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Disconnect from Zapier API
     */
    async disconnect() {
        this.isConnected = false;
        this.updatedAt = new Date();
        return true;
    }
    /**
     * Execute a Zapier action
     */
    async execute(action, params) {
        if (!this.isConnected) {
            throw new Error('Not connected to Zapier. Call connect() first.');
        }
        switch (action) {
            case 'list_zaps':
                return this.listZaps();
            case 'get_zap':
                return this.getZap(params.zapId);
            case 'toggle_zap':
                return this.toggleZap(params.zapId, params.enabled);
            case 'list_apps':
                return this.listApps();
            case 'list_triggers':
                return this.listTriggers(params.appId);
            case 'list_actions':
                return this.listActions(params.appId);
            case 'list_searches':
                return this.listSearches(params.appId);
            case 'execute_zap':
                return this.executeZap(params.zapId, params.data);
            case 'create_webhook':
                return this.createWebhook(params.zapId, params.url, params.event);
            case 'list_webhooks':
                return this.listWebhooks(params.zapId);
            case 'delete_webhook':
                return this.deleteWebhook(params.webhookId);
            case 'nla_request':
                if (!this.config.nlaEnabled) {
                    throw new Error('Natural Language Actions (NLA) is not enabled for this integration');
                }
                return this.nlaRequest(params.prompt, params.params);
            default:
                throw new Error(`Unsupported Zapier action: ${action}`);
        }
    }
    /**
     * List user's Zaps
     */
    async listZaps() {
        try {
            return await this.apiClient.get('/v1/zaps');
        }
        catch (error) {
            throw new Error(`Failed to list Zaps: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get a specific Zap
     */
    async getZap(zapId) {
        try {
            return await this.apiClient.get(`/v1/zaps/${zapId}`);
        }
        catch (error) {
            throw new Error(`Failed to get Zap: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Toggle a Zap on or off
     */
    async toggleZap(zapId, enabled) {
        try {
            return await this.apiClient.patch(`/v1/zaps/${zapId}`, {
                active: enabled
            });
        }
        catch (error) {
            throw new Error(`Failed to toggle Zap: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * List available apps
     */
    async listApps() {
        try {
            return await this.apiClient.get('/v1/apps');
        }
        catch (error) {
            throw new Error(`Failed to list apps: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * List triggers for an app
     */
    async listTriggers(appId) {
        try {
            return await this.apiClient.get(`/v1/apps/${appId}/triggers`);
        }
        catch (error) {
            throw new Error(`Failed to list triggers: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * List actions for an app
     */
    async listActions(appId) {
        try {
            return await this.apiClient.get(`/v1/apps/${appId}/actions`);
        }
        catch (error) {
            throw new Error(`Failed to list actions: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * List searches for an app
     */
    async listSearches(appId) {
        try {
            return await this.apiClient.get(`/v1/apps/${appId}/searches`);
        }
        catch (error) {
            throw new Error(`Failed to list searches: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Execute a Zap with data
     */
    async executeZap(zapId, data) {
        try {
            return await this.apiClient.post(`/v1/zaps/${zapId}/execute`, data);
        }
        catch (error) {
            throw new Error(`Failed to execute Zap: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Create a webhook for a Zap
     */
    async createWebhook(zapId, url, event) {
        try {
            return await this.apiClient.post(`/v1/zaps/${zapId}/webhooks`, {
                url,
                event
            });
        }
        catch (error) {
            throw new Error(`Failed to create webhook: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * List webhooks for a Zap
     */
    async listWebhooks(zapId) {
        try {
            return await this.apiClient.get(`/v1/zaps/${zapId}/webhooks`);
        }
        catch (error) {
            throw new Error(`Failed to list webhooks: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Delete a webhook
     */
    async deleteWebhook(webhookId) {
        try {
            return await this.apiClient.delete(`/v1/webhooks/${webhookId}`);
        }
        catch (error) {
            throw new Error(`Failed to delete webhook: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Make a Natural Language Actions (NLA) request
     */
    async nlaRequest(prompt, params) {
        try {
            return await this.apiClient.post('/v1/nla/requests', {
                prompt,
                params: params || {}
            });
        }
        catch (error) {
            throw new Error(`Failed to process NLA request: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get metadata about this integration
     */
    async getMetadata() {
        const metadata = {
            id: this.id,
            name: this.name,
            type: this.type,
            capabilities: this.capabilities,
            isConnected: this.isConnected,
            isEnabled: this.isEnabled,
            lastUpdated: this.updatedAt
        };
        if (this.isConnected) {
            try {
                metadata.zaps = await this.listZaps();
            }
            catch (error) {
                metadata.zapError = error instanceof Error ? error.message : String(error);
            }
        }
        return metadata;
    }
}
/**
 * Create a new Zapier integration
 */
export function createZapierIntegration(config = {}) {
    const defaultConfig = {
        id: 'zapier',
        name: 'Zapier',
        type: IntegrationType.AUTOMATION,
        description: 'Connect and automate your apps with Zapier',
        baseUrl: 'https://api.zapier.com',
        authType: AuthType.API_KEY,
        webhookSupport: true,
        apiVersion: 'v1',
        nlaEnabled: false,
        docUrl: 'https://zapier.com/developer/documentation/v2/',
        logoUrl: 'https://cdn.zapier.com/zapier/images/logos/zapier-logo.svg'
    };
    return new ZapierIntegration({
        ...defaultConfig,
        ...config
    });
}
//# sourceMappingURL=zapier.js.map
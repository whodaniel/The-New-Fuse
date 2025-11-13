import { Integration, IntegrationType, IntegrationConfig } from '../types';
/**
 * Shopify API configuration
 */
export interface ShopifyConfig extends IntegrationConfig {
    shopName: string;
    accessToken?: string;
    apiKey?: string;
    apiSecret?: string;
    apiVersion?: string;
}
/**
 * Shopify API integration for e-commerce capabilities
 */
export declare class ShopifyIntegration implements Integration {
    id: string;
    name: string;
    type: IntegrationType;
    description?: string;
    config: ShopifyConfig;
    capabilities: {
        actions: string[];
        triggers?: string[];
        supportsWebhooks: boolean;
        supportsPolling: boolean;
    };
    isConnected: boolean;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    private apiClient;
    constructor(config: ShopifyConfig);
    private getProduct;
    catch(error: any): void;
}
//# sourceMappingURL=shopify.d.ts.map
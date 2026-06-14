import { Integration, IntegrationType, IntegrationConfig } from '../types.js';
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
    /**
     * Connect to Shopify API
     */
    connect(): Promise<boolean>;
    /**
     * Disconnect from Shopify API
     */
    disconnect(): Promise<boolean>;
    /**
     * Execute a Shopify action
     */
    execute(action: string, params: Record<string, any>): Promise<any>;
    /**
     * Create a product
     */
    private createProduct;
    /**
     * Update a product
     */
    private updateProduct;
    /**
     * Delete a product
     */
    private deleteProduct;
    /**
     * Get a product
     */
    private getProduct;
    /**
     * List products
     */
    private listProducts;
    /**
     * Create an order
     */
    private createOrder;
    /**
     * Update an order
     */
    private updateOrder;
    /**
     * Get an order
     */
    private getOrder;
    /**
     * List orders
     */
    private listOrders;
    /**
     * Create a customer
     */
    private createCustomer;
    /**
     * Update a customer
     */
    private updateCustomer;
    /**
     * Get a customer
     */
    private getCustomer;
    /**
     * List customers
     */
    private listCustomers;
    /**
     * Create a discount
     */
    private createDiscount;
    /**
     * List discounts
     */
    private listDiscounts;
    /**
     * Create a collection
     */
    private createCollection;
    /**
     * Update a collection
     */
    private updateCollection;
    /**
     * List collections
     */
    private listCollections;
    /**
     * Update inventory level
     */
    private updateInventory;
    /**
     * Create a fulfillment
     */
    private createFulfillment;
    /**
     * Cancel a fulfillment
     */
    private cancelFulfillment;
    /**
     * Get shop details
     */
    private getShop;
    /**
     * Build query parameters string from options object
     */
    private buildQueryParams;
    /**
     * Get metadata about this integration
     */
    getMetadata(): Promise<Record<string, any>>;
}
/**
 * Create a new Shopify integration
 */
export declare function createShopifyIntegration(config?: Partial<ShopifyConfig>): ShopifyIntegration;
//# sourceMappingURL=shopify.d.ts.map
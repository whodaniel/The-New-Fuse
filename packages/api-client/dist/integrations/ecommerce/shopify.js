// Import required API client and types
import { ApiClient } from '../../core/ApiClient.js';
import { IntegrationType, AuthType } from '../types.js';
/**
 * Shopify API integration for e-commerce capabilities
 */
export class ShopifyIntegration {
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
        // Default Shopify capabilities
        this.capabilities = {
            actions: [
                'create_product',
                'update_product',
                'delete_product',
                'get_product',
                'list_products',
                'create_order',
                'update_order',
                'get_order',
                'list_orders',
                'create_customer',
                'update_customer',
                'get_customer',
                'list_customers',
                'create_discount',
                'list_discounts',
                'create_collection',
                'update_collection',
                'list_collections',
                'update_inventory',
                'create_fulfillment',
                'cancel_fulfillment',
                'get_shop'
            ],
            triggers: [
                'new_order',
                'updated_order',
                'cancelled_order',
                'new_customer',
                'updated_customer',
                'new_product',
                'updated_product',
                'deleted_product',
                'inventory_update',
                'fulfillment_created',
                'fulfillment_updated'
            ],
            supportsWebhooks: true,
            supportsPolling: true
        };
        // Create API client for Shopify
        const shopDomain = config.shopName.includes('.myshopify.com')
            ? config.shopName
            : `${config.shopName}.myshopify.com`;
        const apiConfig = {
            baseURL: `https://${shopDomain}/admin/api/${config.apiVersion || '2023-07'}`,
            headers: {
                ...config.defaultHeaders,
                'Content-Type': 'application/json'
            }
        };
        // Add access token if provided
        if (config.accessToken) {
            apiConfig.headers = {
                ...apiConfig.headers,
                'X-Shopify-Access-Token': config.accessToken
            };
        }
        this.apiClient = new ApiClient(apiConfig);
    }
    /**
     * Connect to Shopify API
     */
    async connect() {
        try {
            // Verify credentials by making a test request
            const result = await this.apiClient.get('/shop.json');
            this.isConnected = true;
            this.updatedAt = new Date();
            return true;
        }
        catch (error) {
            this.isConnected = false;
            throw new Error(`Failed to connect to Shopify: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Disconnect from Shopify API
     */
    async disconnect() {
        this.isConnected = false;
        this.updatedAt = new Date();
        return true;
    }
    /**
     * Execute a Shopify action
     */
    async execute(action, params) {
        if (!this.isConnected) {
            throw new Error('Not connected to Shopify API. Call connect() first.');
        }
        switch (action) {
            case 'create_product':
                return this.createProduct(params.product);
            case 'update_product':
                return this.updateProduct(params.productId, params.product);
            case 'delete_product':
                return this.deleteProduct(params.productId);
            case 'get_product':
                return this.getProduct(params.productId);
            case 'list_products':
                return this.listProducts(params.options);
            case 'create_order':
                return this.createOrder(params.order);
            case 'update_order':
                return this.updateOrder(params.orderId, params.order);
            case 'get_order':
                return this.getOrder(params.orderId);
            case 'list_orders':
                return this.listOrders(params.options);
            case 'create_customer':
                return this.createCustomer(params.customer);
            case 'update_customer':
                return this.updateCustomer(params.customerId, params.customer);
            case 'get_customer':
                return this.getCustomer(params.customerId);
            case 'list_customers':
                return this.listCustomers(params.options);
            case 'create_discount':
                return this.createDiscount(params.discount);
            case 'list_discounts':
                return this.listDiscounts(params.options);
            case 'create_collection':
                return this.createCollection(params.collection);
            case 'update_collection':
                return this.updateCollection(params.collectionId, params.collection);
            case 'list_collections':
                return this.listCollections(params.options);
            case 'update_inventory':
                return this.updateInventory(params.inventoryItemId, params.locationId, params.available);
            case 'create_fulfillment':
                return this.createFulfillment(params.orderId, params.fulfillment);
            case 'cancel_fulfillment':
                return this.cancelFulfillment(params.orderId, params.fulfillmentId);
            case 'get_shop':
                return this.getShop();
            default:
                throw new Error(`Unsupported Shopify action: ${action}`);
        }
    }
    /**
     * Create a product
     */
    async createProduct(product) {
        try {
            return await this.apiClient.post('/products.json', { product });
        }
        catch (error) {
            throw new Error(`Failed to create product: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Update a product
     */
    async updateProduct(productId, product) {
        try {
            return await this.apiClient.put(`/products/${productId}.json`, { product });
        }
        catch (error) {
            throw new Error(`Failed to update product: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Delete a product
     */
    async deleteProduct(productId) {
        try {
            return await this.apiClient.delete(`/products/${productId}.json`);
        }
        catch (error) {
            throw new Error(`Failed to delete product: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get a product
     */
    async getProduct(productId) {
        try {
            return await this.apiClient.get(`/products/${productId}.json`);
        }
        catch (error) {
            throw new Error(`Failed to get product: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * List products
     */
    async listProducts(options = {}) {
        try {
            const queryParams = this.buildQueryParams(options);
            return await this.apiClient.get(`/products.json${queryParams}`);
        }
        catch (error) {
            throw new Error(`Failed to list products: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Create an order
     */
    async createOrder(order) {
        try {
            return await this.apiClient.post('/orders.json', { order });
        }
        catch (error) {
            throw new Error(`Failed to create order: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Update an order
     */
    async updateOrder(orderId, order) {
        try {
            return await this.apiClient.put(`/orders/${orderId}.json`, { order });
        }
        catch (error) {
            throw new Error(`Failed to update order: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get an order
     */
    async getOrder(orderId) {
        try {
            return await this.apiClient.get(`/orders/${orderId}.json`);
        }
        catch (error) {
            throw new Error(`Failed to get order: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * List orders
     */
    async listOrders(options = {}) {
        try {
            const queryParams = this.buildQueryParams(options);
            return await this.apiClient.get(`/orders.json${queryParams}`);
        }
        catch (error) {
            throw new Error(`Failed to list orders: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Create a customer
     */
    async createCustomer(customer) {
        try {
            return await this.apiClient.post('/customers.json', { customer });
        }
        catch (error) {
            throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Update a customer
     */
    async updateCustomer(customerId, customer) {
        try {
            return await this.apiClient.put(`/customers/${customerId}.json`, { customer });
        }
        catch (error) {
            throw new Error(`Failed to update customer: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get a customer
     */
    async getCustomer(customerId) {
        try {
            return await this.apiClient.get(`/customers/${customerId}.json`);
        }
        catch (error) {
            throw new Error(`Failed to get customer: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * List customers
     */
    async listCustomers(options = {}) {
        try {
            const queryParams = this.buildQueryParams(options);
            return await this.apiClient.get(`/customers.json${queryParams}`);
        }
        catch (error) {
            throw new Error(`Failed to list customers: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Create a discount
     */
    async createDiscount(discount) {
        try {
            return await this.apiClient.post('/price_rules.json', { price_rule: discount });
        }
        catch (error) {
            throw new Error(`Failed to create discount: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * List discounts
     */
    async listDiscounts(options = {}) {
        try {
            const queryParams = this.buildQueryParams(options);
            return await this.apiClient.get(`/price_rules.json${queryParams}`);
        }
        catch (error) {
            throw new Error(`Failed to list discounts: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Create a collection
     */
    async createCollection(collection) {
        try {
            return await this.apiClient.post('/custom_collections.json', { custom_collection: collection });
        }
        catch (error) {
            throw new Error(`Failed to create collection: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Update a collection
     */
    async updateCollection(collectionId, collection) {
        try {
            return await this.apiClient.put(`/custom_collections/${collectionId}.json`, { custom_collection: collection });
        }
        catch (error) {
            throw new Error(`Failed to update collection: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * List collections
     */
    async listCollections(options = {}) {
        try {
            const queryParams = this.buildQueryParams(options);
            return await this.apiClient.get(`/custom_collections.json${queryParams}`);
        }
        catch (error) {
            throw new Error(`Failed to list collections: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Update inventory level
     */
    async updateInventory(inventoryItemId, locationId, available) {
        try {
            return await this.apiClient.post('/inventory_levels/set.json', {
                inventory_item_id: inventoryItemId,
                location_id: locationId,
                available
            });
        }
        catch (error) {
            throw new Error(`Failed to update inventory: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Create a fulfillment
     */
    async createFulfillment(orderId, fulfillment) {
        try {
            return await this.apiClient.post(`/orders/${orderId}/fulfillments.json`, { fulfillment });
        }
        catch (error) {
            throw new Error(`Failed to create fulfillment: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Cancel a fulfillment
     */
    async cancelFulfillment(orderId, fulfillmentId) {
        try {
            return await this.apiClient.post(`/orders/${orderId}/fulfillments/${fulfillmentId}/cancel.json`);
        }
        catch (error) {
            throw new Error(`Failed to cancel fulfillment: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get shop details
     */
    async getShop() {
        try {
            return await this.apiClient.get('/shop.json');
        }
        catch (error) {
            throw new Error(`Failed to get shop details: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Build query parameters string from options object
     */
    buildQueryParams(options) {
        if (!options || Object.keys(options).length === 0) {
            return '';
        }
        const params = new URLSearchParams();
        Object.entries(options).forEach(([key, value]) => {
            params.append(key, value.toString());
        });
        return `?${params.toString()}`;
    }
    /**
     * Get metadata about this integration
     */
    async getMetadata() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            capabilities: this.capabilities,
            isConnected: this.isConnected,
            isEnabled: this.isEnabled,
            lastUpdated: this.updatedAt
        };
    }
}
/**
 * Create a new Shopify integration
 */
export function createShopifyIntegration(config = {}) {
    const defaultConfig = {
        id: 'shopify',
        name: 'Shopify',
        type: IntegrationType.ECOMMERCE,
        description: 'Integrate with Shopify for e-commerce operations and automation',
        shopName: config.shopName || '',
        baseUrl: `https://${config.shopName || 'example'}.myshopify.com/admin/api/${config.apiVersion || '2023-07'}`,
        authType: AuthType.API_KEY,
        webhookSupport: true,
        apiVersion: config.apiVersion || '2023-07',
        docUrl: 'https://shopify.dev/docs/admin-api/rest/reference',
        logoUrl: 'https://cdn.shopify.com/shopifycloud/brochure/assets/brand-assets/shopify-logo-primary-logo-456baa801ee66a0a435671082365958316831c9960c480451dd0330bcdae304f.svg'
    };
    return new ShopifyIntegration({
        ...defaultConfig,
        ...config
    });
}
//# sourceMappingURL=shopify.js.map
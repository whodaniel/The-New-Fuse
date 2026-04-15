/**
 * Enhanced BaseService Example
 * 
 * This example demonstrates how to use the enhanced BaseService
 * to create consistent and maintainable API service classes.
 */

import {
  createApiClient,
  BaseService,
  type ApiClient,
  type TokenStorage
} from '@the-new-fuse/api-client';

// Example: Creating a custom service that extends BaseService
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductCreateData {
  name: string;
  price: number;
  category: string;
  description?: string;
}

interface ProductUpdateData {
  name?: string;
  price?: number;
  category?: string;
  description?: string;
}

/**
 * Product service extending BaseService
 * Demonstrates common CRUD operations with validation and error handling
 */
class ProductService extends BaseService {
  constructor(apiClient: ApiClient) {
    super(apiClient, '/products');
  }

  // List products with filtering and pagination
  async getProducts(options: {
    page?: number;
    limit?: number;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  } = {}): Promise<Product[]> {
    return this.list<Product[]>('', options);
  }

  // Get single product by ID
  async getProduct(id: string): Promise<Product> {
    return this.getById<Product>(id);
  }

  // Create new product with validation
  async createProduct(data: ProductCreateData): Promise<Product> {
    // Validate required fields
    this.validateRequired(
      { name: data.name, price: data.price, category: data.category },
      ['name', 'price', 'category']
    );

    // Additional business validation
    if (data.price <= 0) {
      throw new Error('Price must be greater than 0');
    }

    return this.create<Product>(data);
  }

  // Update product
  async updateProduct(id: string, data: ProductUpdateData): Promise<Product> {
    return this.updateById<Product>(id, data);
  }

  // Delete product
  async deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
    return this.deleteById<{ success: boolean; message: string }>(id);
  }

  // Custom endpoint: Search products
  async searchProducts(query: string, options: Record<string, any> = {}): Promise<Product[]> {
    this.validateRequired({ query }, ['query']);
    const searchOptions = { ...options, q: query };
    return this.list<Product[]>('/search', searchOptions);
  }

  // Custom endpoint: Get products by category
  async getProductsByCategory(category: string): Promise<Product[]> {
    this.validateRequired({ category }, ['category']);
    return this.get<Product[]>(`/category/${category}`);
  }

  // Custom endpoint: Bulk update prices
  async bulkUpdatePrices(updates: { id: string; price: number }[]): Promise<Product[]> {
    this.validateRequired({ updates }, ['updates']);
    return this.post<Product[]>('/bulk-update-prices', { updates });
  }
}

// Example: Using the enhanced services
async function demonstrateEnhancedServices() {
  // Create API client with configuration
  const apiClient = createApiClient({
    baseURL: 'https://api.example.com',
    timeout: 10000,
    headers: {
      'User-Agent': 'MyApp/1.0.0'
    }
  });

  // Create service instances
  const productService = new ProductService(apiClient);

  try {
    // List products with filtering
    console.log('Fetching products...');
    const products = await productService.getProducts({
      page: 1,
      limit: 10,
      category: 'electronics',
      minPrice: 100,
      maxPrice: 500
    });
    console.log(`Found ${products.length} products`);

    // Get specific product
    if (products.length > 0) {
      const product = await productService.getProduct(products[0].id);
      console.log('Product details:', product);
    }

    // Create new product
    const newProduct = await productService.createProduct({
      name: 'New Smartphone',
      price: 299.99,
      category: 'electronics',
      description: 'Latest model smartphone with advanced features'
    });
    console.log('Created product:', newProduct);

    // Update product
    const updatedProduct = await productService.updateProduct(newProduct.id, {
      price: 279.99,
      description: 'Latest model smartphone with advanced features - On Sale!'
    });
    console.log('Updated product:', updatedProduct);

    // Search products
    const searchResults = await productService.searchProducts('smartphone', {
      limit: 5
    });
    console.log(`Search results: ${searchResults.length} products found`);

    // Get products by category
    const electronicsProducts = await productService.getProductsByCategory('electronics');
    console.log(`Electronics category: ${electronicsProducts.length} products`);

    // Bulk update prices
    const priceUpdates = [
      { id: newProduct.id, price: 249.99 },
      // Add more updates as needed
    ];
    const bulkUpdated = await productService.bulkUpdatePrices(priceUpdates);
    console.log(`Bulk updated ${bulkUpdated.length} products`);

  } catch (error) {
    console.error('API Error:', error);
  }
}

// Example: Custom service with additional common patterns
class OrderService extends BaseService {
  constructor(apiClient: ApiClient) {
    super(apiClient, '/orders');
  }

  // Demonstrate custom query building
  async getOrdersByDateRange(startDate: string, endDate: string): Promise<any[]> {
    this.validateRequired({ startDate, endDate }, ['startDate', 'endDate']);
    
    const queryString = this.buildQueryString({
      startDate,
      endDate,
      sort: 'createdAt',
      order: 'desc'
    });
    
    return this.get<any[]>(queryString);
  }

  // Demonstrate custom path construction
  async getOrderItems(orderId: string): Promise<any[]> {
    return this.get<any[]>(`/${orderId}/items`);
  }

  // Demonstrate error handling patterns
  async cancelOrder(orderId: string, reason?: string): Promise<any> {
    this.validateRequired({ orderId }, ['orderId']);
    
    try {
      return await this.patch<any>(`/${orderId}/cancel`, { reason });
    } catch (error) {
      // Add custom error handling
      console.error(`Failed to cancel order ${orderId}:`, error);
      throw error;
    }
  }
}

// Export for use in other examples
export {
  ProductService,
  OrderService,
  demonstrateEnhancedServices
};

/**
 * Key Benefits of the Enhanced BaseService:
 * 
 * 1. **Consistency**: All services follow the same patterns
 * 2. **Validation**: Built-in parameter validation
 * 3. **Error Handling**: Consistent error handling across services
 * 4. **Code Reuse**: Common operations are implemented once
 * 5. **Type Safety**: Full TypeScript support with generics
 * 6. **Flexibility**: Easy to extend with custom methods
 * 7. **Query Building**: Automatic query string construction
 * 8. **Path Management**: Automatic path construction and normalization
 * 
 * Common Patterns Supported:
 * - CRUD operations (Create, Read, Update, Delete)
 * - List with pagination and filtering
 * - Search functionality
 * - Bulk operations
 * - Custom endpoints
 * - Parameter validation
 * - Query string building
 */

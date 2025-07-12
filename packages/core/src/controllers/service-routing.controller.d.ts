/**
 * Service Routing Controller
 * Handles service category management, provider routing, and service requests
 */
export declare class ServiceRoutingController {
    private readonly logger;
    getCategories(parentId: string, tier: string): Promise<any[]>;
    getCategoryById(categoryId: string): Promise<{}>;
    createCategory(createCategoryDto: any): Promise<{
        message: string;
    }>;
    updateCategory(categoryId: string, updateCategoryDto: any): Promise<{
        message: string;
    }>;
    deleteCategory(categoryId: string): Promise<{
        message: string;
    }>;
    getProviders(categoryId: string, agencyId: string): Promise<any[]>;
    registerProvider(registerProviderDto: any): Promise<{
        message: string;
    }>;
    getProviderById(providerId: string): Promise<{}>;
    updateProvider(providerId: string, updateProviderDto: any): Promise<{
        message: string;
    }>;
    removeProvider(providerId: string): Promise<{
        message: string;
    }>;
    createServiceRequest(createRequestDto: any): Promise<{
        message: string;
    }>;
    getServiceRequests(status: string, categoryId: string, page: number, limit: number): Promise<any[]>;
    getRequestById(requestId: string): Promise<{}>;
    updateServiceRequest(requestId: string, updateRequestDto: any): Promise<{
        message: string;
    }>;
    assignRequest(requestId: string, assignRequestDto: any): Promise<{
        message: string;
    }>;
    optimizeRouting(optimizeDto: any): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=service-routing.controller.d.ts.map
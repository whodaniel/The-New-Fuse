export interface ServiceCategory {
    id: string;
    name: string;
    description?: string;
    services: string[];
}
export interface RouteRequest {
    category: string;
    service?: string;
    payload?: any;
}
export declare class ServiceCategoryRouter {
    private readonly logger;
    private categories;
    registerCategory(category: ServiceCategory): void;
    route(request: RouteRequest): Promise<any>;
    getCategories(): ServiceCategory[];
}
//# sourceMappingURL=service-category-router-clean.service.d.ts.map
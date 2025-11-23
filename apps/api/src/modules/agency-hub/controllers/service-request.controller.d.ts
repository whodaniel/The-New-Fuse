import { ServiceCategoryRouterService } from '../../../types/core/services/service-category-router.service';
import { EnhancedAgencyService } from '../../../types/core/services/enhanced-agency.service';
export declare class ServiceRequestController {
    private readonly serviceCategoryRouter;
    private readonly enhancedAgencyService;
    constructor(serviceCategoryRouter: ServiceCategoryRouterService, enhancedAgencyService: EnhancedAgencyService);
    createServiceRequest(requestDto: any, user: any): Promise<any>;
    getServiceRequests(agencyId: string, status?: string, categoryId?: string, providerId?: string, limit: number | undefined, offset: number | undefined, user: any): Promise<any>;
    getServiceRequest(requestId: string): Promise<any>;
    updateRequestStatus(requestId: string, statusDto: any): Promise<any>;
    assignRequest(requestId: string, assignmentDto: any): Promise<any>;
    autoAssignRequest(requestId: string): Promise<any>;
    getProviderRecommendations(requestId: string): Promise<any>;
    completeRequest(requestId: string, completionDto: any): Promise<any>;
    submitReview(requestId: string, reviewDto: any, user: any): Promise<any>;
    getRequestsByCategory(categoryId: string, agencyId: string, status?: string, limit?: number, offset?: number): Promise<any>;
}
//# sourceMappingURL=service-request.controller.d.ts.map
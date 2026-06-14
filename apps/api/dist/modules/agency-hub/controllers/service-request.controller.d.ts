export declare class ServiceRequestController {
    createServiceRequest(requestDto: any): Promise<void>;
    getServiceRequests(agencyId: string, status?: string, categoryId?: string, providerId?: string, limit?: number, offset?: number): Promise<void>;
    getServiceRequest(requestId: string): Promise<void>;
    updateRequestStatus(requestId: string, statusDto: any): Promise<void>;
    assignRequest(requestId: string, assignmentDto: any): Promise<void>;
    autoAssignRequest(requestId: string): Promise<void>;
    getProviderRecommendations(requestId: string): Promise<void>;
    completeRequest(requestId: string, completionDto: any): Promise<void>;
    submitReview(requestId: string, reviewDto: any): Promise<void>;
    getRequestsByCategory(categoryId: string, agencyId: string, status?: string, limit?: number, offset?: number): Promise<void>;
    private notImplemented;
}
//# sourceMappingURL=service-request.controller.d.ts.map
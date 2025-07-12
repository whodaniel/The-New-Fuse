/**
 * Agency Hub Controller - Main API endpoints for agency management
 * Handles agency creation, management, and tenant operations
 */
export declare class AgencyHubController {
    private readonly logger;
    createAgency(createAgencyDto: any): Promise<{
        message: string;
    }>;
    getAllAgencies(page: number, limit: number, tier: string, status: string): Promise<any[]>;
    getAgencyById(agencyId: string): Promise<{}>;
    updateAgency(agencyId: string, updateAgencyDto: any): Promise<{
        message: string;
    }>;
    deleteAgency(agencyId: string): Promise<{
        message: string;
    }>;
    getDashboardData(): Promise<{}>;
    getSwarmStatus(): Promise<{}>;
    initializeSwarm(initializeSwarmDto: any): Promise<{
        message: string;
    }>;
    getAnalytics(period: string, metric: string): Promise<{}>;
    submitServiceRequest(serviceRequestDto: any): Promise<{
        message: string;
    }>;
    getServiceRequests(status: string, category: string, page: number, limit: number): Promise<any[]>;
    getServiceProviders(): Promise<any[]>;
    registerProvider(registerProviderDto: any): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=agency-hub.controller.d.ts.map
import { EnhancedAgencyService } from '@the-new-fuse/core/services/enhanced-agency.service';
export declare class AgencyController {
    private readonly enhancedAgencyService;
    constructor(enhancedAgencyService: EnhancedAgencyService);
    createAgency(createAgencyDto: any): Promise<any>;
    getAgency(agencyId: string): Promise<any>;
    updateAgency(agencyId: string, updateAgencyDto: any): Promise<any>;
    initializeSwarm(agencyId: string, config?: any): Promise<any>;
    getSwarmStatus(agencyId: string): Promise<any>;
    registerProviders(agencyId: string, providersDto: any): Promise<any>;
    getProviders(agencyId: string, categoryId?: string, active?: boolean): Promise<any>;
    getAnalytics(agencyId: string, timeframe?: string): Promise<any>;
}

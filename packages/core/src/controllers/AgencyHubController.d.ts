import { AgencyHubService } from '../services/AgencyHubService';
export declare class AgencyHubController {
    private readonly agencyHubService;
    constructor(agencyHubService: AgencyHubService);
    getStatus(): Promise<any>;
    getAgencies(): Promise<import("../services/AgencyHubService").Agency[]>;
    createAgency(data: any): Promise<import("../services/AgencyHubService").Agency>;
}
//# sourceMappingURL=AgencyHubController.d.ts.map
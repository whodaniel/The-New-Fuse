import { PrismaService } from '@the-new-fuse/database';
export declare class AgencyService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createAgency(data: any): Promise<any>;
    getAgency(id: string): Promise<any>;
    updateAgency(id: string, data: any): Promise<any>;
    deleteAgency(id: string): Promise<void>;
    getAllAgencies(): Promise<any>;
    getAgencyStats(id: string): Promise<any>;
}
//# sourceMappingURL=agency.service.d.ts.map
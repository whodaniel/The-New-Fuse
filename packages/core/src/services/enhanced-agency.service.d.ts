/**
 * Enhanced Agency Service - Integrates Agency Hub functionality with Swarm Orchestration
 * This service extends the existing agency.service.ts with swarm management capabilities
 */
import { PrismaService } from '@the-new-fuse/database';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ServiceCategoryRouterService } from './service-category-router.service';
export declare class EnhancedAgencyService {
    private readonly prisma;
    private readonly eventEmitter;
    private readonly serviceCategoryRouter;
    private readonly logger;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2, serviceCategoryRouter: ServiceCategoryRouterService);
    createAgency(data: any): Promise<any>;
    getAgencyDetails(id: string): Promise<any>;
    updateAgency(id: string, data: any): Promise<any>;
    deleteAgency(id: string): Promise<void>;
    getAnalytics(agencyId: string, timeframe?: string): Promise<any>;
    initializeSwarm(agencyId: string, config?: any): Promise<any>;
    getSwarmStatus(agencyId: string): Promise<any>;
    registerProviders(agencyId: string, providers: any[]): Promise<any>;
    getProviders(agencyId: string, filters?: any): Promise<any>;
}
//# sourceMappingURL=enhanced-agency.service.d.ts.map
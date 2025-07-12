/**
 * Service Category Router
 * Implements intelligent service category routing and provider matching
 * Inspired by the Python Agency Hub/s service-oriented design
 */
import { PrismaService } from '@the-new-fuse/database';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class ServiceCategoryRouterService {
    private readonly prisma;
    private readonly eventEmitter;
    private readonly logger;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    routeServiceRequest(requestId: string, categoryId: string): Promise<any>;
    findBestProvider(categoryId: string, requirements: any): Promise<any>;
    getServiceCategories(): Promise<any>;
    getCategoryMetrics(categoryId: string): Promise<any>;
    getProvidersByCategory(categoryId: string): Promise<any>;
    analyzeServiceQuality(categoryId: string, timeframe?: string): Promise<any>;
    getRecommendedProviders(requestId: string): Promise<any>;
    getRequestsByCategory(categoryId: string, agencyId: string, filters?: any): Promise<any>;
}
//# sourceMappingURL=service-category-router.service.d.ts.map
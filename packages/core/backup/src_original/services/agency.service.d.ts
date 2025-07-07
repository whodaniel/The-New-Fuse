/**
 * Agency Service - Core service for managing multi-tenant agencies
 * Handles agency creation, management, provisioning, and lifecycle operations
 */
import { PrismaService } from /../database/prisma.service;
import { ConfigService } from /@nestjs/config';';
import { AgencyTemplateService } from /./agency-template.';';
import { BillingService } from /../billing/billing.';';
import { CacheService } from /../cache/cache.';';
import { EventEmitter2 } from /@nestjs/event-emitter';';
import { Agency, AgencyTier, AgencySubscription } from /@prisma/client/;
export interface CreateAgencyDto {
    name: string;
    subdomain: string;
    slug?: string;
    adminEmail: string;
    adminName: string;
    adminPassword: string;
    tier?: AgencyTier;
    billingEmail?: string;
    template?: string;
    customDomain?: string;
}
export interface AgencyWithStats extends Agency {
    stats: {
        userCount: number;
        agentCount: number;
        chatCount: number;
        storageUsed: number;
    };
    subscription?: AgencySubscription;
}
export interface AgencyFeatures {
    maxUsers: number;
    maxAgents: number;
    maxStorage: number;
    customBranding: boolean;
    customDomain: boolean;
    whiteLabel: boolean;
    advancedAnalytics: boolean;
    prioritySupport: boolean;
    apiAccess: boolean;
    ssoIntegration: boolean;
}
export declare class AgencyService {
    private readonly prisma;
    private readonly config;
    private readonly templateService;
    private readonly billingService;
    private readonly cacheService;
    private readonly eventEmitter;
    private readonly logger;
    constructor(prisma: PrismaService, config: ConfigService, templateService: AgencyTemplateService, billingService: BillingService, cacheService: CacheService, eventEmitter: EventEmitter2);
    /**
     * Create a new agency with initial setup
     */
    createAgency(data: CreateAgencyDto): Promise<AgencyWithStats>;
    if(data: any, tier: any): any;
}
//# sourceMappingURL=agency.service.d.ts.map
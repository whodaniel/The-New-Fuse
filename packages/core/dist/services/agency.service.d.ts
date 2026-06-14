/**
 * Agency Service - Multi-Tenant Agency Management
 *
 * This service manages "Agencies" which are white-label instances of TNF.
 * Agencies can have their own:
 * - Users (with AGENCY_OWNER, AGENCY_ADMIN, AGENCY_MANAGER roles)
 * - Agents
 * - Workflows
 * - Revenue configurations (via FuseAgencyRegistry on-chain)
 *
 * NOTE: This uses Workspace as the organizational container until the
 * Organization model is migrated from schema.enhanced.drizzle.backup
 */
import { EventEmitter2 } from '@nestjs/event-emitter';
export interface AgencyProfile {
    id: string;
    name: string;
    slug: string;
    description?: string;
    ownerId: string;
    ownerEmail?: string;
    settings: AgencySettings;
    licenseId?: string;
    licenseStatus: 'none' | 'active' | 'expired' | 'sovereign';
    revenueShare: {
        house: number;
        investors: number;
        affiliates: number;
    };
    agentLimit: number;
    userLimit: number;
    stats: {
        totalAgents: number;
        activeAgents: number;
        totalUsers: number;
        activeUsers: number;
        totalWorkflows: number;
    };
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}
export interface AgencySettings {
    branding: {
        primaryColor?: string;
        secondaryColor?: string;
        logoUrl?: string;
        faviconUrl?: string;
        customDomain?: string;
    };
    features: {
        enableAgentMarketplace: boolean;
        enableWorkflowBuilder: boolean;
        enableA2ACommunication: boolean;
        enableBlockchainFeatures: boolean;
    };
    notifications: {
        emailEnabled: boolean;
        slackWebhook?: string;
        discordWebhook?: string;
    };
}
export interface CreateAgencyDto {
    name: string;
    slug: string;
    description?: string;
    ownerId: string;
    settings?: Partial<AgencySettings>;
}
export interface UpdateAgencyDto {
    name?: string;
    description?: string;
    settings?: Partial<AgencySettings>;
    isActive?: boolean;
}
export declare class AgencyService {
    private readonly eventEmitter;
    private readonly logger;
    constructor(eventEmitter: EventEmitter2);
    /**
     * Create a new agency (white-label instance)
     * Uses Workspace model as organizational container
     */
    createAgency(dto: CreateAgencyDto): Promise<AgencyProfile>;
    /**
     * Get agency by ID
     */
    getAgency(agencyId: string): Promise<AgencyProfile>;
    /**
     * Get agency by slug (subdomain)
     */
    getAgencyBySlug(slug: string): Promise<AgencyProfile>;
    /**
     * Update agency configuration
     */
    updateAgency(agencyId: string, dto: UpdateAgencyDto): Promise<AgencyProfile>;
    /**
     * Delete an agency
     */
    deleteAgency(agencyId: string): Promise<void>;
    /**
     * List all agencies for an owner
     */
    listAgenciesForOwner(ownerId: string): Promise<AgencyProfile[]>;
    /**
     * List all agencies (admin only)
     */
    listAllAgencies(): Promise<AgencyProfile[]>;
    /**
     * Get agency statistics
     */
    getAgencyStats(agencyId: string): Promise<AgencyProfile['stats']>;
    /**
     * Update agency license (from blockchain event)
     */
    updateAgencyLicense(agencyId: string, licenseId: string, status: 'active' | 'expired' | 'sovereign'): Promise<AgencyProfile>;
    private parseWorkspaceDescription;
    private workspaceToAgencyProfile;
}
//# sourceMappingURL=agency.service.d.ts.map
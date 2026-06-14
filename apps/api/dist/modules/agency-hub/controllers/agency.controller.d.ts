/**
 * Agency Controller
 *
 * REST API endpoints for agency (white-label instance) management.
 * Integrates with the local AgencyService.
 */
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@the-new-fuse/database';
import { AgentSwarmOrchestrationService } from '../services/agent-swarm-orchestration.service';
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
declare class CreateAgencyApiDto {
    name: string;
    slug: string;
    description?: string;
}
declare class UpdateAgencyApiDto {
    name?: string;
    description?: string;
    settings?: {
        branding?: {
            primaryColor?: string;
            secondaryColor?: string;
            logoUrl?: string;
        };
        features?: {
            enableAgentMarketplace?: boolean;
            enableWorkflowBuilder?: boolean;
            enableA2ACommunication?: boolean;
        };
    };
    isActive?: boolean;
}
declare class InitializeSwarmDto {
    maxConcurrentExecutions?: number;
    enableAutoScaling?: boolean;
}
declare class RegisterProvidersDto {
    providers: Array<{
        name: string;
        type: 'llm' | 'tool' | 'integration' | 'custom';
        endpoint?: string;
        capabilities: string[];
        isActive: boolean;
    }>;
}
export declare class AgencyController {
    private readonly db;
    private readonly eventEmitter;
    private readonly swarmService;
    private readonly logger;
    private readonly agencyService;
    constructor(db: DatabaseService, eventEmitter: EventEmitter2, swarmService: AgentSwarmOrchestrationService);
    createAgency(dto: CreateAgencyApiDto, ownerId: string): Promise<AgencyProfile>;
    listAgencies(ownerId: string): Promise<AgencyProfile[]>;
    getAgency(agencyId: string): Promise<AgencyProfile>;
    updateAgency(agencyId: string, dto: UpdateAgencyApiDto): Promise<AgencyProfile>;
    deleteAgency(agencyId: string): Promise<{
        message: string;
    }>;
    initializeSwarm(agencyId: string, config?: InitializeSwarmDto): Promise<{
        success: boolean;
        agencyId: string;
        message: string;
        swarmStatus?: any;
    }>;
    getSwarmStatus(agencyId: string): Promise<{
        agencyId: string;
        swarmEnabled: boolean;
        status: any;
    }>;
    registerProviders(agencyId: string, dto: RegisterProvidersDto): Promise<{
        success: boolean;
        registered: number;
        providers: any[];
    }>;
    getProviders(agencyId: string, type?: string, active?: string): Promise<{
        agencyId: string;
        providers: any[];
    }>;
    getAnalytics(agencyId: string, user: any, timeframe?: string): Promise<{
        agencyId: string;
        period: string;
        agents: any;
        tasks: any;
        swarm: any;
    }>;
    getStats(agencyId: string): Promise<{
        agencyId: string;
        stats: AgencyProfile['stats'];
    }>;
    private getDateFromTimeframe;
}
export {};
//# sourceMappingURL=agency.controller.d.ts.map
/**
 * Enhanced Agency Service
 *
 * Extends AgencyService with orchestration capabilities:
 * - Swarm initialization and management
 * - A2A message brokering
 * - Analytics aggregation
 * - Provider registration
 *
 * This service acts as a facade that coordinates between:
 * - AgencyService (multi-tenant management)
 * - AgentSwarmOrchestrationService (swarm coordination)
 * - A2A communication layer
 */
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AgencyService, AgencyProfile, CreateAgencyDto, UpdateAgencyDto } from './agency.service.js';
import { AgentSwarmOrchestrationService } from '../agents/AgentSwarmOrchestrationService.js';
export interface AgencyAnalytics {
    agencyId: string;
    period: string;
    agents: {
        total: number;
        active: number;
        byType: Record<string, number>;
    };
    tasks: {
        total: number;
        completed: number;
        failed: number;
        averageDurationMs: number;
    };
    swarm: {
        enabled: boolean;
        activeExecutions: number;
        completedExecutions: number;
        agentUtilization: Record<string, number>;
    };
    revenue?: {
        total: number;
        byStream: Record<string, number>;
    };
}
export interface SwarmInitializationResult {
    success: boolean;
    agencyId: string;
    swarmEnabled: boolean;
    registeredAgents: number;
    message: string;
}
export interface ProviderRegistration {
    id: string;
    name: string;
    type: 'llm' | 'tool' | 'integration' | 'custom';
    endpoint?: string;
    capabilities: string[];
    isActive: boolean;
}
export declare class EnhancedAgencyService {
    private readonly eventEmitter;
    private readonly agencyService;
    private readonly swarmService;
    private readonly logger;
    private providers;
    constructor(eventEmitter: EventEmitter2, agencyService: AgencyService, swarmService: AgentSwarmOrchestrationService);
    createAgency(dto: CreateAgencyDto): Promise<AgencyProfile>;
    getAgencyDetails(agencyId: string): Promise<AgencyProfile>;
    updateAgency(agencyId: string, dto: UpdateAgencyDto): Promise<AgencyProfile>;
    deleteAgency(agencyId: string): Promise<void>;
    /**
     * Initialize swarm orchestration for an agency
     */
    initializeSwarm(agencyId: string, config?: {
        maxConcurrentExecutions?: number;
        enableAutoScaling?: boolean;
    }): Promise<SwarmInitializationResult>;
    /**
     * Disable swarm orchestration for an agency
     */
    disableSwarm(agencyId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Get swarm status for an agency
     */
    getSwarmStatus(agencyId: string): Promise<{
        agencyId: string;
        swarmEnabled: boolean;
        totalAgents: number;
        onlineAgents: number;
        busyAgents: number;
        activeExecutions: number;
        health: 'healthy' | 'degraded' | 'offline';
    }>;
    /**
     * Register service providers for an agency
     */
    registerProviders(agencyId: string, providers: Omit<ProviderRegistration, 'id'>[]): Promise<{
        success: boolean;
        registered: ProviderRegistration[];
    }>;
    /**
     * Get providers for an agency
     */
    getProviders(agencyId: string, filters?: {
        type?: ProviderRegistration['type'];
        active?: boolean;
    }): Promise<ProviderRegistration[]>;
    /**
     * Get analytics for an agency
     */
    getAnalytics(agencyId: string, timeframe?: string): Promise<AgencyAnalytics>;
    private getDateFromTimeframe;
}
//# sourceMappingURL=enhanced-agency.service.d.ts.map
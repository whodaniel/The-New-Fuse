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

import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { drizzleAgentRepository, drizzleTaskRepository } // @ts-ignore
from '@the-new-fuse/database';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AgencyService, AgencyProfile, CreateAgencyDto, UpdateAgencyDto } from './agency.service';
import { AgentSwarmOrchestrationService } from '../agents/AgentSwarmOrchestrationService';

// Analytics types
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

@Injectable()
export class EnhancedAgencyService {
  private readonly logger = new Logger(EnhancedAgencyService.name);

  // In-memory provider registry (would be persisted in production)
  private providers = new Map<string, ProviderRegistration[]>();

  constructor(
    // private readonly drizzle: DrizzleService, // removed
    private readonly eventEmitter: EventEmitter2,
    private readonly agencyService: AgencyService,
    @Inject(forwardRef(() => AgentSwarmOrchestrationService))
    private readonly swarmService: AgentSwarmOrchestrationService,
  ) {}

  // ==========================================================================
  // Agency CRUD - Delegates to AgencyService
  // ==========================================================================

  async createAgency(dto: CreateAgencyDto): Promise<AgencyProfile> {
    const agency = await this.agencyService.createAgency(dto);

    // Initialize swarm orchestration for the new agency
    if (agency.settings.features.enableA2ACommunication) {
      await this.initializeSwarm(agency.id);
    }

    return agency;
  }

  async getAgencyDetails(agencyId: string): Promise<AgencyProfile> {
    return this.agencyService.getAgency(agencyId);
  }

  async updateAgency(agencyId: string, dto: UpdateAgencyDto): Promise<AgencyProfile> {
    return this.agencyService.updateAgency(agencyId, dto);
  }

  async deleteAgency(agencyId: string): Promise<void> {
    // Disable swarm before deletion
    await this.disableSwarm(agencyId);
    await this.agencyService.deleteAgency(agencyId);
  }

  // ==========================================================================
  // Swarm Orchestration
  // ==========================================================================

  /**
   * Initialize swarm orchestration for an agency
   */
  async initializeSwarm(
    agencyId: string,
    config?: {
      maxConcurrentExecutions?: number;
      enableAutoScaling?: boolean;
    },
  ): Promise<SwarmInitializationResult> {
    this.logger.log(`Initializing swarm for agency: ${agencyId}`);

    try {
      // Verify agency exists
      const agency = await this.agencyService.getAgency(agencyId);

      // Initialize via swarm service
      await this.swarmService.initializeSwarm();

      // Get current status
      const status = await this.swarmService.getSwarmStatus();

      this.eventEmitter.emit('agency.swarm.initialized', { agencyId, status });

      return {
        success: true,
        agencyId,
        swarmEnabled: true,
        registeredAgents: status.onlineAgents,
        message: `Swarm initialized for ${agency.name}. ${status.totalAgents} agents registered.`,
      };
    } catch (error) {
      this.logger.error(`Failed to initialize swarm for ${agencyId}: ${(error as Error).message}`);
      return {
        success: false,
        agencyId,
        swarmEnabled: false,
        registeredAgents: 0,
        message: `Failed to initialize swarm: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Disable swarm orchestration for an agency
   */
  async disableSwarm(agencyId: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Disabling swarm for agency: ${agencyId}`);

    try {
      // In production, would terminate all executions for this agency
      this.eventEmitter.emit('agency.swarm.disabled', { agencyId });

      return {
        success: true,
        message: `Swarm disabled for agency ${agencyId}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to disable swarm: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Get swarm status for an agency
   */
  async getSwarmStatus(agencyId: string): Promise<{
    agencyId: string;
    swarmEnabled: boolean;
    totalAgents: number;
    onlineAgents: number;
    busyAgents: number;
    activeExecutions: number;
    health: 'healthy' | 'degraded' | 'offline';
  }> {
    try {
      const status = await this.swarmService.getSwarmStatus();

      return {
        agencyId,
        swarmEnabled: true,
        totalAgents: status.totalAgents,
        onlineAgents: status.onlineAgents,
        busyAgents: status.busyAgents,
        activeExecutions: status.activeExecutions,
        health: status.onlineAgents > 0 ? 'healthy' : 'offline',
      };
    } catch {
      return {
        agencyId,
        swarmEnabled: false,
        totalAgents: 0,
        onlineAgents: 0,
        busyAgents: 0,
        activeExecutions: 0,
        health: 'offline',
      };
    }
  }

  // ==========================================================================
  // Provider Management
  // ==========================================================================

  /**
   * Register service providers for an agency
   */
  async registerProviders(
    agencyId: string,
    providers: Omit<ProviderRegistration, 'id'>[],
  ): Promise<{
    success: boolean;
    registered: ProviderRegistration[];
  }> {
    this.logger.log(`Registering ${providers.length} providers for agency: ${agencyId}`);

    // Verify agency exists
    await this.agencyService.getAgency(agencyId);

    const registered: ProviderRegistration[] = providers.map((p, idx) => ({
      ...p,
      id: `${agencyId}_provider_${Date.now()}_${idx}`,
    }));

    // Store providers
    const existing = this.providers.get(agencyId) || [];
    this.providers.set(agencyId, [...existing, ...registered]);

    this.eventEmitter.emit('agency.providers.registered', { agencyId, providers: registered });

    return {
      success: true,
      registered,
    };
  }

  /**
   * Get providers for an agency
   */
  async getProviders(
    agencyId: string,
    filters?: {
      type?: ProviderRegistration['type'];
      active?: boolean;
    },
  ): Promise<ProviderRegistration[]> {
    const allProviders = this.providers.get(agencyId) || [];

    let filtered = allProviders;

    if (filters?.type) {
      filtered = filtered.filter((p) => p.type === filters.type);
    }

    if (filters?.active !== undefined) {
      filtered = filtered.filter((p) => p.isActive === filters.active);
    }

    return filtered;
  }

  // ==========================================================================
  // Analytics
  // ==========================================================================

  /**
   * Get analytics for an agency
   */
  async getAnalytics(agencyId: string, timeframe: string = '30d'): Promise<AgencyAnalytics> {
    this.logger.log(`Getting analytics for agency: ${agencyId}, timeframe: ${timeframe}`);

    const agency = await this.agencyService.getAgency(agencyId);
    const swarmStatus = await this.getSwarmStatus(agencyId);

    // Get agents for this agency (filtered by owner/tenant)
    const agents = await drizzleAgentRepository.findAll(agency.ownerId, 100);

    // Get tasks (filtered by owner/tenant)
    const tasks = await drizzleTaskRepository.findTasksCreatedAfter(
      this.getDateFromTimeframe(timeframe),
      agency.ownerId,
    );

    const completedTasks = tasks.filter((t: any) => t.status === 'COMPLETED');
    const failedTasks = tasks.filter((t: any) => t.status === 'FAILED');

    // Calculate average duration
    const tasksWithDuration = tasks.filter((t: any) => t.startTime && t.endTime);
    const avgDuration =
      tasksWithDuration.length > 0
        ? tasksWithDuration.reduce((sum: number, t: any) => {
            const duration = new Date(t.endTime!).getTime() - new Date(t.startTime!).getTime();
            return sum + duration;
          }, 0) / tasksWithDuration.length
        : 0;

    // Aggregate agent types
    const byType: Record<string, number> = {};
    agents.forEach((a: any) => {
      byType[a.type] = (byType[a.type] || 0) + 1;
    });

    return {
      agencyId,
      period: timeframe,
      agents: {
        total: agents.length,
        active: agents.filter((a: any) => a.status === 'ACTIVE').length,
        byType,
      },
      tasks: {
        total: tasks.length,
        completed: completedTasks.length,
        failed: failedTasks.length,
        averageDurationMs: avgDuration,
      },
      swarm: {
        enabled: swarmStatus.swarmEnabled,
        activeExecutions: swarmStatus.activeExecutions,
        completedExecutions: 0, // Would track historically
        agentUtilization: {},
      },
    };
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  private getDateFromTimeframe(timeframe: string): Date {
    const now = new Date();
    const match = timeframe.match(/^(\d+)([dhwmy])$/);

    if (!match) {
      // Default to 30 days
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const amount = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'd':
        return new Date(now.getTime() - amount * 24 * 60 * 60 * 1000);
      case 'h':
        return new Date(now.getTime() - amount * 60 * 60 * 1000);
      case 'w':
        return new Date(now.getTime() - amount * 7 * 24 * 60 * 60 * 1000);
      case 'm':
        return new Date(now.getTime() - amount * 30 * 24 * 60 * 60 * 1000);
      case 'y':
        return new Date(now.getTime() - amount * 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}

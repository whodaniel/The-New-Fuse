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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EnhancedAgencyService_1;
import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { drizzleAgentRepository, drizzleTaskRepository } from '@the-new-fuse/database';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AgencyService } from './agency.service.js';
import { AgentSwarmOrchestrationService } from '../agents/AgentSwarmOrchestrationService.js';
let EnhancedAgencyService = EnhancedAgencyService_1 = class EnhancedAgencyService {
    constructor(
    // private readonly drizzle: DrizzleService, // removed
    eventEmitter, agencyService, swarmService) {
        this.eventEmitter = eventEmitter;
        this.agencyService = agencyService;
        this.swarmService = swarmService;
        this.logger = new Logger(EnhancedAgencyService_1.name);
        // In-memory provider registry (would be persisted in production)
        this.providers = new Map();
    }
    // ==========================================================================
    // Agency CRUD - Delegates to AgencyService
    // ==========================================================================
    async createAgency(dto) {
        const agency = await this.agencyService.createAgency(dto);
        // Initialize swarm orchestration for the new agency
        if (agency.settings.features.enableA2ACommunication) {
            await this.initializeSwarm(agency.id);
        }
        return agency;
    }
    async getAgencyDetails(agencyId) {
        return this.agencyService.getAgency(agencyId);
    }
    async updateAgency(agencyId, dto) {
        return this.agencyService.updateAgency(agencyId, dto);
    }
    async deleteAgency(agencyId) {
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
    async initializeSwarm(agencyId, config) {
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
        }
        catch (error) {
            this.logger.error(`Failed to initialize swarm for ${agencyId}: ${error.message}`);
            return {
                success: false,
                agencyId,
                swarmEnabled: false,
                registeredAgents: 0,
                message: `Failed to initialize swarm: ${error.message}`,
            };
        }
    }
    /**
     * Disable swarm orchestration for an agency
     */
    async disableSwarm(agencyId) {
        this.logger.log(`Disabling swarm for agency: ${agencyId}`);
        try {
            // In production, would terminate all executions for this agency
            this.eventEmitter.emit('agency.swarm.disabled', { agencyId });
            return {
                success: true,
                message: `Swarm disabled for agency ${agencyId}`,
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to disable swarm: ${error.message}`,
            };
        }
    }
    /**
     * Get swarm status for an agency
     */
    async getSwarmStatus(agencyId) {
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
        }
        catch {
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
    async registerProviders(agencyId, providers) {
        this.logger.log(`Registering ${providers.length} providers for agency: ${agencyId}`);
        // Verify agency exists
        await this.agencyService.getAgency(agencyId);
        const registered = providers.map((p, idx) => ({
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
    async getProviders(agencyId, filters) {
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
    async getAnalytics(agencyId, timeframe = '30d') {
        this.logger.log(`Getting analytics for agency: ${agencyId}, timeframe: ${timeframe}`);
        const agency = await this.agencyService.getAgency(agencyId);
        const swarmStatus = await this.getSwarmStatus(agencyId);
        // Get agents for this agency (filtered by owner/tenant)
        const agents = await drizzleAgentRepository.findAll(agency.ownerId, 100);
        // Get tasks (filtered by owner/tenant)
        const tasks = await drizzleTaskRepository.findTasksCreatedAfter(this.getDateFromTimeframe(timeframe), agency.ownerId);
        const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
        const failedTasks = tasks.filter((t) => t.status === 'FAILED');
        // Calculate average duration
        const tasksWithDuration = tasks.filter((t) => t.startTime && t.endTime);
        const avgDuration = tasksWithDuration.length > 0
            ? tasksWithDuration.reduce((sum, t) => {
                const duration = new Date(t.endTime).getTime() - new Date(t.startTime).getTime();
                return sum + duration;
            }, 0) / tasksWithDuration.length
            : 0;
        // Aggregate agent types
        const byType = {};
        agents.forEach((a) => {
            byType[a.type] = (byType[a.type] || 0) + 1;
        });
        return {
            agencyId,
            period: timeframe,
            agents: {
                total: agents.length,
                active: agents.filter((a) => a.status === 'ACTIVE').length,
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
    getDateFromTimeframe(timeframe) {
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
};
EnhancedAgencyService = EnhancedAgencyService_1 = __decorate([
    Injectable(),
    __param(2, Inject(forwardRef(() => AgentSwarmOrchestrationService))),
    __metadata("design:paramtypes", [EventEmitter2,
        AgencyService,
        AgentSwarmOrchestrationService])
], EnhancedAgencyService);
export { EnhancedAgencyService };
//# sourceMappingURL=enhanced-agency.service.js.map
"use strict";
// @ts-nocheck
/**
 * Agency Controller
 *
 * REST API endpoints for agency (white-label instance) management.
 * Integrates with the local AgencyService.
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
var AgencyController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgencyController = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const swagger_1 = require("@nestjs/swagger");
// @ts-ignore
const database_1 = require("@the-new-fuse/database");
const current_user_decorator_1 = require("../../../auth/decorators/current-user.decorator");
// Local services
const agent_swarm_orchestration_service_1 = require("../services/agent-swarm-orchestration.service");
const DEFAULT_SETTINGS = {
    branding: {},
    features: {
        enableAgentMarketplace: true,
        enableWorkflowBuilder: true,
        enableA2ACommunication: true,
        enableBlockchainFeatures: false,
    },
    notifications: {
        emailEnabled: true,
    },
};
// ============================================================================
// LOCAL AGENCY SERVICE (inline implementation)
// ============================================================================
class AgencyServiceLocal {
    constructor(db, eventEmitter) {
        this.db = db;
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(AgencyServiceLocal.name);
    }
    async createAgency(dto) {
        this.logger.log(`Creating agency: ${dto.name} (${dto.slug})`);
        if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(dto.slug) && dto.slug.length > 2) {
            throw new common_1.BadRequestException('Slug must be lowercase alphanumeric with optional hyphens');
        }
        const existingWorkspace = await this.db.workspaces.findByName(dto.slug);
        if (existingWorkspace) {
            throw new common_1.BadRequestException(`Agency slug "${dto.slug}" is already taken`);
        }
        const workspace = await this.db.workspaces.create({
            name: dto.slug,
            description: JSON.stringify({
                displayName: dto.name,
                description: dto.description,
                type: 'AGENCY',
                settings: { ...DEFAULT_SETTINGS, ...dto.settings },
                licenseId: null,
                licenseStatus: 'none',
                revenueShare: { house: 60, investors: 30, affiliates: 10 },
                agentLimit: 5,
                userLimit: 10,
            }),
            ownerId: dto.ownerId,
        });
        this.eventEmitter.emit('agency.created', { agencyId: workspace.id, slug: dto.slug });
        return this.workspaceToAgencyProfile(workspace);
    }
    async getAgency(agencyId) {
        const workspace = await this.db.workspaces.findByIdWithOwner(agencyId);
        if (!workspace)
            throw new common_1.NotFoundException(`Agency not found: ${agencyId}`);
        return this.workspaceToAgencyProfile(workspace);
    }
    async getAgencyBySlug(slug) {
        const workspace = await this.db.workspaces.findByNameWithOwner(slug);
        if (!workspace)
            throw new common_1.NotFoundException(`Agency not found: ${slug}`);
        return this.workspaceToAgencyProfile(workspace);
    }
    async updateAgency(agencyId, dto) {
        const existing = await this.getAgency(agencyId);
        const parsedDesc = this.parseWorkspaceDescription(existing);
        const updatedDescription = {
            ...parsedDesc,
            ...(dto.name && { displayName: dto.name }),
            ...(dto.description && { description: dto.description }),
            ...(dto.settings && { settings: { ...existing.settings, ...dto.settings } }),
            ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        };
        const workspace = await this.db.workspaces.update(agencyId, {
            description: JSON.stringify(updatedDescription),
        });
        if (!workspace)
            throw new common_1.NotFoundException(`Agency not found: ${agencyId}`);
        // Drizzle update returns the record, need to fetch owner info separately or mock it if we trust the update
        // For consistency with getAgency, let's fetch it again properly
        const fullWorkspace = await this.db.workspaces.findByIdWithOwner(agencyId);
        if (!fullWorkspace)
            throw new common_1.NotFoundException(`Agency not found after update: ${agencyId}`);
        this.eventEmitter.emit('agency.updated', { agencyId, changes: dto });
        return this.workspaceToAgencyProfile(fullWorkspace);
    }
    async deleteAgency(agencyId) {
        const agency = await this.getAgency(agencyId);
        await this.db.workspaces.delete(agencyId);
        this.eventEmitter.emit('agency.deleted', { agencyId, slug: agency.slug });
    }
    async listAgenciesForOwner(ownerId) {
        const workspaces = await this.db.workspaces.findByOwnerWithOwner(ownerId);
        return workspaces
            .filter((w) => {
            try {
                const desc = JSON.parse(w.description || '{}');
                return desc.type === 'AGENCY';
            }
            catch {
                return false;
            }
        })
            .map((w) => this.workspaceToAgencyProfile(w));
    }
    async getAgencyStats(agencyId) {
        const agency = await this.getAgency(agencyId);
        return agency.stats;
    }
    parseWorkspaceDescription(workspace) {
        try {
            if (typeof workspace === 'string')
                return JSON.parse(workspace);
            if (workspace.description)
                return JSON.parse(workspace.description);
            return {};
        }
        catch {
            return {};
        }
    }
    workspaceToAgencyProfile(workspace) {
        const desc = this.parseWorkspaceDescription(workspace);
        return {
            id: workspace.id,
            name: desc.displayName || workspace.name,
            slug: workspace.name,
            description: desc.description,
            ownerId: workspace.ownerId,
            ownerEmail: workspace.owner?.email,
            settings: desc.settings || DEFAULT_SETTINGS,
            licenseId: desc.licenseId,
            licenseStatus: desc.licenseStatus || 'none',
            revenueShare: desc.revenueShare || { house: 60, investors: 30, affiliates: 10 },
            agentLimit: desc.agentLimit || 5,
            userLimit: desc.userLimit || 10,
            stats: {
                totalAgents: 0,
                activeAgents: 0,
                totalUsers: 1,
                activeUsers: 1,
                totalWorkflows: workspace.projects?.length || 0,
            },
            createdAt: workspace.createdAt,
            updatedAt: workspace.updatedAt,
            isActive: desc.isActive !== false,
        };
    }
}
// ============================================================================
// API DTOs
// ============================================================================
class CreateAgencyApiDto {
}
class UpdateAgencyApiDto {
}
class InitializeSwarmDto {
}
class RegisterProvidersDto {
}
// ============================================================================
// CONTROLLER
// ============================================================================
let AgencyController = AgencyController_1 = class AgencyController {
    constructor(db, eventEmitter, swarmService) {
        this.db = db;
        this.eventEmitter = eventEmitter;
        this.swarmService = swarmService;
        this.logger = new common_1.Logger(AgencyController_1.name);
        this.agencyService = new AgencyServiceLocal(db, eventEmitter);
    }
    async createAgency(dto, ownerId) {
        try {
            if (!ownerId) {
                throw new common_1.HttpException('Owner ID is required', common_1.HttpStatus.BAD_REQUEST);
            }
            const createDto = {
                name: dto.name,
                slug: dto.slug,
                description: dto.description,
                ownerId,
            };
            const agency = await this.agencyService.createAgency(createDto);
            this.logger.log(`Agency created: ${agency.id} (${agency.slug})`);
            return agency;
        }
        catch (error) {
            this.logger.error(`Failed to create agency: ${error.message}`);
            throw new common_1.HttpException(error.message || 'Failed to create agency', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async listAgencies(ownerId) {
        try {
            if (!ownerId) {
                throw new common_1.HttpException('Owner ID is required', common_1.HttpStatus.BAD_REQUEST);
            }
            return await this.agencyService.listAgenciesForOwner(ownerId);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to list agencies', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAgency(agencyId) {
        try {
            // Try ID first, then slug
            try {
                return await this.agencyService.getAgency(agencyId);
            }
            catch {
                return await this.agencyService.getAgencyBySlug(agencyId);
            }
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Agency not found', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async updateAgency(agencyId, dto) {
        try {
            const updateDto = {
                name: dto.name,
                description: dto.description,
                settings: dto.settings,
                isActive: dto.isActive,
            };
            return await this.agencyService.updateAgency(agencyId, updateDto);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to update agency', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async deleteAgency(agencyId) {
        try {
            await this.agencyService.deleteAgency(agencyId);
            return { message: `Agency ${agencyId} deleted successfully` };
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to delete agency', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    // ==========================================================================
    // Swarm Orchestration Endpoints
    // ==========================================================================
    async initializeSwarm(agencyId, config) {
        try {
            // Verify agency exists
            await this.agencyService.getAgency(agencyId);
            // Initialize swarm for this agency
            await this.swarmService.initializeAgencySwarm(agencyId);
            const result = await this.swarmService.initializeSwarm();
            const status = await this.swarmService.getSwarmStatus(agencyId);
            this.logger.log(`Swarm initialized for agency ${agencyId}`);
            return {
                success: true,
                agencyId,
                message: result.message,
                swarmStatus: status,
            };
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to initialize swarm', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getSwarmStatus(agencyId) {
        try {
            // Verify agency exists
            await this.agencyService.getAgency(agencyId);
            const status = await this.swarmService.getSwarmStatus(agencyId);
            return {
                agencyId,
                swarmEnabled: status.isSwarmEnabled,
                status,
            };
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to get swarm status', common_1.HttpStatus.NOT_FOUND);
        }
    }
    // ==========================================================================
    // Provider Management Endpoints
    // ==========================================================================
    async registerProviders(agencyId, dto) {
        try {
            // Verify agency exists
            await this.agencyService.getAgency(agencyId);
            // In production, would persist these providers
            const registered = dto.providers.map((p, idx) => ({
                id: `${agencyId}_provider_${Date.now()}_${idx}`,
                ...p,
            }));
            this.logger.log(`Registered ${registered.length} providers for agency ${agencyId}`);
            return {
                success: true,
                registered: registered.length,
                providers: registered,
            };
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to register providers', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getProviders(agencyId, type, active) {
        try {
            // Verify agency exists
            await this.agencyService.getAgency(agencyId);
            // In production, would fetch from database
            // For now, return empty array - providers are ephemeral
            return {
                agencyId,
                providers: [],
            };
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to get providers', common_1.HttpStatus.NOT_FOUND);
        }
    }
    // ==========================================================================
    // Analytics Endpoints
    // ==========================================================================
    async getAnalytics(agencyId, user, timeframe = '30d') {
        try {
            const agency = await this.agencyService.getAgency(agencyId);
            const swarmStatus = await this.swarmService.getSwarmStatus(agencyId);
            // Get date range
            const now = new Date();
            const startDate = this.getDateFromTimeframe(timeframe, now);
            // Fetch analytics data using Drizzle
            const agents = await this.db.agents.findAll(user.id, 100);
            // Tasks filtering
            const tasks = await this.db.tasks.findTasksCreatedAfter(startDate, user.id);
            const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
            const failedTasks = tasks.filter((t) => t.status === 'FAILED');
            const byType = {};
            agents.forEach((a) => {
                const type = a.type || 'unknown';
                byType[type] = (byType[type] || 0) + 1;
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
                    successRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
                },
                swarm: {
                    enabled: swarmStatus.isSwarmEnabled,
                    totalAgents: swarmStatus.totalProviders,
                    onlineAgents: swarmStatus.activeProviders,
                    activeExecutions: swarmStatus.activeExecutions,
                },
            };
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to get analytics', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async getStats(agencyId) {
        try {
            const stats = await this.agencyService.getAgencyStats(agencyId);
            return { agencyId, stats };
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to get stats', common_1.HttpStatus.NOT_FOUND);
        }
    }
    // ==========================================================================
    // Helper Methods
    // ==========================================================================
    getDateFromTimeframe(timeframe, now) {
        const match = timeframe.match(/^(\d+)([dhwmy])$/);
        if (!match) {
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
exports.AgencyController = AgencyController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new agency (white-label instance)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Agency created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input or slug already taken' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('ownerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateAgencyApiDto, String]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "createAgency", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List agencies for the authenticated user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agencies retrieved' }),
    (0, swagger_1.ApiQuery)({ name: 'ownerId', required: true, description: 'Owner user ID' }),
    __param(0, (0, common_1.Query)('ownerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "listAgencies", null);
__decorate([
    (0, common_1.Get)(':agencyId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get agency details with status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agency details retrieved' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Agency not found' }),
    (0, swagger_1.ApiParam)({ name: 'agencyId', description: 'Agency UUID or slug' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "getAgency", null);
__decorate([
    (0, common_1.Put)(':agencyId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update agency configuration' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agency updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Agency not found' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateAgencyApiDto]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "updateAgency", null);
__decorate([
    (0, common_1.Delete)(':agencyId'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an agency' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Agency deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Agency not found' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "deleteAgency", null);
__decorate([
    (0, common_1.Post)(':agencyId/swarm/initialize'),
    (0, swagger_1.ApiOperation)({ summary: 'Initialize swarm orchestration for agency' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Swarm initialized successfully' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, InitializeSwarmDto]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "initializeSwarm", null);
__decorate([
    (0, common_1.Get)(':agencyId/swarm/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current swarm status for agency' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Swarm status retrieved' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "getSwarmStatus", null);
__decorate([
    (0, common_1.Post)(':agencyId/providers/register'),
    (0, swagger_1.ApiOperation)({ summary: 'Register service providers for agency' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Providers registered successfully' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, RegisterProvidersDto]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "registerProviders", null);
__decorate([
    (0, common_1.Get)(':agencyId/providers'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all service providers for agency' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Providers retrieved successfully' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('active')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "getProviders", null);
__decorate([
    (0, common_1.Get)(':agencyId/analytics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get agency performance analytics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Analytics retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'timeframe', required: false, description: 'Timeframe (e.g., 7d, 30d, 90d)' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('timeframe')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)(':agencyId/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get quick agency statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Stats retrieved successfully' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "getStats", null);
exports.AgencyController = AgencyController = AgencyController_1 = __decorate([
    (0, swagger_1.ApiTags)('agencies'),
    (0, common_1.Controller)('agencies'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [database_1.DatabaseService,
        event_emitter_1.EventEmitter2,
        agent_swarm_orchestration_service_1.AgentSwarmOrchestrationService])
], AgencyController);
//# sourceMappingURL=agency.controller.js.map
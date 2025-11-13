/**
 * Agent controller implementation
 * Provides standardized REST API endpoints for agent operations
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
var AgentController_1;
var _a, _b, _c, _d, _e;
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { AgentService } from '../services/agent.service';
import { BaseController } from './base.controller';
// import { JwtAuthGuard } from '../guards/jwt-auth.guard'; // Replaced by ServiceOrUserAuthGuard
import { ServiceOrUserAuthGuard } from '../auth/guards/service-or-user-auth.guard'; // Import the new guard
import { CurrentUser } from '../decorators/current-user.decorator';
import { AgentStatus } from '@the-new-fuse/types';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
let AgentController = AgentController_1 = class AgentController extends BaseController {
    agentService;
    constructor(agentService) {
        super(AgentController_1.name);
        this.agentService = agentService;
    }
    /**
     * Create a new agent
     * @param data Agent creation data
     * @param user Current user
     * @returns Created agent
     */
    async createAgent(data, user // Mark user as potentially undefined
    ) {
        // Service calls (API Key) won't have a user.id.
        // We need a way to represent the owner or context for service-created agents.
        // Option 1: Allow null/undefined userId for service calls (requires service changes)
        // Option 2: Define a system user ID for service calls
        // Option 3: Disallow agent creation via API key for now?
        // For now, let's assume the service needs adjustment or we throw if no user.
        if (!user?.id && !data.ownerId) { // Check if ownerId is provided in DTO as alternative
            this.logger.error('Agent creation requires a user context or an explicit ownerId for service calls.');
            throw new Error('Cannot create agent without user context or ownerId.');
        }
        const ownerId = user?.id || data.ownerId; // Prefer user.id, fallback to DTO field if needed
        return this.handleAsync(() => this.agentService.createAgent(data, ownerId), // Pass resolved ownerId
        'Failed to create agent');
    }
    /**
     * Get all agents for the current user
     * @param user Current user
     * @param capability Optional capability filter
     * @returns Array of agents
     */
    async getAgents(user, capability, status, type, name // Allow filtering by name
    ) {
        // Service calls might want to find agents without a specific user context,
        // e.g., find all agents of a certain type or status.
        // We need to decide if GET /agents requires a user context for service calls.
        // Option 1: Allow service calls to list all agents (potentially dangerous)
        // Option 2: Require filters (like type/status) for service calls without user context
        // Option 3: Disallow listing without user context for now.
        // Let's assume for now service calls can list agents but might need filters.
        // The service layer needs to handle the case where userId is undefined.
        const userId = user?.id; // Pass undefined if no user
        const filters = { capability, status, type, name }; // Pass filters to service
        return this.handleAsync(() => this.agentService.findAgents(filters, userId), // Modify service method signature if needed
        'Failed to get agents');
    }
    /**
     * Get active agents for the current user
     * @param user Current user
     * @returns Array of active agents
     */
    // This endpoint seems user-specific, might not make sense for service calls?
    // Or maybe it means active agents the service *owns* or *manages*?
    // Let's keep it user-focused for now and potentially add a different endpoint for services if needed.
    async getActiveAgents(user // Keep requiring user for this specific endpoint
    ) {
        if (!user?.id) {
            throw new Error('Cannot get active agents without user context.');
        }
        return this.handleAsync(() => this.agentService.getActiveAgents(user.id), 'Failed to get active agents');
    }
    /**
     * Get agent by ID
     * @param id Agent ID
     * @param user Current user
     * @returns Agent
     */
    async getAgentById(id, user // Mark user as potentially undefined
    ) {
        // Service calls should be able to get any agent by ID, regardless of user.
        // The service layer needs to handle the case where userId is undefined.
        const userId = user?.id; // Pass undefined if no user
        return this.handleAsync(() => this.agentService.getAgentById(id, userId), // Modify service method signature if needed
        'Failed to get agent');
    }
    /**
     * Update an agent
     * @param id Agent ID
     * @param updates Agent update data
     * @param user Current user
     * @returns Updated agent
     */
    async updateAgent(id, updates, user // Mark user as potentially undefined
    ) {
        // Service calls should be able to update agents they manage.
        // How do we authorize this?
        // Option 1: Allow service calls to update *any* agent (dangerous).
        // Option 2: Service layer checks if the agent is 'owned' by the service (how?).
        // Option 3: Rely on user context for updates for now.
        // Let's assume the service layer needs to handle authorization based on context (user or service).
        const userId = user?.id; // Pass undefined if no user
        return this.handleAsync(() => this.agentService.updateAgent(id, updates, userId), // Modify service method signature if needed
        'Failed to update agent');
    }
    /**
     * Update agent status
     * @param id Agent ID
     * @param status New agent status
     * @param user Current user
     * @returns Updated agent
     */
    async updateAgentStatus(id, status, user // Mark user as potentially undefined
    ) {
        // Service calls (like the agent itself via MCPRegistryService) need to update status.
        // Authorization check might be less strict here, or handled in the service layer.
        const userId = user?.id; // Pass undefined if no user
        return this.handleAsync(() => this.agentService.updateAgentStatus(id, status, userId), // Modify service method signature if needed
        'Failed to update agent status');
    }
    /**
     * Delete an agent
     * @param id Agent ID
     * @param user Current user
     * @returns Success/failure response
     */
    // Deleting agents via API key seems risky. Let's keep this user-only for now.
    async deleteAgent(id, user // Keep requiring user for delete
    ) {
        if (!user?.id) {
            throw new Error('Cannot delete agent without user context.');
        }
        return this.handleAsync(() => this.agentService.deleteAgent(id, user.id), 'Failed to delete agent');
    }
};
__decorate([
    Post(),
    HttpCode(HttpStatus.CREATED),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof CreateAgentDto !== "undefined" && CreateAgentDto) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "createAgent", null);
__decorate([
    Get(),
    __param(0, CurrentUser()),
    __param(1, Query('capability')),
    __param(2, Query('status')),
    __param(3, Query('type')),
    __param(4, Query('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, typeof (_c = typeof AgentStatus !== "undefined" && AgentStatus) === "function" ? _c : Object, String, String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAgents", null);
__decorate([
    Get('active')
    // This endpoint seems user-specific, might not make sense for service calls?
    // Or maybe it means active agents the service *owns* or *manages*?
    // Let's keep it user-focused for now and potentially add a different endpoint for services if needed.
    ,
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getActiveAgents", null);
__decorate([
    Get(':id'),
    __param(0, Param('id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAgentById", null);
__decorate([
    Put(':id'),
    __param(0, Param('id')),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_d = typeof UpdateAgentDto !== "undefined" && UpdateAgentDto) === "function" ? _d : Object, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "updateAgent", null);
__decorate([
    Put(':id/status'),
    __param(0, Param('id')),
    __param(1, Body('status')),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_e = typeof AgentStatus !== "undefined" && AgentStatus) === "function" ? _e : Object, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "updateAgentStatus", null);
__decorate([
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT)
    // Deleting agents via API key seems risky. Let's keep this user-only for now.
    ,
    __param(0, Param('id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "deleteAgent", null);
AgentController = AgentController_1 = __decorate([
    Controller('agents'),
    UseGuards(ServiceOrUserAuthGuard) // Use the new combined guard
    ,
    __metadata("design:paramtypes", [typeof (_a = typeof AgentService !== "undefined" && AgentService) === "function" ? _a : Object])
], AgentController);
export { AgentController };
//# sourceMappingURL=agent.controller.js.map
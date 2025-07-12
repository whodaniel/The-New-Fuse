/**
 * Swarm Orchestration Controller
 * Handles multi-agent swarm coordination, task distribution, and agent communication
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
var SwarmOrchestrationController_1;
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Logger, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TenantGuard } from '../guards/tenant.guard';
import { AgencyRoleGuard } from '../guards/agency-role.guard';
import { Roles } from '../decorators/roles.decorator';
let SwarmOrchestrationController = SwarmOrchestrationController_1 = class SwarmOrchestrationController {
    logger = new Logger(SwarmOrchestrationController_1.name);
    async createSwarm(createSwarmDto) {
        this.logger.log('Creating new agent swarm');
        // Logic to create swarm
        return { message: 'Swarm created successfully' };
    }
    async getSwarms(status, type, page, limit) {
        this.logger.log('Getting agency swarms');
        // Logic to get swarms
        return [];
    }
    async getSwarmById(swarmId) {
        this.logger.log(`Getting swarm details for ID: ${swarmId}`);
        // Logic to get swarm details
        return {};
    }
    async updateSwarm(swarmId, updateSwarmDto) {
        this.logger.log(`Updating swarm ID: ${swarmId}`);
        // Logic to update swarm
        return { message: 'Swarm updated successfully' };
    }
    async deleteSwarm(swarmId) {
        this.logger.log(`Deleting swarm ID: ${swarmId}`);
        // Logic to delete swarm
        return { message: 'Swarm deleted successfully' };
    }
    async startSwarm(swarmId) {
        this.logger.log(`Starting swarm ID: ${swarmId}`);
        // Logic to start swarm
        return { message: 'Swarm started successfully' };
    }
    async stopSwarm(swarmId) {
        this.logger.log(`Stopping swarm ID: ${swarmId}`);
        // Logic to stop swarm
        return { message: 'Swarm stopped successfully' };
    }
    async getSwarmStatus(swarmId) {
        this.logger.log(`Getting status for swarm ID: ${swarmId}`);
        // Logic to get swarm status
        return { status: 'running', agents: [], tasks: [] };
    }
    async addAgentToSwarm(swarmId, addAgentDto) {
        this.logger.log(`Adding agent to swarm ID: ${swarmId}`);
        // Logic to add agent to swarm
        return { message: 'Agent added to swarm successfully' };
    }
    async removeAgentFromSwarm(swarmId, agentId) {
        this.logger.log(`Removing agent ${agentId} from swarm ${swarmId}`);
        // Logic to remove agent from swarm
        return { message: 'Agent removed from swarm successfully' };
    }
    async assignTaskToSwarm(swarmId, assignTaskDto) {
        this.logger.log(`Assigning task to swarm ID: ${swarmId}`);
        // Logic to assign task to swarm
        return { message: 'Task assigned to swarm successfully' };
    }
    async getSwarmMetrics(swarmId, period = '24h') {
        this.logger.log(`Getting metrics for swarm ID: ${swarmId}`);
        // Logic to get swarm metrics
        return { efficiency: 85, completedTasks: 42, activeAgents: 5 };
    }
    async optimizeCoordination(optimizeDto) {
        this.logger.log('Optimizing swarm coordination');
        // Logic to optimize coordination
        return { message: 'Coordination optimized successfully' };
    }
    async getSwarmTemplates() {
        this.logger.log('Getting swarm templates');
        // Logic to get templates
        return [];
    }
    async createSwarmTemplate(createTemplateDto) {
        this.logger.log('Creating swarm template');
        // Logic to create template
        return { message: 'Template created successfully' };
    }
};
__decorate([
    Post('swarms'),
    ApiOperation({ summary: 'Create a new agent swarm' }),
    ApiResponse({ status: 201, description: 'Swarm created successfully' }),
    ApiResponse({ status: 400, description: 'Invalid swarm configuration' }),
    Roles('AGENCY_ADMIN', 'AGENCY_MANAGER'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SwarmOrchestrationController.prototype, "createSwarm", null);
__decorate([
    Get('swarms'),
    ApiOperation({ summary: 'Get all swarms for agency' }),
    ApiQuery({ name: 'status', required: false, description: 'Filter by status' }),
    ApiQuery({ name: 'type', required: false, description: 'Filter by swarm type' }),
    ApiQuery({ name: 'page', required: false, description: 'Page number' }),
    ApiQuery({ name: 'limit', required: false, description: 'Items per page' }),
    ApiResponse({ status: 200, description: 'Swarms retrieved successfully' }),
    __param(0, Query('status')),
    __param(1, Query('type')),
    __param(2, Query('page')),
    __param(3, Query('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], SwarmOrchestrationController.prototype, "getSwarms", null);
__decorate([
    Get('swarms/:swarmId'),
    ApiOperation({ summary: 'Get specific swarm details' }),
    ApiParam({ name: 'swarmId', description: 'Swarm ID' }),
    ApiResponse({ status: 200, description: 'Swarm details retrieved' }),
    ApiResponse({ status: 404, description: 'Swarm not found' }),
    __param(0, Param('swarmId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SwarmOrchestrationController.prototype, "getSwarmById", null);
__decorate([
    Put('swarms/:swarmId'),
    ApiOperation({ summary: 'Update swarm configuration' }),
    ApiParam({ name: 'swarmId', description: 'Swarm ID' }),
    ApiResponse({ status: 200, description: 'Swarm updated successfully' }),
    ApiResponse({ status: 404, description: 'Swarm not found' }),
    Roles('AGENCY_ADMIN', 'AGENCY_MANAGER'),
    __param(0, Param('swarmId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SwarmOrchestrationController.prototype, "updateSwarm", null);
__decorate([
    Delete('swarms/:swarmId'),
    ApiOperation({ summary: 'Delete swarm' }),
    ApiParam({ name: 'swarmId', description: 'Swarm ID' }),
    ApiResponse({ status: 200, description: 'Swarm deleted successfully' }),
    ApiResponse({ status: 404, description: 'Swarm not found' }),
    Roles('AGENCY_ADMIN', 'AGENCY_MANAGER'),
    __param(0, Param('swarmId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SwarmOrchestrationController.prototype, "deleteSwarm", null);
__decorate([
    Post('swarms/:swarmId/start'),
    ApiOperation({ summary: 'Start swarm execution' }),
    ApiParam({ name: 'swarmId', description: 'Swarm ID' }),
    ApiResponse({ status: 200, description: 'Swarm started successfully' }),
    Roles('AGENCY_ADMIN', 'AGENCY_MANAGER'),
    __param(0, Param('swarmId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SwarmOrchestrationController.prototype, "startSwarm", null);
__decorate([
    Post('swarms/:swarmId/stop'),
    ApiOperation({ summary: 'Stop swarm execution' }),
    ApiParam({ name: 'swarmId', description: 'Swarm ID' }),
    ApiResponse({ status: 200, description: 'Swarm stopped successfully' }),
    Roles('AGENCY_ADMIN', 'AGENCY_MANAGER'),
    __param(0, Param('swarmId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SwarmOrchestrationController.prototype, "stopSwarm", null);
__decorate([
    Get('swarms/:swarmId/status'),
    ApiOperation({ summary: 'Get swarm execution status' }),
    ApiParam({ name: 'swarmId', description: 'Swarm ID' }),
    ApiResponse({ status: 200, description: 'Swarm status retrieved' }),
    __param(0, Param('swarmId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SwarmOrchestrationController.prototype, "getSwarmStatus", null);
__decorate([
    Post('swarms/:swarmId/agents'),
    ApiOperation({ summary: 'Add agent to swarm' }),
    ApiParam({ name: 'swarmId', description: 'Swarm ID' }),
    ApiResponse({ status: 201, description: 'Agent added to swarm' }),
    Roles('AGENCY_ADMIN', 'AGENCY_MANAGER'),
    __param(0, Param('swarmId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SwarmOrchestrationController.prototype, "addAgentToSwarm", null);
__decorate([
    Delete('swarms/:swarmId/agents/:agentId'),
    ApiOperation({ summary: 'Remove agent from swarm' }),
    ApiParam({ name: 'swarmId', description: 'Swarm ID' }),
    ApiParam({ name: 'agentId', description: 'Agent ID' }),
    ApiResponse({ status: 200, description: 'Agent removed from swarm' }),
    Roles('AGENCY_ADMIN', 'AGENCY_MANAGER'),
    __param(0, Param('swarmId')),
    __param(1, Param('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SwarmOrchestrationController.prototype, "removeAgentFromSwarm", null);
__decorate([
    Post('swarms/:swarmId/tasks'),
    ApiOperation({ summary: 'Assign task to swarm' }),
    ApiParam({ name: 'swarmId', description: 'Swarm ID' }),
    ApiResponse({ status: 201, description: 'Task assigned to swarm' }),
    __param(0, Param('swarmId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SwarmOrchestrationController.prototype, "assignTaskToSwarm", null);
__decorate([
    Get('swarms/:swarmId/metrics'),
    ApiOperation({ summary: 'Get swarm performance metrics' }),
    ApiParam({ name: 'swarmId', description: 'Swarm ID' }),
    ApiQuery({ name: 'period', required: false, description: 'Time period for metrics' }),
    ApiResponse({ status: 200, description: 'Swarm metrics retrieved' }),
    __param(0, Param('swarmId')),
    __param(1, Query('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SwarmOrchestrationController.prototype, "getSwarmMetrics", null);
__decorate([
    Post('coordination/optimize'),
    ApiOperation({ summary: 'Optimize swarm coordination' }),
    ApiResponse({ status: 200, description: 'Coordination optimized' }),
    Roles('AGENCY_ADMIN'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SwarmOrchestrationController.prototype, "optimizeCoordination", null);
__decorate([
    Get('templates'),
    ApiOperation({ summary: 'Get swarm templates' }),
    ApiResponse({ status: 200, description: 'Swarm templates retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SwarmOrchestrationController.prototype, "getSwarmTemplates", null);
__decorate([
    Post('templates'),
    ApiOperation({ summary: 'Create swarm template' }),
    ApiResponse({ status: 201, description: 'Template created successfully' }),
    Roles('AGENCY_ADMIN', 'AGENCY_MANAGER'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SwarmOrchestrationController.prototype, "createSwarmTemplate", null);
SwarmOrchestrationController = SwarmOrchestrationController_1 = __decorate([
    Controller('swarm-orchestration'),
    ApiTags('Swarm Orchestration'),
    UseGuards(TenantGuard, AgencyRoleGuard)
], SwarmOrchestrationController);
export { SwarmOrchestrationController };

"use strict";
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
var ClaudeDevAutomationController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeDevAutomationController = exports.TemplateCustomizationDto = exports.CreateAgentBatchDto = exports.ExecuteTaskDto = exports.UpdateAgentDto = exports.CreateAgentDto = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ClaudeDevAutomationService_1 = require("../services/ClaudeDevAutomationService");
const claude_dev_templates_1 = require("../services/claude-dev-templates");
// DTOs for API requests and responses
class CreateAgentDto {
    name;
    description;
    template;
    configuration;
    permissions;
    metadata;
}
exports.CreateAgentDto = CreateAgentDto;
class UpdateAgentDto {
    name;
    description;
    configuration;
    permissions;
    metadata;
}
exports.UpdateAgentDto = UpdateAgentDto;
class ExecuteTaskDto {
    type;
    priority;
    description;
    parameters;
    metadata;
}
exports.ExecuteTaskDto = ExecuteTaskDto;
class CreateAgentBatchDto {
    agents;
}
exports.CreateAgentBatchDto = CreateAgentBatchDto;
class TemplateCustomizationDto {
    templateId;
    configuration;
    permissions;
    metadata;
}
exports.TemplateCustomizationDto = TemplateCustomizationDto;
let ClaudeDevAutomationController = ClaudeDevAutomationController_1 = class ClaudeDevAutomationController {
    claudeDevService;
    logger = new common_1.Logger(ClaudeDevAutomationController_1.name);
    constructor(claudeDevService) {
        this.claudeDevService = claudeDevService;
    }
    // Health and Status Endpoints
    async getHealthStatus() {
        try {
            const health = await this.claudeDevService.getHealthStatus();
            return {
                success: true,
                data: health,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error('Health check failed', error);
            throw new common_1.HttpException('Health check failed', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getStatistics(tenantId) {
        try {
            const stats = await this.claudeDevService.getStatistics(tenantId);
            return {
                success: true,
                data: stats,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error('Failed to get statistics', error);
            throw new common_1.HttpException('Failed to retrieve statistics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    // Agent Management Endpoints
    async createAgent(tenantId, createAgentDto) {
        try {
            this.validateTenantId(tenantId);
            this.validateCreateAgentDto(createAgentDto);
            const agent = await this.claudeDevService.createAgent(tenantId, createAgentDto);
            return {
                success: true,
                data: agent,
                message: 'Agent created successfully',
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error(`Failed to create agent for tenant ${tenantId}`, error);
            if (error.message.includes('Template') && error.message.includes('not found')) {
                throw new common_1.HttpException(`Invalid template: ${error.message}`, common_1.HttpStatus.BAD_REQUEST);
            }
            throw new common_1.HttpException(error.message || 'Failed to create agent', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getAgentsByTenant(tenantId, status, template) {
        try {
            this.validateTenantId(tenantId);
            let agents = await this.claudeDevService.getAgentsByTenant(tenantId);
            // Apply filters
            if (status) {
                agents = agents.filter(agent => agent.status === status);
            }
            if (template) {
                agents = agents.filter(agent => agent.template === template);
            }
            return {
                success: true,
                data: agents,
                count: agents.length,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error(`Failed to get agents for tenant ${tenantId}`, error);
            throw new common_1.HttpException('Failed to retrieve agents', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAgent(tenantId, agentId) {
        try {
            this.validateTenantId(tenantId);
            this.validateAgentId(agentId);
            const agent = await this.claudeDevService.getAgent(agentId, tenantId);
            if (!agent) {
                throw new common_1.HttpException(`Agent ${agentId} not found for tenant ${tenantId}`, common_1.HttpStatus.NOT_FOUND);
            }
            return {
                success: true,
                data: agent,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            this.logger.error(`Failed to get agent ${agentId}`, error);
            throw new common_1.HttpException('Failed to retrieve agent', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async executeTask(tenantId, agentId, executeTaskDto) {
        try {
            this.validateTenantId(tenantId);
            this.validateAgentId(agentId);
            this.validateExecuteTaskDto(executeTaskDto);
            const task = await this.claudeDevService.executeTask(agentId, tenantId, executeTaskDto);
            return {
                success: true,
                data: task,
                message: 'Task created and started successfully',
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error(`Failed to execute task for agent ${agentId}`, error);
            if (error.message.includes('not found')) {
                throw new common_1.HttpException(error.message, common_1.HttpStatus.NOT_FOUND);
            }
            if (error.message.includes('not active')) {
                throw new common_1.HttpException(error.message, common_1.HttpStatus.BAD_REQUEST);
            }
            throw new common_1.HttpException(error.message || 'Failed to execute task', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getTasksByTenant(tenantId, agentId, status, type, limit) {
        try {
            this.validateTenantId(tenantId);
            let tasks = agentId
                ? await this.claudeDevService.getTasksByAgent(agentId, tenantId)
                : await this.claudeDevService.getTasksByTenant(tenantId);
            // Apply filters
            if (status) {
                tasks = tasks.filter(task => task.status === status);
            }
            if (type) {
                tasks = tasks.filter(task => task.type === type);
            }
            // Apply limit
            if (limit) {
                const limitNum = parseInt(limit, 10);
                if (!isNaN(limitNum) && limitNum > 0) {
                    tasks = tasks.slice(0, limitNum);
                }
            }
            return {
                success: true,
                data: tasks,
                count: tasks.length,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error(`Failed to get tasks for tenant ${tenantId}`, error);
            throw new common_1.HttpException('Failed to retrieve tasks', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createAgentBatch(tenantId, createAgentBatchDto) {
        try {
            this.validateTenantId(tenantId);
            if (!createAgentBatchDto.agents || createAgentBatchDto.agents.length === 0) {
                throw new common_1.HttpException('At least one agent configuration is required', common_1.HttpStatus.BAD_REQUEST);
            }
            // Validate each agent configuration
            createAgentBatchDto.agents.forEach((agentConfig, index) => {
                try {
                    this.validateCreateAgentDto(agentConfig);
                }
                catch (error) {
                    throw new common_1.HttpException(`Invalid configuration for agent ${index}: ${error.message}`, common_1.HttpStatus.BAD_REQUEST);
                }
            });
            const createdAgents = await this.claudeDevService.createAgentBatch(tenantId, createAgentBatchDto.agents);
            const hasFailures = createdAgents.length < createAgentBatchDto.agents.length;
            return {
                success: !hasFailures,
                data: createdAgents,
                message: hasFailures
                    ? `Created ${createdAgents.length} of ${createAgentBatchDto.agents.length} agents`
                    : 'All agents created successfully',
                requested: createAgentBatchDto.agents.length,
                created: createdAgents.length,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            this.logger.error(`Failed to create agent batch for tenant ${tenantId}`, error);
            throw new common_1.HttpException('Failed to create agent batch', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    // Template Management Endpoints
    async getTemplates(category, tag) {
        try {
            let templates = claude_dev_templates_1.ClaudeDevTemplateRegistry.getAllTemplates();
            if (category) {
                templates = claude_dev_templates_1.ClaudeDevTemplateRegistry.getTemplatesByCategory(category);
            }
            if (tag) {
                templates = claude_dev_templates_1.ClaudeDevTemplateRegistry.getTemplatesByTag(tag);
            }
            // Return template summaries (without full prompts for brevity)
            const templateSummaries = templates.map(template => ({
                id: template.id,
                name: template.name,
                description: template.description,
                category: template.category,
                version: template.version,
                author: template.author,
                tags: template.tags,
                capabilities: template.capabilities,
                integrations: template.integrations,
            }));
            return {
                success: true,
                data: templateSummaries,
                count: templateSummaries.length,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error('Failed to get templates', error);
            throw new common_1.HttpException('Failed to retrieve templates', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getTemplate(templateId) {
        try {
            const template = claude_dev_templates_1.ClaudeDevTemplateRegistry.getTemplate(templateId);
            if (!template) {
                throw new common_1.HttpException(`Template ${templateId} not found`, common_1.HttpStatus.NOT_FOUND);
            }
            return {
                success: true,
                data: template,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            this.logger.error(`Failed to get template ${templateId}`, error);
            throw new common_1.HttpException('Failed to retrieve template', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async customizeTemplate(templateId, customization) {
        try {
            const agentConfig = claude_dev_templates_1.ClaudeDevTemplateUtils.createAgentFromTemplate(templateId, {
                configuration: customization.configuration,
                permissions: customization.permissions,
                metadata: customization.metadata,
            });
            return {
                success: true,
                data: agentConfig,
                message: 'Agent configuration created from template',
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error(`Failed to customize template ${templateId}`, error);
            if (error.message.includes('not found')) {
                throw new common_1.HttpException(error.message, common_1.HttpStatus.NOT_FOUND);
            }
            throw new common_1.HttpException(error.message || 'Failed to customize template', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getUsageAnalytics(tenantId, period = '7d') {
        try {
            this.validateTenantId(tenantId);
            const stats = await this.claudeDevService.getStatistics(tenantId);
            const agents = await this.claudeDevService.getAgentsByTenant(tenantId);
            // Calculate usage analytics
            const analytics = {
                period,
                summary: {
                    totalAgents: stats.totalAgents,
                    activeAgents: stats.activeAgents,
                    totalTasks: stats.totalTasks,
                    successRate: stats.successRate,
                    averageTaskDuration: stats.averageTaskDuration,
                },
                agentDistribution: {
                    byTemplate: this.groupAgentsByTemplate(agents),
                    byStatus: this.groupAgentsByStatus(agents),
                },
                performance: {
                    resourceUsage: stats.resourceUsage,
                    efficiency: this.calculateEfficiencyMetrics(stats),
                },
                trends: {
                    // Mock trend data - in real implementation, this would come from historical data
                    taskVolumeGrowth: '+15%',
                    successRateTrend: '+2.3%',
                    avgDurationTrend: '-8%',
                },
            };
            return {
                success: true,
                data: analytics,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error(`Failed to get usage analytics for tenant ${tenantId}`, error);
            throw new common_1.HttpException('Failed to retrieve usage analytics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    // Private helper methods
    validateTenantId(tenantId) {
        if (!tenantId || tenantId.trim().length === 0) {
            throw new common_1.HttpException('Valid tenant ID is required', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    validateAgentId(agentId) {
        if (!agentId || agentId.trim().length === 0) {
            throw new common_1.HttpException('Valid agent ID is required', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    validateCreateAgentDto(dto) {
        if (!dto.template) {
            throw new common_1.HttpException('Template is required', common_1.HttpStatus.BAD_REQUEST);
        }
        // Validate template exists
        const template = claude_dev_templates_1.ClaudeDevTemplateRegistry.getTemplate(dto.template);
        if (!template) {
            throw new common_1.HttpException(`Template '${dto.template}' not found`, common_1.HttpStatus.BAD_REQUEST);
        }
        // Validate name if provided
        if (dto.name && dto.name.trim().length === 0) {
            throw new common_1.HttpException('Agent name cannot be empty', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    validateExecuteTaskDto(dto) {
        const validTaskTypes = [
            'code_review', 'project_setup', 'debug', 'documentation',
            'test', 'refactor', 'deploy', 'security', 'analysis', 'ui_ux'
        ];
        if (!dto.type || !validTaskTypes.includes(dto.type)) {
            throw new common_1.HttpException(`Invalid task type. Must be one of: ${validTaskTypes.join(', ')}`, common_1.HttpStatus.BAD_REQUEST);
        }
        if (dto.priority) {
            const validPriorities = ['low', 'medium', 'high', 'critical'];
            if (!validPriorities.includes(dto.priority)) {
                throw new common_1.HttpException(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`, common_1.HttpStatus.BAD_REQUEST);
            }
        }
    }
    groupAgentsByTemplate(agents) {
        return agents.reduce((acc, agent) => {
            acc[agent.template] = (acc[agent.template] || 0) + 1;
            return acc;
        }, {});
    }
    groupAgentsByStatus(agents) {
        return agents.reduce((acc, agent) => {
            acc[agent.status] = (acc[agent.status] || 0) + 1;
            return acc;
        }, {});
    }
    calculateEfficiencyMetrics(stats) {
        return {
            taskThroughput: stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0,
            avgTaskDurationMinutes: Math.round(stats.averageTaskDuration / 60000), // Convert to minutes
            resourceEfficiency: {
                cpu: 100 - stats.resourceUsage.cpuUsage,
                memory: 100 - stats.resourceUsage.memoryUsage,
                overall: 100 - ((stats.resourceUsage.cpuUsage + stats.resourceUsage.memoryUsage) / 2),
            },
            qualityScore: stats.successRate,
        };
    }
};
exports.ClaudeDevAutomationController = ClaudeDevAutomationController;
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({ summary: 'Get service health status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service health status' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ClaudeDevAutomationController.prototype, "getHealthStatus", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get service statistics' }),
    (0, swagger_1.ApiQuery)({ name: 'tenantId', required: false, description: 'Filter by tenant ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service statistics' }),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClaudeDevAutomationController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Post)('agents/:tenantId'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new Claude Dev agent' }),
    (0, swagger_1.ApiParam)({ name: 'tenantId', description: 'Tenant identifier' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Agent created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid request data' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateAgentDto]),
    __metadata("design:returntype", Promise)
], ClaudeDevAutomationController.prototype, "createAgent", null);
__decorate([
    (0, common_1.Get)('agents/:tenantId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all agents for a tenant' }),
    (0, swagger_1.ApiParam)({ name: 'tenantId', description: 'Tenant identifier' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Filter by agent status' }),
    (0, swagger_1.ApiQuery)({ name: 'template', required: false, description: 'Filter by template' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of agents' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('template')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ClaudeDevAutomationController.prototype, "getAgentsByTenant", null);
__decorate([
    (0, common_1.Get)('agents/:tenantId/:agentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific agent' }),
    (0, swagger_1.ApiParam)({ name: 'tenantId', description: 'Tenant identifier' }),
    (0, swagger_1.ApiParam)({ name: 'agentId', description: 'Agent identifier' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agent details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Agent not found' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ClaudeDevAutomationController.prototype, "getAgent", null);
__decorate([
    (0, common_1.Post)('agents/:tenantId/:agentId/tasks'),
    (0, swagger_1.ApiOperation)({ summary: 'Execute a task with an agent' }),
    (0, swagger_1.ApiParam)({ name: 'tenantId', description: 'Tenant identifier' }),
    (0, swagger_1.ApiParam)({ name: 'agentId', description: 'Agent identifier' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Task created and started' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Agent not found' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('agentId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, ExecuteTaskDto]),
    __metadata("design:returntype", Promise)
], ClaudeDevAutomationController.prototype, "executeTask", null);
__decorate([
    (0, common_1.Get)('tasks/:tenantId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all tasks for a tenant' }),
    (0, swagger_1.ApiParam)({ name: 'tenantId', description: 'Tenant identifier' }),
    (0, swagger_1.ApiQuery)({ name: 'agentId', required: false, description: 'Filter by agent ID' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Filter by task status' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, description: 'Filter by task type' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Limit number of results' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of tasks' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Query)('agentId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('type')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ClaudeDevAutomationController.prototype, "getTasksByTenant", null);
__decorate([
    (0, common_1.Post)('agents/:tenantId/batch'),
    (0, swagger_1.ApiOperation)({ summary: 'Create multiple agents in batch' }),
    (0, swagger_1.ApiParam)({ name: 'tenantId', description: 'Tenant identifier' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Agents created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 207, description: 'Partial success - some agents failed' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateAgentBatchDto]),
    __metadata("design:returntype", Promise)
], ClaudeDevAutomationController.prototype, "createAgentBatch", null);
__decorate([
    (0, common_1.Get)('templates'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all available templates' }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false, description: 'Filter by category' }),
    (0, swagger_1.ApiQuery)({ name: 'tag', required: false, description: 'Filter by tag' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of available templates' }),
    __param(0, (0, common_1.Query)('category')),
    __param(1, (0, common_1.Query)('tag')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ClaudeDevAutomationController.prototype, "getTemplates", null);
__decorate([
    (0, common_1.Get)('templates/:templateId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get detailed template information' }),
    (0, swagger_1.ApiParam)({ name: 'templateId', description: 'Template identifier' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Template details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Template not found' }),
    __param(0, (0, common_1.Param)('templateId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClaudeDevAutomationController.prototype, "getTemplate", null);
__decorate([
    (0, common_1.Post)('templates/:templateId/customize'),
    (0, swagger_1.ApiOperation)({ summary: 'Create agent configuration from template' }),
    (0, swagger_1.ApiParam)({ name: 'templateId', description: 'Template identifier' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Customized agent configuration' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Template not found' }),
    __param(0, (0, common_1.Param)('templateId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, TemplateCustomizationDto]),
    __metadata("design:returntype", Promise)
], ClaudeDevAutomationController.prototype, "customizeTemplate", null);
__decorate([
    (0, common_1.Get)('analytics/usage/:tenantId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get usage analytics for tenant' }),
    (0, swagger_1.ApiParam)({ name: 'tenantId', description: 'Tenant identifier' }),
    (0, swagger_1.ApiQuery)({ name: 'period', required: false, description: 'Time period (24h, 7d, 30d)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Usage analytics' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ClaudeDevAutomationController.prototype, "getUsageAnalytics", null);
exports.ClaudeDevAutomationController = ClaudeDevAutomationController = ClaudeDevAutomationController_1 = __decorate([
    (0, swagger_1.ApiTags)('Claude Dev Automation'),
    (0, common_1.Controller)('api/claude-dev-automation'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [ClaudeDevAutomationService_1.ClaudeDevAutomationService])
], ClaudeDevAutomationController);

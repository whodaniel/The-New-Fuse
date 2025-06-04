var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
import { Controller, Get, Post, HttpStatus, HttpException, Logger, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ClaudeDevTemplateRegistry, ClaudeDevTemplateUtils } from '../services/claude-dev-templates';
// DTOs for API requests and responses
export class CreateAgentDto {
}
export class UpdateAgentDto {
}
export class ExecuteTaskDto {
}
export class CreateAgentBatchDto {
}
export class TemplateCustomizationDto {
}
let ClaudeDevAutomationController = (() => {
    let _classDecorators = [ApiTags('Claude Dev Automation'), Controller('api/claude-dev-automation'), ApiBearerAuth()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getHealthStatus_decorators;
    let _getStatistics_decorators;
    let _createAgent_decorators;
    let _getAgentsByTenant_decorators;
    let _getAgent_decorators;
    let _executeTask_decorators;
    let _getTasksByTenant_decorators;
    let _createAgentBatch_decorators;
    let _getTemplates_decorators;
    let _getTemplate_decorators;
    let _customizeTemplate_decorators;
    let _getUsageAnalytics_decorators;
    var ClaudeDevAutomationController = _classThis = class {
        constructor(claudeDevService) {
            this.claudeDevService = (__runInitializers(this, _instanceExtraInitializers), claudeDevService);
            this.logger = new Logger(ClaudeDevAutomationController.name);
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
                throw new HttpException('Health check failed', HttpStatus.INTERNAL_SERVER_ERROR);
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
                throw new HttpException('Failed to retrieve statistics', HttpStatus.INTERNAL_SERVER_ERROR);
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
                    throw new HttpException(`Invalid template: ${error.message}`, HttpStatus.BAD_REQUEST);
                }
                throw new HttpException(error.message || 'Failed to create agent', HttpStatus.BAD_REQUEST);
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
                throw new HttpException('Failed to retrieve agents', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getAgent(tenantId, agentId) {
            try {
                this.validateTenantId(tenantId);
                this.validateAgentId(agentId);
                const agent = await this.claudeDevService.getAgent(agentId, tenantId);
                if (!agent) {
                    throw new HttpException(`Agent ${agentId} not found for tenant ${tenantId}`, HttpStatus.NOT_FOUND);
                }
                return {
                    success: true,
                    data: agent,
                    timestamp: new Date().toISOString(),
                };
            }
            catch (error) {
                if (error instanceof HttpException) {
                    throw error;
                }
                this.logger.error(`Failed to get agent ${agentId}`, error);
                throw new HttpException('Failed to retrieve agent', HttpStatus.INTERNAL_SERVER_ERROR);
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
                    throw new HttpException(error.message, HttpStatus.NOT_FOUND);
                }
                if (error.message.includes('not active')) {
                    throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
                }
                throw new HttpException(error.message || 'Failed to execute task', HttpStatus.INTERNAL_SERVER_ERROR);
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
                throw new HttpException('Failed to retrieve tasks', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async createAgentBatch(tenantId, createAgentBatchDto) {
            try {
                this.validateTenantId(tenantId);
                if (!createAgentBatchDto.agents || createAgentBatchDto.agents.length === 0) {
                    throw new HttpException('At least one agent configuration is required', HttpStatus.BAD_REQUEST);
                }
                // Validate each agent configuration
                createAgentBatchDto.agents.forEach((agentConfig, index) => {
                    try {
                        this.validateCreateAgentDto(agentConfig);
                    }
                    catch (error) {
                        throw new HttpException(`Invalid configuration for agent ${index}: ${error.message}`, HttpStatus.BAD_REQUEST);
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
                if (error instanceof HttpException) {
                    throw error;
                }
                this.logger.error(`Failed to create agent batch for tenant ${tenantId}`, error);
                throw new HttpException('Failed to create agent batch', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        // Template Management Endpoints
        async getTemplates(category, tag) {
            try {
                let templates = ClaudeDevTemplateRegistry.getAllTemplates();
                if (category) {
                    templates = ClaudeDevTemplateRegistry.getTemplatesByCategory(category);
                }
                if (tag) {
                    templates = ClaudeDevTemplateRegistry.getTemplatesByTag(tag);
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
                throw new HttpException('Failed to retrieve templates', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getTemplate(templateId) {
            try {
                const template = ClaudeDevTemplateRegistry.getTemplate(templateId);
                if (!template) {
                    throw new HttpException(`Template ${templateId} not found`, HttpStatus.NOT_FOUND);
                }
                return {
                    success: true,
                    data: template,
                    timestamp: new Date().toISOString(),
                };
            }
            catch (error) {
                if (error instanceof HttpException) {
                    throw error;
                }
                this.logger.error(`Failed to get template ${templateId}`, error);
                throw new HttpException('Failed to retrieve template', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async customizeTemplate(templateId, customization) {
            try {
                const agentConfig = ClaudeDevTemplateUtils.createAgentFromTemplate(templateId, {
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
                    throw new HttpException(error.message, HttpStatus.NOT_FOUND);
                }
                throw new HttpException(error.message || 'Failed to customize template', HttpStatus.BAD_REQUEST);
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
                throw new HttpException('Failed to retrieve usage analytics', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        // Private helper methods
        validateTenantId(tenantId) {
            if (!tenantId || tenantId.trim().length === 0) {
                throw new HttpException('Valid tenant ID is required', HttpStatus.BAD_REQUEST);
            }
        }
        validateAgentId(agentId) {
            if (!agentId || agentId.trim().length === 0) {
                throw new HttpException('Valid agent ID is required', HttpStatus.BAD_REQUEST);
            }
        }
        validateCreateAgentDto(dto) {
            if (!dto.template) {
                throw new HttpException('Template is required', HttpStatus.BAD_REQUEST);
            }
            // Validate template exists
            const template = ClaudeDevTemplateRegistry.getTemplate(dto.template);
            if (!template) {
                throw new HttpException(`Template '${dto.template}' not found`, HttpStatus.BAD_REQUEST);
            }
            // Validate name if provided
            if (dto.name && dto.name.trim().length === 0) {
                throw new HttpException('Agent name cannot be empty', HttpStatus.BAD_REQUEST);
            }
        }
        validateExecuteTaskDto(dto) {
            const validTaskTypes = [
                'code_review', 'project_setup', 'debug', 'documentation',
                'test', 'refactor', 'deploy', 'security', 'analysis', 'ui_ux'
            ];
            if (!dto.type || !validTaskTypes.includes(dto.type)) {
                throw new HttpException(`Invalid task type. Must be one of: ${validTaskTypes.join(', ')}`, HttpStatus.BAD_REQUEST);
            }
            if (dto.priority) {
                const validPriorities = ['low', 'medium', 'high', 'critical'];
                if (!validPriorities.includes(dto.priority)) {
                    throw new HttpException(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`, HttpStatus.BAD_REQUEST);
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
    __setFunctionName(_classThis, "ClaudeDevAutomationController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getHealthStatus_decorators = [Get('health'), ApiOperation({ summary: 'Get service health status' }), ApiResponse({ status: 200, description: 'Service health status' })];
        _getStatistics_decorators = [Get('statistics'), ApiOperation({ summary: 'Get service statistics' }), ApiQuery({ name: 'tenantId', required: false, description: 'Filter by tenant ID' }), ApiResponse({ status: 200, description: 'Service statistics' })];
        _createAgent_decorators = [Post('agents/:tenantId'), ApiOperation({ summary: 'Create a new Claude Dev agent' }), ApiParam({ name: 'tenantId', description: 'Tenant identifier' }), ApiResponse({ status: 201, description: 'Agent created successfully' }), ApiResponse({ status: 400, description: 'Invalid request data' })];
        _getAgentsByTenant_decorators = [Get('agents/:tenantId'), ApiOperation({ summary: 'Get all agents for a tenant' }), ApiParam({ name: 'tenantId', description: 'Tenant identifier' }), ApiQuery({ name: 'status', required: false, description: 'Filter by agent status' }), ApiQuery({ name: 'template', required: false, description: 'Filter by template' }), ApiResponse({ status: 200, description: 'List of agents' })];
        _getAgent_decorators = [Get('agents/:tenantId/:agentId'), ApiOperation({ summary: 'Get a specific agent' }), ApiParam({ name: 'tenantId', description: 'Tenant identifier' }), ApiParam({ name: 'agentId', description: 'Agent identifier' }), ApiResponse({ status: 200, description: 'Agent details' }), ApiResponse({ status: 404, description: 'Agent not found' })];
        _executeTask_decorators = [Post('agents/:tenantId/:agentId/tasks'), ApiOperation({ summary: 'Execute a task with an agent' }), ApiParam({ name: 'tenantId', description: 'Tenant identifier' }), ApiParam({ name: 'agentId', description: 'Agent identifier' }), ApiResponse({ status: 201, description: 'Task created and started' }), ApiResponse({ status: 404, description: 'Agent not found' })];
        _getTasksByTenant_decorators = [Get('tasks/:tenantId'), ApiOperation({ summary: 'Get all tasks for a tenant' }), ApiParam({ name: 'tenantId', description: 'Tenant identifier' }), ApiQuery({ name: 'agentId', required: false, description: 'Filter by agent ID' }), ApiQuery({ name: 'status', required: false, description: 'Filter by task status' }), ApiQuery({ name: 'type', required: false, description: 'Filter by task type' }), ApiQuery({ name: 'limit', required: false, description: 'Limit number of results' }), ApiResponse({ status: 200, description: 'List of tasks' })];
        _createAgentBatch_decorators = [Post('agents/:tenantId/batch'), ApiOperation({ summary: 'Create multiple agents in batch' }), ApiParam({ name: 'tenantId', description: 'Tenant identifier' }), ApiResponse({ status: 201, description: 'Agents created successfully' }), ApiResponse({ status: 207, description: 'Partial success - some agents failed' })];
        _getTemplates_decorators = [Get('templates'), ApiOperation({ summary: 'Get all available templates' }), ApiQuery({ name: 'category', required: false, description: 'Filter by category' }), ApiQuery({ name: 'tag', required: false, description: 'Filter by tag' }), ApiResponse({ status: 200, description: 'List of available templates' })];
        _getTemplate_decorators = [Get('templates/:templateId'), ApiOperation({ summary: 'Get detailed template information' }), ApiParam({ name: 'templateId', description: 'Template identifier' }), ApiResponse({ status: 200, description: 'Template details' }), ApiResponse({ status: 404, description: 'Template not found' })];
        _customizeTemplate_decorators = [Post('templates/:templateId/customize'), ApiOperation({ summary: 'Create agent configuration from template' }), ApiParam({ name: 'templateId', description: 'Template identifier' }), ApiResponse({ status: 200, description: 'Customized agent configuration' }), ApiResponse({ status: 404, description: 'Template not found' })];
        _getUsageAnalytics_decorators = [Get('analytics/usage/:tenantId'), ApiOperation({ summary: 'Get usage analytics for tenant' }), ApiParam({ name: 'tenantId', description: 'Tenant identifier' }), ApiQuery({ name: 'period', required: false, description: 'Time period (24h, 7d, 30d)' }), ApiResponse({ status: 200, description: 'Usage analytics' })];
        __esDecorate(_classThis, null, _getHealthStatus_decorators, { kind: "method", name: "getHealthStatus", static: false, private: false, access: { has: obj => "getHealthStatus" in obj, get: obj => obj.getHealthStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getStatistics_decorators, { kind: "method", name: "getStatistics", static: false, private: false, access: { has: obj => "getStatistics" in obj, get: obj => obj.getStatistics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createAgent_decorators, { kind: "method", name: "createAgent", static: false, private: false, access: { has: obj => "createAgent" in obj, get: obj => obj.createAgent }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAgentsByTenant_decorators, { kind: "method", name: "getAgentsByTenant", static: false, private: false, access: { has: obj => "getAgentsByTenant" in obj, get: obj => obj.getAgentsByTenant }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAgent_decorators, { kind: "method", name: "getAgent", static: false, private: false, access: { has: obj => "getAgent" in obj, get: obj => obj.getAgent }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _executeTask_decorators, { kind: "method", name: "executeTask", static: false, private: false, access: { has: obj => "executeTask" in obj, get: obj => obj.executeTask }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getTasksByTenant_decorators, { kind: "method", name: "getTasksByTenant", static: false, private: false, access: { has: obj => "getTasksByTenant" in obj, get: obj => obj.getTasksByTenant }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createAgentBatch_decorators, { kind: "method", name: "createAgentBatch", static: false, private: false, access: { has: obj => "createAgentBatch" in obj, get: obj => obj.createAgentBatch }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getTemplates_decorators, { kind: "method", name: "getTemplates", static: false, private: false, access: { has: obj => "getTemplates" in obj, get: obj => obj.getTemplates }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getTemplate_decorators, { kind: "method", name: "getTemplate", static: false, private: false, access: { has: obj => "getTemplate" in obj, get: obj => obj.getTemplate }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _customizeTemplate_decorators, { kind: "method", name: "customizeTemplate", static: false, private: false, access: { has: obj => "customizeTemplate" in obj, get: obj => obj.customizeTemplate }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getUsageAnalytics_decorators, { kind: "method", name: "getUsageAnalytics", static: false, private: false, access: { has: obj => "getUsageAnalytics" in obj, get: obj => obj.getUsageAnalytics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ClaudeDevAutomationController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ClaudeDevAutomationController = _classThis;
})();
export { ClaudeDevAutomationController };

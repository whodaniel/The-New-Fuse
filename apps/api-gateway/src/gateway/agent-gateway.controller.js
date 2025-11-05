"use strict";
/**
 * Agent Gateway Controller
 * Unified endpoint for all agent operations across services including TRAYCER-style functionality
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentGatewayController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const proxy_service_1 = require("../proxy/proxy.service");
let AgentGatewayController = class AgentGatewayController {
    proxyService;
    constructor(proxyService) {
        this.proxyService = proxyService;
    }
    async getAgents(query, headers, res) {
        try {
            // Route to agents service (port 3001) or backend service (port 3004)
            const response = await this.proxyService.proxyRequest('agents', '/agents', 'GET', headers, undefined, query);
            return res.status(response.status).json(response.data);
        }
        catch {
            // Fallback to backend service if agents service is unavailable
            try {
                const response = await this.proxyService.proxyRequest('backend', '/api/agents', 'GET', headers, undefined, query);
                return res.status(response.status).json(response.data);
            }
            catch (fallbackError) {
                const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
                return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                    message: 'Agent services unavailable',
                    error: fallbackErrorMessage,
                });
            }
        }
    }
    async createAgent(body, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('agents', '/agents', 'POST', headers, body);
            return res.status(response.status).json(response.data);
        }
        catch {
            // Fallback to backend service
            try {
                const response = await this.proxyService.proxyRequest('backend', '/api/agents', 'POST', headers, body);
                return res.status(response.status).json(response.data);
            }
            catch (fallbackError) {
                const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
                return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                    message: 'Agent services unavailable',
                    error: fallbackErrorMessage,
                });
            }
        }
    }
    async getActiveAgents(headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('agents', '/agents/active', 'GET', headers);
            return res.status(response.status).json(response.data);
        }
        catch {
            try {
                const response = await this.proxyService.proxyRequest('backend', '/api/agents/active', 'GET', headers);
                return res.status(response.status).json(response.data);
            }
            catch (fallbackError) {
                const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
                return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                    message: 'Agent services unavailable',
                    error: fallbackErrorMessage,
                });
            }
        }
    }
    async getAgentById(id, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('agents', `/agents/${id}`, 'GET', headers);
            return res.status(response.status).json(response.data);
        }
        catch {
            try {
                const response = await this.proxyService.proxyRequest('backend', `/api/agents/${id}`, 'GET', headers);
                return res.status(response.status).json(response.data);
            }
            catch (fallbackError) {
                const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
                return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                    message: 'Agent services unavailable',
                    error: fallbackErrorMessage,
                });
            }
        }
    }
    async updateAgent(id, body, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('agents', `/agents/${id}`, 'PUT', headers, body);
            return res.status(response.status).json(response.data);
        }
        catch {
            try {
                const response = await this.proxyService.proxyRequest('backend', `/api/agents/${id}`, 'PUT', headers, body);
                return res.status(response.status).json(response.data);
            }
            catch (fallbackError) {
                const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
                return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                    message: 'Agent services unavailable',
                    error: fallbackErrorMessage,
                });
            }
        }
    }
    async updateAgentStatus(id, body, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('agents', `/agents/${id}/status`, 'PUT', headers, body);
            return res.status(response.status).json(response.data);
        }
        catch {
            try {
                const response = await this.proxyService.proxyRequest('backend', `/api/agents/${id}/status`, 'PUT', headers, body);
                return res.status(response.status).json(response.data);
            }
            catch (fallbackError) {
                const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
                return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                    message: 'Agent services unavailable',
                    error: fallbackErrorMessage,
                });
            }
        }
    }
    async deleteAgent(id, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('agents', `/agents/${id}`, 'DELETE', headers);
            return res.status(response.status).json(response.data);
        }
        catch {
            try {
                const response = await this.proxyService.proxyRequest('backend', `/api/agents/${id}`, 'DELETE', headers);
                return res.status(response.status).json(response.data);
            }
            catch (fallbackError) {
                const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
                return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                    message: 'Agent services unavailable',
                    error: fallbackErrorMessage,
                });
            }
        }
    }
    // TRAYCER-style execution endpoints
    async executePlanInAgent(agentId, body, headers, res) {
        // Add deprecation headers
        res.setHeader('Deprecation', 'true');
        res.setHeader('Sunset', '2024-12-31');
        res.setHeader('Link', '</traycer/execute-plan>; rel="successor-version"');
        try {
            const response = await this.proxyService.proxyRequest('backend', `/api/agents/${agentId}/execute-plan`, 'POST', headers, body);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Plan execution failed',
                error: errorMessage,
            });
        }
    }
    async executeVerificationCommentInAgent(agentId, body, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', `/api/agents/${agentId}/execute-verification`, 'POST', headers, body);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Verification execution failed',
                error: errorMessage,
            });
        }
    }
    async executeAllVerificationCommentsInAgent(agentId, body, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', `/api/agents/${agentId}/execute-all-verifications`, 'POST', headers, body);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'All verifications execution failed',
                error: errorMessage,
            });
        }
    }
    async sendStructuredPrompt(agentId, body, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', `/api/agents/${agentId}/structured-prompt`, 'POST', headers, body);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Structured prompt failed',
                error: errorMessage,
            });
        }
    }
    async discoverAgents(query, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', '/api/agents/discover', 'GET', headers, undefined, query);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Agent discovery failed',
                error: errorMessage,
            });
        }
    }
    async getAgentTasks(agentId, query, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', `/api/agents/${agentId}/tasks`, 'GET', headers, undefined, query);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Task retrieval failed',
                error: errorMessage,
            });
        }
    }
    async getAgentQueue(agentId, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', `/api/agents/${agentId}/queue`, 'GET', headers);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Queue status retrieval failed',
                error: errorMessage,
            });
        }
    }
    async configureAgent(agentId, body, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', `/api/agents/${agentId}/configure`, 'POST', headers, body);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Agent configuration failed',
                error: errorMessage,
            });
        }
    }
    async getWorkspaceContext(query, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', '/api/agents/workspace/context', 'GET', headers, undefined, query);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Workspace context retrieval failed',
                error: errorMessage,
            });
        }
    }
    async getWorkspaceFiles(query, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', '/api/agents/workspace/files', 'GET', headers, undefined, query);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Workspace files retrieval failed',
                error: errorMessage,
            });
        }
    }
    async exportTasks(body, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', '/api/agents/export/tasks', 'POST', headers, body);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Task export failed',
                error: errorMessage,
            });
        }
    }
    streamTaskUpdates(agentId) {
        // This is a placeholder implementation - in a real implementation,
        // you would connect to the actual task event stream
        return (0, rxjs_1.interval)(1000).pipe((0, operators_1.map)((count) => ({
            data: JSON.stringify({
                type: 'task_update',
                agentId: agentId || 'all',
                timestamp: new Date().toISOString(),
                count
            })
        })));
    }
};
exports.AgentGatewayController = AgentGatewayController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all agents' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of agents retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'capability', required: false, description: 'Filter by capability' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Filter by status' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, description: 'Filter by type' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentGatewayController.prototype, "getAgents", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new agent' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Agent created successfully' }),
    (0, swagger_1.ApiBody)({ description: 'Agent creation data' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentGatewayController.prototype, "createAgent", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Get active agents' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Active agents retrieved successfully' }),
    __param(0, (0, common_1.Headers)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AgentGatewayController.prototype, "getActiveAgents", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Get agent by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Agent ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agent retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Agent not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentGatewayController.prototype, "getAgentById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an agent' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Agent ID' }),
    (0, swagger_1.ApiBody)({ description: 'Agent update data' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agent updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Agent not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentGatewayController.prototype, "updateAgent", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Update agent status' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Agent ID' }),
    (0, swagger_1.ApiBody)({ description: 'Status update data' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agent status updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentGatewayController.prototype, "updateAgentStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an agent' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Agent ID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Agent deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Agent not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentGatewayController.prototype, "deleteAgent", null);
__decorate([
    (0, common_1.Post)(':agentId/execute-plan'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Execute a plan in a specific agent using TRAYCER-style communication',
        deprecated: true,
        description: 'DEPRECATED: Use /traycer/execute-plan instead. This endpoint will be removed in future versions.'
    }),
    (0, swagger_1.ApiParam)({ name: 'agentId', description: 'Agent ID to execute the plan in' }),
    (0, swagger_1.ApiBody)({
        description: 'Plan execution request',
        schema: {
            type: 'object',
            properties: {
                planId: { type: 'string', description: 'Plan identifier' },
                context: { type: 'object', description: 'Execution context' },
                workspace: { type: 'object', description: 'Workspace context' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plan execution completed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Agent not found' }),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentGatewayController.prototype, "executePlanInAgent", null);
__decorate([
    (0, common_1.Post)(':agentId/execute-verification'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Execute verification comments in a specific agent',
        deprecated: true,
        description: 'DEPRECATED: Use /traycer/execute-verification instead. This endpoint will be removed in future versions.'
    }),
    (0, swagger_1.ApiParam)({ name: 'agentId', description: 'Agent ID to execute verification in' }),
    (0, swagger_1.ApiBody)({
        description: 'Verification execution request',
        schema: {
            type: 'object',
            properties: {
                verificationId: { type: 'string', description: 'Verification comment identifier' },
                context: { type: 'object', description: 'Verification context' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Verification executed successfully' }),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentGatewayController.prototype, "executeVerificationCommentInAgent", null);
__decorate([
    (0, common_1.Post)(':agentId/execute-all-verifications'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Execute all verification comments in a specific agent',
        deprecated: true,
        description: 'DEPRECATED: Use /traycer/execute-all-verifications instead. This endpoint will be removed in future versions.'
    }),
    (0, swagger_1.ApiParam)({ name: 'agentId', description: 'Agent ID to execute all verifications in' }),
    (0, swagger_1.ApiBody)({
        description: 'All verifications execution request',
        schema: {
            type: 'object',
            properties: {
                context: { type: 'object', description: 'Execution context' },
                parallel: { type: 'boolean', description: 'Execute verifications in parallel' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'All verifications executed successfully' }),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentGatewayController.prototype, "executeAllVerificationCommentsInAgent", null);
__decorate([
    (0, common_1.Post)(':agentId/structured-prompt'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Send structured prompt with workspace context to agent',
        deprecated: true,
        description: 'DEPRECATED: Use /traycer/structured-prompt instead. This endpoint will be removed in future versions.'
    }),
    (0, swagger_1.ApiParam)({ name: 'agentId', description: 'Agent ID to send prompt to' }),
    (0, swagger_1.ApiBody)({
        description: 'Structured prompt request',
        schema: {
            type: 'object',
            properties: {
                prompt: { type: 'string', description: 'The structured prompt' },
                workspace: { type: 'object', description: 'Workspace context' },
                files: { type: 'array', items: { type: 'string' }, description: 'Selected files' },
                metadata: { type: 'object', description: 'Additional metadata' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Structured prompt sent successfully' }),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentGatewayController.prototype, "sendStructuredPrompt", null);
__decorate([
    (0, common_1.Get)('discover'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Discover available local AI agents',
        deprecated: true,
        description: 'DEPRECATED: Use /traycer/agents/discover instead. This endpoint will be removed in future versions.'
    }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, description: 'Filter by agent type' }),
    (0, swagger_1.ApiQuery)({ name: 'capability', required: false, description: 'Filter by capability' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Available agents discovered successfully' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentGatewayController.prototype, "discoverAgents", null);
__decorate([
    (0, common_1.Get)(':agentId/tasks'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Get task status and execution history for agent' }),
    (0, swagger_1.ApiParam)({ name: 'agentId', description: 'Agent ID' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Filter by task status' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Limit number of results' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Task information retrieved successfully' }),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Headers)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentGatewayController.prototype, "getAgentTasks", null);
__decorate([
    (0, common_1.Get)(':agentId/queue'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Get task queue status for agent' }),
    (0, swagger_1.ApiParam)({ name: 'agentId', description: 'Agent ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Queue status retrieved successfully' }),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentGatewayController.prototype, "getAgentQueue", null);
__decorate([
    (0, common_1.Post)(':agentId/configure'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Configure agent with local-ai-agents directory settings' }),
    (0, swagger_1.ApiParam)({ name: 'agentId', description: 'Agent ID' }),
    (0, swagger_1.ApiBody)({
        description: 'Agent configuration',
        schema: {
            type: 'object',
            properties: {
                configPath: { type: 'string', description: 'Path to configuration file' },
                settings: { type: 'object', description: 'Configuration settings' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agent configured successfully' }),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentGatewayController.prototype, "configureAgent", null);
__decorate([
    (0, common_1.Get)('workspace/context'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Get workspace context for agent operations' }),
    (0, swagger_1.ApiQuery)({ name: 'path', required: false, description: 'Workspace path' }),
    (0, swagger_1.ApiQuery)({ name: 'includeFiles', required: false, description: 'Include file contents' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workspace context retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentGatewayController.prototype, "getWorkspaceContext", null);
__decorate([
    (0, common_1.Get)('workspace/files'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Get workspace file listing and selection' }),
    (0, swagger_1.ApiQuery)({ name: 'pattern', required: false, description: 'File pattern filter' }),
    (0, swagger_1.ApiQuery)({ name: 'recursive', required: false, description: 'Recursive search' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workspace files retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentGatewayController.prototype, "getWorkspaceFiles", null);
__decorate([
    (0, common_1.Post)('export/tasks'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Export tasks and results in various formats' }),
    (0, swagger_1.ApiBody)({
        description: 'Export request',
        schema: {
            type: 'object',
            properties: {
                format: { type: 'string', enum: ['json', 'markdown', 'csv'], description: 'Export format' },
                agentIds: { type: 'array', items: { type: 'string' }, description: 'Agent IDs to export' },
                dateRange: { type: 'object', description: 'Date range filter' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Tasks exported successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentGatewayController.prototype, "exportTasks", null);
__decorate([
    (0, common_1.Sse)('tasks/stream'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Stream real-time task updates via Server-Sent Events' }),
    (0, swagger_1.ApiQuery)({ name: 'agentId', required: false, description: 'Filter by agent ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Task stream established successfully' }),
    __param(0, (0, common_1.Query)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", rxjs_1.Observable)
], AgentGatewayController.prototype, "streamTaskUpdates", null);
exports.AgentGatewayController = AgentGatewayController = __decorate([
    (0, common_1.Controller)('agents'),
    (0, swagger_1.ApiTags)('agents'),
    __metadata("design:paramtypes", [proxy_service_1.ProxyService])
], AgentGatewayController);
//# sourceMappingURL=agent-gateway.controller.js.map
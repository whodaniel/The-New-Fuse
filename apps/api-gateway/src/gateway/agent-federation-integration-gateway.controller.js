"use strict";
/**
 * AgentFederationIntegration Gateway Controller
 * Dedicated endpoint for AgentFederationIntegration-style agent communication and orchestration
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
exports.AgentFederationIntegrationGatewayController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const proxy_service_1 = require("../proxy/proxy.service");
let AgentFederationIntegrationGatewayController = class AgentFederationIntegrationGatewayController {
    proxyService;
    taskStreams = new Map();
    streamCreationTimes = new Map();
    cleanupTimer;
    constructor(proxyService) {
        this.proxyService = proxyService;
        // Start cleanup timer for stale streams
        this.cleanupTimer = setInterval(() => this.cleanupStaleStreams(), 60000); // Check every minute
    }
    // Plan Execution Endpoints
    async executePlan(body, headers, res) {
        try {
            // TODO: Switch back to /api/agenthub/* endpoints when AgentHub service is implemented
            // For now, using available backend endpoints under /api/agents/*
            const agentId = body.context?.agentId || 'default';
            const response = await this.proxyService.proxyRequest('backend', `/api/agents/${agentId}/execute-plan`, 'POST', headers, body);
            // Emit to task stream if plan has streaming enabled
            if (body.options?.parallel) {
                this.emitTaskUpdate('plan_execution', {
                    planId: body.planId,
                    status: 'completed',
                    result: response.data
                });
            }
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Plan execution failed',
                error: errorMessage,
                planId: body.planId
            });
        }
    }
    async executeVerification(body, headers, res) {
        try {
            // TODO: Switch back to /api/agenthub/* endpoints when AgentHub service is implemented
            const agentId = body.context?.agentId || 'default';
            const response = await this.proxyService.proxyRequest('backend', `/api/agents/${agentId}/execute-verification`, 'POST', headers, body);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Verification execution failed',
                error: errorMessage,
                verificationId: body.verificationId
            });
        }
    }
    async executeAllVerifications(body, headers, res) {
        try {
            // TODO: Switch back to /api/agenthub/* endpoints when AgentHub service is implemented
            const agentId = body.context?.agentId || 'default';
            const response = await this.proxyService.proxyRequest('backend', `/api/agents/${agentId}/execute-all-verifications`, 'POST', headers, body);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Batch verification execution failed',
                error: errorMessage,
            });
        }
    }
    // Structured Prompt Endpoints
    async sendStructuredPrompt(body, headers, res) {
        try {
            // TODO: Switch back to /api/agenthub/* endpoints when AgentHub service is implemented
            const agentId = body.metadata?.agentId || 'default';
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
    // Agent Management Endpoints
    async discoverAgents(query, headers, res) {
        try {
            // TODO: Switch back to /api/agenthub/* endpoints when AgentHub service is implemented
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
    async configureAgent(agentId, body, headers, res) {
        try {
            // TODO: Implement agent configuration endpoint in backend
            // Fallback to agent status endpoint for now
            const response = await this.proxyService.proxyRequest('backend', `/api/agents/${agentId}`, 'PUT', headers, body);
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
    async getAgentStatus(agentId, headers, res) {
        try {
            // Use existing agent detail endpoint
            const response = await this.proxyService.proxyRequest('backend', `/api/agents/${agentId}`, 'GET', headers);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Agent status retrieval failed',
                error: errorMessage,
            });
        }
    }
    // Task Orchestration Endpoints
    async orchestrateWorkflow(body, headers, res) {
        try {
            // TODO: Implement workflow orchestration in backend
            // For now, return a placeholder response
            // Emit workflow start event for AgentFederationIntegration tracking
            this.emitTaskUpdate('workflow_started', {
                workflowId: body.workflowId,
                agents: body.agents,
                timestamp: new Date().toISOString()
            });
            return res.status(common_1.HttpStatus.NOT_IMPLEMENTED).json({
                message: 'Workflow orchestration not yet implemented in backend',
                workflowId: body.workflowId,
                status: 'pending_implementation'
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Workflow orchestration failed',
                error: errorMessage,
            });
        }
    }
    async getWorkflowStatus(workflowId, headers, res) {
        try {
            // TODO: Implement workflow status endpoint in backend
            return res.status(common_1.HttpStatus.NOT_IMPLEMENTED).json({
                message: 'Workflow status not yet implemented in backend',
                workflowId: workflowId,
                status: 'pending_implementation'
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Workflow status retrieval failed',
                error: errorMessage,
            });
        }
    }
    // Export Endpoints
    async exportMarkdown(body, headers, res) {
        try {
            // Use existing task export endpoint with format conversion
            const response = await this.proxyService.proxyRequest('backend', '/api/agents/export/tasks', 'POST', headers, { ...body, format: 'markdown' });
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Markdown export failed',
                error: errorMessage,
            });
        }
    }
    async exportJson(body, headers, res) {
        try {
            // Use existing task export endpoint with JSON format
            const response = await this.proxyService.proxyRequest('backend', '/api/agents/export/tasks', 'POST', headers, { ...body, format: 'json' });
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'JSON export failed',
                error: errorMessage,
            });
        }
    }
    // Workspace Context Endpoints
    async getWorkspaceContext(query, headers, res) {
        try {
            // Use existing workspace context endpoint
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
            // Use existing workspace files endpoint
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
    // Real-time Endpoints
    streamTaskUpdates(agentId, workflowId, eventTypes) {
        const streamId = `${agentId || 'all'}-${workflowId || 'all'}-${Date.now()}`;
        const stream = new rxjs_1.Subject();
        this.taskStreams.set(streamId, stream);
        this.streamCreationTimes.set(streamId, Date.now());
        // Filter events based on query parameters
        const allowedEventTypes = eventTypes ? eventTypes.split(',') : [];
        return stream.pipe((0, operators_1.filter)(event => {
            if (agentId && event.agentId !== agentId)
                return false;
            if (workflowId && event.workflowId !== workflowId)
                return false;
            if (allowedEventTypes.length > 0 && !allowedEventTypes.includes(event.type))
                return false;
            return true;
        }), (0, operators_1.map)((event) => ({
            id: event.id || Date.now().toString(),
            type: event.type,
            data: JSON.stringify(event),
            retry: 5000
        })), (0, operators_1.takeUntil)((0, rxjs_1.interval)(300000)), // Auto-close after 5 minutes of inactivity
        (0, operators_1.finalize)(() => {
            // Clean up the stream when completed or closed
            this.taskStreams.delete(streamId);
            this.streamCreationTimes.delete(streamId);
        }));
    }
    /**
     * Emit task update to all connected streams
     */
    emitTaskUpdate(eventType, data) {
        const event = {
            id: Date.now().toString(),
            type: eventType,
            timestamp: new Date().toISOString(),
            ...data
        };
        this.taskStreams.forEach(stream => {
            stream.next(event);
        });
    }
    /**
     * Clean up stale streams (older than 10 minutes)
     */
    cleanupStaleStreams() {
        const now = Date.now();
        const staleTimeout = 10 * 60 * 1000; // 10 minutes
        for (const [streamId, creationTime] of this.streamCreationTimes.entries()) {
            if (now - creationTime > staleTimeout) {
                const stream = this.taskStreams.get(streamId);
                if (stream) {
                    stream.complete(); // This will trigger the finalize operator
                }
                // Cleanup will be handled by the finalize operator
            }
        }
    }
    // AI Coder Coordination Endpoints
    async spawnAICoderInstance(body, headers, res) {
        try {
            // Delegate to AgentHub for AI coder spawning
            const response = await this.proxyService.proxyRequest('backend', '/api/agents/ai-coders/spawn', 'POST', headers, body);
            // Emit spawn event for AgentFederationIntegration tracking
            this.emitTaskUpdate('ai_coder_spawned', {
                agentType: body.agentType,
                agentId: response.data?.agentId,
                projectPath: body.projectPath,
                timestamp: new Date().toISOString()
            });
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Failed to spawn AI coder instance',
                error: errorMessage,
                agentType: body.agentType
            });
        }
    }
    async coordinateAICoders(body, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', '/api/agents/ai-coders/coordinate', 'POST', headers, body);
            // Emit coordination event for AgentFederationIntegration tracking
            this.emitTaskUpdate('ai_coder_coordination_started', {
                coordinationId: response.data?.coordinationId,
                strategy: body.coordination.strategy,
                taskType: body.type,
                agentCount: response.data?.assignedAgents?.length || 0,
                timestamp: new Date().toISOString()
            });
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'AI coder coordination failed',
                error: errorMessage,
            });
        }
    }
    async delegateTask(body, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', '/api/agents/ai-coders/delegate', 'POST', headers, body);
            // Emit delegation event for AgentFederationIntegration tracking
            this.emitTaskUpdate('ai_coder_task_delegated', {
                coordinationId: body.coordinationId,
                taskId: body.task.id,
                targetAgent: body.targetAgent,
                taskType: body.task.type,
                timestamp: new Date().toISOString()
            });
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Task delegation failed',
                error: errorMessage,
            });
        }
    }
    async getAICoderStatus(query, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', '/api/agents/ai-coders/status', 'GET', headers, undefined, query);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Failed to retrieve AI coder status',
                error: errorMessage,
            });
        }
    }
    async initiateCodeReview(body, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', '/api/agents/ai-coders/review', 'POST', headers, body);
            // Emit review event for AgentFederationIntegration tracking
            this.emitTaskUpdate('ai_coder_review_initiated', {
                taskId: body.taskId,
                reviewId: response.data?.reviewId,
                reviewerCount: body.reviewerIds?.length || 0,
                criteria: Object.keys(body.criteria || {}).filter(k => body.criteria[k]),
                timestamp: new Date().toISOString()
            });
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Code review initiation failed',
                error: errorMessage,
            });
        }
    }
    async initiateConsensusVoting(body, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', '/api/agents/ai-coders/consensus', 'POST', headers, body);
            // Emit consensus event for AgentFederationIntegration tracking
            this.emitTaskUpdate('ai_coder_consensus_initiated', {
                taskId: body.taskId,
                consensusId: response.data?.consensusId,
                solutionCount: body.solutions?.length || 0,
                voterCount: body.voters?.length || 0,
                threshold: body.threshold,
                timestamp: new Date().toISOString()
            });
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Consensus voting initiation failed',
                error: errorMessage,
            });
        }
    }
    async getCollaborationStatus(collaborationId, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', `/api/agents/ai-coders/collaboration/${collaborationId}/status`, 'GET', headers);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Failed to retrieve collaboration status',
                error: errorMessage,
                collaborationId
            });
        }
    }
    async stopAICoderInstance(agentId, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', `/api/agents/ai-coders/stop/${agentId}`, 'POST', headers);
            // Emit stop event for AgentFederationIntegration tracking
            this.emitTaskUpdate('ai_coder_stopped', {
                agentId,
                timestamp: new Date().toISOString()
            });
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Failed to stop AI coder instance',
                error: errorMessage,
                agentId
            });
        }
    }
    /**
     * Cleanup when controller is destroyed
     */
    onDestroy() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        // Close all active streams
        for (const [streamId, stream] of this.taskStreams.entries()) {
            stream.complete();
        }
        this.taskStreams.clear();
        this.streamCreationTimes.clear();
    }
};
exports.AgentFederationIntegrationGatewayController = AgentFederationIntegrationGatewayController;
__decorate([
    (0, common_1.Post)('execute-plan'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Execute a plan across multiple agents using AgentFederationIntegration-style orchestration',
        description: 'Executes a structured plan with workspace context and agent coordination'
    }),
    (0, swagger_1.ApiBody)({
        description: 'Plan execution request with context and workspace information',
        type: Object,
        schema: {
            type: 'object',
            properties: {
                planId: { type: 'string', description: 'Unique plan identifier' },
                context: { type: 'object', description: 'Execution context and variables' },
                workspace: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'Workspace root path' },
                        files: { type: 'array', items: { type: 'string' }, description: 'Selected files for context' },
                        metadata: { type: 'object', description: 'Workspace metadata' }
                    }
                },
                options: {
                    type: 'object',
                    properties: {
                        timeout: { type: 'number', description: 'Execution timeout in seconds' },
                        retries: { type: 'number', description: 'Number of retry attempts' },
                        parallel: { type: 'boolean', description: 'Execute plan steps in parallel' }
                    }
                }
            },
            required: ['planId']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plan execution completed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid plan request' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Plan not found' }),
    (0, swagger_1.ApiResponse)({ status: 502, description: 'AgentHub service unavailable' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentFederationIntegrationGatewayController.prototype, "executePlan", null);
__decorate([
    (0, common_1.Post)('execute-verification'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Execute verification comments using AgentFederationIntegration-style validation',
        description: 'Runs verification checks against specified criteria and files'
    }),
    (0, swagger_1.ApiBody)({
        description: 'Verification execution request',
        schema: {
            type: 'object',
            properties: {
                verificationId: { type: 'string', description: 'Verification identifier' },
                context: { type: 'object', description: 'Verification context' },
                targetFiles: { type: 'array', items: { type: 'string' }, description: 'Files to verify' },
                criteria: { type: 'object', description: 'Verification criteria' }
            },
            required: ['verificationId']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Verification executed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid verification request' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentFederationIntegrationGatewayController.prototype, "executeVerification", null);
__decorate([
    (0, common_1.Post)('execute-all-verifications'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Execute all verification comments in a batch',
        description: 'Runs all pending verifications with optional parallel execution'
    }),
    (0, swagger_1.ApiBody)({
        description: 'Batch verification execution request',
        schema: {
            type: 'object',
            properties: {
                context: { type: 'object', description: 'Global verification context' },
                parallel: { type: 'boolean', description: 'Execute verifications in parallel' },
                filters: { type: 'object', description: 'Verification filters' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'All verifications executed successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentFederationIntegrationGatewayController.prototype, "executeAllVerifications", null);
__decorate([
    (0, common_1.Post)('structured-prompt'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Send structured prompt with workspace context',
        description: 'Sends a context-aware structured prompt to the agent ecosystem'
    }),
    (0, swagger_1.ApiBody)({
        description: 'Structured prompt request with workspace context',
        schema: {
            type: 'object',
            properties: {
                prompt: { type: 'string', description: 'The structured prompt content' },
                workspace: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'Workspace path' },
                        files: { type: 'array', items: { type: 'string' }, description: 'Context files' },
                        context: { type: 'object', description: 'Workspace context data' }
                    }
                },
                metadata: { type: 'object', description: 'Additional metadata' },
                format: { type: 'string', enum: ['json', 'xml', 'yaml', 'markdown'], description: 'Response format' },
                streaming: { type: 'boolean', description: 'Enable streaming response' }
            },
            required: ['prompt']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Structured prompt processed successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentFederationIntegrationGatewayController.prototype, "sendStructuredPrompt", null);
__decorate([
    (0, common_1.Get)('agents/discover'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Discover available local AI agents with AgentFederationIntegration capabilities',
        description: 'Scans and returns available agents with their AgentFederationIntegration-specific capabilities'
    }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, description: 'Filter by agent type' }),
    (0, swagger_1.ApiQuery)({ name: 'capability', required: false, description: 'Filter by TRAYCER capability' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Filter by agent status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Available agents discovered successfully' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentFederationIntegrationGatewayController.prototype, "discoverAgents", null);
__decorate([
    (0, common_1.Post)('agents/:agentId/configure'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Configure agent with AgentFederationIntegration-specific settings',
        description: 'Applies AgentFederationIntegration configuration from local-ai-agents directory'
    }),
    (0, swagger_1.ApiParam)({ name: 'agentId', description: 'Agent identifier' }),
    (0, swagger_1.ApiBody)({
        description: 'Agent configuration',
        schema: {
            type: 'object',
            properties: {
                configPath: { type: 'string', description: 'Configuration file path' },
                settings: { type: 'object', description: 'TRAYCER-specific settings' },
                capabilities: { type: 'array', items: { type: 'string' }, description: 'Enabled capabilities' }
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
], AgentFederationIntegrationGatewayController.prototype, "configureAgent", null);
__decorate([
    (0, common_1.Get)('agents/:agentId/status'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get detailed agent status including AgentFederationIntegration metrics',
        description: 'Returns comprehensive agent status with AgentFederationIntegration-specific performance metrics'
    }),
    (0, swagger_1.ApiParam)({ name: 'agentId', description: 'Agent identifier' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agent status retrieved successfully' }),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentFederationIntegrationGatewayController.prototype, "getAgentStatus", null);
__decorate([
    (0, common_1.Post)('workflows/orchestrate'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Orchestrate complex multi-agent workflows',
        description: 'Coordinates multiple agents to execute complex workflows with dependencies'
    }),
    (0, swagger_1.ApiBody)({
        description: 'Workflow orchestration request',
        schema: {
            type: 'object',
            properties: {
                workflowId: { type: 'string', description: 'Workflow identifier' },
                agents: { type: 'array', items: { type: 'string' }, description: 'Participating agents' },
                tasks: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            agentId: { type: 'string' },
                            taskType: { type: 'string' },
                            payload: { type: 'object' },
                            dependencies: { type: 'array', items: { type: 'string' } }
                        }
                    }
                },
                options: {
                    type: 'object',
                    properties: {
                        parallel: { type: 'boolean' },
                        failFast: { type: 'boolean' },
                        retryPolicy: { type: 'object' }
                    }
                }
            },
            required: ['workflowId', 'agents', 'tasks']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workflow orchestration started successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentFederationIntegrationGatewayController.prototype, "orchestrateWorkflow", null);
__decorate([
    (0, common_1.Get)('workflows/:workflowId/status'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get workflow execution status and progress',
        description: 'Returns detailed status of workflow execution including task progress'
    }),
    (0, swagger_1.ApiParam)({ name: 'workflowId', description: 'Workflow identifier' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workflow status retrieved successfully' }),
    __param(0, (0, common_1.Param)('workflowId')),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentFederationIntegrationGatewayController.prototype, "getWorkflowStatus", null);
__decorate([
    (0, common_1.Post)('export/markdown'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Export AgentFederationIntegration data in Markdown format',
        description: 'Generates comprehensive Markdown export of agent interactions and results'
    }),
    (0, swagger_1.ApiBody)({
        description: 'Markdown export configuration',
        schema: {
            type: 'object',
            properties: {
                agentIds: { type: 'array', items: { type: 'string' } },
                dateRange: { type: 'object' },
                includeMetadata: { type: 'boolean' },
                template: { type: 'string', description: 'Markdown template to use' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Markdown export generated successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentFederationIntegrationGatewayController.prototype, "exportMarkdown", null);
__decorate([
    (0, common_1.Post)('export/json'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Export AgentFederationIntegration data in JSON format',
        description: 'Generates structured JSON export of agent interactions and results'
    }),
    (0, swagger_1.ApiBody)({
        description: 'JSON export configuration',
        schema: {
            type: 'object',
            properties: {
                agentIds: { type: 'array', items: { type: 'string' } },
                dateRange: { type: 'object' },
                includeMetadata: { type: 'boolean' },
                schema: { type: 'string', description: 'JSON schema version' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'JSON export generated successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentFederationIntegrationGatewayController.prototype, "exportJson", null);
__decorate([
    (0, common_1.Get)('workspace/context'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get workspace context for AgentFederationIntegration operations',
        description: 'Retrieves comprehensive workspace context including file structure and metadata'
    }),
    (0, swagger_1.ApiQuery)({ name: 'path', required: false, description: 'Workspace path to analyze' }),
    (0, swagger_1.ApiQuery)({ name: 'includeFiles', required: false, description: 'Include file contents in context' }),
    (0, swagger_1.ApiQuery)({ name: 'depth', required: false, description: 'Directory traversal depth' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workspace context retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentFederationIntegrationGatewayController.prototype, "getWorkspaceContext", null);
__decorate([
    (0, common_1.Get)('workspace/files'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get workspace file listing with AgentFederationIntegration integration',
        description: 'Returns workspace files with AgentFederationIntegration-aware metadata and selection capabilities'
    }),
    (0, swagger_1.ApiQuery)({ name: 'pattern', required: false, description: 'File pattern filter (glob)' }),
    (0, swagger_1.ApiQuery)({ name: 'recursive', required: false, description: 'Recursive directory search' }),
    (0, swagger_1.ApiQuery)({ name: 'includeHidden', required: false, description: 'Include hidden files' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workspace files retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentFederationIntegrationGatewayController.prototype, "getWorkspaceFiles", null);
__decorate([
    (0, common_1.Sse)('tasks/stream'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Stream real-time AgentFederationIntegration task updates via Server-Sent Events',
        description: 'Provides real-time updates on task execution, agent status, and workflow progress'
    }),
    (0, swagger_1.ApiQuery)({ name: 'agentId', required: false, description: 'Filter by specific agent ID' }),
    (0, swagger_1.ApiQuery)({ name: 'workflowId', required: false, description: 'Filter by specific workflow ID' }),
    (0, swagger_1.ApiQuery)({ name: 'eventTypes', required: false, description: 'Comma-separated list of event types to include' }),
    (0, swagger_1.ApiHeader)({ name: 'Last-Event-ID', description: 'Last received event ID for reconnection', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Task stream established successfully' }),
    __param(0, (0, common_1.Query)('agentId')),
    __param(1, (0, common_1.Query)('workflowId')),
    __param(2, (0, common_1.Query)('eventTypes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", rxjs_1.Observable)
], AgentFederationIntegrationGatewayController.prototype, "streamTaskUpdates", null);
__decorate([
    (0, common_1.Post)('ai-coders/spawn'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Spawn a new AI coder instance for multi-instance coordination',
        description: 'Creates a new AI coder agent (Claude, Copilot, Cursor, etc.) with specified capabilities and workspace context'
    }),
    (0, swagger_1.ApiBody)({
        description: 'AI coder spawn request',
        schema: {
            type: 'object',
            properties: {
                agentType: {
                    type: 'string',
                    enum: ['claude', 'copilot', 'cursor', 'cline', 'aider', 'continue', 'sourcegraph'],
                    description: 'Type of AI coder to spawn'
                },
                model: { type: 'string', description: 'Model version (e.g., claude-3.5-sonnet)' },
                version: { type: 'string', description: 'Agent version' },
                projectPath: { type: 'string', description: 'Absolute path to project directory' },
                specialization: {
                    type: 'string',
                    enum: ['frontend', 'backend', 'fullstack', 'ml', 'devops', 'mobile', 'data', 'security'],
                    description: 'Agent specialization'
                },
                capabilities: {
                    type: 'array',
                    items: {
                        type: 'string',
                        enum: ['code_generation', 'code_review', 'refactoring', 'testing', 'debugging', 'documentation', 'optimization', 'security_analysis']
                    },
                    description: 'Required capabilities'
                },
                workspace: {
                    type: 'object',
                    properties: {
                        branch: { type: 'string', description: 'Git branch to work on' },
                        contextFiles: { type: 'array', items: { type: 'string' }, description: 'Files to include in context' },
                        excludePatterns: { type: 'array', items: { type: 'string' }, description: 'Patterns to exclude' }
                    }
                },
                preferences: {
                    type: 'object',
                    properties: {
                        codeStyle: { type: 'string', description: 'Code style preference' },
                        testFramework: { type: 'string', description: 'Preferred test framework' },
                        languages: { type: 'array', items: { type: 'string' }, description: 'Primary languages' },
                        frameworks: { type: 'array', items: { type: 'string' }, description: 'Preferred frameworks' }
                    }
                },
                limits: {
                    type: 'object',
                    properties: {
                        maxTokens: { type: 'number', description: 'Maximum tokens per request' },
                        timeout: { type: 'number', description: 'Request timeout in seconds' },
                        rateLimit: {
                            type: 'object',
                            properties: {
                                requests: { type: 'number' },
                                window: { type: 'number' }
                            }
                        }
                    }
                },
                collaboration: {
                    type: 'object',
                    properties: {
                        allowPeerReview: { type: 'boolean', description: 'Allow peer reviews' },
                        allowConsensus: { type: 'boolean', description: 'Participate in consensus voting' },
                        trustLevel: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Trust level for collaboration' }
                    }
                }
            },
            required: ['agentType', 'projectPath', 'capabilities']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'AI coder instance spawned successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid spawn request' }),
    (0, swagger_1.ApiResponse)({ status: 502, description: 'Failed to spawn AI coder instance' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentFederationIntegrationGatewayController.prototype, "spawnAICoderInstance", null);
__decorate([
    (0, common_1.Post)('ai-coders/coordinate'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Coordinate multiple AI coders for collaborative task execution',
        description: 'Sets up multi-agent coordination for complex coding tasks with various strategies'
    }),
    (0, swagger_1.ApiBody)({
        description: 'AI coder coordination request',
        schema: {
            type: 'object',
            properties: {
                task: { type: 'string', description: 'Task description' },
                type: {
                    type: 'string',
                    enum: ['code_generation', 'code_review', 'refactoring', 'testing', 'debugging', 'documentation'],
                    description: 'Type of coding task'
                },
                requirements: {
                    type: 'object',
                    properties: {
                        functionality: { type: 'string', description: 'Required functionality' },
                        constraints: { type: 'array', items: { type: 'string' }, description: 'Implementation constraints' },
                        testCoverage: { type: 'number', description: 'Required test coverage percentage' },
                        documentation: { type: 'boolean', description: 'Require documentation' }
                    },
                    required: ['functionality']
                },
                context: {
                    type: 'object',
                    properties: {
                        files: { type: 'array', items: { type: 'string' }, description: 'Relevant files' },
                        language: { type: 'string', description: 'Programming language' },
                        framework: { type: 'string', description: 'Framework being used' },
                        priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Task priority' }
                    },
                    required: ['files', 'language', 'priority']
                },
                coordination: {
                    type: 'object',
                    properties: {
                        strategy: {
                            type: 'string',
                            enum: ['single', 'collaborative', 'voting', 'review_chain', 'specialized', 'consensus'],
                            description: 'Coordination strategy'
                        },
                        agentIds: { type: 'array', items: { type: 'string' }, description: 'Specific agents to use' },
                        specializations: {
                            type: 'array',
                            items: { type: 'string', enum: ['frontend', 'backend', 'fullstack', 'ml', 'devops'] },
                            description: 'Auto-select agents with these specializations'
                        },
                        requireReview: { type: 'boolean', description: 'Require peer review' },
                        consensusThreshold: { type: 'number', description: 'Consensus threshold (0-1)' }
                    },
                    required: ['strategy']
                },
                workspace: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'Workspace path' },
                        branch: { type: 'string', description: 'Git branch' },
                        gitCommit: { type: 'string', description: 'Current git commit' }
                    },
                    required: ['path']
                }
            },
            required: ['task', 'type', 'requirements', 'context', 'coordination', 'workspace']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Coordination plan created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid coordination request' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentFederationIntegrationGatewayController.prototype, "coordinateAICoders", null);
__decorate([
    (0, common_1.Post)('ai-coders/delegate'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Delegate a specific task to an AI coder agent',
        description: 'Assigns a task to a specific AI coder with dependency management'
    }),
    (0, swagger_1.ApiBody)({
        description: 'Task delegation request',
        schema: {
            type: 'object',
            properties: {
                coordinationId: { type: 'string', description: 'Coordination session ID' },
                task: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Task ID' },
                        type: { type: 'string', description: 'Task type' },
                        description: { type: 'string', description: 'Task description' },
                        priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
                    },
                    required: ['id', 'type', 'description']
                },
                targetAgent: { type: 'string', description: 'Target agent ID' },
                dependencies: { type: 'array', items: { type: 'string' }, description: 'Task dependencies' },
                deadline: { type: 'string', description: 'Task deadline (ISO 8601)' }
            },
            required: ['coordinationId', 'task', 'targetAgent']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Task delegated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid delegation request' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentFederationIntegrationGatewayController.prototype, "delegateTask", null);
__decorate([
    (0, common_1.Get)('ai-coders/status'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get status of AI coder agents',
        description: 'Returns comprehensive status information for AI coder agents including performance metrics'
    }),
    (0, swagger_1.ApiQuery)({ name: 'agentId', required: false, description: 'Specific agent ID to query' }),
    (0, swagger_1.ApiQuery)({ name: 'agentType', required: false, description: 'Filter by agent type (claude, copilot, etc.)' }),
    (0, swagger_1.ApiQuery)({ name: 'specialization', required: false, description: 'Filter by specialization' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Filter by status (idle, busy, offline)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'AI coder status retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentFederationIntegrationGatewayController.prototype, "getAICoderStatus", null);
__decorate([
    (0, common_1.Post)('ai-coders/review'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Initiate code review by AI coder agents',
        description: 'Requests code review from multiple AI coder agents with specified criteria'
    }),
    (0, swagger_1.ApiBody)({
        description: 'Code review request',
        schema: {
            type: 'object',
            properties: {
                taskId: { type: 'string', description: 'Associated task ID' },
                code: { type: 'string', description: 'Code to review' },
                files: { type: 'array', items: { type: 'string' }, description: 'Files to review' },
                reviewerIds: { type: 'array', items: { type: 'string' }, description: 'Specific reviewer agent IDs' },
                criteria: {
                    type: 'object',
                    properties: {
                        codeQuality: { type: 'boolean', description: 'Check code quality' },
                        security: { type: 'boolean', description: 'Security review' },
                        performance: { type: 'boolean', description: 'Performance review' },
                        maintainability: { type: 'boolean', description: 'Maintainability review' },
                        testCoverage: { type: 'boolean', description: 'Test coverage review' }
                    }
                },
                deadline: { type: 'string', description: 'Review deadline (ISO 8601)' }
            },
            required: ['taskId', 'code', 'files', 'criteria']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Code review initiated successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentFederationIntegrationGatewayController.prototype, "initiateCodeReview", null);
__decorate([
    (0, common_1.Post)('ai-coders/consensus'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Initiate consensus voting among AI coder agents',
        description: 'Starts a consensus voting process for multiple solutions from different AI coders'
    }),
    (0, swagger_1.ApiBody)({
        description: 'Consensus voting request',
        schema: {
            type: 'object',
            properties: {
                taskId: { type: 'string', description: 'Associated task ID' },
                solutions: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            agentId: { type: 'string', description: 'Agent who provided the solution' },
                            solution: { type: 'string', description: 'The solution code' },
                            rationale: { type: 'string', description: 'Explanation of the solution' }
                        },
                        required: ['agentId', 'solution']
                    },
                    description: 'Solutions to vote on'
                },
                voters: { type: 'array', items: { type: 'string' }, description: 'Agent IDs of voters' },
                threshold: { type: 'number', description: 'Consensus threshold (0-1)' },
                deadline: { type: 'string', description: 'Voting deadline (ISO 8601)' }
            },
            required: ['taskId', 'solutions', 'voters']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Consensus voting initiated successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentFederationIntegrationGatewayController.prototype, "initiateConsensusVoting", null);
__decorate([
    (0, common_1.Get)('ai-coders/collaboration/:collaborationId/status'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get status of AI coder collaboration session',
        description: 'Returns detailed status of ongoing collaboration including progress, conflicts, and results'
    }),
    (0, swagger_1.ApiParam)({ name: 'collaborationId', description: 'Collaboration session ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Collaboration status retrieved successfully' }),
    __param(0, (0, common_1.Param)('collaborationId')),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentFederationIntegrationGatewayController.prototype, "getCollaborationStatus", null);
__decorate([
    (0, common_1.Post)('ai-coders/stop/:agentId'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({
        summary: 'Stop an AI coder instance',
        description: 'Gracefully stops an AI coder instance and cleans up resources'
    }),
    (0, swagger_1.ApiParam)({ name: 'agentId', description: 'Agent ID to stop' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'AI coder instance stopped successfully' }),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentFederationIntegrationGatewayController.prototype, "stopAICoderInstance", null);
exports.AgentFederationIntegrationGatewayController = AgentFederationIntegrationGatewayController = __decorate([
    (0, common_1.Controller)('agentFederationIntegration'),
    (0, swagger_1.ApiTags)('AgentFederationIntegration'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [proxy_service_1.ProxyService])
], AgentFederationIntegrationGatewayController);
//# sourceMappingURL=agent-federation-integration-gateway.controller.js.map
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
var DACCController_1;
var _a, _b, _c, _d;
import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, BadRequestException, NotFoundException, Logger, Sse, UseGuards } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DACCOrchestratorService } from './orchestrator.service';
import { DACCStreamingService } from './streaming.service';
import { AgentFactory } from '../agents/agent.factory';
import { PrismaService } from '../modules/prisma/prisma.service';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { WorkflowPermissionGuard } from '../modules/auth/workflow-permission.guard';
import { validateAgentDefinition, validateWorkflowDefinition, validateSystemBlueprint } from '@the-new-fuse/types';
let DACCController = DACCController_1 = class DACCController {
    orchestratorService;
    streamingService;
    agentFactory;
    prismaService;
    logger = new Logger(DACCController_1.name);
    constructor(orchestratorService, streamingService, agentFactory, prismaService) {
        this.orchestratorService = orchestratorService;
        this.streamingService = streamingService;
        this.agentFactory = agentFactory;
        this.prismaService = prismaService;
    }
    /**
     * Create a new DACC agent from definition
     */
    async createAgent(request) {
        this.logger.log(`Creating DACC agent: ${request.agentDefinition.agent_name}`);
        // Validate agent definition
        const validation = validateAgentDefinition(request.agentDefinition);
        if (!validation.isValid) {
            throw new BadRequestException(validation.errors);
        }
        try {
            // Store agent definition in database
            const registeredEntity = await this.prismaService.registeredEntity.create({
                data: {
                    name: request.agentDefinition.agent_name,
                    type: 'AGENT',
                    description: request.agentDefinition.description,
                    config: request.agentDefinition,
                    status: 'ACTIVE',
                    capabilities: [], // Could be extracted from agent definition
                    isPublic: false
                }
            });
            // Create agent instance
            const agentInstance = await this.agentFactory.createDACCAgent(request.agentDefinition);
            return {
                success: true,
                agent: {
                    id: registeredEntity.id,
                    name: request.agentDefinition.agent_name,
                    status: agentInstance.status,
                    instance_id: agentInstance.id
                },
                message: 'Agent created successfully'
            };
        }
        catch (error) {
            this.logger.error(`Failed to create agent: ${error.message}`);
            throw new BadRequestException(`Failed to create agent: ${error.message}`);
        }
    }
    /**
     * Get all available agents
     */
    async getAgents() {
        const agents = await this.prismaService.registeredEntity.findMany({
            where: {
                type: 'AGENT',
                status: 'ACTIVE'
            },
            select: {
                id: true,
                name: true,
                description: true,
                config: true,
                capabilities: true,
                createdAt: true,
                updatedAt: true
            }
        });
        const activeAgents = this.agentFactory.getActiveAgents();
        return {
            success: true,
            agents: agents.map(agent => ({
                ...agent,
                isActive: activeAgents.some(active => active.id === agent.name),
                definition: agent.config
            }))
        };
    }
    /**
     * Get specific agent definition
     */
    async getAgent(name) {
        const agent = await this.prismaService.registeredEntity.findFirst({
            where: {
                name,
                type: 'AGENT',
                status: 'ACTIVE'
            }
        });
        if (!agent) {
            throw new NotFoundException(`Agent not found: ${name}`);
        }
        const activeInstance = this.agentFactory.getAgent(name);
        return {
            success: true,
            agent: {
                ...agent,
                isActive: !!activeInstance,
                instance_status: activeInstance?.status
            }
        };
    }
    /**
     * Create a new workflow definition
     */
    async createWorkflow(request) {
        this.logger.log(`Creating DACC workflow: ${request.workflowDefinition.workflow_name}`);
        // Validate workflow definition
        const validation = validateWorkflowDefinition(request.workflowDefinition);
        if (!validation.isValid) {
            throw new BadRequestException(validation.errors);
        }
        try {
            const workflow = await this.prismaService.workflow.create({
                data: {
                    name: request.workflowDefinition.workflow_name,
                    description: request.workflowDefinition.description,
                    definition: request.workflowDefinition,
                    status: 'ACTIVE'
                }
            });
            return {
                success: true,
                workflow: {
                    id: workflow.id,
                    name: workflow.name,
                    description: workflow.description,
                    status: workflow.status
                },
                message: 'Workflow created successfully'
            };
        }
        catch (error) {
            this.logger.error(`Failed to create workflow: ${error.message}`);
            throw new BadRequestException(`Failed to create workflow: ${error.message}`);
        }
    }
    /**
     * Get all workflows
     */
    async getWorkflows() {
        const workflows = await this.prismaService.workflow.findMany({
            where: {
                status: 'ACTIVE'
            },
            select: {
                id: true,
                name: true,
                description: true,
                definition: true,
                createdAt: true,
                updatedAt: true,
                executionCount: true
            }
        });
        return {
            success: true,
            workflows: workflows.map(workflow => ({
                ...workflow,
                definition: workflow.definition
            }))
        };
    }
    /**
     * Execute a workflow
     */
    async executeWorkflow(request) {
        let workflowDefinition;
        if (request.workflowDefinition) {
            // Use provided workflow definition
            workflowDefinition = request.workflowDefinition;
        }
        else if (request.workflowName) {
            // Load workflow definition from database
            const workflow = await this.prismaService.workflow.findFirst({
                where: {
                    name: request.workflowName,
                    status: 'ACTIVE'
                }
            });
            if (!workflow || !workflow.definition) {
                throw new NotFoundException(`Workflow not found: ${request.workflowName}`);
            }
            workflowDefinition = workflow.definition;
        }
        else {
            throw new BadRequestException('Either workflowName or workflowDefinition must be provided');
        }
        try {
            const executionId = await this.orchestratorService.executeWorkflow(workflowDefinition, request.input, request.sessionId);
            return {
                success: true,
                executionId,
                message: 'Workflow execution started',
                streamUrl: `/dacc/workflows/${executionId}/stream`
            };
        }
        catch (error) {
            this.logger.error(`Failed to execute workflow: ${error.message}`);
            throw new BadRequestException(`Failed to execute workflow: ${error.message}`);
        }
    }
    /**
     * Get workflow execution status
     */
    async getExecutionStatus(executionId) {
        const executionState = await this.orchestratorService.getExecutionStatus(executionId);
        if (!executionState) {
            throw new NotFoundException(`Execution not found: ${executionId}`);
        }
        return {
            success: true,
            execution: executionState
        };
    }
    /**
     * Cancel workflow execution
     */
    async cancelExecution(executionId) {
        const cancelled = await this.orchestratorService.cancelExecution(executionId);
        if (!cancelled) {
            throw new NotFoundException(`Execution not found or cannot be cancelled: ${executionId}`);
        }
        return {
            success: true,
            message: 'Execution cancelled successfully'
        };
    }
    /**
     * Server-Sent Events stream for workflow execution
     */
    streamWorkflowExecution(executionId) {
        this.logger.log(`SSE stream requested for execution: ${executionId}`);
        return this.streamingService.createSSEStream(executionId);
    }
    /**
     * Deploy a system blueprint (Genesis Layer)
     */
    async deploySystemBlueprint(request) {
        this.logger.log('Deploying system blueprint');
        // Validate system blueprint
        const validation = validateSystemBlueprint(request.blueprint);
        if (!validation.isValid) {
            throw new BadRequestException(validation.errors);
        }
        try {
            const results = {
                agents: [],
                workflow: null
            };
            // Create all new agents
            for (const agentDefinition of request.blueprint.new_agents_to_create) {
                try {
                    const registeredEntity = await this.prismaService.registeredEntity.create({
                        data: {
                            name: agentDefinition.agent_name,
                            type: 'AGENT',
                            description: agentDefinition.description,
                            config: agentDefinition,
                            status: 'ACTIVE',
                            capabilities: [],
                            isPublic: false
                        }
                    });
                    results.agents.push({
                        id: registeredEntity.id,
                        name: agentDefinition.agent_name,
                        status: 'created'
                    });
                }
                catch (error) {
                    this.logger.warn(`Failed to create agent ${agentDefinition.agent_name}: ${error.message}`);
                    results.agents.push({
                        name: agentDefinition.agent_name,
                        status: 'failed',
                        error: error.message
                    });
                }
            }
            // Create the workflow
            try {
                const workflow = await this.prismaService.workflow.create({
                    data: {
                        name: request.blueprint.workflow.workflow_name,
                        description: request.blueprint.workflow.description,
                        definition: request.blueprint.workflow,
                        status: 'ACTIVE'
                    }
                });
                results.workflow = {
                    id: workflow.id,
                    name: workflow.name,
                    status: 'created'
                };
            }
            catch (error) {
                this.logger.error(`Failed to create workflow: ${error.message}`);
                results.workflow = {
                    name: request.blueprint.workflow.workflow_name,
                    status: 'failed',
                    error: error.message
                };
            }
            return {
                success: true,
                results,
                message: 'System blueprint deployed'
            };
        }
        catch (error) {
            this.logger.error(`Failed to deploy system blueprint: ${error.message}`);
            throw new BadRequestException(`Failed to deploy system blueprint: ${error.message}`);
        }
    }
    /**
     * Get system health and configuration
     */
    async getHealth() {
        const activeAgents = this.agentFactory.getActiveAgents();
        const factoryConfig = this.agentFactory.getFactoryConfig();
        const orchestratorConfig = this.orchestratorService.getOrchestratorConfig();
        return {
            success: true,
            status: 'healthy',
            agents: {
                active: activeAgents.length,
                maxConcurrent: factoryConfig.max_concurrent_agents
            },
            orchestrator: {
                maxConcurrentWorkflows: orchestratorConfig.max_concurrent_workflows,
                stepTimeoutMs: orchestratorConfig.step_timeout_ms,
                streamingEnabled: orchestratorConfig.stream_events
            },
            timestamp: new Date().toISOString()
        };
    }
};
__decorate([
    Post('agents'),
    UseGuards(JwtAuthGuard),
    HttpCode(HttpStatus.CREATED),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DACCController.prototype, "createAgent", null);
__decorate([
    Get('agents'),
    UseGuards(JwtAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DACCController.prototype, "getAgents", null);
__decorate([
    Get('agents/:name'),
    UseGuards(JwtAuthGuard),
    __param(0, Param('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DACCController.prototype, "getAgent", null);
__decorate([
    Post('workflows'),
    UseGuards(JwtAuthGuard),
    HttpCode(HttpStatus.CREATED),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DACCController.prototype, "createWorkflow", null);
__decorate([
    Get('workflows'),
    UseGuards(JwtAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DACCController.prototype, "getWorkflows", null);
__decorate([
    Post('workflows/execute'),
    UseGuards(JwtAuthGuard, WorkflowPermissionGuard),
    HttpCode(HttpStatus.ACCEPTED),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DACCController.prototype, "executeWorkflow", null);
__decorate([
    Get('workflows/:executionId'),
    UseGuards(JwtAuthGuard),
    __param(0, Param('executionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DACCController.prototype, "getExecutionStatus", null);
__decorate([
    Post('workflows/:executionId/cancel'),
    UseGuards(JwtAuthGuard),
    HttpCode(HttpStatus.OK),
    __param(0, Param('executionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DACCController.prototype, "cancelExecution", null);
__decorate([
    Sse('workflows/:executionId/stream'),
    __param(0, Param('executionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Observable)
], DACCController.prototype, "streamWorkflowExecution", null);
__decorate([
    Post('blueprints/deploy'),
    UseGuards(JwtAuthGuard),
    HttpCode(HttpStatus.CREATED),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DACCController.prototype, "deploySystemBlueprint", null);
__decorate([
    Get('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DACCController.prototype, "getHealth", null);
DACCController = DACCController_1 = __decorate([
    Controller('dacc'),
    __metadata("design:paramtypes", [typeof (_a = typeof DACCOrchestratorService !== "undefined" && DACCOrchestratorService) === "function" ? _a : Object, typeof (_b = typeof DACCStreamingService !== "undefined" && DACCStreamingService) === "function" ? _b : Object, typeof (_c = typeof AgentFactory !== "undefined" && AgentFactory) === "function" ? _c : Object, typeof (_d = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _d : Object])
], DACCController);
export { DACCController };
//# sourceMappingURL=dacc.controller.js.map
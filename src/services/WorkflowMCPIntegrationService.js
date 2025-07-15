var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { MCPBrokerService } from '../mcp/services/mcp-broker.service.tsx';
import { WorkflowMonitoringService } from './WorkflowMonitoringService.js';
import { Logger } from '../common/logger.service.js';
let WorkflowMCPIntegrationService = class WorkflowMCPIntegrationService {
    mcpBroker;
    workflowMonitor;
    logger;
    constructor(mcpBroker, workflowMonitor, logger) {
        this.mcpBroker = mcpBroker;
        this.workflowMonitor = workflowMonitor;
        this.logger = logger;
    }
    async getAvailableMCPTools() {
        try {
            const tools = await this.mcpBroker.getAllTools();
            return Object.entries(tools).map(([name, tool]) => ({
                name,
                description: tool.description || '',
                capabilities: tool.capabilities || [],
                parameters: tool.parameters
            }));
        }
        catch (error) {
            this.logger.error('Error getting MCP tools:', error);
            return [];
        }
    }
    async executeMCPTool(workflowId, toolName, params) {
        try {
            await this.workflowMonitor.trackWorkflowExecution(workflowId, {
                type: 'TOOL_EXECUTION_START',
                tool: toolName,
                params
            });
            const result = await this.mcpBroker.executeDirective('mcp', toolName, params, {
                metadata: {
                    workflowId,
                    timestamp: Date.now()
                }
            });
            await this.workflowMonitor.trackWorkflowExecution(workflowId, {
                type: 'TOOL_EXECUTION_COMPLETE',
                tool: toolName,
                result
            });
            return result;
        }
        catch (error) {
            await this.workflowMonitor.trackWorkflowExecution(workflowId, {
                type: 'TOOL_EXECUTION_FAILED',
                tool: toolName,
                error: error.message
            });
            throw error;
        }
    }
    async validateToolCompatibility(toolName, requiredCapabilities) {
        const tools = await this.getAvailableMCPTools();
        const tool = tools.find(t => t.name === toolName);
        if (!tool)
            return false;
        return requiredCapabilities.every(cap => tool.capabilities.includes(cap));
    }
    async registerWorkflowAsAgent(workflowId, capabilities) {
        try {
            await this.mcpBroker.executeDirective('agent', 'registerAgent', {
                id: `workflow-${workflowId}`,
                name: `Workflow ${workflowId}`,
                capabilities,
                metadata: {
                    type: 'workflow',
                    workflowId
                }
            });
            this.logger.info(`Registered workflow ${workflowId} as MCP agent`);
        }
        catch (error) {
            this.logger.error(`Error registering workflow as agent:`, error);
            throw error;
        }
    }
    async subscribeToToolEvents(workflowId, callback) {
        await this.workflowMonitor.subscribeToWorkflow(workflowId, callback);
    }
    async unsubscribeFromToolEvents(workflowId) {
        await this.workflowMonitor.unsubscribeFromWorkflow(workflowId);
    }
};
WorkflowMCPIntegrationService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [MCPBrokerService,
        WorkflowMonitoringService,
        Logger])
], WorkflowMCPIntegrationService);
export { WorkflowMCPIntegrationService };

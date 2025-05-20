import { Injectable } from '@nestjs/common';
import { MCPBrokerService } from '../mcp/services/mcp-broker.service.js';
import { WorkflowMonitoringService } from './WorkflowMonitoringService.js';
import { Logger } from '../common/logger.service.js';

interface MCPToolDefinition {
  name: string;
  description: string;
  capabilities: string[];
  parameters?: Record<string, unknown>;
}

@Injectable()
export class WorkflowMCPIntegrationService {
  constructor(
    private readonly mcpBroker: MCPBrokerService,
    private readonly workflowMonitor: WorkflowMonitoringService,
    private readonly logger: Logger
  ) {}

  async getAvailableMCPTools(): Promise<MCPToolDefinition[]> {
    try {
      const tools = await this.mcpBroker.getAllTools();
      return Object.entries(tools).map(([name, tool]: [string, any]) => ({
        name,
        description: tool.description || '',
        capabilities: tool.capabilities || [],
        parameters: tool.parameters
      }));
    } catch (error) {
      this.logger.error('Error getting MCP tools:', error);
      return [];
    }
  }

  async executeMCPTool(
    workflowId: string,
    toolName: string,
    params: Record<string, unknown>
  ): Promise<any> {
    try {
      await this.workflowMonitor.trackWorkflowExecution(workflowId, {
        type: 'TOOL_EXECUTION_START',
        tool: toolName,
        params
      });

      const result = await this.mcpBroker.executeDirective(
        'mcp',
        toolName,
        params,
        {
          metadata: {
            workflowId,
            timestamp: Date.now()
          }
        }
      );

      await this.workflowMonitor.trackWorkflowExecution(workflowId, {
        type: 'TOOL_EXECUTION_COMPLETE',
        tool: toolName,
        result
      });

      return result;
    } catch (error) {
      await this.workflowMonitor.trackWorkflowExecution(workflowId, {
        type: 'TOOL_EXECUTION_FAILED',
        tool: toolName,
        error: error.message
      });
      throw error;
    }
  }

  async validateToolCompatibility(
    toolName: string,
    requiredCapabilities: string[]
  ): Promise<boolean> {
    const tools = await this.getAvailableMCPTools();
    const tool = tools.find(t => t.name === toolName);
    
    if (!tool) return false;
    
    return requiredCapabilities.every(cap => 
      tool.capabilities.includes(cap)
    );
  }

  async registerWorkflowAsAgent(
    workflowId: string,
    capabilities: string[]
  ): Promise<void> {
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
    } catch (error) {
      this.logger.error(`Error registering workflow as agent:`, error);
      throw error;
    }
  }

  async subscribeToToolEvents(
    workflowId: string,
    callback: (event: any) => void
  ): Promise<void> {
    await this.workflowMonitor.subscribeToWorkflow(workflowId, callback);
  }

  async unsubscribeFromToolEvents(workflowId: string): Promise<void> {
    await this.workflowMonitor.unsubscribeFromWorkflow(workflowId);
  }
}
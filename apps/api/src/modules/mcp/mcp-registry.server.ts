import { Injectable, Logger } from '@nestjs/common';
import { MCPMessage, MCPTool, parseMCPMessage, createMCPResponse, createMCPError } from '@the-new-fuse/types';
import { MCPRegistryService } from './mcp-registry.service';

@Injectable()
export class MCPRegistryServer {
  private readonly logger = new Logger(MCPRegistryServer.name);

  constructor(
    private readonly registryService: MCPRegistryService
  ) {}

  async handleMessage(message: string): Promise<string> {
    try {
      const mcpMessage = parseMCPMessage(message);
      const response = await this.processMessage(mcpMessage);
      return JSON.stringify(response);
    } catch (error) {
      this.logger.error('Error handling MCP message:', error);
      const errorResponse = createMCPError(
        'unknown',
        { code: -1, message: `Error processing message: ${error instanceof Error ? error.message : 'Unknown error'}` }
      );
      return JSON.stringify(errorResponse);
    }
  }

  private async processMessage(message: MCPMessage): Promise<MCPMessage> {
    const { id, data } = message;
    const { method, params } = data as { method: string, params: any };

    try {
      switch (method) {
        case 'agent.register':
          const agent = await this.registryService.registerAgent(params as any);
          return createMCPResponse(id, agent);

        case 'agent.get':
          const retrievedAgent = await this.registryService.getAgentById(params?.id as string);
          return createMCPResponse(id, retrievedAgent);

        case 'agent.update':
          const updatedAgent = await this.registryService.updateAgentProfile(
            params?.id as string,
            params?.updates as any
          );
          return createMCPResponse(id, updatedAgent);

        case 'agent.delete':
          const deleteResult = await this.registryService.deleteAgent(params?.id as string);
          return createMCPResponse(id, { success: deleteResult });

        case 'agent.list':
          const agents = await this.registryService.listAgents();
          return createMCPResponse(id, agents);

        case 'entity.register':
          const entity = await this.registryService.registerEntity(params as any);
          return createMCPResponse(id, entity);

        case 'entity.get':
          const retrievedEntity = await this.registryService.getEntityById(params?.id as string);
          return createMCPResponse(id, retrievedEntity);

        case 'entity.update':
          const updatedEntity = await this.registryService.updateEntity(
            params?.id as string,
            params?.updates as any
          );
          return createMCPResponse(id, updatedEntity);

        case 'entity.delete':
          const entityDeleteResult = await this.registryService.deleteEntity(params?.id as string);
          return createMCPResponse(id, { success: entityDeleteResult });

        case 'entity.list':
          const entities = await this.registryService.listEntities();
          return createMCPResponse(id, entities);

        case 'tools.list':
          const tools = this.getAvailableTools();
          return createMCPResponse(id, tools);

        default:
          return createMCPError(id, { code: -32601, message: `Method not found: ${method}` });
      }
    } catch (error) {
      this.logger.error(`Error processing method ${method}:`, error);
      return createMCPError(
        id,
        { code: -32603, message: `Internal error processing ${method}: ${error instanceof Error ? error.message : 'Unknown error'}` }
      );
    }
  }

  private getAvailableTools(): MCPTool[] {
    return [
      {
        name: 'agent.register',
        description: 'Register a new agent in the system',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
            capabilities: { type: 'array', items: { type: 'string' } }
          },
          required: ['name', 'type']
        }
      },
      {
        name: 'agent.get',
        description: 'Get agent by ID',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          },
          required: ['id']
        }
      },
      {
        name: 'entity.register',
        description: 'Register a new entity in the system',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
            description: { type: 'string' }
          },
          required: ['name', 'type']
        }
      }
    ];
  }
}

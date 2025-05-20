import { PrismaClient } from '@prisma/client';
import { MCPBrokerService } from '../mcp/services/mcp-broker.service.js';
import { AgentCapabilityDiscoveryService } from '../services/AgentCapabilityDiscoveryService.js';
import { Logger } from '../common/logger.service.js';
import { AgentType, AgentStatus } from '@prisma/client';

/**
 * Script to register Augment as an AI Agent in the database
 * and make available all MCP tools it has access to.
 *
 * This serves as the standard discovery protocol for all new agents.
 */
async function registerAugmentAgent(): Promise<void> {
  const prisma = new PrismaClient();
  const logger = new Logger('register-augment');

  try {
    // Initialize services
    const mcpBroker = new MCPBrokerService(prisma, logger);
    const capabilityDiscovery = new AgentCapabilityDiscoveryService(
      mcpBroker,
      prisma,
      null as any, // EventEmitter not needed for registration
      logger
    );

    // Register core agent
    const agent = await prisma.agent.create({
      data: {
        name: 'Augment',
        type: AgentType.AUGMENT,
        status: AgentStatus.ACTIVE,
        metadata: {
          version: '1.0.0',
          description: 'Augment AI Agent with MCP integration',
          initialization: Date.now()
        }
      }
    });

    logger.info('Created Augment agent record:', agent.id);

    // Get available MCP tools
    const tools = await getMCPTools();

    // Register capabilities
    for (const toolGroup of Object.values(tools)) {
      for (const tool of toolGroup as any[]) {
        await capabilityDiscovery.registerAgentCapability(agent.id, {
          name: tool.name,
          description: tool.description,
          version: '1.0.0',
          parameters: tool.parameters || {},
          metadata: {
            capabilities: tool.capabilities,
            isCoreTool: true
          }
        });

        logger.info(`Registered capability: ${tool.name}`);
      }
    }

    // Register with MCP broker
    await mcpBroker.executeDirective('agent', 'registerAgent', {
      id: agent.id,
      name: agent.name,
      type: agent.type,
      capabilities: Object.values(tools).flat().map((t: any) => t.name),
      metadata: agent.metadata
    });

    logger.info('Successfully registered Augment agent with MCP broker');

    // Validate registration
    const registeredCapabilities = await capabilityDiscovery.getAgentCapabilities(agent.id);
    if (registeredCapabilities.length === 0) {
      throw new Error('No capabilities were registered for the agent');
    }

    logger.info(`Registered ${registeredCapabilities.length} capabilities successfully`);

  } catch (error) {
    logger.error('Failed to register Augment agent:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get all available MCP tools
 */
async function getMCPTools(): Promise<Record<string, any[]>> {
  try {
    return {
      core_tools: [
        {
          name: 'file-system',
          description: 'Access and manipulate files and directories',
          capabilities: ['file_access', 'file_write'],
          parameters: {
            path: { type: 'string', required: true },
            operation: { type: 'string', enum: ['read', 'write', 'delete'] }
          }
        },
        {
          name: 'shell-executor',
          description: 'Execute shell commands securely',
          capabilities: ['command_execution'],
          parameters: {
            command: { type: 'string', required: true },
            workingDir: { type: 'string' },
            timeout: { type: 'number' }
          }
        },
        {
          name: 'http-client',
          description: 'Make HTTP requests',
          capabilities: ['http_requests'],
          parameters: {
            url: { type: 'string', required: true },
            method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
            headers: { type: 'object' },
            body: { type: 'any' }
          }
        }
      ],
      analysis_tools: [
        {
          name: 'code-analyzer',
          description: 'Analyze code structure and dependencies',
          capabilities: ['code_analysis'],
          parameters: {
            source: { type: 'string', required: true },
            language: { type: 'string' },
            rules: { type: 'array' }
          }
        },
        {
          name: 'type-checker',
          description: 'Perform type checking and validation',
          capabilities: ['type_checking'],
          parameters: {
            code: { type: 'string', required: true },
            tsConfig: { type: 'object' }
          }
        }
      ],
      database_tools: [
        {
          name: 'postgres-client',
          description: 'Execute PostgreSQL queries',
          capabilities: ['database_access'],
          parameters: {
            query: { type: 'string', required: true },
            params: { type: 'array' }
          }
        },
        {
          name: 'vector-db',
          description: 'Access vector database for embeddings',
          capabilities: ['vector_search'],
          parameters: {
            embedding: { type: 'array', required: true },
            collection: { type: 'string' },
            limit: { type: 'number' }
          }
        }
      ],
      integration_tools: [
        {
          name: 'github-api',
          description: 'Interact with GitHub API',
          capabilities: ['github_integration'],
          parameters: {
            endpoint: { type: 'string', required: true },
            token: { type: 'string', required: true }
          }
        },
        {
          name: 'vscode-extension',
          description: 'Interface with VS Code extension API',
          capabilities: ['vscode_integration'],
          parameters: {
            command: { type: 'string', required: true },
            args: { type: 'array' }
          }
        }
      ],
      memory_tools: [
        {
          name: 'context-memory',
          description: 'Store and retrieve conversation context',
          capabilities: ['memory_management'],
          parameters: {
            operation: { type: 'string', enum: ['get', 'set', 'update'] },
            key: { type: 'string', required: true },
            value: { type: 'any' }
          }
        },
        {
          name: 'knowledge-base',
          description: 'Access structured knowledge base',
          capabilities: ['knowledge_access'],
          parameters: {
            query: { type: 'string', required: true },
            filters: { type: 'object' }
          }
        }
      ]
    };
  } catch (error) {
    console.error('Error getting MCP tools:', error);
    return {};
  }
}

// Execute the registration if this script is run directly
if (require.main === module) {
  registerAugmentAgent()
    .then(() => {
      console.log('Augment Agent registration complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Augment Agent registration failed:', error);
      process.exit(1);
    });
}

export { registerAugmentAgent, getMCPTools };

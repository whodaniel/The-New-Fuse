import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';

import { MCPServer, MCPServerOptions } from './MCPServer.tsx';

const agentCapabilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  parameters: z.record(z.string(), z.unknown()).optional(),
  returns: z.record(z.string(), z.unknown()).optional(),
});

const messageSchema = z.object({
  sender: z.string(),
  recipient: z.string().optional(),
  type: z.enum(['broadcast', 'direct']),
  content: z.any(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Simple API Tool Registrar - placeholder implementation
 */
class APIToolRegistrar {
  async register(_agentId: string, _apiSpec: unknown): Promise<void> {
    // Placeholder implementation
  }
}

/**
 * Simple API Validator - placeholder implementation
 */
class AgentAPIValidator {
  validate(_apiSpec: unknown): boolean {
    return true;
  }
}

/**
 * Simple Agent Service interface for capability registration
 */
interface AgentServiceInterface {
  registerCapability(capability: unknown): Promise<{ id: string; [key: string]: unknown }>;
}

@Injectable()
export class MCPAgentServer extends MCPServer {
  private apiToolRegistrar: APIToolRegistrar;
  private apiValidator: AgentAPIValidator;
  protected logger: Logger;

  constructor(
    options: MCPServerOptions = {},
    private readonly agentService?: AgentServiceInterface
  ) {
    super({
      ...options,
      capabilities: {
        ...options.capabilities,
        registerCapability: {
          description: 'Register new agent capability',
          parameters: agentCapabilitySchema,
          execute: async (capability: unknown) =>
            this.registerNewCapability(capability as z.infer<typeof agentCapabilitySchema>),
        },
        sendMessage: {
          description: 'Send message between agents',
          parameters: messageSchema,
          execute: async (message: unknown) => this.routeAgentMessage(message),
        },
        discoverAgents: {
          description: 'Discover available agents',
          parameters: z.object({
            filter: z.record(z.string(), z.unknown()).optional(),
          }),
          execute: async (params: unknown) => this.discoverAgents(params),
        },
      },
    });
    this.apiToolRegistrar = new APIToolRegistrar();
    this.apiValidator = new AgentAPIValidator();
    this.logger = new Logger(MCPAgentServer.name);
  }

  async registerNewCapability(
    capability: z.infer<typeof agentCapabilitySchema>
  ): Promise<{ success: boolean; capabilityId: string }> {
    try {
      await this.validateCapability(capability);
      const registeredCap = this.agentService
        ? await this.agentService.registerCapability(capability)
        : { id: capability.id };
      await this.notifyCapabilityUpdate(registeredCap);
      return { success: true, capabilityId: registeredCap.id };
    } catch (error) {
      this.logger.error(
        `Error registering capability: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  async registerAgentAPI(agentId: string, apiSpec: unknown): Promise<void> {
    this.logger.log(`Registering API for agent ${agentId}`);
    await this.apiToolRegistrar.register(agentId, apiSpec);
  }

  // Placeholder methods for missing implementations
  async routeAgentMessage(_message: unknown): Promise<{ status: string; messageId: string }> {
    return { status: 'sent', messageId: 'mock-msg-id' };
  }

  async discoverAgents(_params: unknown): Promise<unknown[]> {
    return [];
  }

  async broadcastMessage(_msg: unknown): Promise<void> {
    // mock broadcast
  }

  private async validateCapability(capability: unknown): Promise<void> {
    const result = agentCapabilitySchema.safeParse(capability);
    if (!result.success) {
      throw new Error(`Invalid capability schema: ${result.error}`);
    }
  }

  private async notifyCapabilityUpdate(capability: unknown): Promise<void> {
    await this.broadcastMessage({
      type: 'capability_update',
      content: capability,
      timestamp: Date.now(),
    });
  }
}

import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MCPServer } from './MCPServer.js';
import { AgentService } from '../agents/agent.service.js';
import { APIToolRegistrar } from './APIToolRegistrar.js';
import { AgentAPIValidator } from './AgentAPIValidator.js';

const agentCapabilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  parameters: z.record(z.unknown()).optional(),
  returns: z.record(z.unknown()).optional()
});

const messageSchema = z.object({
  sender: z.string(),
  recipient: z.string().optional(),
  type: z.enum(["broadcast", "direct"]),
  content: z.any(),
  metadata: z.record(z.string(), z.any()).optional()
});

@Injectable()
export class MCPAgentServer extends MCPServer {
  private apiToolRegistrar: APIToolRegistrar;
  private apiValidator: AgentAPIValidator;

  constructor(
    private readonly agentService: AgentService,
    options: MCPServerOptions = {}
  ) {
    super({
      ...options,
      capabilities: {
        ...options.capabilities,
        registerCapability: {
          description: "Register new agent capability",
          parameters: agentCapabilitySchema,
          execute: async (capability) => this.registerNewCapability(capability)
        },
        sendMessage: {
          description: "Send message between agents",
          parameters: messageSchema,
          execute: async (message) => this.routeAgentMessage(message)
        },
        discoverAgents: {
          description: "Discover available agents",
          parameters: z.object({
            filter: z.record(z.unknown()).optional()
          }),
          execute: async (params) => this.discoverAgents(params)
        }
      }
    });
    this.apiToolRegistrar = new APIToolRegistrar();
    this.apiValidator = new AgentAPIValidator();
  }

  async registerNewCapability(
    capability: z.infer<typeof agentCapabilitySchema>
  ): Promise<{ success: boolean; capabilityId: string }> {
    try {
      await this.validateCapability(capability);
      const registeredCap = await this.agentService.registerCapability(capability);
      await this.notifyCapabilityUpdate(registeredCap);
      return { success: true, capabilityId: registeredCap.id };
    } catch (error) {
      this.logger.error(`Error registering capability: ${error.message}`);
      throw error;
    }
  }

  private async validateCapability(capability: any): Promise<void> {
    const result = agentCapabilitySchema.safeParse(capability);
    if (!result.success) {
      throw new Error(`Invalid capability schema: ${result.error}`);
    }
  }

  private async notifyCapabilityUpdate(capability: any): Promise<void> {
    await this.broadcastMessage({
      type: 'capability_update',
      content: capability,
      timestamp: Date.now()
    });
  }
}

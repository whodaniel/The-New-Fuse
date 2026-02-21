import { MCPMessageSchema, MCPConfig } from '../config/mcp.config.js';
import { EventEmitter } from 'events';

export class MCPHandler extends EventEmitter {
  private static instance: MCPHandler;
  private agentRegistry: Map<string, Set<string>> = new Map();

  private constructor() {
    super();
  }

  static getInstance(): MCPHandler {
    if (!MCPHandler.instance) {
      MCPHandler.instance = new MCPHandler();
    }
    return MCPHandler.instance;
  }

  async handleMessage(message: unknown) {
    try {
      const validatedMessage = MCPMessageSchema.parse(message);
      const { source, target, context } = validatedMessage;

      if (!this.agentRegistry.has(target)) {
        throw new Error(`Target agent ${target} not registered`);
      }

      this.emit('message', validatedMessage);
      return {
        success: true,
        correlationId: context.metadata.correlationId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  registerAgent(agentId: string, capabilities: string[]) {
    this.agentRegistry.set(agentId, new Set(capabilities));
    this.emit('agent:registered', { agentId, capabilities });
  }

  unregisterAgent(agentId: string) {
    this.agentRegistry.delete(agentId);
    this.emit('agent:unregistered', { agentId });
  }

  getAgentCapabilities(agentId: string): string[] | null {
    const capabilities = this.agentRegistry.get(agentId);
    return capabilities ? Array.from(capabilities) : null;
  }

  validateMessageSize(message: unknown): boolean {
    const size = new TextEncoder().encode(JSON.stringify(message)).length;
    return size <= MCPConfig.validation.maxPayloadSize;
  }
}
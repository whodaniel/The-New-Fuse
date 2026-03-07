/**
 * Protocol Bridge - Multi-Protocol Communication Layer
 *
 * Enables agents to communicate using multiple protocols:
 * - A2A (Agent-to-Agent) Protocol v0.3.0
 * - MCP (Model Context Protocol)
 * - Custom TNF protocols
 *
 * CONNECTS TO:
 * - UniversalBridge: For transport abstraction
 * - A2A types: From @the-new-fuse/a2a-core
 * - MCP Server: For tool registration
 */

import { BaseBridge, MessageType, Priority } from './index';

// ============================================================
// A2A PROTOCOL TYPES (aligned with v0.3.0)
// ============================================================

export interface A2AAgentCard {
  id: string;
  name: string;
  description: string;
  version: string;
  capabilities: string[];
  protocols: string[];
  endpoints: {
    primary: string;
    fallback?: string;
  };
  authentication?: {
    type: 'bearer' | 'api-key' | 'oauth2' | 'none';
    credentials?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface A2AMessage {
  id: string;
  type: 'request' | 'response' | 'notification' | 'error';
  protocol: 'a2a' | 'mcp' | 'tnf';
  version: string;
  from: string; // Agent ID
  to: string; // Agent ID or 'broadcast'
  timestamp: Date;
  payload: {
    action: string;
    data: unknown;
    context?: Record<string, unknown>;
  };
  correlation?: {
    requestId?: string;
    conversationId?: string;
    parentId?: string;
  };
  security?: {
    signature?: string;
    encrypted?: boolean;
    publicKey?: string;
  };
}

export interface A2ATask {
  id: string;
  name: string;
  description: string;
  requiredCapabilities: string[];
  input: unknown;
  timeout?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  dependencies?: string[];
}

export interface A2ATaskResult {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  output?: unknown;
  error?: string;
  metrics?: {
    startTime: Date;
    endTime?: Date;
    tokensUsed?: number;
    toolCalls?: number;
  };
}

// ============================================================
// MCP PROTOCOL TYPES
// ============================================================

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  mimeType?: string;
  description?: string;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

// ============================================================
// PROTOCOL BRIDGE CONFIGURATION
// ============================================================

export interface ProtocolBridgeConfig {
  agentId: string;
  agentName?: string;
  supportedProtocols: ('a2a' | 'mcp' | 'tnf')[];
  defaultProtocol: 'a2a' | 'mcp' | 'tnf';
  mcpServerUrl?: string;
  a2aEndpoint?: string;
  enableDiscovery?: boolean;
  discoveryInterval?: number;
}

const DEFAULT_CONFIG: Partial<ProtocolBridgeConfig> = {
  supportedProtocols: ['a2a', 'mcp', 'tnf'],
  defaultProtocol: 'a2a',
  enableDiscovery: true,
  discoveryInterval: 60000,
};

// ============================================================
// PROTOCOL BRIDGE IMPLEMENTATION
// ============================================================

export class ProtocolBridge extends BaseBridge {
  private config: ProtocolBridgeConfig;

  // Agent registry
  private knownAgents: Map<string, A2AAgentCard> = new Map();
  private myAgentCard: A2AAgentCard;

  // MCP components
  private mcpTools: Map<string, MCPTool> = new Map();
  private mcpResources: Map<string, MCPResource> = new Map();
  private mcpPrompts: Map<string, MCPPrompt> = new Map();

  // Message handling
  private messageHandlers: Map<string, (message: A2AMessage) => Promise<void>> = new Map();
  private pendingRequests: Map<
    string,
    {
      resolve: (value: A2AMessage) => void;
      reject: (error: Error) => void;
      timeout: ReturnType<typeof setTimeout>;
    }
  > = new Map();

  // Discovery
  private discoveryInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: ProtocolBridgeConfig) {
    super(`protocol-bridge-${config.agentId}`);
    this.config = { ...DEFAULT_CONFIG, ...config } as ProtocolBridgeConfig;

    // Initialize agent card
    this.myAgentCard = {
      id: config.agentId,
      name: config.agentName || config.agentId,
      description: 'TNF Protocol Bridge Agent',
      version: '1.0.0',
      capabilities: [],
      protocols: config.supportedProtocols || ['a2a', 'mcp', 'tnf'],
      endpoints: {
        primary: config.a2aEndpoint || `tnf://agent/${config.agentId}`,
      },
    };

    // Register default message handlers
    this.registerDefaultHandlers();
  }

  // ============================================================
  // CONNECTION MANAGEMENT
  // ============================================================

  async connect(): Promise<void> {
    this.emit('connecting');

    try {
      // Register with MCP server if configured
      if (this.config.mcpServerUrl) {
        await this.registerWithMCPServer();
      }

      // Start agent discovery if enabled
      if (this.config.enableDiscovery) {
        this.startDiscovery();
      }

      this.isConnected = true;
      this.emit('connected');
      this.emit('agent:registered', this.myAgentCard);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }

    // Cancel pending requests
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Bridge disconnected'));
    }
    this.pendingRequests.clear();

    this.isConnected = false;
    this.emit('disconnected');
  }

  // ============================================================
  // MESSAGE SENDING
  // ============================================================

  async sendMessage(
    message: Record<string, unknown>,
    messageType: MessageType = MessageType.REQUEST,
    priority: Priority = Priority.MEDIUM
  ): Promise<void> {
    const a2aMessage = this.createA2AMessage(
      (message.to as string) || 'broadcast',
      (message.action as string) || 'execute',
      message.data || message,
      messageType === MessageType.REQUEST ? 'request' : 'notification'
    );

    await this.send(a2aMessage);
  }

  /**
   * Send an A2A message
   */
  async send(message: A2AMessage): Promise<void> {
    this.emit('message:sending', message);

    // Route based on protocol
    switch (message.protocol) {
      case 'a2a':
        await this.sendA2AMessage(message);
        break;
      case 'mcp':
        await this.sendMCPMessage(message);
        break;
      case 'tnf':
        await this.sendTNFMessage(message);
        break;
      default:
        throw new Error(`Unsupported protocol: ${message.protocol}`);
    }

    this.emit('message:sent', message);
  }

  /**
   * Send and wait for response
   */
  async sendAndWait(
    to: string,
    action: string,
    data: unknown,
    timeout = 30000
  ): Promise<A2AMessage> {
    const message = this.createA2AMessage(to, action, data, 'request');

    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(message.id);
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);

      this.pendingRequests.set(message.id, {
        resolve,
        reject,
        timeout: timeoutHandle,
      });

      this.send(message).catch(reject);
    });
  }

  // ============================================================
  // MESSAGE RECEIVING
  // ============================================================

  /**
   * Handle incoming message
   */
  async handleMessage(message: A2AMessage): Promise<void> {
    this.emit('message:received', message);

    // Check if this is a response to a pending request
    if (message.type === 'response' && message.correlation?.requestId) {
      const pending = this.pendingRequests.get(message.correlation.requestId);
      if (pending) {
        clearTimeout(pending.timeout);
        pending.resolve(message);
        this.pendingRequests.delete(message.correlation.requestId);
        return;
      }
    }

    // Find and execute handler
    const handler = this.messageHandlers.get(message.payload.action);
    if (handler) {
      await handler(message);
    } else {
      // Default handler
      this.emit('message:unhandled', message);
    }
  }

  /**
   * Register a message handler
   */
  onAction(action: string, handler: (message: A2AMessage) => Promise<void>): void {
    this.messageHandlers.set(action, handler);
  }

  // ============================================================
  // A2A PROTOCOL
  // ============================================================

  /**
   * Create an A2A message
   */
  createA2AMessage(
    to: string,
    action: string,
    data: unknown,
    type: A2AMessage['type'] = 'request',
    correlationId?: string
  ): A2AMessage {
    return {
      id: `a2a-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      protocol: this.config.defaultProtocol,
      version: '0.3.0',
      from: this.config.agentId,
      to,
      timestamp: new Date(),
      payload: {
        action,
        data,
      },
      correlation: correlationId ? { requestId: correlationId } : undefined,
    };
  }

  /**
   * Create a response to a message
   */
  createResponse(originalMessage: A2AMessage, data: unknown, isError = false): A2AMessage {
    return {
      id: `a2a-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: isError ? 'error' : 'response',
      protocol: originalMessage.protocol,
      version: '0.3.0',
      from: this.config.agentId,
      to: originalMessage.from,
      timestamp: new Date(),
      payload: {
        action: `${originalMessage.payload.action}:result`,
        data,
      },
      correlation: {
        requestId: originalMessage.id,
        conversationId: originalMessage.correlation?.conversationId,
      },
    };
  }

  private async sendA2AMessage(message: A2AMessage): Promise<void> {
    // Find target agent
    const targetAgent = this.knownAgents.get(message.to);

    if (message.to === 'broadcast') {
      // Broadcast to all known agents
      for (const agent of this.knownAgents.values()) {
        this.emit('a2a:broadcast', { agent, message });
      }
    } else if (targetAgent) {
      this.emit('a2a:send', { agent: targetAgent, message });
    } else {
      // Agent not found, emit for discovery
      this.emit('a2a:agent-not-found', { agentId: message.to, message });
    }
  }

  // ============================================================
  // MCP PROTOCOL
  // ============================================================

  /**
   * Register a tool with MCP
   */
  registerMCPTool(tool: MCPTool): void {
    this.mcpTools.set(tool.name, tool);
    this.emit('mcp:tool:registered', tool);
  }

  /**
   * Register a resource with MCP
   */
  registerMCPResource(resource: MCPResource): void {
    this.mcpResources.set(resource.uri, resource);
    this.emit('mcp:resource:registered', resource);
  }

  /**
   * Register a prompt with MCP
   */
  registerMCPPrompt(prompt: MCPPrompt): void {
    this.mcpPrompts.set(prompt.name, prompt);
    this.emit('mcp:prompt:registered', prompt);
  }

  /**
   * Get all MCP tools
   */
  getMCPTools(): MCPTool[] {
    return Array.from(this.mcpTools.values());
  }

  /**
   * Get all MCP resources
   */
  getMCPResources(): MCPResource[] {
    return Array.from(this.mcpResources.values());
  }

  private async sendMCPMessage(message: A2AMessage): Promise<void> {
    // MCP messages would go through the MCP server
    this.emit('mcp:send', message);
  }

  private async registerWithMCPServer(): Promise<void> {
    // Would register tools/resources/prompts with MCP server
    this.emit('mcp:registering', {
      tools: this.mcpTools.size,
      resources: this.mcpResources.size,
      prompts: this.mcpPrompts.size,
    });
  }

  // ============================================================
  // TNF PROTOCOL
  // ============================================================

  private async sendTNFMessage(message: A2AMessage): Promise<void> {
    // TNF internal protocol - direct emit for local handling
    this.emit('tnf:send', message);
  }

  // ============================================================
  // AGENT DISCOVERY
  // ============================================================

  /**
   * Register a known agent
   */
  registerAgent(agentCard: A2AAgentCard): void {
    this.knownAgents.set(agentCard.id, agentCard);
    this.emit('agent:discovered', agentCard);
  }

  /**
   * Update agent capabilities
   */
  updateCapabilities(capabilities: string[]): void {
    this.myAgentCard.capabilities = capabilities;
    this.emit('capabilities:updated', capabilities);
  }

  /**
   * Get my agent card
   */
  getAgentCard(): A2AAgentCard {
    return this.myAgentCard;
  }

  /**
   * Get known agents
   */
  getKnownAgents(): A2AAgentCard[] {
    return Array.from(this.knownAgents.values());
  }

  /**
   * Find agents by capability
   */
  findAgentsByCapability(capability: string): A2AAgentCard[] {
    return Array.from(this.knownAgents.values()).filter((agent) =>
      agent.capabilities.includes(capability)
    );
  }

  private startDiscovery(): void {
    this.discoveryInterval = setInterval(() => {
      this.discoverAgents();
    }, this.config.discoveryInterval);

    // Initial discovery
    this.discoverAgents();
  }

  private async discoverAgents(): Promise<void> {
    this.emit('discovery:started');

    // Broadcast discovery request
    const discoveryMessage = this.createA2AMessage(
      'broadcast',
      'agent:discover',
      { capabilities: this.myAgentCard.capabilities },
      'request'
    );

    await this.send(discoveryMessage);
    this.emit('discovery:completed');
  }

  // ============================================================
  // TASK EXECUTION
  // ============================================================

  /**
   * Request task execution from another agent
   */
  async requestTaskExecution(agentId: string, task: A2ATask): Promise<A2ATaskResult> {
    const response = await this.sendAndWait(agentId, 'task:execute', task, task.timeout || 60000);

    return response.payload.data as A2ATaskResult;
  }

  /**
   * Broadcast task to find capable agent
   */
  async broadcastTask(task: A2ATask): Promise<{ agentId: string; result: A2ATaskResult } | null> {
    // Find agents with required capabilities
    const capableAgents =
      task.requiredCapabilities.length > 0
        ? this.findAgentsByCapability(task.requiredCapabilities[0])
        : Array.from(this.knownAgents.values());

    if (capableAgents.length === 0) {
      return null;
    }

    // Try first capable agent
    const agent = capableAgents[0];
    const result = await this.requestTaskExecution(agent.id, task);
    return { agentId: agent.id, result };
  }

  // ============================================================
  // DEFAULT HANDLERS
  // ============================================================

  private registerDefaultHandlers(): void {
    // Handle discovery requests
    this.onAction('agent:discover', async (message) => {
      const response = this.createResponse(message, this.myAgentCard);
      await this.send(response);
    });

    // Handle ping
    this.onAction('ping', async (message) => {
      const response = this.createResponse(message, {
        pong: true,
        timestamp: new Date(),
        agentId: this.config.agentId,
      });
      await this.send(response);
    });

    // Handle capability query
    this.onAction('capabilities:query', async (message) => {
      const response = this.createResponse(message, {
        capabilities: this.myAgentCard.capabilities,
        protocols: this.myAgentCard.protocols,
      });
      await this.send(response);
    });
  }

  // ============================================================
  // STATISTICS
  // ============================================================

  getStatistics(): {
    connected: boolean;
    protocol: string;
    knownAgents: number;
    mcpTools: number;
    mcpResources: number;
    pendingRequests: number;
    capabilities: string[];
  } {
    return {
      connected: this.isConnected,
      protocol: this.config.defaultProtocol,
      knownAgents: this.knownAgents.size,
      mcpTools: this.mcpTools.size,
      mcpResources: this.mcpResources.size,
      pendingRequests: this.pendingRequests.size,
      capabilities: this.myAgentCard.capabilities,
    };
  }
}

export default ProtocolBridge;

/**
 * Enhanced Agent - Advanced agent with full capabilities
 *
 * An enhanced agent implementation that provides:
 * - Multi-model LLM support
 * - Context management
 * - Tool integration
 * - Memory systems
 * - Learning capabilities
 * - Self-improvement
 */

import { EventEmitter } from 'events';

// ============================================================
// TYPES
// ============================================================

export interface EnhancedAgentConfig {
  id: string;
  name: string;
  capabilities: string[];
  models: AgentModel[];
  tools: AgentTool[];
  memory: MemoryConfig;
  learningEnabled: boolean;
}

export interface AgentModel {
  id: string;
  provider: 'openai' | 'anthropic' | 'google' | 'local';
  model: string;
  contextWindow: number;
  capabilities: string[];
  priority: number;
}

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (input: unknown) => Promise<unknown>;
}

export interface MemoryConfig {
  shortTermSize: number;
  longTermEnabled: boolean;
  vectorStoreId?: string;
  summarizationInterval: number;
}

export interface AgentContext {
  conversationId: string;
  messages: Message[];
  variables: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
  timestamp: Date;
}

export interface AgentResponse {
  content: string;
  toolCalls?: ToolCall[];
  metadata: {
    model: string;
    tokens: {
      input: number;
      output: number;
    };
    latency: number;
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

// ============================================================
// ENHANCED AGENT
// ============================================================

// Define metrics type manually to avoid 'this' reference in return type
interface AgentMetrics {
  requestsProcessed: number;
  tokensUsed: number;
  averageLatency: number;
  toolsInvoked: number;
  errors: number;
}

export class EnhancedAgent extends EventEmitter {
  private config: EnhancedAgentConfig;
  private contexts: Map<string, AgentContext> = new Map();
  private shortTermMemory: Message[] = [];
  private metrics: AgentMetrics;
  private isRunning = false;

  constructor(config: EnhancedAgentConfig) {
    super();
    this.config = config;
    this.metrics = {
      requestsProcessed: 0,
      tokensUsed: 0,
      averageLatency: 0,
      toolsInvoked: 0,
      errors: 0,
    };
  }

  // ============================================================
  // LIFECYCLE
  // ============================================================

  /**
   * Start the agent
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.emit('started');
  }

  /**
   * Stop the agent
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    this.emit('stopped');
  }

  /**
   * Get agent status
   */
  getStatus(): {
    id: string;
    name: string;
    running: boolean;
    capabilities: string[];
    metrics: AgentMetrics;
  } {
    return {
      id: this.config.id,
      name: this.config.name,
      running: this.isRunning,
      capabilities: this.config.capabilities,
      metrics: this.metrics,
    };
  }

  // ============================================================
  // CONVERSATION
  // ============================================================

  /**
   * Process a user message
   */
  async processMessage(
    conversationId: string,
    message: string,
    options: {
      model?: string;
      systemPrompt?: string;
      tools?: string[];
    } = {}
  ): Promise<AgentResponse> {
    const startTime = Date.now();

    // Get or create context
    let context = this.contexts.get(conversationId);
    if (!context) {
      context = this.createContext(conversationId);
    }

    // Add user message
    context.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    try {
      // Select model
      const model = this.selectModel(options.model);

      // Build prompt with context
      const prompt = this.buildPrompt(context, options.systemPrompt);

      // Get available tools
      const tools = this.getTools(options.tools);

      // Simulate LLM call (in production, call actual API)
      const response = await this.callModel(model, prompt, tools);

      // Handle tool calls
      if (response.toolCalls?.length) {
        for (const toolCall of response.toolCalls) {
          const result = await this.executeTool(toolCall);
          context.messages.push({
            role: 'tool',
            content: JSON.stringify(result),
            name: toolCall.name,
            toolCallId: toolCall.id,
            timestamp: new Date(),
          });
          this.metrics.toolsInvoked++;
        }
      }

      // Add assistant response
      context.messages.push({
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
      });

      // Update metrics
      const latency = Date.now() - startTime;
      this.metrics.requestsProcessed++;
      this.metrics.tokensUsed += response.metadata.tokens.input + response.metadata.tokens.output;
      this.metrics.averageLatency =
        (this.metrics.averageLatency * (this.metrics.requestsProcessed - 1) + latency) /
        this.metrics.requestsProcessed;

      // Memory management
      this.manageMemory(context);

      this.emit('response', { conversationId, response });
      return response;
    } catch (error) {
      this.metrics.errors++;
      this.emit('error', { conversationId, error });
      throw error;
    }
  }

  /**
   * Create a new context
   */
  private createContext(conversationId: string): AgentContext {
    const context: AgentContext = {
      conversationId,
      messages: [],
      variables: {},
      metadata: { createdAt: new Date() },
    };
    this.contexts.set(conversationId, context);
    return context;
  }

  /**
   * Get context
   */
  getContext(conversationId: string): AgentContext | undefined {
    return this.contexts.get(conversationId);
  }

  /**
   * Clear context
   */
  clearContext(conversationId: string): void {
    this.contexts.delete(conversationId);
  }

  // ============================================================
  // MODEL MANAGEMENT
  // ============================================================

  /**
   * Select the best model for the task
   */
  private selectModel(preferredModel?: string): AgentModel {
    if (preferredModel) {
      const model = this.config.models.find(
        (m) => m.id === preferredModel || m.model === preferredModel
      );
      if (model) {
        return model;
      }
    }

    // Return highest priority model
    return this.config.models.sort((a, b) => b.priority - a.priority)[0];
  }

  /**
   * Build prompt with context
   */
  private buildPrompt(context: AgentContext, systemPrompt?: string): string {
    const parts: string[] = [];

    if (systemPrompt) {
      parts.push(`System: ${systemPrompt}\n`);
    }

    // Add recent messages
    const recentMessages = context.messages.slice(-20);
    for (const msg of recentMessages) {
      parts.push(`${msg.role}: ${msg.content}`);
    }

    return parts.join('\n');
  }

  /**
   * Call model (simulated)
   */
  private async callModel(
    model: AgentModel,
    prompt: string,
    tools: AgentTool[]
  ): Promise<AgentResponse> {
    // Simulate API latency
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Simulated response
    return {
      content: `Response from ${model.model} based on: ${prompt.slice(0, 100)}...`,
      metadata: {
        model: model.model,
        tokens: {
          input: Math.floor(prompt.length / 4),
          output: 50,
        },
        latency: 100,
      },
    };
  }

  // ============================================================
  // TOOL MANAGEMENT
  // ============================================================

  /**
   * Get available tools
   */
  private getTools(filterIds?: string[]): AgentTool[] {
    if (filterIds) {
      return this.config.tools.filter((t) => filterIds.includes(t.id));
    }
    return this.config.tools;
  }

  /**
   * Execute a tool
   */
  private async executeTool(toolCall: ToolCall): Promise<unknown> {
    const tool = this.config.tools.find((t) => t.name === toolCall.name);
    if (!tool) {
      throw new Error(`Tool not found: ${toolCall.name}`);
    }

    this.emit('tool:executing', toolCall);
    const result = await tool.handler(toolCall.arguments);
    this.emit('tool:executed', { toolCall, result });

    return result;
  }

  /**
   * Register a tool
   */
  registerTool(tool: AgentTool): void {
    this.config.tools.push(tool);
    this.emit('tool:registered', tool);
  }

  /**
   * Unregister a tool
   */
  unregisterTool(toolId: string): void {
    const index = this.config.tools.findIndex((t) => t.id === toolId);
    if (index !== -1) {
      this.config.tools.splice(index, 1);
      this.emit('tool:unregistered', { toolId });
    }
  }

  // ============================================================
  // MEMORY MANAGEMENT
  // ============================================================

  /**
   * Manage memory for a context
   */
  private manageMemory(context: AgentContext): void {
    // Trim messages if too many
    if (context.messages.length > this.config.memory.shortTermSize) {
      // Summarize older messages (in production, call LLM for summarization)
      const toSummarize = context.messages.slice(0, -this.config.memory.shortTermSize / 2);
      const summary = `[Summary of ${toSummarize.length} messages]`;

      // Keep recent messages plus summary
      context.messages = [
        { role: 'system', content: summary, timestamp: new Date() },
        ...context.messages.slice(-this.config.memory.shortTermSize / 2),
      ];
    }

    // Add to short-term memory
    const lastMessage = context.messages[context.messages.length - 1];
    if (lastMessage) {
      this.shortTermMemory.push(lastMessage);

      // Trim short-term memory
      if (this.shortTermMemory.length > this.config.memory.shortTermSize * 2) {
        this.shortTermMemory = this.shortTermMemory.slice(-this.config.memory.shortTermSize);
      }
    }
  }

  /**
   * Search memory
   */
  searchMemory(query: string, limit = 10): Message[] {
    // Simple keyword search (in production, use vector search)
    const queryLower = query.toLowerCase();
    return this.shortTermMemory
      .filter((m) => m.content.toLowerCase().includes(queryLower))
      .slice(-limit);
  }

  // ============================================================
  // LEARNING
  // ============================================================

  /**
   * Learn from feedback
   */
  async learnFromFeedback(
    conversationId: string,
    messageIndex: number,
    feedback: 'positive' | 'negative',
    correction?: string
  ): Promise<void> {
    if (!this.config.learningEnabled) {
      return;
    }

    const context = this.contexts.get(conversationId);
    if (!context) {
      return;
    }

    const message = context.messages[messageIndex];
    if (!message) {
      return;
    }

    this.emit('learning:feedback', {
      conversationId,
      messageIndex,
      feedback,
      correction,
      originalContent: message.content,
    });

    // In production: Store feedback for fine-tuning, update prompts, etc.
  }

  // ============================================================
  // CAPABILITIES
  // ============================================================

  /**
   * Get capabilities
   */
  getCapabilities(): string[] {
    return [...this.config.capabilities];
  }

  /**
   * Check if has capability
   */
  hasCapability(capability: string): boolean {
    return this.config.capabilities.includes(capability);
  }

  /**
   * Add capability
   */
  addCapability(capability: string): void {
    if (!this.config.capabilities.includes(capability)) {
      this.config.capabilities.push(capability);
      this.emit('capability:added', { capability });
    }
  }
}

// ============================================================
// FACTORY
// ============================================================

export function createEnhancedAgent(
  id: string,
  name: string,
  options: Partial<EnhancedAgentConfig> = {}
): EnhancedAgent {
  const config: EnhancedAgentConfig = {
    id,
    name,
    capabilities: options.capabilities || ['chat', 'tools', 'memory'],
    models: options.models || [
      {
        id: 'default',
        provider: 'openai',
        model: 'gpt-4',
        contextWindow: 128000,
        capabilities: ['chat', 'tools'],
        priority: 1,
      },
    ],
    tools: options.tools || [],
    memory: options.memory || {
      shortTermSize: 100,
      longTermEnabled: false,
      summarizationInterval: 50,
    },
    learningEnabled: options.learningEnabled ?? false,
  };

  return new EnhancedAgent(config);
}

export default EnhancedAgent;

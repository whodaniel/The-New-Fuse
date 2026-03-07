/**
 * Simple Enhanced Agent - Lightweight enhanced agent
 *
 * A simpler version of the enhanced agent for:
 * - Quick deployment
 * - Lower resource usage
 * - Basic chat and tool capabilities
 * - Minimal configuration
 */

import { EventEmitter } from 'events';

// ============================================================
// TYPES
// ============================================================

export interface SimpleAgentConfig {
  id: string;
  name: string;
  model?: string;
  systemPrompt?: string;
  tools?: SimpleTool[];
  maxHistory?: number;
}

export interface SimpleTool {
  name: string;
  description: string;
  parameters: Record<
    string,
    {
      type: string;
      description?: string;
      required?: boolean;
    }
  >;
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  content: string;
  toolResults?: Array<{
    tool: string;
    result: unknown;
  }>;
}

// ============================================================
// SIMPLE ENHANCED AGENT
// ============================================================

export class SimpleEnhancedAgent extends EventEmitter {
  private config: SimpleAgentConfig;
  private history: ChatMessage[] = [];
  private systemPrompt: string;
  private maxHistory: number;
  private isActive = false;

  constructor(config: SimpleAgentConfig) {
    super();
    this.config = config;
    this.systemPrompt = config.systemPrompt || 'You are a helpful assistant.';
    this.maxHistory = config.maxHistory || 50;
  }

  /**
   * Start the agent
   */
  start(): void {
    this.isActive = true;

    // Add system message
    if (this.history.length === 0) {
      this.history.push({
        role: 'system',
        content: this.systemPrompt,
        timestamp: new Date(),
      });
    }

    this.emit('started');
  }

  /**
   * Stop the agent
   */
  stop(): void {
    this.isActive = false;
    this.emit('stopped');
  }

  /**
   * Check if active
   */
  isRunning(): boolean {
    return this.isActive;
  }

  /**
   * Send a message and get response
   */
  async chat(userMessage: string): Promise<ChatResponse> {
    if (!this.isActive) {
      throw new Error('Agent is not active');
    }

    // Add user message
    this.history.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    });

    try {
      // Check for tool invocations
      const toolResults = await this.checkToolInvocations(userMessage);

      // Generate response (simulated)
      const responseContent = this.generateResponse(userMessage, toolResults);

      // Add assistant message
      this.history.push({
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      });

      // Trim history if needed
      this.trimHistory();

      const response: ChatResponse = {
        content: responseContent,
      };

      if (toolResults.length > 0) {
        response.toolResults = toolResults;
      }

      this.emit('response', response);
      return response;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Check for tool invocations in the message
   */
  private async checkToolInvocations(
    message: string
  ): Promise<Array<{ tool: string; result: unknown }>> {
    if (!this.config.tools?.length) {
      return [];
    }

    const results: Array<{ tool: string; result: unknown }> = [];
    const lowerMessage = message.toLowerCase();

    for (const tool of this.config.tools) {
      // Simple keyword matching (in production, use LLM for tool selection)
      if (lowerMessage.includes(tool.name.toLowerCase())) {
        try {
          const result = await tool.execute({});
          results.push({ tool: tool.name, result });
          this.emit('tool:executed', { tool: tool.name, result });
        } catch (error) {
          this.emit('tool:error', { tool: tool.name, error });
        }
      }
    }

    return results;
  }

  /**
   * Generate a response (simulated)
   */
  private generateResponse(
    userMessage: string,
    toolResults: Array<{ tool: string; result: unknown }>
  ): string {
    let response = '';

    if (toolResults.length > 0) {
      response += 'I used the following tools:\n';
      for (const tr of toolResults) {
        response += `- ${tr.tool}: ${JSON.stringify(tr.result)}\n`;
      }
      response += '\n';
    }

    // Simple response generation
    if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
      response += `Hello! I'm ${this.config.name}. How can I help you today?`;
    } else if (userMessage.toLowerCase().includes('help')) {
      response += `I can help you with various tasks. `;
      if (this.config.tools?.length) {
        response += `I have access to these tools: ${this.config.tools.map((t) => t.name).join(', ')}.`;
      }
    } else {
      response += `I understand you're asking about: "${userMessage.slice(0, 100)}". `;
      response += `I'll do my best to assist you.`;
    }

    return response;
  }

  /**
   * Trim history to max size
   */
  private trimHistory(): void {
    if (this.history.length > this.maxHistory) {
      // Keep system message and recent messages
      const systemMessages = this.history.filter((m) => m.role === 'system');
      const recentMessages = this.history.slice(-this.maxHistory + systemMessages.length);
      this.history = [...systemMessages, ...recentMessages];
    }
  }

  /**
   * Get chat history
   */
  getHistory(): ChatMessage[] {
    return [...this.history];
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = [
      {
        role: 'system',
        content: this.systemPrompt,
        timestamp: new Date(),
      },
    ];
    this.emit('history:cleared');
  }

  /**
   * Set system prompt
   */
  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;

    // Update system message in history
    const sysIndex = this.history.findIndex((m) => m.role === 'system');
    if (sysIndex !== -1) {
      this.history[sysIndex].content = prompt;
    }
  }

  /**
   * Add a tool
   */
  addTool(tool: SimpleTool): void {
    if (!this.config.tools) {
      this.config.tools = [];
    }
    this.config.tools.push(tool);
    this.emit('tool:added', { name: tool.name });
  }

  /**
   * Remove a tool
   */
  removeTool(name: string): void {
    if (this.config.tools) {
      const index = this.config.tools.findIndex((t) => t.name === name);
      if (index !== -1) {
        this.config.tools.splice(index, 1);
        this.emit('tool:removed', { name });
      }
    }
  }

  /**
   * Get available tools
   */
  getTools(): SimpleTool[] {
    return this.config.tools || [];
  }

  /**
   * Get agent info
   */
  getInfo(): {
    id: string;
    name: string;
    model: string;
    isActive: boolean;
    historyLength: number;
    toolCount: number;
  } {
    return {
      id: this.config.id,
      name: this.config.name,
      model: this.config.model || 'default',
      isActive: this.isActive,
      historyLength: this.history.length,
      toolCount: this.config.tools?.length || 0,
    };
  }
}

// ============================================================
// FACTORY
// ============================================================

export function createSimpleAgent(
  id: string,
  name: string,
  options: Partial<SimpleAgentConfig> = {}
): SimpleEnhancedAgent {
  return new SimpleEnhancedAgent({
    id,
    name,
    ...options,
  });
}

export default SimpleEnhancedAgent;

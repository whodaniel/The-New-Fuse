/**
 * The New Fuse VSCode Extension - Tool Orchestration Service
 * Version 9.2.0 - Frontier Capabilities
 *
 * Bridges AIService and MCPService to enable function calling and tool execution.
 * Implements multi-turn orchestration loop for agentic behavior.
 */

import type { ChatMessage, MCPTool, ToolDefinition, ToolUse } from '../core/types';
import { log } from '../utils/logger';
import { getAIService } from './AIService';
import { getMCPService } from './MCPService';

/**
 * Configuration for tool orchestration loop
 */
interface OrchestrationConfig {
  maxIterations: number; // Maximum tool calling iterations
  timeout: number; // Total timeout in milliseconds
  enableDebugLogging: boolean;
}

/**
 * Result of orchestration loop
 */
interface OrchestrationResult {
  finalMessage: ChatMessage;
  toolCalls: ToolCallRecord[];
  iterations: number;
  success: boolean;
  error?: string;
}

/**
 * Record of a single tool call
 */
interface ToolCallRecord {
  toolName: string;
  input: Record<string, unknown>;
  output: unknown;
  timestamp: number;
  durationMs: number;
  success: boolean;
  error?: string;
}

/**
 * Service that orchestrates tool execution between AI and MCP
 */
export class ToolOrchestrationService {
  private static instance: ToolOrchestrationService;
  private config: OrchestrationConfig = {
    maxIterations: 10,
    timeout: 30000, // 30 seconds
    enableDebugLogging: false,
  };

  private constructor() {
    log.info('ToolOrchestrationService initialized');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ToolOrchestrationService {
    if (!ToolOrchestrationService.instance) {
      ToolOrchestrationService.instance = new ToolOrchestrationService();
    }
    return ToolOrchestrationService.instance;
  }

  /**
   * Execute a conversation with tool support
   * Main orchestration loop that handles multi-turn tool calling
   *
   * @param messages - Conversation history
   * @param systemPrompt - System prompt to use
   * @param onChunk - Callback for streaming chunks
   * @returns Final assistant message with all tool results incorporated
   */
  async executeConversationWithTools(
    messages: ChatMessage[],
    systemPrompt?: string,
    onChunk?: (chunk: string) => void
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const toolCalls: ToolCallRecord[] = [];
    let iterations = 0;

    try {
      log.info('Starting tool orchestration loop');

      // Get available tools from MCP
      const availableTools = await this.getAvailableTools();
      log.info(`Available tools: ${availableTools.length}`);

      if (this.config.enableDebugLogging) {
        log.info(`Tools: ${availableTools.map((t) => t.name).join(', ')}`);
      }

      // Convert MCP tools to LLM format
      const toolDefinitions = this.convertMCPToolsToLLMFormat(availableTools);

      let currentMessages = [...messages];
      const aiService = getAIService();

      // Orchestration loop
      while (iterations < this.config.maxIterations) {
        iterations++;

        // Check timeout
        if (Date.now() - startTime > this.config.timeout) {
          throw new Error('Tool orchestration timeout exceeded');
        }

        log.info(`Orchestration iteration ${iterations}`);

        // Call LLM with tools
        const response = await aiService.chat({
          messages: currentMessages,
          systemPrompt,
          tools: toolDefinitions,
          onChunk: iterations === 1 ? onChunk : undefined, // Only stream first response
        });

        // Parse response for tool uses
        const toolUses = this.parseToolUses(response);

        if (toolUses.length === 0) {
          // No tools called, return final response
          log.info('No tools called, returning final response');
          return {
            finalMessage: {
              id: this.generateId(),
              role: 'assistant',
              content: response.content,
              timestamp: new Date().toISOString(),
              metadata: {
                model: response.model,
                tokens: response.usage?.totalTokens,
              },
            },
            toolCalls,
            iterations,
            success: true,
          };
        }

        // Execute tools
        log.info(`Executing ${toolUses.length} tool(s)`);
        const toolResults = await this.executeTools(toolUses);
        toolCalls.push(...toolResults);

        // Add assistant message with tool uses
        currentMessages.push({
          id: this.generateId(),
          role: 'assistant',
          content: response.content,
          timestamp: new Date().toISOString(),
          metadata: {
            model: response.model,
            toolUses: toolUses,
          },
        });

        // Add tool results as user messages
        const toolResultMessage = this.formatToolResults(toolResults);
        currentMessages.push(toolResultMessage);

        // Continue loop to get next response with tool results
      }

      // Max iterations reached
      log.warn(`Max iterations (${this.config.maxIterations}) reached`);
      return {
        finalMessage: {
          id: this.generateId(),
          role: 'assistant',
          content:
            'I apologize, but I reached the maximum number of tool executions. Please try simplifying your request.',
          timestamp: new Date().toISOString(),
        },
        toolCalls,
        iterations,
        success: false,
        error: 'Max iterations reached',
      };
    } catch (error) {
      log.error('Tool orchestration error', error);
      return {
        finalMessage: {
          id: this.generateId(),
          role: 'assistant',
          content: `I encountered an error during tool execution: ${(error as Error).message}`,
          timestamp: new Date().toISOString(),
        },
        toolCalls,
        iterations,
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get available tools from all connected MCP servers
   */
  private async getAvailableTools(): Promise<MCPTool[]> {
    const mcpService = getMCPService();
    const connections = mcpService.getConnections();

    const allTools: MCPTool[] = [];

    for (const connection of connections) {
      if (connection.status === 'connected' && connection.tools) {
        allTools.push(...connection.tools);
      }
    }

    return allTools;
  }

  /**
   * Convert MCP tools to LLM tool definition format
   * Works for both Anthropic and OpenAI formats
   */
  private convertMCPToolsToLLMFormat(mcpTools: MCPTool[]): ToolDefinition[] {
    return mcpTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema || {
        type: 'object',
        properties: {},
        required: [],
      },
    }));
  }

  /**
   * Parse tool uses from LLM response
   * Supports both Anthropic (tool_use blocks) and OpenAI (function_call) formats
   */
  private parseToolUses(response: any): ToolUse[] {
    const toolUses: ToolUse[] = [];

    // Anthropic format: Look for tool_use content blocks
    if (response.content) {
      try {
        // Try parsing as structured content (Anthropic SDK format)
        const content = Array.isArray(response.content)
          ? response.content
          : [{ type: 'text', text: response.content }];

        for (const block of content) {
          if (block.type === 'tool_use') {
            toolUses.push({
              id: block.id,
              name: block.name,
              input: block.input || {},
            });
          }
        }
      } catch (error) {
        log.warn('Failed to parse Anthropic tool uses', error);
      }
    }

    // OpenAI format: Look for function_call or tool_calls
    if (response.function_call) {
      const fnCall = response.function_call;
      toolUses.push({
        id: this.generateId(),
        name: fnCall.name,
        input: JSON.parse(fnCall.arguments),
      });
    }

    if (response.tool_calls) {
      for (const toolCall of response.tool_calls) {
        if (toolCall.type === 'function') {
          toolUses.push({
            id: toolCall.id,
            name: toolCall.function.name,
            input: JSON.parse(toolCall.function.arguments),
          });
        }
      }
    }

    return toolUses;
  }

  /**
   * Execute multiple tools and return results
   */
  private async executeTools(toolUses: ToolUse[]): Promise<ToolCallRecord[]> {
    const results: ToolCallRecord[] = [];

    for (const toolUse of toolUses) {
      const startTime = Date.now();
      let success = false;
      let output: unknown = null;
      let error: string | undefined;

      try {
        log.info(`Executing tool: ${toolUse.name}`);
        output = await this.executeSingleTool(toolUse.name, toolUse.input);
        success = true;
      } catch (err) {
        error = (err as Error).message;
        log.error(`Tool execution failed: ${toolUse.name}`, err);
      }

      results.push({
        toolName: toolUse.name,
        input: toolUse.input,
        output,
        timestamp: Date.now(),
        durationMs: Date.now() - startTime,
        success,
        error,
      });
    }

    return results;
  }

  /**
   * Execute a single tool via MCP
   */
  private async executeSingleTool(
    toolName: string,
    input: Record<string, unknown>
  ): Promise<unknown> {
    const mcpService = getMCPService();

    // Find which connection has this tool
    const connections = mcpService.getConnections();
    for (const connection of connections) {
      if (connection.status === 'connected' && connection.tools) {
        const tool = connection.tools.find((t) => t.name === toolName);
        if (tool) {
          // Execute via MCP
          const result = await mcpService.executeTool(connection.id, toolName, input);
          return result;
        }
      }
    }

    throw new Error(`Tool not found: ${toolName}`);
  }

  /**
   * Format tool execution results into a message for the LLM
   */
  private formatToolResults(toolResults: ToolCallRecord[]): ChatMessage {
    const successfulResults = toolResults.filter((r) => r.success);
    const failedResults = toolResults.filter((r) => !r.success);

    let content = '';

    if (successfulResults.length > 0) {
      content += 'Tool execution results:\n\n';
      for (const result of successfulResults) {
        content += `**${result.toolName}**:\n`;
        content += '```json\n';
        content += JSON.stringify(result.output, null, 2);
        content += '\n```\n\n';
      }
    }

    if (failedResults.length > 0) {
      content += 'Tool execution errors:\n\n';
      for (const result of failedResults) {
        content += `**${result.toolName}**: ${result.error}\n`;
      }
    }

    return {
      id: this.generateId(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      metadata: {
        toolResults: toolResults,
      },
    };
  }

  /**
   * Update orchestration configuration
   */
  setConfig(config: Partial<OrchestrationConfig>): void {
    this.config = { ...this.config, ...config };
    log.info('Orchestration config updated', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): OrchestrationConfig {
    return { ...this.config };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Get singleton instance
 */
export function getToolOrchestrationService(): ToolOrchestrationService {
  return ToolOrchestrationService.getInstance();
}

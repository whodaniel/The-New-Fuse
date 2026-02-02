/**
 * The New Fuse VSCode Extension - Tool Orchestration Service
 * Version 9.1.0 - Frontier Capabilities
 *
 * Bridges AIService and MCPService to enable function calling and tool execution.
 * Implements multi-turn orchestration loop for agentic behavior.
 */

import type { ChatMessage, MCPTool, ToolDefinition, ToolUse } from '../core/types';
import { log } from '../utils/logger';
import { getAIService } from './AIService';
import { getMCPService } from './MCPService';
import {
  getToolSearchService,
  TOOL_SEARCH_BM25_DEFINITION,
  TOOL_SEARCH_REGEX_DEFINITION,
} from './ToolSearchService';

/**
 * Configuration for tool orchestration loop
 */
interface OrchestrationConfig {
  maxIterations: number; // Maximum tool calling iterations
  timeout: number; // Total timeout in milliseconds
  enableDebugLogging: boolean;
  // Tool Discovery Protocol options
  enableToolSearch: boolean; // Enable dynamic tool search
  deferToolsAboveCount: number; // Defer tools if total count exceeds this
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
    // Tool Discovery Protocol defaults
    enableToolSearch: true, // Enable by default
    deferToolsAboveCount: 10, // Defer if more than 10 tools
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
      const mcpService = getMCPService();
      const activeTools = mcpService.getAllTools();
      const deferredTools = mcpService.getAllDeferredTools();
      const totalToolCount = activeTools.length + deferredTools.length;

      log.info(
        `Tools: ${activeTools.length} active, ${deferredTools.length} deferred, ${totalToolCount} total`
      );

      // Tool Discovery Protocol: Determine if we should use tool search
      const shouldUseToolSearch =
        this.config.enableToolSearch && totalToolCount > this.config.deferToolsAboveCount;

      // Index deferred tools for search if enabled
      if (shouldUseToolSearch && deferredTools.length > 0) {
        const searchService = getToolSearchService();
        searchService.indexTools(deferredTools);
        log.info(`Indexed ${deferredTools.length} deferred tools for search`);
      }

      if (this.config.enableDebugLogging) {
        log.info(`Active tools: ${activeTools.map((t) => t.name).join(', ')}`);
      }

      // Convert MCP tools to LLM format with defer_loading
      let toolDefinitions = this.convertMCPToolsToLLMFormat(activeTools);

      // Add tool search tools if we have deferred tools
      if (shouldUseToolSearch && deferredTools.length > 0) {
        toolDefinitions.push(TOOL_SEARCH_REGEX_DEFINITION);
        toolDefinitions.push(TOOL_SEARCH_BM25_DEFINITION);
        log.info('Added tool_search tools for deferred tool discovery');
      }

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

        // Call LLM with tools (enable tool search beta headers if using deferred tools)
        const response = await aiService.chat({
          messages: currentMessages,
          systemPrompt,
          tools: toolDefinitions,
          onChunk: iterations === 1 ? onChunk : undefined, // Only stream first response
          enableToolSearch: shouldUseToolSearch, // Tool Discovery Protocol
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
   * Includes defer_loading for Tool Discovery Protocol
   */
  private convertMCPToolsToLLMFormat(mcpTools: MCPTool[]): ToolDefinition[] {
    return mcpTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: (tool.inputSchema as ToolDefinition['input_schema']) || {
        type: 'object',
        properties: {},
        required: [],
      },
      // Tool Discovery Protocol: Include defer_loading flag
      defer_loading: tool.defer_loading,
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
   * Includes handling for Tool Discovery Protocol tool_search_tool
   */
  private async executeTools(toolUses: ToolUse[]): Promise<ToolCallRecord[]> {
    const results: ToolCallRecord[] = [];
    const mcpService = getMCPService();
    const searchService = getToolSearchService();

    for (const toolUse of toolUses) {
      const startTime = Date.now();
      let success = false;
      let output: unknown = null;
      let error: string | undefined;

      try {
        log.info(`Executing tool: ${toolUse.name}`);

        // Tool Discovery Protocol: Handle tool_search_tool calls
        if (toolUse.name === 'tool_search_tool_regex_20251119') {
          const pattern = toolUse.input.pattern as string;
          const searchResult = searchService.searchByRegex(pattern);
          output = searchResult;

          // Load discovered tools into active tools
          const toolNames = searchResult.tools.map((t) => t.name);
          await mcpService.loadDeferredTools(toolNames);
          log.info(`Tool search (regex) found ${toolNames.length} tools: ${toolNames.join(', ')}`);
          success = true;
        } else if (toolUse.name === 'tool_search_tool_bm25_20251119') {
          const query = toolUse.input.query as string;
          const searchResult = searchService.searchByBM25(query);
          output = searchResult;

          // Load discovered tools into active tools
          const toolNames = searchResult.tools.map((t) => t.name);
          await mcpService.loadDeferredTools(toolNames);
          log.info(`Tool search (BM25) found ${toolNames.length} tools: ${toolNames.join(', ')}`);
          success = true;
        } else {
          // Regular tool execution via MCP
          output = await this.executeSingleTool(toolUse.name, toolUse.input);
          success = true;
        }
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

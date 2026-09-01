/**
 * Gemini Browser MCP Server
 *
 * Exposes Gemini browser automation as MCP tools
 * Allows any TNF agent to delegate tasks to free Gemini compute
 */

import { geminiBrowser, GeminiPromptRequest } from './GeminiBrowserAutomation.js';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPToolResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

export class GeminiBrowserMCPServer {
  private tools: MCPTool[] = [
    {
      name: 'gemini_browser_prompt',
      description:
        "Send a prompt to Chrome's built-in Gemini AI. Gemini can see tab contents and access the internet. Use this for web research, content analysis, or any task that benefits from free AI compute.",
      inputSchema: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'The prompt to send to Gemini',
          },
          contextUrls: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional URLs to open in tabs for Gemini to analyze (up to 10 tabs)',
          },
          timeout: {
            type: 'number',
            description: 'Response timeout in milliseconds (default: 30000)',
          },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'gemini_browser_status',
      description: 'Check if the Gemini browser automation is ready',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'gemini_browser_initialize',
      description: 'Initialize the Gemini browser automation',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'gemini_browser_close',
      description: 'Close the Gemini browser',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];

  /**
   * Get available tools
   */
  getTools(): MCPTool[] {
    return this.tools;
  }

  /**
   * Execute a tool call
   */
  async executeTool(toolCall: MCPToolCall): Promise<MCPToolResponse> {
    try {
      switch (toolCall.name) {
        case 'gemini_browser_prompt':
          return await this.handlePrompt(toolCall.arguments);

        case 'gemini_browser_status':
          return this.handleStatus();

        case 'gemini_browser_initialize':
          return await this.handleInitialize();

        case 'gemini_browser_close':
          return await this.handleClose();

        default:
          return {
            content: [
              {
                type: 'text',
                text: `Unknown tool: ${toolCall.name}`,
              },
            ],
            isError: true,
          };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error executing ${toolCall.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle prompt tool call
   */
  private async handlePrompt(args: Record<string, any>): Promise<MCPToolResponse> {
    const request: GeminiPromptRequest = {
      prompt: args.prompt,
      contextUrls: args.contextUrls,
      timeout: args.timeout,
    };

    const response = await geminiBrowser.prompt(request);

    if (!response.success) {
      return {
        content: [
          {
            type: 'text',
            text: `Gemini browser error: ${response.error}`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: response.response,
        },
      ],
    };
  }

  /**
   * Handle status check
   */
  private handleStatus(): MCPToolResponse {
    const isReady = geminiBrowser.isReady();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            ready: isReady,
            status: isReady ? 'initialized' : 'not initialized',
          }),
        },
      ],
    };
  }

  /**
   * Handle initialization
   */
  private async handleInitialize(): Promise<MCPToolResponse> {
    const success = await geminiBrowser.initialize();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success,
            message: success
              ? 'Gemini browser initialized successfully'
              : 'Failed to initialize Gemini browser',
          }),
        },
      ],
      isError: !success,
    };
  }

  /**
   * Handle close
   */
  private async handleClose(): Promise<MCPToolResponse> {
    await geminiBrowser.close();

    return {
      content: [
        {
          type: 'text',
          text: 'Gemini browser closed successfully',
        },
      ],
    };
  }
}

// Export singleton instance
export const geminiBrowserMCP = new GeminiBrowserMCPServer();

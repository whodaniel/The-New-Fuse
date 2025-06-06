// src/mcp/services/mcp-client.ts

import axios, { AxiosInstance } from 'axios';

/**
 * Tool definition for LLM tool use
 */
export interface Tool {
  name: string;
  description: string;
  input_schema: object;
}

export interface MessageContentPartText {
  type: 'text';
  text: string;
}

export interface MessageContentPartToolUse {
  type: 'tool_use';
  id: string;
  name: string;
  input: any;
}

export interface MessageContentPartToolResult {
  type: 'tool_result';
  tool_use_id: string;
  content: string | any[];
  is_error?: boolean;
}

export type MessageContentPart =
  | MessageContentPartText
  | MessageContentPartToolUse
  | MessageContentPartToolResult;

export interface Message {
  role: 'user' | 'assistant';
  content: string | MessageContentPart[];
}

export interface QueryRequest {
  query: string;
}

/**
 * MCP Client Session abstraction for HTTP transport
 */
export interface MCPClientSession {
  listTools: () => Promise<Tool[]>;
  callTool: (params: { name: string; input: any }) => Promise<{ output: any }>;
  close: () => Promise<void>;
}

/**
 * HTTP-based MCPClientSession implementation
 */
export class HttpMCPClientSession implements MCPClientSession {
  private httpClient: AxiosInstance;

  constructor(private serverUrl: string) {
    this.httpClient = axios.create({
      baseURL: serverUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  async listTools(): Promise<Tool[]> {
    const resp = await this.httpClient.get('/tools');
    // Adapt response shape if needed
    if (Array.isArray(resp.data.tools)) {
      return resp.data.tools;
    }
    return [];
  }

  async callTool(params: { name: string; input: any }): Promise<{ output: any }> {
    const resp = await this.httpClient.post('/tools/call', {
      tool: params.name,
      parameters: params.input,
    });
    // Adapt response shape if needed
    if (resp.data && typeof resp.data === 'object') {
      return { output: resp.data.content ?? resp.data.result ?? resp.data };
    }
    return { output: resp.data };
  }

  async close(): Promise<void> {
    // No persistent connection to close for HTTP
  }
}

/**
 * MCPClient orchestrates LLM <-> MCP server tool use
 */
export class MCPClient {
  private tools: Tool[] = [];
  public messages: Message[] = [];
  private session: MCPClientSession | null = null;

  constructor(
    private mcpServerUrl: string
  ) {}

  /**
   * Connect to MCP server and fetch tools
   */
  public async connectToServer(): Promise<boolean> {
    try {
      this.session = new HttpMCPClientSession(this.mcpServerUrl);
      await this.getMCPTools();
      return true;
    } catch (error) {
      this.session = null;
      return false;
    }
  }

  private async getMCPTools(): Promise<void> {
    if (!this.session) {
      this.tools = [];
      return;
    }
    try {
      this.tools = await this.session.listTools();
    } catch {
      this.tools = [];
    }
  }

  /**
   * Simulated LLM call (replace with actual LLM SDK integration)
   */
  private async callLLM(): Promise<{ content: MessageContentPart[]; stop_reason: string }> {
    // Placeholder: In production, call Anthropic/OpenAI/etc. with this.messages and this.tools
    // For now, just echo the last user message as text
    const last = this.messages[this.messages.length - 1];
    return {
      content: [{ type: 'text', text: typeof last.content === 'string' ? last.content : '[tool result]' }],
      stop_reason: 'end_turn'
    };
  }

  /**
   * Orchestrate LLM <-> MCP tool use loop
   */
  public async processQuery(query: string): Promise<Message[]> {
    this.messages = [{ role: 'user', content: query }];

    const maxTurns = 10;
    let currentTurn = 0;

    while (currentTurn < maxTurns) {
      currentTurn++;
      try {
        const llmResponse = await this.callLLM();

        let assistantMessageContent: MessageContentPart[] = [];
        let hasToolUse = false;

        for (const contentBlock of llmResponse.content) {
          if (contentBlock.type === 'text') {
            assistantMessageContent.push({ type: 'text', text: contentBlock.text });
          } else if (contentBlock.type === 'tool_use') {
            assistantMessageContent.push({
              type: 'tool_use',
              id: contentBlock.id,
              name: contentBlock.name,
              input: contentBlock.input,
            });
            hasToolUse = true;
          }
        }

        if (assistantMessageContent.length > 0) {
          this.messages.push({ role: 'assistant', content: assistantMessageContent });
        }

        if (llmResponse.stop_reason === 'tool_use' && hasToolUse) {
          const toolUseRequests = assistantMessageContent.filter(
            (p): p is MessageContentPartToolUse => p.type === 'tool_use'
          );

          const toolResultContents: MessageContentPartToolResult[] = [];

          for (const toolUse of toolUseRequests) {
            if (!this.session) {
              toolResultContents.push({
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: 'Error: MCP client session not available for tool execution.',
                is_error: true
              });
              continue;
            }
            try {
              const toolResult = await this.session.callTool({ name: toolUse.name, input: toolUse.input });
              toolResultContents.push({
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: typeof toolResult.output === 'string' ? toolResult.output : JSON.stringify(toolResult.output),
              });
            } catch (error: any) {
              toolResultContents.push({
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: `Error during tool execution: ${error.message}`,
                is_error: true
              });
            }
          }

          if (toolResultContents.length > 0) {
            this.messages.push({ role: 'user', content: toolResultContents });
          } else {
            this.messages.push({ role: 'user', content: [{type: 'tool_result', tool_use_id: "general_error", content: "No tool output available despite tool_use stop reason.", is_error: true}] });
            break;
          }
        } else if (llmResponse.stop_reason === 'end_turn' || llmResponse.stop_reason === 'stop_sequence' || llmResponse.stop_reason === 'max_tokens') {
          break;
        } else {
          this.messages.push({role: 'assistant', content: [{type: 'text', text: "An unexpected state was reached with the LLM response."}]});
          break;
        }
      } catch {
        this.messages.push({
          role: 'assistant',
          content: [{ type: 'text', text: 'An error occurred while processing your request.' }],
        });
        break;
      }
    }

    return this.messages;
  }

  public async cleanup(): Promise<void> {
    if (this.session) {
      await this.session.close();
      this.session = null;
    }
  }
}

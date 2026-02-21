"use strict";
// src/mcp/services/mcp-client.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPClient = exports.HttpMCPClientSession = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * HTTP-based MCPClientSession implementation
 */
class HttpMCPClientSession {
    serverUrl;
    httpClient;
    constructor(serverUrl) {
        this.serverUrl = serverUrl;
        this.httpClient = axios_1.default.create({
            baseURL: serverUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });
    }
    async listTools() {
        const resp = await this.httpClient.get('/tools');
        // Adapt response shape if needed
        if (Array.isArray(resp.data.tools)) {
            return resp.data.tools;
        }
        return [];
    }
    async callTool(params) {
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
    async close() {
        // No persistent connection to close for HTTP
    }
}
exports.HttpMCPClientSession = HttpMCPClientSession;
/**
 * MCPClient orchestrates LLM <-> MCP server tool use
 */
class MCPClient {
    mcpServerUrl;
    tools = [];
    messages = [];
    session = null;
    constructor(mcpServerUrl) {
        this.mcpServerUrl = mcpServerUrl;
    }
    /**
     * Connect to MCP server and fetch tools
     */
    async connectToServer() {
        try {
            this.session = new HttpMCPClientSession(this.mcpServerUrl);
            await this.getMCPTools();
            return true;
        }
        catch (error) {
            this.session = null;
            return false;
        }
    }
    async getMCPTools() {
        if (!this.session) {
            this.tools = [];
            return;
        }
        try {
            this.tools = await this.session.listTools();
        }
        catch {
            this.tools = [];
        }
    }
    /**
     * Simulated LLM call (replace with actual LLM SDK integration)
     */
    async callLLM() {
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
    async processQuery(query) {
        this.messages = [{ role: 'user', content: query }];
        const maxTurns = 10;
        let currentTurn = 0;
        while (currentTurn < maxTurns) {
            currentTurn++;
            try {
                const llmResponse = await this.callLLM();
                let assistantMessageContent = [];
                let hasToolUse = false;
                for (const contentBlock of llmResponse.content) {
                    if (contentBlock.type === 'text') {
                        assistantMessageContent.push({ type: 'text', text: contentBlock.text });
                    }
                    else if (contentBlock.type === 'tool_use') {
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
                    const toolUseRequests = assistantMessageContent.filter((p) => p.type === 'tool_use');
                    const toolResultContents = [];
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
                        }
                        catch (error) {
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
                    }
                    else {
                        this.messages.push({ role: 'user', content: [{ type: 'tool_result', tool_use_id: "general_error", content: "No tool output available despite tool_use stop reason.", is_error: true }] });
                        break;
                    }
                }
                else if (llmResponse.stop_reason === 'end_turn' || llmResponse.stop_reason === 'stop_sequence' || llmResponse.stop_reason === 'max_tokens') {
                    break;
                }
                else {
                    this.messages.push({ role: 'assistant', content: [{ type: 'text', text: "An unexpected state was reached with the LLM response." }] });
                    break;
                }
            }
            catch {
                this.messages.push({
                    role: 'assistant',
                    content: [{ type: 'text', text: 'An error occurred while processing your request.' }],
                });
                break;
            }
        }
        return this.messages;
    }
    async cleanup() {
        if (this.session) {
            await this.session.close();
            this.session = null;
        }
    }
}
exports.MCPClient = MCPClient;
//# sourceMappingURL=mcp-client.js.map
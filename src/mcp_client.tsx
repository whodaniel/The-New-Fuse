import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

// --- Interfaces for MCP Communication (JSON-RPC) ---
interface JsonRpcRequest {
    jsonrpc: '2.0';
    method: string;
    params?: any;
    id: number;
}

interface JsonRpcResponse {
    jsonrpc: '2.0';
    result?: any;
    error?: { code: number; message: string; data?: any };
    id: number;
}

// --- Interface for MCP Tool Definition (as received from server) ---
interface McpToolInfo {
    name: string;
    description: string;
    inputSchema: any; // JSON Schema for input parameters
}

// --- Interface for the Tool format your Agent expects ---
export interface AgentTool {
    name: string;
    description: string;
    parameters: any;
    execute: (args: Record<string, any>) => Promise<any>;
}

// --- Configuration Interfaces ---
interface ServerConfig {
    command: string;
    args: string[];
    env?: Record<string, string>;
}

interface McpConfig {
    mcpServers: Record<string, ServerConfig>;
}

/**
 * An async exit stack for resource management
 * Simplified version since we're not installing the node-async-exit-stack package
 */
class AsyncExitStack {
    private callbacks: (() => Promise<void>)[] = [];

    async use(callback: () => Promise<void>): Promise<void> {
        this.callbacks.push(callback);
    }

    async close(): Promise<void> {
        // Execute callbacks in reverse order (LIFO)
        for (let i = this.callbacks.length - 1; i >= 0; i--) {
            try {
                await this.callbacks[i]();
            } catch (error) {
                console.error("Error during exit stack execution:", error);
            }
        }
        this.callbacks = [];
    }
}

// --- MCPServer Class ---
class MCPServer {
    public name: string;
    private config: ServerConfig;
    private process: ChildProcessWithoutNullStreams | null = null;
    private requestCounter = 0;
    private pendingRequests = new Map<number, { resolve: (value: any) => void; reject: (reason?: any) => void }>();
    private exitStack: AsyncExitStack;
    private isInitialized = false;

    constructor(name: string, config: ServerConfig, exitStack: AsyncExitStack) {
        this.name = name;
        this.config = config;
        this.exitStack = exitStack; // Use shared exit stack
        
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        const command = this.config.command;
        const args = this.config.args || [];
        const env = { ...process.env, ...(this.config.env || {}) }; // Merge environments

        try {
            this.process = spawn(command, args, {
                stdio: ['pipe', 'pipe', 'pipe'], // Use pipes for stdin, stdout, stderr
                env: env,
                shell: true // May be needed for commands like docker, npx
            });

            this.isInitialized = true;

            // Handle stdout (responses from server)
            this.process.stdout.on('data', (data) => {
                // MCP uses JSON lines, split by newline
                data.toString().trim().split('\n').forEach((line: string) => {
                    if (!line) return;
                    try {
                        const response: JsonRpcResponse = JSON.parse(line);
                        this.handleResponse(response);
                    } catch (e) {
                        console.error(`[MCPServer-${this.name}] Error parsing JSON response: ${line}`, e);
                    }
                });
            });

            // Handle stderr (errors/logs from server)
            this.process.stderr.on('data', (data) => {
                console.warn(`[MCPServer-${this.name}] STDERR: ${data.toString().trim()}`);
            });

            // Handle process exit
            this.process.on('close', (code) => {
                
                this.isInitialized = false;
                this.process = null;
                // Reject any pending requests on close
                this.pendingRequests.forEach(({ reject }) => reject(new Error(`Server ${this.name} process exited.`)));
                this.pendingRequests.clear();
            });

            this.process.on('error', (err) => {
                console.error(`[MCPServer-${this.name}] Failed to start process:`, err);
                this.isInitialized = false;
                this.process = null;
                this.pendingRequests.forEach(({ reject }) => reject(new Error(`Server ${this.name} process error.`)));
                this.pendingRequests.clear();
                throw err; // Re-throw after logging
            });

            // Register cleanup for this specific process
            await this.exitStack.use(async () => {
                await this.cleanup();
            });

            // Wait a brief moment for server to be ready (adjust if needed)
            await new Promise(resolve => setTimeout(resolve, 1000)); 

        } catch (error) {
            console.error(`[MCPServer-${this.name}] Failed during initialization:`, error);
            this.isInitialized = false; // Ensure state is correct on failure
            throw error; // Re-throw
        }
    }

    private sendRequest(method: string, params?: any): Promise<any> {
        if (!this.process || !this.process.stdin.writable) {
            return Promise.reject(new Error(`Server ${this.name} process is not running or stdin is not writable.`));
        }

        const id = ++this.requestCounter;
        const request: JsonRpcRequest = {
            jsonrpc: '2.0',
            method,
            params,
            id,
        };
        const requestString = JSON.stringify(request) + '\n'; // MCP uses JSON lines

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            this.process!.stdin.write(requestString, (err) => {
                if (err) {
                    console.error(`[MCPServer-${this.name}] Error writing to stdin:`, err);
                    this.pendingRequests.delete(id);
                    reject(err);
                }
            });

            // Timeout for requests
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    console.warn(`[MCPServer-${this.name}] Request ${id} (${method}) timed out.`);
                    this.pendingRequests.get(id)?.reject(new Error('Request timed out'));
                    this.pendingRequests.delete(id);
                }
            }, 15000); // 15 second timeout (adjust as needed)
        });
    }

    private handleResponse(response: JsonRpcResponse): void {
        const promiseCallbacks = this.pendingRequests.get(response.id);
        if (promiseCallbacks) {
            if (response.error) {
                console.error(`[MCPServer-${this.name}] Received error response:`, response.error);
                promiseCallbacks.reject(new Error(`MCP Error (${response.error.code}): ${response.error.message}`));
            } else {
                promiseCallbacks.resolve(response.result);
            }
            this.pendingRequests.delete(response.id);
        } else {
            console.warn(`[MCPServer-${this.name}] Received response for unknown request ID: ${response.id}`);
        }
    }

    async list_tools(): Promise<McpToolInfo[]> {
        if (!this.isInitialized) {
            console.warn(`[MCPServer-${this.name}] Attempted list_tools before initialization. Initializing now.`);
            await this.initialize(); // Attempt to initialize if not already
        }
        try {
            const result = await this.sendRequest('list_tools');
            return result?.tools || [];
        } catch (error) {
            console.error(`[MCPServer-${this.name}] Error during list_tools:`, error);
            return []; // Return empty list on error
        }
    }

    async call_tool(toolName: string, args: any): Promise<any> {
        if (!this.isInitialized) throw new Error(`Server ${this.name} is not initialized.`);
        
        try {
            const result = await this.sendRequest('call_tool', { tool_name: toolName, arguments: args });
            
            return result; // The actual result from the tool
        } catch (error) {
            console.error(`[MCPServer-${this.name}] Error calling tool ${toolName}:`, error);
            throw error; // Re-throw error to be handled by the agent
        }
    }

    async cleanup(): Promise<void> {
        if (this.process) {
            this.process.stdin.end(); // Close stdin first
            this.process.kill('SIGTERM'); // Send TERM signal
            // Wait a short period before forceful kill
            await new Promise(resolve => setTimeout(resolve, 500)); 
            if (!this.process.killed) {
                console.warn(`[MCPServer-${this.name}] Process did not exit gracefully, sending SIGKILL.`);
                this.process.kill('SIGKILL'); // Force kill if necessary
            }
            this.process = null;
            this.isInitialized = false;
        }
    }

    // --- Tool Conversion Logic ---
    createAgentTool(mcpTool: McpToolInfo): AgentTool {
        const execute = async (args: Record<string, any>): Promise<any> => {
            return this.call_tool(mcpTool.name, args);
        };

        return {
            name: mcpTool.name,
            description: mcpTool.description,
            parameters: mcpTool.inputSchema,
            execute: execute,
        };
    }
}

// --- MCPClient Class ---
export class MCPClient {
    private servers: MCPServer[] = [];
    private config: McpConfig | null = null;
    private exitStack = new AsyncExitStack();
    private allTools: AgentTool[] = []; // Store converted tools

    constructor() {

        // Graceful shutdown handling
        const cleanupHandler = async (signal: string) => {
            
            await this.cleanup();
            process.exit(0);
        };
        
        process.on('SIGINT', () => cleanupHandler('SIGINT'));
        process.on('SIGTERM', () => cleanupHandler('SIGTERM'));
    }

    async loadServers(configPath: string): Promise<void> {
        try {
            const absoluteConfigPath = path.resolve(configPath);
            
            const configData = await fs.readFile(absoluteConfigPath, 'utf8');
            this.config = JSON.parse(configData) as McpConfig;

            this.servers = []; // Clear previous servers if reloading
            if (this.config?.mcpServers) {
                for (const [name, serverConfig] of Object.entries(this.config.mcpServers)) {
                    const server = new MCPServer(name, serverConfig, this.exitStack);
                    this.servers.push(server);
                }
            } else {
                console.warn("[MCPClient] No 'mcpServers' found in configuration.");
            }

        } catch (error) {
            console.error(`[MCPClient] Error loading or parsing configuration file '${configPath}':`, error);
            this.config = null;
            this.servers = [];
            throw new Error(`Failed to load MCP configuration from ${configPath}`);
        }
    }

    async start(): Promise<AgentTool[]> {
        
        this.allTools = []; // Reset tools list
        const toolPromises: Promise<AgentTool[]>[] = [];

        for (const server of this.servers) {
            const startAndDiscover = async (): Promise<AgentTool[]> => {
                try {
                    await server.initialize(); // Ensure initialized
                    const mcpTools = await server.list_tools();
                    
                    return mcpTools.map(mcpTool => server.createAgentTool(mcpTool));
                } catch (e) {
                    console.error(`[MCPClient] Failed to start or get tools from server ${server.name}:`, e);
                    return []; // Return empty array if a server fails
                }
            };
            toolPromises.push(startAndDiscover());
        }

        // Wait for all servers to start and tools to be discovered concurrently
        const results = await Promise.all(toolPromises);
        results.forEach(serverTools => this.allTools.push(...serverTools));

        return this.allTools;
    }

    async cleanup(): Promise<void> {
        
        await this.exitStack.close(); // This will call the cleanup for each registered server
        
    }

    // Helper to get the tools in the format the agent expects
    getToolsForAgent(): AgentTool[] {
        return [...this.allTools]; // Return a copy
    }
}

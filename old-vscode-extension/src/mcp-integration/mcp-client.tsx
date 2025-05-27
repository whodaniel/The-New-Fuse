import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as fs from 'fs/promises';
import { readdir } from 'fs/promises'; // Added for reading directory
import * as path from 'path';
import * as vscode from 'vscode';

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

// --- Agent Context Interface ---
interface AgentContext {
    instructions?: string;
    memoryBank?: Record<string, string>; // filename -> content
}

// --- Interface for MCP Tool Definition (as received from server) ---
interface McpToolInfo {
    name: string;
    description: string;
    inputSchema: any; // JSON Schema for input parameters
}

// --- Interface for the Tool format that our agent expects ---
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
 * A simple async exit stack for resource management
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

// --- Helper function to load agent context ---
async function loadAgentContext(agentId: string, outputChannel: vscode.OutputChannel): Promise<AgentContext> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        outputChannel.appendLine(`[loadAgentContext-${agentId}] No workspace folder found.`);
        return {};
    }
    const workspaceRoot = workspaceFolder.uri.fsPath;
    const contextBaseDir = path.join(workspaceRoot, '.vscode', 'fuse-agent-context', agentId);
    const instructionsPath = path.join(contextBaseDir, 'instructions.md');
    const memoryBankDir = path.join(contextBaseDir, 'memory-bank');

    let context: AgentContext = {};

    // Load instructions
    try {
        context.instructions = await fs.readFile(instructionsPath, 'utf-8');
        outputChannel.appendLine(`[loadAgentContext-${agentId}] Loaded instructions.md`);
    } catch (error: any) {
        if (error.code !== 'ENOENT') {
            outputChannel.appendLine(`[loadAgentContext-${agentId}] Error reading instructions.md: ${error.message}`);
        } else {
             outputChannel.appendLine(`[loadAgentContext-${agentId}] instructions.md not found (optional).`);
        }
    }

    // Load memory bank files
    try {
        const memoryFiles = await readdir(memoryBankDir);
        context.memoryBank = {};
        for (const file of memoryFiles) {
            if (file.endsWith('.md')) {
                const filePath = path.join(memoryBankDir, file);
                try {
                    context.memoryBank[file] = await fs.readFile(filePath, 'utf-8');
                    outputChannel.appendLine(`[loadAgentContext-${agentId}] Loaded memory bank file: ${file}`);
                } catch (error: any) {
                     outputChannel.appendLine(`[loadAgentContext-${agentId}] Error reading memory bank file ${file}: ${error.message}`);
                }
            }
        }
         outputChannel.appendLine(`[loadAgentContext-${agentId}] Finished loading memory bank.`);
    } catch (error: any) {
        if (error.code !== 'ENOENT') {
             outputChannel.appendLine(`[loadAgentContext-${agentId}] Error reading memory bank directory: ${error.message}`);
        } else {
             outputChannel.appendLine(`[loadAgentContext-${agentId}] Memory bank directory not found (optional).`);
        }
    }

    return context;
}

// --- MCPServer Class ---
class MCPServer {
    public name: string; // Used as agentId
    private config: ServerConfig;
    private process: ChildProcessWithoutNullStreams | null = null;
    private requestCounter = 0;
    private pendingRequests = new Map<number, { resolve: (value: any) => void; reject: (reason?: any) => void }>();
    private exitStack: AsyncExitStack;
    private isInitialized = false;
    private outputChannel: vscode.OutputChannel;

    constructor(name: string, config: ServerConfig, exitStack: AsyncExitStack, outputChannel: vscode.OutputChannel) {
        this.name = name;
        this.config = config;
        this.exitStack = exitStack;
        this.outputChannel = outputChannel;
        this.log(`Prepared server: ${this.name}`);
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;
        this.log(`Initializing...`);

        const command = this.config.command;
        const args = this.config.args || [];
        const env = { ...process.env, ...(this.config.env || {}) };

        try {
            this.process = spawn(command, args, {
                stdio: ['pipe', 'pipe', 'pipe'], // Use pipes for stdin, stdout, stderr
                env: env,
                shell: true // May be needed for commands like docker, npx
            });

            this.isInitialized = true;
            this.log(`Process spawned (PID: ${this.process.pid})`);

            // Handle stdout (responses from server)
            this.process.stdout.on('data', (data) => {
                // MCP uses JSON lines, split by newline
                data.toString().trim().split('\n').forEach((line: string) => {
                    if (!line) return;
                    try {
                        const response: JsonRpcResponse = JSON.parse(line);
                        this.handleResponse(response);
                    } catch (e) {
                        this.log(`Error parsing JSON response: ${line}`, true);
                    }
                });
            });

            // Handle stderr (errors/logs from server)
            this.process.stderr.on('data', (data) => {
                this.log(`STDERR: ${data.toString().trim()}`, true);
            });

            // Handle process exit
            this.process.on('close', (code) => {
                this.log(`Process exited with code ${code}`);
                this.isInitialized = false;
                this.process = null;
                // Reject any pending requests on close
                this.pendingRequests.forEach(({ reject }) => reject(new Error(`Server ${this.name} process exited.`)));
                this.pendingRequests.clear();
            });

            this.process.on('error', (err) => {
                this.log(`Failed to start process: ${err.message}`, true);
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

            // Wait a brief moment for server to be ready
            await new Promise(resolve => setTimeout(resolve, 1000)); 
            this.log(`Initialization complete.`);

        } catch (error: any) {
            this.log(`Failed during initialization: ${error.message}`, true);
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
                    this.log(`Error writing to stdin: ${err.message}`, true);
                    this.pendingRequests.delete(id);
                    reject(err);
                }
            });

            // Timeout for requests
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.log(`Request ${id} (${method}) timed out.`, true);
                    this.pendingRequests.get(id)?.reject(new Error('Request timed out'));
                    this.pendingRequests.delete(id);
                }
            }, 15000); // 15 second timeout
        });
    }

    private handleResponse(response: JsonRpcResponse): void {
        const promiseCallbacks = this.pendingRequests.get(response.id);
        if (promiseCallbacks) {
            if (response.error) {
                this.log(`Received error response: ${response.error.message}`, true);
                promiseCallbacks.reject(new Error(`MCP Error (${response.error.code}): ${response.error.message}`));
            } else {
                promiseCallbacks.resolve(response.result);
            }
            this.pendingRequests.delete(response.id);
        } else {
            this.log(`Received response for unknown request ID: ${response.id}`, true);
        }
    }

    async list_tools(): Promise<McpToolInfo[]> {
        if (!this.isInitialized) {
            this.log(`Attempted list_tools before initialization. Initializing now.`);
            await this.initialize(); // Attempt to initialize if not already
        }
        try {
            const result = await this.sendRequest('list_tools');
            return result?.tools || [];
        } catch (error: any) {
            this.log(`Error during list_tools: ${error.message}`, true);
            return []; // Return empty list on error
        }
    }

    async call_tool(toolName: string, args: any): Promise<any> {
        if (!this.isInitialized) throw new Error(`Server ${this.name} is not initialized.`);
        this.log(`Calling tool: ${toolName} for agent: ${this.name}`);

        // --- Load Agent Context ---
        let agentContext: AgentContext = {};
        try {
            // Use this.name (server name) as the agentId
            agentContext = await loadAgentContext(this.name, this.outputChannel);
        } catch (error: any) {
            this.log(`Failed to load agent context for ${this.name}: ${error.message}`, true);
            // Proceed without context if loading fails
        }
        // --- End Load Agent Context ---

        // Inject context into arguments, ensuring args is an object
        const finalArgs = typeof args === 'object' && args !== null ? { ...args } : {};
        if (Object.keys(agentContext).length > 0) {
            finalArgs._agent_context = agentContext;
             this.log(`Injecting agent context for ${this.name}`);
        } else {
             this.log(`No agent context found or loaded for ${this.name}`);
        }

        try {
            // Send the modified arguments including the context
            const result = await this.sendRequest('call_tool', { tool_name: toolName, arguments: finalArgs });
            this.log(`Tool ${toolName} executed successfully for agent ${this.name}`);
            return result; // The actual result from the tool
        } catch (error: any) {
            this.log(`Error calling tool ${toolName}: ${error.message}`, true);
            throw error; // Re-throw error to be handled by the agent
        }
    }

    async cleanup(): Promise<void> {
        if (this.process) {
            this.log(`Cleaning up process (PID: ${this.process.pid})...`);
            this.process.stdin.end(); // Close stdin first
            this.process.kill('SIGTERM'); // Send TERM signal
            // Wait a short period before forceful kill
            await new Promise(resolve => setTimeout(resolve, 500)); 
            if (!this.process.killed) {
                this.log(`Process did not exit gracefully, sending SIGKILL.`, true);
                this.process.kill('SIGKILL'); // Force kill if necessary
            }
            this.process = null;
            this.isInitialized = false;
            this.log(`Cleanup complete.`);
        }
    }

    // Convert MCP tool to agent tool format
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

    private log(message: string, isError: boolean = false): void {
        const prefix = `[MCPServer-${this.name}]`;
        if (isError) {
            this.outputChannel.appendLine(`${prefix} ERROR: ${message}`);
        } else {
            this.outputChannel.appendLine(`${prefix} ${message}`);
        }
    }
}

// --- MCPClient Class ---
export class MCPClient {
    private servers: MCPServer[] = [];
    private config: McpConfig | null = null;
    private exitStack = new AsyncExitStack();
    private allTools: AgentTool[] = []; // Store converted tools
    private outputChannel: vscode.OutputChannel;
    private isInitialized: boolean = false;
    private analyticsEnabled: boolean = false;
    private analyticsEvents: AnalyticsEvent[] = [];

    constructor(outputChannel?: vscode.OutputChannel) {
        this.outputChannel = outputChannel || vscode.window.createOutputChannel('MCP Client');
        this.log("MCP Client initialized");
        
        // Graceful shutdown handling when used outside of VS Code
        if (typeof process !== 'undefined') {
            process.on('SIGINT', () => this.handleShutdownSignal('SIGINT'));
            process.on('SIGTERM', () => this.handleShutdownSignal('SIGTERM'));
        }
    }

    async loadServers(configPath: string): Promise<void> {
        try {
            const absoluteConfigPath = path.resolve(configPath);
            this.log(`Loading configuration from: ${absoluteConfigPath}`);
            const configData = await fs.readFile(absoluteConfigPath, 'utf8');
            this.config = JSON.parse(configData) as McpConfig;
            this.log("Configuration loaded");

            this.servers = []; // Clear previous servers if reloading
            if (this.config?.mcpServers) {
                for (const [name, serverConfig] of Object.entries(this.config.mcpServers)) {
                    const server = new MCPServer(name, serverConfig, this.exitStack, this.outputChannel);
                    this.servers.push(server);
                }
                this.log(`Loaded ${this.servers.length} server configurations`);
            } else {
                this.log("No 'mcpServers' found in configuration", true);
            }

        } catch (error: any) {
            this.log(`Error loading or parsing configuration file '${configPath}': ${error.message}`, true);
            this.config = null;
            this.servers = [];
            throw new Error(`Failed to load MCP configuration from ${configPath}`);
        }
    }

    async start(): Promise<AgentTool[]> {
        this.log("Starting server connections and discovering tools...");
        this.allTools = []; // Reset tools list
        const toolPromises: Promise<AgentTool[]>[] = [];

        for (const server of this.servers) {
            const startAndDiscover = async (): Promise<AgentTool[]> => {
                try {
                    await server.initialize(); // Ensure initialized
                    const mcpTools = await server.list_tools();
                    this.log(`Found ${mcpTools.length} tools for server: ${server.name}`);
                    return mcpTools.map(mcpTool => server.createAgentTool(mcpTool));
                } catch (e: any) {
                    this.log(`Failed to start or get tools from server ${server.name}: ${e.message}`, true);
                    return []; // Return empty array if a server fails
                }
            };
            toolPromises.push(startAndDiscover());
        }

        // Wait for all servers to start and tools to be discovered concurrently
        const results = await Promise.all(toolPromises);
        results.forEach(serverTools => this.allTools.push(...serverTools));

        this.log(`Total tools discovered and converted: ${this.allTools.length}`);
        this.isInitialized = true;
        return this.allTools;
    }

    async cleanup(): Promise<void> {
        this.log("Cleaning up all server connections...");
        await this.exitStack.close(); // This will call the cleanup for each registered server
        this.isInitialized = false;
        this.log("All resources cleaned up");
    }

    // Get all discovered tools
    getTools(): AgentTool[] {
        return [...this.allTools]; // Return a copy
    }

    // Check if the client is initialized
    isReady(): boolean {
        return this.isInitialized;
    }

    // Log helper
    private log(message: string, isError: boolean = false): void {
        const prefix = '[MCPClient]';
        if (isError) {
            this.outputChannel.appendLine(`${prefix} ERROR: ${message}`);
        } else {
            this.outputChannel.appendLine(`${prefix} ${message}`);
        }
    }

    // Handle shutdown signals
    private async handleShutdownSignal(signal: string): Promise<void> {
        this.log(`Received ${signal}. Cleaning up resources...`);
        await this.cleanup();
        if (typeof process !== 'undefined') {
            process.exit(0);
        }
    }

    // Add analytics methods
    enableAnalytics(enabled: boolean = true) {
        this.analyticsEnabled = enabled;
        this.log(`Analytics ${enabled ? 'enabled' : 'disabled'}`);
    }

    private trackEvent(type: string, data: Record<string, any>) {
        if (this.analyticsEnabled) {
            this.analyticsEvents.push({
                type,
                data,
                timestamp: Date.now()
            });
        }
    }

    async call_tool(toolName: string, args: any): Promise<any> {
        if (!this.isInitialized) throw new Error(`Server ${this.name} is not initialized.`);
        
        // Track tool usage
        this.trackEvent('tool_execution', {
            tool: toolName,
            args,
            timestamp: Date.now()
        });

        this.log(`Calling tool: ${toolName}`);
        try {
            const result = await this.sendRequest('call_tool', { tool_name: toolName, arguments: args });
            
            // Track successful execution
            this.trackEvent('tool_execution_success', {
                tool: toolName,
                duration: Date.now() - this.analyticsEvents[this.analyticsEvents.length - 1].timestamp
            });
            
            this.log(`Tool ${toolName} executed successfully`);
            return result;
        } catch (error: any) {
            // Track execution failure
            this.trackEvent('tool_execution_error', {
                tool: toolName,
                error: error.message
            });
            
            this.log(`Error calling tool ${toolName}: ${error.message}`, true);
            throw error;
        }
    }
}

/**
 * Function to load MCP configuration from package settings
 */
export async function loadMcpConfigFromSettings(): Promise<string> {
    // Try to get the config path from settings
    const configPath = vscode.workspace.getConfiguration('theFuse').get<string>('mcpConfigPath');
    
    if (configPath) {
        return configPath;
    }
    
    // If not specified, use the default location
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
        return path.join(workspaceFolder.uri.fsPath, 'mcp_config.json');
    }
    
    // Fallback to extension directory
    const extensionPath = vscode.extensions.getExtension('thefuse.the-new-fuse-vscode')?.extensionPath;
    if (extensionPath) {
        return path.join(extensionPath, 'mcp_config.json');
    }
    
    throw new Error('Could not determine MCP configuration path. Please specify it in settings.');
}

// Add Analytics Integration
interface AnalyticsEvent {
    type: string;
    data: Record<string, any>;
    timestamp: number;
}

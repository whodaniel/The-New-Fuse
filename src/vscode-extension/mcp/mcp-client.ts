/**
 * Enhanced MCP Client with Streamable HTTP Transport Support
 * 
 * This client implements the Model Context Protocol (MCP) with support for:
 * - Streamable HTTP transport for real-time updates
 * - Progress reporting for long-running tasks
 * - Enhanced error handling and retry logic
 * - Support for VS Code April 2025 features
 */

import * as vscode from 'vscode';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { EventEmitter } from 'events';


import { v4 as uuidv4 } from 'uuid';

/**
 * Progress callback type for receiving real-time updates
 */
export type ProgressCallback = (progress: number, message: string) => void;

/**
 * MCP Client Implementation with Streamable HTTP Support
 */
export class MCPClient extends EventEmitter {
    private axiosInstance: AxiosInstance;
    private config: {
        baseUrl: string;
        timeout: number;
        maxRetries: number;
        enableStreamableHttp: boolean;
        enableProgressNotifications: boolean;
    };
    private context: vscode.ExtensionContext;
    private tokenStorage: {
        [key: string]: string;
    } = {};

    /**
     * Create a new MCP Client
     */
    constructor(context: vscode.ExtensionContext) {
        super();
        this.context = context;

        // Load configuration from settings
        const mcpConfig = vscode.workspace.getConfiguration('mcp');
        
        this.config = {
            baseUrl: mcpConfig.get('baseUrl') || 'http://localhost:3000',
            timeout: mcpConfig.get('timeout') || 30000,
            maxRetries: mcpConfig.get('maxRetries') || 3,
            enableStreamableHttp: mcpConfig.get('enableStreamableHttp') || true,
            enableProgressNotifications: mcpConfig.get('enableProgressNotifications') || true
        };

        // Initialize axios instance
        this.axiosInstance = axios.create({
            baseURL: this.config.baseUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-MCP-Client': 'vscode-extension'
            }
        });

        // Add request interceptor for authentication
        this.axiosInstance.interceptors.request.use(config => {
            const token = this.tokenStorage['auth'];
            if (token) {
                config.headers!['Authorization'] = `Bearer ${token}`;
            }
            return config;
        });
    }

    /**
     * Initialize the MCP client and verify server capabilities
     */
    async initialize(): Promise<boolean> {
        try {
            // Check health status
            const healthResponse = await this.axiosInstance.get('/health');
            if (healthResponse.status !== 200) {
                throw new Error(`MCP server health check failed: ${healthResponse.statusText}`);
            }

            // Check if streamable HTTP is supported
            if (this.config.enableStreamableHttp) {
                try {
                    const capabilityResponse = await this.axiosInstance.get('/capabilities/streamable-http');
                    if (capabilityResponse.data && capabilityResponse.data.supported) {
                        vscode.window.showInformationMessage('MCP server supports Streamable HTTP transport');
                    } else {
                        vscode.window.showWarningMessage('MCP server does not support Streamable HTTP transport. Falling back to standard HTTP.');
                        this.config.enableStreamableHttp = false;
                    }
                } catch (error) {
                    vscode.window.showWarningMessage('Failed to check Streamable HTTP support. Falling back to standard HTTP.');
                    this.config.enableStreamableHttp = false;
                }
            }

            // Get available tools
            const toolsResponse = await this.axiosInstance.get('/tools');
            this.emit('toolsLoaded', toolsResponse.data);
            
            return true;
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to initialize MCP client: ${error.message}`);
            return false;
        }
    }

    /**
     * Execute an MCP tool with progress reporting
     * 
     * Uses Streamable HTTP when available to get real-time progress updates
     * Falls back to standard HTTP POST if streaming is not available
     */
    async executeToolWithProgress(
        toolName: string, 
        parameters: Record<string, any>, 
        progressCallback?: ProgressCallback
    ): Promise<any> {
        const taskId = uuidv4();

        try {
            if (this.config.enableStreamableHttp && this.config.enableProgressNotifications) {
                // Use streaming request to get progress updates
                return await this.executeToolWithStreamableHttp(toolName, parameters, taskId, progressCallback);
            } else {
                // Fall back to standard HTTP POST
                return await this.executeToolStandard(toolName, parameters, taskId);
            }
        } catch (error) {
            // Log error
            this.logError('executeToolWithProgress', error, { toolName, taskId });
            
            // Rethrow the error
            throw error;
        }
    }

    /**
     * Execute a tool with standard HTTP POST (no streaming)
     */
    private async executeToolStandard(
        toolName: string,
        parameters: Record<string, any>,
        taskId: string
    ): Promise<any> {
        const payload = {
            id: taskId,
            tool: toolName,
            parameters
        };

        let retries = 0;
        let lastError: any = null;

        while (retries <= this.config.maxRetries) {
            try {
                // Notify progress (indeterminate at start)
                this.emit('toolExecutionStarted', { toolName, taskId, timestamp: new Date() });

                const response = await this.axiosInstance.post('/tools/execute', payload);
                
                // Notify completion
                this.emit('toolExecutionCompleted', { 
                    toolName, 
                    taskId, 
                    result: response.data,
                    timestamp: new Date() 
                });
                
                return response.data;
            } catch (error) {
                lastError = error;
                retries++;
                
                // Wait before retry
                if (retries <= this.config.maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * retries));
                }
            }
        }
        
        // Notify failure
        this.emit('toolExecutionFailed', { 
            toolName, 
            taskId, 
            error: lastError?.message || 'Unknown error',
            timestamp: new Date() 
        });

        throw lastError;
    }

    /**
     * Execute a tool with Streamable HTTP to get progress updates
     */
    private async executeToolWithStreamableHttp(
        toolName: string,
        parameters: Record<string, any>,
        taskId: string,
        progressCallback?: ProgressCallback
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            const payload = {
                id: taskId,
                tool: toolName,
                parameters,
                stream: true
            };
            
            try {
                // Create signal for aborting request
                const controller = new AbortController();
                const { signal } = controller;
                
                // Track received chunks for merging at end
                let result: any = null;
                let progress = 0;
                let lastMessage = '';
                
                // Configure request with streaming support
                const config: AxiosRequestConfig = {
                    method: 'post',
                    url: `${this.config.baseUrl}/tools/execute`,
                    data: payload,
                    signal,
                    responseType: 'stream',
                };
                
                // Notify execution start
                this.emit('toolExecutionStarted', { toolName, taskId, timestamp: new Date() });
                
                // Initial progress update
                if (progressCallback) {
                    progressCallback(0, 'Initializing...');
                }
                
                // Execute request
                const response = await this.axiosInstance.request(config);
                
                // Handle data streaming
                response.data.on('data', (chunk: Buffer) => {
                    try {
                        const chunkStr = chunk.toString().trim();
                        
                        // Skip empty chunks
                        if (!chunkStr) {
                            return;
                        }
                        
                        // Parse JSON chunk
                        const data = JSON.parse(chunkStr);
                        
                        // Handle progress update
                        if (data.type === 'progress') {
                            progress = data.progress || 0;
                            lastMessage = data.message || '';
                            
                            // Update progress through callback
                            if (progressCallback) {
                                progressCallback(progress, lastMessage);
                            }
                            
                            // Emit progress event
                            this.emit('toolExecutionProgress', {
                                toolName,
                                taskId,
                                progress,
                                message: lastMessage,
                                timestamp: new Date()
                            });
                        } 
                        // Handle result update 
                        else if (data.type === 'result') {
                            result = data.result;
                        }
                    } catch (error) {
                        // Log parsing error but don't fail the whole request
                        console.error('Error parsing chunk:', error);
                    }
                });
                
                // Handle completion
                response.data.on('end', () => {
                    // Final progress update
                    if (progressCallback && progress < 100) {
                        progressCallback(100, 'Completed');
                    }
                    
                    // Notify completion
                    this.emit('toolExecutionCompleted', { 
                        toolName, 
                        taskId, 
                        result,
                        timestamp: new Date() 
                    });
                    
                    resolve(result);
                });
                
                // Handle errors
                response.data.on('error', (error: Error) => {
                    // Notify failure
                    this.emit('toolExecutionFailed', {
                        toolName,
                        taskId,
                        error: error.message,
                        timestamp: new Date()
                    });
                    
                    reject(error);
                });
            } catch (error) {
                // Notify failure
                this.emit('toolExecutionFailed', {
                    toolName,
                    taskId,
                    error: error.message,
                    timestamp: new Date()
                });
                
                reject(error);
            }
        });
    }

    /**
     * Get available tools from the MCP server
     */
    async getAvailableTools(): Promise<any[]> {
        try {
            const response = await this.axiosInstance.get('/tools');
            return response.data;
        } catch (error) {
            this.logError('getAvailableTools', error);
            throw error;
        }
    }

    /**
     * Set authentication token for future requests
     */
    setAuthToken(token: string): void {
        this.tokenStorage['auth'] = token;
    }

    /**
     * Log error with context
     */
    private logError(method: string, error: any, context: Record<string, any> = {}): void {
        console.error(`[MCPClient] Error in ${method}:`, {
            message: error.message,
            stack: error.stack,
            context
        });
        
        // Emit error event
        this.emit('error', {
            method,
            error: error.message,
            context,
            timestamp: new Date()
        });
    }
}

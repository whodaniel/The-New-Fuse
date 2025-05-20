import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { EventSource } from 'eventsource';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import {
  McpClientConfig,
  JsonRpcRequest,
  JsonRpcResponse
} from './types.js';
import { Logger } from '../logging.js';

export class McpClient extends EventEmitter {
  private config: McpClientConfig;
  private logger: Logger;
  private eventSource?: EventSource;
  private childProcess?: any;
  private connected: boolean = false;
  private requestQueue: Map<string | number, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();
  private serverCapabilities?: any;

  constructor(config: McpClientConfig, logger: Logger) {
    super();
    this.config = config;
    this.logger = logger;
  }

  /**
   * Connect to the MCP server
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    if (this.config.transport === 'stdio') {
      await this.connectViaStdio();
    } else {
      await this.connectViaSse();
    }

    // Discover server capabilities
    try {
      this.serverCapabilities = await this.listCapabilities();
      this.logger.info('Server capabilities discovered', this.serverCapabilities);
    } catch (error) {
      this.logger.warn('Failed to discover server capabilities', error);
    }

    this.connected = true;
  }

  /**
   * Disconnect from the MCP server
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    if (this.config.transport === 'stdio') {
      if (this.childProcess) {
        this.childProcess.kill();
        this.childProcess = undefined;
      }
    } else {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = undefined;
      }
    }

    // Clear all pending requests
    for (const [id, { reject, timeout }] of this.requestQueue.entries()) {
      clearTimeout(timeout);
      reject(new Error('Connection closed'));
      this.requestQueue.delete(id);
    }

    this.connected = false;
    this.logger.info('Disconnected from MCP server');
  }

  /**
   * List all capabilities provided by the server
   */
  async listCapabilities(): Promise<any> {
    return this.sendRequest({
      jsonrpc: '2.0',
      id: uuidv4(),
      method: 'mcp.listCapabilities'
    });
  }

  /**
   * Call a tool on the server
   */
  async callTool(toolName: string, params?: Record<string, any>): Promise<any> {
    return this.sendRequest({
      jsonrpc: '2.0',
      id: uuidv4(),
      method: `tool.${toolName}`,
      params
    });
  }

  /**
   * Get a resource from the server
   */
  async getResource(resourceUri: string): Promise<{ content: string, mimeType: string }> {
    return this.sendRequest({
      jsonrpc: '2.0',
      id: uuidv4(),
      method: `resource.${resourceUri}`
    });
  }

  /**
   * Get a prompt from the server with optional parameter substitution
   */
  async getPrompt(promptName: string, params?: Record<string, any>): Promise<{ text: string }> {
    return this.sendRequest({
      jsonrpc: '2.0',
      id: uuidv4(),
      method: `prompt.${promptName}`,
      params
    });
  }

  /**
   * Send a raw JSON-RPC request to the server
   */
  async sendRequest(request: JsonRpcRequest): Promise<any> {
    if (!this.connected) {
      throw new Error('Not connected to MCP server');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.requestQueue.delete(request.id);
        reject(new Error(`Request timed out: ${request.method}`));
      }, this.config.timeout || 30000);

      this.requestQueue.set(request.id, { resolve, reject, timeout });

      if (this.config.transport === 'stdio') {
        if (this.childProcess && this.childProcess.stdin.writable) {
          this.childProcess.stdin.write(JSON.stringify(request) + '\n');
        } else {
          clearTimeout(timeout);
          this.requestQueue.delete(request.id);
          reject(new Error('Child process not available'));
        }
      } else {
        // For SSE, we use a separate HTTP request for sending
        axios.post(`${this.config.serverUrl}/rpc`, request, {
          headers: {
            'Content-Type': 'application/json',
            ...(this.config.authKey ? { 'Authorization': `Bearer ${this.config.authKey}` } : {})
          }
        }).then(response => {
          this.handleResponse(response.data);
        }).catch(error => {
          clearTimeout(timeout);
          const item = this.requestQueue.get(request.id);
          if (item) {
            item.reject(error);
            this.requestQueue.delete(request.id);
          }
        });
      }
    });
  }

  private async connectViaStdio(): Promise<void> {
    const [command, ...args] = this.config.serverUrl.split(' ');
    
    this.childProcess = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.childProcess.stdout.on('data', (data: Buffer) => {
      try {
        const lines = data.toString().trim().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            const response = JSON.parse(line) as JsonRpcResponse;
            this.handleResponse(response);
          }
        }
      } catch (error) {
        this.logger.error('Error parsing response from stdio', error);
      }
    });

    this.childProcess.stderr.on('data', (data: Buffer) => {
      this.logger.error('Server stderr:', data.toString());
    });

    this.childProcess.on('error', (error: Error) => {
      this.logger.error('Child process error', error);
      this.emit('error', error);
    });

    this.childProcess.on('close', (code: number) => {
      this.logger.info(`Child process closed with code ${code}`);
      this.connected = false;
      this.emit('disconnected');
    });

    // Wait a bit to ensure the process is ready
    return new Promise(resolve => setTimeout(resolve, 500));
  }

  private async connectViaSse(): Promise<void> {
    return new Promise((resolve, reject) => {
      const headers: Record<string, string> = {};
      if (this.config.authKey) {
        headers['Authorization'] = `Bearer ${this.config.authKey}`;
      }

      this.eventSource = new EventSource(`${this.config.serverUrl}/events`, {
        headers
      });

      this.eventSource.onopen = () => {
        this.logger.info('SSE connection opened');
        resolve();
      };

      this.eventSource.onerror = (error) => {
        this.logger.error('SSE connection error', error);
        if (!this.connected) {
          reject(new Error('Failed to connect to SSE server'));
        } else {
          this.emit('error', error);
        }
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle SSE-specific messages
          if (data.connected) {
            this.logger.info(`Connected to server ${data.serverId}`);
            return;
          }

          // Handle JSON-RPC responses
          if (data.jsonrpc === '2.0') {
            this.handleResponse(data);
          }
        } catch (error) {
          this.logger.error('Error parsing SSE message', error);
        }
      };
    });
  }

  private handleResponse(response: JsonRpcResponse): void {
    const item = this.requestQueue.get(response.id);
    
    if (!item) {
      this.logger.warn(`Received response for unknown request ID: ${response.id}`);
      return;
    }

    clearTimeout(item.timeout);
    this.requestQueue.delete(response.id);

    if ('error' in response) {
      item.reject(new Error(response.error.message));
    } else {
      item.resolve(response.result);
    }
  }
}

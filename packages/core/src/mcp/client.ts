import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { Logger } from '../utils/logger';
import { MCPMessage, MCPCapability, ProtocolVersion } from './types';
import EventSource from 'eventsource';
import axios from 'axios';

export interface MCPClientConfig {
  serverUrl: string;
  transport: 'stdio' | 'sse' | 'http';
  capabilities?: MCPCapability[];
  timeout?: number;
  retryAttempts?: number;
}

export class MCPClient extends EventEmitter {
  private config: MCPClientConfig;
  private logger: Logger;
  private connected: boolean = false;
  private childProcess?: ChildProcess;
  private eventSource?: EventSource;
  private pendingRequests: Map<string, { resolve: Function; reject: Function }> = new Map();

  constructor(config: MCPClientConfig, logger: Logger) {
    super();
    this.config = config;
    this.logger = logger;
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    if (this.config.transport === 'stdio') {
      await this.connectViaStdio();
    } else if (this.config.transport === 'sse') {
      await this.connectViaSSE();
    } else if (this.config.transport === 'http') {
      await this.connectViaHTTP();
    } else {
      throw new Error(`Unsupported transport: ${this.config.transport}`);
    }

    this.connected = true;
    this.emit('connected');
  }

  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    if (this.childProcess) {
      this.childProcess.kill();
      this.childProcess = undefined;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }

    // Clear all pending requests
    this.pendingRequests.forEach(({ reject }) => {
      reject(new Error('Connection closed'));
    });
    this.pendingRequests.clear();

    this.connected = false;
    this.emit('disconnected');
  }

  async sendMessage(message: MCPMessage): Promise<any> {
    if (!this.connected) {
      throw new Error('Not connected to MCP server');
    }

    return new Promise((resolve, reject) => {
      const messageId = message.id || this.generateId();
      this.pendingRequests.set(messageId, { resolve, reject });

      if (this.config.transport === 'stdio') {
        this.sendViaStdio(message);
      } else if (this.config.transport === 'sse') {
        this.sendViaSSE(message);
      } else if (this.config.transport === 'http') {
        this.sendViaHTTP(message).then(resolve).catch(reject);
        this.pendingRequests.delete(messageId);
      }
    });
  }

  private async connectViaStdio(): Promise<void> {
    const [command, ...args] = this.config.serverUrl.split(' ');
    this.childProcess = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.childProcess.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          try {
            const message = JSON.parse(line);
            this.handleMessage(message);
          } catch (error) {
            this.logger.error('Failed to parse message from server', { line, error });
          }
        }
      });
    });

    this.childProcess.stderr?.on('data', (data: Buffer) => {
      this.logger.error('Server stderr:', data.toString());
    });

    this.childProcess.on('error', (error: Error) => {
      this.logger.error('Child process error', error);
      this.connected = false;
      this.emit('error', error);
    });

    this.childProcess.on('exit', (code: number | null) => {
      this.logger.info(`Server process exited with code ${code}`);
      this.connected = false;
      this.emit('disconnected');
    });
  }

  private async connectViaSSE(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.eventSource = new EventSource(this.config.serverUrl);

      this.eventSource.onopen = () => {
        this.logger.info('SSE connection opened');
        resolve();
      };

      this.eventSource.onerror = (error) => {
        this.logger.error('SSE connection error', error);
        reject(new Error('Failed to connect via SSE'));
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.jsonrpc === '2.0') {
            this.handleMessage(data);
          }
        } catch (error) {
          this.logger.error('Error parsing SSE message', error);
        }
      };
    });
  }

  private async connectViaHTTP(): Promise<void> {
    // HTTP transport doesn't need persistent connection
    this.logger.info('HTTP transport ready');
  }

  private sendViaStdio(message: MCPMessage): void {
    if (this.childProcess?.stdin) {
      this.childProcess.stdin.write(JSON.stringify(message) + '\n');
    }
  }

  private sendViaSSE(message: MCPMessage): void {
    // SSE is typically read-only, so this might need a different approach
    // For now, we'll use HTTP POST to send messages
    axios.post(this.config.serverUrl.replace('/events', '/rpc'), message)
      .catch(error => {
        this.logger.error('Failed to send message via SSE fallback', error);
      });
  }

  private async sendViaHTTP(message: MCPMessage): Promise<any> {
    const response = await axios.post(this.config.serverUrl, message, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }

  private handleMessage(message: any): void {
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id)!;
      this.pendingRequests.delete(message.id);

      if (message.error) {
        reject(new Error(message.error.message || 'Unknown error'));
      } else {
        resolve(message.result);
      }
    } else {
      // Handle notifications or other messages
      this.emit('message', message);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
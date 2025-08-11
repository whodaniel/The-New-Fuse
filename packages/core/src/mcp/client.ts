import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { Logger } from '../utils/logger';
import { MCPMessage, MCPCapability, ProtocolVersion } from './types';
import EventSource from 'eventsource';
import axios from 'axios';
export interface MCPClientConfig {
  // Implementation needed
}
  serverUrl: string;
  transport: 'stdio' | 'sse' | 'http';
  capabilities?: MCPCapability[];
  timeout?: number;
  retryAttempts?: number;
}

export class MCPClient extends EventEmitter {
  // Implementation needed
}
  private config: MCPClientConfig;
  private logger: Logger;
  private connected: boolean = false;
  private childProcess?: ChildProcess;
  private eventSource?: EventSource;
  private pendingRequests: Map<string, { resolve: Function; reject: Function }> = new Map();
  constructor(config: MCPClientConfig, logger: Logger) {
  // Implementation needed
}
    super();
    this.config = config;
    this.logger = logger;
  }

  async connect(): Promise<void> {
  // Implementation needed
}
    if (this.connected) {
  // Implementation needed
}
      return;
    }

    if (this.config.transport === 'stdio') {
  // Implementation needed
}
      await this.connectViaStdio();
    } else if (this.config.transport === 'sse') {
  // Implementation needed
}
      await this.connectViaSSE();
    } else if (this.config.transport === 'http') {
  // Implementation needed
}
      await this.connectViaHTTP();
    } else {
  // Implementation needed
}
      throw new Error(`Unsupported transport: ${this.config.transport}`);
    }

    this.connected = true;
    this.emit('connected');
  }

  async disconnect(): Promise<void> {
  // Implementation needed
}
    if (!this.connected) {
  // Implementation needed
}
      return;
    }

    if (this.childProcess) {
  // Implementation needed
}
      this.childProcess.kill();
      this.childProcess = undefined;
    }

    if (this.eventSource) {
  // Implementation needed
}
      this.eventSource.close();
      this.eventSource = undefined;
    }

    // Clear all pending requests
    this.pendingRequests.forEach(({ reject }) => {
  // Implementation needed
}
      reject(new Error('Connection closed'));
    });
    this.pendingRequests.clear();
    this.connected = false;
    this.emit('disconnected');
  }

  async sendMessage(message: MCPMessage): Promise<any> {
  // Implementation needed
}
    if (!this.connected) {
  // Implementation needed
}
      throw new Error('Not connected to MCP server');
    }

    return new Promise((resolve, reject) => {
  // Implementation needed
}
      const messageId = message.id || this.generateId();
      this.pendingRequests.set(messageId, { resolve, reject });
      if (this.config.transport === 'stdio') {
  // Implementation needed
}
        this.sendViaStdio(message);
      } else if (this.config.transport === 'sse') {
  // Implementation needed
}
        this.sendViaSSE(message);
      } else if (this.config.transport === 'http') {
  // Implementation needed
}
        this.sendViaHTTP(message).then(resolve).catch(reject);
        this.pendingRequests.delete(messageId);
      }
    });
  }

  private async connectViaStdio(): Promise<void> {
  // Implementation needed
}
    const [command, ...args] = this.config.serverUrl.split(' ');
    this.childProcess = spawn(command, args, {
  // Implementation needed
}
      stdio: ['pipe', 'pipe', 'pipe']
    });
    this.childProcess.stdout?.on('data', (data: Buffer) => {
  // Implementation needed
}
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
  // Implementation needed
}
        if (line.trim()) {
  // Implementation needed
}
          try {
  // Implementation needed
}
            const message = JSON.parse(line);
            this.handleMessage(message);
          } catch (error) {
  // Implementation needed
}
            this.logger.error('Failed to parse message from server', { line, error });
          }
        }
      });
    });
    this.childProcess.stderr?.on('data', (data: Buffer) => {
  // Implementation needed
}
      this.logger.error('Server stderr:', data.toString());
    });
    this.childProcess.on('error', (error: Error) => {
  // Implementation needed
}
      this.logger.error('Child process error', error);
      this.connected = false;
      this.emit('error', error);
    });
    this.childProcess.on('exit', (code: number | null) => {
  // Implementation needed
}
      this.logger.info(`Server process exited with code ${code}`);
      this.connected = false;
      this.emit('disconnected');
    });
  }

  private async connectViaSSE(): Promise<void> {
  // Implementation needed
}
    return new Promise((resolve, reject) => {
  // Implementation needed
}
      this.eventSource = new EventSource(this.config.serverUrl);
      this.eventSource.onopen = () => {
  // Implementation needed
}
        this.logger.info('SSE connection opened');
        resolve();
      };
      this.eventSource.onerror = (error) => {
  // Implementation needed
}
        this.logger.error('SSE connection error', error);
        reject(new Error('Failed to connect via SSE'));
      };
      this.eventSource.onmessage = (event) => {
  // Implementation needed
}
        try {
  // Implementation needed
}
          const data = JSON.parse(event.data);
          if (data.jsonrpc === '2.0') {
  // Implementation needed
}
            this.handleMessage(data);
          }
        } catch (error) {
  // Implementation needed
}
          this.logger.error('Error parsing SSE message', error);
        }
      };
    });
  }

  private async connectViaHTTP(): Promise<void> {
  // Implementation needed
}
    // HTTP transport doesn't need persistent connection
    this.logger.info('HTTP transport ready');
  }

  private sendViaStdio(message: MCPMessage): void {
  // Implementation needed
}
    if (this.childProcess?.stdin) {
  // Implementation needed
}
      this.childProcess.stdin.write(JSON.stringify(message) + '\n');
    }
  }

  private sendViaSSE(message: MCPMessage): void {
  // Implementation needed
}
    // SSE is typically read-only, so this might need a different approach
    // For now, we'll use HTTP POST to send messages
    axios.post(this.config.serverUrl.replace('/events', '/rpc'), message)
      .catch(error => {
  // Implementation needed
}
        this.logger.error('Failed to send message via SSE fallback', error);
      });
  }

  private async sendViaHTTP(message: MCPMessage): Promise<any> {
  // Implementation needed
}
    const response = await axios.post(this.config.serverUrl, message, {
  // Implementation needed
}
      headers: {
  // Implementation needed
}
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }

  private handleMessage(message: any): void {
  // Implementation needed
}
    if (message.id && this.pendingRequests.has(message.id)) {
  // Implementation needed
}
      const { resolve, reject } = this.pendingRequests.get(message.id)!;
      this.pendingRequests.delete(message.id);
      if (message.error) {
  // Implementation needed
}
        reject(new Error(message.error.message || 'Unknown error'));
      } else {
  // Implementation needed
}
        resolve(message.result);
      }
    } else {
  // Implementation needed
}
      // Handle notifications or other messages
      this.emit('message', message);
    }
  }

  private generateId(): string {
  // Implementation needed
}
    return Math.random().toString(36).substring(2, 15);
  }
}
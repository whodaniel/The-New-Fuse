import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger';
import { MCPMessage, MCPCapability, ProtocolVersion } from './types';

@Injectable()
export class MCPAgentServer {
  private logger = new Logger('MCPAgentServer');
  private capabilities: Set<MCPCapability> = new Set();
  private protocolVersion: ProtocolVersion = '2024-11-05';

  constructor() {
    this.initializeCapabilities();
  }

  private initializeCapabilities(): void {
    const features = new Set<string>();
    features.add('header-body-structure');
    features.add('streaming');
    features.add('encryption');
    features.add('capability-discovery');
    features.add('basic-messaging');
    features.add('tool-execution');
    features.add('resource-access');

    this.capabilities = new Set(Array.from(features) as MCPCapability[]);
  }

  async handleMessage(message: MCPMessage): Promise<MCPMessage | void> {
    try {
      switch (message.method) {
        case 'initialize':
          return this.handleInitialize(message);
        case 'ping':
          return this.handlePing(message);
        case 'listCapabilities':
          return this.handleListCapabilities(message);
        default:
          this.logger.warn(`Unhandled method: ${message.method}`);
          return {
            jsonrpc: '2.0',
            id: message.id,
            error: {
              code: -32601,
              message: `Method not found: ${message.method}`
            }
          };
      }
    } catch (error) {
      this.logger.error('Error handling message:', error);
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32603,
          message: 'Internal error'
        }
      };
    }
  }

  private handleInitialize(message: MCPMessage): MCPMessage {
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        protocolVersion: this.protocolVersion,
        capabilities: Array.from(this.capabilities),
        serverInfo: {
          name: 'TNF MCP Agent Server',
          version: '1.0.0'
        }
      }
    };
  }

  private handlePing(message: MCPMessage): MCPMessage {
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: { status: 'pong' }
    };
  }

  private handleListCapabilities(message: MCPMessage): MCPMessage {
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        capabilities: Array.from(this.capabilities)
      }
    };
  }

  addCapability(capability: MCPCapability): void {
    this.capabilities.add(capability);
    this.logger.info(`Added capability: ${capability}`);
  }

  removeCapability(capability: MCPCapability): void {
    this.capabilities.delete(capability);
    this.logger.info(`Removed capability: ${capability}`);
  }

  getCapabilities(): MCPCapability[] {
    return Array.from(this.capabilities);
  }
}
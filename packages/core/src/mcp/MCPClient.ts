import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger';
import { MCPMessage, MCPCapability, ProtocolVersion } from './types';
import { MCPClient as BaseMCPClient, MCPClientConfig } from './client';

@Injectable()
export class MCPClient extends BaseMCPClient {
  private logger = new Logger('MCPClient');

  constructor(config: MCPClientConfig) {
    super(config, new Logger('MCPClient'));
  }

  async initialize(): Promise<void> {
    try {
      await this.connect();
      this.logger.info('MCP Client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize MCP Client:', error);
      throw error;
    }
  }

  async requestCapability(
    targetAgent: string,
    capability: string,
    params: unknown = {}
  ): Promise<any> {
    const message: MCPMessage = {
      jsonrpc: '2.0',
      id: this.generateMessageId(),
      method: `capability.${capability}`,
      params: {
        targetAgent,
        ...params
      }
    };

    try {
      const response = await this.sendMessage(message);
      this.logger.info(`Capability request successful: ${capability}`);
      return response;
    } catch (error) {
      this.logger.error(`Capability request failed: ${capability}`, error);
      throw error;
    }
  }

  async listRemoteCapabilities(targetAgent: string): Promise<MCPCapability[]> {
    try {
      const response = await this.requestCapability(targetAgent, 'list', {});
      return response.capabilities || [];
    } catch (error) {
      this.logger.error('Failed to list remote capabilities:', error);
      return [];
    }
  }

  async executeRemoteTool(
    targetAgent: string,
    toolName: string,
    toolParams: unknown = {}
  ): Promise<any> {
    return this.requestCapability(targetAgent, 'tool.execute', {
      tool: toolName,
      parameters: toolParams
    });
  }

  async getRemoteResource(
    targetAgent: string,
    resourceId: string
  ): Promise<any> {
    return this.requestCapability(targetAgent, 'resource.get', {
      resourceId
    });
  }

  async sendNotification(
    targetAgent: string,
    notificationType: string,
    data: unknown = {}
  ): Promise<void> {
    const message: MCPMessage = {
      jsonrpc: '2.0',
      method: `notification.${notificationType}`,
      params: {
        targetAgent,
        data
      }
    };

    try {
      await this.sendMessage(message);
      this.logger.info(`Notification sent: ${notificationType}`);
    } catch (error) {
      this.logger.error(`Failed to send notification: ${notificationType}`, error);
      throw error;
    }
  }

  async ping(targetAgent?: string): Promise<boolean> {
    const message: MCPMessage = {
      jsonrpc: '2.0',
      id: this.generateMessageId(),
      method: 'ping',
      params: targetAgent ? { targetAgent } : {}
    };

    try {
      const response = await this.sendMessage(message);
      return response.status === 'pong';
    } catch (error) {
      this.logger.error('Ping failed:', error);
      return false;
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  async cleanup(): Promise<void> {
    try {
      await this.disconnect();
      this.logger.info('MCP Client cleaned up successfully');
    } catch (error) {
      this.logger.error('Error during cleanup:', error);
    }
  }
}
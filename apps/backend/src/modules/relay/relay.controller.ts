/**
 * Relay Controller - REST API for Relay Management
 *
 * Provides endpoints for:
 * - Agent registration and discovery
 * - Message sending
 * - System status and health
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { RelayService } from './relay.service.js';

interface RegisterAgentDto {
  id: string;
  name: string;
  type: string;
  capabilities: string[];
  metadata?: Record<string, unknown>;
}

interface SendMessageDto {
  type: string;
  source: string;
  target?: string;
  payload: unknown;
  metadata?: Record<string, unknown>;
}

interface BroadcastMessageDto {
  source: string;
  type: string;
  payload: unknown;
  filter?: {
    type?: string;
    capability?: string;
  };
}

@Controller('relay')
export class RelayController {
  private readonly logger = new Logger(RelayController.name);

  constructor(private readonly relayService: RelayService) {}

  // ========================================
  // Health & Status
  // ========================================

  @Get('health')
  async health() {
    return {
      status: this.relayService.isHealthy() ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('status')
  async status() {
    return {
      ...this.relayService.getStatus(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('config')
  async config() {
    const config = this.relayService.getConfig();
    // Remove sensitive info
    return {
      id: config.id,
      version: config.version,
      ports: config.ports,
      transports: config.transports,
      logLevel: config.logLevel,
    };
  }

  // ========================================
  // Agent Management
  // ========================================

  @Get('agents')
  async getAllAgents(@Query('type') type?: string, @Query('capability') capability?: string) {
    let agents;

    if (type) {
      agents = await this.relayService.getAgentsByType(type);
    } else if (capability) {
      agents = await this.relayService.getAgentsByCapability(capability);
    } else {
      agents = await this.relayService.getAllAgents();
    }

    return {
      count: agents.length,
      agents,
    };
  }

  @Get('agents/:id')
  async getAgent(@Param('id') id: string): Promise<any> {
    const agent = await this.relayService.getAgent(id);
    if (!agent) {
      return {
        error: 'Agent not found',
        agentId: id,
      };
    }
    return agent;
  }

  @Post('agents')
  @HttpCode(HttpStatus.CREATED)
  async registerAgent(@Body() dto: RegisterAgentDto): Promise<any> {
    this.logger.log(`Registering agent: ${dto.id}`);

    const agent = await this.relayService.registerAgent({
      id: dto.id,
      name: dto.name,
      type: dto.type,
      capabilities: dto.capabilities || [],
      status: 'online',
      metadata: dto.metadata,
    });

    return {
      success: true,
      agent,
    };
  }

  @Delete('agents/:id')
  @HttpCode(HttpStatus.OK)
  async unregisterAgent(@Param('id') id: string) {
    const result = await this.relayService.unregisterAgent(id);

    return {
      success: result,
      agentId: id,
      message: result ? 'Agent unregistered' : 'Agent not found',
    };
  }

  // ========================================
  // Messaging
  // ========================================

  @Post('messages')
  @HttpCode(HttpStatus.ACCEPTED)
  async sendMessage(@Body() dto: SendMessageDto) {
    this.logger.log(`Sending message: ${dto.type} from ${dto.source}`);

    const messageId = await this.relayService.sendMessage({
      type: dto.type,
      source: dto.source,
      target: dto.target,
      payload: dto.payload,
      metadata: dto.metadata,
    });

    return {
      success: true,
      messageId,
    };
  }

  @Post('broadcast')
  @HttpCode(HttpStatus.ACCEPTED)
  async broadcastMessage(@Body() dto: BroadcastMessageDto) {
    this.logger.log(`Broadcasting message: ${dto.type} from ${dto.source}`);

    const messageIds = await this.relayService.broadcastMessage(
      dto.source,
      dto.type,
      dto.payload,
      dto.filter
    );

    return {
      success: true,
      messageCount: messageIds.length,
      messageIds,
    };
  }

  // ========================================
  // Administration
  // ========================================

  @Post('restart')
  @HttpCode(HttpStatus.OK)
  async restart() {
    this.logger.warn('Relay restart requested');
    await this.relayService.restart();

    return {
      success: true,
      message: 'Relay server restarted',
    };
  }
}

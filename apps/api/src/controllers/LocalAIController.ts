/**
 * Local AI Controller
 * Handles detection and registration of local AI providers as Agents
 */

import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  JwtAuth,
  RateLimitTier,
  SecureAuthGuard,
  SetRateLimitTier,
} from '../guards/secure-auth.guard';

@ApiTags('local-ai')
@Controller('local-ai')
@UseGuards(SecureAuthGuard)
@JwtAuth()
@SetRateLimitTier(RateLimitTier.API)
export class LocalAIController {
  private readonly logger = new Logger(LocalAIController.name);

  @Get('status')
  @ApiOperation({ summary: 'Get Local AI feature availability status' })
  @ApiResponse({ status: 200, description: 'Local AI capability status' })
  getLocalAIStatus() {
    return {
      enabled: false,
      reason: 'Local AI integration is not implemented in this deployment.',
      endpoints: {
        detect: false,
        register: false,
        refresh: false,
        agents: false,
        agentStatus: false,
        createDefaults: false,
      },
    };
  }

  @Get('detect')
  @ApiOperation({ summary: 'Detect available local AI providers' })
  @ApiResponse({ status: 200, description: 'List of detected local AI providers' })
  async detectLocalAIs() {
    this.notImplemented('Local AI detection');
  }

  @Post('register')
  @ApiOperation({ summary: 'Register detected local AIs as user agents' })
  @ApiResponse({ status: 201, description: 'Local AI agents registered successfully' })
  async registerLocalAIs() {
    this.notImplemented('Local AI registration');
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh local AI agents for current user' })
  @ApiResponse({ status: 200, description: 'Local AI agents refreshed successfully' })
  async refreshLocalAIs() {
    this.notImplemented('Local AI refresh');
  }

  @Get('agents')
  @ApiOperation({ summary: 'Get all local AI agents for current user' })
  @ApiResponse({ status: 200, description: 'List of local AI agents' })
  async getLocalAIAgents() {
    this.notImplemented('Local AI agents retrieval');
  }

  @Get('agents/:agentId/status')
  @ApiOperation({ summary: 'Check status of a specific local AI agent' })
  @ApiResponse({ status: 200, description: 'Local AI agent status' })
  async getLocalAIAgentStatus(@Param('agentId') _agentId: string) {
    this.notImplemented('Local AI agent status check');
  }

  @Post('system/create-defaults')
  @ApiOperation({ summary: 'Create default system agents for all detected local AIs' })
  @ApiResponse({ status: 201, description: 'System local AI agents created successfully' })
  async createSystemAgents() {
    this.notImplemented('Creating system local AI agents');
  }

  private notImplemented(feature: string): never {
    throw new HttpException(
      `${feature} is not implemented in this deployment.`,
      HttpStatus.NOT_IMPLEMENTED
    );
  }
}

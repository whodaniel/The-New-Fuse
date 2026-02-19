/**
 * Local AI Controller
 * Handles detection and registration of local AI providers as Agents
 */

import { Controller, Get, Post, Param, Request, Logger, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AgentService } from '../services/agent.service';
import { SecureAuthGuard, JwtAuth, SetRateLimitTier, RateLimitTier } from '../guards/secure-auth.guard';

interface AuthenticatedRequest {
  user?: { id: string };
}

@ApiTags('local-ai')
@Controller('api/local-ai')
@UseGuards(SecureAuthGuard)
@JwtAuth()
@SetRateLimitTier(RateLimitTier.API)
export class LocalAIController {
  private readonly logger = new Logger(LocalAIController.name);

  constructor(
    private agentService: AgentService,
  ) {}

  @Get('detect')
  @ApiOperation({ summary: 'Detect available local AI providers' })
  @ApiResponse({ status: 200, description: 'List of detected local AI providers' })
  async detectLocalAIs() {
    throw new HttpException('Local AI detection is not currently available', HttpStatus.NOT_IMPLEMENTED);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register detected local AIs as user agents' })
  @ApiResponse({ status: 201, description: 'Local AI agents registered successfully' })
  async registerLocalAIs(@Request() req: AuthenticatedRequest) {
    throw new HttpException('Local AI registration is not currently available', HttpStatus.NOT_IMPLEMENTED);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh local AI agents for current user' })
  @ApiResponse({ status: 200, description: 'Local AI agents refreshed successfully' })
  async refreshLocalAIs(@Request() req: AuthenticatedRequest) {
    throw new HttpException('Local AI refresh is not currently available', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get('agents')
  @ApiOperation({ summary: 'Get all local AI agents for current user' })
  @ApiResponse({ status: 200, description: 'List of local AI agents' })
  async getLocalAIAgents(@Request() req: AuthenticatedRequest) {
    throw new HttpException('Local AI agents retrieval is not currently available', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get('agents/:agentId/status')
  @ApiOperation({ summary: 'Check status of a specific local AI agent' })
  @ApiResponse({ status: 200, description: 'Local AI agent status' })
  async getLocalAIAgentStatus(@Param('agentId') agentId: string, @Request() req: AuthenticatedRequest) {
    throw new HttpException('Local AI agent status check is not currently available', HttpStatus.NOT_IMPLEMENTED);
  }

  @Post('system/create-defaults')
  @ApiOperation({ summary: 'Create default system agents for all detected local AIs' })
  @ApiResponse({ status: 201, description: 'System local AI agents created successfully' })
  async createSystemAgents() {
    throw new HttpException('Creating system local AI agents is not currently available', HttpStatus.NOT_IMPLEMENTED);
  }
}
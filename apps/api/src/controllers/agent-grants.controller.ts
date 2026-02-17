import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CreateAgentGrantDto } from '../dto/agent-grants.dto';
import {
  JwtAuth,
  RateLimitTier,
  SecureAuthGuard,
  SetRateLimitTier,
} from '../guards/secure-auth.guard';
import { AgentApiGrantsService } from '../services/agent-api-grants.service';

@ApiTags('agent-grants')
@Controller('api/agent-grants')
@UseGuards(SecureAuthGuard)
@JwtAuth()
@SetRateLimitTier(RateLimitTier.API)
export class AgentGrantsController {
  constructor(private readonly grantsService: AgentApiGrantsService) {}

  @Get()
  @ApiOperation({ summary: 'List API grants for current user' })
  @ApiResponse({ status: 200, description: 'List of grants' })
  async list(@CurrentUser() user: { id: string }) {
    return this.grantsService.listForUser(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create scoped API grant for an agent' })
  @ApiResponse({ status: 201, description: 'Grant created with bearer token' })
  async create(@CurrentUser() user: { id: string }, @Body() dto: CreateAgentGrantDto) {
    return this.grantsService.createForUser(user.id, dto);
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: 'Revoke an API grant' })
  @ApiResponse({ status: 200, description: 'Grant revoked' })
  async revoke(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.grantsService.revokeForUser(user.id, id);
  }

  @Post(':id/rotate')
  @ApiOperation({ summary: 'Rotate grant token (invalidates prior tokens)' })
  @ApiResponse({ status: 200, description: 'New token issued' })
  async rotate(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.grantsService.rotateForUser(user.id, id);
  }
}

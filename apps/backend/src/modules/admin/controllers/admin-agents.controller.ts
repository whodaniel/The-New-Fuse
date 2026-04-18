import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../auth/guards/roles.guard.js';
import { AgentService } from '../../agent/agent.service.js';

@ApiTags('admin')
@Controller('admin/agents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('SUPER_ADMIN')
export class AdminAgentsController {
  constructor(private readonly agentService: AgentService) {}

  @Get()
  @ApiOperation({ summary: 'List all agents in the system' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated list of agents' })
  async getAllAgents(@Query('page') page: number = 1, @Query('limit') limit: number = 50) {
    return this.agentService.getAllAgentsSystem(Number(page), Number(limit));
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregate agent statistics' })
  @ApiResponse({ status: 200, description: 'Agent statistics' })
  async getAgentStats() {
    return this.agentService.getSystemAgentStats();
  }
}

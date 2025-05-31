import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AgentService } from './agent.service.js';
import { Agent, CreateAgentDto, UpdateAgentDto, AgentStatus } from '@the-new-fuse/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { User } from '@prisma/client';

@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post()
  async createAgent(
    @Body() data: CreateAgentDto,
    @CurrentUser() user: User
  ): Promise<Agent> {
    return this.agentService.createAgent(data, user.id);
  }

  @Get()
  async getAgents(
    @CurrentUser() user: User,
    @Query('capability') capability?: string
  ): Promise<Agent[]> {
    if (capability) {
      return this.agentService.getAgentsByCapability(capability, user.id);
    }
    return this.agentService.getAgents(user.id);
  }

  @Get('active')
  async getActiveAgents(@CurrentUser() user: User): Promise<Agent[]> {
    return this.agentService.getActiveAgents(user.id);
  }

  @Get(':id')
  async getAgentById(
    @Param('id') id: string,
    @CurrentUser() user: User
  ): Promise<Agent> {
    return this.agentService.getAgentById(id, user.id);
  }

  @Put(':id')
  async updateAgent(
    @Param('id') id: string,
    @Body() updates: UpdateAgentDto,
    @CurrentUser() user: User
  ): Promise<Agent> {
    return this.agentService.updateAgent(id, updates, user.id);
  }

  @Put(':id/status')
  async updateAgentStatus(
    @Param('id') id: string,
    @Body('status') status: AgentStatus,
    @CurrentUser() user: User
  ): Promise<Agent> {
    return this.agentService.updateAgentStatus(id, status, user.id);
  }

  @Delete(':id')
  async deleteAgent(
    @Param('id') id: string,
    @CurrentUser() user: User
  ): Promise<void> {
    return this.agentService.deleteAgent(id, user.id);
  }
} 
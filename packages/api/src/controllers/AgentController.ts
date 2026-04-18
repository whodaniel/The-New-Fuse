import { Body, Controller, Delete, Get, Param, Post, Put, Res, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AgentDto } from '../modules/controllers/dto/agent.dto.js'; // Updated import path
import { CurrentUser } from '../modules/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../modules/guards/jwt-auth.guard.js';
import { AgentService } from '../services/agent.service.js';
import { toError } from '../utils/error.js';

interface User {
  id: string;
  [key: string]: any;
}

@ApiTags('agents')
@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all agents for authenticated user' })
  @ApiResponse({ status: 200, description: 'List of agents', type: [AgentDto] })
  async getAllAgents(@CurrentUser() user: User, res: Response) {
    try {
      const agents = await this.agentService.getAgents(user.id);
      return res.status(200).json(agents);
    } catch (error) {
      const err = toError(error);
      return res.status(500).json({ error: err.message });
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agent by ID' })
  @ApiResponse({ status: 200, description: 'Agent found', type: AgentDto })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async getAgentById(@Param('id') id: string, @CurrentUser() user: User, res: Response) {
    try {
      const agent = await this.agentService.getAgentById(id, user.id);
      return res.status(200).json(agent);
    } catch (error) {
      const err = toError(error);
      if (err.message?.includes('not found')) {
        return res.status(404).json({ error: err.message });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new agent' })
  @ApiBody({ type: AgentDto })
  @ApiResponse({ status: 201, description: 'Agent created', type: AgentDto })
  async createAgent(@Body() createAgentDto: AgentDto, @CurrentUser() user: User, res: Response) {
    try {
      // Remove timestamp fields that should be set by the service
      const { createdAt: _createdAt, updatedAt: _updatedAt, ...agentData } = createAgentDto;
      const agent = await this.agentService.createAgent(agentData as any, user.id);
      return res.status(201).json(agent);
    } catch (error) {
      const err = toError(error);
      if (err.message?.includes('already exists')) {
        return res.status(409).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an agent' })
  @ApiBody({ type: AgentDto })
  @ApiResponse({ status: 200, description: 'Agent updated', type: AgentDto })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async updateAgent(
    @Param('id') id: string,
    @Body() updateAgentDto: AgentDto,
    @CurrentUser() user: User,
    res: Response
  ) {
    try {
      // Remove timestamp fields that should be managed by the service
      const { createdAt: _createdAt2, updatedAt: _updatedAt2, ...agentData } = updateAgentDto;
      const updatedAgent = await this.agentService.updateAgent(id, agentData as any, user.id);
      return res.status(200).json(updatedAgent);
    } catch (error) {
      const err = toError(error);
      if (err.message?.includes('not found')) {
        return res.status(404).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start an agent' })
  @ApiResponse({ status: 200, description: 'Agent started', type: AgentDto })
  async startAgent(@Param('id') id: string, @CurrentUser() user: User, @Res() res: Response) {
    try {
      const agent = await this.agentService.startAgent(id, user.id);
      return res.status(200).json(agent);
    } catch (error) {
      const err = toError(error);
      if (err.message?.includes('not found')) {
        return res.status(404).json({ error: err.message });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  @Post(':id/stop')
  @ApiOperation({ summary: 'Stop an agent' })
  @ApiResponse({ status: 200, description: 'Agent stopped', type: AgentDto })
  async stopAgent(@Param('id') id: string, @CurrentUser() user: User, @Res() res: Response) {
    try {
      const agent = await this.agentService.stopAgent(id, user.id);
      return res.status(200).json(agent);
    } catch (error) {
      const err = toError(error);
      if (err.message?.includes('not found')) {
        return res.status(404).json({ error: err.message });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an agent' })
  @ApiResponse({ status: 200, description: 'Agent deleted' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async deleteAgent(@Param('id') id: string, @CurrentUser() user: User, res: Response) {
    try {
      const deleted = await this.agentService.deleteAgent(id, user.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Agent not found or could not be deleted' });
      }
      return res.status(204).send();
    } catch (error) {
      const err = toError(error);
      if (err.message?.includes('not found')) {
        return res.status(404).json({ error: err.message });
      }
      return res.status(500).json({ error: err.message });
    }
  }
}

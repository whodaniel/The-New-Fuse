import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AgentDto } from '../../swagger/dto.classes.js';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';

@ApiTags('agents')
@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentController {
  
  @Get()
  @ApiOperation({ summary: 'Get all agents for authenticated user' })
  @ApiResponse({ status: 200, description: 'List of agents', type: [AgentDto] })
  async getAgents(@Req() req: any) {
    // In the real implementation, this would call the agent service
    return [];
  }
  
  @Get(':id')
  @ApiOperation({ summary: 'Get agent by ID' })
  @ApiResponse({ status: 200, description: 'Agent found', type: AgentDto })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async getAgentById(@Param('id') id: string, @Req() req: any) {
    // In the real implementation, this would call the agent service
    return { id, name: 'Sample Agent', userId: req.user.id };
  }
  
  @Post()
  @ApiOperation({ summary: 'Create a new agent' })
  @ApiBody({ type: AgentDto })
  @ApiResponse({ status: 201, description: 'Agent created', type: AgentDto })
  async createAgent(@Body() agentData: AgentDto, @Req() req: any) {
    // In the real implementation, this would call the agent service
    return { ...agentData, userId: req.user.id, id: 'new-id' };
  }
  
  @Put(':id')
  @ApiOperation({ summary: 'Update an agent' })
  @ApiBody({ type: AgentDto })
  @ApiResponse({ status: 200, description: 'Agent updated', type: AgentDto })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async updateAgent(@Param('id') id: string, @Body() agentData: AgentDto, @Req() req: any) {
    // In the real implementation, this would call the agent service
    return { ...agentData, userId: req.user.id, id };
  }
  
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an agent' })
  @ApiResponse({ status: 200, description: 'Agent deleted' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async deleteAgent(@Param('id') id: string, @Req() req: any) {
    // In the real implementation, this would call the agent service
    return { success: true };
  }
}
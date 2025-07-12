import { Controller, Get, Post, Put, Delete, Body, Param, HttpStatus, HttpException } from '@nestjs/common';

// Simple interfaces without external dependencies
interface CreateAgentDto {
  name: string;
  type: string;
  description?: string;
  capabilities: string[];
  systemPrompt?: string;
}

interface UpdateAgentDto {
  name?: string;
  description?: string;
  capabilities?: string[];
  systemPrompt?: string;
}

interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  description?: string;
  capabilities: string[];
  systemPrompt?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory storage for demo purposes
const agents: Map<string, Agent> = new Map();

@Controller('api/agents')
export class AgentController {
  
  @Post()
  async createAgent(@Body() data: CreateAgentDto): Promise<Agent> {
    const id = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const agent: Agent = {
      id,
      name: data.name,
      type: data.type,
      status: 'IDLE',
      description: data.description,
      capabilities: data.capabilities || [],
      systemPrompt: data.systemPrompt,
      createdAt: now,
      updatedAt: now
    };
    
    agents.set(id, agent);
    return agent;
  }

  @Get()
  async getAgents(): Promise<Agent[]> {
    return Array.from(agents.values());
  }

  @Get('active')
  async getActiveAgents(): Promise<Agent[]> {
    return Array.from(agents.values()).filter(agent => agent.status !== 'OFFLINE');
  }

  @Get(':id')
  async getAgentById(@Param('id') id: string): Promise<Agent> {
    const agent = agents.get(id);
    if (!agent) {
      throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
    }
    return agent;
  }

  @Put(':id')
  async updateAgent(@Param('id') id: string, @Body() updates: UpdateAgentDto): Promise<Agent> {
    const agent = agents.get(id);
    if (!agent) {
      throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
    }

    const updatedAgent: Agent = {
      ...agent,
      ...updates,
      updatedAt: new Date()
    };
    
    agents.set(id, updatedAgent);
    return updatedAgent;
  }

  @Put(':id/status')
  async updateAgentStatus(@Param('id') id: string, @Body('status') status: string): Promise<Agent> {
    const agent = agents.get(id);
    if (!agent) {
      throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
    }

    const updatedAgent: Agent = {
      ...agent,
      status,
      updatedAt: new Date()
    };
    
    agents.set(id, updatedAgent);
    return updatedAgent;
  }

  @Delete(':id')
  async deleteAgent(@Param('id') id: string): Promise<{ message: string }> {
    const deleted = agents.delete(id);
    if (!deleted) {
      throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
    }
    return { message: 'Agent deleted successfully' };
  }
}
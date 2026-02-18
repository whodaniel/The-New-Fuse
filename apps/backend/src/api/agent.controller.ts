import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { db, drizzleAgentRepository, drizzleUserRepository } from '@the-new-fuse/database';
import { IsArray, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { TnfRegistryService } from './tnf-registry.service';

// Define local enums to avoid Prisma dependency
export enum AgentType {
  CONVERSATIONAL = 'CONVERSATIONAL',
  TASK_BASED = 'TASK_BASED',
  AUTONOMOUS = 'AUTONOMOUS',
  REACTIVE = 'REACTIVE',
  HYBRID = 'HYBRID',
}

export enum AgentStatus {
  INACTIVE = 'INACTIVE',
  ACTIVE = 'ACTIVE',
  BUSY = 'BUSY',
  READY = 'READY',
  OFFLINE = 'OFFLINE',
  ERROR = 'ERROR',
}

export enum AgentCapability {
  TEXT_GENERATION = 'TEXT_GENERATION',
  CODE_GENERATION = 'CODE_GENERATION',
  IMAGE_GENERATION = 'IMAGE_GENERATION',
  DATA_ANALYSIS = 'DATA_ANALYSIS',
  WEB_BROWSING = 'WEB_BROWSING',
  FILE_OPERATIONS = 'FILE_OPERATIONS',
  API_INTEGRATION = 'API_INTEGRATION',
  MEMORY = 'MEMORY',
  PLANNING = 'PLANNING',
  TOOL_USE = 'TOOL_USE',
}

export class CreateAgentDto {
  @IsString()
  name: string;

  @IsEnum(AgentType)
  type: AgentType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(AgentCapability, { each: true })
  capabilities?: AgentCapability[];

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @IsString()
  userId: string;
}

export class UpdateAgentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  capabilities?: string[];

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @IsString()
  configPath?: string;

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @IsOptional()
  @IsEnum(AgentStatus)
  status?: AgentStatus;
}

@ApiTags('Agents')
@Controller('api/agents')
export class AgentController {
  constructor(private readonly tnfRegistryService: TnfRegistryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new agent' })
  @ApiBody({ type: CreateAgentDto })
  async createAgent(@Body() data: CreateAgentDto): Promise<any> {
    // If userId is not provided, we need a fallback or throw error.
    if (!data.userId) {
      // Trying to find a default user or first user to assign
      const allUsers = await drizzleUserRepository.findAll(1, 0);
      const user = allUsers[0];
      if (!user) {
        throw new HttpException('No user found to assign agent to', HttpStatus.BAD_REQUEST);
      }
      data.userId = user.id;
    }

    return drizzleAgentRepository.create({
      name: data.name,
      type: data.type as any,
      status: AgentStatus.INACTIVE as any,
      description: data.description,
      capabilities: data.capabilities || [],
      systemPrompt: data.systemPrompt,
      userId: data.userId,
    } as any);
  }

  @Get()
  @ApiOperation({ summary: 'List all agents' })
  async getAgents(): Promise<any[]> {
    return db.query.agents.findMany();
  }

  @Get('active')
  @ApiOperation({ summary: 'List active agents' })
  async getActiveAgents(): Promise<any[]> {
    return drizzleAgentRepository.findByStatus('ACTIVE');
  }

  @Get('discover')
  @ApiOperation({ summary: 'Discover agents' })
  async discoverAgents(): Promise<any[]> {
    try {
      return await this.tnfRegistryService.getDiscoverableAgents();
    } catch {
      // Legacy fallback while V2 adoption is in progress.
      return db.query.agents.findMany();
    }
  }

  @Get('frontload')
  @ApiOperation({ summary: 'Get canonical TNF V2 frontload snapshot' })
  async getFrontloadSnapshot(): Promise<any> {
    try {
      return await this.tnfRegistryService.getFrontloadSnapshot();
    } catch {
      const legacyAgents = await db.query.agents.findMany();
      return {
        source: 'legacy_agents_fallback',
        generatedAt: new Date().toISOString(),
        counts: { agents: legacyAgents.length },
        agents: legacyAgents,
      };
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agent by ID' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  async getAgentById(@Param('id') id: string): Promise<any> {
    const agent = await drizzleAgentRepository.findById(id);

    if (!agent) {
      throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
    }
    return agent;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update agent / Configure agent' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  async updateAgent(@Param('id') id: string, @Body() updates: UpdateAgentDto): Promise<any> {
    const agent = await drizzleAgentRepository.findById(id);

    if (!agent) {
      throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
    }

    const data: any = {};
    if (updates.name) data.name = updates.name;
    if (updates.description) data.description = updates.description;
    if (updates.systemPrompt) data.systemPrompt = updates.systemPrompt;
    if (updates.status) data.status = updates.status;

    // Handle capabilities
    if (updates.capabilities) {
      // Filter valid capabilities from the enum
      const validCapabilities = updates.capabilities.filter((c) =>
        Object.values(AgentCapability).includes(c as AgentCapability)
      ) as AgentCapability[];
      data.capabilities = validCapabilities;
    }

    // Handle configuration (configPath, settings) merge
    if (updates.configPath || updates.settings) {
      const currentConfig = (agent.config as Record<string, any>) || {};
      const newConfig: any = { ...currentConfig };

      if (updates.configPath) {
        newConfig.configPath = updates.configPath;
      }

      if (updates.settings) {
        newConfig.settings = {
          ...(newConfig.settings || {}),
          ...updates.settings,
        };
      }

      data.config = newConfig;
    }

    return drizzleAgentRepository.update(id, data);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update agent status' })
  async updateAgentStatus(
    @Param('id') id: string,
    @Body('status') status: AgentStatus
  ): Promise<any> {
    const agent = await drizzleAgentRepository.findById(id);
    if (!agent) {
      throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
    }

    return drizzleAgentRepository.update(id, { status: status as any });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete agent' })
  async deleteAgent(@Param('id') id: string): Promise<{ message: string }> {
    try {
      const deleted = await drizzleAgentRepository.softDelete(id);
      if (!deleted) {
        throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
      }
      return { message: 'Agent deleted successfully' };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error deleting agent', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

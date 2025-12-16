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
import {
  Agent,
  AgentCapability,
  AgentStatus,
  AgentType,
} from '@the-new-fuse/database/generated/prisma';
import { IsArray, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

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

  // The gateway sends capabilities as strings. We will try to map them to AgentCapability if possible,
  // otherwise we can just ignore or store them in config if we wanted, but Prisma expects specific enums for the capabilities field.
  // For now we allow string[] and validation will fail if they don't match the enum.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  capabilities?: string[];

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  // Configuration fields from Gateway
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
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new agent' })
  @ApiBody({ type: CreateAgentDto })
  async createAgent(@Body() data: CreateAgentDto): Promise<Agent> {
    // If userId is not provided, we need a fallback or throw error.
    // For now, let's assume a default user or provided in body.
    // In a real app, this should come from AuthGuard user.
    if (!data.userId) {
      // Trying to find a default user or first user to assign
      const user = await this.prisma.user.findFirst();
      if (!user) {
        throw new HttpException('No user found to assign agent to', HttpStatus.BAD_REQUEST);
      }
      data.userId = user.id;
    }

    return this.prisma.agent.create({
      data: {
        name: data.name,
        type: data.type,
        status: AgentStatus.INACTIVE,
        description: data.description,
        capabilities: data.capabilities || [],
        systemPrompt: data.systemPrompt,
        userId: data.userId,
      },
    });
  }

  @Get()
  @ApiOperation({ summary: 'List all agents' })
  async getAgents(): Promise<Agent[]> {
    return this.prisma.agent.findMany();
  }

  @Get('active')
  @ApiOperation({ summary: 'List active agents' })
  async getActiveAgents(): Promise<Agent[]> {
    return this.prisma.agent.findMany({
      where: {
        status: {
          not: AgentStatus.OFFLINE,
        },
      },
    });
  }

  @Get('discover')
  @ApiOperation({ summary: 'Discover agents' })
  async discoverAgents(): Promise<Agent[]> {
    // Alias for getAgents for now, or could implement filtering logic
    return this.prisma.agent.findMany();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agent by ID' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  async getAgentById(@Param('id') id: string): Promise<Agent> {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
    });

    if (!agent) {
      throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
    }
    return agent;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update agent / Configure agent' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  async updateAgent(@Param('id') id: string, @Body() updates: UpdateAgentDto): Promise<Agent> {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
    });

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

    return this.prisma.agent.update({
      where: { id },
      data,
    });
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update agent status' })
  async updateAgentStatus(
    @Param('id') id: string,
    @Body('status') status: AgentStatus
  ): Promise<Agent> {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
    });
    if (!agent) {
      throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
    }

    return this.prisma.agent.update({
      where: { id },
      data: { status },
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete agent' })
  async deleteAgent(@Param('id') id: string): Promise<{ message: string }> {
    try {
      await this.prisma.agent.delete({
        where: { id },
      });
      return { message: 'Agent deleted successfully' };
    } catch (error) {
      // P2025 is Prisma error for Record to delete does not exist.
      if (error.code === 'P2025') {
        throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
      }
      throw error;
    }
  }
}

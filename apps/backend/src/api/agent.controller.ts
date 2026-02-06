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
import { db, drizzleAgentRepository, drizzleUserRepository, schema, eq } from '@the-new-fuse/database';
import { IsArray, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';
import { createHmac } from 'crypto';

// Define local enums to avoid ORM dependency
export enum AgentType {
  CONVERSATIONAL = 'CONVERSATIONAL',
  TASK_BASED = 'TASK_BASED',
  AUTONOMOUS = 'AUTONOMOUS',
  REACTIVE = 'REACTIVE',
  HYBRID = 'HYBRID',
  GENERIC = 'GENERIC',
}

export enum AgentStatus {
  INACTIVE = 'INACTIVE',
  ACTIVE = 'ACTIVE',
  BUSY = 'BUSY',
  READY = 'READY',
  OFFLINE = 'OFFLINE',
  ERROR = 'ERROR',
  IDLE = 'IDLE',
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
  CODE_EXECUTION = 'CODE_EXECUTION',
  BROWSER_AUTOMATION = 'BROWSER_AUTOMATION',
  MESSAGING = 'MESSAGING',
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
  @IsString({ each: true })
  capabilities?: string[];

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @IsString()
  userId: string;

  @IsString()
  @IsNotEmpty()
  invitationCode: string;
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
@Controller('agents')
export class AgentController {
  constructor() {}

  private hashCode(code: string): string {
    const secret = process.env.INVITE_CODE_SECRET || process.env.ENCRYPTION_KEY || 'tnf_invite';
    return createHmac('sha256', secret).update(code).digest('hex');
  }

  @Post()
  @ApiOperation({ summary: 'Create a new agent' })
  @ApiBody({ type: CreateAgentDto })
  async createAgent(@Body() data: CreateAgentDto): Promise<any> {
    // 1. Validate Invitation Code
    if (!data.invitationCode) {
      throw new HttpException('Invitation code is required for agent registration', HttpStatus.UNAUTHORIZED);
    }

    const codeHash = this.hashCode(data.invitationCode);
    const invite = await db.query.agentInvitationCodes.findFirst({
      where: (table, { eq, and }) => and(
        eq(table.codeHash, codeHash),
        eq(table.status, 'ACTIVE')
      )
    });

    if (!invite) {
      throw new HttpException('Invalid or inactive invitation code', HttpStatus.UNAUTHORIZED);
    }

    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      throw new HttpException('Invitation code has expired', HttpStatus.UNAUTHORIZED);
    }

    if (invite.maxUses !== null && invite.usedCount >= invite.maxUses) {
      throw new HttpException('Invitation code has been exhausted', HttpStatus.UNAUTHORIZED);
    }

    // 2. Assign User
    if (!data.userId) {
      // Trying to find a default user or first user to assign
      const allUsers = await drizzleUserRepository.findAll(1, 0);
      const user = allUsers[0];
      if (!user) {
        throw new HttpException('No user found to assign agent to', HttpStatus.BAD_REQUEST);
      }
      data.userId = user.id;
    }

    // 3. Create Agent
    const agent = await drizzleAgentRepository.create({
      id: uuidv4(),
      name: data.name,
      type: data.type as any,
      status: AgentStatus.IDLE as any,
      description: data.description,
      capabilities: data.capabilities || [],
      systemPrompt: data.systemPrompt,
      userId: data.userId,
      provider: 'openclaw',
      updatedAt: new Date(),
    } as any);

    // 4. Update Invitation Usage
    await db.update(schema.agentInvitationCodes)
      .set({ 
        usedCount: invite.usedCount + 1,
        status: (invite.maxUses !== null && invite.usedCount + 1 >= invite.maxUses) ? 'EXHAUSTED' : 'ACTIVE',
        lastUsedAt: new Date(),
        lastUsedByAgentId: agent.id
      })
      .where(eq(schema.agentInvitationCodes.id, invite.id));

    return agent;
  }

  @Get()
  @ApiOperation({ summary: 'List all agents' })
  async getAgents(): Promise<any[]> {
    return db.query.agents.findMany();
  }

  @Get('active')
  @ApiOperation({ summary: 'List active agents' })
  async getActiveAgents(): Promise<any[]> {
    return drizzleAgentRepository.findActiveSystem();
  }

  @Get('discover')
  @ApiOperation({ summary: 'Discover agents' })
  async discoverAgents(): Promise<any[]> {
    return db.query.agents.findMany();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agent by ID' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  async getAgentById(@Param('id') id: string): Promise<any> {
    const agent = await drizzleAgentRepository.findByIdSystem(id);

    if (!agent) {
      throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
    }
    return agent;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update agent / Configure agent' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  async updateAgent(@Param('id') id: string, @Body() updates: UpdateAgentDto): Promise<any> {
    const agent = await drizzleAgentRepository.findByIdSystem(id);

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
      data.capabilities = updates.capabilities;
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

    return drizzleAgentRepository.update(id, agent.userId, data);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update agent status' })
  async updateAgentStatus(
    @Param('id') id: string,
    @Body('status') status: AgentStatus
  ): Promise<any> {
    const agent = await drizzleAgentRepository.findByIdSystem(id);
    if (!agent) {
      throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
    }

    return drizzleAgentRepository.update(id, agent.userId, { status: status as any } as any);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete agent' })
  async deleteAgent(@Param('id') id: string): Promise<{ message: string }> {
    try {
      // We need to fetch the agent first to get the userId for the softDelete call
      const agent = await drizzleAgentRepository.findByIdSystem(id);
      if (!agent) {
        throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
      }

      const deleted = await drizzleAgentRepository.softDelete(id, agent.userId);
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

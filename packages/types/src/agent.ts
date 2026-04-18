import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BaseEntity } from './core/base-types.js';
import { AgentCapability, AgentRole, AgentStatus, AgentTrustLevel } from './core/enums.js';

// Re-export the enums for external use
export { AgentCapability, AgentRole, AgentStatus, AgentTrustLevel };

export enum AgentType {
  BASIC = 'BASIC',
  CHAT = 'CHAT',
  WORKFLOW = 'WORKFLOW',
  TASK = 'TASK',
  ASSISTANT = 'ASSISTANT',
  ANALYSIS = 'ANALYSIS',
  CONVERSATIONAL = 'CONVERSATIONAL',
  IDE_EXTENSION = 'IDE_EXTENSION',
  API = 'API',
  GITHUB_JULES = 'GITHUB_JULES',
  DOMAIN_GAMING = 'DOMAIN_GAMING',
}

// Changed from interface to class that implements BaseEntity
export class Agent implements BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  type: AgentType;
  status: AgentStatus;
  trustLevel: AgentTrustLevel;
  description?: string;
  systemPrompt?: string;
  capabilities?: AgentCapability[];
  configuration?: unknown;

  constructor(data: Partial<Agent>) {
    this.id = data.id || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.name = data.name || '';
    this.type = data.type || AgentType.ASSISTANT;
    this.status = data.status || AgentStatus.INACTIVE;
    this.trustLevel = data.trustLevel || AgentTrustLevel.EPHEMERAL;
    this.description = data.description;
    this.systemPrompt = data.systemPrompt;
    this.capabilities = data.capabilities;
    this.configuration = data.configuration;
  }
}

// Changed from interface to class
export class CreateAgentDto {
  @ApiProperty({ required: true, description: "The agent's name" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: true, enum: AgentType, description: "The agent's type" })
  @IsEnum(AgentType)
  @IsNotEmpty()
  type: AgentType;

  @ApiProperty({ required: false, description: "A description of the agent's purpose" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false, description: 'The system-level instructions for the agent' })
  @IsString()
  @IsOptional()
  systemPrompt?: string;

  @ApiProperty({
    required: false,
    isArray: true,
    enum: AgentCapability,
    description: "The agent's capabilities",
  })
  @IsArray()
  @IsOptional()
  capabilities?: AgentCapability[];

  @ApiProperty({
    required: false,
    type: 'object',
    additionalProperties: true,
    description: 'Agent-specific configuration',
  })
  @IsOptional()
  configuration?: unknown;

  @ApiProperty({
    required: false,
    type: 'object',
    additionalProperties: true,
    description: 'Arbitrary metadata',
  })
  @IsOptional()
  metadata?: unknown;

  @ApiProperty({ required: false, enum: AgentRole, description: 'The role of the agent' })
  @IsEnum(AgentRole)
  @IsOptional()
  role?: AgentRole;

  @ApiProperty({ required: false, description: 'The provider of the agent' })
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiProperty({
    required: false,
    enum: AgentTrustLevel,
    description: 'The trust level of the agent (default: EPHEMERAL)',
    default: AgentTrustLevel.EPHEMERAL,
  })
  @IsEnum(AgentTrustLevel)
  @IsOptional()
  trustLevel?: AgentTrustLevel;

  constructor(data: Partial<CreateAgentDto>) {
    this.name = data.name || '';
    this.type = data.type || AgentType.ASSISTANT;
    this.description = data.description;
    this.systemPrompt = data.systemPrompt;
    this.capabilities = data.capabilities;
    this.configuration = data.configuration;
    this.metadata = data.metadata;
    this.role = data.role;
    this.provider = data.provider || 'default';
    this.trustLevel = data.trustLevel || AgentTrustLevel.EPHEMERAL;
  }
}

// Changed from interface to class
export class UpdateAgentDto {
  @ApiProperty({ required: false, description: "The agent's name" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false, description: "A description of the agent's purpose" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false, description: 'The system-level instructions for the agent' })
  @IsString()
  @IsOptional()
  systemPrompt?: string;

  @ApiProperty({
    required: false,
    isArray: true,
    enum: AgentCapability,
    description: "The agent's capabilities",
  })
  @IsArray()
  @IsOptional()
  capabilities?: AgentCapability[];

  @ApiProperty({
    required: false,
    type: 'object',
    additionalProperties: true,
    description: 'Agent-specific configuration',
  })
  @IsOptional()
  configuration?: unknown;

  @ApiProperty({ required: false, enum: AgentStatus, description: "The agent's status" })
  @IsEnum(AgentStatus)
  @IsOptional()
  status?: AgentStatus;

  @ApiProperty({
    required: false,
    type: 'object',
    additionalProperties: true,
    description: 'Arbitrary metadata',
  })
  @IsOptional()
  metadata?: unknown;

  @ApiProperty({ required: false, enum: AgentType, description: "The agent's type" })
  @IsEnum(AgentType)
  @IsOptional()
  type?: AgentType;

  @ApiProperty({ required: false, enum: AgentRole, description: 'The role of the agent' })
  @IsEnum(AgentRole)
  @IsOptional()
  role?: AgentRole;

  @ApiProperty({
    required: false,
    enum: AgentTrustLevel,
    description: 'The trust level of the agent',
  })
  @IsEnum(AgentTrustLevel)
  @IsOptional()
  trustLevel?: AgentTrustLevel;

  constructor(data: Partial<UpdateAgentDto> = {}) {
    this.name = data.name;
    this.description = data.description;
    this.systemPrompt = data.systemPrompt;
    this.capabilities = data.capabilities;
    this.configuration = data.configuration;
    this.status = data.status;
    this.metadata = data.metadata;
    this.type = data.type;
    this.role = data.role;
    this.trustLevel = data.trustLevel;
  }
}

export class AgentResponseDto {
  id: string;
  name: string;
  type: AgentType;
  description?: string;
  status: AgentStatus;
  trustLevel: AgentTrustLevel;
  capabilities?: AgentCapability[];
  provider?: string;
  lastActive?: Date;
  metadata?: unknown;
  profile?: AgentProfileDto;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<AgentResponseDto>) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.type = data.type || AgentType.ASSISTANT;
    this.description = data.description;
    this.status = data.status || AgentStatus.INACTIVE;
    this.trustLevel = data.trustLevel || AgentTrustLevel.EPHEMERAL;
    this.capabilities = data.capabilities;
    this.provider = data.provider;
    this.lastActive = data.lastActive;
    this.metadata = data.metadata;
    this.profile = data.profile;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }
}

/**
 * Agent Profile DTO
 * Used for agent self-identification and discovery
 */
export class AgentProfileDto {
  @ApiProperty({ required: false, description: "About me - agent's self-description" })
  @IsString()
  @IsOptional()
  about?: string;

  @ApiProperty({ required: false, description: "Agent's personality traits" })
  @IsString()
  @IsOptional()
  personality?: string;

  @ApiProperty({ required: false, description: 'Avatar URL or image path' })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty({ required: false, description: 'Signature emoji' })
  @IsString()
  @IsOptional()
  emoji?: string;

  @ApiProperty({ required: false, description: 'Tags for discovery' })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ required: false, description: 'Creator or owner name' })
  @IsString()
  @IsOptional()
  creator?: string;

  @ApiProperty({ required: false, description: 'Agent version' })
  @IsString()
  @IsOptional()
  version?: string;

  constructor(data: Partial<AgentProfileDto> = {}) {
    this.about = data.about;
    this.personality = data.personality;
    this.avatar = data.avatar;
    this.emoji = data.emoji;
    this.tags = data.tags;
    this.creator = data.creator;
    this.version = data.version;
  }
}

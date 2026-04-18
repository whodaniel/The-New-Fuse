import { IsString, IsOptional, IsArray, IsObject, IsEnum } from 'class-validator';
// @ts-ignore
// @ts-ignore
import { AgentType, AgentStatus } from '@the-new-fuse/types';

export class AgentProfileDto {
  @IsOptional()
  @IsString()
  about?: string;

  @IsOptional()
  @IsString()
  personality?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  emoji?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsString()
  creator?: string;

  @IsOptional()
  @IsString()
  version?: string;
}

export class CreateAgentDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(AgentType)
  type!: AgentType;

  @IsOptional()
  @IsArray()
  capabilities?: string[];

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @IsObject()
  profile?: AgentProfileDto;
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
  capabilities?: string[];

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @IsEnum(AgentStatus)
  status?: AgentStatus;

  @IsOptional()
  @IsObject()
  profile?: AgentProfileDto;
}

export class AgentResponseDto {
  id!: string;
  name!: string;
  description?: string;
  type!: AgentType;
  status!: AgentStatus;
  capabilities!: string[];
  config!: Record<string, any>;
  systemPrompt?: string;
  profile?: AgentProfileDto;
  userId!: string;
  createdAt!: Date;
  updatedAt!: Date;
}

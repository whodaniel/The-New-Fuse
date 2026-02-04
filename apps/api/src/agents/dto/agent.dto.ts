import { AgentStatus, AgentType } from '@the-new-fuse/types';
import { IsArray, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

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
  userId!: string;
  createdAt!: Date;
  updatedAt!: Date;
}

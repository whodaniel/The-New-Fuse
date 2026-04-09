import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import type { UpdateAgentDto as IUpdateAgentDto } from '@the-new-fuse/types';
import { AgentType, AgentCapability } from '@the-new-fuse/types';

export class UpdateAgentDto implements IUpdateAgentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(AgentType)
  type?: AgentType;

  @IsOptional()
  @IsArray()
  capabilities?: AgentCapability[];

  @IsOptional()
  metadata?: Record<string, any>;
}

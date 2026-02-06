import type { UpdateAgentDto as IUpdateAgentDto } from '@the-new-fuse/types';
import { AgentCapability, AgentType } from '@the-new-fuse/types';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

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

import { IsString, IsOptional, IsEnum } from 'class-validator';
import type { UpdateAgentDto as IUpdateAgentDto } from '@the-new-fuse/types';
import { AgentType } from '@the-new-fuse/types';

export class UpdateAgentDto implements IUpdateAgentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(AgentType)
  type?: AgentType;

  @IsOptional()
  metadata?: Record<string, any>;
}

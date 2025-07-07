import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum } from 'class-validator';
import type { CreateAgentDto as ICreateAgentDto, AgentCapabilityConfig } from '@the-new-fuse/types';
import { AgentType } from '@the-new-fuse/types';

export class CreateAgentDto implements ICreateAgentDto {
  @IsString()
  @IsNotEmpty()
  name: string = '';

  @IsEnum(AgentType)
  @IsNotEmpty()
  type: AgentType = AgentType.ASSISTANT;

  @IsArray()
  @IsOptional()
  capabilities: AgentCapabilityConfig[] = [];

  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  ownerId?: string;
}

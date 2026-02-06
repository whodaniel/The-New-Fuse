import type { CreateAgentDto as ICreateAgentDto } from '@the-new-fuse/types';
import { AgentCapability, AgentType } from '@the-new-fuse/types';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAgentDto implements ICreateAgentDto {
  @IsString()
  @IsNotEmpty()
  name: string = '';

  @IsEnum(AgentType)
  @IsNotEmpty()
  type: AgentType = AgentType.ASSISTANT;

  @IsArray()
  @IsOptional()
  capabilities: AgentCapability[] = [];

  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  ownerId?: string;
}

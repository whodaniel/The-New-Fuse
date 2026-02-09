import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum } from 'class-validator';
import type { CreateAgentDto as ICreateAgentDto } from '@the-new-fuse/types';
import { AgentType, AgentCapability } from '@the-new-fuse/types';

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

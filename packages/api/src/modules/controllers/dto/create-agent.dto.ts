import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import type { CreateAgentDto as ICreateAgentDto } from '@the-new-fuse/types';

export class CreateAgentDto implements ICreateAgentDto {
  @IsString()
  @IsNotEmpty()
  name: string = '';

  @IsString()
  @IsNotEmpty()
  type: string = '';

  @IsArray()
  @IsOptional()
  capabilities: string[] = [];

  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  ownerId?: string;
}

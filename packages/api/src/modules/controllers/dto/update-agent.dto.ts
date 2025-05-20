import { IsString, IsOptional } from 'class-validator';
import type { UpdateAgentDto as IUpdateAgentDto } from '@the-new-fuse/types';

export class UpdateAgentDto implements IUpdateAgentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

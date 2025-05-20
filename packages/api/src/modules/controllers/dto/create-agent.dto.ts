import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import type { CreateAgentDto as ICreateAgentDto } from '@the-new-fuse/types';

export class CreateAgentDto implements ICreateAgentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

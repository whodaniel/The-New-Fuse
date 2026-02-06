import { ApiProperty } from '@nestjs/swagger';
import { AgentCapability, AgentType } from '@the-new-fuse/types';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class SearchAgentDto {
  @ApiProperty({
    required: false,
    description: 'Filter agents by name (case-insensitive, partial match)',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    required: false,
    enum: AgentType,
    description: 'Filter agents by type',
  })
  @IsEnum(AgentType)
  @IsOptional()
  type?: AgentType;

  @ApiProperty({
    required: false,
    enum: AgentCapability,
    description: 'Filter agents by capability',
  })
  @IsEnum(AgentCapability)
  @IsOptional()
  capability?: AgentCapability;
}

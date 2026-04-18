import { IsString, IsNotEmpty, IsOptional, IsArray, IsObject, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AgentCapabilityDto {
  @ApiProperty({ description: 'Capability name', example: 'code_generation' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Capability type', enum: ['core', 'extended', 'custom'], example: 'core' })
  @IsEnum(['core', 'extended', 'custom'])
  type: 'core' | 'extended' | 'custom';

  @ApiPropertyOptional({ description: 'Capability version', example: '1.0.0' })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiPropertyOptional({ description: 'Capability description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Capability parameters', type: 'object' })
  @IsObject()
  @IsOptional()
  parameters?: Record<string, any>;
}

export class RegisterAgentDto {
  @ApiProperty({ description: 'Agent name', example: 'CodeAssistantAgent' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Agent version', example: '1.0.0' })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiPropertyOptional({ description: 'Agent author', example: 'The New Fuse Team' })
  @IsString()
  @IsOptional()
  author?: string;

  @ApiPropertyOptional({ description: 'Agent description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Agent capabilities', type: [AgentCapabilityDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgentCapabilityDto)
  capabilities: AgentCapabilityDto[];

  @ApiPropertyOptional({ description: 'Agent metadata', type: 'object' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Heartbeat interval in milliseconds', example: 60000 })
  @IsOptional()
  heartbeatInterval?: number;
}

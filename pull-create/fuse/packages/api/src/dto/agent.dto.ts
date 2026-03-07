import { IsString, IsOptional, IsEnum, IsArray, IsObject, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AgentStatus } from '@the-new-fuse/types';


export class CreateAgentDto {
  @ApiProperty({ description: 'Agent name' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Agent description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Agent type' })
  @IsString()
  type!: string;

  @ApiPropertyOptional({ enum: AgentStatus, description: 'Agent status' })
  @IsOptional()
  @IsEnum(AgentStatus)
  status?: AgentStatus;

  @ApiPropertyOptional({ description: 'Agent capabilities', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  capabilities?: string[];

  @ApiProperty({ description: 'Agent provider' })
  @IsString()
  provider!: string;

  @ApiPropertyOptional({ description: 'Last active timestamp' })
  @IsOptional()
  @IsDateString()
  lastActive?: string;

  @ApiPropertyOptional({ description: 'Agent metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class UpdateAgentDto {
  @ApiPropertyOptional({ description: 'Agent name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Agent description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Agent type' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ enum: AgentStatus, description: 'Agent status' })
  @IsOptional()
  @IsEnum(AgentStatus)
  status?: AgentStatus;

  @ApiPropertyOptional({ description: 'Agent capabilities', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  capabilities?: string[];

  @ApiPropertyOptional({ description: 'Agent provider' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ description: 'Last active timestamp' })
  @IsOptional()
  @IsDateString()
  lastActive?: string;

  @ApiPropertyOptional({ description: 'Agent metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class AgentResponseDto {
  @ApiProperty({ description: 'Agent ID' })
  id!: string;

  @ApiProperty({ description: 'Agent name' })
  name!: string;

  @ApiPropertyOptional({ description: 'Agent description' })
  description?: string;

  @ApiProperty({ description: 'Agent type' })
  type!: string;

  @ApiProperty({ enum: AgentStatus, description: 'Agent status' })
  status!: AgentStatus;

  @ApiProperty({ description: 'Agent capabilities', type: [String] })
  capabilities!: string[];

  @ApiProperty({ description: 'Agent provider' })
  provider!: string;

  @ApiProperty({ description: 'Last active timestamp' })
  lastActive!: Date;

  @ApiPropertyOptional({ description: 'Agent metadata' })
  metadata?: any;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Update timestamp' })
  updatedAt!: Date;
}
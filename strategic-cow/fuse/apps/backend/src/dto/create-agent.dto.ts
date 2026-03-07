import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * Agent status enum
 */
export enum AgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TRAINING = 'training',
  ERROR = 'error',
}

/**
 * Agent capability DTO
 */
export class AgentCapabilityDto {
  @IsString({ message: 'Capability name must be a string' })
  @IsNotEmpty({ message: 'Capability name is required' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Capability description must be a string' })
  description?: string;

  @IsOptional()
  @IsObject({ message: 'Capability parameters must be an object' })
  parameters?: Record<string, any>;
}

/**
 * Data Transfer Object for creating a new agent
 *
 * Validates agent creation data before processing.
 * - Name is required and limited to 100 characters
 * - Description is optional but limited to 500 characters
 * - Status defaults to 'active' if not provided
 * - Capabilities array is validated
 * - Metadata is optional JSON object
 *
 * This DTO provides comprehensive input validation to prevent
 * malicious data from entering the system.
 */
export class CreateAgentDto {
  @IsString({ message: 'Agent name must be a string' })
  @IsNotEmpty({ message: 'Agent name is required' })
  @MaxLength(100, { message: 'Agent name cannot exceed 100 characters' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;

  @IsOptional()
  @IsEnum(AgentStatus, { message: 'Status must be one of: active, inactive, training, error' })
  status?: AgentStatus;

  @IsOptional()
  @IsString({ message: 'Type must be a string' })
  @MaxLength(50, { message: 'Type cannot exceed 50 characters' })
  type?: string;

  @IsOptional()
  @IsArray({ message: 'Capabilities must be an array' })
  @ValidateNested({ each: true })
  @Type(() => AgentCapabilityDto)
  capabilities?: AgentCapabilityDto[];

  @IsOptional()
  @IsString({ message: 'Model must be a string' })
  @MaxLength(100, { message: 'Model cannot exceed 100 characters' })
  model?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Temperature must be a number' })
  @Min(0, { message: 'Temperature must be at least 0' })
  temperature?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Max tokens must be a number' })
  @Min(1, { message: 'Max tokens must be at least 1' })
  maxTokens?: number;

  @IsOptional()
  @IsString({ message: 'System prompt must be a string' })
  systemPrompt?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Endpoint must be a valid URL' })
  endpoint?: string;

  @IsOptional()
  @IsObject({ message: 'Configuration must be an object' })
  configuration?: Record<string, any>;

  @IsOptional()
  @IsObject({ message: 'Metadata must be an object' })
  metadata?: Record<string, any>;

  @IsOptional()
  @IsBoolean({ message: 'isPublic must be a boolean' })
  isPublic?: boolean;

  @IsOptional()
  @IsArray({ message: 'Tags must be an array' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  tags?: string[];
}

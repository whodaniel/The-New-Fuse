import { ApiProperty } from '@nestjs/swagger';
import { AgentStatus } from '@the-new-fuse/types';
import { Allow } from 'class-validator';

/**
 * DTO class for Agent model to be used with Swagger
 */
export class AgentDto {
  @Allow()
  @ApiProperty({ description: 'Unique identifier for the agent' })
  id?: string;

  @Allow()
  @ApiProperty({ description: 'Name of the agent' })
  name: string = '';

  @Allow()
  @ApiProperty({ description: 'Type of the agent' })
  type?: string;

  @Allow()
  @ApiProperty({ description: 'Current status of the agent', example: 'IDLE', enum: AgentStatus })
  status?: AgentStatus;

  @Allow()
  @ApiProperty({ description: 'ID of the user who owns this agent' })
  userId?: string;

  @Allow()
  @ApiProperty({ description: 'List of capabilities this agent has', type: [String] })
  capabilities?: string[];

  @Allow()
  @ApiProperty({ description: 'When the agent was created' })
  createdAt?: string;

  @Allow()
  @ApiProperty({ description: 'When the agent was last updated' })
  updatedAt?: string;

  @Allow()
  @ApiProperty({ description: 'Description of the agent' })
  description?: string;

  @Allow()
  @ApiProperty({ description: 'Provider of the agent' })
  provider?: string;

  @Allow()
  @ApiProperty({ description: 'Last active timestamp' })
  lastActive?: Date;

  @Allow()
  @ApiProperty({ description: 'Additional metadata' })
  metadata?: any;

  @Allow()
  @ApiProperty({ description: 'System prompt for agent behavior', required: false })
  systemPrompt?: string;

  @Allow()
  @ApiProperty({ description: 'Primary model identifier', required: false })
  model?: string;

  @Allow()
  @ApiProperty({ description: 'Agent version', required: false })
  version?: string;

  @Allow()
  @ApiProperty({
    description: 'Primary configuration payload',
    required: false,
    type: 'object',
    additionalProperties: true,
  })
  config?: Record<string, any>;

  @Allow()
  @ApiProperty({
    description: 'Configuration alias from legacy/new UI payloads',
    required: false,
    type: 'object',
    additionalProperties: true,
  })
  configuration?: Record<string, any>;

  @Allow()
  @ApiProperty({
    description: 'Public profile metadata',
    required: false,
    type: 'object',
    additionalProperties: true,
  })
  profile?: Record<string, any>;
}

import { ApiProperty } from '@nestjs/swagger';
import { AgentStatus } from '@the-new-fuse/types';

/**
 * DTO class for Agent model to be used with Swagger
 */
export class AgentDto {
  @ApiProperty({ description: 'Unique identifier for the agent' })
  id?: string;

  @ApiProperty({ description: 'Name of the agent' })
  name: string = '';

  @ApiProperty({ description: 'Type of the agent' })
  type?: string;

  @ApiProperty({ description: 'Current status of the agent', example: 'IDLE', enum: AgentStatus })
  status?: AgentStatus;

  @ApiProperty({ description: 'ID of the user who owns this agent' })
  userId?: string;

  @ApiProperty({ description: 'List of capabilities this agent has', type: [String] })
  capabilities?: string[];

  @ApiProperty({ description: 'When the agent was created' })
  createdAt?: string;

  @ApiProperty({ description: 'When the agent was last updated' })
  updatedAt?: string;

  @ApiProperty({ description: 'Description of the agent' })
  description?: string;

  @ApiProperty({ description: 'Provider of the agent' })
  provider?: string;

  @ApiProperty({ description: 'Last active timestamp' })
  lastActive?: Date;

  @ApiProperty({ description: 'Additional metadata' })
  metadata?: any;
}

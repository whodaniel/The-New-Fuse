import { ApiProperty } from '@nestjs/swagger';

// Define AgentType and AgentStatus enums compatible with Drizzle schema
export enum AgentType {
  BASIC = 'BASIC',
  CHAT = 'CHAT',
  WORKFLOW = 'WORKFLOW',
  TASK = 'TASK',
  ASSISTANT = 'ASSISTANT',
  ANALYSIS = 'ANALYSIS',
  CONVERSATIONAL = 'CONVERSATIONAL',
  IDE_EXTENSION = 'IDE_EXTENSION',
  API = 'API',
}

export enum AgentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  IDLE = 'IDLE',
  BUSY = 'BUSY',
  ERROR = 'ERROR',
  OFFLINE = 'OFFLINE',
  INITIALIZING = 'INITIALIZING',
  READY = 'READY',
  TERMINATED = 'TERMINATED',
}

export class CreateAgentDto {
  @ApiProperty({
    description: 'Name of the agent',
    example: 'Code Analysis Agent',
  })
  name: string;

  @ApiProperty({
    description: 'Description of the agent',
    example: 'Analyzes code quality and provides suggestions',
  })
  description: string;

  @ApiProperty({
    description: 'Type of the agent',
    enum: AgentType,
    example: AgentType.API,
  })
  type: AgentType;

  @ApiProperty({
    description: 'Version of the agent',
    example: '1.0.0',
  })
  version?: string;

  @ApiProperty({
    description: 'List of agent capabilities',
    type: [String],
    example: ['code_analysis', 'quality_check', 'suggestion'],
  })
  capabilities?: string[];

  @ApiProperty({
    description: 'Additional metadata for the agent',
    type: Object,
    example: { author: 'user@example.com', framework: 'nestjs' },
  })
  metadata?: any;
}

export class UpdateAgentDto {
  @ApiProperty({
    description: 'Name of the agent',
    example: 'Code Analysis Agent',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'Description of the agent',
    example: 'Analyzes code quality and provides suggestions',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Type of the agent',
    enum: AgentType,
    example: AgentType.API,
    required: false,
  })
  type?: AgentType;

  @ApiProperty({
    description: 'Version of the agent',
    example: '1.0.0',
    required: false,
  })
  version?: string;

  @ApiProperty({
    description: 'List of agent capabilities',
    type: [String],
    example: ['code_analysis', 'quality_check', 'suggestion'],
    required: false,
  })
  capabilities?: string[];

  @ApiProperty({
    description: 'Additional metadata for the agent',
    type: Object,
    example: { author: 'user@example.com', framework: 'nestjs' },
    required: false,
  })
  metadata?: any;
}

export class AgentResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the agent',
    example: 'agent_12345',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the agent',
    example: 'Code Analysis Agent',
  })
  name: string;

  @ApiProperty({
    description: 'Description of the agent',
    example: 'Analyzes code quality and provides suggestions',
  })
  description: string;

  @ApiProperty({
    description: 'Type of the agent',
    enum: AgentType,
    example: AgentType.API,
  })
  type: AgentType;

  @ApiProperty({
    description: 'Current status of the agent',
    enum: AgentStatus,
    example: AgentStatus.ACTIVE,
  })
  status: AgentStatus;

  @ApiProperty({
    description: 'When the agent was created',
    example: '2023-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the agent was last updated',
    example: '2023-01-01T00:00:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'List of agent capabilities',
    type: [Object],
    example: [
      {
        name: 'code_analysis',
        type: 'analysis',
        version: '1.0',
        description: 'Analyzes code quality',
      },
    ],
  })
  capabilities: Array<{
    name: string;
    type: string;
    version: string;
    description: string;
  }>;

  @ApiProperty({
    description: 'Registration verification status',
    example: 'VERIFIED',
  })
  registrationStatus: string;

  @ApiProperty({
    description: 'Onboarding status',
    example: 'COMPLETED',
  })
  onboardingStatus: string;
}

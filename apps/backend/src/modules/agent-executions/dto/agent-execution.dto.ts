import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum ExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export class AgentExecutionQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by agent ID',
    example: 'agent_123',
  })
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiPropertyOptional({
    description: 'Filter by execution status',
    enum: ExecutionStatus,
    example: ExecutionStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(ExecutionStatus)
  status?: ExecutionStatus;

  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: 'usr_123',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Start date for filtering (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class AgentExecutionResponseDto {
  @ApiProperty({ example: 'exec_123456' })
  id: string;

  @ApiProperty({ example: 'agent_123' })
  agentId: string;

  @ApiProperty({ example: 'My AI Agent' })
  agentName: string;

  @ApiProperty({ example: 'usr_123' })
  userId: string;

  @ApiProperty({
    enum: ExecutionStatus,
    example: ExecutionStatus.COMPLETED,
  })
  status: ExecutionStatus;

  @ApiPropertyOptional({
    description: 'Execution input parameters',
    example: { query: 'Process this data' },
  })
  input?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Execution output/result',
    example: { result: 'Processing completed' },
  })
  output?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Error message if execution failed',
    example: 'Rate limit exceeded',
  })
  error?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  startedAt: Date;

  @ApiPropertyOptional({ example: '2024-01-01T00:05:30.000Z' })
  completedAt?: Date;

  @ApiPropertyOptional({
    description: 'Execution duration in milliseconds',
    example: 330000,
  })
  duration?: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;
}

export class AgentExecutionListResponseDto {
  @ApiProperty({
    type: [AgentExecutionResponseDto],
    description: 'List of agent executions',
  })
  executions: AgentExecutionResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      total: 100,
      page: 1,
      limit: 20,
      totalPages: 5,
    },
  })
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MemoryMetricsDto {
  @ApiProperty({
    description: 'Total memory in bytes',
    example: 8589934592
  })
  total: number;

  @ApiProperty({
    description: 'Used memory in bytes',
    example: 4294967296
  })
  used: number;

  @ApiProperty({
    description: 'Free memory in bytes',
    example: 4294967296
  })
  free: number;

  @ApiProperty({
    description: 'Memory usage percentage',
    example: 50.5
  })
  usagePercent: number;
}

export class CpuMetricsDto {
  @ApiProperty({
    description: 'Number of CPU cores',
    example: 8
  })
  cores: number;

  @ApiProperty({
    description: 'CPU usage percentage',
    example: 45.2
  })
  usagePercent: number;

  @ApiProperty({
    description: 'CPU load average (1 minute)',
    example: 2.5
  })
  loadAverage: number;
}

export class DatabaseMetricsDto {
  @ApiProperty({
    description: 'Database connection status',
    example: 'connected'
  })
  status: string;

  @ApiProperty({
    description: 'Number of active connections',
    example: 12
  })
  activeConnections: number;

  @ApiProperty({
    description: 'Total number of queries executed',
    example: 15234
  })
  totalQueries: number;

  @ApiProperty({
    description: 'Average query time in milliseconds',
    example: 25.3
  })
  avgQueryTime: number;
}

export class ApiMetricsDto {
  @ApiProperty({
    description: 'Total number of requests',
    example: 100000
  })
  totalRequests: number;

  @ApiProperty({
    description: 'Requests per minute',
    example: 150
  })
  requestsPerMinute: number;

  @ApiProperty({
    description: 'Average response time in milliseconds',
    example: 125.5
  })
  avgResponseTime: number;

  @ApiProperty({
    description: 'Error rate percentage',
    example: 0.5
  })
  errorRate: number;

  @ApiPropertyOptional({
    description: 'Response status code distribution',
    example: {
      '200': 95000,
      '400': 3000,
      '500': 2000
    }
  })
  statusCodeDistribution?: Record<string, number>;
}

export class ServiceHealthDto {
  @ApiProperty({
    description: 'Service name',
    example: 'database'
  })
  name: string;

  @ApiProperty({
    description: 'Service status',
    example: 'healthy',
    enum: ['healthy', 'degraded', 'unhealthy']
  })
  status: 'healthy' | 'degraded' | 'unhealthy';

  @ApiPropertyOptional({
    description: 'Response time in milliseconds',
    example: 5
  })
  responseTime?: number;

  @ApiPropertyOptional({
    description: 'Last check timestamp',
    example: '2024-01-01T00:00:00.000Z'
  })
  lastCheck?: Date;

  @ApiPropertyOptional({
    description: 'Additional details',
    example: 'All systems operational'
  })
  message?: string;
}

export class SystemMetricsResponseDto {
  @ApiProperty({
    description: 'Overall system status',
    example: 'healthy',
    enum: ['healthy', 'degraded', 'unhealthy']
  })
  status: 'healthy' | 'degraded' | 'unhealthy';

  @ApiProperty({
    description: 'System uptime in seconds',
    example: 86400
  })
  uptime: number;

  @ApiProperty({
    description: 'Server timestamp',
    example: '2024-01-01T00:00:00.000Z'
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Memory metrics',
    type: MemoryMetricsDto
  })
  memory: MemoryMetricsDto;

  @ApiProperty({
    description: 'CPU metrics',
    type: CpuMetricsDto
  })
  cpu: CpuMetricsDto;

  @ApiProperty({
    description: 'Database metrics',
    type: DatabaseMetricsDto
  })
  database: DatabaseMetricsDto;

  @ApiProperty({
    description: 'API metrics',
    type: ApiMetricsDto
  })
  api: ApiMetricsDto;

  @ApiProperty({
    description: 'Service health checks',
    type: [ServiceHealthDto]
  })
  services: ServiceHealthDto[];

  @ApiPropertyOptional({
    description: 'Application version',
    example: '1.0.0'
  })
  version?: string;

  @ApiPropertyOptional({
    description: 'Environment',
    example: 'production'
  })
  environment?: string;
}

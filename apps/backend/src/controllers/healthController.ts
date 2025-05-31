import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService, HealthStatus } from '../services/healthService.js';
import { AuthGuard } from '../guards/authGuard.js';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Get basic health status' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async getBasicHealth() {
    const health = await this.healthService.getStatus();
    return {
      status: health.status,
      timestamp: health.timestamp
    };
  }

  @Get('/detailed')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get detailed health status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Detailed health information',
    type: 'object',
    schema: {
      properties: {
        status: { 
          type: 'string',
          enum: ['healthy', 'degraded', 'unhealthy']
        },
        timestamp: {
          type: 'string',
          format: 'date-time'
        },
        components: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                latency: { type: 'number' },
                error: { type: 'string' }
              }
            },
            redis: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                latency: { type: 'number' },
                error: { type: 'string' }
              }
            },
            cache: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                stats: {
                  type: 'object',
                  properties: {
                    hits: { type: 'number' },
                    misses: { type: 'number' },
                    keys: { type: 'number' },
                    memoryUsed: { type: 'number' }
                  }
                },
                error: { type: 'string' }
              }
            },
            system: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                uptime: { type: 'number' },
                memory: {
                  type: 'object',
                  properties: {
                    used: { type: 'number' },
                    total: { type: 'number' },
                    percentage: { type: 'number' }
                  }
                },
                cpu: {
                  type: 'object',
                  properties: {
                    usage: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async getDetailedHealth(): Promise<HealthStatus> {
    return this.healthService.getStatus();
  }
} 
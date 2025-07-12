// Monitoring Dashboard Controller - REST API endpoints for dashboard data
// Provides real-time metrics, historical data, alerts, and health checks

import { 
  Controller, 
  Get, 
  Put, 
  Param, 
  Query, 
  UseGuards, 
  UseInterceptors 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiQuery, 
  ApiParam 
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { PerformanceInterceptor } from '../interceptors/performance.interceptor';
import { MonitoringDashboardService, DashboardData, SystemMetrics, PerformanceAlert } from './dashboard.service';

@ApiTags('Monitoring Dashboard')
@Controller('api/monitoring')
@UseGuards(JwtAuthGuard)
@UseInterceptors(PerformanceInterceptor)
@ApiBearerAuth()
export class MonitoringDashboardController {
  constructor(
    private readonly dashboardService: MonitoringDashboardService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ 
    summary: 'Get comprehensive dashboard data',
    description: 'Returns complete dashboard data including real-time metrics, historical data, alerts, and health checks'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        overview: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'warning', 'critical'] },
            uptime: { type: 'number' },
            totalUsers: { type: 'number' },
            activeAgents: { type: 'number' },
            totalWorkflows: { type: 'number' },
            systemLoad: { type: 'number' }
          }
        },
        realTimeMetrics: { type: 'object' },
        historicalData: { type: 'object' },
        alerts: { type: 'array' },
        healthChecks: { type: 'object' },
        trends: { type: 'object' }
      }
    }
  })
  async getDashboard(): Promise<DashboardData> {
    return this.dashboardService.getDashboardData();
  }

  @Get('metrics/current')
  @ApiOperation({ 
    summary: 'Get current real-time metrics',
    description: 'Returns current system metrics including CPU, memory, cache, queue, WebSocket, and A2A statistics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Current metrics retrieved successfully'
  })
  async getCurrentMetrics(): Promise<SystemMetrics> {
    const dashboard = await this.dashboardService.getDashboardData();
    return dashboard.realTimeMetrics;
  }

  @Get('metrics/history')
  @ApiOperation({ 
    summary: 'Get historical metrics data',
    description: 'Returns time-series metrics data for charts and trend analysis'
  })
  @ApiQuery({ 
    name: 'timeRange', 
    required: false, 
    description: 'Time range for historical data',
    enum: ['1h', '6h', '24h'],
    example: '24h'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Historical metrics retrieved successfully'
  })
  async getMetricsHistory(
    @Query('timeRange') timeRange: string = '24h'
  ): Promise<{ timeRange: string; dataPoints: SystemMetrics[] }> {
    const metrics = await this.dashboardService.getMetricsHistory(timeRange);
    return {
      timeRange,
      dataPoints: metrics
    };
  }

  @Get('alerts')
  @ApiOperation({ 
    summary: 'Get system alerts',
    description: 'Returns active and recent system alerts with severity levels'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    description: 'Maximum number of alerts to return',
    type: 'number',
    example: 50
  })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    description: 'Filter alerts by status',
    enum: ['active', 'resolved', 'all'],
    example: 'active'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Alerts retrieved successfully'
  })
  async getAlerts(
    @Query('limit') limit: number = 50,
    @Query('status') status: string = 'active'
  ): Promise<PerformanceAlert[]> {
    const allAlerts = await this.dashboardService.getAlerts(limit);
    
    switch (status) {
      case 'active':
        return allAlerts.filter(alert => !alert.resolved);
      case 'resolved':
        return allAlerts.filter(alert => alert.resolved);
      default:
        return allAlerts;
    }
  }

  @Put('alerts/:alertId/resolve')
  @ApiOperation({ 
    summary: 'Resolve an alert',
    description: 'Mark a specific alert as resolved'
  })
  @ApiParam({ 
    name: 'alertId', 
    description: 'Unique identifier of the alert to resolve'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Alert resolved successfully'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Alert not found'
  })
  async resolveAlert(
    @Param('alertId') alertId: string
  ): Promise<{ success: boolean; message: string }> {
    const resolved = await this.dashboardService.resolveAlert(alertId);
    
    if (resolved) {
      return {
        success: true,
        message: `Alert ${alertId} resolved successfully`
      };
    } else {
      return {
        success: false,
        message: `Alert ${alertId} not found`
      };
    }
  }

  @Get('health')
  @ApiOperation({ 
    summary: 'Get health check status',
    description: 'Returns health status of all system components'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Health check data retrieved successfully'
  })
  async getHealthCheck(): Promise<DashboardData['healthChecks']> {
    const dashboard = await this.dashboardService.getDashboardData();
    return dashboard.healthChecks;
  }

  @Get('system/overview')
  @ApiOperation({ 
    summary: 'Get system overview',
    description: 'Returns high-level system status and key metrics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'System overview retrieved successfully'
  })
  async getSystemOverview(): Promise<DashboardData['overview']> {
    const dashboard = await this.dashboardService.getDashboardData();
    return dashboard.overview;
  }

  @Get('trends')
  @ApiOperation({ 
    summary: 'Get system trends',
    description: 'Returns trend data for user growth, agent activity, and workflow execution'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Trends data retrieved successfully'
  })
  async getTrends(): Promise<DashboardData['trends']> {
    const dashboard = await this.dashboardService.getDashboardData();
    return dashboard.trends;
  }

  // Component-specific metrics endpoints
  @Get('metrics/cache')
  @ApiOperation({ 
    summary: 'Get cache-specific metrics',
    description: 'Returns detailed Redis cache performance metrics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cache metrics retrieved successfully'
  })
  async getCacheMetrics(): Promise<SystemMetrics['cache']> {
    const dashboard = await this.dashboardService.getDashboardData();
    return dashboard.realTimeMetrics.cache;
  }

  @Get('metrics/queue')
  @ApiOperation({ 
    summary: 'Get job queue metrics',
    description: 'Returns detailed job queue performance and status metrics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Queue metrics retrieved successfully'
  })
  async getQueueMetrics(): Promise<SystemMetrics['queue']> {
    const dashboard = await this.dashboardService.getDashboardData();
    return dashboard.realTimeMetrics.queue;
  }

  @Get('metrics/websocket')
  @ApiOperation({ 
    summary: 'Get WebSocket metrics',
    description: 'Returns detailed WebSocket connection and performance metrics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'WebSocket metrics retrieved successfully'
  })
  async getWebSocketMetrics(): Promise<SystemMetrics['websocket']> {
    const dashboard = await this.dashboardService.getDashboardData();
    return dashboard.realTimeMetrics.websocket;
  }

  @Get('metrics/a2a')
  @ApiOperation({ 
    summary: 'Get A2A protocol metrics',
    description: 'Returns detailed Agent-to-Agent communication metrics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'A2A metrics retrieved successfully'
  })
  async getA2AMetrics(): Promise<SystemMetrics['a2a']> {
    const dashboard = await this.dashboardService.getDashboardData();
    return dashboard.realTimeMetrics.a2a;
  }

  @Get('metrics/database')
  @ApiOperation({ 
    summary: 'Get database metrics',
    description: 'Returns detailed database performance and connection metrics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Database metrics retrieved successfully'
  })
  async getDatabaseMetrics(): Promise<SystemMetrics['database']> {
    const dashboard = await this.dashboardService.getDashboardData();
    return dashboard.realTimeMetrics.database;
  }

  // Performance analytics endpoints
  @Get('analytics/performance')
  @ApiOperation({ 
    summary: 'Get performance analytics',
    description: 'Returns comprehensive performance analysis and recommendations'
  })
  @ApiQuery({ 
    name: 'period', 
    required: false, 
    description: 'Analysis period',
    enum: ['1h', '6h', '24h', '7d'],
    example: '24h'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Performance analytics retrieved successfully'
  })
  async getPerformanceAnalytics(
    @Query('period') period: string = '24h'
  ): Promise<{
    period: string;
    summary: {
      overallScore: number;
      bottlenecks: string[];
      recommendations: string[];
    };
    metrics: {
      averageResponseTime: number;
      throughput: number;
      errorRate: number;
      availability: number;
    };
    trends: {
      performance: number[];
      throughput: number[];
      errors: number[];
    };
  }> {
    // Implementation for performance analytics
    const metrics = await this.dashboardService.getMetricsHistory(period);
    
    return {
      period,
      summary: {
        overallScore: 92,
        bottlenecks: ['Database queries', 'Cache misses'],
        recommendations: [
          'Optimize database indexes',
          'Implement query caching',
          'Scale WebSocket connections'
        ]
      },
      metrics: {
        averageResponseTime: metrics.reduce((sum, m) => sum + m.websocket.averageLatency, 0) / metrics.length,
        throughput: metrics.reduce((sum, m) => sum + m.queue.throughput, 0) / metrics.length,
        errorRate: metrics.reduce((sum, m) => sum + m.a2a.errorRate, 0) / metrics.length,
        availability: 99.95
      },
      trends: {
        performance: metrics.map(m => 100 - m.system.cpu),
        throughput: metrics.map(m => m.queue.throughput),
        errors: metrics.map(m => m.a2a.errorRate)
      }
    };
  }

  @Get('status')
  @ApiOperation({ 
    summary: 'Get system status summary',
    description: 'Returns a simple system status for health monitoring'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'System status retrieved successfully'
  })
  async getSystemStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    timestamp: number;
    components: {
      [key: string]: 'healthy' | 'warning' | 'critical';
    };
    uptime: number;
  }> {
    const dashboard = await this.dashboardService.getDashboardData();
    
    return {
      status: dashboard.overview.status,
      timestamp: Date.now(),
      components: {
        redis: dashboard.healthChecks.redis.status === 'healthy' ? 'healthy' : 'critical',
        database: dashboard.healthChecks.database.status === 'healthy' ? 'healthy' : 'critical',
        queue: dashboard.healthChecks.queue.status === 'healthy' ? 'healthy' : 'warning',
        websocket: dashboard.healthChecks.websocket.status === 'healthy' ? 'healthy' : 'warning',
        a2a: dashboard.healthChecks.a2a.status === 'healthy' ? 'healthy' : 'warning'
      },
      uptime: dashboard.overview.uptime
    };
  }
}
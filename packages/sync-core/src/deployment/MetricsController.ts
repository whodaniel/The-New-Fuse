/**
 * Metrics Controller
 * Metrics endpoints that integrate with existing monitoring infrastructure
 */

import { Controller, Get, Query, Logger, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { SyncMetricsService } from './SyncMetricsService';

@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  private readonly logger = new Logger(MetricsController.name);

  constructor(private readonly metricsService: SyncMetricsService) {}

  @Get()
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  @ApiResponse({ status: 200, description: 'Prometheus formatted metrics' })
  async getPrometheusMetrics(@Res() res: Response) {
    try {
      const metrics = await this.metricsService.getPrometheusMetrics();
      res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.send(metrics);
    } catch (error) {
      this.logger.error('Failed to get Prometheus metrics', error);
      res.status(500).send('# Failed to get metrics\n');
    }
  }

  @Get('json')
  @ApiOperation({ summary: 'JSON metrics endpoint' })
  @ApiResponse({ status: 200, description: 'JSON formatted metrics' })
  async getJsonMetrics() {
    try {
      const metrics = await this.metricsService.getJsonMetrics();
      return {
        metrics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get JSON metrics', error);
      throw error;
    }
  }

  @Get('current')
  @ApiOperation({ summary: 'Current metrics snapshot' })
  @ApiResponse({ status: 200, description: 'Current metrics' })
  async getCurrentMetrics() {
    try {
      const metrics = this.metricsService.getCurrentMetrics();
      return {
        metrics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get current metrics', error);
      throw error;
    }
  }

  @Get('history')
  @ApiOperation({ summary: 'Metrics history' })
  @ApiQuery({ name: 'hours', required: false, description: 'Hours of history to retrieve' })
  @ApiResponse({ status: 200, description: 'Metrics history' })
  async getMetricsHistory(@Query('hours') hours?: string) {
    try {
      const hoursNum = hours ? parseInt(hours, 10) : 1;
      const history = this.metricsService.getMetricsHistory(hoursNum);
      
      return {
        history,
        count: history.length,
        hours: hoursNum,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get metrics history', error);
      throw error;
    }
  }

  @Get('specific/:metricName')
  @ApiOperation({ summary: 'Get specific metric' })
  @ApiResponse({ status: 200, description: 'Specific metric value' })
  async getSpecificMetric(@Query('metricName') metricName: string) {
    try {
      const value = this.metricsService.getMetric(metricName);
      
      return {
        metric: metricName,
        value,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to get metric ${metricName}`, error);
      throw error;
    }
  }

  @Get('operations')
  @ApiOperation({ summary: 'Operation metrics' })
  @ApiResponse({ status: 200, description: 'Operation-specific metrics' })
  async getOperationMetrics() {
    try {
      const metrics = this.metricsService.getCurrentMetrics();
      
      return {
        operations: metrics.operations,
        queue: metrics.queue,
        conflicts: metrics.conflicts,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get operation metrics', error);
      throw error;
    }
  }

  @Get('performance')
  @ApiOperation({ summary: 'Performance metrics' })
  @ApiResponse({ status: 200, description: 'Performance-specific metrics' })
  async getPerformanceMetrics() {
    try {
      const metrics = this.metricsService.getCurrentMetrics();
      
      return {
        performance: metrics.performance,
        database: metrics.database,
        redis: metrics.redis,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get performance metrics', error);
      throw error;
    }
  }

  @Get('system')
  @ApiOperation({ summary: 'System metrics' })
  @ApiResponse({ status: 200, description: 'System-specific metrics' })
  async getSystemMetrics() {
    try {
      const metrics = this.metricsService.getCurrentMetrics();
      
      return {
        masterClock: metrics.masterClock,
        fileWatcher: metrics.fileWatcher,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get system metrics', error);
      throw error;
    }
  }
}
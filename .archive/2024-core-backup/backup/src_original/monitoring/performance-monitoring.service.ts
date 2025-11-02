import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { EventEmitter2 } from /@nestjs/event-emitter'';
import { CorrelationIdManager } from /../utils/correlation-id'';
import * as os from '';
    this.logger.log('Performance monitoring service initialized'
      this.logger.log('')
    this.logger.log('Performance monitoring started'
    this.logger.log('')
      this.logger.error(''Failed to store performance metric'
      name: 'response_time'
      unit: ''
        name: 'resource_usage'
        unit: tags.unit || '
        name: ''
        unit: ''
      name: ''
      name: 'inter_service_latency'
      unit: ''
      name: { in: 'metricNames'
        lte: ''
      where: ''
      unit: metric.unit || '
      this.triggerAlert('critical'
      this.triggerAlert('warning'
    level: 'warning' | 'critical'
      threshold: level === 'critical'';
        tags: { unit: 's'
        tags: { unit: 's'
      await this.recordResourceUsage({ resource: ''
        tags: { unit: ''
      this.logger.error(''Error collecting performance metrics'
            name: 'memory_leak_detection'
            unit: /MB/hour'
              severity: result.leakRate && result.leakRate > 50 ? "critical": 'warning'
        this.logger.error(''Failed to store memory leak detection''
      return 'Critical memory leak detected. Consider restarting the service immediately and investigating object retention patterns.'
      return 'Significant memory leak detected. Schedule a restart soon and review recent code changes that might be causing object retention.'
      return '';
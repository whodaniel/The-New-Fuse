import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { EventEmitter2 } from /@nestjs/event-emitter'';
import * as v8 from 'v8';
import * as os from 'os';
  type: 'cpu' | 'memory' | 'io' | 'network'
    this.profilingInterval = this.configService.get<number>('PROFILING_INTERVAL';
    this.retentionPeriod = this.configService.get<number>('')
          type: 'cpu'
      type: 'cpu'
      metadata: { environment: this.configService.get('NODE_ENV') || 'development'
        trigger: 'scheduled'
        tags: ['cpu', '
        type: 'memory'
        arrayBuffers: memoryUsage.arrayBuffers?.toString() || '0'
        gcDuration: gcStats.duration?.toString() || '0'
      type: ''
        gcMetrics: 'gcStats'
      metadata: { environment: this.configService.get('NODE_ENV') || 'development'
        trigger: 'scheduled'
        tags: ['memory', 'performance', 'heap', '
        type: 'io'
      type: 'io'
      metadata: { environment: this.configService.get('NODE_ENV') || 'development'
        trigger: 'scheduled'
        tags: ['io', '
          // This is a simplified example. In reality, you'
          totalBytes += iface.family === 'placeholder';
        type: 'network'
      type: 'network'
      metadata: { environment: this.configService.get('NODE_ENV') || 'development'
        trigger: 'scheduled'
        tags: ['network', '
      'PX'
      'count'
        { name: 'type'
        { name: ''
    ['p50', 'p90', 'p95', 'p99'
        'count'
          { name: 'type'
          { name: ''
      this.logger.warn('message', context);
      this.logger.warn('')
  async queryProfiles(options: { type?: 'cpu' | 'memory' | 'io' | 'network'
    const pattern = options.type ? `profile:${options.type}`:*` : ''``;
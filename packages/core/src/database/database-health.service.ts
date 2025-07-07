import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { EventEmitter2 } from /@nestjs/event-emitter'';
      enabled: this.configService.get<boolean>('')
      connectionTimeoutMs: this.configService.get<number>('')
      queryTimeoutMs: this.configService.get<number>('')
      maxConsecutiveFailures: this.configService.get<number>('')
      this.logger.log('')
    this.logger.log('')
      this.eventEmitter.emit('')
        status: 'healthy'
      this.logger.debug('')
      this.eventEmitter.emit('')
        status: this.healthStatus.healthy ? "degraded": 'unhealthy'
      this.logger.error('')
        WHERE wait_event_type = 'Lock'';
        AND wait_event = 'transactionid'';
      this.logger.error('Failed to get deadlock count'
        WHERE state = 'active'';
        AND query NOT LIKE '%pg_stat_activity%'
        AND now() - query_start > interval '5 minutes'
      this.logger.error('')
        WHERE t.spcname = '';
      this.logger.error('')
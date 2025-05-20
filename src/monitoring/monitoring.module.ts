import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UnifiedMonitoringService } from './UnifiedMonitoringService.js';
import { ConsolidatedMonitoringService } from './ConsolidatedMonitoringService.js';
import { AgentMonitoringService } from './AgentMonitoringService.js';
import { LangfuseService } from './LangfuseService.js';
import { RedisModule } from '../redis/redis.module.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    RedisModule,
    ConfigModule.forRoot()
  ],
  providers: [
    UnifiedMonitoringService,
    ConsolidatedMonitoringService,
    AgentMonitoringService,
    LangfuseService
  ],
  exports: [
    UnifiedMonitoringService,
    ConsolidatedMonitoringService,
    AgentMonitoringService,
    LangfuseService
  ]
})
export class MonitoringModule {}
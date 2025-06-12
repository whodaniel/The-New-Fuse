import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UnifiedMonitoringService } from './UnifiedMonitoringService.tsx';
import { ConsolidatedMonitoringService } from './ConsolidatedMonitoringService.tsx';
import { AgentMonitoringService } from './AgentMonitoringService.tsx';
import { LangfuseService } from './LangfuseService.tsx';
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
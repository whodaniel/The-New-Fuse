import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
// import { MonitoringModule } from '@the-new-fuse/core/monitoring/monitoring.module';
// import { RedisModule } from '@the-new-fuse/core/redis/redis.module';
import { MonitoringService } from './services/MonitoringService';
import { PrometheusService } from './services/PrometheusService';
import { AlertService } from './services/AlertService';
import { InterAgentChatService } from './services/InterAgentChatService';
// import { AgentMonitoringService } from '@the-new-fuse/core/monitoring/AgentMonitoringService';
// import { RedisService as CoreRedisService } from '@the-new-fuse/core/redis/redis.service.ts';
import { RedisService } from '../services/redis.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    EventEmitterModule.forRoot(),
    // MonitoringModule,
    // RedisModule
  ],
  providers: [
    // {
    //   provide: MonitoringService,
    //   useExisting: AgentMonitoringService
    // },
    // {
    //   provide: RedisService,
    //   useExisting: CoreRedisService
    // },
    MonitoringService,
    PrometheusService,
    AlertService,
    InterAgentChatService,
    RedisService,
  ],
  exports: [
    MonitoringService,
    AlertService,
    InterAgentChatService,
  ],
})
export class AgentModule {}

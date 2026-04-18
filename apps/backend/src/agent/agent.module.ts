import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MonitoringService } from './services/MonitoringService.js';
import { PrometheusService } from './services/PrometheusService.js';
import { AlertService } from './services/AlertService.js';
import { InterAgentChatService } from './services/InterAgentChatService.js';
import { RedisService } from '../services/redis.service.js';

@Module({
  imports: [
    ConfigModule.forRoot(),
    EventEmitterModule.forRoot(),
  ],
  providers: [
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

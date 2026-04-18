import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MonitoringService } from './services/MonitoringService';
import { PrometheusService } from './services/PrometheusService';
import { AlertService } from './services/AlertService';
import { InterAgentChatService } from './services/InterAgentChatService';
import { RedisService } from '../services/redis.service';

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

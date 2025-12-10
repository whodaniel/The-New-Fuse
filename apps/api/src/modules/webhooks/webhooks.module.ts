import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiInsight } from './entities/ai-insight.entity';
import { BusinessAnalytics } from './entities/business-analytics.entity';
import { BusinessEvent } from './entities/business-event.entity';
import { SseSubscription } from './entities/sse-subscription.entity';
import { WebhookConfiguration } from './entities/webhook-configuration.entity';
import { WebhookDeliveryLog } from './entities/webhook-delivery-log.entity';
import { BusinessEventService } from './services/business-event.service';
import { IntegrationService } from './services/integration.service';
import { SSEService } from './services/sse.service';
import { WebhookSecurityService } from './services/webhook-security.service';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [
    JwtModule,
    TypeOrmModule.forFeature([
      BusinessEvent,
      WebhookConfiguration,
      SseSubscription,
      WebhookDeliveryLog,
      BusinessAnalytics,
      AiInsight,
    ]),
  ],
  controllers: [WebhooksController],
  providers: [
    WebhooksService,
    BusinessEventService,
    WebhookSecurityService,
    SSEService,
    IntegrationService,
  ],
  exports: [WebhooksService, BusinessEventService, SSEService, IntegrationService],
})
export class WebhooksModule {}

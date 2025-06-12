import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { BusinessEventService } from './services/business-event.service';
import { WebhookSecurityService } from './services/webhook-security.service';
import { SSEService } from './services/sse.service';
import { IntegrationService } from './services/integration.service';
import { BusinessEvent } from './entities/business-event.entity';
import { WebhookConfiguration } from './entities/webhook-configuration.entity';
import { SseSubscription } from './entities/sse-subscription.entity';
import { WebhookDeliveryLog } from './entities/webhook-delivery-log.entity';
import { BusinessAnalytics } from './entities/business-analytics.entity';
import { AiInsight } from './entities/ai-insight.entity';

@Module({
  imports: [
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
  exports: [
    WebhooksService,
    BusinessEventService,
    SSEService,
    IntegrationService,
  ],
})
export class WebhooksModule {}
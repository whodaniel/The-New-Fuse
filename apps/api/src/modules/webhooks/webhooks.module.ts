/**
 * Webhooks Module - Migrated to Drizzle ORM
 * Provides webhook management and business event processing
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '@the-new-fuse/database';
import { BusinessEventService } from './services/business-event.service';
import { IntegrationService } from './services/integration.service';
import { SSEService } from './services/sse.service';
import { WebhookSecurityService } from './services/webhook-security.service';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [
    JwtModule,
    DatabaseModule, // Provides DatabaseService with Drizzle repositories
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

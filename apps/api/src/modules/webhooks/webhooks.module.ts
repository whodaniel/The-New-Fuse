/**
 * Webhooks Module - Migrated to Drizzle ORM
 * Provides webhook management and business event processing
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
// @ts-ignore
// @ts-ignore
import { DatabaseModule } from '@the-new-fuse/database';
import { BusinessEventService } from './services/business-event.service.js';
import { IntegrationService } from './services/integration.service.js';
import { SSEService } from './services/sse.service.js';
import { WebhookSecurityService } from './services/webhook-security.service.js';
import { WebhooksController } from './webhooks.controller.js';
import { WebhooksService } from './webhooks.service.js';

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

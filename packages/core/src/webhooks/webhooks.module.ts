import { Module } from '@nestjs/common';
import { WebhookManager } from './webhook-manager.service.js';
import { WebhooksController } from './webhooks.controller.js';
import { IntegrationModule } from '../integration/integration.module.js';
import { WorkflowModule } from '../workflow/workflow.module.js';

@Module({
  imports: [
    IntegrationModule,
    WorkflowModule
  ],
  controllers: [WebhooksController],
  providers: [WebhookManager],
  exports: [WebhookManager]
})
export class WebhooksModule {}
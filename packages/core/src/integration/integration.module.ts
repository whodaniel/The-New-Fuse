/**
 * Integration module for The New Fuse
 * Configures and provides access to all external API integrations
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { IntegrationRegistryService } from './services/integration-registry.service.js';
import { IntegrationsController } from './controllers/integrations.controller.js';
import { SalesforceService } from './services/salesforce.service.js';
import { LoggingModule } from '../logging/logging.module.js';
import { MetricsModule } from '../metrics/metrics.module.js';
import { UserModule } from '../user/user.module.js';
import { WebhooksModule } from '../webhooks/webhooks.module.js';
import { WorkflowsModule } from '../workflows/workflows.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { SecurityModule } from '../security/security.module.js';
import securityConfig from '../config/security.config.js';

@Module({
  imports: [
    ConfigModule.forFeature(securityConfig),
    HttpModule,
    LoggingModule,
    MetricsModule,
    DatabaseModule,
    WebhooksModule,
    UserModule,
    WorkflowsModule,
    SecurityModule
  ],
  controllers: [IntegrationsController],
  providers: [
    IntegrationRegistryService,
    SalesforceService
  ],
  exports: [
    IntegrationRegistryService,
    SalesforceService
  ]
})
export class IntegrationModule {
  constructor(private readonly integrationRegistry: IntegrationRegistryService) {
    // Initialize the integration registry
    this.integrationRegistry.initialize();
  }
}
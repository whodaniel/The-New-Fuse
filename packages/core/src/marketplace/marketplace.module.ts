/**
 * Integration Marketplace module for The New Fuse
 * Provides functionality for discovering, purchasing, and managing integrations and services
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module.js';
import { PaymentModule } from '../payment/payment.module.js';
import { UserModule } from '../user/user.module.js';
import { IntegrationModule } from '../integration/integration.module.js';
import { MarketplaceController } from './controllers/marketplace.controller.js';
import { MarketplaceService } from './services/marketplace.service.js';
import { MarketplaceItemRepository } from './repositories/marketplace-item.repository.js';
import { UserSubscriptionRepository } from './repositories/user-subscription.repository.js';
import { TransactionModule } from '../transaction/transaction.module.js';
import { LoggingModule } from '../logging/logging.module.js';
import { MetricsModule } from '../metrics/metrics.module.js';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    PaymentModule,
    UserModule,
    IntegrationModule,
    TransactionModule,
    LoggingModule,
    MetricsModule
  ],
  controllers: [MarketplaceController],
  providers: [
    MarketplaceService,
    MarketplaceItemRepository,
    UserSubscriptionRepository
  ],
  exports: [MarketplaceService]
})
export class MarketplaceModule {}
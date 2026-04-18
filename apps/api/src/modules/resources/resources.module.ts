import { Module } from '@nestjs/common';
import { MarketplaceModule } from '../marketplace/marketplace.module.js';
import { ResourceInteractionService } from './resource-interaction.service.js';
import { ResourceSearchPolicyService } from './resource-search-policy.service.js';
import { ResourceSearchProtocolService } from './resource-search-protocol.service.js';
import { ResourcesController } from './resources.controller.js';

@Module({
  imports: [MarketplaceModule],
  controllers: [ResourcesController],
  providers: [
    ResourceSearchPolicyService,
    ResourceSearchProtocolService,
    ResourceInteractionService,
  ],
})
export class ResourcesModule {}

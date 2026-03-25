import { Module } from '@nestjs/common';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { PersonalSkillsService } from './personal-skills.service';
import { ResourceRegistryApiKeyGuard } from './resource-registry-api-key.guard';
import { ResourceInteractionService } from './resource-interaction.service';
import { ResourceSearchPolicyService } from './resource-search-policy.service';
import { ResourceSearchProtocolService } from './resource-search-protocol.service';
import { ResourcesController } from './resources.controller';

@Module({
  imports: [MarketplaceModule],
  controllers: [ResourcesController],
  providers: [
    ResourceSearchPolicyService,
    ResourceSearchProtocolService,
    ResourceInteractionService,
    PersonalSkillsService,
    ResourceRegistryApiKeyGuard,
  ],
})
export class ResourcesModule {}

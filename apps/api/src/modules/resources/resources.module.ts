import { Module } from '@nestjs/common';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { ResourceInteractionService } from './resource-interaction.service';
import { PersonalSkillsService } from './personal-skills.service';
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
  ],
})
export class ResourcesModule {}

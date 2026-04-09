import { Module } from '@nestjs/common';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { ResourcesController } from './resources.controller';

@Module({
  imports: [MarketplaceModule],
  controllers: [ResourcesController],
})
export class ResourcesModule {}

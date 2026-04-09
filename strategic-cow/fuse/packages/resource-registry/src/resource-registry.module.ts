import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResourceRegistryService } from './services/resource-registry.service';
import { ResourceAccessControlService } from './services/resource-access-control.service';
import { ResourceRegistryController } from './controllers/resource-registry.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [ResourceRegistryController],
  providers: [
    ResourceRegistryService,
    ResourceAccessControlService,
  ],
  exports: [
    ResourceRegistryService,
    ResourceAccessControlService,
  ],
})
export class ResourceRegistryModule {}

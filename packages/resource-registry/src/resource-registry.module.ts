import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResourceRegistryController } from './controllers/resource-registry.controller';
import { ResourceAccessControlService } from './services/resource-access-control.service';
import { ResourceRegistryService } from './services/resource-registry.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [ResourceRegistryController],
  providers: [ResourceRegistryService, ResourceAccessControlService],
  exports: [ResourceRegistryService, ResourceAccessControlService],
})
export class ResourceRegistryModule {}

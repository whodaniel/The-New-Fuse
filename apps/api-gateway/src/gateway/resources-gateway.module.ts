import { Module } from '@nestjs/common';
import { ProxyModule } from '../proxy/proxy.module';
import { ResourcesGatewayController } from './resources-gateway.controller';

@Module({
  imports: [ProxyModule],
  controllers: [ResourcesGatewayController],
})
export class ResourcesGatewayModule {}

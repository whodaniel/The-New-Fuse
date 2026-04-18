import { Module } from '@nestjs/common';
import { ProxyModule } from '../proxy/proxy.module.js';
import { NexusObservabilityGatewayController } from './nexus-observability-gateway.controller.js';

@Module({
  imports: [ProxyModule],
  controllers: [NexusObservabilityGatewayController],
})
export class NexusObservabilityGatewayModule {}

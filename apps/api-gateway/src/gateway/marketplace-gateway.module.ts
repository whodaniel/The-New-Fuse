import { Module } from '@nestjs/common';
import { ProxyModule } from '../proxy/proxy.module.js';
import { MarketplaceGatewayController } from './marketplace-gateway.controller.js';

@Module({
  imports: [ProxyModule],
  controllers: [MarketplaceGatewayController],
})
export class MarketplaceGatewayModule {}

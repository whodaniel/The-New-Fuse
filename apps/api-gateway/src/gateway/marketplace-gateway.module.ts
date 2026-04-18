import { Module } from '@nestjs/common';
import { ProxyModule } from '../proxy/proxy.module';
import { MarketplaceGatewayController } from './marketplace-gateway.controller';

@Module({
  imports: [ProxyModule],
  controllers: [MarketplaceGatewayController],
})
export class MarketplaceGatewayModule {}

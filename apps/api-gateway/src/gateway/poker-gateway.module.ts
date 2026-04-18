import { Module } from '@nestjs/common';
import { ProxyModule } from '../proxy/proxy.module.js';
import { PokerGatewayController } from './poker-gateway.controller.js';

@Module({
  imports: [ProxyModule],
  controllers: [PokerGatewayController],
})
export class PokerGatewayModule {}

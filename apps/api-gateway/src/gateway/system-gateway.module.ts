import { Module } from '@nestjs/common';
import { ProxyModule } from '../proxy/proxy.module.js';
import { SystemGatewayController } from './system-gateway.controller.js';

@Module({
  imports: [ProxyModule],
  controllers: [SystemGatewayController],
})
export class SystemGatewayModule {}

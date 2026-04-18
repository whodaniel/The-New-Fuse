import { Module } from '@nestjs/common';
import { ProxyModule } from '../proxy/proxy.module.js';
import { TerminalsGatewayController } from './terminals-gateway.controller.js';

@Module({
  imports: [ProxyModule],
  controllers: [TerminalsGatewayController],
})
export class TerminalsGatewayModule {}

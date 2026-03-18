import { Module } from '@nestjs/common';
import { ProxyModule } from '../proxy/proxy.module';
import { TerminalsGatewayController } from './terminals-gateway.controller';

@Module({
  imports: [ProxyModule],
  controllers: [TerminalsGatewayController],
})
export class TerminalsGatewayModule {}

import { Module } from '@nestjs/common';
import { ProxyModule } from '../proxy/proxy.module';
import { SystemGatewayController } from './system-gateway.controller';

@Module({
  imports: [ProxyModule],
  controllers: [SystemGatewayController],
})
export class SystemGatewayModule {}

import { Module } from '@nestjs/common';
import { ProxyModule } from '../proxy/proxy.module';
import { LocalRuntimeGatewayController } from './local-runtime-gateway.controller';

@Module({
  imports: [ProxyModule],
  controllers: [LocalRuntimeGatewayController],
})
export class LocalRuntimeGatewayModule {}

import { Module } from '@nestjs/common';
import { ProxyModule } from '../proxy/proxy.module';
import { TimelineGatewayController } from './timeline-gateway.controller';

@Module({
  imports: [ProxyModule],
  controllers: [TimelineGatewayController],
})
export class TimelineGatewayModule {}

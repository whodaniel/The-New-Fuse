import { Module } from '@nestjs/common';
import { ProxyModule } from '../proxy/proxy.module.js';
import { TimelineGatewayController } from './timeline-gateway.controller.js';

@Module({
  imports: [ProxyModule],
  controllers: [TimelineGatewayController],
})
export class TimelineGatewayModule {}

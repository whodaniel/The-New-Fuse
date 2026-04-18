import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ProxyModule } from '../proxy/proxy.module.js';
import { AnalyticsGatewayController } from './analytics-gateway.controller.js';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    ProxyModule,
  ],
  controllers: [AnalyticsGatewayController],
})
export class AnalyticsGatewayModule {}

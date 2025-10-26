/**
 * IDE Gateway Module
 * Provides routing and proxy for Theia IDE
 */

import { Module } from '@nestjs/common';
import { IdeGatewayController } from './ide-gateway.controller';
import { ProxyService } from '../proxy/proxy.service';

@Module({
  controllers: [IdeGatewayController],
  providers: [ProxyService],
})
export class IdeGatewayModule {}

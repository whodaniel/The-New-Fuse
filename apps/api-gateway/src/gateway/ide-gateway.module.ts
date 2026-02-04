/**
 * IDE Gateway Module
 * Provides routing and proxy for Theia IDE
 */

import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ProxyService } from '../proxy/proxy.service';
import { IdeGatewayController } from './ide-gateway.controller';

@Module({
  imports: [HttpModule],
  controllers: [IdeGatewayController],
  providers: [ProxyService],
})
export class IdeGatewayModule {}

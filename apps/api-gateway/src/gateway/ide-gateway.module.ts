/**
 * IDE Gateway Module
 * Provides routing and proxy for Theia IDE
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IdeGatewayController } from './ide-gateway.controller.js';
import { ProxyService } from '../proxy/proxy.service.js';

@Module({
  imports: [HttpModule],
  controllers: [IdeGatewayController],
  providers: [ProxyService],
})
export class IdeGatewayModule {}

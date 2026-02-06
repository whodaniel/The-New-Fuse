/**
 * Relay Module - NestJS Integration for The New Fuse Relay Core
 *
 * This module provides:
 * - RelayService: Manages the relay server lifecycle
 * - RelayGateway: WebSocket gateway for real-time agent communication
 * - RelayController: REST API endpoints for relay management
 */

import { Global, Module } from '@nestjs/common';
import { RelayController } from './relay.controller';
import { RelayGateway } from './relay.gateway';
import { RelayService } from './relay.service';

@Global()
@Module({
  providers: [RelayService, RelayGateway],
  controllers: [RelayController],
  exports: [RelayService],
})
export class RelayModule {}

/**
 * Browser Streaming Module
 */

import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BrowserStreamingController } from './browser-streaming.controller';
import { BrowserStreamingGateway } from './browser-streaming.gateway';
import { BrowserStreamingService } from './browser-streaming.service';

@Module({
  imports: [EventEmitterModule],
  controllers: [BrowserStreamingController],
  providers: [BrowserStreamingService, BrowserStreamingGateway],
  exports: [BrowserStreamingService],
})
export class BrowserStreamingModule {}

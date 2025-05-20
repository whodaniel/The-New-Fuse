import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CentralizedLoggingService } from './centralized-logging.service.js';
import { LogRotationService } from './log-rotation.service.js';
import { LogAggregationService } from './log-aggregation.service.js';

@Global()
@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot(),
    PrismaModule
  ],
  providers: [
    CentralizedLoggingService,
    LogRotationService,
    LogAggregationService
  ],
  exports: [
    CentralizedLoggingService,
    LogRotationService,
    LogAggregationService
  ]
})
export class LoggingModule {}

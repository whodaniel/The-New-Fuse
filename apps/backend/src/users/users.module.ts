import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoggingService } from '../services/logging.service.js';
import { EventBus } from '../events/event-bus.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    PrismaService,
    LoggingService,
    EventBus
  ],
  exports: [UsersService],
})
export class UsersModule {}

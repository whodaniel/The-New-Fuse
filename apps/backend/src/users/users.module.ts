import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { EventBus } from '../events/event-bus.service.js';
import { LoggingService } from '../services/logging.service.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService, LoggingService, EventBus],
  exports: [UsersService],
})
export class UsersModule {}

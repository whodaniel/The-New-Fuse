import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EventBus } from '../events/event-bus.service';
import { LoggingService } from '../services/logging.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService, LoggingService, EventBus],
  exports: [UsersService],
})
export class UsersModule {}

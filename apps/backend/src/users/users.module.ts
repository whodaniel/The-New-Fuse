import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoggingService } from '../services/logging.service';
import { EventBus } from '../events/event-bus.service';
import { AuthModule } from '../auth/auth.module';

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

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { RolesGuard } from './guards/roles.guard';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { AgentJwtStrategy } from './agent-jwt.strategy';
import { UsersService } from '../users/users.service';
import { LoggingService } from '../services/logging.service';
import { EventBus } from '../events/event-bus.service';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [
    AuthService,
    UsersService,
    LoggingService,
    EventBus,
    RolesGuard,
    FirebaseAuthGuard,
    AgentJwtStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService, RolesGuard, FirebaseAuthGuard, AgentJwtStrategy],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { RolesGuard } from './guards/roles.guard';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { AgentJwtStrategy } from './agent-jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { GitHubStrategy } from './github.strategy';
import { UsersService } from '../users/users.service';
import { LoggingService } from '../services/logging.service';
import { EventBus } from '../events/event-bus.service';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
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
    GoogleStrategy,
    GitHubStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService, RolesGuard, FirebaseAuthGuard, AgentJwtStrategy],
})
export class AuthModule {}

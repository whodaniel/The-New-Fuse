import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DrizzleModule } from '@the-new-fuse/database';
import { EventBus } from '../events/event-bus.service';
import { IdentityService } from '../services/identity.service';
import { LoggingService } from '../services/logging.service';
import { UsersService } from '../users/users.service';
import { AgentJwtStrategy } from './agent-jwt.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { GitHubStrategy } from './github.strategy';
import { GoogleStrategy } from './google.strategy';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './jwt.strategy';
import { TokenBlacklistService } from './token-blacklist.service';

@Module({
  imports: [
    DrizzleModule.forRootAsync(),
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET must be defined in environment variables');
        }
        return {
          secret,
          signOptions: { expiresIn: '7d' },
        };
      },
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
    IdentityService,
    JwtStrategy,
    TokenBlacklistService,
  ],
  controllers: [AuthController],
  exports: [AuthService, RolesGuard, FirebaseAuthGuard, AgentJwtStrategy, TokenBlacklistService],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DrizzleModule } from '@the-new-fuse/database';
import { EventBus } from '../events/event-bus.service.js';
import { IdentityService } from '../services/identity.service.js';
import { LoggingService } from '../services/logging.service.js';
import { UsersService } from '../users/users.service.js';
import { AgentJwtStrategy } from './agent-jwt.strategy.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { SupabaseAuthGuard } from './supabase-auth.guard.js';
import { GitHubStrategy } from './github.strategy.js';
import { GoogleStrategy } from './google.strategy.js';
import { RolesGuard } from './guards/roles.guard.js';
import { JwtStrategy } from './jwt.strategy.js';
import { TokenBlacklistService } from './token-blacklist.service.js';

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
    SupabaseAuthGuard,
    AgentJwtStrategy,
    GoogleStrategy,
    GitHubStrategy,
    IdentityService,
    JwtStrategy,
    TokenBlacklistService,
  ],
  controllers: [AuthController],
  exports: [AuthService, RolesGuard, SupabaseAuthGuard, AgentJwtStrategy, TokenBlacklistService],
})
export class AuthModule {}

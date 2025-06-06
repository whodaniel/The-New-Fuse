import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { ApiKeyAuthGuard } from './guards/api-key-auth.guard.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { ServiceOrUserAuthGuard } from './guards/service-or-user-auth.guard.js';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN', '60m') },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    ApiKeyAuthGuard,
    JwtAuthGuard,
    JwtStrategy,
    ServiceOrUserAuthGuard,
  ],
  exports: [
    ApiKeyAuthGuard,
    JwtAuthGuard,
    ServiceOrUserAuthGuard,
    PassportModule,
    JwtModule,
  ],
})
export class AuthModule {}

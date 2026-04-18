/**
 * Authentication Module for API Gateway
 * Native authentication for API Gateway (/v1/auth/*)
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { GatewayAuthGuard } from './gateway-auth.guard.js';
import { GatewayAuthService } from './gateway-auth.service.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET') || process.env.JWT_SECRET;
        if (!secret) {
          throw new Error('CRITICAL: JWT_SECRET must be configured');
        }
        return {
          secret,
          signOptions: { expiresIn: '15m' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [GatewayAuthService, GatewayAuthGuard],
})
export class AuthModule {}

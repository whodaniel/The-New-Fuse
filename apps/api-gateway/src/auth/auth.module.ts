/**
 * Authentication Module for API Gateway
 * Handles authentication proxying to backend services
 */

import { Module } from '@nestjs/common';
import { ProxyModule } from '../proxy/proxy.module';
import { AuthController } from './auth.controller';

@Module({
  imports: [ProxyModule],
  controllers: [AuthController],
})
export class AuthModule {}

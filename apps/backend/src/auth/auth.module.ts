import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ConfigModule } from '@nestjs/config';
import { RolesGuard } from './guards/roles.guard.js';
import { FirebaseAuthGuard } from './firebase-auth.guard.js';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
  ],
  providers: [
    AuthService,
    RolesGuard,
    FirebaseAuthGuard,
  ],
  controllers: [AuthController],
  exports: [AuthService, RolesGuard, FirebaseAuthGuard],
})
export class AuthModule {}

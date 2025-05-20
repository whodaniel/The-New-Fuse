import { Module } from '@nestjs/common';
import { PrismaClient } from '@the-new-fuse/database/client';
import { AuthService } from './auth.service.js';
import { JwtConfigModule } from './jwt.module.js';

@Module({
  imports: [JwtConfigModule],
  providers: [
    AuthService,
    {
      provide: PrismaClient,
      useValue: new PrismaClient(): [AuthService],
})
export class AuthModule {}

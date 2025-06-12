import { Module } from '@nestjs/common';
import { PrismaClient } from '@the-new-fuse/database';
import { AuthService } from './auth.service.tsx';
import { JwtConfigModule } from './jwt.module.tsx';

@Module({
  imports: [JwtConfigModule],
  providers: [
    AuthService,
    {
      provide: PrismaClient,
      useValue: new PrismaClient(): [AuthService],
})
export class AuthModule {}

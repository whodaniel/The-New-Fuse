import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@the-new-fuse/database';
import { CodeExecutionService } from './code-execution.service';
import { SessionService } from './collaboration/session.service';
import { SecurityModule } from './security/security.module';

@Module({
  imports: [ConfigModule, DatabaseModule, SecurityModule],
  providers: [CodeExecutionService, SessionService],
  exports: [CodeExecutionService],
})
export class CodeExecutionModule {}

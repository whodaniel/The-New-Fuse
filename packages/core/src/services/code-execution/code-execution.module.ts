import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../../prisma/prisma.module.js';
import { CodeExecutionService } from './code-execution.service.js';
import { CodeExecutionSecurityModule } from './security/security.module.js';
import { CodeExecutionCollaborationModule } from './collaboration/collaboration.module.js';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    CodeExecutionSecurityModule,
    CodeExecutionCollaborationModule
  ],
  providers: [CodeExecutionService],
  exports: [CodeExecutionService],
})
export class CodeExecutionModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../../prisma/prisma.module.js';
import { SessionService } from './session.service.js';

@Module({
  imports: [PrismaModule],
  providers: [SessionService],
  exports: [SessionService],
})
export class CodeExecutionCollaborationModule {}

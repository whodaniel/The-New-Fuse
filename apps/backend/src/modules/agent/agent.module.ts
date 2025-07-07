import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { PrismaModule } from '../../lib/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService]
})
export class AgentModule {} 